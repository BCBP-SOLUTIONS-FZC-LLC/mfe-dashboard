// A built (production) standalone page whose /config/runtime.json is missing: it runs as the
// fallback environment, prod, and its warning still reaches the console, because the SDK (alpha.6)
// writes warn and error there while logging is off, in every environment. No console call of our
// own. See standalone-config.test.ts for why this is beforeAll.
import { beforeAll, describe, expect, it, vi } from 'vitest'

const seen: { environment?: string; warnings: string[] } = { warnings: [] }

beforeAll(async () => {
  vi.stubEnv('DEV', false)
  vi.stubGlobal('fetch', async () => new Response('not found', { status: 404 }))
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  // Imported after stubbing: FALLBACK_ENVIRONMENT reads import.meta.env.DEV when the module loads.
  const { startStandalone } = await import('../../../src/app/bootstrap/standalone')
  const { getIdentity } = await import('@bcbp-solutions-fzc-llc/frontend-sdk/core')
  await startStandalone()
  seen.environment = getIdentity()?.environment
  seen.warnings = warn.mock.calls.map((c) => String(c[0]))
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('production standalone page without a runtime config', () => {
  it('runs as the fallback environment, prod', () => {
    expect(seen.environment).toBe('prod')
  })

  it('warns on the console once, through the SDK logger', () => {
    expect(seen.warnings.filter((w) => w.includes('runtime config unavailable'))).toHaveLength(1)
  })
})
