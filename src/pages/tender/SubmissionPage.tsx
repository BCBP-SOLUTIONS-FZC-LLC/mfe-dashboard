import { useState } from 'react'
import {
  DataTable,
  PageHeader,
  Panel,
  SecondaryButton,
  formatWhen,
} from '../../components/tender/ui'
import { MOCK_SUBMISSION } from '../../mocks/tenders'

export default function SubmissionPage() {
  const record = MOCK_SUBMISSION
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Submission record"
        subtitle="Sealed record of submitted deliverables, hashes, gaps and channel."
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Issuer">
          <p className="m-0 text-sm font-medium">{record.issuedBy}</p>
        </Panel>
        <Panel title="Submitted">
          <p className="m-0 text-sm">{formatWhen(record.submittedAt)}</p>
        </Panel>
        <Panel title="Channel">
          <p className="m-0 text-sm">{record.channel}</p>
        </Panel>
        <Panel title="Outstanding">
          <p className="m-0 text-sm">
            {record.outstandingGaps} gaps · {record.outstandingClarifications} clarifications
          </p>
        </Panel>
      </div>

      <Panel title="Submitted deliverables & artifact hashes">
        <DataTable headers={['Artifact', 'SHA-256', '']}>
          {record.deliverables.map((d) => (
            <tr key={d.name} className="border-b border-aura-border/70 last:border-0">
              <td className="px-2 py-3 font-medium">{d.name}</td>
              <td className="px-2 py-3 font-mono text-xs">{d.sha256}</td>
              <td className="px-2 py-3">
                <SecondaryButton onClick={() => setMessage(`Download started for ${d.name} (mock).`)}>
                  Download
                </SecondaryButton>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="External inputs">
        <ul className="m-0 list-disc space-y-1 pl-5 text-sm">
          {record.externalInputs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
