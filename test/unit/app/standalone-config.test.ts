// The standalone page is its own host page (SDK 1.0.0-alpha.5): src/standalone.ts sets the page
// identity and loads /config/runtime.json, and logout then goes to auth.signInUrl. Each test file
// has its own SDK, and setup.ts builds the test platform in beforeEach, so beforeAll here sees the
// page as main.tsx does: no identity and no config yet.
import { getIdentity } from '@bcbp-solutions-fzc-llc/frontend-sdk/core'
import { tryGetConfig } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defaultLogout } from '../../../src/layouts/AppShellLayout'
import { startStandalone } from '../../../src/standalone'

const shipped = JSON.parse(readFileSync(join(__dirname, '../../../public/config/runtime.json'), 'utf8')) as {
  auth: Record<string, unknown>
}
const requested: string[] = []
const seen: { identity?: ReturnType<typeof getIdentity>; signInUrl?: string; logoutTo?: unknown } = {}

beforeAll(async () => {
  const config = { ...shipped, auth: { ...shipped.auth, signInUrl: 'https://app.test.example.com/' } }
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    requested.push(String(input instanceof Request ? input.url : input))
    return new Response(JSON.stringify(config), { headers: { 'content-type': 'application/json' } })
  })
  await startStandalone()
  seen.identity = getIdentity()
  seen.signInUrl = tryGetConfig()?.auth.signInUrl
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
  defaultLogout()
  seen.logoutTo = assign.mock.calls[0]?.[0]
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('standalone page with a runtime config', () => {
  it('sets the page identity as mfe-dashboard in the portal domain', () => {
    expect(seen.identity).toMatchObject({ serviceName: 'mfe-dashboard', domain: 'portal', environment: 'local' })
  })

  it('loads /config/runtime.json once and sets it', () => {
    expect(requested).toHaveLength(1)
    expect(requested[0]).toMatch(/\/config\/runtime\.json$/)
    expect(seen.signInUrl).toBe('https://app.test.example.com/')
  })

  it('logs out to auth.signInUrl, before the build-time PUBLIC_APP1_URL', () => {
    expect(seen.logoutTo).toBe('https://app.test.example.com')
  })
})
