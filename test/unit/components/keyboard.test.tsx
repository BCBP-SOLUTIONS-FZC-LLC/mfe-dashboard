// Keyboard behaviour of the popups: the user menu (focus, arrows, Home/End, Escape back to its
// trigger), the theme picker (Escape), and the filter drawer (focus trap, focus returned on close).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../../src/app/App'

function mount() {
  window.history.replaceState({}, '', '/t/acme/dashboard')
  render(<App userLabel="ada.lovelace@example.com" />)
  return userEvent.setup()
}

describe('user menu', () => {
  it('focuses the first item, moves with the arrow keys and closes on Escape', async () => {
    const user = mount()
    const trigger = await screen.findByRole('button', { name: /Ada L/ })
    await user.click(trigger)

    const items = screen.getAllByRole('menuitem')
    expect(items.length).toBeGreaterThan(2)
    expect(items[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(items[items.length - 1]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(items[0]).toHaveFocus()
    await user.keyboard('{End}')
    expect(items[items.length - 1]).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe('theme picker', () => {
  it('closes on Escape', async () => {
    const user = mount()
    await user.click(await screen.findByRole('button', { name: 'Choose theme' }))
    expect(screen.getByRole('menu', { name: 'Themes' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Themes' })).not.toBeInTheDocument()
  })

  it('is a menu of radio items: focus starts on the current theme, arrows and Home/End move', async () => {
    const user = mount()
    const trigger = await screen.findByRole('button', { name: 'Choose theme' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await user.click(trigger)
    const menu = screen.getByRole('menu', { name: 'Themes' })
    const items = within(menu).getAllByRole('menuitemradio')
    const checked = items.filter((item) => item.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveFocus()
    expect(within(menu).getAllByRole('group').map((g) => g.getAttribute('aria-labelledby'))).toHaveLength(2)

    await user.keyboard('{End}')
    expect(items[items.length - 1]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(items[0]).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(items[items.length - 1]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(items[0]).toHaveFocus()
  })
})

describe('filter drawer', () => {
  it('keeps focus inside while open and returns it to the Filters button', async () => {
    const user = mount()
    const open = await screen.findByRole('button', { name: /^Filters/ })
    await user.click(open)

    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    const first = document.activeElement
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.tab()
    expect(document.activeElement).toBe(first)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(open).toHaveFocus()
  })
})
