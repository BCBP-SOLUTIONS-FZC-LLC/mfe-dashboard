// A standalone page in the test environment whose /config/runtime.json is missing. Before logging starts, the
// SDK logger is a no-op outside local and dev, so src/standalone.ts also warns on the console;
// otherwise a bad mount would leave no trace. See standalone-config.test.ts for why this is beforeAll.
import { beforeAll, describe, expect, it, vi } from 'vitest'

const seen: { environment?: string; warnings: string[] } = { warnings: [] }

beforeAll(async () => {
  vi.stubEnv('PLATFORM_ENVIRONMENT', 'test')
  vi.stubGlobal('fetch', async () => new Response('not found', { status: 404 }))
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  // Imported after stubbing: the identity reads PLATFORM_ENVIRONMENT when the module loads.
  const { startStandalone } = await import('../../../src/standalone')
  const { getIdentity } = await import('@bcbp-solutions-fzc-llc/frontend-sdk/core')
  await startStandalone()
  seen.environment = getIdentity()?.environment
  seen.warnings = warn.mock.calls.map((c) => String(c[0]))
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('test-environment standalone page without a runtime config', () => {
  it('runs as test', () => {
    expect(seen.environment).toBe('test')
  })

  it('warns on the console once, where the SDK logger stays silent', () => {
    expect(seen.warnings).toEqual(['[dashboard] runtime config unavailable; logout uses the build-time sign-in URL'])
  })
})
