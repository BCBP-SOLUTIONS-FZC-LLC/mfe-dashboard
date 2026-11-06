// Where the user goes after logging out of the standalone page (no shell signs them out). Runtime
// configuration only (the constitution's "build once, deploy everywhere"): the environment's
// runtime.json names it as auth.signInUrl. Without one, the standalone page reloads at its root.
import { tryGetConfig } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'

/** The sign-in page from the runtime config, without a trailing slash; '/' when there is none. */
export function signInUrl(): string {
  return tryGetConfig()?.auth.signInUrl?.replace(/\/$/, '') || '/'
}

/** Leaves for the sign-in page (a full navigation: it is another application). */
export function goToSignIn(): void {
  window.location.assign(signInUrl())
}
