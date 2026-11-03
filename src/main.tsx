import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DashboardApp from './DashboardApp'
import { applyAppTheme, readStoredAppTheme } from './theme/themeMode'

applyAppTheme(readStoredAppTheme())

const root = document.getElementById('app')
if (!root) {
  throw new Error('Root element #app not found')
}

createRoot(root).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
)
