const CACHE_NAME = 'deepflow-v4';
const STATIC_CACHE_NAME = 'deepflow-static-v4';
const DATA_CACHE_NAME = 'deepflow-data-v4';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Installation du service worker avec mise en cache des ressources importantes
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation completed');
        return self.skipWaiting();
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Stratégie de cache améliorée: Network First puis cache pour les API
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.method !== 'GET') {
    return;
  }
  
  // For API requests, use Network First strategy
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/v1/') || 
      event.request.url.includes('/storage/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If valid response, clone it and store in cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets, use Cache First strategy
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              // If valid response, add to cache
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(() => {
              // If fetch fails, return fallback or error
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/offline.html') || caches.match('/index.html');
              }
              
              return new Response('Network error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }

  // For HTML pages, use Network First strategy with improved fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the HTML page for offline use
        caches.open(STATIC_CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html') || caches.match('/index.html');
          });
      })
  );
});

// Synchronisation en arrière-plan pour les opérations en attente
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // This function will be called when online connectivity is restored
  try {
    // Send a message to the client to trigger synchronization
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_REQUIRED'
        });
      });
    });
    
    console.log('Background sync completed');
    return true;
  } catch (err) {
    console.error('Background sync failed:', err);
    return false;
  }
}

// Handle push notifications with improved security
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = JSON.parse(event.data.text());
    
    // Sanitize notification data for security
    const sanitizedTitle = (data.title || 'DeepFlow').replace(/[<>]/g, '');
    const sanitizedBody = (data.body || 'Nouvelle notification').replace(/[<>]/g, '');
    
    const options = {
      body: sanitizedBody,
      icon: '/icons/icon-192x192.png',
      badge: '/favicon.ico',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'explore', title: 'Voir' },
        { action: 'close', title: 'Fermer' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(sanitizedTitle, options)
    );
  } catch (err) {
    console.error('Error showing notification:', err);
  }
});

// Handle notification clicks with improved security
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Ensure URL is safe by constraining it to our origin
  const urlToOpen = new URL(
    event.notification.data.url || '/',
    self.location.origin
  ).href;
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});

// Periodic background sync for keeping data fresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshData());
  }
});

async function refreshData() {
  try {
    // Send a message to the client to refresh data
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'REFRESH_DATA'
        });
      });
    });
    
    console.log('Periodic data refresh completed');
    return true;
  } catch (err) {
    console.error('Periodic data refresh failed:', err);
    return false;
  }
}
