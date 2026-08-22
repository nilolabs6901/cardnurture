const CACHE_NAME = 'cardnurture-shell-v1';
const SHELL_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
];

function isApiRequest(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/');
}

function isSafeShellResponse(response, url) {
  return (
    response.ok &&
    response.type === 'basic' &&
    url.origin === self.location.origin &&
    !isApiRequest(url)
  );
}

function anonymousShellRequest(request) {
  return new Request(request.url, {
    method: 'GET',
    headers: request.headers,
    credentials: 'omit',
    cache: 'no-cache',
    redirect: 'follow',
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        SHELL_ASSETS.map(
          (asset) => new Request(asset, { credentials: 'omit', cache: 'reload' }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isShellAsset = SHELL_ASSETS.includes(url.pathname);
  const hasAuthorizationHeader = request.headers.has('authorization');

  // Never intercept API, cross-origin, non-GET, or authenticated requests.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    isApiRequest(url) ||
    hasAuthorizationHeader ||
    request.credentials === 'include' ||
    !isShellAsset
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(anonymousShellRequest(request)).then((response) => {
        if (isSafeShellResponse(response, url)) {
          const responseToCache = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(anonymousShellRequest(request), responseToCache),
            ),
          );
        }
        return response;
      });
    }),
  );
});
