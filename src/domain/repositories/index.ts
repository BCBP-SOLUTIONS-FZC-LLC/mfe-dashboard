// Repository contracts: what the dashboard needs from the outside world, in domain terms. The
// infrastructure layer implements them (today: in-repo fixtures; later: the ticket, notification and
// membership APIs through the platform SDK's ApiClient). Everything is asynchronous and cancellable,
// as an API is.
import type { DashboardInfo } from '../entities/dashboardInfo'
import type { Member } from '../entities/member'
import type { TicketItem } from '../entities/ticket'

export type LoadOptions = { signal: AbortSignal }

export interface TicketRepository {
  /** The signed-in user's tickets. `refresh` marks a user-requested reload. */
  list(o: LoadOptions & { refresh?: boolean }): Promise<readonly TicketItem[]>
  /** Reference values for the role and tender filters. */
  filterReference(o: LoadOptions): Promise<{ roleLevels: readonly string[]; tenders: readonly (readonly [string, string])[] }>
}

export interface DashboardInfoRepository {
  get(o: LoadOptions): Promise<DashboardInfo>
}

export interface MemberRepository {
  list(o: LoadOptions): Promise<readonly Member[]>
}
