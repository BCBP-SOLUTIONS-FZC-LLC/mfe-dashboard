import { useEffect, useRef } from 'react'
import { getLogger } from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { APP_ID } from '../i18n'
import { recordMetric } from '../metrics'
import { calendarDate } from '../lib/dates'
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

const DAY_MS = 24 * 60 * 60 * 1000

/** Deadline filter on a ticket's due day, against the local day of `now`: 'overdue' is before today, 'week' is today and the next six days. */
export function matchesDeadline(dueDate: string, deadline: string, now: Date): boolean {
  if (deadline === 'all') return true
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const due = calendarDate(dueDate).getTime()
  if (deadline === 'overdue') return due < today
  if (deadline === 'week') return due >= today && due < today + 7 * DAY_MS
  return true
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
  if (filters.deadline !== 'all') {
    const now = new Date()
    data = data.filter((t) => matchesDeadline(t.dueDate, filters.deadline, now))
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
    const started = performance.now()
    // A finished load is counted and timed; one superseded by a newer load (aborted) is not.
    const finish = (outcome: 'success' | 'error') => {
      if (signal.aborted) return
      recordMetric('ticketLoads', 1, { view, trigger: isRefresh ? 'refresh' : 'initial', outcome })
      recordMetric('ticketLoadDuration', (performance.now() - started) / 1000, { view, outcome })
    }
    try {
      await delay(isRefresh ? 400 : 700, signal)
      const tickets = filterTickets(view, filters, canSeeAllTenders)
      const partialFailure = view === 'my-tickets' && tickets.some((t) => t.tenderDetailsUnavailable)
      finish('success')
      return { key, tickets, partialFailure, cachedAt: Date.now() }
    } catch (failure) {
      finish('error')
      throw failure
    }
  }, [key])

  // useApi keeps the last data while it loads: a refresh of the same query shows it, a new query
  // (view or filters changed) is a fresh load. An API error (ProblemError, timeout, network) is
  // 'error' with the error; useApi drops the rows then, and throws any other exception to the
  // error boundary (the shell's RemoteBoundary).
  const current = data?.key === key ? data : undefined
  const failed = error !== undefined && !loading

  // The SDK redacts the record and tags it with the remote; the shell exports it with its logs.
  useEffect(() => {
    if (error) {
      getLogger({ mfe: APP_ID }).warn('dashboard tickets failed to load', { error, view })
    }
  }, [error, view])
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
