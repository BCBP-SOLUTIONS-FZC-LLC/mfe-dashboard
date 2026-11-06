// Use case: notifications and delegation (the layout's badge). Framework-free.
import type { DashboardInfo } from '../../domain/entities/dashboardInfo'
import type { DashboardInfoRepository, LoadOptions } from '../../domain/repositories'

export class GetDashboardInfoUseCase {
  private readonly info: DashboardInfoRepository

  constructor(info: DashboardInfoRepository) {
    this.info = info
  }

  execute(q: LoadOptions): Promise<DashboardInfo> {
    return this.info.get({ signal: q.signal })
  }
}
