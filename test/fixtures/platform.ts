import { createTestPlatform } from '@bcbp-solutions-fzc-llc/frontend-sdk/testing'
import { registerMessages } from '../../src/app/configuration/i18n'

// Permission sets as the dashboard checks them. Which roles get which permission is web-shell's role
// map (src/platform/permissions.ts, after IAM LLD §10.4); these tests do not copy it, so they cannot
// drift from it. They cover every combination the dashboard distinguishes.
type Grant = `${string}:${string}`

/** Sees every view and may manage members. */
export const MANAGER: readonly Grant[] = ['read:tender', 'read:members', 'manage:members']
/** Sees every view and the member list, without member actions. */
export const VIEWER: readonly Grant[] = ['read:tender', 'read:members']
/** manage:members without read:members (it implies viewing). */
export const MANAGE_ONLY: readonly Grant[] = ['read:tender', 'manage:members']
/** No member access at all. */
export const NO_MEMBER_ACCESS: readonly Grant[] = ['read:tender']

/** A fresh SDK runtime (as createTestPlatform) with this remote's messages registered again. */
export function startPlatform(o: Parameters<typeof createTestPlatform>[0] = {}) {
  const platform = createTestPlatform({ permissions: MANAGER, ...o })
  registerMessages()
  return platform
}
