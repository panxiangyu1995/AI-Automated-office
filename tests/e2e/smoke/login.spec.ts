import { test, expect } from '@playwright/test'

test('login screen is visible', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
  await expect(page.getByRole('button', { name: '立即登录' })).toBeVisible()
})
