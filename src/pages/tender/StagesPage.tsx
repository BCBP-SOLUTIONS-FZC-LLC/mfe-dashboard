import { useState } from 'react'
import {
  Badge,
  DataTable,
  Field,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextArea,
  TextInput,
} from '../../components/tender/ui'
import { MOCK_STAGES } from '../../mocks/tenders'

export default function StagesPage() {
  const [stages, setStages] = useState(MOCK_STAGES)
  const [selectedId, setSelectedId] = useState(stages[2]?.id ?? '')
  const [workflow, setWorkflow] = useState('wf-tech-v3')
  const [overrideAssignee, setOverrideAssignee] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const selected = stages.find((s) => s.id === selectedId)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stages & workflows"
        subtitle="Bindings, instance state, progress and assignee overrides."
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      <div className="rounded-xl border border-aura-border bg-aura-surface p-2">
        <DataTable
          headers={[
            'Stage',
            'Workflow binding',
            'Stage state',
            'Instance state',
            'Progress',
            'Assignees',
            '',
          ]}
        >
          {stages.map((stage) => (
            <tr
              key={stage.id}
              className={`border-b border-aura-border/70 last:border-0 ${
                stage.id === selectedId ? 'bg-aura-primary-soft/40' : ''
              }`}
            >
              <td className="px-2 py-3 font-medium">{stage.stageName}</td>
              <td className="px-2 py-3 font-mono text-xs">{stage.workflowBinding}</td>
              <td className="px-2 py-3">
                <Badge tone={stage.stageState === 'Paused' ? 'amber' : 'neutral'}>
                  {stage.stageState}
                </Badge>
              </td>
              <td className="px-2 py-3">{stage.workflowInstanceState}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-aura-hover">
                    <div
                      className="h-full rounded-full bg-[#8b5cf6]"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <span className="text-xs">{stage.progress}%</span>
                </div>
              </td>
              <td className="px-2 py-3 text-xs">{stage.assignees.join(', ') || '—'}</td>
              <td className="px-2 py-3">
                <SecondaryButton onClick={() => setSelectedId(stage.id)}>Manage</SecondaryButton>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {selected ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={`Manage — ${selected.stageName}`}>
            <Field label="Workflow selection">
              <Select value={workflow} onChange={setWorkflow}>
                <option value="wf-tech-v3">wf-tech-v3</option>
                <option value="wf-tech-v2">wf-tech-v2</option>
                <option value="wf-comm-v2">wf-comm-v2</option>
                <option value="wf-submit-v1">wf-submit-v1</option>
              </Select>
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <SecondaryButton onClick={() => setMessage(`Step preview for ${workflow} (mock).`)}>
                Preview steps
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  setStages((prev) =>
                    prev.map((s) =>
                      s.id === selected.id
                        ? {
                            ...s,
                            workflowBinding: workflow,
                            stageState: 'In progress',
                            workflowInstanceState: 'Running',
                          }
                        : s,
                    ),
                  )
                  setMessage(`Started workflow ${workflow} on ${selected.stageName}.`)
                }}
              >
                Start workflow
              </PrimaryButton>
            </div>
            {selected.pausedReason ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Paused: {selected.pausedReason}
              </p>
            ) : null}
          </Panel>

          <Panel title="Eligible assignee override">
            <Field label="Assignee">
              <TextInput
                value={overrideAssignee}
                onChange={setOverrideAssignee}
                placeholder="User or role"
              />
            </Field>
            <div className="mt-3">
              <Field label="Reason (required)">
                <TextArea value={overrideReason} onChange={setOverrideReason} rows={2} />
              </Field>
            </div>
            <div className="mt-3">
              <PrimaryButton
                onClick={() => {
                  if (!overrideAssignee.trim() || !overrideReason.trim()) {
                    setMessage('Override requires assignee and reason.')
                    return
                  }
                  setStages((prev) =>
                    prev.map((s) =>
                      s.id === selected.id
                        ? {
                            ...s,
                            assignees: [...new Set([...s.assignees, overrideAssignee.trim()])],
                          }
                        : s,
                    ),
                  )
                  setMessage(
                    `Override applied: ${overrideAssignee.trim()} — ${overrideReason.trim()}`,
                  )
                }}
              >
                Apply override
              </PrimaryButton>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  )
}
