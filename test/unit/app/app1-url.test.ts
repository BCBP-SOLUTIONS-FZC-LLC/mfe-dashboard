// The build-time logout target: PUBLIC_APP1_URL, then the deprecated VITE_APP1_URL, then the local
// sign-in app (config/app1Url.ts, read by rsbuild.config.ts).
import { describe, expect, it } from 'vitest'
import { DEFAULT_APP1_URL, resolveApp1Url } from '../../../config/app1Url'

describe('resolveApp1Url', () => {
  it.each([
    [{ PUBLIC_APP1_URL: 'https://login.example.com' }, 'https://login.example.com', false],
    [{ PUBLIC_APP1_URL: 'https://login.example.com', VITE_APP1_URL: 'https://old.example.com' }, 'https://login.example.com', false],
    [{ VITE_APP1_URL: 'https://old.example.com' }, 'https://old.example.com', true],
    // Docker passes unset build args as empty strings.
    [{ PUBLIC_APP1_URL: '', VITE_APP1_URL: 'https://old.example.com' }, 'https://old.example.com', true],
    [{ PUBLIC_APP1_URL: '', VITE_APP1_URL: '' }, DEFAULT_APP1_URL, false],
    [{}, DEFAULT_APP1_URL, false],
  ])('%j → %s (deprecated: %s)', (env, url, deprecated) => {
    expect(resolveApp1Url(env)).toEqual({ url, deprecated })
  })
})
