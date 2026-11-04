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
import { MOCK_ACCESS } from '../../mocks/tenders'
import type { AccessGrant } from '../../types/tender'

export default function AccessPage() {
  const [restricted, setRestricted] = useState(true)
  const [confirmRestrict, setConfirmRestrict] = useState(false)
  const [grants, setGrants] = useState(MOCK_ACCESS)
  const [user, setUser] = useState('')
  const [level, setLevel] = useState<AccessGrant['level']>('View')
  const [reason, setReason] = useState('')
  const [expiresAt, setExpiresAt] = useState('2026-12-31')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Restriction & access"
        subtitle="Restricted marking is irreversible. Manage view / edit / approve grants."
      />

      {message ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {message}
        </p>
      ) : null}

      <Panel title="Restriction status">
        <div className="flex flex-wrap items-center gap-3">
          {restricted ? (
            <Badge tone="red">Restricted</Badge>
          ) : (
            <Badge tone="green">Open</Badge>
          )}
          {!restricted ? (
            <PrimaryButton onClick={() => setConfirmRestrict(true)}>
              Mark restricted…
            </PrimaryButton>
          ) : (
            <span className="text-xs text-aura-muted">
              Restriction cannot be reversed once confirmed.
            </span>
          )}
        </div>
        {confirmRestrict ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <p className="m-0 font-medium">Irreversible action</p>
            <p className="mt-1 text-xs">
              Marking this tender restricted permanently tightens access. Continue?
            </p>
            <div className="mt-3 flex gap-2">
              <PrimaryButton
                onClick={() => {
                  setRestricted(true)
                  setConfirmRestrict(false)
                  setMessage('Tender marked restricted.')
                }}
              >
                Confirm restrict
              </PrimaryButton>
              <SecondaryButton onClick={() => setConfirmRestrict(false)}>Cancel</SecondaryButton>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel title="Access grants">
        <DataTable headers={['User', 'Level', 'Grantor', 'Reason', 'Expiry', 'Status', '']}>
          {grants.map((g) => (
            <tr key={g.id} className="border-b border-aura-border/70 last:border-0">
              <td className="px-2 py-3">{g.user}</td>
              <td className="px-2 py-3">
                <Badge tone={g.level === 'Approve' ? 'pink' : 'neutral'}>{g.level}</Badge>
              </td>
              <td className="px-2 py-3 text-xs">{g.grantor}</td>
              <td className="px-2 py-3 text-xs">{g.reason}</td>
              <td className="px-2 py-3 text-xs">{g.expiresAt}</td>
              <td className="px-2 py-3">
                {g.revoked ? <Badge tone="red">Revoked</Badge> : <Badge tone="green">Active</Badge>}
              </td>
              <td className="px-2 py-3">
                {!g.revoked ? (
                  <SecondaryButton
                    onClick={() => {
                      setGrants((prev) =>
                        prev.map((row) => (row.id === g.id ? { ...row, revoked: true } : row)),
                      )
                      setMessage(`Revoked access for ${g.user}.`)
                    }}
                  >
                    Revoke
                  </SecondaryButton>
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Add grant">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="User">
            <TextInput value={user} onChange={setUser} placeholder="email@example.com" />
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(v) => setLevel(v as AccessGrant['level'])}>
              <option>View</option>
              <option>Edit</option>
              <option>Approve</option>
            </Select>
          </Field>
          <Field label="Expiry">
            <TextInput value={expiresAt} onChange={setExpiresAt} />
          </Field>
          <Field label="Reason">
            <TextArea value={reason} onChange={setReason} rows={2} />
          </Field>
        </div>
        <div className="mt-3">
          <PrimaryButton
            onClick={() => {
              if (!user.trim() || !reason.trim()) {
                setMessage('User and reason are required.')
                return
              }
              setGrants((prev) => [
                {
                  id: `acc-${Date.now()}`,
                  user: user.trim(),
                  level,
                  grantor: 'Tender Admin',
                  reason: reason.trim(),
                  expiresAt,
                },
                ...prev,
              ])
              setUser('')
              setReason('')
              setMessage('Grant added.')
            }}
          >
            Add grant
          </PrimaryButton>
        </div>
      </Panel>
    </div>
  )
}
