const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, dependencies) {
  const result = {};
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/${path}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', code)(result, (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  });
  return result;
}

const http = load('src/api/http.ts', {
  './errors.js': { HttpStatus: { NO_CONTENT: 204 } },
  '../config.js': { API_URL: 'http://localhost:8000' },
  '../services/offline-storage.js': { offlineAccount: () => null },
});
const { getReleases } = load('src/api/releases.ts', {
  './http.js': http,
  './films.js': { toFilm: (film) => film },
});

const film = { id: 15, title: 'Film' };
const item = { film_id: 15, film, world_premiere_date: '2026-12-10', russia_premiere_date: '2027-01-17' };

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('loads every page, forwards region and cancellation, selects world date', async (t) => {
  const urls = [];
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    urls.push(url);
    assert.equal(options.signal, controller.signal);
    assert.equal(options.credentials, 'include');
    return response({ items: [item], total: 2 });
  });
  const releases = await getReleases('2026-12-01', '2027-01-01', 'world', { signal: controller.signal });
  assert.equal(releases.length, 2);
  assert.equal(releases[0].date, '2026-12-10');
  assert.deepEqual(urls.map((url) => url.searchParams.get('offset')), ['0', '1']);
  for (const url of urls) {
    assert.equal(url.pathname, '/api/releases');
    assert.equal(url.searchParams.get('region'), 'world');
    assert.equal(url.searchParams.get('from'), '2026-12-01');
    assert.equal(url.searchParams.get('to'), '2027-01-01');
  }
});

test('Russian calendar selects Russian date and skips missing dates', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => response({
    items: [item, { ...item, russia_premiere_date: null }], total: 2,
  }));
  assert.deepEqual(await getReleases('2027-01-01', '2027-02-01', 'russia'), [
    { date: '2027-01-17', film },
  ]);
});

test('empty month succeeds and API errors propagate', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => response({ items: [], total: 0 }));
  assert.deepEqual(await getReleases('2026-12-01', '2027-01-01', 'world'), []);
  mock.mock.mockImplementation(async () => response({ error: 'unavailable' }, 503));
  await assert.rejects(getReleases('2026-12-01', '2027-01-01', 'world'), { status: 503 });
  mock.mock.mockImplementation(async () => response({ items: null, total: 1 }));
  await assert.rejects(getReleases('2026-12-01', '2027-01-01', 'world'), /Invalid release calendar response/);
});
