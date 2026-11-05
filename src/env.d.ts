interface ImportMetaEnv {
  /** Standalone only: where "Log out" goes when no shell passes onLogout (config/app1Url.ts). */
  readonly PUBLIC_APP1_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css'
