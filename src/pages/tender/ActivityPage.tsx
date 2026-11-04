import { Badge, PageHeader, formatWhen } from '../../components/tender/ui'
import { MOCK_ACTIVITY } from '../../mocks/tenders'

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Activity"
        subtitle="Read-only chronology of decisions, transitions, uploads, reviews, overrides and AI generations."
      />

      <ol className="m-0 space-y-3 p-0 list-none">
        {MOCK_ACTIVITY.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-aura-border bg-aura-surface px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.actor === 'Automation' || item.actor === 'System' ? 'blue' : 'neutral'}>
                  {item.kind}
                </Badge>
                <span className="text-sm font-medium text-aura-text">{item.summary}</span>
              </div>
              <time className="text-xs text-aura-muted">{formatWhen(item.at)}</time>
            </div>
            <p className="mt-1 text-xs text-aura-muted">
              Actor:{' '}
              <span className="font-medium text-aura-text">
                {item.actor === 'Automation' ? 'Automation' : item.actor}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
