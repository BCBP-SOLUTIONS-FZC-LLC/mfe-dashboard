import { BrowserRouter, Navigate, Route, Routes, useInRouterContext } from 'react-router-dom'
import AppShellLayout from './layouts/AppShellLayout'
import DashboardPage from './pages/DashboardPage'
import UserManagementPage from './pages/UserManagementPage'
import './index.css'

export type DashboardAppProps = {
  userLabel?: string
  onLogout?: () => void
}

function DashboardRoutes({ userLabel, onLogout }: DashboardAppProps) {
  return (
    <Routes>
      <Route element={<AppShellLayout userLabel={userLabel} onLogout={onLogout} />}>
        <Route index element={<DashboardPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
      </Route>
    </Routes>
  )
}

export default function App(props: DashboardAppProps) {
  if (useInRouterContext()) {
    return <DashboardRoutes {...props} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardRoutes {...props} />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
