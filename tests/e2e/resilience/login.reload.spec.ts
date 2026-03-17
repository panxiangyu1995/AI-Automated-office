import { test, expect } from '@playwright/test'

test('login page reload remains stable', async ({ page }) => {
  await page.goto('/login')
  await page.reload()
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
})
