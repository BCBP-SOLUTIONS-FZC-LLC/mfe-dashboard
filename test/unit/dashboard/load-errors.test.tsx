// A failed ticket load (an SDK ApiError): the hook's 'error' state, and the page's alert with Retry
// and the SDK's problemMessage for an API problem.
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NetworkError, ProblemError } from '@bcbp-solutions-fzc-llc/frontend-sdk/problem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { useDashboardData } from '../../../src/hooks/useDashboardData'
import * as tickets from '../../../src/mocks/dashboardTickets'
import { startPlatform } from '../../fixtures/platform'

// The KPI cards and the SLA summary read the fixtures directly while rendering; only the ticket load
// (through useApi) is meant to fail here.
vi.mock('../../../src/mocks/dashboardStats', async (actual) => ({
  ...(await actual<typeof import('../../../src/mocks/dashboardStats')>()),
  kpiCounts: () => ({ 'my-tickets': 3, 'awaiting-review': 2, 'awaiting-approval': 1, delegated: 1, 'all-tenders': 7 }),
  slaOverviewForMyTickets: () => ({ total: 3, onTrack: 1, warning: 1, breached: 1 }),
}))

const filters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }
const real = tickets.ticketsForView

let fail: unknown
beforeEach(() => {
  fail = undefined
  vi.spyOn(tickets, 'ticketsForView').mockImplementation((...args) => {
    if (fail) throw fail
    return real(...args)
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useDashboardData errors', () => {
  it('reports an API error as error, then recovers on refresh', async () => {
    vi.useFakeTimers()
    fail = new NetworkError(false, 'req-1')
    const { result } = renderHook(() => useDashboardData({ view: 'awaiting-review', filters, canSeeAllTenders: true }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(result.current.loadState).toBe('error')
    expect(result.current.error).toBeInstanceOf(NetworkError)
    expect(result.current.tickets).toEqual([])

    fail = undefined
    act(() => result.current.refresh())
    expect(result.current.loadState).toBe('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(result.current.loadState).toBe('ready')
    expect(result.current.error).toBeUndefined()
  })

  it('logs the failure through the SDK, tagged with the remote', async () => {
    vi.useFakeTimers()
    const platform = startPlatform()
    fail = new NetworkError(false, 'req-9')
    renderHook(() => useDashboardData({ view: 'delegated', filters, canSeeAllTenders: true }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    const record = platform.logs.find((l) => l.body === 'dashboard tickets failed to load')
    expect(record?.level).toBe('warn')
    expect(record?.attributes).toMatchObject({ mfe: 'app2', view: 'delegated' })
  })

  it('reports a failed refresh the same way (useApi drops the old rows)', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDashboardData({ view: 'awaiting-review', filters, canSeeAllTenders: true }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(result.current.tickets.length).toBeGreaterThan(0)

    fail = new NetworkError(true, 'req-2')
    act(() => result.current.refresh())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(result.current.loadState).toBe('error')
    expect(result.current.tickets).toEqual([])
  })
})

describe('dashboard page on a failed load', () => {
  it('shows only the generic message for a network error', async () => {
    fail = new NetworkError(true, 'req-3')
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)
    const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
    expect(alert.querySelector('span')?.textContent?.trim()).toBe('Tickets could not be loaded.')
  })

  it('shows an alert with the problem message and retries', async () => {
    fail = new ProblemError({ type: 'about:blank', title: 'Service Unavailable', status: 503, extensions: {} })
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />)

    const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
    expect(alert).toHaveTextContent('Tickets could not be loaded.')
    expect(alert).toHaveTextContent('Service Unavailable')

    fail = undefined
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await vi.waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByRole('heading', { name: /My Tickets/ })).toBeInTheDocument()
  })
})
