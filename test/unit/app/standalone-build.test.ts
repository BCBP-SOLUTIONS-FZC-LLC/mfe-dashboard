// rsbuild.config.ts: the standalone page links its own files root-absolute. The preset's
// assetPrefix 'auto' (needed by the remote) would make them relative, and a reload of a nested route
// (/dashboard/user-management) would then load /dashboard/assets/… and get index.html back.
import { describe, expect, it } from 'vitest'
import config from '../../../rsbuild.config'

describe('standalone build', () => {
  it('uses assetPrefix "/", so nested routes load /assets/… and /favicon.png', () => {
    expect(config.environments?.standalone?.output?.assetPrefix).toBe('/')
  })

  it('leaves the remote to the preset (its files resolve from wherever remoteEntry.js was loaded)', () => {
    expect(config.environments?.remote?.output?.assetPrefix).toBeUndefined()
  })
})
