/**
 * Audit Log E2E Tests
 *
 * Covers audit log querying, filtering, and export functionality.
 */

import { test, expect } from '@playwright/test'
import { testUsers } from '../../fixtures/test-data'
import { mockLogin } from '../../helpers/auth'

test.describe('Audit Log Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays audit log table', async ({ page }) => {
    // Mock audit logs API
    await page.route('**/api/v1/audit/logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'audit-001',
                event_type: 'auth.login',
                resource: 'session',
                action: 'create',
                result: 'success',
                operator_name: testUsers.admin.real_name,
                created_at: new Date().toISOString(),
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

    await page.goto('/admin/audit')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: /事件类型|Event Type/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /资源|Resource/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /操作|Action/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /结果|Result/i })).toBeVisible()

    // Should show audit log entries
    await expect(page.getByText('auth.login')).toBeVisible()
  })

  test('filters by event type', async ({ page }) => {
    await page.route('**/api/v1/audit/logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 },
        }),
      })
    })

    await page.goto('/admin/audit')

    // Select event type filter
    await page.getByRole('combobox', { name: /事件类型|Event Type/i }).click()
    await page.getByRole('option', { name: /认证|Auth/i }).click()

    // Verify API call included filter
    await page.waitForRequest((req) => req.url().includes('event_type=auth'))
  })

  test('filters by date range', async ({ page }) => {
    await page.route('**/api/v1/audit/logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 },
        }),
      })
    })

    await page.goto('/admin/audit')

    // Set date range
    const dateInputs = page.getByRole('textbox')
    await dateInputs.first().fill('2024-01-01')
    await dateInputs.nth(1).fill('2024-12-31')

    // Verify API call included date filters
    await page.waitForRequest((req) => req.url().includes('start_time') || req.url().includes('end_time'))
  })

  test('shows audit log detail', async ({ page }) => {
    const auditLogId = 'audit-001'

    // Mock audit logs list
    await page.route('**/api/v1/audit/logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: auditLogId,
                event_type: 'user.update',
                resource: 'user',
                action: 'update',
                result: 'success',
                operator_name: testUsers.admin.real_name,
                target_id: testUsers.employee.id,
                created_at: new Date().toISOString(),
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

    // Mock audit log detail
    await page.route(`**/api/v1/audit/logs/${auditLogId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: auditLogId,
            event_type: 'user.update',
            resource: 'user',
            action: 'update',
            result: 'success',
            operator_name: testUsers.admin.real_name,
            target_id: testUsers.employee.id,
            old_values: { status: 'inactive' },
            new_values: { status: 'active' },
            ip_address: '127.0.0.1',
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    await page.goto('/admin/audit')

    // Click on audit log row
    await page.getByText('user.update').click()

    // Detail dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/变更前|Old Values/i)).toBeVisible()
    await expect(page.getByText(/变更后|New Values/i)).toBeVisible()
  })
})

test.describe('Audit Export', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('exports audit logs as CSV', async ({ page }) => {
    // Mock audit logs list
    await page.route('**/api/v1/audit/logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 },
        }),
      })
    })

    // Mock export API
    await page.route('**/api/v1/audit/export*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: {
          'Content-Disposition': 'attachment; filename=audit_logs.csv',
        },
        body: 'id,event_type,resource,action,result,operator_name,created_at\naudit-001,auth.login,session,create,success,Admin,2024-01-01T00:00:00Z',
      })
    })

    await page.goto('/admin/audit')

    // Click export button
    await page.getByRole('button', { name: /导出|Export/i }).click()

    // Select CSV format
    await page.getByRole('menuitem', { name: /CSV/i }).click()

    // Download should be triggered (verify by checking for download link or success message)
    // This is tricky to test directly, so we verify the API was called
    await page.waitForRequest((req) => req.url().includes('/audit/export') && req.url().includes('format=csv'))
  })

  test('exports audit logs as Excel', async ({ page }) => {
    // Mock audit logs list
    await page.route('**/api/v1/audit/logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 },
        }),
      })
    })

    // Mock export API
    await page.route('**/api/v1/audit/export*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename=audit_logs.xlsx',
        },
        body: '', // Binary content would be here
      })
    })

    await page.goto('/admin/audit')

    // Click export button
    await page.getByRole('button', { name: /导出|Export/i }).click()

    // Select Excel format
    await page.getByRole('menuitem', { name: /Excel/i }).click()

    // Verify API was called
    await page.waitForRequest((req) => req.url().includes('/audit/export') && req.url().includes('format=excel'))
  })
})
