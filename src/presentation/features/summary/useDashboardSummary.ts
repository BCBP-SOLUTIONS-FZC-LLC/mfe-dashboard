import type { DashboardSummary } from '../../../application/use-cases/LoadDashboardSummaryUseCase'
import { useDependencies } from '../../dependencies'
import { useLoadable, type Loadable } from '../useLoadable'

/**
 * KPI counts, the SLA overview, filter options, notifications and delegation: the injected
 * LoadDashboardSummaryUseCase through the SDK's useApi. `data` is undefined until the first load
 * finishes; a failed load is `failed`, with `retry`.
 */
export function useDashboardSummary(canSeeAllTenders: boolean): Loadable<DashboardSummary> {
  const { useCases } = useDependencies()
  return useLoadable('dashboard summary', (signal) => useCases.loadDashboardSummary.execute({ signal, canSeeAllTenders }), [canSeeAllTenders])
}
