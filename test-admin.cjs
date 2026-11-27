const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', code)(exports, (name) => dependencies[name]);
  return exports;
}
const { validateFilm, filmInput, posterError, filterAdminFilms } = load(
  'src/services/admin-film.ts',
);
const fields = () => ({
  title: 'Название',
  original_title: '',
  film_type: 'movie',
  release_year: '2026',
  duration_min: '',
  age_limit: '0',
  description: '',
});
test('админ-форма проверяет границы и не отправляет длительность сериала', () => {
  assert.deepEqual(validateFilm(fields()), {});
  for (const [name, value] of [
    ['title', ' '],
    ['title', 'а'.repeat(256)],
    ['film_type', 'short'],
    ['release_year', '1887'],
    ['release_year', '2201'],
    ['duration_min', '0'],
    ['duration_min', '1.2'],
    ['duration_min', '6001'],
    ['age_limit', '14'],
    ['age_limit', ''],
    ['description', 'а'.repeat(10001)],
  ])
    assert.ok(validateFilm({ ...fields(), [name]: value })[name], name + ' ' + value.slice(0, 10));
  const series = { ...fields(), film_type: 'series', duration_min: '90000' };
  assert.deepEqual(validateFilm(series), {});
  assert.equal(filmInput(series).duration_min, null);
  assert.equal(filmInput(fields()).age_limit, 0);
  assert.equal(filmInput(fields()).original_title, null);
  assert.equal(posterError({ type: 'image/svg+xml', size: 10 }).length > 0, true);
  assert.equal(posterError({ type: 'image/png', size: 5 * 1024 * 1024 }), '');
  assert.equal(posterError({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }).length > 0, true);
});
test('админ-поиск учитывает оригинальное название, ID и все фильтры', () => {
  const films = [
    { id: 1, title: 'Б', originalTitle: 'Original', type: 'movie', year: 2026, poster: 'x' },
    { id: 2, title: 'А', originalTitle: '', type: 'series', year: 2025, poster: '' },
  ];
  const filters = { q: '', type: '', year: '', poster: '', sort: '' };
  assert.deepEqual(
    filterAdminFilms(films, { ...filters, q: 'original' }).map((f) => f.id),
    [1],
  );
  assert.deepEqual(
    filterAdminFilms(films, { ...filters, q: '#2' }).map((f) => f.id),
    [2],
  );
  assert.deepEqual(
    filterAdminFilms(films, { ...filters, type: 'series', year: '2025', poster: 'no' }).map(
      (f) => f.id,
    ),
    [2],
  );
  assert.deepEqual(
    filterAdminFilms(films, { ...filters, sort: 'title' }).map((f) => f.id),
    [2, 1],
  );
  assert.deepEqual(
    films.map((f) => f.id),
    [1, 2],
  );
});
test('CRUD использует контракт Полины: id, PUT/DELETE 204 и multipart poster', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, ...options });
    return path === '/films' ? { id: 77 } : {};
  };
  const api = load('src/api/admin.ts', { './http.js': { request }, './films.js': {} });
  assert.equal(await api.createFilm(filmInput(fields())), 77);
  await api.updateFilm(77, filmInput(fields()));
  await api.deleteFilm(77);
  await api.uploadPoster(77, new File(['poster'], 'x.png', { type: 'image/png' }));
  await api.deletePoster(77);
  assert.deepEqual(
    calls.map((c) => [c.path, c.method]),
    [
      ['/films', 'POST'],
      ['/films/77', 'PUT'],
      ['/films/77', 'DELETE'],
      ['/films/77/poster', 'POST'],
      ['/films/77/poster', 'DELETE'],
    ],
  );
  assert.equal(calls[3].body.get('poster').name, 'x.png');
  assert.deepEqual(Object.keys(calls[0].body).sort(), [
    'age_limit',
    'description',
    'duration_min',
    'film_type',
    'original_title',
    'release_year',
    'title',
  ]);
});
