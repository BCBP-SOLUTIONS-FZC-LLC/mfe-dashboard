import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { createTestPlatform } from '@bcbp-solutions-fzc-llc/frontend-sdk/testing'
import { afterEach, beforeEach, vi } from 'vitest'
import { registerMessages } from '../src/i18n'

// createTestPlatform signs a user in but sets no storage workspace (only the OIDC provider does), so
// the real storage() would write nothing. Stand in an in-memory one with the same AppStorage contract.
const stores = vi.hoisted(() => new Map<string, Map<string, string>>())
vi.mock('@bcbp-solutions-fzc-llc/frontend-sdk/storage', () => ({
  storage: (appId: string) => {
    const m = stores.get(appId) ?? stores.set(appId, new Map()).get(appId)!
    return {
      get: (k: string) => (m.has(k) ? JSON.parse(m.get(k)!) : undefined),
      set: (k: string, v: unknown) => (v === undefined ? m.delete(k) : m.set(k, JSON.stringify(v))),
      remove: (k: string) => m.delete(k),
      clear: () => m.clear(),
    }
  },
}))

// Every test runs against a fresh SDK runtime: signed in (so storage() persists), allowed to read
// tenders as every web-shell role is, with this remote's messages loaded.
beforeEach(async () => {
  createTestPlatform({ permissions: ['read:tender'] })
  registerMessages()
  await new Promise((resolve) => setTimeout(resolve, 0))
})

afterEach(() => {
  cleanup()
  stores.clear()
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
