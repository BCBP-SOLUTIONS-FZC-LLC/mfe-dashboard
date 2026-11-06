// The English catalog (src/locales/en.json) against the source: every key the UI asks for exists,
// every key in the catalog is used, and every message formats through the SDK's ICU-lite t().
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { t } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import { describe, expect, it } from 'vitest'
import en from '../../../src/app/configuration/locales/en.json'
import { APP_ID } from '../../../src/shared/constants/app'
import type { DashboardView, SlaState } from '../../../src/domain/entities/ticket'

const SRC = resolve(__dirname, '../../../src')
const catalog = en as Record<string, string>

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? sources(join(dir, d.name)) : /\.tsx?$/.test(d.name) ? [readFileSync(join(dir, d.name), 'utf8')] : [],
  )
}

const code = sources(SRC).join('\n')

/** Keys passed to t() as string literals. */
const literalKeys = new Set([...code.matchAll(/\bt\(\s*'([^']+)'/g)].map((m) => m[1]!))

// Keys built at runtime, from closed sets. `satisfies` makes a new view, SLA state or user status a
// type error here until its messages are listed.
const views = { 'my-tickets': 1, 'awaiting-review': 1, 'awaiting-approval': 1, delegated: 1, 'all-tenders': 1 } satisfies Record<DashboardView, 1>
const sla = { on_track: 1, warning: 1, breached: 1 } satisfies Record<SlaState, 1>
const userStatuses = ['Active', 'Invited', 'Disabled'] as const

const dynamic: Record<string, string[]> = {
  'views.${v.id}.label / views.${view}.label': Object.keys(views).map((v) => `views.${v}.label`),
  'views.${v.id}.subtitle': Object.keys(views).map((v) => `views.${v}.subtitle`),
  'sla.${ticket.slaState}': Object.keys(sla).map((s) => `sla.${s}`),
  'users.status.${user.status}': userStatuses.map((s) => `users.status.${s}`),
  // AppShellLayout falls back to the locale code for a language without a name.
  'language.${locale}': ['language.en'],
}
const dynamicKeys = new Set(Object.values(dynamic).flat())

describe('en catalog', () => {
  it('has every key the source passes to t() literally', () => {
    expect(literalKeys.size).toBeGreaterThan(50)
    expect([...literalKeys].filter((k) => !(k in catalog))).toEqual([])
  })

  it('has every key the source builds from a closed set', () => {
    expect([...dynamicKeys].filter((k) => !(k in catalog))).toEqual([])
    // Each family is still built in the source the way it is listed above.
    expect(code).toContain('t(`views.${v.id}.label`')
    expect(code).toContain('t(`views.${v.id}.subtitle`')
    expect(code).toContain('t(`sla.${ticket.slaState}`')
    expect(code).toContain('t(`users.status.${user.status}`')
    expect(code).toContain('`language.${locale}`')
  })

  it('has no unused keys', () => {
    expect(Object.keys(catalog).filter((k) => !literalKeys.has(k) && !dynamicKeys.has(k))).toEqual([])
  })

  it('formats every message through the SDK', async () => {
    const vars = { count: 2, mins: 2, view: 'View', client: 'C', stage: 'S', deliverable: 'D', section: 'S', name: 'N', from: 'a', to: 'b' }
    // The runtime from test/setup.ts has the catalog registered; load it for the active locale.
    const { setLocale } = await import('@bcbp-solutions-fzc-llc/frontend-sdk/i18n')
    await setLocale('en')
    for (const [key, message] of Object.entries(catalog)) {
      const out = t(APP_ID, key, vars)
      expect(out, key).not.toBe(key)
      expect(out, `${key}: unfilled placeholder in "${message}"`).not.toMatch(/[{}]/)
    }
  })
})
