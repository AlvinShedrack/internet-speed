const CACHE_NAME = "speed-monitor-v4";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {

  // ❌ DO NOT cache test file
  if (event.request.url.includes("px.gif")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(res => {
      if (res) {
        return res;
      }
      return fetch(event.request).catch(error => {
        console.error('Fetch failed:', error);
        // Return a basic offline response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // For other requests, return a simple error response
        return new Response('Network error: Unable to fetch resource', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});