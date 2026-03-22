import { test, expect } from '@playwright/test'

test.describe('built-in json editor', () => {
  test('opens json editor, formats and saves valid json', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('topbar-hint-dismissed', 'true')
    })
    await page.goto('/editor/smoke-config.json')

    const source = page.getByLabel('Built-in json editor')
    await expect(source).toBeVisible()
    await source.fill('{"name":"smoke","enabled":true}')

    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(source).toContainText('"name": "smoke"')

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Valid JSON')).toBeVisible()
  })
})

