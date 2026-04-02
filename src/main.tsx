import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Force cache busting for development
if (import.meta.env.DEV) {
  console.log('[DEV] ChatPanel refactor loaded - v2.0')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
