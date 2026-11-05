import { initializeCore } from '@bcbp-solutions-fzc-llc/frontend-sdk/core'
import { loadRuntimeConfig, setRuntimeConfig, tryGetConfig, type RuntimeConfig } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import { getLogger } from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import { APP_ID } from './i18n'

/**
 * The environment when /config/runtime.json does not name one (or cannot be loaded): local on the
 * dev server, prod in a build. Each deployed runtime.json names its own environment, so one build
 * serves every environment (SDK 1.0.0-alpha.6, as its example shell).
 */
export const FALLBACK_ENVIRONMENT = import.meta.env.DEV ? 'local' : 'prod'

/** The standalone page's identity (registry vocabulary) in `environment`, as web-shell sets its own. */
export function standaloneIdentity(environment: string) {
  return { serviceName: 'mfe-dashboard', domain: 'portal', environment, buildVersion: import.meta.env.BUILD_VERSION }
}

/** How long the standalone page waits for /config/runtime.json before rendering without it. */
export const RUNTIME_CONFIG_TIMEOUT_MS = 5000

/**
 * The standalone page only (main.tsx): with no shell, this page is the host page, so it does what
 * web-shell's bootstrap does, in the SDK's order: load /config/runtime.json, set the page identity
 * with the file's `environment`, then set the config. The config gives `auth.signInUrl`, where
 * defaultLogout sends the user. A missing or invalid file is a `warn` (the SDK writes warnings to
 * the console while logging is off, in every environment) and the page still renders, as
 * FALLBACK_ENVIRONMENT, with logout falling back to the build-time PUBLIC_APP1_URL. Never rejects.
 * Inside web-shell this never runs: the shell owns both.
 */
export async function startStandalone(): Promise<void> {
  let config: RuntimeConfig | undefined = tryGetConfig()
  let failure: unknown
  if (!config) {
    try {
      config = await loadRuntimeConfig({ timeoutMs: RUNTIME_CONFIG_TIMEOUT_MS })
    } catch (error) {
      failure = error
    }
  }
  try {
    initializeCore(standaloneIdentity(config?.environment ?? FALLBACK_ENVIRONMENT))
    if (config && !tryGetConfig()) setRuntimeConfig(config)
  } catch (error) {
    failure = error
  }
  if (failure !== undefined) {
    getLogger({ mfe: APP_ID }).warn('runtime config unavailable; logout uses the build-time sign-in URL', { error: failure })
  }
}
