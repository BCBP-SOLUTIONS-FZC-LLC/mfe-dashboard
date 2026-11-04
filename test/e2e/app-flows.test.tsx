import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

describe('dashboard flows', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('filters tickets, searches, and logs out from the host router', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App userLabel="balaji.selvarangam@bcbpsolutions.com" onLogout={onLogout} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Updating…').length).toBeGreaterThan(0)
    expect(screen.getByText('BS')).toBeInTheDocument()
    expect(await screen.findByText('IT Infrastructure Modernization')).toBeInTheDocument()
    expect(screen.getByText(/Tickets are retained below/)).toBeInTheDocument()
    expect(screen.getByText('Tender Details Unavailable')).toBeInTheDocument()
    expect(screen.getAllByText(/Last updated: 1 min ago/).length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: /Awaiting My Review/ })[0]!)
    expect(await screen.findByText('Offshore Wind Substation')).toBeInTheDocument()
    expect(screen.queryByText(/Tickets are retained below/)).not.toBeInTheDocument()
    expect(screen.queryByText('Tender Details Unavailable')).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Awaiting My Approval/ })[0]!)
    expect(await screen.findByText('Hospital Campus Redevelopment')).toBeInTheDocument()
    // A fresh login (no MFA window in the session context): no step-up needed.
    expect(screen.queryByText(/MFA re-authentication required/)).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Delegated To Me/ })[0]!)
    expect(await screen.findByText('From Arjun R')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /All Tenders In Flight/ })[0]!)
    expect(await screen.findByText('Software Development Framework')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    await user.click(screen.getByRole('button', { name: 'Close filters' }))
    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'Approver')
    await user.selectOptions(within(dialog).getByLabelText('Status'), 'Open')
    await user.selectOptions(within(dialog).getByLabelText('Department'), 'Operations')
    await user.selectOptions(within(dialog).getByLabelText('Deadline'), 'Overdue')
    await user.selectOptions(within(dialog).getByLabelText('Tender'), 'Hardware')
    await user.click(screen.getByRole('button', { name: 'Close filters panel' }))
    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('No tickets found')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Clear Filters →' })[0]!)
    expect(await screen.findByText('Data Centre — Tier IV')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear Filters →' }))

    await user.click(screen.getAllByRole('button', { name: 'My Tickets' })[0]!)
    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText('Data Centre — Tier IV')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'zzzz-no-match')
    expect(screen.getByText('No matching tickets')).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox'))
    expect(screen.getByText('Hardware Integration Project')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled())

    await user.click(screen.getByRole('button', { name: 'Hide sidebar' }))
    expect(screen.getByRole('button', { name: 'Show sidebar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    await user.click(screen.getByRole('menuitem', { name: 'User profile' }))
    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    await user.click(screen.getByRole('menuitem', { name: /Language/ }))
    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    await user.click(screen.getByRole('menuitem', { name: /Theme mode/ }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getByRole('menuitem', { name: 'Holiday management' }))
    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    await user.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose theme' }))
    await user.click(screen.getByRole('option', { name: 'Light mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(screen.getByRole('button', { name: 'Show sidebar' }))
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /Balaji S/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Logout' }))
    expect(onLogout).toHaveBeenCalledTimes(2)
  }, 30000)

  it('searches users and falls back to the shell on logout', async () => {
    const user = userEvent.setup()
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    render(
      <MemoryRouter initialEntries={['/user-management']}>
        <App userLabel="Ada" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'User management' })).toBeInTheDocument()
    expect(screen.getByText('AD')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'priya.n')
    expect(screen.getByText('Priya N')).toBeInTheDocument()
    expect(screen.queryByText('Arjun R')).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'Engineering')
    expect(screen.getByText('Samuel K')).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'Approver')
    expect(screen.getByText('Arjun R')).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'nobody-here')
    expect(screen.getByText(/No users match/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Invite user' }))

    await user.clear(screen.getByRole('searchbox'))
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(assign).toHaveBeenCalledWith('http://localhost:5001')

    assign.mockClear()
    vi.stubEnv('PUBLIC_APP1_URL', 'http://127.0.0.1:5001/')
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(assign).toHaveBeenCalledWith('http://127.0.0.1:5001')
  })

  it('redirects a standalone visit onto the dashboard routes', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/unknown')
    render(<App userLabel="User" />)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('US')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'User management' }))
    expect(await screen.findByRole('heading', { name: 'User management' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Dashboard' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('keeps the last-updated label counting and leaves the filter drawer open for other keys', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-27T12:00:00Z'))
    render(
      <MemoryRouter initialEntries={['/']}>
        <App userLabel="User" onLogout={vi.fn()} />
      </MemoryRouter>,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getAllByText('Last updated: 1 min ago').length).toBeGreaterThan(0)

    // No re-render needed: the label refreshes itself (useNow, every 30 s).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4 * 60_000)
    })
    expect(screen.getAllByText('Last updated: 4 mins ago').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /^Filters/ }))
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Enter' })
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
