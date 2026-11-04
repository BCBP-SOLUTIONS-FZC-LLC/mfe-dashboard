import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="m-0 text-xl font-semibold text-aura-text">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-aura-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Panel({
  title,
  children,
  actions,
  className = '',
}: {
  title?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-xl border border-aura-border bg-aura-surface p-4 shadow-sm ${className}`}
    >
      {title || actions ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="m-0 text-sm font-semibold text-aura-text">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'pink' | 'green' | 'amber' | 'red' | 'blue'
}) {
  const tones = {
    neutral: 'border-aura-border bg-aura-hover text-aura-muted',
    pink: 'border-pink-200 bg-pink-50 text-pink-700',
    green: 'border-green-200 bg-green-50 text-green-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-lg border-0 bg-[linear-gradient(90deg,#ff4fa3_0%,#8b5cf6_100%)] px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-lg border border-aura-border bg-aura-surface px-3.5 py-2 text-sm font-medium text-aura-text hover:bg-aura-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium uppercase tracking-wide text-aura-muted">{label}</span>
      {children}
    </label>
  )
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-aura-border bg-aura-surface px-2.5 py-2 text-sm text-aura-text outline-none focus:border-[#ff2d9a]"
    >
      {children}
    </select>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-aura-border bg-aura-surface px-2.5 py-2 text-sm text-aura-text outline-none focus:border-[#ff2d9a]"
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-aura-border bg-aura-surface px-2.5 py-2 text-sm text-aura-text outline-none focus:border-[#ff2d9a]"
    />
  )
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[]
  children: ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-aura-border text-xs uppercase tracking-wide text-aura-muted">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-aura-muted">{message}</p>
}

export function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function deadlineLabel(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  const days = Math.ceil(ms / 86_400_000)
  if (Number.isNaN(days)) return iso
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  return `${days}d left`
}

export function lifecycleTone(state: string) {
  if (state === 'Awarded' || state === 'Submitted') return 'green' as const
  if (state === 'Withdrawn' || state === 'Lost') return 'red' as const
  if (state === 'Bid preparation' || state === 'Qualification') return 'blue' as const
  if (state === 'Intake') return 'amber' as const
  return 'neutral' as const
}
