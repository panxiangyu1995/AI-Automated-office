import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('login page has no a11y violations', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
