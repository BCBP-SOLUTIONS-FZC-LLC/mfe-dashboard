// Where "Log out" goes when no shell signs the user out (standalone), fixed at build time.
// PUBLIC_APP1_URL is the name (Rsbuild's prefix for values that end up in the browser bundle).
// VITE_APP1_URL is the deprecated Vite-era name, still read when PUBLIC_APP1_URL is unset or empty.
export const DEFAULT_APP1_URL = 'http://localhost:5001'

type Env = Partial<Record<'PUBLIC_APP1_URL' | 'VITE_APP1_URL', string>>

export function resolveApp1Url(env: Env): { url: string; deprecated: boolean } {
  if (env.PUBLIC_APP1_URL) return { url: env.PUBLIC_APP1_URL, deprecated: false }
  if (env.VITE_APP1_URL) return { url: env.VITE_APP1_URL, deprecated: true }
  return { url: DEFAULT_APP1_URL, deprecated: false }
}
