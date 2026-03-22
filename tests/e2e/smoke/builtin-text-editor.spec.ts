import { test, expect } from '@playwright/test'

test.describe('built-in text editor', () => {
  test('opens text editor route and supports plain text save flow', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('topbar-hint-dismissed', 'true')
    })
    await page.goto('/editor/e2e-note.txt')

    await expect(page.getByLabel('Built-in text editor')).toBeVisible()
    await expect(page.getByText('e2e-note.txt · 已保存')).toBeVisible()

    const editor = page.getByLabel('Built-in text editor')
    await editor.fill('This content is created by Playwright smoke test.')

    await expect(page.getByText('e2e-note.txt · 未保存更改')).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('e2e-note.txt · 已保存')).toBeVisible()
  })
})
