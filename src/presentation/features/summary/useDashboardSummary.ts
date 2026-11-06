import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { loadDashboardSummary, type DashboardSummary } from '../../../application/use-cases/loadDashboardSummary'
import { useDependencies } from '../../dependencies'

/**
 * KPI counts, the SLA overview, filter options, notifications and delegation: the loadDashboardSummary
 * use case through the SDK's useApi. Undefined until the first load finishes, and kept while a
 * reload runs.
 */
export function useDashboardSummary(canSeeAllTenders: boolean): DashboardSummary | undefined {
  const { tickets, dashboardInfo } = useDependencies()
  return useApi((_api, signal) => loadDashboardSummary({ tickets, info: dashboardInfo }, { signal, canSeeAllTenders }), [canSeeAllTenders]).data
}
