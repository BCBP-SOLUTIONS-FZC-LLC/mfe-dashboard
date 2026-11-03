import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { startPlatform } from './platform'

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

// Every test runs against a fresh SDK runtime: signed in, with web-shell's tenant_admin grants and
// this remote's messages loaded.
beforeEach(async () => {
  startPlatform()
  await new Promise((resolve) => setTimeout(resolve, 0))
})

afterEach(() => {
  cleanup()
  stores.clear()
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
