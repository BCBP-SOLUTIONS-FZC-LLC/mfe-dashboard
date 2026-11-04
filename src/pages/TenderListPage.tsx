import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import {
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconFilter,
} from '../components/dashboard/DashboardIcons'
import {
  Badge,
  DataTable,
  EmptyState,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  deadlineLabel,
  formatWhen,
  lifecycleTone,
} from '../components/tender/ui'
import type { AppShellOutletContext } from '../layouts/appShellContext'
import { MOCK_TENDERS } from '../mocks/tenders'

type TenderFilters = {
  state: string
  stage: string
  client: string
  department: string
  assignment: string
  restriction: string
  deadline: string
}

const defaultFilters: TenderFilters = {
  state: 'all',
  stage: 'all',
  client: 'all',
  department: 'all',
  assignment: 'all',
  restriction: 'all',
  deadline: 'all',
}

function countActiveFilters(filters: TenderFilters): number {
  let count = 0
  if (filters.state !== 'all') count += 1
  if (filters.stage !== 'all') count += 1
  if (filters.client !== 'all') count += 1
  if (filters.department !== 'all') count += 1
  if (filters.assignment !== 'all') count += 1
  if (filters.restriction !== 'all') count += 1
  if (filters.deadline !== 'all') count += 1
  return count
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <label className="block w-full">
      <span className="mb-1.5 block text-sm font-medium text-aura-text">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-900 outline-none transition-[border-color,box-shadow] focus:border-aura-secondary/50 focus:ring-2 focus:ring-aura-secondary/15 dark:border-aura-border dark:bg-aura-input dark:text-aura-text"
        >
          {options.map(([val, text]) => (
            <option key={val} value={val}>
              {text}
            </option>
          ))}
        </select>
        <IconChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-aura-muted"
          aria-hidden
        />
      </div>
    </label>
  )
}

export default function TenderListPage() {
  const { slug = 'demo' } = useParams()
  const { search } = useOutletContext<AppShellOutletContext>()
  const [filters, setFilters] = useState<TenderFilters>(defaultFilters)
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)
  const [uploadNote, setUploadNote] = useState<string | null>(null)

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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MOCK_TENDERS.filter((t) => {
      if (filters.state !== 'all' && t.lifecycleState !== filters.state) return false
      if (filters.stage !== 'all' && t.stageState !== filters.stage) return false
      if (filters.client !== 'all' && t.client !== filters.client) return false
      if (filters.department !== 'all' && t.ownerDepartment !== filters.department) return false
      if (filters.assignment !== 'all' && t.assignedTo !== filters.assignment) return false
      if (filters.restriction === 'restricted' && !t.restricted) return false
      if (filters.restriction === 'open' && t.restricted) return false
      if (filters.deadline === '7d') {
        const days = (new Date(t.submissionDeadline).getTime() - Date.now()) / 86_400_000
        if (days < 0 || days > 7) return false
      }
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q)
      )
    })
  }, [search, filters])

  const clients = [...new Set(MOCK_TENDERS.map((t) => t.client))]
  const departments = [...new Set(MOCK_TENDERS.map((t) => t.ownerDepartment))]
  const assignees = [...new Set(MOCK_TENDERS.map((t) => t.assignedTo))]
  const states = [...new Set(MOCK_TENDERS.map((t) => t.lifecycleState))]
  const stages = [...new Set(MOCK_TENDERS.map((t) => t.stageState))]

  return (
    <div>
      <PageHeader
        title="Tenders"
        subtitle="Discovery and lifecycle tracking for enquiries and live packages."
        actions={
          <>
            <button
              type="button"
              onClick={() => setFiltersDrawerOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-aura-border bg-aura-surface px-3 py-2.5 text-sm font-medium text-aura-text hover:bg-aura-hover"
              aria-expanded={filtersDrawerOpen}
            >
              <IconFilter className="h-4 w-4 text-aura-secondary" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-aura-secondary px-1 text-[0.65rem] font-bold text-white dark:border dark:border-aura-secondary/60 dark:bg-transparent dark:text-aura-secondary">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <SecondaryButton onClick={() => setUploadNote('Enquiry upload dialog ready (mock).')}>
              Upload enquiry
            </SecondaryButton>
            <PrimaryButton onClick={() => setUploadNote('Routed to intake inbox after upload (mock).')}>
              New enquiry
            </PrimaryButton>
          </>
        }
      />

      {uploadNote ? (
        <p className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {uploadNote}
        </p>
      ) : null}

      {filtersDrawerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/30"
            aria-label="Close filters"
            onClick={() => setFiltersDrawerOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col border-l border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-aura-border dark:bg-aura-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tender-filters-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-aura-border">
              <h2
                id="tender-filters-title"
                className="text-lg font-bold tracking-tight text-aura-text"
              >
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setFiltersDrawerOpen(false)}
                className="-mr-1 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-aura-muted dark:hover:bg-aura-hover"
                aria-label="Close filters panel"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <FilterSelect
                label="State"
                value={filters.state}
                onChange={(state) => setFilters((f) => ({ ...f, state }))}
                options={[['all', 'All'], ...states.map((s): [string, string] => [s, s])]}
              />
              <FilterSelect
                label="Stage"
                value={filters.stage}
                onChange={(stage) => setFilters((f) => ({ ...f, stage }))}
                options={[['all', 'All'], ...stages.map((s): [string, string] => [s, s])]}
              />
              <FilterSelect
                label="Deadline"
                value={filters.deadline}
                onChange={(deadline) => setFilters((f) => ({ ...f, deadline }))}
                options={[
                  ['all', 'Any'],
                  ['7d', 'Next 7 days'],
                ]}
              />
              <FilterSelect
                label="Client"
                value={filters.client}
                onChange={(client) => setFilters((f) => ({ ...f, client }))}
                options={[['all', 'All'], ...clients.map((c): [string, string] => [c, c])]}
              />
              <FilterSelect
                label="Department"
                value={filters.department}
                onChange={(department) => setFilters((f) => ({ ...f, department }))}
                options={[['all', 'All'], ...departments.map((d): [string, string] => [d, d])]}
              />
              <FilterSelect
                label="Assignment"
                value={filters.assignment}
                onChange={(assignment) => setFilters((f) => ({ ...f, assignment }))}
                options={[['all', 'All'], ...assignees.map((a): [string, string] => [a, a])]}
              />
              <FilterSelect
                label="Restriction"
                value={filters.restriction}
                onChange={(restriction) => setFilters((f) => ({ ...f, restriction }))}
                options={[
                  ['all', 'All'],
                  ['open', 'Open'],
                  ['restricted', 'Restricted'],
                ]}
              />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-aura-border">
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-aura-input dark:text-aura-text dark:hover:bg-aura-hover"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setFiltersDrawerOpen(false)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-aura-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Apply
                <IconChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </aside>
        </>
      ) : null}

      <div className="rounded-xl border border-aura-border bg-aura-surface p-2">
        {rows.length === 0 ? (
          <EmptyState message="No tenders match the current filters." />
        ) : (
          <DataTable
            headers={[
              'Reference / title',
              'Client',
              'Lifecycle',
              'Stage',
              'Deadline',
              'Department',
              'Owner',
              'Activity',
            ]}
          >
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-aura-border/70 last:border-0">
                <td className="px-2 py-3">
                  <Link
                    to={`/t/${slug}/tenders/${t.id}`}
                    className="font-medium text-aura-primary no-underline hover:underline"
                  >
                    {t.reference}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-aura-text">
                    {t.title}
                    {t.restricted ? <Badge tone="red">Restricted</Badge> : null}
                  </div>
                </td>
                <td className="px-2 py-3 text-aura-muted">{t.client}</td>
                <td className="px-2 py-3">
                  <Badge tone={lifecycleTone(t.lifecycleState)}>{t.lifecycleState}</Badge>
                </td>
                <td className="px-2 py-3">
                  <div>{t.stageName}</div>
                  <div className="text-xs text-aura-muted">{t.stageState}</div>
                </td>
                <td className="px-2 py-3">
                  <div>{deadlineLabel(t.submissionDeadline)}</div>
                  <div className="text-xs text-aura-muted">{formatWhen(t.submissionDeadline)}</div>
                </td>
                <td className="px-2 py-3">{t.ownerDepartment}</td>
                <td className="px-2 py-3">{t.assignedTo}</td>
                <td className="px-2 py-3 text-xs text-aura-muted">{formatWhen(t.lastActivity)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  )
}
