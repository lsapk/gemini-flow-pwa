
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

  // Add event to handle PWA beforeinstallprompt
  let deferredPrompt: any;
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    console.log('PWA installation prompt captured');
    
    // Maybe show your own install button somewhere in your app
    const installButton = document.getElementById('install-pwa');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      });
    }
    
    // Auto prompt after 3 seconds if user is not yet on mobile
    if (!navigator.userAgent.match(/iPhone|Android/i)) {
      setTimeout(() => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            console.log('User responded to auto-prompt:', choiceResult.outcome);
            deferredPrompt = null;
          });
        }
      }, 3000);
    }
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
    // Trigger data refresh for better UX
    window.dispatchEvent(new CustomEvent('app-visible'));
  }
});

// Force portrait mode on small devices for better UX
if (window.matchMedia("(max-width: 480px)").matches) {
  if ('orientation' in screen) {
    screen.orientation.lock('portrait').catch((error) => {
      // It's okay if this fails, it's just a suggestion
      console.log('Could not lock orientation:', error);
    });
  }
}

// Add the futuristic glow effect
const addGlowEffect = () => {
  const glowContainer = document.createElement('div');
  glowContainer.style.position = 'fixed';
  glowContainer.style.top = '0';
  glowContainer.style.left = '0';
  glowContainer.style.width = '100%';
  glowContainer.style.height = '100%';
  glowContainer.style.pointerEvents = 'none';
  glowContainer.style.zIndex = '-1';
  glowContainer.style.overflow = 'hidden';
  
  const glow1 = document.createElement('div');
  glow1.style.position = 'absolute';
  glow1.style.top = '-10%';
  glow1.style.left = '25%';
  glow1.style.width = '30vw';
  glow1.style.height = '30vw';
  glow1.style.borderRadius = '50%';
  glow1.style.background = 'radial-gradient(circle, rgba(96, 119, 245, 0.3) 0%, rgba(0, 0, 0, 0) 70%)';
  glow1.style.filter = 'blur(30px)';
  
  const glow2 = document.createElement('div');
  glow2.style.position = 'absolute';
  glow2.style.bottom = '-10%';
  glow2.style.right = '25%';
  glow2.style.width = '30vw';
  glow2.style.height = '30vw';
  glow2.style.borderRadius = '50%';
  glow2.style.background = 'radial-gradient(circle, rgba(96, 119, 245, 0.2) 0%, rgba(0, 0, 0, 0) 70%)';
  glow2.style.filter = 'blur(30px)';
  
  glowContainer.appendChild(glow1);
  glowContainer.appendChild(glow2);
  document.body.appendChild(glowContainer);
  
  // Add subtle animation
  let animationFrame: number;
  const animateGlow = () => {
    const time = Date.now() / 5000;
    
    glow1.style.transform = `translate(${Math.sin(time) * 10}px, ${Math.cos(time) * 10}px)`;
    glow2.style.transform = `translate(${Math.cos(time) * 10}px, ${Math.sin(time) * 10}px)`;
    
    animationFrame = requestAnimationFrame(animateGlow);
  };
  
  animateGlow();
  
  // Clean up
  return () => {
    cancelAnimationFrame(animationFrame);
    if (document.body.contains(glowContainer)) {
      document.body.removeChild(glowContainer);
    }
  };
};

// Add futuristic glow effect
const cleanupGlow = addGlowEffect();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
