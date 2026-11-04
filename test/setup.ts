import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { startPlatform } from './fixtures/platform'

// Every test runs against a fresh SDK runtime: signed in, with web-shell's tenant_admin grants and
// this remote's messages loaded.
beforeEach(async () => {
  startPlatform()
  await new Promise((resolve) => setTimeout(resolve, 0))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
