/**
 * Permission and Role Management E2E Tests
 *
 * Covers role CRUD, permission assignment, and fine-grained permissions.
 */

import { test, expect } from '@playwright/test'
import { testRoles, testUsers } from '../../fixtures/test-data'
import { mockLogin } from '../../helpers/auth'

test.describe('Permission Center', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays role list', async ({ page }) => {
    // Mock roles API
    await page.route('**/api/v1/admin/roles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: testRoles.admin.id,
                name: testRoles.admin.name,
                code: testRoles.admin.code,
                layer: testRoles.admin.layer,
                is_builtin: true,
              },
              {
                id: testRoles.employee.id,
                name: testRoles.employee.name,
                code: testRoles.employee.code,
                layer: testRoles.employee.layer,
                is_builtin: true,
              },
            ],
            total: 2,
          },
        }),
      })
    })

    await page.goto('/admin/permissions')

    // Should show role list
    await expect(page.getByText(testRoles.admin.name)).toBeVisible()
    await expect(page.getByText(testRoles.employee.name)).toBeVisible()
  })

  test('shows permission matrix for selected role', async ({ page }) => {
    // Mock roles API
    await page.route('**/api/v1/admin/roles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [testRoles.admin],
            total: 1,
          },
        }),
      })
    })

    // Mock role permissions API
    await page.route(`**/api/v1/admin/roles/${testRoles.admin.id}/permissions`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            permissions: [
              { resource: 'user', action: 'read' },
              { resource: 'user', action: 'write' },
              { resource: 'role', action: 'read' },
            ],
          },
        }),
      })
    })

    await page.goto('/admin/permissions')

    // Select a role
    await page.getByText(testRoles.admin.name).click()

    // Permission matrix should be visible
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('updates role permissions', async ({ page }) => {
    // Mock roles API
    await page.route('**/api/v1/admin/roles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [testRoles.deptManager], total: 1 },
        }),
      })
    })

    // Mock update permissions API
    await page.route(
      `**/api/v1/admin/roles/${testRoles.deptManager.id}/permissions`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    )

    await page.goto('/admin/permissions')

    // Select role and toggle permission
    await page.getByText(testRoles.deptManager.name).click()

    // Find a permission checkbox and toggle it
    const permissionCheckbox = page.getByRole('checkbox').first()
    await permissionCheckbox.click()

    // Save changes
    await page.getByRole('button', { name: /保存/ }).click()

    // Should show success message
    await expect(page.getByText(/保存成功|更新成功/)).toBeVisible()
  })
})

test.describe('Fine-grained Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays user permission overrides', async ({ page }) => {
    // Mock user search API
    await page.route('**/api/v1/admin/users/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: testUsers.employee.id,
                real_name: testUsers.employee.real_name,
                employee_code: testUsers.employee.employee_code,
              },
            ],
          },
        }),
      })
    })

    // Mock user permission overrides API
    await page.route(
      `**/api/v1/admin/users/${testUsers.employee.id}/permission-overrides`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              overrides: [
                {
                  id: 'override-1',
                  resource: 'user',
                  action: 'read',
                  type: 'grant',
                },
              ],
            },
          }),
        })
      }
    )

    await page.goto('/admin/permissions/fine-grained')

    // Search for user
    const searchInput = page.getByPlaceholder(/搜索|输入/)
    await searchInput.fill(testUsers.employee.real_name)
    await page.getByText(testUsers.employee.real_name).click()

    // Permission overrides should be visible
    await expect(page.getByText(/权限覆盖|Permission Override/i)).toBeVisible()
  })

  test('displays data scope configuration', async ({ page }) => {
    // Mock user search and data scope APIs
    await page.route('**/api/v1/admin/users/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: testUsers.manager.id,
                real_name: testUsers.manager.real_name,
                employee_code: testUsers.manager.employee_code,
              },
            ],
          },
        }),
      })
    })

    await page.route(
      `**/api/v1/admin/users/${testUsers.manager.id}/data-scope`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              scope_type: 'department_tree',
              department_ids: ['dept-1', 'dept-2'],
            },
          }),
        })
      }
    )

    await page.goto('/admin/permissions/fine-grained')

    // Select user
    const searchInput = page.getByPlaceholder(/搜索|输入/)
    await searchInput.fill(testUsers.manager.real_name)
    await page.getByText(testUsers.manager.real_name).click()

    // Navigate to data scope tab
    await page.getByRole('tab', { name: /数据范围|Data Scope/i }).click()

    // Data scope options should be visible
    await expect(page.getByText(/全部数据|本部门|仅本人/)).toBeVisible()
  })
})

test.describe('Permission Denial', () => {
  test.beforeEach(async ({ page }) => {
    // Login with limited permissions
    await mockLogin(page, {
      ...testUsers.employee,
      permissions: ['auth_profile_read'], // Only basic permission
    })
  })

  test('shows forbidden modal when accessing restricted resource', async ({ page }) => {
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

    // Should show forbidden modal or redirect
    await expect(page.getByText(/权限|访问被拒绝|Permission Denied/i)).toBeVisible()
  })

  test('hides UI elements based on permissions', async ({ page }) => {
    // Mock users list API
    await page.route('**/api/v1/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 },
        }),
      })
    })

    await page.goto('/admin/users')

    // Create button should be hidden or disabled
    const createButton = page.getByRole('button', { name: /创建|新建|添加/ })
    await expect(createButton).not.toBeVisible()
  })
})
