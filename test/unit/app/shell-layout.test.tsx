// AppShellLayout's own logic: the user button's initials and short name for each label shape, the
// catalog's "User" when nobody is named, and the no-shell logout target.
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppShellLayout, { defaultLogout } from '../../../src/layouts/AppShellLayout'

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

describe('defaultLogout (no shell signOut)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('goes to VITE_APP1_URL without a trailing slash', () => {
    vi.stubEnv('VITE_APP1_URL', 'https://login.example.com/')
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    defaultLogout()
    expect(assign).toHaveBeenCalledWith('https://login.example.com')
  })

  it('falls back to the local sign-in app when VITE_APP1_URL is unset', () => {
    vi.stubEnv('VITE_APP1_URL', undefined)
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    defaultLogout()
    expect(assign).toHaveBeenCalledWith('http://localhost:5001')
  })
})
