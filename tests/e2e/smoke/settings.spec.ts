import { test, expect } from '@playwright/test'

test('settings workbench uses the new governance information architecture', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('topbar-hint-dismissed', 'true')
  })

  await page.goto('/')

  await page.getByRole('button', { name: '设置' }).click()

  await expect(page.getByRole('heading', { name: '设置中心' })).toBeVisible()
  await expect(page.getByRole('button', { name: '切换到工作台与个人偏好' })).toBeVisible()
  await expect(page.getByRole('button', { name: '切换到系统、更新与诊断' })).toBeVisible()

  await page.getByRole('button', { name: '切换到工作台与个人偏好' }).click()

  await expect(page.getByRole('heading', { name: '工作台与个人偏好' })).toBeVisible()
  await expect(page.getByRole('button', { name: '打开通用' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: '打开快捷键' }).first()).toBeVisible()
  await expect(page.getByText('治理说明')).toBeVisible()
  await expect(page.getByText('保存状态')).toBeVisible()
  await expect(page.getByText('显示顶部菜单栏')).toBeVisible()

  await page.getByPlaceholder('搜索设置项、能力或治理域').fill('执行审计')

  await expect(page.getByRole('heading', { name: '全局搜索结果' }).first()).toBeVisible()
  await expect(page.getByText('执行审计').first()).toBeVisible()

  await page.getByRole('button', { name: '打开设置' }).first().click()

  await expect(page.getByRole('heading', { name: '安全、权限与审计' })).toBeVisible()
  await expect(page.getByText('审计与可追溯')).toBeVisible()
})
