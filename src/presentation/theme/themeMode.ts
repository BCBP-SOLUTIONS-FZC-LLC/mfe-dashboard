// How the theme looks on the page (data-theme, the shared surface classes). Storing the user's
// choice is infrastructure: src/infrastructure/storage/themePreference.ts.
import { type AppThemeId, type AuraThemeMode, auraModeFromAppTheme } from '../../shared/ui/themes'

export type ThemeMode = AuraThemeMode

/** Shows `themeId` on the page without storing it (on mount, when nothing changed). */
export function showAppTheme(themeId: AppThemeId): void {
  document.documentElement.dataset.theme = themeId
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

export const dashSidebarClass = 'bg-aura-surface border-e border-aura-border'

export const dashHeaderClass =
  'bg-aura-surface border-b border-aura-border shadow-dash'
