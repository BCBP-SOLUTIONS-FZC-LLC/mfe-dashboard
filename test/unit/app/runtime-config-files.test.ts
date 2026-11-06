// The runtime config files this repo ships pass the SDK's own schema (strict: an unknown key, or a
// URL not in normal form such as 'http://localhost:5001' without its '/', rejects the whole file, and
// the page then runs with no config). public/config/runtime.json is the image's default;
// config/runtime.local.json is the dev server's.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RuntimeConfigSchema } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../../..')
const read = (file: string) => JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as unknown

describe('shipped runtime config files', () => {
  it.each(['public/config/runtime.json', 'config/runtime.local.json'])('%s passes the SDK schema', (file) => {
    const result = RuntimeConfigSchema.safeParse(read(file))
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true)
  })

  it('the dev config names the local environment and the local web-shell as the sign-in page', () => {
    const local = RuntimeConfigSchema.parse(read('config/runtime.local.json'))
    expect(local.environment).toBe('local')
    expect(local.auth.signInUrl).toBe('http://localhost:5001/')
  })

  it('the image default names no environment and no sign-in page (each environment mounts its own)', () => {
    const shipped = RuntimeConfigSchema.parse(read('public/config/runtime.json'))
    expect(shipped.environment).toBeUndefined()
    expect(shipped.auth.signInUrl).toBeUndefined()
  })
})
