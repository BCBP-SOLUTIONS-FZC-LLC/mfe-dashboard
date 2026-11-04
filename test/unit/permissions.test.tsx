import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'
import {
  LEGACY_MEMBER,
  LEGACY_TENANT_ADMIN,
  MEMBER,
  TENANT_OWNER,
  startPlatform,
} from '../platform'

function openUserManagement(permissions: readonly `${string}:${string}`[]) {
  startPlatform({ permissions })
  window.history.replaceState({}, '', '/t/acme/dashboard/user-management')
  render(<App userLabel="Ada" />)
}

describe('user management (read:members / manage:members, as IAM allows)', () => {
  it('lets a member view the list without the actions', async () => {
    openUserManagement(MEMBER)
    expect(await screen.findByRole('heading', { name: 'User management' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'User management' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Invite user' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('gives a tenant owner the actions', async () => {
    openUserManagement(TENANT_OWNER)
    expect(await screen.findByRole('button', { name: 'Invite user' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBeGreaterThan(0)
  })

  it('still shows a manager the page under a role map without read:members', async () => {
    openUserManagement(LEGACY_TENANT_ADMIN)
    expect(await screen.findByRole('button', { name: 'Invite user' })).toBeInTheDocument()
  })

  it('hides the link and sends back anyone with neither permission', async () => {
    openUserManagement(LEGACY_MEMBER)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/t/acme/dashboard')
    expect(screen.queryByRole('link', { name: 'User management' })).not.toBeInTheDocument()
  })
})

describe('delegation panel', () => {
  it('formats the coverage period in the page locale', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    expect(await screen.findByText('Oct 12, 2026 – Oct 16, 2026')).toBeInTheDocument()
  })
})
