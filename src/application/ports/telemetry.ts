// What the dashboard reports about itself, in use-case terms. The infrastructure layer implements it
// with the platform SDK's metrics (src/infrastructure/telemetry); presentation gets it injected.
import type { DashboardView } from '../../domain/entities/ticket'

export type TicketLoadOutcome = 'success' | 'error'

export interface DashboardTelemetry {
  /** A ticket list load finished (superseded loads are not reported). */
  ticketLoadFinished(e: { view: DashboardView; trigger: 'initial' | 'refresh'; outcome: TicketLoadOutcome; seconds: number }): void
  /** The user asked for an MFA step-up from the approval banner. */
  stepUpRequested(): void
}
