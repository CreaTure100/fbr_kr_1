const CACHE_NAME = 'notes-shell-v16';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v16';

const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './content/home.html',
  './content/about.html',
  './icons/favicon.ico',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/favicon-48x48.png',
  './icons/favicon-64x64.png',
  './icons/favicon-128x128.png',
  './icons/favicon-256x256.png',
  './icons/favicon-512x512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/content/home.html') || url.pathname.endsWith('/content/about.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || caches.match('./content/home.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(async () => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '', reminderId: null };
  if (event.data) data = event.data.json();

  const options = {
    body: data.body,
    icon: './icons/favicon-128x128.png',
    badge: './icons/favicon-48x48.png',
    data: { reminderId: data.reminderId }
  };

  if (data.reminderId) {
    options.actions = [
      { action: 'snooze_10s', title: 'Отложить на 10 сек' },
      { action: 'snooze_5m', title: 'Отложить на 5 минут' }
    ];
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const reminderId = notification.data?.reminderId;
  if (action === 'snooze_10s') {
    event.waitUntil(
      fetch(`http://localhost:3001/snooze?reminderId=${reminderId}&delay=10`, { method: 'POST' })
        .then(() => notification.close())
        .catch((err) => console.error('Snooze 10s failed:', err))
    );
    return;
  }

  if (action === 'snooze_5m') {
    event.waitUntil(
      fetch(`http://localhost:3001/snooze?reminderId=${reminderId}&delay=300`, { method: 'POST' })
        .then(() => notification.close())
        .catch((err) => console.error('Snooze 5m failed:', err))
    );
    return;
  }

  notification.close();
});