import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts for the standalone page (CSP font-src 'self'): the same packages and family
// names as web-shell (bootstrap.tsx), so the remote looks the same inside the shell, where the
// shell's document provides them and the remote ships none.
import '@fontsource-variable/geist'
import '@fontsource-variable/inter'
import { MFEErrorBoundary } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import App from '../App'
import { APP_ID } from '../../shared/constants/app'
import { startStandalone } from './standalone'
import { readStoredAppTheme } from '../../infrastructure/storage/themePreference'
import { showAppTheme } from '../../presentation/theme/themeMode'

showAppTheme(readStoredAppTheme())

const root = document.getElementById('app')
if (!root) {
  throw new Error('Root element #app not found')
}

// No shell here: set the page identity and runtime config first (startStandalone never rejects).
void startStandalone().then(() =>
  createRoot(root).render(
    <StrictMode>
      {/* Standalone has no shell RemoteBoundary: the SDK's boundary logs a render error and shows its fallback instead of a blank page. */}
      <MFEErrorBoundary mfe={APP_ID}>
        <App />
      </MFEErrorBoundary>
    </StrictMode>,
  ),
)
