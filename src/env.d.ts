interface ImportMetaEnv {
  /** Standalone only: where "Log out" goes when no shell passes onLogout (rsbuild.config.ts). */
  readonly VITE_APP1_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css'
