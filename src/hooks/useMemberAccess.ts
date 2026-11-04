import { useHasPermission } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'

/**
 * What the user may do in User management, as IAM allows it (iam-org-membership LLD §10.4): any
 * active member views the list (`read:members`); tenant_admin and tenant_owner manage it
 * (`manage:members`). Manage implies view, so a shell whose role map has no `read:members` yet
 * still shows the page to those who may manage. UI hints only: IAM authorises every call.
 */
export function useMemberAccess(): { canView: boolean; canManage: boolean } {
  const canRead = useHasPermission('read', 'members')
  const canManage = useHasPermission('manage', 'members')
  return { canView: canRead || canManage, canManage }
}
