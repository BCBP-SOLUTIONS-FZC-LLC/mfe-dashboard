// The remote's routes under the shell's /t/<slug>/dashboard (or / standalone): the layout, the
// dashboard and User management (only for members who may see it), and the workspace basename.
import { Navigate, Route, Routes } from 'react-router-dom'
import { slugFromPath } from '@bcbp-solutions-fzc-llc/frontend-sdk/auth'
import { tryGetConfig } from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import { useRouteTemplate } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { useMemberAccess } from '../../presentation/features/members/useMemberAccess'
import DashboardPage from '../../presentation/pages/DashboardPage'
import UserManagementPage from '../../presentation/pages/UserManagementPage'
import AppShellLayout from '../layouts/AppShellLayout'

export type DashboardRoutesProps = {
  userLabel?: string
  onLogout?: () => void
}

function UserManagementRoute() {
  // The shell registers /t/:slug/dashboard; the nested page is this remote's to name.
  useRouteTemplate('/t/:slug/dashboard/user-management')
  const { canView } = useMemberAccess()
  return canView ? <UserManagementPage /> : <Navigate to=".." relative="path" replace />
}

export function DashboardRoutes({ userLabel, onLogout }: DashboardRoutesProps) {
  return (
    <Routes>
      <Route element={<AppShellLayout userLabel={userLabel} onLogout={onLogout} />}>
        <Route index element={<DashboardPage />} />
        <Route path="user-management" element={<UserManagementRoute />} />
        {/* An unknown nested path (an old bookmark, a typo) returns to the dashboard instead of a blank page. */}
        <Route path="*" element={<Navigate to=".." relative="route" replace />} />
      </Route>
    </Routes>
  )
}

/** The shell's router basename for `pathname`: '<workspacePathPrefix><slug>', or '' outside a workspace. */
export function workspaceBasename(pathname: string): string {
  const auth = tryGetConfig()?.auth
  const slug = auth && slugFromPath(pathname, auth)
  return slug ? `${auth.workspacePathPrefix}${slug}` : ''
}

