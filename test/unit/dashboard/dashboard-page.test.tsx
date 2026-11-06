// The dashboard page through the mounted App: filter options derived from the data, and dates
// formatted by the SDK in the page locale.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../../src/app/App'
import { departmentsOf } from '../../../src/domain/rules/filters'
import { FIXTURE_TICKETS } from '../../../src/infrastructure/fixtures/tickets'

const DEPARTMENT_OPTIONS = departmentsOf(FIXTURE_TICKETS)

describe('filters', () => {
  it('offers every department in the data', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    await userEvent.click(await screen.findByRole('button', { name: /^Filters/ }))
    const department = screen.getByRole('combobox', { name: 'Department' })
    // The options come with the dashboard summary (loadDashboardSummary), after its load.
    await waitFor(() => expect(within(department).getAllByRole('option').length).toBe(DEPARTMENT_OPTIONS.length + 1))
    const options = within(department).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['All Departments', ...DEPARTMENT_OPTIONS])
    expect(options).toEqual(expect.arrayContaining(['MEP', 'Compliance', 'Estimating']))
  })
})

describe('delegation panel', () => {
  it('formats the coverage period (two days either side of today) in the page locale', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 14, 12))
    try {
      window.history.replaceState({}, '', '/t/acme/dashboard')
      render(<App userLabel="Ada" />)
      expect(await screen.findByText('Oct 12, 2026 – Oct 16, 2026')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('accessibility of views and loading', () => {
  it('marks the selected view as pressed on the KPI cards and the view pills', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    const pressed = () => screen.getAllByRole('button', { pressed: true })
    await screen.findByRole('heading', { level: 1 })
    expect(pressed()).toHaveLength(2)
    expect(pressed().every((b) => b.textContent?.includes('My Tickets'))).toBe(true)

    await userEvent.click(screen.getAllByRole('button', { name: /Delegated To Me/ })[0]!)
    expect(pressed()).toHaveLength(2)
    expect(pressed().every((b) => b.textContent?.includes('Delegated To Me'))).toBe(true)
  })

  it('announces loading in a status region that stays on the page and empties once rows arrive', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading your tickets…')
    await waitFor(() => expect(status).toHaveTextContent(/^$/))
    // The same element, not a new one: screen readers announce changes to an existing live region.
    expect(screen.getByRole('status')).toBe(status)

    await userEvent.click(screen.getAllByRole('button', { name: /Delegated To Me/ })[0]!)
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('Loading your tickets…')
  })
})
