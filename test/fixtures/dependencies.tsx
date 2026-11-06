// The composition root's dependencies for tests that render a page, layout or hook outside App
// (App supplies its own). Override any of them: e.g. a TicketRepository that fails or never settles.
import type { ReactNode } from 'react'
import { createDependencies } from '../../src/app/providers/dependencies'
import { DependenciesProvider, type Dependencies } from '../../src/presentation/dependencies'

export function testDependencies(overrides: Partial<Dependencies> = {}): Dependencies {
  return { ...createDependencies(), ...overrides }
}

/** A wrapper that provides `deps` (and, when given, wraps the SDK platform's Wrapper around it). */
export function withDependencies(deps: Dependencies = testDependencies(), Outer?: (p: { children: ReactNode }) => ReactNode) {
  return function DependenciesWrapper({ children }: { children: ReactNode }) {
    const inner = <DependenciesProvider value={deps}>{children}</DependenciesProvider>
    return Outer ? <Outer>{inner}</Outer> : inner
  }
}
