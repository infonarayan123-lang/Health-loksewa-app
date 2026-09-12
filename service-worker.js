const CACHE_NAME = 'pho-loksewa-v364';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ---------- Push Notifications (Firebase Cloud Messaging) — integrated into this same service
// worker rather than a separate firebase-messaging-sw.js, since a page can only actively control
// one service worker at a time and this one already handles the app's caching. Uses the
// "compat" SDK here specifically because it's the version built to work with importScripts() in
// a classic (non-module) service worker context — the same modern SDK used in index.html can't
// be imported this way. ----------
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyD22QTLo3JSFSLRVeGwdCrZx4A9yCTw2sE",
  authDomain: "health-loksewa.firebaseapp.com",
  projectId: "health-loksewa",
  storageBucket: "health-loksewa.firebasestorage.app",
  messagingSenderId: "749045460666",
  appId: "1:749045460666:web:96b6a7aebaf8e626db1c83",
});
const messaging = firebase.messaging();
// Background messages (app closed or not focused) — this is what actually shows up in the
// phone's real notification bar, matching what was asked for specifically
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Health Loksewa';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: (payload.data && payload.data.url) || './index.html' }
  };
  self.registration.showNotification(title, options);
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

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
