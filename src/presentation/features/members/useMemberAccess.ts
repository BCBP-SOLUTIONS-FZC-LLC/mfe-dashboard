import { useHasPermission, useReadOnly } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'

/**
 * What the user may do in User management, as IAM allows it (iam-org-membership LLD §10.4): any
 * active member views the list (`read:members`); tenant_admin and tenant_owner manage it
 * (`manage:members`). Manage implies view, so a shell whose role map has no `read:members` yet
 * still shows the page to those who may manage. A read-only tenant (suspended, trial expired: the
 * SDK's useReadOnly) gets no actions, since IAM answers them with 403. UI hints only: IAM authorises
 * every call.
 */
export function useMemberAccess(): { canView: boolean; canManage: boolean } {
  const canRead = useHasPermission('read', 'members')
  const mayManage = useHasPermission('manage', 'members')
  const readOnly = useReadOnly()
  return { canView: canRead || mayManage, canManage: mayManage && !readOnly }
}
