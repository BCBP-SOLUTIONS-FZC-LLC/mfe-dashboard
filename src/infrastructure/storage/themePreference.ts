// The user's theme choice, kept with the platform SDK's storage(): namespaced per workspace and
// cleared on logout and workspace switch. Before sign-in (standalone) the SDK stores nothing, so the
// theme resets on reload there.
import { storage } from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import { type AppThemeId, type AuraThemeMode, isAuraTheme } from '../../shared/ui/themes'
import { APP_ID } from '../../shared/constants/app'

type ThemeMode = AuraThemeMode

const THEME_MODE_KEY = 'themeMode'
const APP_THEME_KEY = 'appTheme'

export function readStoredAppTheme(): AppThemeId {
  return storage(APP_ID).get<AppThemeId>(APP_THEME_KEY) ?? readStoredThemeMode()
}

export function readStoredThemeMode(): ThemeMode {
  return storage(APP_ID).get<ThemeMode>(THEME_MODE_KEY) === 'dark' ? 'dark' : 'light'
}

/** Stores the user's choice (the SDK ignores writes while nobody is signed in). */
export function saveAppTheme(themeId: AppThemeId): void {
  const store = storage(APP_ID)
  store.set(APP_THEME_KEY, themeId)
  if (isAuraTheme(themeId)) {
    store.set(THEME_MODE_KEY, themeId)
  }
}

