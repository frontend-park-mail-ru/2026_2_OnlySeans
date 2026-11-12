const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function testServiceWorker() {
  const source = fs.readFileSync('dist/service-worker.js', 'utf8');
  assert(!source.includes('__PRECACHE_URLS__'));
  assert(!fs.existsSync('dist/offline.html'));

  const events = {};
  const storage = new Map();
  const deletedCaches = [];
  let offline = false;
  let claimed = false;
  let responseStatus = 200;
  let lastFetch;
  let cacheWriteBarrier;

  const origin = 'https://example.test';
  const toURL = (input) => typeof input === 'string' ? new URL(input, origin).href : input.url;
  const caches = {
    async open(name) {
      if (!storage.has(name)) storage.set(name, new Map());
      const entries = storage.get(name);
      return {
        async addAll(urls) {
          for (const request of urls) {
            const url = new URL(request.url).pathname;
            assert.equal(request.cache, 'reload');
            assert(fs.existsSync('dist' + url), url);
            entries.set(request.url, new Response(url));
          }
        },
        async match(input) { return entries.get(toURL(input))?.clone(); },
        async put(input, response) {
          await cacheWriteBarrier;
          entries.set(toURL(input), response);
        },
        async delete(input) { return entries.delete(toURL(input)); },
        async keys() { return [...entries.keys()]; },
      };
    },
    async keys() { return ['unrelated-cache', 'onlyseans-ui-old', ...storage.keys()]; },
    async delete(name) { deletedCaches.push(name); },
  };

  const context = {
    URL, Response, caches,
    Request: class extends Request {
      constructor(url, options) { super(new URL(url, origin), options); }
    },
    location: { origin },
    clients: { claim: async () => { claimed = true; } },
    addEventListener: (name, handler) => { events[name] = handler; },
    fetch: async (request, options) => {
      lastFetch = { request, options };
      if (offline) throw new Error('offline');
      const api = new URL(request.url).pathname.startsWith('/api/');
      return new Response(api ? JSON.stringify({ url: request.url }) : 'network', {
        status: responseStatus,
        headers: { 'Content-Type': api ? 'application/json' : 'text/html' },
      });
    },
  };
  vm.runInNewContext(source, context);

  async function lifecycle(name) {
    let promise;
    events[name]({ waitUntil: pending => { promise = pending; } });
    await promise;
  }

  function dispatchRequest(path, method = 'GET', mode = 'cors', headers = {}) {
    let response;
    const background = [];
    events.fetch({
      request: { url: new URL(path, origin).href, method, mode, headers: new Headers(headers), signal: new AbortController().signal },
      respondWith: promise => { response = promise; },
      waitUntil: promise => { background.push(promise); },
    });
    return { response, background: Promise.all(background) };
  }

  async function request(...args) {
    const { response, background } = dispatchRequest(...args);
    await background;
    return response;
  }

  await lifecycle('install');
  await lifecycle('activate');
  assert(claimed);
  assert.deepEqual(deletedCaches, ['onlyseans-ui-old']);

  assert.equal(await request('/api/me/profile'), undefined);
  assert.equal(await request('/api/authorised'), undefined);
  assert.equal(await request('/api/films/1/rating/me'), undefined);
  assert.equal(await request('/avatars/image.jpg'), undefined);
  assert.equal(await request('/api/films/1/rating', 'PUT'), undefined);
  assert.equal(await request('https://other.test/api/films'), undefined);
  assert.equal(await (await request('/profile', 'GET', 'navigate')).text(), 'network');

  const publicPaths = ['/api/films?limit=100', '/api/films/1', '/api/people/2',
    '/api/films/1/people', '/api/films/1/reviews?offset=0', '/api/films/1/rating'];
  for (const path of publicPaths) {
    assert.equal((await request(path)).status, 200);
    assert.equal(lastFetch.options.credentials, 'omit');
  }
  let releaseCacheWrite;
  cacheWriteBarrier = new Promise(resolve => { releaseCacheWrite = resolve; });
  const backgroundPath = '/api/films/25';
  const { response, background } = dispatchRequest(backgroundPath);
  try {
    const received = await Promise.race([
      response,
      new Promise(resolve => setImmediate(() => resolve(null))),
    ]);
    assert.equal(received?.status, 200);
    assert(![...storage.values()].some(entries => entries.has(origin + backgroundPath)));
  } finally {
    releaseCacheWrite();
  }
  await background;
  assert([...storage.values()].some(entries => entries.has(origin + backgroundPath)));

  const precache = [...storage.values()][0];
  const asset = new URL([...precache.keys()].find(key => key.endsWith('.js'))).pathname;
  offline = true;
  assert.equal(await request(asset, 'GET', 'cors', { Range: 'bytes=0-7' }), undefined);
  assert.equal(await request('/static/posters/example.jpg', 'GET', 'cors', { Range: 'bytes=0-7' }), undefined);
  assert.equal(await (await request(asset)).text(), asset);
  for (const path of ['/films', '/film/1', '/person/2', '/profile']) {
    assert.equal(await (await request(path, 'GET', 'navigate')).text(), '/index.html');
  }
  for (const path of publicPaths) {
    assert.deepEqual(await (await request(path)).json(), { url: origin + path });
  }
  assert.equal((await request('/api/films?limit=10')).status, 503);
  assert.equal((await request(publicPaths[4], 'GET', 'cors', { 'X-Frame-Fresh': '1' })).status, 503);

  offline = false;
  responseStatus = 502;
  assert.equal((await request('/api/films/1')).status, 200);
  const uncached = await request('/api/films/500');
  assert.equal(uncached.status, 502);
  assert.deepEqual(await uncached.json(), { url: origin + '/api/films/500' });
  assert.equal((await request('/api/films/1', 'GET', 'cors', { 'X-Frame-Fresh': '1' })).status, 502);
  responseStatus = 404;
  assert.equal((await request('/api/films/1')).status, 404);
  offline = true;
  assert.equal((await request('/api/films/1')).status, 503);

  console.log('Passed: offline SPA navigation, background caching, reload on install, Range bypass, and original server errors.');
}

testServiceWorker().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
