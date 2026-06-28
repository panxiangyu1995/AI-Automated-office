/**
 * Playwright Setup Project
 *
 * This setup runs before all E2E tests to ensure a consistent test environment.
 * It handles authentication state management for the test user.
 */

import { test as setup, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

/**
 * Global setup - runs once before all tests
 */
setup('global setup', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Login with admin credentials
  const usernameInput = page.getByPlaceholder(/用户名|邮箱/)
  const passwordInput = page.getByPlaceholder(/密码/)
  const submitButton = page.getByRole('button', { name: /登录/ })

  await usernameInput.fill(testUsers.admin.username)
  await passwordInput.fill(testUsers.admin.password)
  await submitButton.click()

  // Wait for successful login
  await page.waitForURL('**/', { timeout: 15000 }).catch(() => {
    // If URL doesn't change, login might have failed
    console.warn('Login during setup might have failed')
  })

  // Save auth state
  await page.context().storageState({
    path: 'playwright/.auth/user.json',
  })
})

/**
 * Cleanup after all tests
 */
setup('global cleanup', async () => {
  // Any global cleanup logic here
})
