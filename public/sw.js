
const CACHE_NAME = 'deepflow-v7';
const STATIC_CACHE_NAME = 'deepflow-static-v7';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Sensitive endpoints that must NEVER be cached
const NEVER_CACHE_PATTERNS = [
  '/auth/v1/',
  '/rest/v1/',
  '/storage/v1/',
  '/functions/v1/',
  '/realtime/',
  'supabase.co'
];

function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation and cleanup
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET' || !url.startsWith(self.location.origin)) {
    return;
  }

  // NETWORK-ONLY for sensitive endpoints — never cache auth/API/storage
  if (shouldNeverCache(url)) {
    return; // Let browser handle natively, no cache involvement
  }

  // CACHE-FIRST for static assets
  if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 408 });
        });
      })
    );
    return;
  }

  // NETWORK-FIRST for HTML pages
  event.respondWith(
    fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || caches.match('/offline.html') || caches.match('/index.html');
      });
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_REQUIRED' }));
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = JSON.parse(event.data.text());
    const sanitizedTitle = (data.title || 'DeepFlow').replace(/[<>]/g, '');
    const sanitizedBody = (data.body || 'Nouvelle notification').replace(/[<>]/g, '');
    event.waitUntil(
      self.registration.showNotification(sanitizedTitle, {
        body: sanitizedBody,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: { url: data.url || '/' },
        vibrate: [100, 50, 100],
      })
    );
  } catch (err) {
    // Silently fail
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;
  event.waitUntil(clients.openWindow(urlToOpen));
});
