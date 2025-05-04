
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initBillingOnLoad } from './services/billing'
import { setupNetworkListeners } from './lib/api'

// Initialize network status listeners for offline support
setupNetworkListeners();

// Initialize native billing if available
document.addEventListener('DOMContentLoaded', () => {
  initBillingOnLoad();
});

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service worker registered: ', registration);
        
        // Register for periodic sync if available
        if ('periodicSync' in registration) {
          // Try to register periodic sync to sync data periodically
          navigator.permissions.query({name: 'periodic-background-sync'})
            .then((status) => {
              if (status.state === 'granted') {
                registration.periodicSync.register('sync-data', {
                  minInterval: 24 * 60 * 60 * 1000, // Once a day
                });
              }
            });
        }
      })
      .catch(error => {
        console.error('Service worker registration failed: ', error);
      });
  });
}

// Subscribe to push notifications
function subscribeToPushNotifications() {
  if ('Notification' in window && 'PushManager' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          // Example public key - this should be generated on your server
          const vapidPublicKey = 'BLVYgITkBkv1XZgJqq0j6VXbMgP8bmuSmBZWn5jB1IneP5_8gvohFPcFEVVoU3c74zDwNl4xGQZgpEVEUOXadlI';
          
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          }).then(subscription => {
            // Send subscription to your server
            console.log('Push notification subscription:', subscription);
          }).catch(error => {
            console.error('Push subscription error:', error);
          });
        });
      }
    });
  }
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Ask for notification permission when it makes sense in the user flow
// This is just a placeholder - you should trigger this based on user interaction
// subscribeToPushNotifications();

createRoot(document.getElementById("root")!).render(<App />);
