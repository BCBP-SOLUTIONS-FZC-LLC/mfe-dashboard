// The composition root's use cases for tests that render a page, layout or hook outside App (App
// supplies its own). Override any repository or the telemetry: e.g. a TicketRepository that fails or
// never settles; the use cases are built on it as in production.
import type { ReactNode } from 'react'
import { createDependencies, type Infrastructure } from '../../src/app/providers/dependencies'
import { DependenciesProvider, type Dependencies } from '../../src/presentation/dependencies'

export function testDependencies(overrides: Partial<Infrastructure> = {}): Dependencies {
  return createDependencies(overrides)
}

/** A wrapper that provides `deps` (and, when given, wraps the SDK platform's Wrapper around it). */
export function withDependencies(deps: Dependencies = testDependencies(), Outer?: (p: { children: ReactNode }) => ReactNode) {
  return function DependenciesWrapper({ children }: { children: ReactNode }) {
    const inner = <DependenciesProvider value={deps}>{children}</DependenciesProvider>
    return Outer ? <Outer>{inner}</Outer> : inner
  }
}
