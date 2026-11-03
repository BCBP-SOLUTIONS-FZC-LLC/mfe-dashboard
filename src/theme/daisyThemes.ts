import daisyThemes from 'daisyui/theme/object.js'

export type AuraThemeMode = 'light' | 'dark'

export type AppThemeId = AuraThemeMode | string

const daisyThemeRecord = daisyThemes as Record<string, { 'color-scheme'?: string }>

const daisyThemeIds = Object.keys(daisyThemeRecord)
  .filter((id) => id !== 'light' && id !== 'dark')
  .sort()

function formatThemeLabel(id: string): string {
  return id
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export type AppThemeOption = {
  id: AppThemeId
  label: string
  group: 'aura' | 'daisy'
}

export const APP_THEME_OPTIONS: AppThemeOption[] = [
  { id: 'light', label: 'Light mode', group: 'aura' },
  { id: 'dark', label: 'Dark mode', group: 'aura' },
  ...daisyThemeIds.map((id) => ({
    id,
    label: formatThemeLabel(id),
    group: 'daisy' as const,
  })),
]

export function isAuraTheme(themeId: AppThemeId): themeId is AuraThemeMode {
  return themeId === 'light' || themeId === 'dark'
}

export function isThemeDark(themeId: AppThemeId): boolean {
  if (themeId === 'dark') {
    return true
  }
  if (themeId === 'light') {
    return false
  }
  const theme = daisyThemeRecord[themeId]
  return theme?.['color-scheme'] === 'dark'
}

export function auraModeFromAppTheme(themeId: AppThemeId): AuraThemeMode {
  return isThemeDark(themeId) ? 'dark' : 'light'
}
