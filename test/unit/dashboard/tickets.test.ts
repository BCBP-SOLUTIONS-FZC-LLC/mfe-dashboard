import { describe, expect, it } from 'vitest'
import { ticketsForView } from '../../../src/mocks/dashboardTickets'

describe('ticketsForView', () => {
  it('sorts open tickets by SLA and hides delegated ones from my tickets', () => {
    const mine = ticketsForView('my-tickets', true)
    expect(mine.every((ticket) => ticket.status === 'open' && !ticket.delegatedFrom)).toBe(true)
    expect(mine[0]?.slaState).toBe('breached')
  })

  it('splits review, approval, and delegated queues', () => {
    expect(ticketsForView('awaiting-review', true).every((ticket) => ticket.status === 'review')).toBe(
      true,
    )
    expect(
      ticketsForView('awaiting-approval', true).every((ticket) => ticket.status === 'approval'),
    ).toBe(true)
    expect(ticketsForView('delegated', true).every((ticket) => ticket.delegatedFrom)).toBe(true)
  })

  it('hides all tenders when the caller cannot see them and rejects an unknown view', () => {
    expect(ticketsForView('all-tenders', true).length).toBeGreaterThan(0)
    expect(ticketsForView('all-tenders', false)).toEqual([])
    expect(ticketsForView('nope', true)).toEqual([])
  })
})
