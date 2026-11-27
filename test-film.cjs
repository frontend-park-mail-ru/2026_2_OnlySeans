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
