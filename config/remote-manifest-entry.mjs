// Writes dist/remote-manifest-entry.json after `rsbuild build`: this remote's entry for web-shell's
// /remotes/manifest.json, with the sha384 integrity of the exact remoteEntry.js built (the SDK's
// loadRemote requires it outside local, dev and test). Each environment's deploy copies the object
// into its manifest and makes `entry` absolute (e.g. https://<cdn>/remotes/dashboard/<version>/remoteEntry.js).
// Integrity is over the file's bytes, so gzip in transit does not affect it.
import { readFileSync, writeFileSync } from 'node:fs'
import { integrityOf } from '@bcbp-solutions-fzc-llc/webpack-preset'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const version = (process.env.BUILD_VERSION || pkg.version).replace(/^v/, '')
const entry = readFileSync(new URL('../dist/remoteEntry.js', import.meta.url))

const manifestEntry = {
  dashboard: { entry: 'remoteEntry.js', version, ownerDomain: 'portal', integrity: integrityOf(entry) },
}
writeFileSync(new URL('../dist/remote-manifest-entry.json', import.meta.url), `${JSON.stringify(manifestEntry, null, 2)}\n`)
console.log(`remote-manifest-entry.json: dashboard ${version} ${manifestEntry.dashboard.integrity}`)
