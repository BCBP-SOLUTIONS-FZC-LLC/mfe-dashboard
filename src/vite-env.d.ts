/// <reference types="vite/client" />

declare module 'daisyui/theme/object.js' {
  const themes: Record<string, Record<string, string>>
  export default themes
}

interface ImportMetaEnv {
  readonly VITE_APP1_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
