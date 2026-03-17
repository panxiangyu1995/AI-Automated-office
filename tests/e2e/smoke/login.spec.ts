import { test, expect } from '@playwright/test'

test('login screen is visible', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
})
