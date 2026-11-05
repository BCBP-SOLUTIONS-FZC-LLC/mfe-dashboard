// Writes dist/remote-manifest-entry.json after `rsbuild build`: this remote's entry for web-shell's
// /remotes/manifest.json, with the sha384 integrity of the exact remoteEntry.js built (the SDK's
// loadRemote requires it outside local, dev and test). Each environment's deploy copies the object
// into its manifest and makes `entry` absolute (e.g. https://<cdn>/remotes/dashboard/<version>/remoteEntry.js).
// Integrity is over the file's bytes, so gzip in transit does not affect it.
import { readFileSync, writeFileSync } from 'node:fs'
import { DOMAINS } from '@bcbp-solutions-fzc-llc/frontend-sdk/core'
import { integrityOf } from '@bcbp-solutions-fzc-llc/webpack-preset'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const version = (process.env.BUILD_VERSION || pkg.version).replace(/^v/, '')
const entry = readFileSync(new URL('../dist/remoteEntry.js', import.meta.url))

// The SDK's registry domains (frontend-sdk/core DOMAINS): the shell drops an entry with any other
// ownerDomain, and the remote's metrics are scoped by it, so check it here rather than at load time.
const ownerDomain = 'portal'
if (!DOMAINS.includes(ownerDomain)) throw new Error(`ownerDomain "${ownerDomain}" is not one of ${DOMAINS.join(', ')}`)

const manifestEntry = {
  dashboard: { entry: 'remoteEntry.js', version, ownerDomain, integrity: integrityOf(entry) },
}
writeFileSync(new URL('../dist/remote-manifest-entry.json', import.meta.url), `${JSON.stringify(manifestEntry, null, 2)}\n`)
console.log(`remote-manifest-entry.json: dashboard ${version} ${manifestEntry.dashboard.integrity}`)
