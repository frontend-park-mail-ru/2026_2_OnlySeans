const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
function moduleFrom(file, deps = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/src/services/${file}.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', ...Object.keys(globals), code)(
    exports,
    (name) => deps[name],
    ...Object.values(globals),
  );
  return exports;
}
function collections() {
  const values = new Map();
  let user = { id: 1 };
  let fail = false;
  const favorites = moduleFrom('favorites');
  const service = moduleFrom(
    'collections',
    {
      '../core/store.js': { store: { get: () => user } },
      './storage.js': {
        readJson: (key, fallback) => values.get(key) ?? fallback,
        writeJson: (key, value) => {
          if (fail) return false;
          values.set(key, value);
          return true;
        },
      },
      './favorites.js': favorites,
    },
    { crypto: { randomUUID }, location: { origin: 'https://example.org' } },
  );
  return {
    service,
    values,
    account: (value) => {
      user = value;
    },
    quota: () => {
      fail = true;
    },
  };
}
test('личные подборки проверяют формы, сохраняют порядок фильмов и разделены по аккаунтам', () => {
  const e = collections();
  assert.throws(() => e.service.saveLocalCollection('', '', []), /название/);
  assert.throws(() => e.service.saveLocalCollection('Кино', '', []), /хотя бы/);
  assert.throws(() => e.service.saveLocalCollection('Кино', '', [0, -1]), /хотя бы/);
  const item = e.service.saveLocalCollection('  На вечер  ', 'Описание', [3, 1, 3]);
  assert.equal(item.title, 'На вечер');
  assert.deepEqual(item.filmIds, [3, 1]);
  const description = '🎬'.repeat(500);
  e.service.saveLocalCollection('Изменено', description, [1], item.id);
  assert.equal(e.service.readLocalCollections()[0].title, 'Изменено');
  assert.equal(e.service.readLocalCollections()[0].description, description);
  assert.throws(() => e.service.saveLocalCollection('Кино', description + '🎬', [1]), /500/);
  e.account({ id: 2 });
  assert.deepEqual(e.service.readLocalCollections(), []);
  e.account({ id: 1 });
  assert.equal(e.service.readLocalCollections().length, 1);
  e.service.deleteLocalCollection(item.id);
  assert.deepEqual(e.service.readLocalCollections(), []);
  e.account(null);
  assert.throws(() => e.service.saveLocalCollection('Кино', '', [1]), /Войдите/);
});
test('ошибка хранилища не превращается в успешное сохранение подборки', () => {
  const e = collections();
  e.quota();
  assert.throws(() => e.service.saveLocalCollection('Кино', '', [1]), /Не удалось/);
  assert.deepEqual(e.service.readLocalCollections(), []);
});
test('сохранённые подборки не дублируются, снимок передаёт только выбранные фильмы', () => {
  const e = collections();
  e.service.toggleCollection(5);
  assert.deepEqual(e.service.savedCollections(), ['5']);
  e.service.toggleCollection(5);
  assert.deepEqual(e.service.savedCollections(), []);
  const item = {
    id: 1,
    title: 'Кино <вечером>',
    description: 'Без спойлеров',
    films: [{ id: 2 }, { id: 1 }],
  };
  const url = new URL(e.service.collectionShare(item));
  const decoded = e.service.readCollectionSnapshot(url.searchParams, [
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ]);
  assert.equal(decoded.title, item.title);
  assert.deepEqual(
    decoded.films.map((f) => f.id),
    [2, 1],
  );
  assert.throws(() => e.service.readCollectionSnapshot(new URLSearchParams('shared=0'), []));
});
test('повреждённые записи локальных подборок не попадают в интерфейс', () => {
  const e = collections();
  e.values.set('frame:collections:1:own', [
    { id: '../x', title: 'Кино', description: '', filmIds: [1], createdAt: 1 },
    null,
    { id: 'local-1', title: 'Кино', description: '', filmIds: [1, -1, 1, '2'], createdAt: 1 },
  ]);
  assert.deepEqual(
    e.service.readLocalCollections().map((item) => item.filmIds),
    [[1]],
  );
});
test('поиск собственных отзывов ограничивает параллелизм и сообщает о частичной ошибке', async () => {
  let active = 0,
    max = 0;
  const service = moduleFrom('profile-reviews', {
    '../api/reviews.js': {
      findMyReview: async (id) => {
        active++;
        max = Math.max(max, active);
        await new Promise(setImmediate);
        active--;
        if (id === 2) throw new Error('network');
        return [1, 7].includes(id) ? { id, createdAt: `2026-11-${id + 10}` } : null;
      },
    },
  });
  const result = await service.loadProfileReviews(
    Array.from({ length: 12 }, (_, i) => ({ id: i + 1 })),
    51,
    2,
    { signal: new AbortController().signal },
  );
  assert.equal(max, 4);
  assert.equal(result.failed, 1);
  assert.deepEqual(
    result.reviews.map((item) => item.film.id),
    [7, 1],
  );
});
test('отмена поиска отзывов остаётся отменой, а не пустым списком', async () => {
  const controller = new AbortController();
  const service = moduleFrom('profile-reviews', {
    '../api/reviews.js': {
      findMyReview: async () => {
        controller.abort();
        return null;
      },
    },
  });
  await assert.rejects(
    service.loadProfileReviews([{ id: 1 }], 51, 1, { signal: controller.signal }),
    { name: 'AbortError' },
  );
});

test('ограничение 18+ применяется к кешу без потери скрытых фильмов при выключении', async () => {
  let value = {};
  const storage = {
    readJson: () => value,
    writeJson: (key, next) => {
      value = next;
      return true;
    },
    StorageKey: { CATALOG_VIEW: 'view' },
  };
  const filters = moduleFrom('catalog-filters');
  const content = moduleFrom('content-preferences', {
    './storage.js': storage,
    './catalog-filters.js': filters,
  });
  let calls = 0;
  const films = [
    { id: 1, ageLimit: 18 },
    { id: 2, ageLimit: 16 },
    { id: 3, ageLimit: null },
  ];
  const catalog = moduleFrom('catalog', {
    '../api/films.js': {
      getFilms: async () => {
        calls++;
        return films;
      },
    },
    './content-preferences.js': content,
  });
  assert.equal((await catalog.loadCatalog()).length, 3);
  content.saveContentPreferences({ hideAdults: true });
  assert.deepEqual(
    (await catalog.loadCatalog()).map((film) => film.id),
    [2, 3],
  );
  content.saveContentPreferences({ hideAdults: false });
  assert.deepEqual(
    (await catalog.loadCatalog()).map((film) => film.id),
    [1, 2, 3],
  );
  assert.equal(calls, 1);
});

test('кино-тема сохраняется локально и отключается при ручной смене палитры', () => {
  let value = {};
  const appearance = moduleFrom('appearance', {
    './storage.js': {
      readJson: () => value,
      writeJson: (key, next) => {
        value = next;
        return true;
      },
    },
  });
  appearance.saveAppearance({ cinema: 'coraline' });
  assert.equal(appearance.readAppearance().cinema, 'coraline');
  appearance.saveAppearance({ accent: 'mint' });
  assert.equal(appearance.readAppearance().cinema, 'none');
  assert.equal(appearance.readAppearance().accent, 'mint');
  value = { ...value, mode: 'light', transparency: 45 };
  assert.equal(appearance.readAppearance().mode, undefined);
  assert.equal(appearance.readAppearance().transparency, 45);
  appearance.saveAppearance({ background: 'forest' });
  assert.equal(value.mode, undefined);
});
