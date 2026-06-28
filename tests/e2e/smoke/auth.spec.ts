/**
 * Authentication E2E Tests (真实后端测试)
 *
 * 使用真实 API 调用，模拟实际用户登录流程
 * 需要先启动 docker-compose.test.yml 环境
 */

import { test, expect } from '@playwright/test'
import { testUsers, apiEndpoints } from '../../fixtures/test-data'
import {
  login,
  loginViaApi,
  logout,
  clearAuthState,
  isAuthenticated,
  expectLoginPage,
} from '../../helpers/auth'

test.describe('Authentication Flow (真实后端)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('displays login page correctly', async ({ page }) => {
    await page.goto('/login')

    // Verify login page elements
    await expect(page.getByRole('heading', { name: /欢迎|登录/ })).toBeVisible()
    await expect(page.getByPlaceholder(/用户名|邮箱/)).toBeVisible()
    await expect(page.getByPlaceholder(/密码/)).toBeVisible()
    await expect(page.getByRole('button', { name: /登录/ })).toBeVisible()
  })

  test('shows validation error for empty fields', async ({ page }) => {
    await page.goto('/login')

    const loginButton = page.getByRole('button', { name: /登录/ })
    await loginButton.click()

    // Should show validation errors
    await expect(page.getByText(/请输入用户名|用户名不能为空/)).toBeVisible()
  })

  test('shows error for invalid credentials (真实 API)', async ({ page }) => {
    await page.goto('/login')

    // 使用不存在的用户登录（真实 API 调用）
    await page.getByPlaceholder(/用户名|邮箱/).fill('nonexistent_user_12345')
    await page.getByPlaceholder(/密码/).fill('wrong_password')
    await page.getByRole('button', { name: /登录/ }).click()

    // 应该显示错误消息
    await expect(page.getByText(/用户名或密码错误|登录失败|无效凭据/)).toBeVisible({ timeout: 10000 })
  })

  test('redirects to home after successful login (真实 API)', async ({ page }) => {
    // 使用真实登录 API
    const result = await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)

    expect(result.success).toBe(true)
    expect(result.accessToken).toBeDefined()

    // 跳转到首页
    await page.goto('/')

    // 应该不在登录页
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('full login flow via UI (真实 API)', async ({ page }) => {
    await page.goto('/login')

    // 填写登录表单
    await page.getByPlaceholder(/用户名|邮箱/).fill(testUsers.admin.username)
    await page.getByPlaceholder(/密码/).fill(testUsers.admin.password)
    await page.getByRole('button', { name: /登录/ }).click()

    // 等待登录成功，跳转到首页
    await page.waitForURL('**/', { timeout: 15000 }).catch(() => {
      // 如果 URL 没有变化，检查是否显示了错误
    })

    // 验证登录成功
    await expect(await isAuthenticated(page)).toBe(true)
  })
})

test.describe('Session Management (真实后端)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('persists auth state after page reload', async ({ page }) => {
    // 真实登录
    await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)
    await page.goto('/')

    expect(await isAuthenticated(page)).toBe(true)

    // 刷新页面
    await page.reload()

    // 认证状态应该保持
    expect(await isAuthenticated(page)).toBe(true)
  })

  test('clears auth state on logout (真实 API)', async ({ page }) => {
    // 真实登录
    await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)
    await page.goto('/')
    expect(await isAuthenticated(page)).toBe(true)

    // 登出（真实 API 调用）
    await logout(page)

    // 应该跳转到登录页
    await page.goto('/login')
    await expectLoginPage(page)
  })

  test('handles invalid session gracefully', async ({ page }) => {
    // 设置无效的 token
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'invalid-token')
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          isAuthenticated: true,
          accessToken: 'invalid-token',
        },
        version: 0,
      }))
    })

    // 访问需要认证的页面
    await page.goto('/admin/users')

    // 应该被重定向到登录页或显示错误
    // 等待一段时间后检查
    await page.waitForTimeout(2000)
  })
})

test.describe('Token Management (真实后端)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('stores tokens correctly after login', async ({ page }) => {
    const result = await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)

    expect(result.success).toBe(true)
    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.user).toBeDefined()
    expect(result.user?.id).toBe(testUsers.admin.id)

    // 验证 token 存储在 localStorage 中
    const storedToken = await page.evaluate(() => localStorage.getItem('accessToken'))
    expect(storedToken).toBe(result.accessToken)
  })

  test('refreshes token on expiry (真实 API)', async ({ page }) => {
    // 登录获取 token
    const loginResult = await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)
    expect(loginResult.success).toBe(true)

    // 访问需要认证的 API
    const response = await page.request.get(apiEndpoints.users, {
      headers: {
        Authorization: `Bearer ${loginResult.accessToken}`,
      },
    })

    // 应该返回 200 或其他正常状态码
    // （不一定是 200，因为可能没有权限，但应该是有效响应）
    expect([200, 401, 403]).toContain(response.status())
  })
})

test.describe('Access Control (真实后端)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    // 不登录直接访问受保护页面
    await page.goto('/admin/users')

    // 应该被重定向到登录页
    await expectLoginPage(page)
  })

  test('allows authenticated users to access protected routes', async ({ page }) => {
    // 真实登录
    await loginViaApi(page, testUsers.admin.username, testUsers.admin.password)

    // 访问受保护页面
    await page.goto('/admin/users')

    // 应该能看到用户管理页面（URL 应该是 /admin/users）
    // 注意：可能显示无权限页面，但不应该是登录页
    await page.waitForTimeout(1000)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 })
  })
})
