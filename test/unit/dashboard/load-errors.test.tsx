// A failed ticket load (an SDK ApiError): the hook's 'error' state, and the page's alert with Retry
// and the SDK's problemMessage for an API problem.
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NetworkError, ProblemError } from '@bcbp-solutions-fzc-llc/frontend-sdk/problem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/app/App'
import type { TicketRepository } from '../../../src/domain/repositories'
import { FixtureTicketRepository } from '../../../src/infrastructure/fixtures/tickets'
import { useDashboardData } from '../../../src/presentation/features/tickets/useDashboardData'
import { testDependencies, withDependencies } from '../../fixtures/dependencies'
import { startPlatform } from '../../fixtures/platform'

const filters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }

// The sample tickets, except that a ticket-list load (the queue: it always says whether it is a
// refresh) rejects with `fail` while it is set. The summary's load (KPI counts, SLA) keeps working,
// so only the list fails, as when the ticket API answers an error for one query.
let fail: unknown
class FailingTicketRepository extends FixtureTicketRepository implements TicketRepository {
  override async list(o: Parameters<TicketRepository['list']>[0]) {
    const tickets = await super.list(o)
    if (fail && o.refresh !== undefined) throw fail
    return tickets
  }
}
const wrapper = () => withDependencies(testDependencies({ tickets: new FailingTicketRepository() }))

beforeEach(() => {
  fail = undefined
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useDashboardData errors', () => {
  it('reports an API error as error, then recovers on refresh', async () => {
    vi.useFakeTimers()
    fail = new NetworkError(false, 'req-1')
    const { result } = renderHook(() => useDashboardData({ view: 'awaiting-review', filters, canSeeAllTenders: true }), { wrapper: wrapper() })
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
    renderHook(() => useDashboardData({ view: 'delegated', filters, canSeeAllTenders: true }), { wrapper: wrapper() })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    const record = platform.logs.find((l) => l.body === 'dashboard tickets failed to load')
    expect(record?.level).toBe('warn')
    expect(record?.attributes).toMatchObject({ mfe: 'dashboard', view: 'delegated' })
  })

  it('reports a failed refresh the same way (useApi drops the old rows)', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDashboardData({ view: 'awaiting-review', filters, canSeeAllTenders: true }), { wrapper: wrapper() })
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
    render(<App userLabel="Ada" />, { wrapper: wrapper() })
    const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
    expect(alert.querySelector('span')?.textContent?.trim()).toBe('Tickets could not be loaded.')
  })

  it('shows an alert with the problem message and retries', async () => {
    fail = new ProblemError({ type: 'about:blank', title: 'Service Unavailable', status: 503, extensions: {} })
    window.history.replaceState({}, '', '/t/acme/dashboard')
    render(<App userLabel="Ada" />, { wrapper: wrapper() })

    const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
    expect(alert).toHaveTextContent('Tickets could not be loaded.')
    expect(alert).toHaveTextContent('Service Unavailable')

    fail = undefined
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await vi.waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByRole('heading', { name: /My Tickets/ })).toBeInTheDocument()
  })
})
