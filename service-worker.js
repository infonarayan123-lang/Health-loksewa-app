const CACHE_NAME = 'pho-loksewa-v132';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always go to network for the live question data (Google Sheet),
  // but use cache for the app shell itself so it opens instantly.
  if (event.request.url.includes('script.google.com')) {
    return; // let it go straight to network, don't cache quiz data
  }

  // NETWORK-FIRST for the app shell: always try to get the latest code first.
  // Only fall back to the cached copy if there's genuinely no internet connection.
  // This ensures updates (like bug fixes) always reach the phone immediately,
  // while still keeping the app usable offline as a safety net.
  event.respondWith(
    fetch(event.request)
      .then((freshResponse) => {
        const clone = freshResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return freshResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
