// Builds the Module Federation remote (rsbuild.config.ts, environment `remote`) into a temporary
// directory, so integration tests run the real remoteEntry.js and chunks without touching dist/.
// The build runs in a child Node process: Rspack is native and does not belong in the test's DOM.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

const BUILD = `
import { createRsbuild, loadConfig } from '@rsbuild/core'
const [cwd, out] = process.argv.slice(1)
const { content } = await loadConfig({ cwd })
content.output = { ...content.output, distPath: { ...content.output?.distPath, root: out } }
const rsbuild = await createRsbuild({ cwd, rsbuildConfig: content, environment: ['remote'] })
await rsbuild.build()
`

export type RemoteBuild = {
  dir: string
  /** The text of a built file, by its path under the output directory. */
  read(path: string): string
  /** Every built file, relative to the output directory. */
  files(): string[]
  remove(): void
}

export function buildRemote(): RemoteBuild {
  const dir = mkdtempSync(join(tmpdir(), 'mfe-dashboard-remote-'))
  execFileSync(process.execPath, ['--input-type=module', '-e', BUILD, ROOT, dir], {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  return {
    dir,
    read: (path) => readFileSync(join(dir, path), 'utf8'),
    files: () => readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => join(d.parentPath, d.name).slice(dir.length + 1)),
    remove: () => rmSync(dir, { recursive: true, force: true }),
  }
}
