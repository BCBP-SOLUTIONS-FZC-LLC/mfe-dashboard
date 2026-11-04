import { useState } from 'react'
import {
  DataTable,
  Field,
  PageHeader,
  Panel,
  PrimaryButton,
  TextArea,
  TextInput,
  formatWhen,
} from '../../components/tender/ui'
import { MOCK_DECISIONS } from '../../mocks/tenders'

export default function DecisionsPage() {
  const [rows, setRows] = useState(MOCK_DECISIONS)
  const [stage, setStage] = useState('Bid / no-bid')
  const [decision, setDecision] = useState('')
  const [decider, setDecider] = useState('')
  const [rationale, setRationale] = useState('')
  const [inputs, setInputs] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Decisions"
        subtitle="Historical Stage decisions with decider, rationale, inputs and timestamp."
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      <div className="rounded-xl border border-aura-border bg-aura-surface p-2">
        <DataTable headers={['Stage', 'Decision', 'Decider', 'Rationale', 'Inputs', 'Timestamp']}>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-aura-border/70 last:border-0">
              <td className="px-2 py-3">{row.stage}</td>
              <td className="px-2 py-3 font-medium">{row.decision}</td>
              <td className="px-2 py-3">{row.decider}</td>
              <td className="px-2 py-3 text-sm">{row.rationale}</td>
              <td className="px-2 py-3 text-xs text-aura-muted">{row.inputs}</td>
              <td className="px-2 py-3 text-xs">{formatWhen(row.timestamp)}</td>
            </tr>
          ))}
        </DataTable>
      </div>

      <Panel title="Create decision (authorized Tender Admin)">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Stage">
            <TextInput value={stage} onChange={setStage} />
          </Field>
          <Field label="Decision">
            <TextInput value={decision} onChange={setDecision} placeholder="e.g. Bid" />
          </Field>
          <Field label="Decider">
            <TextInput value={decider} onChange={setDecider} />
          </Field>
          <Field label="Inputs">
            <TextInput value={inputs} onChange={setInputs} placeholder="Documents / packs used" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Required rationale">
            <TextArea value={rationale} onChange={setRationale} />
          </Field>
        </div>
        <div className="mt-3">
          <PrimaryButton
            onClick={() => {
              if (!decision.trim() || !decider.trim() || !rationale.trim()) {
                setMessage('Decision, decider and rationale are required.')
                return
              }
              setRows((prev) => [
                {
                  id: `dec-${Date.now()}`,
                  stage,
                  decision: decision.trim(),
                  decider: decider.trim(),
                  rationale: rationale.trim(),
                  inputs: inputs.trim() || '—',
                  timestamp: new Date().toISOString(),
                },
                ...prev,
              ])
              setDecision('')
              setRationale('')
              setMessage('Decision recorded.')
            }}
          >
            Create decision
          </PrimaryButton>
        </div>
      </Panel>
    </div>
  )
}
