const CACHE_NAME = 'pho-loksewa-v558';
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
// Notifications are plain text only. The server already strips emoji before sending; this repeats
// it on the phone itself so a push from any other source (e.g. sent by hand from the Firebase
// Console) still shows as clean text. Arrows and ordinary punctuation are left alone.
function stripEmojiForNotification(text) {
  return String(text == null ? '' : text)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u200D\u20E3]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
messaging.onBackgroundMessage((payload) => {
  const title = stripEmojiForNotification(payload.notification && payload.notification.title) || 'Health Loksewa';
  const options = {
    body: stripEmojiForNotification(payload.notification && payload.notification.body),
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: (payload.data && payload.data.url) || './index.html' }
  };
  // Showing can fail (for example if the student switched notifications off in Android settings): that must never raise an error here
  try { return self.registration.showNotification(title, options).catch(() => {}); } catch (e) { /* nothing to show */ }
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

// Live data that must NEVER be stored: the quiz/Sheet backend and Google/Firebase services (sign-in, database, push). (Oct 2026)
const NEVER_CACHE_HOSTS = ['script.google.com', 'script.googleusercontent.com', 'firestore.googleapis.com', 'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com', 'firebaseinstallations.googleapis.com', 'fcmregistrations.googleapis.com', 'fcm.googleapis.com'];

const NETWORK_WAIT_MS_ = 4000;          // how long to wait for the network before showing a saved copy (only when one exists)
const NETWORK_TIMEOUT_ = { timeout: true };

self.addEventListener('fetch', (event) => {
  // Only plain loads (GET) are ever handled. A POST (sending a message, signing in, saving) cannot be stored, and trying to
  // produced a silent error on every such request.
  if (event.request.method !== 'GET') return;
  let host = '';
  try { host = new URL(event.request.url).hostname; } catch (e) { return; }
  if (NEVER_CACHE_HOSTS.includes(host)) return; // live data goes straight to the network, never cached

  // NETWORK-FIRST for the app shell: always try to get the latest code first, so fixes reach the phone at once.
  // SLOW-NETWORK PROTECTION (Oct 2026): on a weak connection a request can hang for a very long time while a perfectly good saved copy
  // sits on the phone. So: if the network has not answered within NETWORK_WAIT_MS_ AND a saved copy exists, the saved copy is shown NOW
  // and the network request is allowed to finish in the background, which refreshes the saved copy for the next open. With NO saved
  // copy (first ever open) it simply keeps waiting for the network. Offline = the saved copy straight away, as before.
  const req = event.request;
  const networkPromise = fetch(req).then((freshResponse) => {
    // Keep a copy only of a GOOD answer: an error page (404/500) must never replace the good saved copy. (Files from other
    // sites such as the app's libraries arrive as "opaque" answers; those are kept so the app still opens offline.)
    if (freshResponse && (freshResponse.ok || freshResponse.type === 'opaque')) {
      const clone = freshResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
    }
    return freshResponse;
  });
  event.respondWith((async () => {
    let timer = null;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(NETWORK_TIMEOUT_), NETWORK_WAIT_MS_); });
    try {
      const first = await Promise.race([networkPromise, timeout]);
      if (first !== NETWORK_TIMEOUT_) { clearTimeout(timer); return first; }
      const saved = await caches.match(req);
      if (saved) { event.waitUntil(networkPromise.catch(() => {})); return saved; }   // slow network: show the saved copy now, refresh it in the background
      return await networkPromise;                                                  // nothing saved yet: keep waiting for the network
    } catch (e) {
      clearTimeout(timer);
      const saved = await caches.match(req);                                          // offline / network error: the saved copy
      if (saved) return saved;
      throw e;
    }
  })());
});
