// The dashboard remote's Rsbuild build: the platform plugin makes it Module Federation remote
// `app2` (container `window.app2`, `remoteEntry.js`, exposing ./App). React and the OTel API come
// from the shell as strict singletons, and the SDK is never bundled (import: false). The output is
// CSP-safe and every lazily loaded chunk carries integrity. `npm run dev` also serves the app on
// its own at http://localhost:5002 (src/index.ts).
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginPlatform } from '@bcbp-solutions-fzc-llc/webpack-preset/rsbuild'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginPlatform({ role: 'remote', name: 'app2', exposes: { './App': './src/App.tsx' } }),
  ],
  source: {
    entry: { index: './src/index.ts' },
    define: {
      // Standalone only: where "Log out" goes when no shell passes onLogout.
      'import.meta.env.VITE_APP1_URL': JSON.stringify(process.env.VITE_APP1_URL ?? 'http://localhost:5001'),
    },
  },
  html: { template: './index.html' },
  output: {
    // Hashed files live under /assets/ (served immutable); remoteEntry.js stays at the root.
    distPath: { js: 'assets', css: 'assets', font: 'assets', image: 'assets', svg: 'assets', media: 'assets', wasm: 'assets', assets: 'assets' },
    sourceMap: { css: false },
    // External script tags only: CSP script-src 'self' allows no inline script.
    inlineScripts: false,
    inlineStyles: false,
  },
  // Split only lazily loaded chunks. Rsbuild's default vendor groups also split the entries, and
  // a remoteEntry.js that needs other chunks starts asynchronously: window.app2 becomes a Promise
  // instead of the container, and the SDK's loadRemote refuses it.
  splitChunks: { preset: 'none', chunks: 'async' },
  // Root-relative url()s in the CSS point at files in public/; leave them as written.
  tools: { cssLoader: { url: false } },
  // The shell (http://localhost:5001) loads remoteEntry.js and its chunks cross-origin in dev.
  server: { port: 5002, strictPort: true, host: 'localhost', cors: { origin: '*' } },
  // No dev client: Rsbuild would inject it into remoteEntry.js too, which makes the container start
  // asynchronously, and the SDK's loadRemote then finds no window.app2. Reload the shell by hand.
  dev: { hmr: false, liveReload: false },
})
