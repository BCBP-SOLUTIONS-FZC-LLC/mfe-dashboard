// The module the shell mounts (./App). It reads the signed-in user and sign-out from the platform
// SDK, which the shell provides as a shared singleton; this remote never bundles it. Props the shell
// passes still win, so a shell that sends userLabel/onLogout keeps working unchanged.
import { useCallback } from 'react'
import { useCurrentUser, useSignOut } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import DashboardApp, { type DashboardAppProps } from './DashboardApp'
import { defaultLogout } from './layouts/AppShellLayout'

export { routerBasename, type DashboardAppProps } from './DashboardApp'

export default function App({ userLabel, onLogout }: DashboardAppProps) {
  const user = useCurrentUser()
  const signOut = useSignOut()
  // Global sign-out (the identity provider's session ends too). useSignOut rejects when the shell
  // provides no signOut; fall back to the shell's sign-in page then.
  const sdkLogout = useCallback(() => {
    signOut().catch(defaultLogout)
  }, [signOut])

  return (
    <DashboardApp
      userLabel={userLabel ?? user?.email ?? user?.name}
      onLogout={onLogout ?? sdkLogout}
    />
  )
}
