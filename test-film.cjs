const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, 'src', file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', compiled)(exports, (name) => {
    assert.ok(Object.hasOwn(dependencies, name), name);
    return dependencies[name];
  });
  return exports;
}

test('отзыв соблюдает серверные границы длины, включая Unicode', () => {
  const { reviewErrors } = load('services/review-validation.ts');
  assert.ok(reviewErrors({ title: 'Да', text: 'x'.repeat(50) }).title);
  assert.equal(reviewErrors({ title: '🎬🎬🎬', text: '🎬'.repeat(50) }).title, '');
  assert.equal(reviewErrors({ title: 'x'.repeat(255), text: 'x'.repeat(20000) }).text, '');
  assert.ok(reviewErrors({ title: 'x'.repeat(256), text: 'x'.repeat(20001) }).title);
  assert.ok(reviewErrors({ title: 'Фильм', text: ' '.repeat(60) }).text);
  assert.ok(reviewErrors({ title: 'Фильм', text: '🎬'.repeat(49) }).text);
});

const response = (id) => ({
  id,
  author_id: id,
  title: 'Отзыв',
  content: 'Текст',
  version: 1,
  contains_spoilers: false,
});
test('неполная страница отзывов сохраняет следующий offset и реальные данные автора', async () => {
  const api = load('api/reviews.ts', {
    './ratings.js': {},
    './http.js': {
      request: async (url, options) => {
        assert.equal(url, '/films/4/reviews');
        assert.equal(options.params.offset, 20);
        assert.equal(options.fresh, true);
        return { reviews: [response(7), response(8)], total: 25 };
      },
    },
  });
  const page = await api.getReviewsPage(4, 20, { fresh: true });
  assert.equal(page.nextOffset, 22);
  assert.equal(page.hasMore, true);
  assert.equal(page.reviews[0].author.name, 'Пользователь #7');
  assert.equal(page.reviews[0].score, null);
});

test('ограничение поиска своего отзыва не выдаёт непроверенное отсутствие', async () => {
  const api = load('api/reviews.ts', {
    './ratings.js': {},
    './http.js': {
      request: async () => ({
        reviews: Array.from({ length: 20 }, (_, i) => response(i + 1)),
        total: 1001,
      }),
    },
  });
  await assert.rejects(api.findMyReview(4, 300, {}, 49), /Не удалось проверить все отзывы/);
});

test('созданный отзыв сохраняет id ответа POST и повторно отправляется через PUT', async () => {
  const methods = [];
  const api = load('api/reviews.ts', {
    './ratings.js': {},
    './http.js': {
      request: async (url, options) => {
        methods.push(options.method);
        if (options.method === 'POST') return { id: 41 };
        assert.equal(url, '/reviews/41');
        assert.equal(options.body.version, 1);
        return { review: { ...response(41), author_id: 7, ...options.body, version: 2 } };
      },
    },
  });
  const state = { user: { id: 7, username: 'Зритель' }, myReview: null };
  let searches = 0;
  class ApiError extends Error {}
  const service = load('services/my-review.ts', {
    '../api/http.js': { ApiError, isUnavailable: () => false },
    './offline-film-edits.js': {
      pendingFilmEdit: () => undefined,
      clearFilmEdit: () => {},
      queueFilmEdit: () => assert.fail('не должно быть офлайн-повтора'),
    },
    '../core/store.js': {
      store: { get: (key) => state[key], set: (changes) => Object.assign(state, changes) },
    },
    '../api/reviews.js': {
      ...api,
      getMyScore: async () => 0,
      findMyReview: async () => {
        assert.equal(++searches, 1, 'после POST поиск по листалке не нужен');
        return null;
      },
    },
  });
  const previousNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  Object.defineProperty(global, 'navigator', { configurable: true, value: { onLine: true } });
  try {
    const values = { title: 'Отзыв', text: 'Текст'.repeat(20), spoiler: false };
    await service.saveReview(4, values);
    assert.equal(service.myReview(4).id, 41);
    assert.equal(service.myReview(4).author.name, 'Зритель');
    await service.saveReview(4, { ...values, title: 'Обновлённый отзыв' });
    assert.deepEqual(methods, ['POST', 'PUT']);
    assert.equal(service.myReview(4).version, 2);
  } finally {
    if (previousNavigator) Object.defineProperty(global, 'navigator', previousNavigator);
    else delete global.navigator;
  }
});

test('конфликт офлайн-отзыва отображается по-русски', () => {
  const { errorMessage, ServerError, REVIEW_CONFLICT_MESSAGE } = load('api/errors.ts');
  for (const message of [ServerError.REVIEW_CHANGED, REVIEW_CONFLICT_MESSAGE]) {
    const error = Object.assign(new Error(message), { status: 409 });
    assert.equal(errorMessage(error), 'Отзыв изменён в другой вкладке. Обновите страницу.');
  }
});
