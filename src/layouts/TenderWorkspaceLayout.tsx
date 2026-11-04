import { NavLink, Outlet, useParams } from 'react-router-dom'
import { Badge } from '../components/tender/ui'
import { getTenderDetail } from '../mocks/tenders'

const NAV: { to: string; label: string; end?: boolean }[] = [
  { to: '', label: 'Overview', end: true },
  { to: 'documents', label: 'Documents' },
  { to: 'key-information', label: 'Key information' },
  { to: 'risk', label: 'Risk / bid-no-bid' },
  { to: 'stages', label: 'Stages' },
  { to: 'deliverables', label: 'Deliverables' },
  { to: 'gaps', label: 'Gaps' },
  { to: 'clarifications', label: 'Clarifications' },
  { to: 'decisions', label: 'Decisions' },
  { to: 'submission', label: 'Submission' },
  { to: 'access', label: 'Restriction & access' },
  { to: 'activity', label: 'Activity' },
]

function tabClass({ isActive }: { isActive: boolean }) {
  return `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium no-underline transition-colors ${
    isActive
      ? 'bg-aura-primary-soft text-aura-primary'
      : 'text-aura-muted hover:bg-aura-hover hover:text-aura-text'
  }`
}

export default function TenderWorkspaceLayout() {
  const { slug = 'demo', tenderId = '' } = useParams()
  const tender = getTenderDetail(tenderId)
  const base = `/t/${slug}/tenders/${tenderId}`

  if (!tender) {
    return (
      <div className="rounded-xl border border-aura-border bg-aura-surface p-8 text-center text-sm text-aura-muted">
        Tender not found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-aura-border bg-aura-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-aura-muted">
              {tender.reference}
            </p>
            <h1 className="m-0 mt-1 text-lg font-semibold text-aura-text">{tender.title}</h1>
            <p className="mt-1 text-sm text-aura-muted">{tender.client}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{tender.lifecycleState}</Badge>
            <Badge>{tender.stageName}</Badge>
            {tender.restricted ? <Badge tone="red">Restricted</Badge> : <Badge tone="green">Open</Badge>}
          </div>
        </div>
        <p className="mt-3 text-xs text-aura-muted">
          Drafting screens (C9–C11) open in the Drafting app when Sections are launched from
          Deliverables.
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Tender workspace">
        {NAV.map((item) => (
          <NavLink
            key={item.label}
            to={item.to === '' ? base : `${base}/${item.to}`}
            end={item.end}
            className={tabClass}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ tender }} />
    </div>
  )
}
