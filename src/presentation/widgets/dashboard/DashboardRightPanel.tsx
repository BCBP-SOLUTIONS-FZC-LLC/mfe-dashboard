import { formatDate, formatNumber } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import { useT } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { IconAlertCircle, IconBell, IconUser } from '../../components/DashboardIcons'
import { APP_ID } from '../../../shared/constants/app'
import type { DashboardSummary } from '../../../application/use-cases/LoadDashboardSummaryUseCase'

const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

type Props = {
  summary: DashboardSummary
  showTenderError: boolean
}

export function DashboardRightPanel({ summary, showTenderError }: Props) {
  const t = useT(APP_ID)
  const { sla, delegation, unreadNotifications: unreadCount } = summary
  const pctOn = (sla.onTrack / sla.total) * 100
  const pctWarn = (sla.warning / sla.total) * 100

  return (
    <aside className="flex flex-col gap-4">
      <div className="rounded-xl border border-aura-primary/25 bg-aura-primary-soft p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aura-primary text-white">
            <IconUser className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-aura-text">{t('panel.delegation.title')}</h3>
            <p className="mt-2 text-xs text-aura-muted">{t('panel.delegation.coveredBy')}</p>
            <p className="text-sm font-semibold text-aura-text">{delegation.coveredBy}</p>
            <p className="mt-1 text-xs text-aura-muted">
              {t('panel.delegation.period', {
                from: formatDate(delegation.from, DAY),
                to: formatDate(delegation.to, DAY),
              })}
            </p>
            <button
              type="button"
              className="mt-2 cursor-pointer text-xs font-semibold text-[color:var(--aura-secondary-ink)] hover:underline"
            >
              {t('panel.viewDetails')}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-aura-border bg-aura-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aura-secondary text-white">
            <IconBell className="h-5 w-5" />
            <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold">
              {formatNumber(unreadCount)}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-aura-text">{t('panel.notifications.title')}</h3>
            <button
              type="button"
              className="mt-2 cursor-pointer text-xs font-semibold text-[color:var(--aura-secondary-ink)] hover:underline"
            >
              {t('panel.notifications.viewAll')}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-aura-border bg-aura-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-aura-text">{t('panel.sla.title')}</h3>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="relative h-24 w-24 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(#10b981 0 ${pctOn}%, #fbbf24 ${pctOn}% ${pctOn + pctWarn}%, #ef4444 ${pctOn + pctWarn}% 100%)`,
            }}
          >
            <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-aura-surface text-center">
              <span className="text-lg font-bold text-aura-text">{formatNumber(sla.total)}</span>
              <span className="text-[0.6rem] text-aura-muted">{t('panel.sla.total')}</span>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs text-aura-text">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('panel.sla.onTrack', { count: sla.onTrack })}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {t('panel.sla.warning', { count: sla.warning })}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {t('panel.sla.breached', { count: sla.breached })}
            </li>
          </ul>
        </div>
      </div>

      {showTenderError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/45 dark:bg-transparent">
          <div className="flex gap-3">
            <IconAlertCircle className="h-8 w-8 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {t('panel.tenderError.title')}
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-400/90">
                {t('panel.tenderError.body')}
              </p>
              <button
                type="button"
                className="mt-3 cursor-pointer rounded-lg border border-red-300 bg-aura-surface px-3 py-1.5 text-xs font-semibold text-red-800 dark:border-red-800 dark:text-red-300"
              >
                {t('panel.tenderError.action')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
