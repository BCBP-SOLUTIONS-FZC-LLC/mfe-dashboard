import type { DashboardView } from '../types/ticket'
import { ticketsForView } from './dashboardTickets'

const VIEWS: DashboardView[] = ['my-tickets', 'awaiting-review', 'awaiting-approval', 'delegated', 'all-tenders']

/** Tickets per view (before filters), from the same rows the list shows. */
export function kpiCounts(canSeeAllTenders: boolean): Record<DashboardView, number> {
  return Object.fromEntries(VIEWS.map((v) => [v, ticketsForView(v, canSeeAllTenders).length])) as Record<DashboardView, number>
}

/** Unread notifications (no notifications service yet). */
export const UNREAD_NOTIFICATIONS = 3

/** Who covers the signed-in user, and when (ISO dates). */
export const DELEGATION_COVERAGE = { coveredBy: 'Arjun R', from: '2026-10-12', to: '2026-10-16' }

export function slaOverviewForMyTickets() {
  const tickets = ticketsForView('my-tickets', true)
  const onTrack = tickets.filter((t) => t.slaState === 'on_track').length
  const warning = tickets.filter((t) => t.slaState === 'warning').length
  const breached = tickets.filter((t) => t.slaState === 'breached').length
  return { total: tickets.length, onTrack, warning, breached }
}
