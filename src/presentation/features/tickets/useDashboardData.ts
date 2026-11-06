import { useEffect, useRef } from 'react'
import { getLogger } from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import type { DashboardFilters, DashboardView, TicketItem } from '../../../domain/entities/ticket'
import { APP_ID } from '../../../shared/constants/app'
import { useDependencies } from '../../dependencies'

export type DashboardLoadState = 'loading' | 'error' | 'ready' | 'empty' | 'partial_failure'

type Options = {
  view: DashboardView
  filters: DashboardFilters
  canSeeAllTenders: boolean
}

type Loaded = { key: string; tickets: TicketItem[]; partialFailure: boolean; cachedAt: number }

/**
 * The dashboard's ticket list: the injected LoadTicketQueueUseCase, run by
 * the platform SDK's useApi (run on change, abort the superseded load, reload; ADR 0002). Finished
 * loads are reported to the injected telemetry.
 */
export function useDashboardData({ view, filters, canSeeAllTenders }: Options) {
  const key = JSON.stringify([view, filters, canSeeAllTenders])
  const refreshRequested = useRef(false)

  const { useCases, telemetry } = useDependencies()

  const { data, error, loading, reload } = useApi(async (_api, signal): Promise<Loaded> => {
    const refresh = refreshRequested.current
    refreshRequested.current = false
    const started = performance.now()
    // A finished load is counted and timed; one superseded by a newer load (aborted) is not.
    const finish = (outcome: 'success' | 'error') => {
      if (signal.aborted) return
      telemetry.ticketLoadFinished({ view, trigger: refresh ? 'refresh' : 'initial', outcome, seconds: (performance.now() - started) / 1000 })
    }
    try {
      const queue = await useCases.loadTicketQueue.execute({ view, filters, canSeeAllTenders, now: new Date(), refresh, signal })
      finish('success')
      return { key, ...queue, cachedAt: Date.now() }
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
