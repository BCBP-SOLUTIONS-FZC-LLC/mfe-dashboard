import { useState } from 'react'
import {
  Badge,
  Field,
  PageHeader,
  Panel,
  PrimaryButton,
  TextArea,
  TextInput,
} from '../../components/tender/ui'
import { MOCK_RISKS } from '../../mocks/tenders'

export default function RiskBidPage() {
  const [choice, setChoice] = useState<'' | 'Bid' | 'No-bid' | 'Reject'>('')
  const [rationale, setRationale] = useState('')
  const [decider, setDecider] = useState('')
  const [ackComplete, setAckComplete] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function submit() {
    if (!choice) {
      setMessage('Recommendation is advisory only — you must explicitly choose Bid, No-bid or Reject.')
      return
    }
    if (!rationale.trim() || !decider.trim()) {
      setMessage('Rationale and named decider are required.')
      return
    }
    if (!ackComplete) {
      setMessage('Acknowledge document completeness before recording the decision.')
      return
    }
    setMessage(`${choice} recorded by ${decider.trim()}.`)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Risk & bid / no-bid"
        subtitle="Advisory recommendation only — never pre-selected. Tender Admin records the decision."
      />

      {message ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {(['Commercial', 'Contractual', 'Delivery'] as const).map((category) => (
          <Panel key={category} title={`${category} risks`}>
            <ul className="m-0 space-y-3 p-0 list-none">
              {MOCK_RISKS.filter((r) => r.category === category).map((risk) => (
                <li key={risk.id} className="rounded-lg border border-aura-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <strong>{risk.title}</strong>
                    <Badge
                      tone={
                        risk.severity === 'Critical' || risk.severity === 'High' ? 'red' : 'amber'
                      }
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-aura-muted">
                    Fields: {risk.contributingFields.join(', ')}
                  </p>
                  <p className="mt-1 text-xs">Evidence: {risk.evidence}</p>
                  {risk.departmentInput ? (
                    <p className="mt-1 text-xs text-aura-muted">Dept: {risk.departmentInput}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <Panel title="Advisory recommendation">
        <p className="m-0 text-sm">
          Based on critical contractual liability and high commercial LD exposure, Automation suggests
          reviewing caps before Bid. <strong>No option is pre-selected.</strong>
        </p>
        <p className="mt-2 text-xs text-aura-muted">
          Reasoning evidence: Conditions cl. 17.4; ITT §8.2; Commercial memo 24 Oct.
        </p>
      </Panel>

      <Panel title="Decision (Tender Admin)">
        <div className="grid gap-3 md:grid-cols-3">
          {(['Bid', 'No-bid', 'Reject'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setChoice(option)}
              className={`cursor-pointer rounded-lg border px-3 py-3 text-sm font-semibold ${
                choice === option
                  ? 'border-[#ff2d9a] bg-aura-primary-soft text-aura-primary'
                  : 'border-aura-border bg-aura-surface text-aura-text'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Named decider">
            <TextInput value={decider} onChange={setDecider} placeholder="Full name" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-aura-text">
            <input
              type="checkbox"
              checked={ackComplete}
              onChange={(e) => setAckComplete(e.target.checked)}
            />
            Document-completeness acknowledged
          </label>
        </div>
        <div className="mt-3">
          <Field label="Required rationale">
            <TextArea value={rationale} onChange={setRationale} placeholder="Decision rationale…" />
          </Field>
        </div>
        <div className="mt-3">
          <PrimaryButton onClick={submit}>Record decision</PrimaryButton>
        </div>
      </Panel>
    </div>
  )
}
