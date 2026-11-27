const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
function load(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(`${__dirname}/src/services/${file}.ts`, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', ...Object.keys(globals), code)(
    exports,
    (name) => dependencies[name],
    ...Object.values(globals),
  );
  return exports;
}
function environment() {
  let user = { id: 1 };
  let fail = false;
  const values = new Map();
  const requests = [];
  const storage = load(
    'storage',
    {
      '../core/store.js': { store: { get: () => user } },
      '../api/http.js': {
        request: async (url, options) => {
          requests.push({ url, options });
          if (!options)
            return { 'frame:catalog-view': 'list', 'frame:appearance': { accent: 'invalid' } };
          assert.ok(['frame:catalog-view', 'frame:sidebar-collapsed'].includes(options.body.key));
        },
      },
      './notice.js': { notify: () => assert.fail('unexpected synchronization error') },
    },
    {
      localStorage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          if (fail) throw new Error('quota');
          values.set(key, value);
        },
      },
    },
  );
  const shelves = load(
    'shelves',
    { './storage.js': storage, '../core/store.js': { store: { get: () => user } } },
    { crypto: { randomUUID } },
  );
  return {
    storage,
    shelves,
    values,
    requests,
    user: (next) => {
      user = next;
    },
    fail: () => {
      fail = true;
    },
  };
}
test('preferences sends only backend-supported keys, validates values, keeps custom values local', async () => {
  const e = environment();
  await e.storage.loadPreferences();
  assert.equal(e.storage.readJson('frame:catalog-view', 'grid'), 'list');
  assert.deepEqual(e.storage.readJson('frame:appearance', {}), {});
  assert.equal(e.storage.writeJson('frame:catalog-view', 'bad'), false);
  assert.equal(e.storage.writeJson('frame:sidebar-collapsed', 'true'), false);
  e.storage.writeJson('frame:appearance', { accent: 'blue' });
  e.storage.writeJson('frame:catalog-view', 'grid');
  await new Promise(setImmediate);
  assert.deepEqual(
    e.requests.filter((r) => r.options).map((r) => r.options.body.key),
    ['frame:catalog-view'],
  );
  assert.deepEqual(e.storage.readJson('frame:appearance', {}), { accent: 'blue' });
});
test('shelves normalize names, reject duplicate names, support Unicode and isolate accounts', () => {
  const e = environment();
  const first = e.shelves.saveShelf('  Зимнее   кино  ');
  assert.equal(first.name, 'Зимнее кино');
  assert.throws(() => e.shelves.saveShelf('зимнее кино'), /уже есть/);
  assert.throws(() => e.shelves.saveShelf(' '), /Введите/);
  e.shelves.saveShelf('🎬'.repeat(40));
  assert.throws(() => e.shelves.saveShelf('🎬'.repeat(41)), /40/);
  e.shelves.setFilmShelves(3, [first.id]);
  assert.deepEqual(e.shelves.shelfFilmIds(e.shelves.readShelves()[0], [3, 5]), [3]);
  assert.deepEqual(e.shelves.shelfFilmIds(e.shelves.readShelves()[0], [5]), []);
  e.user({ id: 2 });
  assert.deepEqual(e.shelves.readShelves(), []);
  e.user({ id: 1 });
  assert.equal(e.shelves.readShelves().length, 2);
  e.shelves.deleteShelf(first.id);
  assert.equal(e.shelves.readShelves().length, 1);
  e.user(null);
  assert.deepEqual(e.shelves.readShelves(), []);
  assert.throws(() => e.shelves.saveShelf('guest'), /Войдите/);
});
test('shelves ignore corrupted records and surface failed persistence', () => {
  const e = environment();
  e.values.set(
    'frame:shelves:1',
    JSON.stringify([
      { id: 'valid', name: 'Кино', filmIds: [1, 1, -1, '2', 3], createdAt: 1 },
      { id: 'other', name: 'кино', filmIds: [], createdAt: 1 },
      { id: 'broken' },
    ]),
  );
  assert.deepEqual(
    e.shelves.readShelves().map((s) => s.filmIds),
    [[1, 3]],
  );
  e.fail();
  assert.throws(() => e.shelves.saveShelf('Новое'), /Не удалось сохранить/);
  assert.equal(e.shelves.readShelves().length, 1);
});
test('favorites preserve recent order, distinguish unrated films and exclude watched recommendations', () => {
  const f = load('favorites');
  const films = [
    { id: 2, title: 'Б', year: 2020, duration: 120, isSeries: false, genres: ['Драма'] },
    { id: 1, title: 'А', year: 2020, duration: 9999, isSeries: true, genres: ['Драма'] },
  ];
  assert.deepEqual(
    f.sortFavorites(films, 'year', new Map(), []).map((x) => x.id),
    [2, 1],
  );
  assert.deepEqual(
    f.sortFavorites(films, 'unwatched', new Map(), [2]).map((x) => x.id),
    [1, 2],
  );
  assert.deepEqual(
    f
      .sortFavorites(
        films,
        'rating',
        new Map([
          [1, { average: 10, votes: 0 }],
          [2, { average: 1, votes: 1 }],
        ]),
        [],
      )
      .map((x) => x.id),
    [2, 1],
  );
  assert.equal(f.favoriteStats(films).hours, 2);
  assert.deepEqual(
    f
      .similarFavorites(
        [...films, { id: 3, genres: ['Драма'] }, { id: 4, genres: ['Драма'] }],
        films,
        [3],
      )
      .map((x) => x.id),
    [4],
  );
  assert.deepEqual(
    films.map((x) => x.id),
    [2, 1],
  );
});
test('shared favorite snapshots reject invalid or oversized IDs', () => {
  const f = load('favorites', {}, { location: { origin: 'https://example.org' } });
  assert.deepEqual(f.parseFavoriteShare(new URLSearchParams('shared=1,2,1')), [1, 2]);
  assert.equal(f.parseFavoriteShare(new URLSearchParams()), null);
  for (const raw of ['', '0', '-1', '1,x', '9007199254740992', Array(101).fill('1').join(',')])
    assert.throws(() => f.parseFavoriteShare(new URLSearchParams({ shared: raw })));
  assert.equal(f.favoriteShare([1, 2]), 'https://example.org/favorites?shared=1%2C2');
  assert.throws(() => f.favoriteShare([]));
});

test('preference notification does not loop when a rendered subscriber subscribes again', () => {
  const { storage } = environment();
  let calls = 0;
  let unsubscribe;
  const listen = () =>
    storage.watchPreferences(() => {
      calls++;
      unsubscribe();
      unsubscribe = listen();
    });
  unsubscribe = listen();
  storage.writeJson('frame:local-example', true);
  assert.equal(calls, 1);
  storage.writeJson('frame:local-example', false);
  assert.equal(calls, 2);
  unsubscribe();
});
