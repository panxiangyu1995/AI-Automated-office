/**
 * Authentication test helper for E2E tests
 *
 * Provides utilities for login, logout, and session management.
 * These helpers use REAL API calls to simulate actual user behavior.
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
 * Real login helper - authenticates a user via REAL API
 * This simulates actual user login behavior
 */
export async function login(
  page: Page,
  username: string = testUsers.admin.username,
  password: string = testUsers.admin.password
): Promise<LoginResult> {
  await ensureOrigin(page)

  // Navigate to login page first
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Fill in login form
  const usernameInput = page.getByPlaceholder(/用户名|邮箱/)
  const passwordInput = page.getByPlaceholder(/密码/)
  const submitButton = page.getByRole('button', { name: /登录|登录/ })

  // Fill the form
  await usernameInput.fill(username)
  await passwordInput.fill(password)

  // Click submit
  await submitButton.click()

  // Wait for navigation after login
  try {
    await page.waitForURL('**/', { timeout: 10000 })
  } catch {
    // If URL doesn't change, check for error messages
    const errorText = await page.textContent('body')
    if (errorText?.includes('用户名或密码错误') || errorText?.includes('登录失败')) {
      console.error(`Login failed for user: ${username}`)
      return { success: false }
    }
  }

  // Verify login was successful by checking for auth state
  const authState = await page.evaluate(() => {
    const storage = localStorage.getItem('auth-storage')
    return storage ? JSON.parse(storage) : null
  })

  if (authState?.state?.isAuthenticated) {
    return {
      success: true,
      user: authState.state.user,
    }
  }

  return { success: false }
}

/**
 * Real login via API directly
 * This bypasses the UI and directly calls the API
 */
export async function loginViaApi(
  page: Page,
  username: string = testUsers.admin.username,
  password: string = testUsers.admin.password
): Promise<LoginResult> {
  await ensureOrigin(page)

  const response = await page.request.post(apiEndpoints.login, {
    data: { username, password },
  })

  if (!response.ok()) {
    console.error(`Login API failed: ${response.status()} ${response.statusText()}`)
    return { success: false }
  }

  const data = await response.json()

  if (data.success && data.data) {
    // Store tokens in localStorage (simulating what the frontend does after successful login)
    await page.evaluate(
      ({ accessToken, refreshToken, user }) => {
        // Set in auth-storage format (Zustand persist format)
        const authState = {
          state: {
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user,
            permissions: user.permissions || [],
            roles: user.roles || [],
          },
          version: 0,
        }
        localStorage.setItem('auth-storage', JSON.stringify(authState))
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      },
      {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        user: {
          ...data.data.user,
          permissions: data.data.permissions?.permissions || [],
          roles: data.data.permissions?.roles || [],
        },
      }
    )

    return {
      success: true,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: data.data.user,
    }
  }

  console.error(`Login failed: ${data.message || 'Unknown error'}`)
  return { success: false }
}

/**
 * Real logout - clears auth state and calls logout API
 */
export async function logout(page: Page): Promise<void> {
  await ensureOrigin(page)

  // Call real logout API if authenticated
  try {
    await page.request.post(apiEndpoints.logout, {
      failOnStatusCode: false,
    })
  } catch (e) {
    // Ignore errors (user might not be authenticated)
    console.warn('Logout API call failed:', e)
  }

  // Clear local storage
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('auth-storage')
    sessionStorage.clear()
  })
}

/**
 * Navigate to a protected page and verify auth
 * Uses REAL login
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
  await logout(page)
  await loginViaApi(page, user?.username || testUsers.admin.username, testUsers.admin.password)
  await page.goto(path)
  await waitForAuthReady(page)
}

/**
 * Clear all auth state
 */
export async function clearAuthState(page: Page): Promise<void> {
  await ensureOrigin(page)
  await page.evaluate(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('auth-storage')
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
 * Wait for page to be ready after authentication
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Wait for auth state to be restored
  await page.waitForFunction(() => {
    const auth = localStorage.getItem('auth-storage')
    return auth !== null
  })

  // Wait a bit more for React to render
  await page.waitForLoadState('networkidle')
}

/**
 * Expect user to be on login page
 */
export async function expectLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /欢迎|登录/ })).toBeVisible()
}

/**
 * Expect user to be on forbidden page
 */
export async function expectForbiddenPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/forbidden/)
  await expect(page.getByText(/访问被拒绝|权限不足/)).toBeVisible()
}

/**
 * Setup auth state for testing (ONLY for tests that don't require real auth)
 * Use this sparingly - prefer login() or loginViaApi() instead
 */
export async function setupAuthState(
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
  await page.evaluate((userData) => {
    const authState = {
      state: {
        isAuthenticated: true,
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
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
    localStorage.setItem('accessToken', 'test-access-token')
    localStorage.setItem('refreshToken', 'test-refresh-token')
  }, user)
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string,
  options?: { timeout?: number }
): Promise<void> {
  await page.waitForResponse(
    (response) => response.url().includes(urlPattern),
    { timeout: options?.timeout || 10000 }
  )
}
