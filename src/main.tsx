
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { syncOfflineData } from "./lib/api";
import { setupAdminAccount } from "./lib/utils";

// Register service worker for PWA with improved caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour ?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Setup offline listeners with improved feedback
if (typeof window !== 'undefined') {
  // Setup network event listeners for online/offline status
  window.addEventListener('online', () => {
    console.log('App is online');
    // Notify the user
    if (document.getElementById('offline-banner')) {
      document.getElementById('offline-banner')?.remove();
    }
    // Sync data that was created while offline
    syncOfflineData()
      .then(() => console.log('Offline data synced successfully'))
      .catch(err => console.error('Error syncing offline data:', err));
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    // Create a banner to notify the user
    if (!document.getElementById('offline-banner')) {
      const banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.style.position = 'fixed';
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.backgroundColor = '#f59e0b';
      banner.style.color = 'white';
      banner.style.padding = '10px';
      banner.style.textAlign = 'center';
      banner.style.zIndex = '9999';
      banner.textContent = 'Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.';
      document.body.appendChild(banner);
    }
  });
}

// Initialize admin account setup if needed
setupAdminAccount();

// Handle mobile back button
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    // Custom handling for mobile back button if needed
    console.log('Navigation back detected', event);
  });
}

// Handle page visibility changes for better mobile UX
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('App is visible, refreshing data');
    // You could trigger data refresh here
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
