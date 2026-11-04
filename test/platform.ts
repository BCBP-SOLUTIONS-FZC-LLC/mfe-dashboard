import { createTestPlatform } from '@bcbp-solutions-fzc-llc/frontend-sdk/testing'
import { registerMessages } from '../src/i18n'

// Role grants as IAM defines them (iam-org-membership #48, LLD §5.4 P-35 and §10.4) and as web-shell's
// src/platform/permissions.ts is to map them: every member views members, tenant_admin and tenant_owner
// manage them.
export const MEMBER = ['read:tender', 'read:members'] as const
export const TENANT_ADMIN = ['read:tender', 'update:tender', 'delete:tender', 'read:members', 'manage:members'] as const
export const TENANT_OWNER = TENANT_ADMIN

// web-shell's map before that fix: no read:members anywhere, manage:members for tenant_admin only.
export const LEGACY_MEMBER = ['read:tender'] as const
export const LEGACY_TENANT_ADMIN = ['read:tender', 'update:tender', 'delete:tender', 'manage:members'] as const

/** A fresh SDK runtime (as createTestPlatform) with this remote's messages registered again. */
export function startPlatform(o: Parameters<typeof createTestPlatform>[0] = {}) {
  const platform = createTestPlatform({ permissions: TENANT_ADMIN, ...o })
  registerMessages()
  return platform
}
