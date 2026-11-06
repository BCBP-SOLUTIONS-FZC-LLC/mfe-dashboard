// Dashboard facts that are not tickets, behind the DashboardInfoRepository contract, until the
// notification and delegation APIs exist (LLD §15 item 1).
import type { DashboardInfo } from '../../domain/entities/dashboardInfo'
import type { DashboardInfoRepository } from '../../domain/repositories'

const INFO: DashboardInfo = {
  unreadNotifications: 3,
  delegation: { coveredBy: 'Arjun R', from: '2026-10-12', to: '2026-10-16' },
}

export class FixtureDashboardInfoRepository implements DashboardInfoRepository {
  async get(): Promise<DashboardInfo> {
    return INFO
  }
}
