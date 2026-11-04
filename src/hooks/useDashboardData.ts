import { useRef } from 'react'
import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { ticketsForView } from '../mocks/dashboardTickets'
import type { DashboardFilters, DashboardView, TicketItem } from '../types/ticket'

export type DashboardLoadState = 'loading' | 'error' | 'ready' | 'empty' | 'partial_failure'

type Options = {
  view: DashboardView
  filters: DashboardFilters
  canSeeAllTenders: boolean
}

type Loaded = { key: string; tickets: TicketItem[]; partialFailure: boolean; cachedAt: number }

/** Resolves after `ms` unless `signal` aborts first (useApi aborts a superseded load). */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => window.clearTimeout(timer), { once: true })
  })
}

function filterTickets(view: DashboardView, filters: DashboardFilters, canSeeAllTenders: boolean) {
  let data = ticketsForView(view, canSeeAllTenders)
  if (filters.status !== 'all') {
    data = data.filter((t) => t.status === filters.status)
  }
  if (filters.department !== 'all') {
    data = data.filter((t) => t.department === filters.department)
  }
  if (filters.role !== 'all') {
    data = data.filter((t) => t.roleLevel.includes(filters.role))
  }
  if (filters.tender !== 'all') {
    data = data.filter((t) => t.tenderTitle.toLowerCase().includes(filters.tender.toLowerCase()))
  }
  return data
}

/**
 * The dashboard's tickets. The load lifecycle (run on change, abort the superseded load, reload) is
 * the SDK's useApi; the data is still the in-repo fixtures, so the loader ignores the ApiClient
 * until a tickets API exists.
 */
export function useDashboardData({ view, filters, canSeeAllTenders }: Options) {
  const key = JSON.stringify([view, filters, canSeeAllTenders])
  const refreshRequested = useRef(false)

  const { data, error, loading, reload } = useApi(async (_api, signal): Promise<Loaded> => {
    const isRefresh = refreshRequested.current
    refreshRequested.current = false
    await delay(isRefresh ? 400 : 700, signal)
    const tickets = filterTickets(view, filters, canSeeAllTenders)
    const partialFailure = view === 'my-tickets' && tickets.some((t) => t.tenderDetailsUnavailable)
    return { key, tickets, partialFailure, cachedAt: Date.now() }
  }, [key])

  // useApi keeps the last data while it loads: a refresh of the same query shows it, a new query
  // (view or filters changed) is a fresh load. An API error (ProblemError, timeout, network) is
  // 'error' with the error; useApi drops the rows then, and throws any other exception to the
  // error boundary (the shell's RemoteBoundary).
  const current = data?.key === key ? data : undefined
  const failed = error !== undefined && !loading
  const loadState: DashboardLoadState = !current
    ? failed
      ? 'error'
      : 'loading'
    : current.partialFailure
      ? 'partial_failure'
      : current.tickets.length === 0
        ? 'empty'
        : 'ready'

  return {
    loadState,
    tickets: current?.tickets ?? [],
    cachedAt: current?.cachedAt ?? null,
    refreshing: loading && current !== undefined,
    /** The failed load's SDK ApiError, until a reload succeeds. */
    error: failed ? error : undefined,
    refresh: () => {
      refreshRequested.current = true
      reload()
    },
  }
}
