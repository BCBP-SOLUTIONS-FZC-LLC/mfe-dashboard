import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App, { routerBasename } from '../../src/App'

describe('routerBasename', () => {
  it.each([
    ['/dashboard', ''],
    ['/dashboard/user-management', ''],
    ['/t/acme/dashboard', '/t/acme'],
    ['/t/acme/dashboard/user-management', '/t/acme'],
    ['/', ''],
    ['/t/acme/dashboards', ''],
  ])('%s → %j', (path, basename) => {
    expect(routerBasename(path)).toBe(basename)
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
})

describe('standalone entry', () => {
  it('loads main behind the async boundary', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const { started } = await import('../../src/index')
    await expect(started).resolves.toBeDefined()
  })
})
