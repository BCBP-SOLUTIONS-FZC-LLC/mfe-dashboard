// The Frontend Architecture Constitution's structure and dependency rules for src/ (ADR 0001):
//   Presentation → Application → Domain; Infrastructure implements Domain contracts;
//   app/ is the composition root; shared/ depends on nothing of ours.
// Each file's imports are resolved to the layer they land in, and checked against what that layer
// may use. Also: no React or browser APIs in domain/ and application/, and no infrastructure or app
// imports from presentation/.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '../../..')
const SRC = join(ROOT, 'src')
const LAYERS = ['app', 'presentation', 'application', 'domain', 'infrastructure', 'shared'] as const
type Layer = (typeof LAYERS)[number]

/** Which of our layers each layer may import (besides itself). */
const ALLOWED: Record<Layer, readonly Layer[]> = {
  app: ['presentation', 'application', 'domain', 'infrastructure', 'shared'],
  presentation: ['application', 'domain', 'shared'],
  application: ['domain', 'shared'],
  domain: [],
  infrastructure: ['application', 'domain', 'shared'],
  shared: [],
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [p] : []
  })
}

const sources = files(SRC).map((f) => ({ file: relative(ROOT, f), text: readFileSync(f, 'utf8') }))
const layerOf = (file: string) => relative(SRC, file).split('/')[0] as Layer
const imports = (text: string) => [...text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)

describe('src/ layout', () => {
  it('has exactly the constitution\'s top-level layers', () => {
    const top = readdirSync(SRC).filter((n) => statSync(join(SRC, n)).isDirectory()).sort()
    expect(top).toEqual([...LAYERS].sort())
  })
})

describe('dependency rules', () => {
  it.each(LAYERS.map((l) => [l]))('%s imports only the layers it may use', (layer) => {
    const offenders = sources
      .filter(({ file }) => layerOf(join(ROOT, file)) === layer)
      .flatMap(({ file, text }) =>
        imports(text)
          .filter((spec) => spec.startsWith('.'))
          .map((spec) => ({ file, spec, target: layerOf(normalize(join(dirname(join(ROOT, file)), spec))) }))
          .filter(({ target }) => target !== layer && !ALLOWED[layer].includes(target))
          .map(({ file, spec, target }) => `${file} → ${target} (${spec})`),
      )
    expect(offenders).toEqual([])
  })

  it('keeps domain/ and application/ framework-free: no React, router, SDK or browser API', () => {
    const offenders = sources
      .filter(({ file }) => ['domain', 'application'].includes(layerOf(join(ROOT, file))))
      .filter(({ text }) =>
        imports(text).some((spec) => !spec.startsWith('.')) ||
        /\b(window|document|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|navigator)\b\s*[.(]/.test(text),
      )
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('keeps data access in infrastructure/: presentation/ never imports the SDK\'s storage, metrics or config', () => {
    const offenders = sources
      .filter(({ file }) => layerOf(join(ROOT, file)) === 'presentation')
      .filter(({ text }) => /from ['"]@bcbp-solutions-fzc-llc\/frontend-sdk\/(storage|metrics|config)['"]/.test(text))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })
})
