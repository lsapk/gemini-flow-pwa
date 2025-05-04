
const CACHE_NAME = 'deepflow-v2';
const STATIC_CACHE_NAME = 'deepflow-static-v2';
const DATA_CACHE_NAME = 'deepflow-data-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js',
  '/favicon.ico'
];

// Installation du service worker avec mise en cache des ressources importantes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Stratégie de cache: Network First puis cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('/supabase/') ||
      event.request.method !== 'GET') {
    return;
  }
  
  // For API requests, use Network only
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/v1/') || 
      event.request.url.includes('/storage/v1/')) {
    // Let these go straight to network
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
                return caches.match('/index.html'); // Fallback for HTML
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

  // For HTML pages, use Network First strategy
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
            return cachedResponse || caches.match('/index.html');
          });
      })
  );
});

// Nettoyage des anciens caches lors de l'activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients so the service worker is in control immediately
  return self.clients.claim();
});

// Synchronisation en arrière-plan pour les opérations en attente
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // This function will be called when online connectivity is restored
  // and will attempt to sync any pending data
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

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouvelle notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'DeepFlow', options)
    );
  } catch (err) {
    console.error('Error showing notification:', err);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
