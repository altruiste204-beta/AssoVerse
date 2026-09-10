import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './lib/i18n'
import App from './App'

// Safe Service Worker registration for PWA offline & push capabilities
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // In production, workbox produces /sw.js. In dev / fallback, /custom-sw.js is available
    const swUrl = import.meta.env.PROD ? '/sw.js' : '/custom-sw.js'
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Fallback if needed
      navigator.serviceWorker.register('/custom-sw.js').catch(() => {})
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
