import type { DashboardInfo } from '../../../domain/entities/dashboardInfo'
import { useDependencies } from '../../dependencies'
import { useLoadable } from '../useLoadable'

/**
 * Notifications and delegation for the chrome (the injected GetDashboardInfoUseCase); undefined while
 * loading or after a failure. The chrome then shows no count: the failure is logged, not shown.
 */
export function useDashboardInfo(): DashboardInfo | undefined {
  const { useCases } = useDependencies()
  return useLoadable('dashboard info', (signal) => useCases.getDashboardInfo.execute({ signal }), []).data
}
