// The use cases over in-memory repositories: no React, no SDK runtime (ADR 0001, 0002).
import { describe, expect, it } from 'vitest'
import { listMembers } from '../../../src/application/use-cases/listMembers'
import { loadDashboardSummary } from '../../../src/application/use-cases/loadDashboardSummary'
import { loadTicketQueue } from '../../../src/application/use-cases/loadTicketQueue'
import type { DashboardInfoRepository, MemberRepository, TicketRepository } from '../../../src/domain/repositories'
import { FIXTURE_TICKETS } from '../../../src/infrastructure/fixtures/tickets'

const signal = new AbortController().signal
const calls: unknown[] = []
const tickets: TicketRepository = {
  async list(o) {
    calls.push(o)
    return FIXTURE_TICKETS
  },
  async filterReference() {
    return { roleLevels: ['Lead'], tenders: [['IT', 'IT']] as const }
  },
}
const info: DashboardInfoRepository = { async get() { return { unreadNotifications: 4, delegation: { coveredBy: 'X', from: '2026-01-01', to: '2026-01-02' } } } }
const members: MemberRepository = { async list() { return [{ id: '1', name: 'A', email: 'a@x', role: 'Admin', department: 'IT', status: 'Active' }] } }
const filters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }

describe('loadTicketQueue', () => {
  it('loads through the repository (passing refresh and the signal), then applies the view and filters', async () => {
    const queue = await loadTicketQueue(tickets, { view: 'my-tickets', filters, canSeeAllTenders: true, now: new Date(2026, 9, 20), refresh: true, signal })
    expect(calls.at(-1)).toEqual({ signal, refresh: true })
    expect(queue.tickets.every((t) => t.status === 'open' && !t.delegatedFrom)).toBe(true)
    expect(queue.partialFailure).toBe(queue.tickets.some((t) => t.tenderDetailsUnavailable))
  })
})

describe('loadDashboardSummary', () => {
  it('combines view counts, SLA, filter options and dashboard info', async () => {
    const s = await loadDashboardSummary({ tickets, info }, { signal, canSeeAllTenders: false })
    expect(s.viewCounts['all-tenders']).toBe(0)
    expect(s.sla.total).toBe(s.sla.onTrack + s.sla.warning + s.sla.breached)
    expect(s.filterOptions.roleLevels).toEqual(['Lead'])
    expect(s.filterOptions.departments.length).toBeGreaterThan(0)
    expect(s.unreadNotifications).toBe(4)
  })
})

describe('listMembers', () => {
  it('returns the repository\'s members', async () => {
    expect(await listMembers(members, { signal })).toHaveLength(1)
  })
})
