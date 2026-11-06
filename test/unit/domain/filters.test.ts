// The domain's filter, search and SLA rules: pure functions of the tickets and members.
import { describe, expect, it } from 'vitest'
import type { DashboardFilters, TicketItem } from '../../../src/domain/entities/ticket'
import { applyFilters, departmentsOf, searchTickets } from '../../../src/domain/rules/filters'
import { CalendarDay } from '../../../src/domain/value-objects/CalendarDay'
import { searchMembers } from '../../../src/domain/rules/members'
import { slaOverview } from '../../../src/domain/rules/sla'
import { countByView, hasPartialFailure } from '../../../src/domain/rules/views'
import { FIXTURE_TICKETS } from '../../../src/infrastructure/fixtures/tickets'

const all: DashboardFilters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }
const now = new Date(2026, 9, 20, 12)
const ticket = (over: Partial<TicketItem>): TicketItem => ({ ...FIXTURE_TICKETS[0]!, ...over })

describe('applyFilters', () => {
  it('keeps everything with every filter on all', () => {
    expect(applyFilters(FIXTURE_TICKETS, all, now)).toHaveLength(FIXTURE_TICKETS.length)
  })

  it('narrows by status, department, role level (substring) and tender keyword (case-insensitive)', () => {
    const a = ticket({ id: 'a', status: 'open', department: 'IT', roleLevel: 'Senior Reviewer', tenderTitle: 'Wind Farm' })
    const b = ticket({ id: 'b', status: 'review', department: 'IT', roleLevel: 'Approver', tenderTitle: 'Solar' })
    expect(applyFilters([a, b], { ...all, status: 'open' }, now).map((t) => t.id)).toEqual(['a'])
    expect(applyFilters([a, b], { ...all, role: 'Reviewer' }, now).map((t) => t.id)).toEqual(['a'])
    expect(applyFilters([a, b], { ...all, tender: 'wind' }, now).map((t) => t.id)).toEqual(['a'])
    expect(applyFilters([a, b], { ...all, department: 'HR' }, now)).toEqual([])
  })
})

describe('searchTickets and searchMembers', () => {
  it('match title, client or department; an empty query keeps all', () => {
    const t = ticket({ tenderTitle: 'Harbour Works', client: 'Port Authority', department: 'Marine' })
    expect(searchTickets([t], '  ')).toEqual([t])
    expect(searchTickets([t], 'port')).toEqual([t])
    expect(searchTickets([t], 'marine')).toEqual([t])
    expect(searchTickets([t], 'airport')).toEqual([])
  })

  it('match name, email, role or department', () => {
    const m = { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', department: 'IT', status: 'Active' as const }
    expect(searchMembers([m], '')).toEqual([m])
    expect(searchMembers([m], 'LOVELACE')).toEqual([m])
    expect(searchMembers([m], 'admin')).toEqual([m])
    expect(searchMembers([m], 'finance')).toEqual([])
  })
})

describe('calendar days and counts', () => {
  it('CalendarDay: the local day as YYYY-MM-DD, zero-padded; adds days across a year; compares; rejects non-days', () => {
    const jan5 = CalendarDay.fromLocalDate(new Date(2026, 0, 5, 23, 30))
    expect(jan5.iso).toBe('2026-01-05')
    expect(CalendarDay.parse('2026-12-29').addDays(7).iso).toBe('2027-01-05')
    expect(jan5.addDays(-5).iso).toBe('2025-12-31')
    expect(jan5.isBefore(CalendarDay.parse('2026-01-06'))).toBe(true)
    expect(jan5.equals(CalendarDay.parse('2026-01-05'))).toBe(true)
    expect(() => CalendarDay.parse('2026-02-30')).toThrow(RangeError)
    expect(() => CalendarDay.parse('26-1-5')).toThrow(RangeError)
  })

  it('lists departments once, sorted', () => {
    expect(departmentsOf([ticket({ department: 'B' }), ticket({ department: 'A' }), ticket({ department: 'B' })])).toEqual(['A', 'B'])
  })

  it('counts SLA states and views, and flags a partial failure only in my tickets', () => {
    const sla = slaOverview([ticket({ slaState: 'breached' }), ticket({ slaState: 'warning' }), ticket({ slaState: 'on_track' })])
    expect(sla).toEqual({ total: 3, onTrack: 1, warning: 1, breached: 1 })
    expect(countByView(FIXTURE_TICKETS, false)['all-tenders']).toBe(0)
    const broken = [ticket({ tenderDetailsUnavailable: true })]
    expect(hasPartialFailure('my-tickets', broken)).toBe(true)
    expect(hasPartialFailure('delegated', broken)).toBe(false)
  })
})
