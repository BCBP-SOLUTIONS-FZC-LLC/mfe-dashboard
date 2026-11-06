// Which tickets each dashboard view (queue) holds, and how many. Pure functions of the tickets: no
// React, no browser, no SDK (the constitution's domain layer).
import { DASHBOARD_VIEWS, type DashboardView, type TicketItem } from '../entities/ticket'

const SLA_ORDER = { breached: 0, warning: 1, on_track: 2 } as const

/**
 * The tickets of `view`: my tickets are open and not delegated, most urgent SLA first, then by due
 * day; review and approval queues by status; delegated by who delegated; all tenders only for users
 * who may read every tender. An unknown view is empty.
 */
export function ticketsInView(tickets: readonly TicketItem[], view: string, canSeeAllTenders: boolean): TicketItem[] {
  switch (view) {
    case 'my-tickets':
      return tickets
        .filter((t) => t.status === 'open' && !t.delegatedFrom)
        .sort((a, b) => SLA_ORDER[a.slaState] - SLA_ORDER[b.slaState] || a.dueDate.localeCompare(b.dueDate))
    case 'awaiting-review':
      return tickets.filter((t) => t.status === 'review')
    case 'awaiting-approval':
      return tickets.filter((t) => t.status === 'approval')
    case 'delegated':
      return tickets.filter((t) => Boolean(t.delegatedFrom))
    case 'all-tenders':
      return canSeeAllTenders ? [...tickets] : []
    default:
      return []
  }
}

/** Tickets per view, before filters: the KPI cards count the same rows the list shows. */
export function countByView(tickets: readonly TicketItem[], canSeeAllTenders: boolean): Record<DashboardView, number> {
  return Object.fromEntries(DASHBOARD_VIEWS.map((v) => [v, ticketsInView(tickets, v, canSeeAllTenders).length])) as Record<DashboardView, number>
}

/** A queue is partly loaded when one of my tickets has no tender details (the tender service failed). */
export function hasPartialFailure(view: string, tickets: readonly TicketItem[]): boolean {
  return view === 'my-tickets' && tickets.some((t) => t.tenderDetailsUnavailable)
}
