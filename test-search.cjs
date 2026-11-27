const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadSearch(overrides = {}) {
  const dependencies = {
    '../api/people.js': { getPeople: overrides.people || (async () => []) },
    './catalog.js': { loadCatalog: overrides.films || (async () => []) },
  };
  const source = fs.readFileSync(path.join(__dirname, 'src/services/search.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', compiled)(exports, (name) => dependencies[name]);
  return exports;
}

test('поиск учитывает оригинальные названия, регистр и букву ё', () => {
  const search = loadSearch();
  assert.equal(
    search.matchesFilm({ title: 'Зелёная миля', originalTitle: 'The Green Mile' }, '  ЗЕЛЕНАЯ '),
    true,
  );
  assert.equal(
    search.matchesFilm({ title: 'Зелёная миля', originalTitle: 'The Green Mile' }, 'green'),
    true,
  );
  assert.equal(
    search.matchesPerson({ name: 'Кристиан Бейл', originalName: 'Christian Bale' }, 'bale'),
    true,
  );
  assert.equal(search.matchesPerson({ name: 'Кристиан Бейл', originalName: '' }, ''), false);
});

test('личные фильтры пересекают списки и сохраняют исходные данные', () => {
  const { filterSearchLibrary, readSearchLibraryFilters, readSearchTab } = loadSearch();
  const films = [1, 2, 3, 4].map((id) => ({ id }));
  const library = { favorite: [1, 2, 4], watched: [1], watchlater: [2, 3] };
  assert.deepEqual(
    filterSearchLibrary(
      films,
      { favorite: 'only', watched: 'hide', watchlater: 'only' },
      library,
    ).map((film) => film.id),
    [2],
  );
  assert.deepEqual(
    films.map((film) => film.id),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    readSearchLibraryFilters(new URLSearchParams('inFavorite=only&inWatched=wrong')),
    { favorite: 'only', watched: 'all', watchlater: 'all' },
  );
  assert.equal(readSearchTab(new URLSearchParams('tab=wrong')), 'all');
});

test('ошибка персон не скрывает фильмы и не кешируется как пустой список', async () => {
  let calls = 0;
  const search = loadSearch({
    films: async () => [{ id: 1 }],
    people: async () => {
      if (++calls === 1) throw new Error('server');
      return [{ id: 2 }];
    },
  });
  const first = await search.loadSearchData();
  assert.equal(first.peopleError, true);
  assert.deepEqual(first.films, [{ id: 1 }]);
  const second = await search.loadSearchData();
  assert.equal(second.peopleError, false);
  assert.deepEqual(second.people, [{ id: 2 }]);
  await search.loadSearchData();
  assert.equal(calls, 2);
});

test('отменённая загрузка не наполняет кеш устаревшими данными', async () => {
  let resolve;
  let calls = 0;
  const search = loadSearch({
    people: async () =>
      ++calls === 1
        ? new Promise((done) => {
            resolve = done;
          })
        : [{ id: 2 }],
  });
  const controller = new AbortController();
  const pending = search.loadSearchData({ signal: controller.signal });
  controller.abort();
  resolve([{ id: 1 }]);
  await assert.rejects(pending, { name: 'AbortError' });
  assert.deepEqual((await search.loadSearchData()).people, [{ id: 2 }]);
  assert.equal(calls, 2);
});
