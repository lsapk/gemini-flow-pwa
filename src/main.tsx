
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { syncOfflineData } from "./lib/api";
import { setupAdminAccount } from "./lib/utils";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Setup offline listeners
if (typeof window !== 'undefined') {
  // Setup network event listeners for online/offline status
  window.addEventListener('online', () => {
    console.log('App is online');
    syncOfflineData().catch(console.error);
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
  });
}

// Initialize admin account setup if needed
setupAdminAccount();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
