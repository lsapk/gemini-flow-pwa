
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { syncOfflineData } from "./lib/api";
import { setupAdminAccount } from "./lib/utils";

// Setup offline listeners
if (typeof window !== 'undefined') {
  // Setup network event listeners for online/offline status
  window.addEventListener('online', () => {
    syncOfflineData().catch(console.error);
  });
}

// Initialize admin account setup if needed
setupAdminAccount();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
