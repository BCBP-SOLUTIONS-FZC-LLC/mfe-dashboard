import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import type { DashboardSummary } from '../../../application/use-cases/LoadDashboardSummaryUseCase'
import { useDependencies } from '../../dependencies'

/**
 * KPI counts, the SLA overview, filter options, notifications and delegation: the injected
 * LoadDashboardSummaryUseCase through the SDK's useApi. Undefined until the first load finishes.
 */
export function useDashboardSummary(canSeeAllTenders: boolean): DashboardSummary | undefined {
  const { useCases } = useDependencies()
  return useApi((_api, signal) => useCases.loadDashboardSummary.execute({ signal, canSeeAllTenders }), [canSeeAllTenders]).data
}
