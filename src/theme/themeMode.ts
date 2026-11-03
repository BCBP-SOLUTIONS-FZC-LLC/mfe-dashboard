import {
  type AppThemeId,
  type AuraThemeMode,
  auraModeFromAppTheme,
  isAuraTheme,
} from './daisyThemes'

export type ThemeMode = AuraThemeMode

const STORAGE_KEY = 'bcbp.themeMode'
const APP_THEME_STORAGE_KEY = 'bcbp.appTheme'

export function readStoredAppTheme(): AppThemeId {
  const storedApp = localStorage.getItem(APP_THEME_STORAGE_KEY)
  if (storedApp) {
    return storedApp
  }
  return readStoredThemeMode()
}

export function readStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export function applyAppTheme(themeId: AppThemeId): void {
  document.documentElement.dataset.theme = themeId
  localStorage.setItem(APP_THEME_STORAGE_KEY, themeId)
  if (isAuraTheme(themeId)) {
    localStorage.setItem(STORAGE_KEY, themeId)
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
