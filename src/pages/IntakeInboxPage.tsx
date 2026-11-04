import { useState } from 'react'
import {
  Badge,
  DataTable,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextArea,
  formatWhen,
} from '../components/tender/ui'
import { MOCK_INTAKE } from '../mocks/tenders'
import type { IntakeItem } from '../types/tender'

export default function IntakeInboxPage() {
  const [items, setItems] = useState(MOCK_INTAKE)
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  const selected = items.find((i) => i.id === selectedId) ?? null
  const [classification, setClassification] = useState(selected?.proposedClassification ?? '')
  const [regime, setRegime] = useState(selected?.proposedRegime ?? '')
  const [rejectReason, setRejectReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  function selectItem(item: IntakeItem) {
    setSelectedId(item.id)
    setClassification(item.proposedClassification)
    setRegime(item.proposedRegime)
    setRejectReason('')
    setMessage(null)
  }

  function accept() {
    if (!selected) return
    setItems((prev) =>
      prev.map((i) =>
        i.id === selected.id
          ? { ...i, status: 'Accepted', proposedClassification: classification, proposedRegime: regime }
          : i,
      ),
    )
    setMessage(`Accepted ${selected.id} as ${classification} / ${regime}.`)
  }

  function reject() {
    if (!selected) return
    if (!rejectReason.trim()) {
      setMessage('Rejection requires a mandatory reason.')
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === selected.id ? { ...i, status: 'Rejected' } : i)),
    )
    setMessage(`Rejected ${selected.id}: ${rejectReason.trim()}`)
  }

  return (
    <div>
      <PageHeader
        title="Intake inbox"
        subtitle="Tender Admin review of received enquiries before they become tenders."
      />

      {message ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-aura-border bg-aura-surface p-2">
          <DataTable
            headers={[
              'Received',
              'Source',
              'Classification',
              'Regime',
              'Documents',
              'Roles',
              'Completeness',
              'Extraction',
              'Status',
            ]}
          >
            {items.map((item) => (
              <tr
                key={item.id}
                className={`cursor-pointer border-b border-aura-border/70 last:border-0 ${
                  item.id === selectedId ? 'bg-aura-primary-soft/40' : ''
                }`}
                onClick={() => selectItem(item)}
              >
                <td className="px-2 py-3 text-xs">{formatWhen(item.receivedAt)}</td>
                <td className="px-2 py-3 capitalize">{item.source}</td>
                <td className="px-2 py-3">{item.proposedClassification}</td>
                <td className="px-2 py-3">{item.proposedRegime}</td>
                <td className="px-2 py-3 text-xs">{item.documents.join(', ')}</td>
                <td className="px-2 py-3 text-xs">{item.claimedRoles.join(', ')}</td>
                <td className="px-2 py-3">
                  <Badge
                    tone={
                      item.completeness === 'Complete'
                        ? 'green'
                        : item.completeness === 'Partial'
                          ? 'amber'
                          : 'red'
                    }
                  >
                    {item.completeness}
                  </Badge>
                </td>
                <td className="px-2 py-3">{item.extractionProgress}%</td>
                <td className="px-2 py-3">
                  <Badge
                    tone={
                      item.status === 'Accepted'
                        ? 'green'
                        : item.status === 'Rejected'
                          ? 'red'
                          : 'neutral'
                    }
                  >
                    {item.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>

        <div className="space-y-3 rounded-xl border border-aura-border bg-aura-surface p-4">
          <h2 className="m-0 text-sm font-semibold">Review & decide</h2>
          {selected ? (
            <>
              <Field label="Classification correction">
                <Select value={classification} onChange={setClassification}>
                  <option>Design & build</option>
                  <option>Framework call-off</option>
                  <option>Consultancy</option>
                  <option>Supply only</option>
                </Select>
              </Field>
              <Field label="Regime correction">
                <Select value={regime} onChange={setRegime}>
                  <option>Public works</option>
                  <option>Utilities</option>
                  <option>Private</option>
                  <option>Defence</option>
                </Select>
              </Field>
              <div className="rounded-lg border border-aura-border p-3 text-xs text-aura-muted">
                Completeness check: <strong className="text-aura-text">{selected.completeness}</strong>
                <br />
                Extraction progress: {selected.extractionProgress}%
              </div>
              <div className="flex gap-2">
                <PrimaryButton onClick={accept}>Accept</PrimaryButton>
                <SecondaryButton onClick={reject}>Reject</SecondaryButton>
              </div>
              <Field label="Rejection reason (mandatory for Reject)">
                <TextArea
                  value={rejectReason}
                  onChange={setRejectReason}
                  placeholder="Explain why this enquiry is rejected…"
                />
              </Field>
            </>
          ) : (
            <p className="text-sm text-aura-muted">Select an enquiry.</p>
          )}
        </div>
      </div>
    </div>
  )
}
