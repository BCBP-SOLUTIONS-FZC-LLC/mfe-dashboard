// ARCHITECTURE.md embeds the diagrams in docs/architecture/mermaid/*.mmd. Each fence must equal its
// source, and each source must be embedded, so the two never drift.
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '../../..')
const MERMAID = join(ROOT, 'docs/architecture/mermaid')
const architecture = readFileSync(join(ROOT, 'ARCHITECTURE.md'), 'utf8')

/** Each ```mermaid fence with the source file named under it (`> Source: \`…\``). */
const fences = [...architecture.matchAll(/```mermaid\n([\s\S]*?)\n```\n\n> Source: `docs\/architecture\/mermaid\/([^`]+)`/g)].map(
  (m) => ({ body: m[1]!, file: m[2]! }),
)

describe('ARCHITECTURE.md diagrams', () => {
  it('names a source under every mermaid fence', () => {
    expect(fences.length).toBe((architecture.match(/```mermaid/g) ?? []).length)
  })

  it.each(readdirSync(MERMAID).filter((f) => f.endsWith('.mmd')))('embeds %s exactly', (file) => {
    const fence = fences.find((f) => f.file === file)
    expect(fence, `${file} is not embedded in ARCHITECTURE.md`).toBeDefined()
    expect(fence!.body).toBe(readFileSync(join(MERMAID, file), 'utf8').trimEnd())
  })
})
