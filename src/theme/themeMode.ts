import { storage } from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import { APP_ID } from '../i18n'
import {
  type AppThemeId,
  type AuraThemeMode,
  auraModeFromAppTheme,
  isAuraTheme,
} from './daisyThemes'

export type ThemeMode = AuraThemeMode

// Through the SDK's storage: namespaced per workspace and cleared on logout and workspace switch.
// Before sign-in (standalone) the SDK stores nothing, so the theme resets on reload there.
const THEME_MODE_KEY = 'themeMode'
const APP_THEME_KEY = 'appTheme'

export function readStoredAppTheme(): AppThemeId {
  return storage(APP_ID).get<AppThemeId>(APP_THEME_KEY) ?? readStoredThemeMode()
}

export function readStoredThemeMode(): ThemeMode {
  return storage(APP_ID).get<ThemeMode>(THEME_MODE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyAppTheme(themeId: AppThemeId): void {
  document.documentElement.dataset.theme = themeId
  const store = storage(APP_ID)
  store.set(APP_THEME_KEY, themeId)
  if (isAuraTheme(themeId)) {
    store.set(THEME_MODE_KEY, themeId)
  }
}
export function applyThemeMode(mode: ThemeMode): void {
  applyAppTheme(mode)
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'light' ? 'dark' : 'light'
}

export function logoThemeFromAppTheme(themeId: AppThemeId): ThemeMode {
  return auraModeFromAppTheme(themeId)
}

export const dashShellClass = 'bg-aura-canvas text-aura-text'

export const dashSurfaceClass = 'bg-aura-surface'

export const dashBorderClass = 'border-aura-border'

export const dashSidebarClass = 'bg-aura-surface border-r border-aura-border'

export const dashHeaderClass =
  'bg-aura-surface border-b border-aura-border shadow-dash'
