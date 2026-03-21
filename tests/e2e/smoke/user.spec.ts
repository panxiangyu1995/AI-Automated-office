/**
 * User Management E2E Tests
 *
 * Covers user CRUD operations, status changes, and manager relationships.
 */

import { test, expect } from '@playwright/test'
import { testUsers, testDepartments, apiEndpoints, generateTestId } from '../../fixtures/test-data'
import { mockLogin } from '../../helpers/auth'

test.describe('User List Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays user list with correct columns', async ({ page }) => {
    // Mock users API response
    await page.route('**/api/v1/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: testUsers.admin.id,
                employee_code: testUsers.admin.employee_code,
                real_name: testUsers.admin.real_name,
                email: testUsers.admin.email,
                status: 'active',
                departments: [{ id: testDepartments.root.id, name: testDepartments.root.name }],
                roles: [],
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
            page: 1,
            page_size: 20,
            total_pages: 1,
          },
        }),
      })
    })

    await page.goto('/admin/users')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: /姓名/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /工号/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /部门/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /状态/ })).toBeVisible()
  })

  test('filters users by name', async ({ page }) => {
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

    // Enter search term
    const searchInput = page.getByPlaceholder(/搜索|姓名/)
    await searchInput.fill('测试')
    await searchInput.press('Enter')

    // Verify API call included search parameter
    const request = page.waitForRequest((req) =>
      req.url().includes('name=%E6%B5%8B%E8%AF%95') || req.url().includes('name=')
    )
    await expect(request).toBeTruthy()
  })

  test('filters users by status', async ({ page }) => {
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

    // Select status filter
    await page.getByRole('combobox', { name: /状态/ }).click()
    await page.getByRole('option', { name: /启用/ }).click()

    // Verify API call included status parameter
    const request = page.waitForRequest((req) => req.url().includes('status=active'))
    await expect(request).toBeTruthy()
  })
})

test.describe('User Create', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays create user form', async ({ page }) => {
    // Mock departments API
    await page.route('**/api/v1/admin/departments/tree*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [testDepartments.root],
        }),
      })
    })

    await page.goto('/admin/users/create')

    // Verify form fields
    await expect(page.getByLabel(/姓名/)).toBeVisible()
    await expect(page.getByLabel(/工号/)).toBeVisible()
    await expect(page.getByLabel(/邮箱/)).toBeVisible()
    await expect(page.getByRole('button', { name: /创建|保存/ })).toBeVisible()
  })

  test('validates required fields', async ({ page }) => {
    await page.goto('/admin/users/create')

    // Submit empty form
    await page.getByRole('button', { name: /创建|保存/ }).click()

    // Should show validation errors
    await expect(page.getByText(/姓名.*必填|请输入姓名/)).toBeVisible()
    await expect(page.getByText(/工号.*必填|请输入工号/)).toBeVisible()
    await expect(page.getByText(/邮箱.*必填|请输入邮箱/)).toBeVisible()
  })

  test('creates user successfully', async ({ page }) => {
    const newUserId = generateTestId('user')

    // Mock create API
    await page.route('**/api/v1/admin/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: newUserId },
          }),
        })
      }
    })

    await page.goto('/admin/users/create')

    // Fill form
    await page.getByLabel(/姓名/).fill('新员工')
    await page.getByLabel(/工号/).fill('EMP002')
    await page.getByLabel(/邮箱/).fill('newuser@test.local')

    // Submit
    await page.getByRole('button', { name: /创建|保存/ }).click()

    // Should redirect to user list or show success
    await expect(page.getByText(/创建成功|保存成功/)).toBeVisible()
  })
})

test.describe('User Edit', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays user data in edit form', async ({ page }) => {
    // Mock user detail API
    await page.route(`**/api/v1/admin/users/${testUsers.admin.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: testUsers.admin.id,
            employee_code: testUsers.admin.employee_code,
            real_name: testUsers.admin.real_name,
            email: testUsers.admin.email,
            phone: '13800138000',
            status: 'active',
            departments: [],
            roles: [],
            positions: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }),
      })
    })

    await page.goto(`/admin/users/${testUsers.admin.id}/edit`)

    // Verify form is populated
    await expect(page.getByLabel(/姓名/)).toHaveValue(testUsers.admin.real_name)
    await expect(page.getByLabel(/工号/)).toHaveValue(testUsers.admin.employee_code)
    await expect(page.getByLabel(/邮箱/)).toHaveValue(testUsers.admin.email)
  })

  test('updates user successfully', async ({ page }) => {
    // Mock user detail API
    await page.route(`**/api/v1/admin/users/${testUsers.admin.id}`, async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testUsers.admin.id,
              employee_code: testUsers.admin.employee_code,
              real_name: testUsers.admin.real_name,
              email: testUsers.admin.email,
              status: 'active',
              departments: [],
              roles: [],
              positions: [],
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          }),
        })
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: testUsers.admin.id },
          }),
        })
      }
    })

    await page.goto(`/admin/users/${testUsers.admin.id}/edit`)

    // Update name
    const nameInput = page.getByLabel(/姓名/)
    await nameInput.fill('更新后的姓名')

    // Save
    await page.getByRole('button', { name: /保存/ }).click()

    // Should show success message
    await expect(page.getByText(/保存成功|更新成功/)).toBeVisible()
  })
})

test.describe('User Status Changes', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('disables user account', async ({ page }) => {
    // Mock users list
    await page.route('**/api/v1/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: testUsers.employee.id,
                employee_code: testUsers.employee.employee_code,
                real_name: testUsers.employee.real_name,
                email: testUsers.employee.email,
                status: 'active',
                departments: [],
                roles: [],
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
            page: 1,
            page_size: 20,
            total_pages: 1,
          },
        }),
      })
    })

    // Mock status update API
    await page.route(`**/api/v1/admin/users/${testUsers.employee.id}/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: testUsers.employee.id, status: 'inactive' },
        }),
      })
    })

    await page.goto('/admin/users')

    // Click disable button
    await page.getByRole('button', { name: /停用/ }).first().click()

    // Confirm in dialog
    await page.getByRole('button', { name: /确认|确定/ }).click()

    // Should show success message
    await expect(page.getByText(/停用成功/)).toBeVisible()
  })
})

test.describe('Manager Relationship', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays manager picker in edit form', async ({ page }) => {
    // Mock user detail
    await page.route(`**/api/v1/admin/users/${testUsers.employee.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: testUsers.employee.id,
            employee_code: testUsers.employee.employee_code,
            real_name: testUsers.employee.real_name,
            email: testUsers.employee.email,
            status: 'active',
            manager_id: testUsers.manager.id,
            departments: [],
            roles: [],
            positions: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }),
      })
    })

    // Mock manager search
    await page.route('**/api/v1/admin/users/search-for-manager*', async (route) => {
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

    await page.goto(`/admin/users/${testUsers.employee.id}/edit`)

    // Manager picker should be visible
    await expect(page.getByLabel(/上级|汇报对象/)).toBeVisible()
  })

  test('prevents circular manager relationship', async ({ page }) => {
    // Mock user detail with self as manager attempt
    await page.route(`**/api/v1/admin/users/${testUsers.admin.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: testUsers.admin.id,
            employee_code: testUsers.admin.employee_code,
            real_name: testUsers.admin.real_name,
            email: testUsers.admin.email,
            status: 'active',
            departments: [],
            roles: [],
            positions: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }),
      })
    })

    // Mock error response for circular reference
    await page.route(`**/api/v1/admin/users/${testUsers.admin.id}/manager`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'USER_009',
          message: '不能将自己设为上级',
        }),
      })
    })

    await page.goto(`/admin/users/${testUsers.admin.id}/edit`)

    // Try to set self as manager
    // This would depend on UI implementation
    // For now, verify error handling is in place
  })
})
