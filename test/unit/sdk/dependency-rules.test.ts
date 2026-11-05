// The remote uses the platform SDK (platform-reactcommon) and does not reimplement it. ESLint
// (@bcbp-solutions-fzc-llc/eslint-plugin) already rejects raw storage, SDK deep/root imports, eval
// and identity headers; these rules cover what the SDK owns beyond that, as the SDK's own
// test/unit/sdk/dependency-rules.test.ts does for its modules.
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '../../..')
const SRC = join(ROOT, 'src')

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? files(join(dir, d.name)) : /\.tsx?$/.test(d.name) ? [join(dir, d.name)] : [],
  )
}

/** Source without comments, so a rule is not tripped by a comment that explains it. */
function code(file: string) {
  return readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const sources = files(SRC).map((f) => ({ file: relative(ROOT, f), text: code(f) }))

/** Files whose code matches `pattern`, minus the ones `allowed` lists with the reason. */
function offenders(pattern: RegExp, allowed: Record<string, string> = {}) {
  return sources.filter(({ file, text }) => pattern.test(text) && !(file in allowed)).map(({ file }) => file)
}

describe('the SDK is used, not reimplemented', () => {
  it('formats dates and numbers with frontend-sdk/i18n (formatDate, formatNumber), not Intl', () => {
    // A type-only Intl reference (formatDate's options) is fine; constructing a formatter is not.
    expect(offenders(/new Intl\.|\.toLocale(Date|Time)?String\(|\.toLocaleUpperCase\(|\.toLocaleLowerCase\(/)).toEqual([])
  })

  it('takes UI text from the catalog through useT, not a home-made translator', () => {
    expect(offenders(/navigator\.languages?\b|document\.documentElement\.lang\b/)).toEqual([])
    expect(offenders(/from ['"](i18next|react-i18next|react-intl|@formatjs\/[^'"]+)['"]/)).toEqual([])
  })

  it('calls APIs through the SDK (useApi / ApiClient), not fetch or XHR', () => {
    expect(offenders(/\bfetch\(|XMLHttpRequest|from ['"](axios|ky|swr|@tanstack\/react-query)['"]/)).toEqual([])
  })

  it('reads the user, roles and tokens from the SDK, never from the token or cookies itself', () => {
    expect(offenders(/document\.cookie|\batob\(|jwt-decode|jose\b|\.roles\b|hasRole\(|Authorization['"]?\s*:/)).toEqual([])
  })

  it('checks access with useHasPermission / useReadOnly / useStepUp, not role names', () => {
    expect(offenders(/['"](tenant_admin|tenant_owner|tender_admin|preparator|reviewer|approver)['"]/)).toEqual([])
  })

  it('keeps per-app state in frontend-sdk/storage, not browser storage or IndexedDB', () => {
    expect(offenders(/\b(localStorage|sessionStorage|indexedDB)\b/)).toEqual([])
  })

  it('leaves workspace routing to the SDK (slugFromPath, workspacePathPrefix, useRouteTemplate)', () => {
    // App.tsx reads the path once, to give its own router the basename the SDK computes.
    expect(offenders(/window\.location\.pathname/, { 'src/App.tsx': 'basename from slugFromPath' })).toEqual([])
    expect(offenders(/['"`]\/t\/\$\{|split\(['"]\/['"]\)/)).toEqual([])
  })

  it('signs out with useSignOut; location.assign is only the no-shell fallback', () => {
    expect(offenders(/location\.(assign|replace|href\s*=)/, { 'src/layouts/AppShellLayout.tsx': 'defaultLogout, no shell' })).toEqual([])
  })

  it('records metrics with frontend-sdk/metrics in src/metrics.ts only, never OpenTelemetry or a Prometheus client directly', () => {
    expect(offenders(/from ['"](@opentelemetry\/[^'"]+|prom-client|web-vitals)['"]/)).toEqual([])
    expect(offenders(/\b(getServiceMeter|getDomainMeter)\b/, { 'src/metrics.ts': 'the one place metrics are defined' })).toEqual([])
    // The shell starts exporting and records Core Web Vitals for the whole page.
    expect(offenders(/\b(initializeMetrics|startWebVitals|initializeTracing|initializeLogging|installGlobalErrorHandlers)\b/)).toEqual([])
  })

  it('does host-page start-up only on the standalone page, with the SDK, and leaves remotes and auth to the shell', () => {
    expect(
      offenders(/\b(initializeCore|loadRuntimeConfig|setRuntimeConfig)\b/, { 'src/standalone.ts': 'standalone host page (SDK alpha.5)' }),
    ).toEqual([])
    expect(offenders(/\b(loadManifest|loadRemote|registerNavigator|initializeAuth|createOidcProvider|setTokenSource|setAuthorizer|setFlagProvider|startVersionPolling)\b/)).toEqual([])
  })

  it('logs with getLogger; console only for the standalone config warning the SDK logger drops in staging and prod', () => {
    expect(offenders(/\bconsole\.(log|info|warn|error|debug)\(/, { 'src/standalone.ts': 'SDK logger is silent before logging starts' })).toEqual([])
  })

  it('imports the SDK only from its public subpaths', () => {
    const imports = sources.flatMap(({ text }) => [...text.matchAll(/from ['"](@bcbp-solutions-fzc-llc\/frontend-sdk[^'"]*)['"]/g)].map((m) => m[1]!))
    expect(imports.length).toBeGreaterThan(0)
    const pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules/@bcbp-solutions-fzc-llc/frontend-sdk/package.json'), 'utf8')) as { exports: Record<string, unknown> }
    const publicPaths = Object.keys(pkg.exports).map((p) => p.replace(/^\./, '@bcbp-solutions-fzc-llc/frontend-sdk'))
    expect([...new Set(imports)].filter((i) => !publicPaths.includes(i) || i.endsWith('/testing'))).toEqual([])
  })
})

describe('assets', () => {
  it('imports images and fonts; no root-relative paths, which resolve on the shell origin inside web-shell', () => {
    expect(offenders(/['"`]\/[^'"`\s]*\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?)['"`]/)).toEqual([])
  })
})

describe('dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies: Record<string, string>
    peerDependencies: Record<string, string>
  }
  const SDK = '@bcbp-solutions-fzc-llc/frontend-sdk'

  it('takes the SDK from the shell: a peer dependency, never a runtime dependency', () => {
    expect(pkg.dependencies?.[SDK]).toBeUndefined()
    expect(pkg.peerDependencies[SDK]).toBe(`^${pkg.devDependencies[SDK]}`)
  })
})
