import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../../src/app/App'
import { MANAGE_ONLY, MANAGER, NO_MEMBER_ACCESS, VIEWER, startPlatform } from '../../fixtures/platform'

function openUserManagement(permissions: readonly `${string}:${string}`[]) {
  startPlatform({ permissions })
  window.history.replaceState({}, '', '/t/acme/dashboard/user-management')
  render(<App userLabel="Ada" />)
}

describe('user management (read:members / manage:members, as IAM allows)', () => {
  it('shows the list without actions to read:members', async () => {
    openUserManagement(VIEWER)
    expect(await screen.findByRole('heading', { name: 'User management' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'User management' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Invite user' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('spans the empty row over the five columns a viewer sees', async () => {
    openUserManagement(VIEWER)
    await userEvent.setup().type(await screen.findByPlaceholderText('Search users by name or email…'), 'zzz-nobody')
    expect(screen.getByRole('cell', { name: 'No users match your search.' })).toHaveAttribute('colspan', '5')
  })

  it('gives manage:members the actions', async () => {
    openUserManagement(MANAGER)
    expect(await screen.findByRole('button', { name: 'Invite user' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBeGreaterThan(0)
  })

  it('lets manage:members view without read:members', async () => {
    openUserManagement(MANAGE_ONLY)
    expect(await screen.findByRole('button', { name: 'Invite user' })).toBeInTheDocument()
  })

  it('hides the link and sends back anyone with neither permission', async () => {
    openUserManagement(NO_MEMBER_ACCESS)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/t/acme/dashboard')
    expect(screen.queryByRole('link', { name: 'User management' })).not.toBeInTheDocument()
  })
})

describe('read-only tenant (SDK useReadOnly)', () => {
  it('shows the member list without actions', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard/user-management')
    const { Wrapper } = startPlatform({ context: { readOnly: true } })
    render(<App userLabel="Ada" />, { wrapper: Wrapper })
    expect(await screen.findByRole('heading', { name: 'User management' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Invite user' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })
})
