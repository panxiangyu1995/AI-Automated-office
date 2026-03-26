import { test, expect } from '@playwright/test'

test('agent panel secondary surfaces stay on demand', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('topbar-hint-dismissed', 'true')
  })

  await page.goto('/')
  const sessionsSurface = page.locator('section[aria-label="会话列表"]')
  const historySurface = page.locator('section[aria-label="历史记录"]')

  await expect(page.getByRole('button', { name: '打开会话列表' })).toBeVisible()
  await expect(sessionsSurface).toHaveCount(0)
  await expect(historySurface).toHaveCount(0)

  await page.getByRole('button', { name: '打开会话列表' }).click()
  await expect(sessionsSurface).toBeVisible()

  await page.getByRole('button', { name: '关闭次级面板' }).click()
  await expect(sessionsSurface).toHaveCount(0)

  await page.getByRole('button', { name: '打开历史记录' }).click()
  await expect(historySurface).toBeVisible()

  await historySurface.getByRole('button', { name: '关闭' }).click()
  await expect(historySurface).toHaveCount(0)
})
