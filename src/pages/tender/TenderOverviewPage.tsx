import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import {
  Badge,
  Panel,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  deadlineLabel,
  formatWhen,
} from '../../components/tender/ui'
import type { TenderDetail } from '../../types/tender'

export default function TenderOverviewPage() {
  const { slug = 'demo', tenderId = '' } = useParams()
  const { tender } = useOutletContext<{ tender: TenderDetail }>()
  const [message, setMessage] = useState<string | null>(null)
  const [outcome, setOutcome] = useState('')
  const [withdrawReason, setWithdrawReason] = useState('')

  const base = `/t/${slug}/tenders/${tenderId}`

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Header" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase text-aura-muted">Client</dt>
              <dd className="m-0 mt-1">{tender.client}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-aura-muted">Reference</dt>
              <dd className="m-0 mt-1">{tender.reference}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-aura-muted">Status</dt>
              <dd className="m-0 mt-1">
                <Badge tone="blue">{tender.lifecycleState}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-aura-muted">Deadline</dt>
              <dd className="m-0 mt-1">
                {deadlineLabel(tender.submissionDeadline)}{' '}
                <span className="text-aura-muted">({formatWhen(tender.submissionDeadline)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-aura-muted">Restriction</dt>
              <dd className="m-0 mt-1">
                {tender.restricted ? (
                  <Badge tone="red">Restricted</Badge>
                ) : (
                  <Badge tone="green">Open</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-aura-muted">Owner department</dt>
              <dd className="m-0 mt-1">{tender.ownerDepartment}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-aura-muted">{tender.description}</p>
        </Panel>

        <Panel title="Authorized actions">
          <div className="flex flex-col gap-2">
            <SecondaryButton onClick={() => setMessage('Workflow assignment sheet opened (mock).')}>
              Assign workflow
            </SecondaryButton>
            <SecondaryButton
              onClick={() => setMessage('Restriction flow → see Restriction & access.')}
            >
              Mark restricted
            </SecondaryButton>
            <div className="space-y-2 rounded-lg border border-aura-border p-2">
              <label className="block text-xs font-medium text-aura-muted">Record outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-md border border-aura-border px-2 py-1.5 text-sm"
              >
                <option value="">Select…</option>
                <option>Awarded</option>
                <option>Lost</option>
                <option>No response</option>
              </select>
              <PrimaryButton
                onClick={() =>
                  setMessage(outcome ? `Outcome recorded: ${outcome}` : 'Select an outcome first.')
                }
              >
                Save outcome
              </PrimaryButton>
            </div>
            <div className="space-y-2 rounded-lg border border-aura-border p-2">
              <TextArea
                value={withdrawReason}
                onChange={setWithdrawReason}
                placeholder="Withdrawal reason…"
                rows={2}
              />
              <SecondaryButton
                onClick={() =>
                  setMessage(
                    withdrawReason.trim()
                      ? `Withdrawal requested: ${withdrawReason.trim()}`
                      : 'Withdrawal requires a reason.',
                  )
                }
              >
                Withdraw tender
              </SecondaryButton>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Lifecycle timeline">
          <ol className="m-0 space-y-2 p-0 list-none">
            {tender.timeline.map((step) => (
              <li key={step.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${step.done ? 'bg-green-500' : 'bg-aura-border'}`}
                />
                <span className="flex-1">{step.label}</span>
                <span className="text-xs text-aura-muted">{step.at}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Stage progress">
          <p className="m-0 text-sm">
            Current stage: <strong>{tender.stageName}</strong> ({tender.stageState})
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-aura-hover">
            <div className="h-full w-[45%] rounded-full bg-[linear-gradient(90deg,#ff4fa3,#8b5cf6)]" />
          </div>
          <Link to={`${base}/stages`} className="mt-3 inline-block text-sm text-aura-primary">
            Open stages & workflows
          </Link>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Key Tender Information">
          <p className="m-0 text-sm text-aura-muted">Highlights and extraction outcomes.</p>
          <Link to={`${base}/key-information`} className="mt-2 inline-block text-sm text-aura-primary">
            View ~70 fields
          </Link>
        </Panel>
        <Panel title="Gaps & clarifications">
          <p className="m-0 text-2xl font-semibold">
            {tender.gapCount} <span className="text-sm font-normal text-aura-muted">gaps</span>
          </p>
          <p className="m-0 mt-1 text-2xl font-semibold">
            {tender.clarificationCount}{' '}
            <span className="text-sm font-normal text-aura-muted">clarifications</span>
          </p>
        </Panel>
        <Panel title="Deliverable evidence">
          <p className="m-0 text-sm">{tender.deliverableEvidence}</p>
          <Link to={`${base}/deliverables`} className="mt-2 inline-block text-sm text-aura-primary">
            Open deliverables
          </Link>
        </Panel>
        <Panel title="Your tasks">
          <ul className="m-0 space-y-2 p-0 list-none text-sm">
            {tender.userTasks.map((task) => (
              <li key={task.id} className="flex justify-between gap-2">
                <span>{task.title}</span>
                <span className="text-xs text-aura-muted">{task.due}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
