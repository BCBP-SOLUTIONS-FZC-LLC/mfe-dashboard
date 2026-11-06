// The standalone page when /config/runtime.json is missing (a static host without it, or a bad
// deploy): src/standalone.ts logs a warning and the page still starts; logout falls back to the
// page root (no sign-in URL is compiled in). See standalone-config.test.ts for why this runs in beforeAll.
import { isInitialized } from '@bcbp-solutions-fzc-llc/frontend-sdk/core'
import { tryGetConfig } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { goToSignIn } from '../../../src/infrastructure/auth/signIn'
import { startStandalone } from '../../../src/app/bootstrap/standalone'

const seen: { settled?: boolean; initialized?: boolean; config?: unknown; warnings: string[]; logoutTo?: unknown } = { warnings: [] }

beforeAll(async () => {
  vi.stubGlobal('fetch', async () => new Response('not found', { status: 404 }))
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  seen.settled = await startStandalone().then(() => true, () => false)
  seen.warnings = warn.mock.calls.map((c) => c.map(String).join(' '))
  seen.initialized = isInitialized()
  seen.config = tryGetConfig()
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
  goToSignIn()
  seen.logoutTo = assign.mock.calls[0]?.[0]
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('standalone page without a runtime config', () => {
  it('still starts: the identity is set, there is no config, and nothing throws', () => {
    expect(seen.settled).toBe(true)
    expect(seen.initialized).toBe(true)
    expect(seen.config).toBeUndefined()
  })

  it('warns that the runtime config is unavailable', () => {
    expect(seen.warnings.join('\n')).toContain('runtime config unavailable')
    // In local the SDK logger writes it to the console itself: one line, not a second copy.
    expect(seen.warnings.filter((w) => w.includes('runtime config unavailable'))).toHaveLength(1)
  })

  it('logs out to the page root: no sign-in URL is compiled in', () => {
    expect(seen.logoutTo).toBe('/')
  })
})
