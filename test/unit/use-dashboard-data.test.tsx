import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDashboardData } from '../../src/hooks/useDashboardData'

const filters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }
const approverFilters = { ...filters, role: 'Approver' }
const narrowedFilters = { ...filters, status: 'review', department: 'Compliance', tender: 'wind' }

describe('useDashboardData', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads my tickets as a partial failure, then filters to empty and refreshes', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useDashboardData({ view: 'my-tickets', filters, canSeeAllTenders: true }),
    )
    expect(result.current.loadState).toBe('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(result.current.loadState).toBe('partial_failure')
    expect(result.current.cachedAt).toEqual(expect.any(Number))

    const { result: empty } = renderHook(() =>
      useDashboardData({
        view: 'my-tickets',
        filters: approverFilters,
        canSeeAllTenders: true,
      }),
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(empty.current.loadState).toBe('empty')
    expect(empty.current.tickets).toEqual([])

    act(() => {
      empty.current.refresh()
    })
    expect(empty.current.refreshing).toBe(true)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(empty.current.refreshing).toBe(false)
  })

  it('filters by status, department, and tender text', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useDashboardData({
        view: 'all-tenders',
        filters: narrowedFilters,
        canSeeAllTenders: true,
      }),
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(result.current.loadState).toBe('ready')
    expect(result.current.tickets.map((ticket) => ticket.id)).toEqual(['T-1021'])
  })

  it('returns an empty all-tenders view when the caller cannot see them', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useDashboardData({ view: 'all-tenders', filters, canSeeAllTenders: false }),
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(result.current.loadState).toBe('empty')
  })
})
