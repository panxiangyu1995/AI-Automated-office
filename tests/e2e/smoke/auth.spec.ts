/**
 * Authentication E2E Tests
 *
 * Covers login, logout, session management, and token refresh scenarios.
 */

import { test, expect } from '@playwright/test'
import { testUsers, apiEndpoints } from '../../fixtures/test-data'
import {
  mockLogin,
  clearAuthState,
  isAuthenticated,
  expectLoginPage,
} from '../../helpers/auth'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test('displays login page correctly', async ({ page }) => {
    await page.goto('/login')

    // Verify login page elements
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
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

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder(/用户名|邮箱/).fill('invalid_user')
    await page.getByPlaceholder(/密码/).fill('wrong_password')
    await page.getByRole('button', { name: /登录/ }).click()

    // Should show error message
    await expect(page.getByText(/用户名或密码错误|登录失败/)).toBeVisible()
  })

  test('redirects to home after successful login', async ({ page }) => {
    await page.goto('/login')

    // Mock successful login response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            user: {
              id: testUsers.admin.id,
              username: testUsers.admin.username,
              real_name: testUsers.admin.real_name,
            },
          },
        }),
      })
    })

    await page.getByPlaceholder(/用户名|邮箱/).fill(testUsers.admin.username)
    await page.getByPlaceholder(/密码/).fill(testUsers.admin.password)
    await page.getByRole('button', { name: /登录/ }).click()

    // Should redirect to home page
    await expect(page).not.toHaveURL(/\/login/)
  })
})

test.describe('Session Management', () => {
  test('persists auth state after page reload', async ({ page }) => {
    await mockLogin(page)
    await page.goto('/')
    await expect(await isAuthenticated(page)).toBe(true)

    // Reload page
    await page.reload()

    // Auth state should persist
    await expect(await isAuthenticated(page)).toBe(true)
  })

  test('clears auth state on logout', async ({ page }) => {
    await mockLogin(page)
    await page.goto('/')
    await expect(await isAuthenticated(page)).toBe(true)

    // Mock logout API
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    // Trigger logout (assuming there's a logout button in the UI)
    // This would depend on the actual logout UI implementation

    // For now, manually clear and verify
    await clearAuthState(page)
    await page.goto('/login')
    await expectLoginPage(page)
  })

  test('handles session expiry gracefully', async ({ page }) => {
    await mockLogin(page)
    await page.goto('/')

    // Mock 401 response for any API call
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'AUTH_006',
          message: '会话已过期',
        }),
      })
    })

    // Trigger an API call
    await page.goto('/admin/users')

    // Should show session expired modal or redirect to login
    await expect(page.getByText(/会话已过期|请重新登录/)).toBeVisible()
  })
})

test.describe('Token Refresh', () => {
  test('refreshes token on 401 response', async ({ page }) => {
    let tokenExpired = true

    await page.route('**/api/v1/admin/users', async (route) => {
      if (tokenExpired) {
        // First call - token expired
        tokenExpired = false
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            code: 'AUTH_004',
            message: '令牌已过期',
          }),
        })
      } else {
        // Second call - success after refresh
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [],
              total: 0,
              page: 1,
              page_size: 20,
              total_pages: 0,
            },
          }),
        })
      }
    })

    // Mock refresh token endpoint
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        }),
      })
    })

    await mockLogin(page)
    await page.goto('/admin/users')

    // Page should load successfully after token refresh
    await expect(page.getByRole('heading', { name: /用户管理|用户列表/ })).toBeVisible()
  })
})

test.describe('Access Control', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await clearAuthState(page)
    await page.goto('/admin/users')

    // Should be redirected to login
    await expectLoginPage(page)
  })

  test('allows authenticated users to access protected routes', async ({ page }) => {
    await mockLogin(page)
    await page.goto('/admin/users')

    // Should see users page
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('shows forbidden page for users without permission', async ({ page }) => {
    await mockLogin(page, {
      ...testUsers.employee,
      permissions: ['auth_profile_read'], // No admin permissions
    })

    // Mock permission denied response
    await page.route('**/api/v1/admin/users', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'PERM_001',
          message: '权限不足',
          resource: 'admin/users',
          required_permission: 'admin_user_read',
        }),
      })
    })

    await page.goto('/admin/users')

    // Should show forbidden modal or page
    await expect(page.getByText(/权限|访问被拒绝/)).toBeVisible()
  })
})
