import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import type { DashboardInfo } from '../../../domain/entities/dashboardInfo'
import { useDependencies } from '../../dependencies'

/** Notifications and delegation (the injected GetDashboardInfoUseCase); undefined while loading. */
export function useDashboardInfo(): DashboardInfo | undefined {
  const { useCases } = useDependencies()
  return useApi((_api, signal) => useCases.getDashboardInfo.execute({ signal }), []).data
}
