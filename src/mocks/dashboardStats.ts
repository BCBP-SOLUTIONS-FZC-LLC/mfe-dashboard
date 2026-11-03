import type { DashboardView } from '../types/ticket'
import { ticketsForView } from './dashboardTickets'

export const KPI_COUNTS: Record<DashboardView, number> = {
  'my-tickets': 12,
  'awaiting-review': 5,
  'awaiting-approval': 3,
  delegated: 4,
  'all-tenders': 18,
}

export function slaOverviewForMyTickets() {
  const tickets = ticketsForView('my-tickets', true)
  const onTrack = tickets.filter((t) => t.slaState === 'on_track').length
  const warning = tickets.filter((t) => t.slaState === 'warning').length
  const breached = tickets.filter((t) => t.slaState === 'breached').length
  return { total: KPI_COUNTS['my-tickets'], onTrack, warning, breached }
}
