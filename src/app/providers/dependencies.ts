// The composition root: which implementation backs each contract. Today the fixtures; when the ticket,
// notification and membership APIs exist, their ApiClient-based repositories replace them here only.
import { FixtureDashboardInfoRepository } from '../../infrastructure/fixtures/dashboardInfo'
import { FixtureMemberRepository } from '../../infrastructure/fixtures/members'
import { FixtureTicketRepository } from '../../infrastructure/fixtures/tickets'
import { metricsTelemetry } from '../../infrastructure/telemetry/metrics'
import type { Dependencies } from '../../presentation/dependencies'

export function createDependencies(): Dependencies {
  return {
    tickets: new FixtureTicketRepository(),
    dashboardInfo: new FixtureDashboardInfoRepository(),
    members: new FixtureMemberRepository(),
    telemetry: metricsTelemetry,
  }
}
