import { test, expect } from '@playwright/test'

test.describe('built-in markdown editor', () => {
  test('opens markdown editor and saves source edits', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('topbar-hint-dismissed', 'true')
    })
    await page.goto('/editor/smoke-note.md')

    const source = page.getByLabel('Built-in markdown editor')
    await expect(source).toBeVisible()

    await source.fill('# Smoke Note\n\n- item 1\n- item 2\n')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('heading', { name: 'Smoke Note' })).toBeVisible()
  })
})
