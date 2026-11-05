// The built remote as web-shell meets it: the real remoteEntry.js and chunks from an Rsbuild build of
// the `remote` environment, loaded into the page, initialised with a share scope the way the SDK's
// loadRemote does (container.init(shareScope), then container.get('./App')), and the exposed App
// rendered. The share scope hands over this test's own React and SDK, as the shell hands over its
// singletons, so a remote that bundled its own copy would show up as an anonymous user here.
//
// The one stubbed seam is the network: <script> and <link> elements the container appends are
// answered from the build output (scripts evaluated, stylesheets marked loaded), since happy-dom
// does not fetch them.
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import * as JsxRuntime from 'react/jsx-runtime'
import * as ReactDom from 'react-dom'
import * as Auth from '@bcbp-solutions-fzc-llc/frontend-sdk/auth'
import * as Config from '@bcbp-solutions-fzc-llc/frontend-sdk/config'
import * as I18n from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import * as Logging from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import * as Metrics from '@bcbp-solutions-fzc-llc/frontend-sdk/metrics'
import * as Problem from '@bcbp-solutions-fzc-llc/frontend-sdk/problem'
import * as SdkReact from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import * as Storage from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import sdkPackage from '@bcbp-solutions-fzc-llc/frontend-sdk/package.json'
import { containerName, integrityOf } from '@bcbp-solutions-fzc-llc/webpack-preset'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildRemote, type RemoteBuild } from '../fixtures/remote-build'
import { startPlatform } from '../fixtures/platform'
import { APP_ID } from '../../src/i18n'

type Container = { init(scope: ShareScope): Promise<void> | void; get(module: string): Promise<() => unknown> }
type ShareScope = Record<string, Record<string, { get: () => Promise<() => unknown>; from: string; loaded?: number; eager?: boolean }>>

const SDK = '@bcbp-solutions-fzc-llc/frontend-sdk'
/**
 * The global remoteEntry.js defines and the SDK's loadRemote reads (`__platform_mfe_<name>` since
 * 1.0.0-alpha.4). Derived from APP_ID, so the build's name (rsbuild.config.ts) and the name the code
 * uses for storage, messages and logs cannot drift apart: web-shell's manifest key is the same name.
 */
const GLOBAL = containerName(APP_ID)
const ORIGIN = 'http://localhost:5002/'

/** What web-shell shares: its singletons, by share key and version. */
function shellScope(omit: string[] = []) {
  const provided: Record<string, [version: string, module: unknown]> = {
    react: [React.version, React],
    'react/jsx-runtime': [React.version, JsxRuntime],
    'react-dom': [React.version, ReactDom],
    [`${SDK}/auth`]: [sdkPackage.version, Auth],
    [`${SDK}/config`]: [sdkPackage.version, Config],
    [`${SDK}/i18n`]: [sdkPackage.version, I18n],
    [`${SDK}/logging`]: [sdkPackage.version, Logging],
    [`${SDK}/metrics`]: [sdkPackage.version, Metrics],
    [`${SDK}/problem`]: [sdkPackage.version, Problem],
    [`${SDK}/react`]: [sdkPackage.version, SdkReact],
    [`${SDK}/storage`]: [sdkPackage.version, Storage],
  }
  const consumed = new Set<string>()
  const scope: ShareScope = {}
  for (const [key, [version, module]] of Object.entries(provided)) {
    if (omit.includes(key)) continue
    scope[key] = {
      [version]: {
        from: 'shell',
        get: async () => {
          consumed.add(key)
          return () => module
        },
      },
    }
  }
  return { scope, consumed }
}

let build: RemoteBuild

/** Answers the container's <script>/<link> requests from the build output. */
function serveBuild() {
  const append = HTMLHeadElement.prototype.appendChild
  vi.spyOn(HTMLHeadElement.prototype, 'appendChild').mockImplementation(function (this: HTMLHeadElement, node) {
    const el = node as unknown as HTMLScriptElement & HTMLLinkElement
    const url = el.tagName === 'SCRIPT' ? el.src : el.tagName === 'LINK' ? el.href : undefined
    if (!url?.startsWith(ORIGIN)) return append.call(this, node) as never
    queueMicrotask(() => {
      if (el.tagName === 'SCRIPT') (0, eval)(build.read(url.slice(ORIGIN.length)))
      el.onload?.(new Event('load'))
    })
    return node
  })
}

/** Runs remoteEntry.js as the page would: a classic script that defines `var __platform_mfe_dashboard`. */
function loadEntry(): Container {
  Object.defineProperty(document, 'currentScript', { configurable: true, value: { src: `${ORIGIN}remoteEntry.js`, tagName: 'SCRIPT' } })
  ;(0, eval)(build.read('remoteEntry.js'))
  Reflect.deleteProperty(document, 'currentScript')
  return (globalThis as unknown as Record<string, Container>)[GLOBAL]
}

beforeAll(() => {
  build = buildRemote()
}, 120_000)

afterAll(() => build?.remove())

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(globalThis, GLOBAL)
  Reflect.deleteProperty(globalThis, `rspackChunk${GLOBAL.slice(1)}`)
})

describe('remoteEntry.js', () => {
  it('defines the dashboard container synchronously, as loadRemote reads it', () => {
    expect(APP_ID).toBe('dashboard')
    expect(GLOBAL).toBe('__platform_mfe_dashboard')
    expect(build.read('remoteEntry.js').startsWith(`var ${GLOBAL};`)).toBe(true)
    const container = loadEntry()
    expect(typeof container.init).toBe('function')
    expect(typeof container.get).toBe('function')
    expect(container).not.toBeInstanceOf(Promise)
  })

  it('does not bundle the platform SDK', () => {
    const js = build.files().filter((f) => f.endsWith('.js'))
    // The SDK's own sources would carry its storage warning text; only share keys may name it.
    for (const file of js) expect(build.read(file)).not.toContain('no workspace is signed in')
  })

  it('consumes only shared modules the shell provides', () => {
    const entry = build.read('remoteEntry.js')
    const keys = [...entry.matchAll(/shareKey:"([^"]+)"/g)].map((m) => m[1]!)
    const { scope } = shellScope()
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(Object.keys(scope)).toContain(key)
  })

  it('pins every lazily loaded stylesheet by its sha384, as it pins scripts', () => {
    // Since webpack-preset 1.0.0-alpha.4 the runtime sets link.integrity for CSS chunks; a missing or
    // stale hash makes the browser refuse the stylesheet inside the shell.
    const entry = build.read('remoteEntry.js')
    const css = build.files().filter((f) => f.endsWith('.css'))
    expect(css.length).toBeGreaterThan(0)
    for (const file of css) expect(entry, file).toContain(integrityOf(readFileSync(join(build.dir, file))))
  })
  it('ships its images and loads them from its own public path, not the page origin', () => {
    // Inside web-shell the page origin is the shell's: a '/image/…' URL would 404 there (web-shell #29).
    const images = build.files().filter((f) => /\.(png|jpe?g|gif|svg|webp|avif)$/.test(f))
    expect(images.map((f) => f.replace(/\.[0-9a-f]+\.(\w+)$/, '.$1')).sort()).toEqual(
      ['assets/logo-main-black.png', 'assets/logo-main-white.png', 'assets/logo.png'],
    )
    const js = build.files().filter((f) => f.endsWith('.js')).map((f) => build.read(f)).join('\n')
    for (const file of images) expect(js, file).toMatch(new RegExp(`\\.p\\+"${file.replace(/\./g, '\\.')}"`))
    expect(js).not.toMatch(/["'`]\/image\//)
  })
})

describe('./App loaded through the container', () => {
  it('renders with the shell’s React and SDK singletons', async () => {
    serveBuild()
    window.history.replaceState({}, '', '/t/test/dashboard')
    const platform = startPlatform({ user: { sub: 'u-1', name: 'Ada Lovelace', email: 'ada.lovelace@example.com' } })
    const { scope, consumed } = shellScope()

    const container = loadEntry()
    await container.init(scope)
    const factory = await container.get('./App')
    const { default: RemoteApp } = factory() as { default: React.ComponentType }

    render(<RemoteApp />, { wrapper: platform.Wrapper })

    // The user comes from the shell's SDK session, the text from the catalog registered through it.
    expect(await screen.findByRole('button', { name: /Ada L/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toHaveAttribute('href', '/t/test/dashboard')
    expect(consumed).toEqual(new Set(['react', 'react/jsx-runtime', `${SDK}/auth`, `${SDK}/config`, `${SDK}/i18n`, `${SDK}/logging`, `${SDK}/metrics`, `${SDK}/problem`, `${SDK}/react`, `${SDK}/storage`]))
  })

  it('fails to load when the shell does not provide the SDK (no fallback copy)', async () => {
    serveBuild()
    const { scope } = shellScope([`${SDK}/react`])
    const container = loadEntry()
    await container.init(scope)
    await expect(container.get('./App').then((f) => f())).rejects.toThrow(`Shared module ${SDK}/react doesn't exist in shared scope default`)
  })

  it('rejects a module it does not expose', async () => {
    const container = loadEntry()
    await container.init(shellScope().scope)
    await expect(container.get('./Nope')).rejects.toThrow('Module "./Nope" does not exist in container.')
  })
})

describe('build-time logout target', () => {
  it.each([
    [{}, 'http://localhost:5001'],
    [{ PUBLIC_APP1_URL: 'https://login.example.com' }, 'https://login.example.com'],
    [{ VITE_APP1_URL: 'https://legacy.example.com' }, 'https://legacy.example.com'],
  ])('%j is compiled into the remote as %s', (env, url) => {
    const out = Object.keys(env).length === 0 ? build : buildRemote(env)
    try {
      const js = out.files().filter((f) => f.endsWith('.js')).map((f) => out.read(f)).join('\n')
      expect(js).toContain(JSON.stringify(url))
      expect(js).not.toContain('import.meta.env')
    } finally {
      if (out !== build) out.remove()
    }
  }, 120_000)
})
