import { storage } from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import { describe, expect, it } from 'vitest'
import {
  APP_THEME_OPTIONS,
  auraModeFromAppTheme,
  isAuraTheme,
  isThemeDark,
} from '../../../src/theme/daisyThemes'
import {
  applyAppTheme,
  applyThemeMode,
  logoThemeFromAppTheme,
  readStoredAppTheme,
  readStoredThemeMode,
  toggleThemeMode,
} from '../../../src/theme/themeMode'

const store = () => storage('dashboard')

describe('theme mode', () => {
  it('defaults to light and keeps a stored dark mode', () => {
    expect(readStoredThemeMode()).toBe('light')
    store().set('themeMode', 'dark')
    expect(readStoredThemeMode()).toBe('dark')
    store().set('themeMode', 'nope')
    expect(readStoredThemeMode()).toBe('light')
  })

  it('prefers the stored app theme over the mode key', () => {
    store().set('themeMode', 'dark')
    expect(readStoredAppTheme()).toBe('dark')
    store().set('appTheme', 'cupcake')
    expect(readStoredAppTheme()).toBe('cupcake')
  })

  it('writes aura themes to both keys and leaves daisy themes off the mode key', () => {
    applyAppTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(store().get('appTheme')).toBe('dark')
    expect(store().get('themeMode')).toBe('dark')

    applyThemeMode('light')
    expect(store().get('themeMode')).toBe('light')

    applyAppTheme('cupcake')
    expect(store().get('appTheme')).toBe('cupcake')
    expect(store().get('themeMode')).toBe('light')
  })

  it('toggles light and dark and maps a daisy theme onto the logo mode', () => {
    expect(toggleThemeMode('light')).toBe('dark')
    expect(toggleThemeMode('dark')).toBe('light')
    expect(logoThemeFromAppTheme('light')).toBe('light')
    const daisyDark = APP_THEME_OPTIONS.find(
      (theme) => theme.group === 'daisy' && isThemeDark(theme.id),
    )
    const daisyLight = APP_THEME_OPTIONS.find(
      (theme) => theme.group === 'daisy' && !isThemeDark(theme.id),
    )
    expect(daisyDark).toBeTruthy()
    expect(daisyLight).toBeTruthy()
    expect(auraModeFromAppTheme(daisyDark!.id)).toBe('dark')
    expect(auraModeFromAppTheme(daisyLight!.id)).toBe('light')
    expect(isAuraTheme('light')).toBe(true)
    expect(isAuraTheme('cupcake')).toBe(false)
    expect(isThemeDark('dark')).toBe(true)
    expect(isThemeDark('light')).toBe(false)
    expect(isThemeDark('missing-theme')).toBe(false)
  })
})
