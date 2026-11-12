declare const __PRECACHE_URLS__: string[];

const worker = globalThis as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'onlyseans-ui-';
const CACHE_NAME = CACHE_PREFIX + '__CACHE_VERSION__';
const DATA_CACHE = 'onlyseans-public-v1';
const PRECACHE_URLS = __PRECACHE_URLS__;
const STATIC_PATHS = new Set(PRECACHE_URLS);
const PUBLIC_API = /^\/api\/(?:films(?:\/\d+(?:\/(?:people|rating|reviews|poster))?)?|people\/\d+|collections(?:\/\d+(?:\/ratings)?)?)$/;
const PUBLIC_IMAGE = /^\/static\/(?:posters|persons|people)\//;
const CACHE_LIMIT = 400;

worker.addEventListener('install', event => {
  const requests = PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(requests)));
});

worker.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await worker.clients.claim();
  })());
});

async function loadPage(request: Request) {
  const response = await fetch(request).catch(() => null);
  if (response && response.status < 500) return response;
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match('/index.html')) || response || Response.error();
}

async function updatePublicCache(url: string, response: Response, isApi: boolean) {
  const type = response.headers.get('Content-Type') || '';
  const expectedType = isApi ? 'application/json' : 'image/';
  if (response.status === 404 || response.status === 410) {
    const cache = await caches.open(DATA_CACHE);
    await cache.delete(url);
  } else if (response.status === 200 && type.includes(expectedType) &&
      !/no-store|private/i.test(response.headers.get('Cache-Control') || '')) {
    const copy = response.clone();
    const cache = await caches.open(DATA_CACHE);
    await cache.put(url, copy);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - CACHE_LIMIT)).map(key => cache.delete(key)));
  }
}

async function loadPublic(event: FetchEvent, isApi: boolean) {
  const { request } = event;
  const network = fetch(request, { credentials: 'omit' }).catch(error => {
    if (request.signal.aborted) throw error;
    return null;
  });
  event.waitUntil(network
    .then(response => response && updatePublicCache(request.url, response, isApi))
    .catch(() => {}));

  const response = await network;
  if (response && response.status < 500) return response;
  if (!request.headers.has('X-Frame-Fresh')) {
    const cached = await caches.open(DATA_CACHE).then(cache => cache.match(request.url)).catch(() => undefined);
    if (cached) return cached;
  }
  if (response) return response;
  if (isApi) {
    return new Response(JSON.stringify({ error: 'offline cache miss' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return Response.error();
}

worker.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== worker.location.origin || request.headers.has('Range')) return;

  const isPublicApi = PUBLIC_API.test(url.pathname);
  if (isPublicApi || PUBLIC_IMAGE.test(url.pathname) || url.pathname === '/review-authors.json') {
    event.respondWith(loadPublic(event, isPublicApi || url.pathname === '/review-authors.json'));
    return;
  }
  if (/^\/(api|static|avatars)(\/|$)/.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(loadPage(request));
    return;
  }
  if (!url.search && STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      (await cache.match(url.pathname)) || fetch(request),
    ));
  }
});
