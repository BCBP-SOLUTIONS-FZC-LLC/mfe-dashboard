// The module the shell mounts (./App), and the page the standalone build renders (src/main.tsx).
// The signed-in user, sign-out, the workspace and the route templates come from the platform SDK:
// the shell's singleton inside web-shell, the SDK's anonymous defaults standalone. Props the shell
// passes still win, so a shell that sends userLabel/onLogout keeps working unchanged.
import { useCallback, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useInRouterContext } from 'react-router-dom'
import { DashboardRoutes, workspaceBasename, type DashboardRoutesProps } from './routes/DashboardRoutes'
import { useCurrentUser, useSignOut } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { goToSignIn } from '../infrastructure/auth/signIn'
import { DependenciesProvider, useProvidedDependencies } from '../presentation/dependencies'
import { createDependencies } from './providers/dependencies'
import './configuration/i18n'
import './styles/index.css'

/** ./App's props (the shell's contract): both optional. */
export type DashboardAppProps = DashboardRoutesProps

export { workspaceBasename }

/** The composition root's implementations, unless an outer provider (a test) supplies its own. */
function WithDependencies({ children }: { children: ReactNode }) {
  const provided = useProvidedDependencies()
  const [own] = useState(createDependencies)
  return <DependenciesProvider value={provided ?? own}>{children}</DependenciesProvider>
}

export default function App(props: DashboardAppProps) {
  return (
    <WithDependencies>
      <AppRoutes {...props} />
    </WithDependencies>
  )
}

function AppRoutes({ userLabel, onLogout }: DashboardAppProps) {
  const user = useCurrentUser()
  const signOut = useSignOut()
  // Global sign-out (the identity provider's session ends too). useSignOut rejects when no shell
  // provides signOut (standalone); fall back to the shell's sign-in page then.
  const sdkLogout = useCallback(() => {
    signOut().catch(goToSignIn)
  }, [signOut])
  const props = { userLabel: userLabel ?? user?.email ?? user?.name, onLogout: onLogout ?? sdkLogout }

  if (useInRouterContext()) {
    return <DashboardRoutes {...props} />
  }

  // The SDK does not share react-router-dom, so the remote runs its own router under the shell's
  // workspace prefix, worked out as the shell does (bootstrap.tsx). Standalone there is no config.
  const basename = workspaceBasename(window.location.pathname)
  return (
    <BrowserRouter {...(basename ? { basename } : {})}>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardRoutes {...props} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
