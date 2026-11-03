import { createTestPlatform } from '@bcbp-solutions-fzc-llc/frontend-sdk/testing'
import { registerMessages } from '../src/i18n'

/** web-shell's tenant_admin grants (src/platform/permissions.ts): every view and user management. */
export const TENANT_ADMIN = ['read:tender', 'update:tender', 'delete:tender', 'manage:members'] as const
/** web-shell's member grants: no user management. */
export const MEMBER = ['read:tender'] as const

/** A fresh SDK runtime (as createTestPlatform) with this remote's messages registered again. */
export function startPlatform(o: Parameters<typeof createTestPlatform>[0] = {}) {
  const platform = createTestPlatform({ permissions: TENANT_ADMIN, ...o })
  registerMessages()
  return platform
}
