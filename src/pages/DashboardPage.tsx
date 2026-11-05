import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import { formatNumber, problemMessage } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import { isProblemError } from '@bcbp-solutions-fzc-llc/frontend-sdk/problem'
import { useHasPermission, useStepUp, useT } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { APP_ID } from '../i18n'
import {
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconEmptyDoc,
  IconLoading,
  IconAlertTriangle,
  IconClose,
  IconFilter,
  IconRefresh,
  KpiViewIcon,
} from '../components/dashboard/DashboardIcons'
import type { AppShellOutletContext } from '../layouts/appShellContext'
import { DashboardRightPanel } from '../components/dashboard/DashboardRightPanel'
import { TicketRow } from '../components/dashboard/TicketRow'
import { useDashboardData } from '../hooks/useDashboardData'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useNow } from '../hooks/useNow'
import { kpiCounts, UNREAD_NOTIFICATIONS } from '../mocks/dashboardStats'
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, TENDER_OPTIONS } from '../mocks/dashboardTickets'
import type { DashboardFilters, DashboardView } from '../types/ticket'
import { dashBorderClass, dashSurfaceClass } from '../theme/themeMode'

// Labels and subtitles: `views.<id>.label` and `views.<id>.subtitle` in the app2 catalog.
const VIEWS: { id: DashboardView; adminOnly?: boolean }[] = [
  { id: 'my-tickets' },
  { id: 'awaiting-review' },
  { id: 'awaiting-approval' },
  { id: 'delegated' },
  { id: 'all-tenders', adminOnly: true },
]


const KPI_CARD_STYLE: Record<DashboardView, { surface: string; active: string }> = {
  'my-tickets': {
    surface: 'border-aura-primary/35 bg-aura-primary-soft',
    active: 'ring-2 ring-aura-primary/40 border-aura-primary/55',
  },
  'awaiting-review': {
    surface: 'border-aura-secondary/35 bg-aura-secondary-soft',
    active: 'ring-2 ring-aura-secondary/40 border-aura-secondary/55',
  },
  'awaiting-approval': {
    surface: 'border-aura-tertiary/35 bg-aura-tertiary-soft',
    active: 'ring-2 ring-aura-tertiary/40 border-aura-tertiary/55',
  },
  delegated: {
    surface: 'border-aura-accent-coral/40 bg-aura-accent-coral-soft',
    active: 'ring-2 ring-aura-accent-coral/45 border-aura-accent-coral/60',
  },
  'all-tenders': {
    surface: 'border-aura-accent-amber/40 bg-aura-accent-amber-soft',
    active: 'ring-2 ring-aura-accent-amber/45 border-aura-accent-amber/60',
  },
}

const defaultFilters: DashboardFilters = {
  status: 'all',
  role: 'all',
  department: 'all',
  deadline: 'all',
  tender: 'all',
}

function countActiveFilters(filters: DashboardFilters): number {
  let count = 0
  if (filters.status !== 'all') count += 1
  if (filters.role !== 'all') count += 1
  if (filters.department !== 'all') count += 1
  if (filters.deadline !== 'all') count += 1
  if (filters.tender !== 'all') count += 1
  return count
}

function lastUpdatedLabel(t: (key: string, vars?: Record<string, number>) => string, cachedAt: number | null, now: number) {
  if (!cachedAt) {
    return t('lastUpdated.pending')
  }
  return t('lastUpdated.ago', { mins: Math.max(1, Math.floor((now - cachedAt) / 60000)) })
}

export default function DashboardPage() {
  const { search } = useOutletContext<AppShellOutletContext>()
  const [view, setView] = useState<DashboardView>('my-tickets')
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)
  const filtersDrawerRef = useRef<HTMLElement>(null)
  useFocusTrap(filtersDrawerOpen, filtersDrawerRef)
  const t = useT(APP_ID)
  // "All Tenders In Flight" is for users who may read every tender (a UI hint; the API decides).
  const canSeeAllTenders = useHasPermission('read', 'tender')

  useEffect(() => {
    if (!filtersDrawerOpen) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [filtersDrawerOpen])

  const activeFilterCount = countActiveFilters(filters)

  const counts = useMemo(() => kpiCounts(canSeeAllTenders), [canSeeAllTenders])

  const visibleViews = useMemo(
    () => VIEWS.filter((v) => !v.adminOnly || canSeeAllTenders),
    [canSeeAllTenders],
  )

  const { loadState, tickets, cachedAt, refreshing, refresh, error } = useDashboardData({
    view,
    filters,
    canSeeAllTenders,
  })

  // "Last updated: N mins ago" keeps counting while the list is shown.
  const now = useNow(30_000, cachedAt !== null)

  const visibleTickets = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return tickets
    }
    return tickets.filter(
      (t) =>
        t.tenderTitle.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q),
    )
  }, [tickets, search])

  // Approvals need a recent MFA login: the SDK compares the login time with the tenant's window
  // (SessionContext.mfaFreshnessSeconds) and redirects back here after re-authentication.
  const stepUp = useStepUp()
  const showMfaBanner = view === 'awaiting-approval' && stepUp.needed
  const showTenderError = tickets.some((t) => t.tenderDetailsUnavailable)

  return (
    <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-sm text-aura-muted">{t('dashboard.subtitle')}</p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {visibleViews.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`cursor-pointer rounded-2xl border p-4 text-start shadow-sm transition-all hover:shadow-md ${
                  KPI_CARD_STYLE[v.id].surface
                } ${view === v.id ? KPI_CARD_STYLE[v.id].active : ''}`}
              >
                <div className="flex items-start justify-between">
                  <KpiViewIcon view={v.id} />
                  <IconChevronRight className="h-5 w-5 text-aura-muted" />
                </div>
                <p className="mt-3 text-xs font-medium text-aura-muted">{t(`views.${v.id}.label`)}</p>
                <p className="text-2xl font-bold text-aura-text">{formatNumber(counts[v.id])}</p>
                <p className="mt-1 text-[0.65rem] text-aura-muted">{t(`views.${v.id}.subtitle`)}</p>
              </button>
            ))}
          </div>

          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap gap-2">
              {visibleViews.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  aria-pressed={view === v.id}
                  className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm transition-colors ${
                    view === v.id
                      ? 'bg-aura-secondary font-semibold text-white shadow-sm'
                      : 'bg-aura-secondary-soft font-medium text-aura-secondary hover:bg-aura-secondary/15'
                  }`}
                >
                  {t(`views.${v.id}.label`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFiltersDrawerOpen(true)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${dashBorderClass} ${dashSurfaceClass} hover:bg-aura-hover`}
              aria-expanded={filtersDrawerOpen}
            >
              <IconFilter className="h-4 w-4 text-aura-secondary" />
              {t('filters.button')}
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-aura-secondary px-1 text-[0.65rem] font-bold text-white dark:border dark:border-aura-secondary/60 dark:bg-transparent dark:text-aura-secondary">
                  {formatNumber(activeFilterCount)}
                </span>
              ) : null}
            </button>
          </div>

          {filtersDrawerOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default bg-black/30"
                aria-label={t('filters.close')}
                onClick={() => setFiltersDrawerOpen(false)}
              />
              <aside
                ref={filtersDrawerRef}
                className="fixed inset-y-0 end-0 z-50 flex w-[min(100%,20rem)] flex-col border-s border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-aura-border dark:bg-aura-surface"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-filters-title"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-aura-border">
                  <h2
                    id="dashboard-filters-title"
                    className="text-lg font-bold tracking-tight text-aura-text"
                  >
                    {t('filters.title')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setFiltersDrawerOpen(false)}
                    className="-me-1 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-aura-muted dark:hover:bg-aura-hover"
                    aria-label={t('filters.closePanel')}
                  >
                    <IconClose className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                  <FilterSelect
                    label={t('filters.status')}
                    value={filters.status}
                    onChange={(status) => setFilters((f) => ({ ...f, status }))}
                    options={[
                      ['all', t('filters.status.all')],
                      ['open', t('filters.status.open')],
                      ['review', t('filters.status.review')],
                      ['approval', t('filters.status.approval')],
                    ]}
                    stacked
                  />
                  <FilterSelect
                    label={t('filters.role')}
                    value={filters.role}
                    onChange={(role) => setFilters((f) => ({ ...f, role }))}
                    options={[
                      ['all', t('filters.role.all')],
                      ...ROLE_OPTIONS.map((r): [string, string] => [r, r]),
                    ]}
                    stacked
                  />
                  <FilterSelect
                    label={t('filters.department')}
                    value={filters.department}
                    onChange={(department) => setFilters((f) => ({ ...f, department }))}
                    options={[
                      ['all', t('filters.department.all')],
                      ...DEPARTMENT_OPTIONS.map((d): [string, string] => [d, d]),
                    ]}
                    stacked
                  />
                  <FilterSelect
                    label={t('filters.deadline')}
                    value={filters.deadline}
                    onChange={(deadline) => setFilters((f) => ({ ...f, deadline }))}
                    options={[
                      ['all', t('filters.deadline.all')],
                      ['week', t('filters.deadline.week')],
                      ['overdue', t('filters.deadline.overdue')],
                    ]}
                    stacked
                  />
                  <FilterSelect
                    label={t('filters.tender')}
                    value={filters.tender}
                    onChange={(tender) => setFilters((f) => ({ ...f, tender }))}
                    options={[
                      ['all', t('filters.tender.all')],
                      ...TENDER_OPTIONS.map(([k, label]): [string, string] => [k, label]),
                    ]}
                    stacked
                  />
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-aura-border">
                  <button
                    type="button"
                    onClick={() => setFilters(defaultFilters)}
                    className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-aura-input dark:text-aura-text dark:hover:bg-aura-hover"
                  >
                    {t('filters.clear')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersDrawerOpen(false)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-aura-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    {t('filters.apply')}
                    <IconChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </aside>
            </>
          ) : null}

          {showMfaBanner ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-950">
              <span>{t('dashboard.mfaBanner')}</span>
              <button
                type="button"
                onClick={() => void stepUp.reauthenticate()}
                className="cursor-pointer font-semibold underline"
              >
                {t('dashboard.reauthenticate')}
              </button>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-aura-text">
                  {t('dashboard.listHeading', { view: t(`views.${view}.label`), count: visibleTickets.length })}
                </h2>
                <div className="flex items-center gap-2 text-xs text-aura-muted">
                  <span>{lastUpdatedLabel(t, cachedAt, now)}</span>
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    className="cursor-pointer text-aura-secondary hover:underline disabled:opacity-50"
                    aria-label={t('dashboard.refresh')}
                  >
                    <IconRefresh className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/45 dark:bg-transparent dark:text-red-300"
                >
                  <span>
                    {t('dashboard.loadFailed')}{' '}
                    {isProblemError(error) ? problemMessage(error) : null}
                  </span>
                  <button
                    type="button"
                    onClick={refresh}
                    className="cursor-pointer font-semibold text-red-800 underline dark:text-red-300"
                  >
                    {t('dashboard.retry')}
                  </button>
                </div>
              ) : null}

              {loadState === 'partial_failure' ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {t('dashboard.partialFailure')}
                </p>
              ) : null}

              {loadState === 'loading' ? (
                // Announced politely; the skeleton itself is decorative.
                <div role="status" aria-busy="true" className="space-y-3">
                  <span className="sr-only">{t('states.loading.body')}</span>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="h-28 animate-pulse rounded-xl bg-aura-border/60"
                    />
                  ))}
                </div>
              ) : null}

              {loadState === 'empty' ? (
                <div
                  className={`rounded-xl border border-dashed border-aura-border px-6 py-12 text-center ${dashSurfaceClass}`}
                >
                  <p className="text-sm font-medium text-aura-text">{t('dashboard.empty.title')}</p>
                  <p className="mt-1 text-xs text-aura-muted">{t('dashboard.empty.hint')}</p>
                  <button
                    type="button"
                    onClick={() => setFilters(defaultFilters)}
                    className="mt-3 cursor-pointer text-xs font-semibold text-aura-secondary hover:underline"
                  >
                    {t('dashboard.clearFilters')}
                  </button>
                </div>
              ) : null}

              {(loadState === 'ready' || loadState === 'partial_failure') && (
                <div className="space-y-3">
                  {visibleTickets.length === 0 ? (
                    <div
                      className={`rounded-xl border border-dashed border-aura-border px-6 py-8 text-center ${dashSurfaceClass}`}
                    >
                      <p className="text-sm font-medium text-aura-text">{t('dashboard.noMatch.title')}</p>
                      <p className="mt-1 text-xs text-aura-muted">{t('dashboard.noMatch.hint')}</p>
                    </div>
                  ) : (
                    visibleTickets.map((ticket) => (
                      <TicketRow key={ticket.id} ticket={ticket} />
                    ))
                  )}
                </div>
              )}
            </section>

            <DashboardRightPanel unreadCount={UNREAD_NOTIFICATIONS} showTenderError={showTenderError} />
          </div>

          <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StateCard
              title={t('states.empty.title')}
              icon={<IconEmptyDoc className="h-4 w-4 text-aura-primary" />}
            >
              <p className="text-xs text-aura-muted">{t('states.empty.body')}</p>
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                className="mt-2 cursor-pointer text-xs font-semibold text-aura-secondary"
              >
                {t('dashboard.clearFilters')}
              </button>
            </StateCard>
            <StateCard title={t('states.loading.title')} icon={<IconLoading className="h-4 w-4 text-aura-primary" />}>
              <p className="text-xs text-aura-muted">{t('states.loading.body')}</p>
            </StateCard>
            <StateCard
              title={t('states.fresh.title')}
              icon={<IconClock className="h-4 w-4 text-aura-secondary" />}
            >
              <p className="text-xs font-medium text-aura-text">{lastUpdatedLabel(t, cachedAt, now)}</p>
              <p className="mt-0.5 text-xs text-aura-muted">{t('states.fresh.body')}</p>
            </StateCard>
            <StateCard
              title={t('states.partial.title')}
              icon={<IconAlertTriangle className="h-4 w-4 text-red-500" />}
            >
              <p className="text-xs text-aura-muted">{t('states.partial.body')}</p>
              <button type="button" className="mt-1.5 text-xs font-semibold text-aura-secondary">
                {t('states.viewDetails')}
              </button>
            </StateCard>
          </section>
    </>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  stacked = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
  stacked?: boolean
}) {
  if (stacked) {
    return (
      <label className="block w-full">
        <span className="mb-1.5 block text-sm font-medium text-aura-text">{label}</span>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-md border border-gray-200 bg-white py-2.5 ps-3 pe-9 text-sm text-gray-900 outline-none transition-[border-color,box-shadow] focus:border-aura-secondary/50 focus:ring-2 focus:ring-aura-secondary/15 dark:border-aura-border dark:bg-aura-input dark:text-aura-text"
          >
            {options.map(([val, text]) => (
              <option key={val} value={val}>
                {text}
              </option>
            ))}
          </select>
          <IconChevronDown
            className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-aura-muted"
            aria-hidden
          />
        </div>
      </label>
    )
  }

  return (
    <label className="min-w-[8rem] flex-1 text-xs">
      <span className="mb-1 block font-medium text-aura-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-2 py-2 text-sm text-aura-text ${dashBorderClass} bg-aura-input`}
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

function StateCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${dashBorderClass} ${dashSurfaceClass}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-aura-text">{title}</p>
          <div className="mt-1.5">{children}</div>
        </div>
      </div>
    </div>
  )
}
