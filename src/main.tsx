import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts for the standalone page (CSP font-src 'self'). Inside web-shell the shell's
// document provides the fonts; the remote does not ship them.
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import '@fontsource/geist-sans/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import App from './App'
import { applyAppTheme, readStoredAppTheme } from './theme/themeMode'

applyAppTheme(readStoredAppTheme())

const root = document.getElementById('app')
if (!root) {
  throw new Error('Root element #app not found')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
