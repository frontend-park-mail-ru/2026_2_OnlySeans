const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, 'src/services/catalog-filters.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const filters = {};
new Function('exports', compiled)(filters);

const film = (id, genres, year, ageLimit) => ({ id, title: `Фильм ${id}`, genres, year, ageLimit });
const films = [
  film(1, ['Драма'], 1994, 16),
  film(2, ['Комедия'], 2014, 12),
  film(3, ['Драма', 'Комедия'], 2020, 16),
  film(4, ['Документальный'], 2010, 0),
  film(5, ['Драма'], 2024, null),
];
const ids = (state, ratings) => filters.filterCatalog(films, state, ratings).map((item) => item.id);

test('жанры включаются, исключаются и сочетаются через AND/OR', () => {
  const state = filters.defaultCatalogFilters();
  assert.deepEqual(ids(state), [1, 2, 3, 5]);
  filters.selectGenre(state, 'ДРАМА', 1);
  assert.deepEqual(ids(state), [1, 3, 5]);
  filters.selectGenre(state, 'Комедия', -1);
  assert.deepEqual(ids(state), [1, 5]);
  filters.selectGenre(state, 'Комедия', 1);
  assert.deepEqual(ids(state), [3]);
  state.anyGenre = true;
  assert.deepEqual(ids(state), [1, 2, 3, 5]);
});

test('диапазон лет и возраст сохраняют фильмы с неизвестным возрастом', () => {
  const state = filters.defaultCatalogFilters();
  state.yearFrom = '2010';
  state.yearTo = '2024';
  state.ages = [16];
  assert.deepEqual(ids(state), [3, 5]);
  assert.ok(filters.catalogYearError({ yearFrom: '2024', yearTo: '1990' }));
  assert.ok(filters.catalogYearError({ yearFrom: '20x0', yearTo: '2020' }));
});

test('рейтинг без голосов не становится оценкой и не участвует в пороге', () => {
  const state = filters.defaultCatalogFilters();
  const ratings = new Map([
    [1, { average: 9, votes: 10 }],
    [3, { average: 8, votes: 2 }],
    [5, { average: 10, votes: 0 }],
  ]);
  state.sort = 'rating';
  assert.deepEqual(ids(state, ratings), [1, 3, 2, 5]);
  state.ratingFrom = 8;
  assert.deepEqual(ids(state, ratings), [1, 3]);
  state.ratingFrom = 0;
  state.sort = 'newest';
  assert.deepEqual(ids(state, ratings), [5, 3, 2, 1]);
});

test('ссылка сохраняет параметры, а некорректные значения отбрасываются', () => {
  const state = filters.defaultCatalogFilters();
  filters.selectGenre(state, 'Драма', 1);
  filters.selectGenre(state, 'Комедия', -1);
  state.anyGenre = true;
  state.yearFrom = '1990';
  state.yearTo = '2024';
  state.ratingFrom = 7.5;
  state.ages = [12, 16];
  state.sort = 'popular';
  assert.deepEqual(filters.readCatalogFilters(filters.catalogQuery(state)), state);
  assert.deepEqual(
    filters.readCatalogFilters(
      new URLSearchParams('yearFrom=no&ratingFrom=NaN&age=99&sort=unknown'),
    ),
    filters.defaultCatalogFilters(),
  );
});

test('теги сохраняют подписи жанров из API и прямых ссылок', () => {
  const state = filters.readCatalogFilters(new URLSearchParams('genre=драма'));
  assert.equal(filters.catalogFilterTags(state, ['Драма'])[0].label, '+ Драма');
  filters.selectGenre(state, 'Научная фантастика', -1);
  const restored = filters.readCatalogFilters(filters.catalogQuery(state));
  assert.ok(
    filters.catalogFilterTags(restored).some((tag) => tag.label === '⦸ Научная фантастика'),
  );
});

test('отмена исключения документального жанра сохраняется в ссылке и тегах', () => {
  const state = filters.defaultCatalogFilters();
  filters.selectGenre(state, 'Документальный', 0);
  assert.deepEqual(ids(state), [1, 2, 3, 4, 5]);
  assert.equal(filters.catalogFilterCount(state), 1);
  assert.equal(filters.catalogFilterTags(state)[0].key, 'genre:документальный');
  assert.deepEqual(filters.readCatalogFilters(filters.catalogQuery(state)), state);
});
