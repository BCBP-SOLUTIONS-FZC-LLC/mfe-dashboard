import { useMemo, useState } from 'react'
import {
  Badge,
  DataTable,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  TextArea,
} from '../../components/tender/ui'
import { MOCK_DELIVERABLES } from '../../mocks/tenders'

export default function DeliverablesPage() {
  const [items, setItems] = useState(MOCK_DELIVERABLES)
  const [abandonId, setAbandonId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      const key = `${item.stageName} · ${item.department}`
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [items])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Deliverables"
        subtitle="Grouped by Stage and department. Sections open in the Drafting app (C9–C11)."
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      {grouped.map(([group, list]) => (
        <Panel key={group} title={group}>
          <DataTable
            headers={[
              'Deliverable',
              'Contributors',
              'Tiers',
              'Sections',
              'Evidence',
              'Comments',
              'Corrections',
              'Dependencies',
              '',
            ]}
          >
            {list.map((item) => (
              <tr key={item.id} className="border-b border-aura-border/70 last:border-0">
                <td className="px-2 py-3 font-medium">{item.name}</td>
                <td className="px-2 py-3 text-xs">{item.contributingDepartments.join(', ')}</td>
                <td className="px-2 py-3 text-xs">{item.tiers}</td>
                <td className="px-2 py-3">
                  <div>{item.sectionCount}</div>
                  <div className="text-xs text-aura-muted">{item.sectionStates}</div>
                </td>
                <td className="px-2 py-3 text-xs">{item.evidenceRollup}</td>
                <td className="px-2 py-3">{item.comments}</td>
                <td className="px-2 py-3">
                  {item.owedCorrections > 0 ? (
                    <Badge tone="amber">{item.owedCorrections} owed</Badge>
                  ) : (
                    '0'
                  )}
                </td>
                <td className="px-2 py-3 text-xs">{item.dependencies.join(', ') || '—'}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col gap-1">
                    <SecondaryButton
                      onClick={() =>
                        setMessage(
                          `Open Sections for “${item.name}” in Drafting app (C9–C11) — mock deep link.`,
                        )
                      }
                    >
                      Open Sections
                    </SecondaryButton>
                    {item.canGenerate ? (
                      <SecondaryButton
                        onClick={() =>
                          setMessage(`Automated generation requested for “${item.name}”.`)
                        }
                      >
                        Request generation
                      </SecondaryButton>
                    ) : null}
                    <SecondaryButton onClick={() => setAbandonId(item.id)}>Abandon</SecondaryButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ))}

      {abandonId ? (
        <Panel title="Abandon deliverable (Tender Admin)">
          <p className="m-0 mb-2 text-sm text-aura-muted">
            Required reason for abandoning {items.find((i) => i.id === abandonId)?.name}.
          </p>
          <TextArea value={reason} onChange={setReason} placeholder="Reason…" />
          <div className="mt-3 flex gap-2">
            <PrimaryButton
              onClick={() => {
                if (!reason.trim()) {
                  setMessage('Abandon requires a reason.')
                  return
                }
                setItems((prev) => prev.filter((i) => i.id !== abandonId))
                setMessage(`Deliverable ${abandonId} abandoned: ${reason.trim()}`)
                setAbandonId(null)
                setReason('')
              }}
            >
              Confirm abandon
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                setAbandonId(null)
                setReason('')
              }}
            >
              Cancel
            </SecondaryButton>
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
