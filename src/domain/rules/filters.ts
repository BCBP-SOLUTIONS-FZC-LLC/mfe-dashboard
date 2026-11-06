// The dashboard filters and the deadline rule. Calendar days (`YYYY-MM-DD`) are compared as strings,
// never turned into instants (which would shift them a day west of UTC).
import type { DashboardFilters, TicketItem } from '../entities/ticket'
import { CalendarDay } from '../value-objects/CalendarDay'

/**
 * Deadline filter on a ticket's due day, against the local day of `now`: 'overdue' is before today,
 * 'week' is today and the next six days. 'all' and anything unknown match.
 */
export function matchesDeadline(dueDate: string, deadline: string, now: Date): boolean {
  if (deadline === 'all') return true
  const due = CalendarDay.parse(dueDate)
  const today = CalendarDay.fromLocalDate(now)
  if (deadline === 'overdue') return due.isBefore(today)
  if (deadline === 'week') return !due.isBefore(today) && due.isBefore(today.addDays(7))
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
