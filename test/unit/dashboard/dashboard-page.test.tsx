// The dashboard page through the mounted App: filter options derived from the data, and dates
// formatted by the SDK in the page locale.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../../src/App'
import { DEPARTMENT_OPTIONS } from '../../../src/mocks/dashboardTickets'

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

  it('announces loading through a busy status and leaves it once rows arrive', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent('Loading your tickets…')
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
