import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App, { workspaceBasename } from '../../../src/app/App'

describe('workspaceBasename (as web-shell computes its basename)', () => {
  it.each([
    ['/dashboard', ''],
    ['/dashboard/user-management', ''],
    ['/t/acme/dashboard', '/t/acme'],
    ['/t/acme/dashboard/user-management', '/t/acme'],
    ['/', ''],
  ])('%s → %j', (path, basename) => {
    expect(workspaceBasename(path)).toBe(basename)
  })

  it('is empty without runtime config (standalone)', async () => {
    vi.resetModules()
    vi.doMock('@bcbp-solutions-fzc-llc/frontend-sdk/config', () => ({ tryGetConfig: () => undefined }))
    const standalone = await import('../../../src/app/App')
    expect(standalone.workspaceBasename('/t/acme/dashboard')).toBe('')
    vi.doUnmock('@bcbp-solutions-fzc-llc/frontend-sdk/config')
  })
})

describe('App inside the shell', () => {
  it('routes under the workspace prefix with its own router', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard/user-management')
    render(<App userLabel="Ada" />)
    expect(await screen.findByRole('heading', { name: 'User management' })).toBeInTheDocument()
    const dashboardLink = screen.getAllByRole('link', { name: /dashboard/i })[0]!
    expect(dashboardLink).toHaveAttribute('href', '/t/acme/dashboard')
  })

  it('sends an unknown nested path back to the dashboard instead of rendering nothing', async () => {
    window.history.replaceState({}, '', '/t/acme/dashboard/no/such/page')
    render(<App userLabel="Ada" />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/t/acme/dashboard')
  })
})
