import type { SlaOverview, TicketItem } from '../entities/ticket'

/** How many of `tickets` are on track, at risk and breached. */
export function slaOverview(tickets: readonly TicketItem[]): SlaOverview {
  const count = (state: TicketItem['slaState']) => tickets.filter((t) => t.slaState === state).length
  return { total: tickets.length, onTrack: count('on_track'), warning: count('warning'), breached: count('breached') }
}
