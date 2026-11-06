import { formatDate, formatNumber } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import { useT } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { APP_ID } from '../../../shared/constants/app'
import {
  IconBuilding,
  IconCalendar,
  IconChat,
  IconChevronRight,
  IconEvidenceGrade,
  IconLock,
  IconUser,
  TicketTypeIcon,
} from '../../components/DashboardIcons'
import type { TicketItem } from '../../../domain/entities/ticket'

const slaDot = {
  on_track: 'bg-emerald-500',
  warning: 'bg-amber-400',
  breached: 'bg-red-500',
} as const

/** A due date is a calendar day (`YYYY-MM-DD`): the SDK formats it as that day in every time zone. */
function formatDue(day: string) {
  return formatDate(day, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function TicketRow({ ticket }: { ticket: TicketItem }) {
  const t = useT(APP_ID)
  return (
    // Laid out by the card's own width (a container query), not the viewport's: the list shares the
    // row with the right panel, so at 1280px a viewport breakpoint squeezed the title column to zero.
    <article className="@container rounded-xl border border-aura-border bg-aura-surface px-4 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <TicketTypeIcon />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-aura-text">
            {ticket.tenderTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-aura-muted">{t('ticket.client', { client: ticket.client })}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill label={t('ticket.stage', { stage: ticket.stage })} />
            <Pill label={t('ticket.deliverable', { deliverable: ticket.deliverable })} />
            <Pill label={t('ticket.section', { section: ticket.section })} />
          </div>
          {ticket.tenderDetailsUnavailable ? (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">{t('ticket.detailsUnavailable')}</p>
          ) : null}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-aura-text @lg:grid-cols-4">
        <Meta icon="building" label={t('ticket.department')} value={ticket.department} />
        <Meta icon="user" label={t('ticket.roleLevel')} value={ticket.roleLevel} />
        <div>
          <p className="text-[0.65rem] text-slate-500 dark:text-aura-muted">{t('ticket.dueDate')}</p>
          <p className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-aura-text">
            <IconCalendar className="h-4 w-4 text-slate-400 dark:text-aura-muted" />
            {formatDue(ticket.dueDate)}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] text-slate-500 dark:text-aura-muted">{t('ticket.slaState')}</p>
          <p className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-aura-text">
            <span className={`h-2 w-2 rounded-full ${slaDot[ticket.slaState]}`} />
            {t(`sla.${ticket.slaState}`)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {ticket.restricted ? (
          <Badge tone="red" icon="lock">
            {t('ticket.restricted')}
          </Badge>
        ) : null}
        {ticket.evidenceGrade ? (
          <Badge tone="violet">{ticket.evidenceGrade}</Badge>
        ) : null}
        {ticket.delegatedFrom ? (
          <Badge tone="sky">{t('ticket.delegatedFrom', { name: ticket.delegatedFrom })}</Badge>
        ) : null}
        {ticket.unreadComments > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <IconChat className="h-4 w-4" />
            {formatNumber(ticket.unreadComments)}
          </span>
        ) : null}
        <IconChevronRight className="h-5 w-5 text-slate-300" aria-hidden />
      </div>
      </div>
    </article>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[0.65rem] font-medium text-blue-800 dark:border-aura-border dark:bg-transparent dark:text-aura-muted">
      {label}
    </span>
  )
}

function Meta({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: 'building' | 'user'
}) {
  const Icon = icon === 'building' ? IconBuilding : IconUser
  return (
    <div>
      <p className="text-[0.65rem] text-slate-500 dark:text-aura-muted">{label}</p>
      <p className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-aura-text">
        <Icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-aura-muted" />
        {value}
      </p>
    </div>
  )
}

function Badge({
  children,
  tone,
  icon,
}: {
  children: string
  tone: 'red' | 'violet' | 'sky'
  icon?: 'lock'
}) {
  const styles = {
    red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/45 dark:bg-transparent dark:text-red-300',
    violet:
      'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/45 dark:bg-transparent dark:text-violet-300',
    sky: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/45 dark:bg-transparent dark:text-sky-300',
  }[tone]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold ${styles}`}
    >
      {icon === 'lock' ? <IconLock /> : null}
      {tone === 'violet' ? <IconEvidenceGrade /> : null}
      {children}
    </span>
  )
}
