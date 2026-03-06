
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { syncOfflineData } from "./lib/api";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('Une nouvelle version est disponible. Mettre à jour ?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(error => console.error('SW registration failed:', error));
  });

  // PWA install prompt
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    const installButton = document.getElementById('install-pwa');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        deferredPrompt?.prompt();
        deferredPrompt = null;
      });
    }
  });
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

// Online/offline handling
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    document.getElementById('offline-banner')?.remove();
    syncOfflineData()
      .then(() => console.log('Offline data synced'))
      .catch(err => console.error('Sync error:', err));
  });
  
  window.addEventListener('offline', () => {
    if (!document.getElementById('offline-banner')) {
      const banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f59e0b;color:white;padding:10px;text-align:center;z-index:9999';
      banner.textContent = 'Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.';
      document.body.appendChild(banner);
    }
  });
}

// Refresh data when app becomes visible
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    window.dispatchEvent(new CustomEvent('app-visible'));
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
