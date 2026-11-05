import { initializeI18n, setLocale, t } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import { createTestPlatform } from '@bcbp-solutions-fzc-llc/frontend-sdk/testing'
import { describe, expect, it } from 'vitest'
import { APP_ID, registerMessages } from '../../../src/i18n'

describe('dashboard messages', () => {
  it('formats plurals through the SDK', () => {
    expect(t(APP_ID, 'lastUpdated.ago', { mins: 1 })).toBe('Last updated: 1 min ago')
    expect(t(APP_ID, 'lastUpdated.ago', { mins: 4 })).toBe('Last updated: 4 mins ago')
  })

  it('falls back to English in a locale without a catalog', async () => {
    // As web-shell's bootstrap does, with a locale this remote has no catalog for.
    createTestPlatform()
    registerMessages()
    await initializeI18n({ defaultLocale: 'en', supported: ['en', 'ar'] })
    await setLocale('ar')
    expect(t(APP_ID, 'lastUpdated.pending')).toBe('Updating…')
  })
})
