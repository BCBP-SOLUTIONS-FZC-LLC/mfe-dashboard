// Dashboard facts that are not tickets, behind the DashboardInfoRepository contract, until the
// notification and delegation APIs exist (LLD §15 item 1).
import type { DashboardInfo } from '../../domain/entities/dashboardInfo'
import type { DashboardInfoRepository } from '../../domain/repositories'
import { CalendarDay } from '../../domain/value-objects/CalendarDay'

/** Sample facts; the delegation period runs from two days ago to two days ahead of the local day. */
export class FixtureDashboardInfoRepository implements DashboardInfoRepository {
  async get(): Promise<DashboardInfo> {
    const today = CalendarDay.fromLocalDate(new Date())
    return {
      unreadNotifications: 3,
      delegation: { coveredBy: 'Arjun R', from: today.addDays(-2).iso, to: today.addDays(2).iso },
    }
  }
}
