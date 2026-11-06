// What presentation needs from the layers below, as contracts: repositories (domain) and telemetry
// (application port). The composition root (src/app/providers) supplies the implementations, so no
// page, widget or feature imports infrastructure.
import { createContext, useContext, type ReactNode } from 'react'
import type { DashboardTelemetry } from '../application/ports/telemetry'
import type { DashboardInfoRepository, MemberRepository, TicketRepository } from '../domain/repositories'

export type Dependencies = {
  tickets: TicketRepository
  dashboardInfo: DashboardInfoRepository
  members: MemberRepository
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
