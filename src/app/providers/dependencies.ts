// The composition root: which implementation backs each contract, and the use cases built on them.
// Today the fixtures; when the ticket, notification and membership APIs exist, their ApiClient-based
// repositories (src/infrastructure/api) replace them here only.
import type { DashboardTelemetry } from '../../application/ports/telemetry'
import { GetDashboardInfoUseCase } from '../../application/use-cases/GetDashboardInfoUseCase'
import { ListMembersUseCase } from '../../application/use-cases/ListMembersUseCase'
import { LoadDashboardSummaryUseCase } from '../../application/use-cases/LoadDashboardSummaryUseCase'
import { LoadTicketQueueUseCase } from '../../application/use-cases/LoadTicketQueueUseCase'
import type { DashboardInfoRepository, MemberRepository, TicketRepository } from '../../domain/repositories'
import { FixtureDashboardInfoRepository } from '../../infrastructure/fixtures/dashboardInfo'
import { FixtureMemberRepository } from '../../infrastructure/fixtures/members'
import { FixtureTicketRepository } from '../../infrastructure/fixtures/tickets'
import { metricsTelemetry } from '../../infrastructure/telemetry/metrics'
import type { Dependencies } from '../../presentation/dependencies'

export type Infrastructure = {
  tickets: TicketRepository
  dashboardInfo: DashboardInfoRepository
  members: MemberRepository
  telemetry: DashboardTelemetry
}

/** Today's implementations: the in-repo fixtures and the SDK-backed metrics. */
export function defaultInfrastructure(): Infrastructure {
  return {
    tickets: new FixtureTicketRepository(),
    dashboardInfo: new FixtureDashboardInfoRepository(),
    members: new FixtureMemberRepository(),
    telemetry: metricsTelemetry,
  }
}

/** The use cases over `infra` (tests pass their own repositories through `overrides`). */
export function createDependencies(overrides: Partial<Infrastructure> = {}): Dependencies {
  const infra = { ...defaultInfrastructure(), ...overrides }
  return {
    useCases: {
      loadTicketQueue: new LoadTicketQueueUseCase(infra.tickets),
      loadDashboardSummary: new LoadDashboardSummaryUseCase(infra.tickets, infra.dashboardInfo),
      getDashboardInfo: new GetDashboardInfoUseCase(infra.dashboardInfo),
      listMembers: new ListMembersUseCase(infra.members),
    },
    telemetry: infra.telemetry,
  }
}
