const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, dependencies) {
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

test('отсутствующие и некорректные оценки не ломают загрузку каталога', async () => {
  const payloads = [
    { rating: null },
    {},
    { rating: { average_score: 8 } },
    { rating: { average_score: '8', votes: 2 } },
    { rating: { average_score: 8, votes: 2.5 } },
    { rating: { average_score: 10, votes: 0 } },
    { rating: { average_score: 8.5, votes: 7 } },
  ];
  let calls = 0;
  const { loadCatalogRatings } = load('services/catalog-ratings.ts', {
    '../api/http.js': {
      request: async (url) => {
        calls++;
        return payloads[Number(url.split('/')[2]) - 1];
      },
    },
  });
  const films = payloads.map((_, index) => ({ id: index + 1 }));
  const ratings = await loadCatalogRatings(films);
  for (let id = 1; id <= 6; id++) assert.deepEqual(ratings.get(id), { average: 0, votes: 0 });
  assert.deepEqual(ratings.get(7), { average: 8.5, votes: 7 });
  await loadCatalogRatings(films);
  assert.equal(calls, 7, 'нулевые показатели также кешируются');
});

test('сетевая ошибка и неразобранный ответ рейтинга остаются ошибками', async () => {
  for (const failure of [new TypeError('offline'), new SyntaxError('invalid JSON')]) {
    const { loadCatalogRatings } = load('services/catalog-ratings.ts', {
      '../api/http.js': {
        request: async () => {
          throw failure;
        },
      },
    });
    await assert.rejects(loadCatalogRatings([{ id: 1 }]), (error) => error === failure);
  }
});

test('пул рейтингов ограничивает число одновременных запросов', async () => {
  let active = 0;
  let peak = 0;
  const { loadCatalogRatings } = load('services/catalog-ratings.ts', {
    '../api/http.js': {
      request: async () => {
        peak = Math.max(peak, ++active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active--;
        return { rating: null };
      },
    },
  });
  const ratings = await loadCatalogRatings(Array.from({ length: 25 }, (_, id) => ({ id })));
  assert.equal(ratings.size, 25);
  assert.ok(peak <= 6);
});

test('отмена каталога доходит до API и не портит загрузку другого потребителя', async () => {
  const aborted = new AbortController();
  const completed = new AbortController();
  const films = [{ id: 4 }];
  let calls = 0;
  const { loadCatalog } = load('services/catalog.ts', {
    './catalog-pager.js': { invalidateCatalogPager: () => {} },
    './content-preferences.js': { visibleContent: (films) => films },
    '../api/films.js': {
      getFilms: ({ signal }) => {
        calls++;
        if (signal === completed.signal) return Promise.resolve(films);
        assert.equal(signal, aborted.signal);
        return new Promise((resolve, reject) =>
          signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
        );
      },
    },
  });
  const pending = loadCatalog({ signal: aborted.signal });
  const rejected = assert.rejects(pending, (error) => error.name === 'AbortError');
  const other = loadCatalog({ signal: completed.signal });
  aborted.abort();
  await rejected;
  assert.deepEqual(await other, films);
  assert.deepEqual(await loadCatalog(), films);
  assert.equal(calls, 2);
});

test('изменение каталога сбрасывает кеш и отклоняет кеширование старого запроса', async () => {
  let finish;
  let calls = 0;
  let invalidations = 0;
  const { loadCatalog, invalidateCatalog } = load('services/catalog.ts', {
    './content-preferences.js': { visibleContent: (films) => films },
    './catalog-pager.js': { invalidateCatalogPager: () => invalidations++ },
    '../api/films.js': {
      getFilms: () =>
        ++calls === 1
          ? new Promise((resolve) => {
              finish = resolve;
            })
          : Promise.resolve([{ id: 2 }]),
    },
  });
  const stale = loadCatalog();
  invalidateCatalog();
  finish([{ id: 1 }]);
  await stale;
  assert.deepEqual(await loadCatalog(), [{ id: 2 }]);
  assert.equal(calls, 2);
  invalidateCatalog();
  await loadCatalog();
  assert.equal(calls, 3);
  assert.equal(invalidations, 2);
});
