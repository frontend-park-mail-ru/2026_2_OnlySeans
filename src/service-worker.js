const CACHE_NAME = 'onlyseans-static-v1';
const APP_SHELL_URL = new URL('./', self.registration.scope);
const API_PATH_PREFIX = '/api/';
const STATIC_FILE_PATTERN = /\.(?:css|gif|jpe?g|js|webp|png|svg|woff2?)(?:$|\?)/i;


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(APP_SHELL_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('onlyseans-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET'
    || url.origin !== self.location.origin
    || url.pathname.startsWith(API_PATH_PREFIX)
    || (request.mode !== 'navigate' && !STATIC_FILE_PATTERN.test(url.pathname))
  ) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;

      if (request.mode === 'navigate') {
        const appShell = await cache.match(APP_SHELL_URL);
        if (appShell) return appShell;
      }

      throw error;
    }
  })());
});
