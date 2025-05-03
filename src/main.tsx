
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initBillingOnLoad } from './services/billing'

// Initialiser la facturation native si disponible
document.addEventListener('DOMContentLoaded', () => {
  initBillingOnLoad();
});

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service worker registered: ', registration);
      })
      .catch(error => {
        console.error('Service worker registration failed: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
