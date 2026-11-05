// CI validation of the dashboard's metrics against the Enterprise Platform Observability Standard
// (docs/observability/metrics.md): namespace, suffixes, required and prohibited labels, label
// vocabularies, SDK and registry compliance, and the inventory page. Then what the code records.
import { loadManifest } from '@bcbp-solutions-fzc-llc/frontend-sdk/mfe'
import { NetworkError } from '@bcbp-solutions-fzc-llc/frontend-sdk/problem'
import { renderMetricInventory } from '@bcbp-solutions-fzc-llc/frontend-sdk/testing'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { useDashboardData } from '../../../src/hooks/useDashboardData'
import { APP_ID } from '../../../src/i18n'
import { METRICS, METRIC_PREFIX, recordMetric } from '../../../src/metrics'
import * as tickets from '../../../src/mocks/dashboardTickets'
import { startPlatform } from '../../fixtures/platform'

const ROOT = join(__dirname, '../../..')
type Registry = {
  constLabels: string[]
  prohibitedLabels: string[]
  prohibitedLabelSuffixes: string[]
  exemptPrefixes: string[]
  labels: Record<string, { values?: string[] }>
  metrics: { name: string }[] | Record<string, unknown>
  legacyNames: string[]
}
const registry = JSON.parse(
  readFileSync(join(ROOT, 'node_modules/@bcbp-solutions-fzc-llc/frontend-sdk/contracts/metric-registry.json'), 'utf8'),
) as Registry
const registryNames = new Set(Array.isArray(registry.metrics) ? registry.metrics.map((m) => m.name) : Object.keys(registry.metrics))
const definitions = Object.values(METRICS)
const filters = { status: 'all', role: 'all', department: 'all', deadline: 'all', tender: 'all' }

/** This remote in the manifest, as web-shell loads it before ./App: the SDK scopes metrics by it. */
async function inShell(o: Parameters<typeof startPlatform>[0] = {}) {
  const platform = startPlatform(o)
  vi.stubGlobal('fetch', async () =>
    Response.json({ [APP_ID]: { entry: '/remotes/dashboard/0.3.0/remoteEntry.js', version: '0.3.0', ownerDomain: 'portal' } }),
  )
  await loadManifest()
  vi.unstubAllGlobals()
  return platform
}

/** The recorded series of `name` (Prometheus text from the SDK), without HELP/TYPE lines. */
const series = (name: string) =>
  renderMetricInventory()
    .split('\n')
    .filter((l) => l.startsWith(`${name}{`) || l.startsWith(`${name} `))

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('metric definitions (observability standard)', () => {
  it('are Tier 3: portal_dashboard_*, never platform_*, a registry metric or a legacy name', () => {
    expect(METRIC_PREFIX).toBe(`portal_${APP_ID}_`)
    for (const d of definitions) {
      expect(d.name, d.name).toMatch(/^portal_dashboard_[a-z0-9_]+$/)
      expect(registryNames.has(d.name), d.name).toBe(false)
      expect(registry.legacyNames, d.name).not.toContain(d.name)
      expect(registry.exemptPrefixes.some((p) => d.name.startsWith(p)), d.name).toBe(false)
    }
  })

  it('end counters in _total and histograms in _seconds', () => {
    for (const d of definitions) expect(d.name, d.name).toMatch(d.type === 'counter' ? /_total$/ : /_seconds$/)
  })

  it('declare no central or prohibited label, at most 8, each with a closed value set', () => {
    for (const d of definitions) {
      const labels = Object.keys(d.labels)
      expect(labels.length, d.name).toBeLessThanOrEqual(8)
      for (const label of labels) {
        expect(label, d.name).toMatch(/^[a-z][a-z0-9_]*$/)
        expect(registry.constLabels, d.name).not.toContain(label)
        expect(registry.prohibitedLabels, d.name).not.toContain(label)
        expect(registry.prohibitedLabelSuffixes.some((s) => label.endsWith(s)), `${d.name} ${label}`).toBe(false)
        const values = (d.labels as Record<string, readonly string[]>)[label]!
        expect(values.length, `${d.name} ${label}`).toBeGreaterThan(0)
        // A registry label keeps the registry's vocabulary (e.g. outcome: success | failure | error).
        const vocabulary = registry.labels[label]?.values
        if (vocabulary) for (const v of values) expect(vocabulary, `${d.name} ${label}=${v}`).toContain(v)
      }
    }
  })

  it('are accepted by the SDK, which injects domain, service and environment', async () => {
    await inShell()
    recordMetric('ticketLoads', 1, { view: 'my-tickets', trigger: 'initial', outcome: 'success' })
    recordMetric('ticketLoadDuration', 0.5, { view: 'my-tickets', outcome: 'success' })
    recordMetric('stepUpRequests', 1, {})
    const inventory = renderMetricInventory()
    for (const d of definitions) {
      expect(inventory, d.name).toContain(`# TYPE ${d.name} ${d.type}`)
      for (const line of series(d.name)) expect(line).toMatch(/domain="portal",environment="test",.*service="dashboard"/)
    }
  })

  it('match the inventory in docs/observability/metrics.md', () => {
    const doc = readFileSync(join(ROOT, 'docs/observability/metrics.md'), 'utf8')
    const rows = new Map(
      [...doc.matchAll(/^\| `(portal_dashboard_[a-z0-9_]+)` \| (\w+) \| ([^|]*) \| ([^|]*) \|$/gm)].map((m) => [m[1]!, m]),
    )
    expect([...rows.keys()].sort()).toEqual(definitions.map((d) => d.name).sort())
    for (const d of definitions) {
      const row = rows.get(d.name)!
      expect(row[2], d.name).toBe(d.type)
      const labels = Object.entries(d.labels as Record<string, readonly string[]>)
        .map(([l, vs]) => `\`${l}\` (${vs.map((v) => `\`${v}\``).join(', ')})`)
        .join(', ')
      expect(row[3]!.trim(), d.name).toBe(labels || '—')
      expect(row[4]!.trim(), d.name).toBe(d.help)
    }
  })
})

describe('recording', () => {
  it('drops a label value outside its declared set', async () => {
    await inShell()
    recordMetric('ticketLoads', 1, { view: 'unknown-view' as never, trigger: 'initial', outcome: 'success' })
    expect(series('portal_dashboard_ticket_loads_total')).toEqual([])
  })

  it('records nothing and warns once without the remote in the manifest (standalone)', () => {
    const { logs } = startPlatform()
    expect(() => {
      recordMetric('stepUpRequests', 1, {})
      recordMetric('stepUpRequests', 1, {})
    }).not.toThrow()
    expect(series('portal_dashboard_step_up_requests_total')).toEqual([])
    expect(logs.filter((l) => l.message === 'dashboard metrics unavailable').length).toBeLessThanOrEqual(1)
  })

  it('counts and times a finished ticket load by view, trigger and outcome', async () => {
    await inShell()
    vi.useFakeTimers()
    const { result } = renderHook(() => useDashboardData({ view: 'delegated', filters, canSeeAllTenders: true }))
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(result.current.loadState).not.toBe('loading')
    act(() => result.current.refresh())
    await act(() => vi.advanceTimersByTimeAsync(400))
    expect(series('portal_dashboard_ticket_loads_total').map((l) => l.replace(/ \d+$/, ''))).toEqual([
      'portal_dashboard_ticket_loads_total{domain="portal",environment="test",outcome="success",service="dashboard",trigger="initial",view="delegated"}',
      'portal_dashboard_ticket_loads_total{domain="portal",environment="test",outcome="success",service="dashboard",trigger="refresh",view="delegated"}',
    ])
    expect(series('portal_dashboard_ticket_load_duration_seconds_count').map((l) => l.replace(/ \d+$/, ''))).toEqual([
      'portal_dashboard_ticket_load_duration_seconds_count{domain="portal",environment="test",outcome="success",service="dashboard",view="delegated"}',
    ])
  })

  it('records a failed load as outcome="error"', async () => {
    await inShell()
    vi.useFakeTimers()
    vi.spyOn(tickets, 'ticketsForView').mockImplementation(() => {
      throw new NetworkError(false, 'req-1')
    })
    renderHook(() => useDashboardData({ view: 'my-tickets', filters, canSeeAllTenders: true }))
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(renderMetricInventory()).toContain(
      'portal_dashboard_ticket_loads_total{domain="portal",environment="test",outcome="error",service="dashboard",trigger="initial",view="my-tickets"}',
    )
  })

  it('does not count a load superseded by a newer one', async () => {
    await inShell()
    vi.useFakeTimers()
    const { rerender } = renderHook(({ view }) => useDashboardData({ view, filters, canSeeAllTenders: true }), {
      initialProps: { view: 'my-tickets' as const as 'my-tickets' | 'delegated' },
    })
    await act(() => vi.advanceTimersByTimeAsync(100))
    rerender({ view: 'delegated' })
    await act(() => vi.advanceTimersByTimeAsync(700))
    const loads = series('portal_dashboard_ticket_loads_total').join('\n')
    expect(loads).toContain('view="delegated"')
    expect(loads).not.toContain('view="my-tickets"')
  })

  it('counts a step-up (MFA) request from the approval banner', async () => {
    const { Wrapper } = await inShell({
      user: { sub: 'u-1', email: 'ada@example.com', authTime: Math.floor(Date.now() / 1000) - 3600 },
      context: { mfaFreshnessSeconds: 300 },
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <App userLabel="Ada" />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )
    await userEvent.click((await screen.findAllByRole('button', { name: /Awaiting My Approval/ }))[0]!)
    expect(series('portal_dashboard_step_up_requests_total')).toEqual([])
    await userEvent.click(await screen.findByRole('button', { name: 'Re-authenticate' }))
    expect(series('portal_dashboard_step_up_requests_total')).toEqual([
      'portal_dashboard_step_up_requests_total{domain="portal",environment="test",service="dashboard"} 1',
    ])
  })
})
