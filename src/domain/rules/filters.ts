// The dashboard filters and the deadline rule. Calendar days (`YYYY-MM-DD`) are compared as strings,
// never turned into instants (which would shift them a day west of UTC).
import type { DashboardFilters, TicketItem } from '../entities/ticket'

/** The local calendar day of `d` as `YYYY-MM-DD`, comparable as a string with a ticket's due day. */
export function dayKey(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0')).join('-')
}

/**
 * Deadline filter on a ticket's due day, against the local day of `now`: 'overdue' is before today,
 * 'week' is today and the next six days. 'all' and anything unknown match.
 */
export function matchesDeadline(dueDate: string, deadline: string, now: Date): boolean {
  if (deadline === 'all') return true
  const today = dayKey(now)
  if (deadline === 'overdue') return dueDate < today
  if (deadline === 'week') return dueDate >= today && dueDate < dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7))
  return true
}

/** `tickets` narrowed by every filter that is not 'all'. Role matches a substring of `roleLevel`; tender a keyword in the title. */
export function applyFilters(tickets: readonly TicketItem[], filters: DashboardFilters, now: Date): TicketItem[] {
  return tickets.filter(
    (t) =>
      (filters.status === 'all' || t.status === filters.status) &&
      (filters.department === 'all' || t.department === filters.department) &&
      (filters.role === 'all' || t.roleLevel.includes(filters.role)) &&
      (filters.tender === 'all' || t.tenderTitle.toLowerCase().includes(filters.tender.toLowerCase())) &&
      matchesDeadline(t.dueDate, filters.deadline, now),
  )
}

/** Every department the tickets name, sorted. */
export function departmentsOf(tickets: readonly TicketItem[]): string[] {
  return [...new Set(tickets.map((t) => t.department))].sort()
}

/** Tickets whose tender title, client or department contains `query` (case-insensitive); all for an empty query. */
export function searchTickets(tickets: readonly TicketItem[], query: string): readonly TicketItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return tickets
  return tickets.filter((t) => [t.tenderTitle, t.client, t.department].some((v) => v.toLowerCase().includes(q)))
}
