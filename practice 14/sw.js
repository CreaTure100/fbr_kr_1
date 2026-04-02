const CACHE_NAME = "notes-cache-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.json",
  "./icons/favicon.ico",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/favicon-48x48.png",
  "./icons/favicon-64x64.png",
  "./icons/favicon-128x128.png",
  "./icons/favicon-256x256.png",
  "./icons/favicon-512x512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    const url = new URL(event.request.url);

    // 1) Сначала обычный поиск в кэше
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;

    try {
      // 2) Пытаемся сеть
      const network = await fetch(event.request);
      return network;
    } catch (e) {
      // 3) Если офлайн и это переход на страницу — отдаем index.html
      if (event.request.mode === "navigate") {
        const fallback = await caches.match("./index.html");
        if (fallback) return fallback;
      }

      // 4) Для остальных запросов — пробуем путь без query
      const cleanRequest = new Request(url.origin + url.pathname, {
        method: "GET",
        headers: event.request.headers
      });
      const cleanCached = await caches.match(cleanRequest, { ignoreSearch: true });
      if (cleanCached) return cleanCached;

      return new Response("Offline", { status: 503, statusText: "Offline" });
    }
  })());
});