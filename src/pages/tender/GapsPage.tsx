import { useState } from 'react'
import {
  Badge,
  DataTable,
  Field,
  PageHeader,
  Panel,
  PrimaryButton,
  Select,
  TextArea,
} from '../../components/tender/ui'
import { MOCK_GAPS } from '../../mocks/tenders'

const OUTCOMES = [
  'Re-extract',
  'Supply information with source note',
  'Await external input',
  'Mark not in scope',
  'Accept with stated assumption',
] as const

export default function GapsPage() {
  const [gaps, setGaps] = useState(MOCK_GAPS)
  const [selectedId, setSelectedId] = useState(gaps[0]?.id ?? '')
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>(OUTCOMES[0])
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gaps"
        subtitle="Missing or inconsistent information. Gaps never block work — resolve when ready."
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-aura-border bg-aura-surface p-2">
          <DataTable
            headers={[
              'Gap',
              'Location',
              'Detection',
              'Linked Section / field / clarification',
              'Status',
            ]}
          >
            {gaps.map((gap) => (
              <tr
                key={gap.id}
                className={`cursor-pointer border-b border-aura-border/70 last:border-0 ${
                  gap.id === selectedId ? 'bg-aura-primary-soft/40' : ''
                }`}
                onClick={() => setSelectedId(gap.id)}
              >
                <td className="px-2 py-3 font-medium">{gap.summary}</td>
                <td className="px-2 py-3 text-xs">{gap.location}</td>
                <td className="px-2 py-3 text-xs">{gap.detectionMethod}</td>
                <td className="px-2 py-3 text-xs">
                  {[gap.linkedSection, gap.linkedField, gap.linkedClarification]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td className="px-2 py-3">
                  <Badge
                    tone={
                      gap.status === 'Resolved'
                        ? 'green'
                        : gap.status === 'In progress'
                          ? 'amber'
                          : 'neutral'
                    }
                  >
                    {gap.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>

        <Panel title="Resolve gap">
          <Field label="Resolution outcome">
            <Select value={outcome} onChange={(v) => setOutcome(v as (typeof OUTCOMES)[number])}>
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-3">
            <Field label="Source note / assumption">
              <TextArea value={note} onChange={setNote} placeholder="Required detail for outcome…" />
            </Field>
          </div>
          <div className="mt-3">
            <PrimaryButton
              onClick={() => {
                if (!selectedId) return
                if (
                  (outcome === 'Supply information with source note' ||
                    outcome === 'Accept with stated assumption') &&
                  !note.trim()
                ) {
                  setMessage('This outcome requires a source note or assumption.')
                  return
                }
                setGaps((prev) =>
                  prev.map((g) =>
                    g.id === selectedId
                      ? {
                          ...g,
                          status:
                            outcome === 'Await external input' ? 'In progress' : 'Resolved',
                        }
                      : g,
                  ),
                )
                setMessage(`${selectedId}: ${outcome}${note.trim() ? ` — ${note.trim()}` : ''}`)
              }}
            >
              Apply resolution
            </PrimaryButton>
          </div>
        </Panel>
      </div>
    </div>
  )
}
