import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'
import { MEMBER, startPlatform } from '../platform'

describe('user management (manage:members)', () => {
  it('hides the link and sends a member back to the dashboard', async () => {
    startPlatform({ permissions: MEMBER })
    window.history.replaceState({}, '', '/t/acme/dashboard/user-management')
    render(<App userLabel="Ada" />)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/t/acme/dashboard')
    expect(screen.queryByRole('link', { name: 'User management' })).not.toBeInTheDocument()
  })

  it('shows it to a tenant admin', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    expect(await screen.findByRole('link', { name: 'User management' })).toBeInTheDocument()
  })
})

describe('delegation panel', () => {
  it('formats the coverage period in the page locale', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    expect(await screen.findByText('Oct 12, 2026 – Oct 16, 2026')).toBeInTheDocument()
  })
})
