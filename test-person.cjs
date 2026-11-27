const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', compiled)(exports, (name) => {
    assert.ok(Object.hasOwn(dependencies, name), name);
    return dependencies[name];
  });
  return exports;
}
const { countLabel } = load('core/format.ts');
const model = load('services/person-profile.ts', {
  '../api/people.js': {
    ROLE_LABELS: { actor: 'Актёр', director: 'Режиссёр', producer: 'Продюсер' },
  },
  '../core/format.js': { countLabel },
});
const credit = (id, year, role, character = '') => ({
  film: { id, year, title: `Фильм ${id}` },
  role,
  character,
});

test('профессии считают уникальные фильмы и объединяют персонажей', () => {
  const groups = model.personRoles([
    credit(1, 2008, 'actor', 'Брюс Уэйн'),
    credit(1, 2008, 'actor', 'Бэтмен'),
    credit(1, 2008, 'actor', 'Брюс Уэйн'),
    credit(1, 2008, 'producer'),
    credit(1, 2008, 'actor', 'Брюс Уэйн / Бэтмен'),
    credit(2, 2019, 'actor'),
    credit(3, 2020, 'other'),
  ]);
  assert.deepEqual(
    groups.map((group) => group.role),
    ['actor', 'producer', 'other'],
  );
  assert.equal(groups[0].count, 2);
  assert.equal(groups[0].credits[0].character, 'Брюс Уэйн / Бэтмен');
  assert.equal(groups[1].count, 1);
});
test('сортировка не меняет исходный список и оставляет неизвестный год в конце', () => {
  const credits = [credit(1, 2000, 'actor'), credit(2, 0, 'actor'), credit(3, 2020, 'actor')];
  assert.deepEqual(
    model.sortPersonCredits(credits).map((item) => item.film.id),
    [3, 1, 2],
  );
  assert.deepEqual(
    model.sortPersonCredits(credits, 'oldest').map((item) => item.film.id),
    [1, 3, 2],
  );
  assert.deepEqual(
    credits.map((item) => item.film.id),
    [1, 2, 3],
  );
});
test('возраст учитывает день рождения и дату смерти, неверные даты не показываются', () => {
  const person = { birthDate: '1974-01-30', deathDate: '', birthPlace: '' };
  assert.match(model.personFacts(person, new Date('2026-01-29T23:00:00Z'))[0].value, /51 год/);
  assert.match(model.personFacts(person, new Date('2026-01-30T00:00:00Z'))[0].value, /52 года/);
  const deceased = model.personFacts(
    { ...person, deathDate: '2015-01-29' },
    new Date('2026-01-30Z'),
  );
  assert.match(deceased[1].value, /40 лет/);
  assert.deepEqual(model.personFacts({ ...person, birthDate: '2024-02-30' }), []);
  assert.deepEqual(model.personFacts({ ...person, birthDate: '3000-01-01' }), []);
});
test('базовый API персон с first_name и last_name сохраняет имя для поиска', async () => {
  const api = load('api/people.ts', {
    './http.js': {
      assetUrl: (value) => value || '',
      requestPages: async () => [
        { persons: [{ id: 1, first_name: 'Кристиан', last_name: 'Бейл' }], total: 1 },
      ],
    },
    './films.js': {},
    './errors.js': {},
  });
  assert.equal((await api.getPeople())[0].name, 'Кристиан Бейл');
});

test('сбой расширенного API сохраняет основные данные, а 404 базового API остаётся ошибкой', async () => {
  class ApiError extends Error {
    constructor(status) {
      super('API error');
      this.status = status;
    }
  }
  let missing = false;
  const api = load('api/people.ts', {
    './http.js': {
      ApiError,
      assetUrl: (value) => value || '',
      request: async (url) => {
        if (url.startsWith('/people/')) throw new ApiError(500);
        if (missing) throw new ApiError(404);
        return { person: { id: 1, first_name: 'Тим', last_name: 'Роббинс' } };
      },
    },
    './films.js': {},
    './errors.js': { HttpStatus: { NOT_FOUND: 404 } },
  });
  const result = await api.getPerson(1);
  assert.equal(result.person.name, 'Тим Роббинс');
  assert.equal(result.partial, true);
  missing = true;
  await assert.rejects(api.getPerson(1), (error) => error.status === 404);
});
