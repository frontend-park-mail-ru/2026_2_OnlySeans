const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function testServiceWorker() {
  const source = fs.readFileSync('dist/service-worker.js', 'utf8');
  assert(!source.includes('__PRECACHE_URLS__'));

  const events = {};
  const entries = new Map();
  const deletedCaches = [];
  let offline = false;

  // Подменяем кеш и окружение браузера для запуска service worker в Node.js.
  const cache = {
    addAll: async (urls) => {
      for (const url of urls) {
        assert(fs.existsSync('dist' + url), url);
        entries.set(url, new Response(url));
      }
    },
    match: async (key) => entries.get(key),
  };

  const context = {
    URL,
    Response,
    Set,
    Promise,
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (name, handler) => {
        events[name] = handler;
      },
    },
    caches: {
      open: async () => cache,
      keys: async () => ['unrelated-cache', 'onlyseans-ui-old'],
      delete: async (name) => deletedCaches.push(name),
    },
    fetch: async () => {
      if (offline) throw new Error('offline');
      return new Response('network');
    },
  };

  vm.runInNewContext(source, context);

  async function dispatchLifecycleEvent(name) {
    let promise;
    events[name]({
      waitUntil: (pending) => {
        promise = pending;
      },
    });
    await promise;
  }

  async function request(path, method = 'GET', mode = 'cors') {
    let promise;
    events.fetch({
      request: {
        url: 'https://example.test' + path,
        method,
        mode,
      },
      respondWith: (response) => {
        promise = response;
      },
    });
    return promise;
  }

  // Установка кеширует файлы, активация удаляет только старый кеш приложения.
  await dispatchLifecycleEvent('install');
  await dispatchLifecycleEvent('activate');
  assert.deepEqual(deletedCaches, ['onlyseans-ui-old']);

  // Запросы к API, аватары и запись данных не перехватываются.
  assert.equal(await request('/api/me/library'), undefined);
  assert.equal(await request('/avatars/image.jpg'), undefined);
  assert.equal(await request('/api/films/1/rating', 'PUT'), undefined);

  // Без сети статические файлы берутся из кеша, а переходы показывают offline.html.
  const asset = [...entries.keys()].find((key) => key.endsWith('.js'));
  offline = true;
  assert.equal(await (await request(asset)).text(), asset);
  assert.equal(await (await request('/films', 'GET', 'navigate')).text(), '/offline.html');

  // При доступной сети страницы загружаются с сервера и не сохраняются в кеш.
  offline = false;
  assert.equal(await (await request('/profile', 'GET', 'navigate')).text(), 'network');
  assert(!entries.has('/profile'));
  assert(!entries.has('/api/me/library'));

  console.log(
    'Passed: precache files exist; offline fallback; cached assets; API/write exclusion; ' +
      'namespaced cleanup; navigation uses network.',
  );
}

testServiceWorker().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
