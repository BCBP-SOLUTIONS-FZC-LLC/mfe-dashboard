import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { PlatformProvider, type ShellContextValue } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { startPlatform } from '../platform'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

const user = { sub: 'u-1', name: 'Ada Lovelace', email: 'ada.lovelace@example.com' }

// A fresh SDK runtime signed in as `user`, under a shell whose signOut the test controls (the test
// platform's own shell has none).
function shellWith(signOut?: ShellContextValue['signOut']) {
  startPlatform({ user })
  const shell: ShellContextValue = { user, locale: 'en', switchWorkspace: async () => {}, signOut }
  return ({ children }: { children: ReactNode }) => <PlatformProvider shell={shell}>{children}</PlatformProvider>
}

async function logout() {
  const u = userEvent.setup()
  await u.click(await screen.findByRole('button', { name: /Ada L/ }))
  await u.click(screen.getByRole('menuitem', { name: 'Logout' }))
}

describe('App mounted by the shell (platform SDK)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the signed-in user from the SDK session', async () => {
    window.history.replaceState({}, '', '/t/test/dashboard')
    const platform = startPlatform({ user })
    render(<App />, { wrapper: platform.Wrapper })
    expect(await screen.findByRole('button', { name: /Ada L/ })).toBeInTheDocument()
    expect(screen.getByText('AL')).toBeInTheDocument()
    platform.reset()
  })

  it('uses the user name when the session has no email', async () => {
    window.history.replaceState({}, '', '/t/test/dashboard')
    const platform = startPlatform({ user: { sub: 'u-2', name: 'Grace Hopper' } })
    render(<App />, { wrapper: platform.Wrapper })
    expect(await screen.findByText('GH')).toBeInTheDocument()
    platform.reset()
  })

  it('signs out through the SDK', async () => {
    window.history.replaceState({}, '', '/t/test/dashboard')
    const signOut = vi.fn(async () => {})
    render(<App />, { wrapper: shellWith(signOut) })
    await logout()
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('falls back to the sign-in page when the shell provides no signOut', async () => {
    window.history.replaceState({}, '', '/t/test/dashboard')
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    render(<App />, { wrapper: shellWith(undefined) })
    await logout()
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('http://localhost:5001'))
  })

  it('lets props from the shell override the SDK', async () => {
    window.history.replaceState({}, '', '/t/test/dashboard')
    const signOut = vi.fn(async () => {})
    const onLogout = vi.fn()
    render(<App userLabel="grace.hopper@example.com" onLogout={onLogout} />, { wrapper: shellWith(signOut) })
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: /Grace H/ }))
    await u.click(screen.getByRole('menuitem', { name: 'Logout' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(signOut).not.toHaveBeenCalled()
  })
})
