// The deadline filter (overdue / this week, by local calendar day) and KPI counts taken from the
// same rows the list shows.
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { matchesDeadline, useDashboardData } from '../../../src/hooks/useDashboardData'
import { kpiCounts, slaOverviewForMyTickets } from '../../../src/mocks/dashboardStats'
import { ticketsForView } from '../../../src/mocks/dashboardTickets'

const filters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }

describe('matchesDeadline', () => {
  const now = new Date(2026, 9, 20, 15, 30) // Oct 20, 2026, 15:30 local

  it.each([
    ['2026-10-19', 'overdue', true],
    ['2026-10-20', 'overdue', false],
    ['2026-10-20', 'week', true],
    ['2026-10-26', 'week', true],
    ['2026-10-27', 'week', false],
    ['2026-10-19', 'week', false],
    ['2026-01-01', 'all', true],
    ['2026-01-01', 'unknown', true],
  ])('%s with %s → %s', (due, deadline, expected) => {
    expect(matchesDeadline(due, deadline, now)).toBe(expected)
  })
})

describe('deadline filter in useDashboardData', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('splits all tenders into overdue and this week by today’s date', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(new Date(2026, 9, 20, 9))
    const all = ticketsForView('all-tenders', true)
    const load = async (deadline: string) => {
      const { result } = renderHook(() => useDashboardData({ view: 'all-tenders', filters: { ...filters, deadline }, canSeeAllTenders: true }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700)
      })
      return result.current.tickets
    }
    const overdue = await load('overdue')
    const week = await load('week')
    expect(overdue.length + week.length).toBeLessThanOrEqual(all.length)
    expect(overdue.every((t) => t.dueDate < '2026-10-20')).toBe(true)
    expect(week.every((t) => t.dueDate >= '2026-10-20' && t.dueDate <= '2026-10-26')).toBe(true)
    expect(overdue.length).toBeGreaterThan(0)
    expect(week.length).toBeGreaterThan(0)
  })
})

describe('KPI counts', () => {
  it('count the rows each view lists', () => {
    const counts = kpiCounts(true)
    for (const view of ['my-tickets', 'awaiting-review', 'awaiting-approval', 'delegated', 'all-tenders'] as const) {
      expect(counts[view], view).toBe(ticketsForView(view, true).length)
    }
    expect(kpiCounts(false)['all-tenders']).toBe(0)
  })

  it('give the SLA overview a total equal to its parts', () => {
    const sla = slaOverviewForMyTickets()
    expect(sla.total).toBe(sla.onTrack + sla.warning + sla.breached)
  })
})
