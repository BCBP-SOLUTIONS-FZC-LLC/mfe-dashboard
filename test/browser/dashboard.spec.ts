// Critical journeys of the standalone dashboard in Chromium (production build, dev runtime config),
// and WCAG 2.1 AA with axe-core. Standalone there is no shell: the user is anonymous and permissions
// deny all, so All Tenders and User management are hidden (covered by test/e2e and web-shell's
// contract suite, which mount the remote in the shell).
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { wcagViolations } from './axe'

/** The first visible match: the page also renders some text in a layout hidden at this width. */
const shown = (page: Page, text: string | RegExp) => page.getByText(text).filter({ visible: true }).first()

// Each environment mounts its own runtime.json; this one names the environment and the sign-in page,
// as a deployed file does (config/runtime.local.json is the dev server's).
const runtimeConfig = JSON.parse(readFileSync(new URL('../../config/runtime.local.json', import.meta.url), 'utf8'))

test.beforeEach(async ({ page }) => {
  await page.route('**/config/runtime.json', (route) => route.fulfill({ json: { ...runtimeConfig, environment: 'test' } }))
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  // The summary (KPI counts) and the first ticket load have finished.
  await expect(shown(page, 'IT Infrastructure Modernization')).toBeVisible()
})

test('switches views and shows each queue', async ({ page }) => {
  const review = page.getByRole('button', { name: /Awaiting My Review/ }).first()
  await review.click()
  await expect(review).toHaveAttribute('aria-pressed', 'true')
  await expect(shown(page, 'Offshore Wind Substation')).toBeVisible()
  await page.getByRole('button', { name: /Delegated To Me/ }).first().click()
  await expect(shown(page, 'From Arjun R')).toBeVisible()
  await expect(page.getByRole('button', { name: /All Tenders In Flight/ })).toHaveCount(0)
})

test('filters, clears, and searches the ticket list', async ({ page }) => {
  const filters = page.getByRole('button', { name: /^Filters/ })
  await filters.click()
  const dialog = page.getByRole('dialog', { name: 'Filters' })
  await dialog.getByLabel('Deadline').selectOption('overdue')
  await dialog.getByLabel('Tender').selectOption({ label: 'Hardware' })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(filters).toBeFocused()
  await expect(shown(page, 'No tickets found')).toBeVisible()
  await page.getByRole('button', { name: 'Clear Filters →' }).first().click()
  await expect(shown(page, 'IT Infrastructure Modernization')).toBeVisible()

  await page.getByRole('searchbox').fill('zzzz-no-match')
  await expect(shown(page, 'No matching tickets')).toBeVisible()
  await page.getByRole('searchbox').fill('')
  await expect(shown(page, 'Hardware Integration Project')).toBeVisible()
})

test('reloads a nested route: its assets load (root-absolute) and an unknown path returns to the dashboard', async ({ page }) => {
  await page.goto('/dashboard/anything/deeper')
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('logs out to the runtime config\'s sign-in page', async ({ page }) => {
  // The runtime config's auth.signInUrl (http://localhost:5001; http is accepted in the test environment).
  await page.route('http://localhost:5001/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>sign-in</title>' }))
  await page.locator('[data-user-menu-trigger]').click()
  await page.getByRole('menuitem', { name: 'Logout' }).click()
  await expect(page).toHaveURL('http://localhost:5001/')
})

test.describe('WCAG 2.1 AA (axe-core)', () => {
  test('the dashboard has no violations', async ({ page }) => {
    expect(await wcagViolations(page)).toEqual([])
  })

  test('the open filter drawer has no violations', async ({ page }) => {
    await page.getByRole('button', { name: /^Filters/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
    expect(await wcagViolations(page)).toEqual([])
  })

  test('the dark theme has no violations', async ({ page }) => {
    await page.locator('[data-user-menu-trigger]').click()
    await page.getByRole('menuitem', { name: /Theme mode/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await wcagViolations(page)).toEqual([])
  })
})
