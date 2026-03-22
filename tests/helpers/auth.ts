/**
 * Authentication test helper for E2E tests
 *
 * Provides utilities for login, logout, and session management in tests.
 */

import { Page, expect } from '@playwright/test'
import { testUsers, apiEndpoints } from '../fixtures/test-data'

export interface LoginResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    username: string
    real_name: string
  }
}

async function ensureOrigin(page: Page): Promise<void> {
  const url = page.url()
  if (!url || url.startsWith('about:')) {
    await page.goto('/')
  }
}

/**
 * Login helper - authenticates a user via API
 */
export async function login(
  page: Page,
  username: string = testUsers.admin.username,
  password: string = testUsers.admin.password
): Promise<LoginResult> {
  await ensureOrigin(page)
  const response = await page.request.post(apiEndpoints.login, {
    data: { username, password },
  })

  if (!response.ok()) {
    return { success: false }
  }

  const data = await response.json()

  if (data.success && data.data) {
    // Store tokens in localStorage
    await page.evaluate(
      ({ accessToken, refreshToken }) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      },
      {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }
    )

    return {
      success: true,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: data.data.user,
    }
  }

  return { success: false }
}

/**
 * Logout helper - clears auth state
 */
export async function logout(page: Page): Promise<void> {
  await ensureOrigin(page)
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('auth-storage')
  })
}

/**
 * Mock login for UI tests - bypasses API and sets auth state directly
 */
export async function mockLogin(
  page: Page,
  user: {
    id: string
    username: string
    real_name: string
    email: string
    roles?: string[]
    permissions?: string[]
  } = testUsers.admin
): Promise<void> {
  await ensureOrigin(page)
  await page.evaluate((userData) => {
    const authState = {
      state: {
        isAuthenticated: true,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: userData.id,
          username: userData.username,
          real_name: userData.real_name,
          email: userData.email,
          status: 'active',
        },
        permissions: userData.permissions || [
          'auth_profile_read',
          'admin_user_read',
          'admin_user_write',
          'admin_role_read',
          'admin_role_write',
          'admin_department_read',
          'admin_department_write',
          'audit_log_read',
          'audit_log_export',
        ],
        roles: userData.roles || ['ADMIN'],
      },
      version: 0,
    }

    localStorage.setItem('auth-storage', JSON.stringify(authState))
    localStorage.setItem('accessToken', 'mock-access-token')
    localStorage.setItem('refreshToken', 'mock-refresh-token')
  }, user)
}

/**
 * Wait for page to be ready after authentication
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Wait for auth state to be restored
  await page.waitForFunction(() => {
    const auth = localStorage.getItem('auth-storage')
    return auth !== null
  })
}

/**
 * Navigate to a protected page and verify auth
 */
export async function navigateAsUser(
  page: Page,
  path: string,
  user?: {
    id: string
    username: string
    real_name: string
    email: string
    roles?: string[]
    permissions?: string[]
  }
): Promise<void> {
  await mockLogin(page, user)
  await page.goto(path)
  await waitForAuthReady(page)
}

/**
 * Clear all auth state
 */
export async function clearAuthState(page: Page): Promise<void> {
  await ensureOrigin(page)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await ensureOrigin(page)
  return await page.evaluate(() => {
    const auth = localStorage.getItem('auth-storage')
    if (!auth) return false
    try {
      const parsed = JSON.parse(auth)
      return parsed?.state?.isAuthenticated === true
    } catch {
      return false
    }
  })
}

/**
 * Expect user to be on login page
 */
export async function expectLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
}

/**
 * Expect user to be on forbidden page
 */
export async function expectForbiddenPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/forbidden/)
  await expect(page.getByText(/访问被拒绝|权限不足/)).toBeVisible()
}
