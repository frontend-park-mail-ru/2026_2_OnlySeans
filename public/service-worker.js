/* Generated cache version and asset list are injected by Webpack. */
const CACHE_PREFIX = 'onlyseans-ui-';
const CACHE_NAME = CACHE_PREFIX + '__CACHE_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;
const STATIC_PATHS = new Set(PRECACHE_URLS);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
  // Do not skip waiting: existing tabs must finish using their current bundle.
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)),
  )));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // API and user images always go to the network, including when offline.
  if (/^\/(api|static|avatars)(\/|$)/.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/offline.html')) || Response.error();
    }));
    return;
  }
  if (!url.search && STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      (await cache.match(url.pathname)) || fetch(request),
    ));
  }
});
