// Use case: what the dashboard shows around the ticket list (KPI counts per view, the SLA overview of
// my tickets, filter options, notifications and delegation). Framework-free.
import type { DelegationCoverage } from '../../domain/entities/dashboardInfo'
import type { DashboardView, FilterOptions, SlaOverview } from '../../domain/entities/ticket'
import type { DashboardInfoRepository, LoadOptions, TicketRepository } from '../../domain/repositories'
import { departmentsOf } from '../../domain/rules/filters'
import { slaOverview } from '../../domain/rules/sla'
import { countByView, ticketsInView } from '../../domain/rules/views'

export type DashboardSummary = {
  viewCounts: Record<DashboardView, number>
  sla: SlaOverview
  filterOptions: FilterOptions
  unreadNotifications: number
  delegation: DelegationCoverage
}

export class LoadDashboardSummaryUseCase {
  private readonly tickets: TicketRepository
  private readonly info: DashboardInfoRepository

  constructor(tickets: TicketRepository, info: DashboardInfoRepository) {
    this.tickets = tickets
    this.info = info
  }

  async execute(q: LoadOptions & { canSeeAllTenders: boolean }): Promise<DashboardSummary> {
    const [all, reference, info] = await Promise.all([
      this.tickets.list({ signal: q.signal }),
      this.tickets.filterReference({ signal: q.signal }),
      this.info.get({ signal: q.signal }),
    ])
    return {
      viewCounts: countByView(all, q.canSeeAllTenders),
      sla: slaOverview(ticketsInView(all, 'my-tickets', true)),
      filterOptions: { departments: departmentsOf(all), ...reference },
      unreadNotifications: info.unreadNotifications,
      delegation: info.delegation,
    }
  }
}
