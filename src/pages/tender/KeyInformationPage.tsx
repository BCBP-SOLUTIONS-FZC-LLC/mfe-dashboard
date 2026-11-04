import { useMemo, useState } from 'react'
import {
  Badge,
  Field,
  PageHeader,
  Panel,
  SecondaryButton,
  Select,
  TextInput,
} from '../../components/tender/ui'
import { MOCK_KTI_FIELDS } from '../../mocks/tenders'
import type { KtiField, KtiGroup, KtiOutcome } from '../../types/tender'

const GROUPS: KtiGroup[] = [
  'Submission mechanics',
  'Commercial terms',
  'Risk / liability',
  'Legal / jurisdictional',
  'Delivery obligations',
  'Correspondence',
]

export default function KeyInformationPage() {
  const [fields, setFields] = useState(MOCK_KTI_FIELDS)
  const [groupFilter, setGroupFilter] = useState<'all' | KtiGroup>('all')
  const [message, setMessage] = useState<string | null>(null)

  const visible = useMemo(
    () => (groupFilter === 'all' ? fields : fields.filter((f) => f.group === groupFilter)),
    [fields, groupFilter],
  )

  const grouped = useMemo(() => {
    return GROUPS.map((g) => [g, visible.filter((f) => f.group === g)] as const).filter(
      ([, list]) => list.length > 0,
    )
  }, [visible])

  function updateField(id: string, patch: Partial<KtiField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function markNa(id: string) {
    updateField(id, {
      outcome: 'Not applicable',
      value: '—',
      correctedBy: 'Tender Admin',
    })
    setMessage(`Marked ${id} not applicable.`)
  }

  function reextract(id: string) {
    setMessage(`Re-extraction queued for ${id} (mock).`)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Key Tender Information"
        subtitle={`${fields.length} fields across six groups — value, outcome, source and attribution.`}
        actions={
          <Field label="Group">
            <Select
              value={groupFilter}
              onChange={(v) => setGroupFilter(v as 'all' | KtiGroup)}
            >
              <option value="all">All groups</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
        }
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      {grouped.map(([group, list]) => (
        <Panel key={group} title={`${group} (${list.length})`}>
          <div className="space-y-3">
            {list.map((field) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-aura-border p-3 lg:grid-cols-[1.1fr_1fr_1fr_auto]"
              >
                <div>
                  <p className="m-0 text-sm font-medium">{field.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge
                      tone={
                        field.outcome === 'Found'
                          ? 'green'
                          : field.outcome === 'Not applicable'
                            ? 'neutral'
                            : 'amber'
                      }
                    >
                      {field.outcome}
                    </Badge>
                    {field.translated ? <Badge tone="blue">Translated</Badge> : null}
                    {field.correctedBy ? (
                      <Badge tone="pink">Corrected by {field.correctedBy}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-aura-muted">
                    {field.sourceDocument
                      ? `${field.sourceDocument} · p.${field.sourcePage} · ${field.sourceClause}`
                      : 'No source yet'}
                  </p>
                </div>
                <TextInput
                  value={field.value}
                  onChange={(value) =>
                    updateField(field.id, { value, correctedBy: 'Tender Admin', outcome: 'Found' })
                  }
                  placeholder="Value"
                />
                <Select
                  value={field.outcome}
                  onChange={(outcome) =>
                    updateField(field.id, {
                      outcome: outcome as KtiOutcome,
                      correctedBy: 'Tender Admin',
                    })
                  }
                >
                  <option>Found</option>
                  <option>Not found</option>
                  <option>Not applicable</option>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => markNa(field.id)}>N/A</SecondaryButton>
                  <SecondaryButton onClick={() => reextract(field.id)}>Re-extract</SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  )
}
