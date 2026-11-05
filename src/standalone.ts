import { getIdentity, initializeCore } from '@bcbp-solutions-fzc-llc/frontend-sdk/core'
import { loadRuntimeConfig, setRuntimeConfig, tryGetConfig } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import { getLogger } from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import { APP_ID } from './i18n'

/** The standalone page's identity (registry vocabulary), set as web-shell sets its own. */
export const STANDALONE_IDENTITY = {
  serviceName: 'mfe-dashboard',
  domain: 'portal',
  environment: import.meta.env.PLATFORM_ENVIRONMENT ?? 'local',
  buildVersion: import.meta.env.BUILD_VERSION,
}

/** Where the SDK logger already writes to the console before logging starts. */
const CONSOLE_LOGGING_ENVIRONMENTS = new Set(['local', 'dev', 'test'])

/** How long the standalone page waits for /config/runtime.json before rendering without it. */
export const RUNTIME_CONFIG_TIMEOUT_MS = 5000

/**
 * The standalone page only (main.tsx): with no shell, this page is the host page, so it sets the page
 * identity and the runtime config itself, as web-shell's bootstrap does (SDK 1.0.0-alpha.5). The config
 * gives `auth.signInUrl`, where defaultLogout sends the user, per environment. A missing or invalid
 * /config/runtime.json is logged and the page still renders, with logout falling back to the
 * build-time PUBLIC_APP1_URL. Never rejects, so the page always renders. Inside web-shell this never
 * runs: the shell owns both.
 */
export async function startStandalone(): Promise<void> {
  try {
    initializeCore(STANDALONE_IDENTITY)
    if (tryGetConfig()) return
    setRuntimeConfig(await loadRuntimeConfig({ timeoutMs: RUNTIME_CONFIG_TIMEOUT_MS }))
  } catch (error) {
    const message = 'runtime config unavailable; logout uses the build-time sign-in URL'
    getLogger({ mfe: APP_ID }).warn(message, { error })
    // The standalone page never starts SDK logging (it has no collector), and before that the SDK
    // logger is a no-op outside local, dev and test. Without this, a missing or invalid
    // /config/runtime.json in staging or prod would leave no trace at all.
    if (!CONSOLE_LOGGING_ENVIRONMENTS.has(getIdentity()?.environment ?? 'local')) console.warn(`[app2] ${message}`, error)
  }
}
