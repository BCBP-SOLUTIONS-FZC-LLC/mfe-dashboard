import { useCallback, useEffect, useState } from 'react'
import { ticketsForView } from '../mocks/dashboardTickets'
import type { DashboardFilters, DashboardView, TicketItem } from '../types/ticket'

export type DashboardLoadState = 'loading' | 'ready' | 'empty' | 'partial_failure'

type Options = {
  view: DashboardView
  filters: DashboardFilters
  canSeeAllTenders: boolean
}

export function useDashboardData({ view, filters, canSeeAllTenders }: Options) {
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading')
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoadState('loading')
      }

      window.setTimeout(() => {
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
          data = data.filter((t) =>
            t.tenderTitle.toLowerCase().includes(filters.tender.toLowerCase()),
          )
        }

        const partialFailure = view === 'my-tickets' && data.some((t) => t.tenderDetailsUnavailable)
        setTickets(data)
        setCachedAt(Date.now())
        setLoadState(
          partialFailure ? 'partial_failure' : data.length === 0 ? 'empty' : 'ready',
        )
        setRefreshing(false)
      }, isRefresh ? 400 : 700)
    },
    [view, filters, canSeeAllTenders],
  )

  useEffect(() => {
    load(false)
  }, [load])

  return { loadState, tickets, cachedAt, refreshing, refresh: () => load(true) }
}
