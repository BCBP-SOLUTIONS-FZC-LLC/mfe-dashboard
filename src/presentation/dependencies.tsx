// What presentation needs from the layers below: the use cases (application) and telemetry (an
// application port). Pages call use cases (`useCases.loadTicketQueue.execute(...)`); they never see a
// repository or an implementation. The composition root (src/app/providers) builds them.
import { createContext, useContext, type ReactNode } from 'react'
import type { DashboardTelemetry } from '../application/ports/telemetry'
import type { GetDashboardInfoUseCase } from '../application/use-cases/GetDashboardInfoUseCase'
import type { ListMembersUseCase } from '../application/use-cases/ListMembersUseCase'
import type { LoadDashboardSummaryUseCase } from '../application/use-cases/LoadDashboardSummaryUseCase'
import type { LoadTicketQueueUseCase } from '../application/use-cases/LoadTicketQueueUseCase'

export type UseCases = {
  loadTicketQueue: LoadTicketQueueUseCase
  loadDashboardSummary: LoadDashboardSummaryUseCase
  getDashboardInfo: GetDashboardInfoUseCase
  listMembers: ListMembersUseCase
}

export type Dependencies = {
  useCases: UseCases
  telemetry: DashboardTelemetry
}

const DependenciesContext = createContext<Dependencies | null>(null)

export function DependenciesProvider({ value, children }: { value: Dependencies; children: ReactNode }) {
  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>
}

/** The dependencies an outer provider supplies, or null (the composition root then supplies its own). */
export function useProvidedDependencies(): Dependencies | null {
  return useContext(DependenciesContext)
}

export function useDependencies(): Dependencies {
  const deps = useContext(DependenciesContext)
  if (!deps) throw new Error('useDependencies: render inside DependenciesProvider (src/app/App.tsx provides it)')
  return deps
}
