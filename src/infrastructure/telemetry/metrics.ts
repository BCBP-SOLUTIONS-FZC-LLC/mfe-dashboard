// The dashboard's metrics, per the Enterprise Platform Observability Standard, through the SDK's
// /metrics (never a meter of our own). All three are Tier 3, service-specific: no platform_* or
// portal_* (domain) metric in the registry describes a dashboard's ticket loads or step-up prompts,
// and services must not invent shared ones. The SDK names the scope: inside web-shell the domain is
// this remote's manifest ownerDomain ('portal') and the service is its name ('dashboard'), so the
// prefix is portal_dashboard_. It injects domain, service and environment on every point, checks
// suffixes, prohibited labels and the label cap, and the shell exports (consent-gated, OTLP).
//
// Every label has a closed value set here, enforced by the type of recordMetric's labels at compile
// time. At run time the SDK validates each point itself (declared labels, registry vocabularies such
// as outcome, non-negative values, the per-label value cap) and drops what fails: this module does
// not repeat those checks. test/unit/metrics checks these definitions against the SDK's rules and
// docs/observability/metrics.md, so the inventory cannot drift from the code.
import { getServiceMeter, type Counter, type Histogram } from '@bcbp-solutions-fzc-llc/frontend-sdk/metrics'
import { getLogger } from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import type { DashboardTelemetry } from '../../application/ports/telemetry'
import type { DashboardView } from '../../domain/entities/ticket'
import { APP_ID } from '../../shared/constants/app'

export const METRIC_PREFIX = 'portal_dashboard_'

const VIEWS: readonly DashboardView[] = ['my-tickets', 'awaiting-review', 'awaiting-approval', 'delegated', 'all-tenders']

type Definition = {
  readonly name: string
  readonly type: 'counter' | 'histogram'
  readonly help: string
  /** Label name → its closed set of values (bounded cardinality). */
  readonly labels: Readonly<Record<string, readonly string[]>>
}

export const METRICS = {
  ticketLoads: {
    name: 'portal_dashboard_ticket_loads_total',
    type: 'counter',
    help: 'Ticket list loads that finished, by view, what started them and outcome (success, or error for an API, network or timeout fault). Loads superseded by a newer one are not counted.',
    labels: { view: VIEWS, trigger: ['initial', 'refresh'], outcome: ['success', 'error'] },
  },
  ticketLoadDuration: {
    name: 'portal_dashboard_ticket_load_duration_seconds',
    type: 'histogram',
    help: 'Time from starting a ticket list load to its result, by view and outcome. Superseded loads are not recorded.',
    labels: { view: VIEWS, outcome: ['success', 'error'] },
  },
  stepUpRequests: {
    name: 'portal_dashboard_step_up_requests_total',
    type: 'counter',
    help: 'Re-authentication (MFA step-up) requests started from the approval banner.',
    labels: {},
  },
} as const satisfies Record<string, Definition>

type Metrics = typeof METRICS
type Labels<K extends keyof Metrics> = { [L in keyof Metrics[K]['labels']]: Metrics[K]['labels'][L] extends readonly (infer V)[] ? V : never }

let warned = false

/**
 * The instrument for `def`, or undefined. Made on each use, not at import: the SDK defines an
 * instrument as soon as the page has an identity and needs this remote in the manifest for its
 * domain, which inside web-shell is true before ./App loads. The SDK keeps one instrument per name,
 * so a repeat call returns the same one. Standalone, with no manifest, it fails: that is logged once
 * and nothing is recorded (the standalone page exports no metrics anyway).
 */
function instrument(def: Definition): Counter | Histogram | undefined {
  try {
    const meter = getServiceMeter({ mfe: APP_ID })
    const labels = Object.keys(def.labels)
    return def.type === 'counter' ? meter.counter(def.name, def.help, labels) : meter.histogram(def.name, def.help, labels)
  } catch (error) {
    if (!warned) getLogger({ mfe: APP_ID }).warn('dashboard metrics unavailable', { error, metric: def.name })
    warned = true
    return undefined
  }
}

/** Records one point of metric `key`; `labels` is typed to the metric's closed value sets. */
export function recordMetric<K extends keyof Metrics>(key: K, value: number, labels: Labels<K>): void {
  const def: Definition = METRICS[key]
  const inst = instrument(def)
  if (!inst) return
  if (def.type === 'counter') (inst as Counter).add(value, labels as Record<string, string>)
  else (inst as Histogram).record(value, labels as Record<string, string>)
}

/** The DashboardTelemetry port, implemented with this module's Tier 3 metrics. */
export const metricsTelemetry: DashboardTelemetry = {
  ticketLoadFinished({ view, trigger, outcome, seconds }) {
    recordMetric('ticketLoads', 1, { view, trigger, outcome })
    recordMetric('ticketLoadDuration', seconds, { view, outcome })
  },
  stepUpRequested() {
    recordMetric('stepUpRequests', 1, {})
  },
}
