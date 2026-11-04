import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEPARTMENT_OPTIONS } from '../../src/mocks/dashboardTickets'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'
import { MANAGE_ONLY, MANAGER, NO_MEMBER_ACCESS, VIEWER, startPlatform } from '../platform'

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

describe('filters', () => {
  it('offers every department in the data', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    await userEvent.click(await screen.findByRole('button', { name: /^Filters/ }))
    const department = screen.getByRole('combobox', { name: 'Department' })
    const options = within(department).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['All Departments', ...DEPARTMENT_OPTIONS])
    expect(options).toEqual(expect.arrayContaining(['MEP', 'Compliance', 'Estimating']))
  })
})

describe('delegation panel', () => {
  it('formats the coverage period in the page locale', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    expect(await screen.findByText('Oct 12, 2026 – Oct 16, 2026')).toBeInTheDocument()
  })
})
