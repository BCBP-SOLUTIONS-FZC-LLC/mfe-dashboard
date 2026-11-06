// axe-core in the page, limited to WCAG 2.1 A and AA (the constitution's accessibility standard).
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')

export type Violation = { id: string; impact: string | null; help: string; targets: string[] }

/** WCAG 2.1 A/AA violations on the page as it is now, one entry per rule with the failing nodes. */
export async function wcagViolations(page: Page): Promise<Violation[]> {
  await page.addScriptTag({ content: axeSource })
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, o: unknown) => Promise<{ violations: { id: string; impact: string | null; help: string; nodes: { target: string[] }[] }[] }> } }).axe
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
    return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) }))
  })
}
