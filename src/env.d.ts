interface ImportMetaEnv {
  /** Standalone only: where "Log out" goes when no shell passes onLogout (config/app1Url.ts). */
  readonly PUBLIC_APP1_URL?: string
  /** Rsbuild: true on the dev server (the standalone page's fallback environment is local then). */
  readonly DEV: boolean
  /** Standalone only: the page identity's build version (BUILD_VERSION at build time). */
  readonly BUILD_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css'
declare module '*.png' {
  const url: string
  export default url
}
