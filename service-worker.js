// service-worker.js

const CACHE_NAME = 'shift-calendar-cache-v1';
// List of files to cache
const urlsToCache = [
  './', // Caches the root URL, which typically serves index.html
  './index.html',
  './manifest.json',
  // Assuming you create an 'icons' folder and place these images there
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // External resources (like Tailwind CSS CDN) should generally NOT be cached by your service worker
  // unless you have a very specific reason and handle their updates carefully.
  // For this app, they are loaded via CDN, so we rely on browser's own caching for them.
];

// Install event: Caches all essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache during install:', error);
      })
  );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Intercepts network requests and serves from cache or fetches from network
self.addEventListener('fetch', (event) => {
  // Only handle requests for URLs that we explicitly want to cache and serve offline
  const url = new URL(event.request.url);
  const isCachableAsset = urlsToCache.some(cachedUrl => url.pathname === new URL(cachedUrl, self.location.origin).pathname);

  if (isCachableAsset) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // If response is found in cache, return it
          if (response) {
            console.log('Service Worker: Serving from cache:', event.request.url);
            return response;
          }
          // Otherwise, fetch from network
          console.log('Service Worker: Fetching from network:', event.request.url);
          return fetch(event.request);
        })
        .catch((error) => {
          // Fallback for network failures or no cache match
          console.error('Service Worker: Fetch failed for:', event.request.url, error);
          // You could return a generic offline page here if you had one
          // return caches.match('/offline.html');
        })
    );
  } else {
    // For other requests (e.g., external CDNs like Tailwind), just proceed with network fetch
    event.respondWith(fetch(event.request));
  }
});
