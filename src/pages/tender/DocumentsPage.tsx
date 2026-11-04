import { useMemo, useState } from 'react'
import {
  Badge,
  DataTable,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
} from '../../components/tender/ui'
import { MOCK_DOCUMENTS } from '../../mocks/tenders'

export default function DocumentsPage() {
  const [docs, setDocs] = useState(MOCK_DOCUMENTS)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const byRole = useMemo(() => {
    const map = new Map<string, typeof docs>()
    for (const doc of docs) {
      const list = map.get(doc.role) ?? []
      list.push(doc)
      map.set(doc.role, list)
    }
    return [...map.entries()]
  }, [docs])

  function simulateUpload() {
    setUploadProgress(0)
    setMessage('Direct-to-storage upload started…')
    let p = 0
    const timer = window.setInterval(() => {
      p += 20
      setUploadProgress(p)
      if (p >= 100) {
        window.clearInterval(timer)
        setDocs((prev) => [
          {
            id: `doc-${Date.now()}`,
            name: 'New-upload.pdf',
            role: 'Supporting',
            version: 'v1',
            parseStatus: 'Queued',
            language: 'en',
            translationAvailable: false,
            sha256: 'f4e2…91aa',
          },
          ...prev,
        ])
        setMessage('Upload complete. SHA-256 confirmed: f4e2…91aa')
        setUploadProgress(null)
      }
    }, 200)
  }

  function replaceQuarantined(id: string) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, parseStatus: 'Queued', version: `v${Number(d.version.replace(/\D/g, '') || 1) + 1}`, name: d.name.replace(/(\.\w+)$/, '-replaced$1') }
          : d,
      ),
    )
    setMessage(`Quarantined file ${id} replaced and re-queued for parsing.`)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents & addenda"
        subtitle="Grouped by document role with parsing status and addendum impact."
        actions={<PrimaryButton onClick={simulateUpload}>Upload to storage</PrimaryButton>}
      />

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {message}
        </p>
      ) : null}

      {uploadProgress !== null ? (
        <Panel title="Upload progress">
          <div className="h-2 overflow-hidden rounded-full bg-aura-hover">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ff4fa3,#8b5cf6)] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-aura-muted">{uploadProgress}% — computing SHA-256…</p>
        </Panel>
      ) : null}

      {docs
        .filter((d) => d.addendumImpact)
        .map((d) => (
          <div
            key={`banner-${d.id}`}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          >
            <strong>Addendum impact — {d.name}:</strong> {d.addendumImpact}
          </div>
        ))}

      {byRole.map(([role, list]) => (
        <Panel key={role} title={role}>
          <DataTable
            headers={['Document', 'Version', 'Parse / index', 'Language', 'Translation', 'SHA-256', '']}
          >
            {list.map((doc) => (
              <tr key={doc.id} className="border-b border-aura-border/70 last:border-0">
                <td className="px-2 py-3 font-medium">{doc.name}</td>
                <td className="px-2 py-3">{doc.version}</td>
                <td className="px-2 py-3">
                  <Badge
                    tone={
                      doc.parseStatus === 'Indexed'
                        ? 'green'
                        : doc.parseStatus === 'Quarantined' || doc.parseStatus === 'Failed'
                          ? 'red'
                          : 'amber'
                    }
                  >
                    {doc.parseStatus}
                  </Badge>
                </td>
                <td className="px-2 py-3">{doc.language}</td>
                <td className="px-2 py-3">
                  {doc.translationAvailable ? <Badge tone="blue">Available</Badge> : '—'}
                </td>
                <td className="px-2 py-3 font-mono text-xs">{doc.sha256 ?? '—'}</td>
                <td className="px-2 py-3">
                  {doc.parseStatus === 'Quarantined' ? (
                    <SecondaryButton onClick={() => replaceQuarantined(doc.id)}>
                      Replace
                    </SecondaryButton>
                  ) : null}
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ))}
    </div>
  )
}
