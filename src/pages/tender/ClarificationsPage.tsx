import { useState } from 'react'
import {
  Badge,
  DataTable,
  Field,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from '../../components/tender/ui'
import { MOCK_CLARIFICATIONS } from '../../mocks/tenders'
import type { ClarificationItem } from '../../types/tender'

export default function ClarificationsPage() {
  const [rows, setRows] = useState(MOCK_CLARIFICATIONS)
  const [question, setQuestion] = useState('')
  const [department, setDepartment] = useState('Civil')
  const [responseText, setResponseText] = useState('')
  const [selectedId, setSelectedId] = useState(rows[1]?.id ?? '')
  const [message, setMessage] = useState<string | null>(null)

  function update(id: string, patch: Partial<ClarificationItem>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clarification register"
        subtitle="Raise questions, record client responses, accept or open a follow-up round."
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      <div className="rounded-xl border border-aura-border bg-aura-surface p-2">
        <DataTable
          headers={[
            'Question',
            'Department',
            'Round',
            'Issued',
            'Client response',
            'Status',
            'Linked gap',
            '',
          ]}
        >
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-aura-border/70 last:border-0 ${
                row.id === selectedId ? 'bg-aura-primary-soft/40' : ''
              }`}
            >
              <td className="px-2 py-3 text-sm">{row.question}</td>
              <td className="px-2 py-3">{row.raisingDepartment}</td>
              <td className="px-2 py-3">{row.round}</td>
              <td className="px-2 py-3 text-xs">{row.issuedDate}</td>
              <td className="px-2 py-3 text-xs">{row.clientResponse ?? '—'}</td>
              <td className="px-2 py-3">
                <Badge tone={row.responseStatus === 'Accepted' ? 'green' : 'neutral'}>
                  {row.responseStatus}
                </Badge>
              </td>
              <td className="px-2 py-3 text-xs">{row.linkedGap ?? '—'}</td>
              <td className="px-2 py-3">
                <SecondaryButton onClick={() => setSelectedId(row.id)}>Select</SecondaryButton>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Raise question">
          <Field label="Department">
            <TextInput value={department} onChange={setDepartment} />
          </Field>
          <div className="mt-3">
            <Field label="Question">
              <TextArea value={question} onChange={setQuestion} />
            </Field>
          </div>
          <div className="mt-3">
            <PrimaryButton
              onClick={() => {
                if (!question.trim()) {
                  setMessage('Question text is required.')
                  return
                }
                const id = `clr-${Date.now()}`
                setRows((prev) => [
                  {
                    id,
                    question: question.trim(),
                    raisingDepartment: department,
                    round: 2,
                    issuedDate: new Date().toISOString().slice(0, 10),
                    responseStatus: 'Draft',
                  },
                  ...prev,
                ])
                setQuestion('')
                setMessage(`Clarification ${id} drafted.`)
              }}
            >
              Raise
            </PrimaryButton>
          </div>
        </Panel>

        <Panel title="Record response / follow-up">
          <Field label="Client response">
            <TextArea value={responseText} onChange={setResponseText} />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => {
                if (!selectedId || !responseText.trim()) {
                  setMessage('Select a row and enter the client response.')
                  return
                }
                update(selectedId, {
                  clientResponse: responseText.trim(),
                  responseStatus: 'Answered',
                })
                setMessage(`Response recorded on ${selectedId}.`)
              }}
            >
              Record response
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                if (!selectedId) return
                update(selectedId, { responseStatus: 'Accepted' })
                setMessage(`Accepted ${selectedId}.`)
              }}
            >
              Accept
            </SecondaryButton>
            <SecondaryButton
              onClick={() => {
                const source = rows.find((r) => r.id === selectedId)
                if (!source) return
                const id = `clr-${Date.now()}`
                setRows((prev) => [
                  {
                    id,
                    question: `Follow-up: ${source.question}`,
                    raisingDepartment: source.raisingDepartment,
                    round: source.round + 1,
                    issuedDate: new Date().toISOString().slice(0, 10),
                    responseStatus: 'Draft',
                    linkedGap: source.linkedGap,
                  },
                  ...prev,
                ])
                update(selectedId, { responseStatus: 'Follow-up' })
                setMessage(`Opened follow-up round ${source.round + 1} as ${id}.`)
              }}
            >
              Follow-up round
            </SecondaryButton>
          </div>
        </Panel>
      </div>
    </div>
  )
}
