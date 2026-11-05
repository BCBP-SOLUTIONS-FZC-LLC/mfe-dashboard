// AppShellLayout's own logic: the user button's initials and short name for each label shape, the
// catalog's "User" when nobody is named, and the no-shell logout target.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { storage } from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppShellLayout, { defaultLogout } from '../../../src/layouts/AppShellLayout'
import { FALLBACK_ENVIRONMENT, standaloneIdentity, startStandalone } from '../../../src/standalone'
import { startPlatform } from '../../fixtures/platform'

function userButton(userLabel?: string) {
  render(
    <MemoryRouter>
      <AppShellLayout userLabel={userLabel} />
    </MemoryRouter>,
  )
  return screen.getByRole('button', { expanded: false, name: (_, el) => el.hasAttribute('data-user-menu-trigger') })
}

describe('user button', () => {
  it.each([
    ['ada.lovelace@example.com', 'AL', 'Ada L.'],
    ['grace_hopper', 'GH', 'Grace H.'],
    ['Linus', 'LI', 'Linus'],
    ['Q', 'Q', 'Q'],
    ['@example.com', 'U', ''],
  ])('%j → initials %s, name %j', (label, initials, name) => {
    const button = userButton(label)
    const [badge, shortName] = within(button).getAllByText(/.*/, { selector: 'span' })
    expect(badge).toHaveTextContent(new RegExp(`^${initials}$`))
    expect(shortName!.textContent).toBe(name)
  })

  it('shows the catalog’s "User" when the shell names nobody', () => {
    const button = userButton(undefined)
    expect(within(button).getByText('US')).toBeInTheDocument()
    expect(within(button).getByText('User')).toBeInTheDocument()
  })
})

describe('theme', () => {
  it('shows the theme on mount without storing it, and stores a choice', async () => {
    render(
      <MemoryRouter>
        <AppShellLayout userLabel="Ada" />
      </MemoryRouter>,
    )
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(storage('dashboard').get('appTheme')).toBeUndefined()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { expanded: false, name: (_, el) => el.hasAttribute('data-user-menu-trigger') }))
    await user.click(screen.getByRole('menuitem', { name: /Theme mode/ }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(storage('dashboard').get('appTheme')).toBe('dark')
    expect(storage('dashboard').get('themeMode')).toBe('dark')
  })
})

describe('search box', () => {
  it('is labelled for screen readers, not only by its placeholder', () => {
    render(
      <MemoryRouter>
        <AppShellLayout userLabel="Ada" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('searchbox', { name: 'Search tickets, tenders, clients...' })).toBeInTheDocument()
  })
})

describe('defaultLogout (no shell signOut)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('goes to PUBLIC_APP1_URL without a trailing slash', () => {
    vi.stubEnv('PUBLIC_APP1_URL', 'https://login.example.com/')
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    defaultLogout()
    expect(assign).toHaveBeenCalledWith('https://login.example.com')
  })

  it('falls back to the local sign-in app when PUBLIC_APP1_URL is unset', () => {
    vi.stubEnv('PUBLIC_APP1_URL', undefined)
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    defaultLogout()
    expect(assign).toHaveBeenCalledWith('http://localhost:5001')
  })
})

describe('startStandalone when the page already has a config', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps it and fetches nothing (one page, one config)', async () => {
    startPlatform({ identity: standaloneIdentity(FALLBACK_ENVIRONMENT) })
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await startStandalone()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('page error boundary', () => {
  function Broken(): never {
    throw new Error('page render failed')
  }

  it('replaces only the page, keeps the chrome, and clears when the path changes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route element={<AppShellLayout userLabel="Ada" />}>
            <Route path="broken" element={<Broken />} />
            <Route path="ok" element={<p>Healthy page</p>} />
          </Route>
        </Routes>
        <Link to="/ok">go ok</Link>
      </MemoryRouter>,
    )
    const main = screen.getByRole('main')
    expect(within(main).queryByText('Healthy page')).not.toBeInTheDocument()
    expect(main.textContent).not.toBe('')
    expect(screen.getByRole('navigation')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'go ok' }))
    expect(within(screen.getByRole('main')).getByText('Healthy page')).toBeInTheDocument()
  })
})
