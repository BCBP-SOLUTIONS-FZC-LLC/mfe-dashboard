// Use case: the tickets of one dashboard view, filtered. Framework-free (no React, no browser): the
// presentation layer runs it through the platform SDK's useApi (ADR 0002), which supplies the signal.
import type { DashboardFilters, DashboardView, TicketItem } from '../../domain/entities/ticket'
import type { TicketRepository } from '../../domain/repositories'
import { applyFilters } from '../../domain/rules/filters'
import { hasPartialFailure, ticketsInView } from '../../domain/rules/views'

export type TicketQueueQuery = {
  view: DashboardView
  filters: DashboardFilters
  canSeeAllTenders: boolean
  /** The local time the deadline filter is evaluated against. */
  now: Date
  refresh: boolean
  signal: AbortSignal
}

export type TicketQueue = { tickets: TicketItem[]; partialFailure: boolean }

export async function loadTicketQueue(tickets: TicketRepository, q: TicketQueueQuery): Promise<TicketQueue> {
  const all = await tickets.list({ signal: q.signal, refresh: q.refresh })
  const queue = applyFilters(ticketsInView(all, q.view, q.canSeeAllTenders), q.filters, q.now)
  return { tickets: queue, partialFailure: hasPartialFailure(q.view, queue) }
}
