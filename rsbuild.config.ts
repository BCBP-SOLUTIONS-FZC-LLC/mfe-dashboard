// Two builds in one: `remote` is the Module Federation remote the shell loads (`dashboard`,
// remoteEntry.js, exposing ./App), where React, the OTel API and the platform SDK come from the shell
// as strict singletons and the SDK is never bundled (import: false). `standalone` is the page served
// at / (http://localhost:5002 in dev, / in the image): no Module Federation, the SDK bundled, and with
// no shell around it every SDK API answers with its anonymous defaults (design doc §C2: denyAll, empty
// flags, console logger, the default locale). Both write to dist/; their file names never collide.
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginPlatform } from '@bcbp-solutions-fzc-llc/webpack-preset/rsbuild'
import { readFileSync } from 'node:fs'

// Hashed CSS, fonts and images live under /assets/ (served immutable); the remote's JS stays next to
// remoteEntry.js (the preset names it), the standalone page's JS goes to /assets/ too.
const assets = { js: 'assets', css: 'assets', font: 'assets', image: 'assets', svg: 'assets', media: 'assets', wasm: 'assets', assets: 'assets' }

// The dev server's runtime config (the standalone page loads /config/runtime.json): environment
// local and the local web-shell as auth.signInUrl. Deployed environments mount their own file over
// the image's default; nothing environment-specific is compiled in (build once, deploy everywhere).
const RUNTIME_LOCAL = new URL('./config/runtime.local.json', import.meta.url)

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      // The standalone page identity's build version (src/app/bootstrap/standalone.ts); its environment comes from runtime.json.
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
      plugins: [pluginPlatform({ role: 'remote', name: 'dashboard', exposes: { './App': './src/app/App.tsx' } })],
      // The shell loads only remoteEntry.js, which the preset adds; Rsbuild still needs an entry.
      source: { entry: { remote: './src/app/bootstrap/remote.ts' } },
      // Split only lazily loaded chunks. Rsbuild's default vendor groups also split the entries, and
      // a remoteEntry.js that needs other chunks starts asynchronously: window.__platform_mfe_dashboard becomes a Promise
      // instead of the container, and the SDK's loadRemote refuses it.
      splitChunks: { preset: 'none', chunks: 'async' },
      tools: { htmlPlugin: false },
      // public/ is copied once, by the standalone build.
      server: { publicDir: false },
    },
    standalone: {
      source: { entry: { index: './src/app/bootstrap/main.tsx' } },
      html: { template: './index.html' },
      // Root-absolute URLs for the page's own scripts, styles and favicon. The preset sets
      // assetPrefix 'auto' (right for the remote, which is loaded from anywhere); in this HTML that
      // becomes relative ('assets/…'), and a reload of /dashboard/user-management would then ask for
      // /dashboard/assets/… and get index.html back. The standalone page is always served at /.
      output: { assetPrefix: '/' },
    },
  },
  // The shell (http://localhost:5001) loads remoteEntry.js and its chunks cross-origin in dev.
  server: {
    port: 5002,
    strictPort: true,
    host: 'localhost',
    cors: { origin: '*' },
    // `rsbuild dev` and `rsbuild preview`: /config/runtime.json from config/runtime.local.json.
    setup: ({ server }) => {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || req.url?.split('?')[0] !== '/config/runtime.json') return next()
        res.setHeader('content-type', 'application/json')
        res.setHeader('cache-control', 'no-cache')
        res.end(readFileSync(RUNTIME_LOCAL))
      })
    },
  },
  // No dev client: Rsbuild would inject it into remoteEntry.js too, which makes the container start
  // asynchronously, and the SDK's loadRemote then finds no window.__platform_mfe_dashboard. Reload the shell by hand.
  dev: { hmr: false, liveReload: false },
})
