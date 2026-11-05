// Two builds in one: `remote` is the Module Federation remote the shell loads (`app2`,
// remoteEntry.js, exposing ./App), where React, the OTel API and the platform SDK come from the shell
// as strict singletons and the SDK is never bundled (import: false). `standalone` is the page served
// at / (http://localhost:5002 in dev, / in the image): no Module Federation, the SDK bundled, and with
// no shell around it every SDK API answers with its anonymous defaults (design doc §C2: denyAll, empty
// flags, console logger, the default locale). Both write to dist/; their file names never collide.
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginPlatform } from '@bcbp-solutions-fzc-llc/webpack-preset/rsbuild'
import { resolveApp1Url } from './config/app1Url'

// Hashed CSS, fonts and images live under /assets/ (served immutable); the remote's JS stays next to
// remoteEntry.js (the preset names it), the standalone page's JS goes to /assets/ too.
const assets = { js: 'assets', css: 'assets', font: 'assets', image: 'assets', svg: 'assets', media: 'assets', wasm: 'assets', assets: 'assets' }

const app1 = resolveApp1Url(process.env)
if (app1.deprecated) {
  console.warn('VITE_APP1_URL is deprecated: set PUBLIC_APP1_URL instead (same value).')
}

// The standalone page's environment, as web-shell's: PLATFORM_ENVIRONMENT, else prod for a
// production build and local for the dev server.
const environment = process.env.PLATFORM_ENVIRONMENT ?? (process.env.NODE_ENV === 'production' ? 'prod' : 'local')

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      // Where "Log out" goes when no shell signs the user out (config/app1Url.ts).
      'import.meta.env.PUBLIC_APP1_URL': JSON.stringify(app1.url),
      // The standalone page's identity (src/standalone.ts), as web-shell sets its own.
      'import.meta.env.PLATFORM_ENVIRONMENT': JSON.stringify(environment),
      'import.meta.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || process.env.npm_package_version || ''),
    },
  },
  output: {
    distPath: assets,
    // Both builds share dist/; `npm run build` empties it first.
    cleanDistPath: false,
    sourceMap: { css: false },
    // External script tags only: CSP script-src 'self' allows no inline script.
    inlineScripts: false,
    inlineStyles: false,
  },
  // Root-relative url()s in the CSS point at files in public/; leave them as written. Relative ones
  // (the self-hosted font files) are bundled.
  tools: { cssLoader: { url: { filter: (url: string) => !url.startsWith('/') } } },
  environments: {
    remote: {
      plugins: [pluginPlatform({ role: 'remote', name: 'app2', exposes: { './App': './src/App.tsx' } })],
      // The shell loads only remoteEntry.js, which the preset adds; Rsbuild still needs an entry.
      source: { entry: { remote: './src/remote.ts' } },
      // Split only lazily loaded chunks. Rsbuild's default vendor groups also split the entries, and
      // a remoteEntry.js that needs other chunks starts asynchronously: window.__platform_mfe_app2 becomes a Promise
      // instead of the container, and the SDK's loadRemote refuses it.
      splitChunks: { preset: 'none', chunks: 'async' },
      tools: { htmlPlugin: false },
      // public/ is copied once, by the standalone build.
      server: { publicDir: false },
    },
    standalone: {
      source: { entry: { index: './src/main.tsx' } },
      html: { template: './index.html' },
    },
  },
  // The shell (http://localhost:5001) loads remoteEntry.js and its chunks cross-origin in dev.
  server: { port: 5002, strictPort: true, host: 'localhost', cors: { origin: '*' } },
  // No dev client: Rsbuild would inject it into remoteEntry.js too, which makes the container start
  // asynchronously, and the SDK's loadRemote then finds no window.__platform_mfe_app2. Reload the shell by hand.
  dev: { hmr: false, liveReload: false },
})
