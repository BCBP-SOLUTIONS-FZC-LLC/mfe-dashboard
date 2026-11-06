import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import type { DashboardInfo } from '../../../domain/entities/dashboardInfo'
import { useDependencies } from '../../dependencies'

/** Notifications and delegation from the injected DashboardInfoRepository; undefined while loading. */
export function useDashboardInfo(): DashboardInfo | undefined {
  const { dashboardInfo } = useDependencies()
  return useApi((_api, signal) => dashboardInfo.get({ signal }), []).data
}
