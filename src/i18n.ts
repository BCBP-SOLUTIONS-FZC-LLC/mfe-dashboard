// This remote's message namespace for the SDK's i18n (`useT(APP_ID)`). English is the only catalog
// so far; t() falls back to it, then to the key, for any other locale the shell negotiates.
import { registerNamespace } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import en from './locales/en.json'

/** The remote's name: its i18n namespace, its storage app id and its MFE label. */
export const APP_ID = 'dashboard'

/** Registers the catalogs with the SDK runtime (once per runtime; tests start a fresh one each). */
export function registerMessages(): void {
  registerNamespace(APP_ID, async (locale) => (locale.split('-')[0] === 'en' ? en : {}))
}

registerMessages()
