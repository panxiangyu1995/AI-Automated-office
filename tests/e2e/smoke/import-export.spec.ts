/**
 * Import/Export E2E Tests
 *
 * Covers user import preview, conflict handling, import execution, and export functionality.
 */

import { test, expect } from '@playwright/test'
import { mockLogin } from '../../helpers/auth'

test.describe('Import/Export Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays import tabs', async ({ page }) => {
    await page.goto('/admin/import-export')

    // Should show import and export tabs
    await expect(page.getByRole('tab', { name: /导入|Import/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /导出|Export/i })).toBeVisible()
  })

  test('shows upload area on import tab', async ({ page }) => {
    await page.goto('/admin/import-export')

    // Should show file upload area
    await expect(page.getByText(/拖拽|点击上传|选择文件/)).toBeVisible()
    await expect(page.getByRole('button', { name: /下载模板|模板/ })).toBeVisible()
  })
})

test.describe('User Import', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('downloads import template', async ({ page }) => {
    // Mock template download
    await page.route('**/api/v1/admin/users/import/template*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename=user_import_template.xlsx',
        },
        body: '',
      })
    })

    await page.goto('/admin/import-export')

    // Click download template button
    await page.getByRole('button', { name: /下载模板|模板/ }).click()

    // Verify download was initiated
    await page.waitForRequest((req) => req.url().includes('/import/template'))
  })

  test('uploads file and shows preview', async ({ page }) => {
    // Mock preview API
    await page.route('**/api/v1/admin/users/import/preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            batch_id: 'batch-001',
            total_rows: 3,
            valid_rows: 2,
            conflict_rows: 1,
            error_rows: 0,
            preview: [
              {
                row_number: 1,
                data: { name: '员工A', employee_code: 'EMP001', email: 'a@test.local' },
                status: 'valid',
              },
              {
                row_number: 2,
                data: { name: '员工B', employee_code: 'EMP002', email: 'b@test.local' },
                status: 'valid',
              },
              {
                row_number: 3,
                data: { name: '管理员', employee_code: 'ADMIN001', email: 'admin@test.local' },
                status: 'conflict',
                conflict_type: 'duplicate_employee_code',
                conflict_message: '工号已存在',
              },
            ],
          },
        }),
      })
    })

    await page.goto('/admin/import-export')

    // Upload file (simulated)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test_import.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(''),
    })

    // Preview should be visible
    await expect(page.getByText(/预览|Preview/i)).toBeVisible()
    await expect(page.getByText('员工A')).toBeVisible()
    await expect(page.getByText(/冲突|Conflict/i)).toBeVisible()
  })

  test('shows conflict resolution options', async ({ page }) => {
    // Mock preview with conflicts
    await page.route('**/api/v1/admin/users/import/preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            batch_id: 'batch-001',
            total_rows: 2,
            valid_rows: 0,
            conflict_rows: 2,
            error_rows: 0,
            preview: [
              {
                row_number: 1,
                data: { name: '冲突用户A' },
                status: 'conflict',
                conflict_type: 'duplicate_employee_code',
              },
              {
                row_number: 2,
                data: { name: '冲突用户B' },
                status: 'conflict',
                conflict_type: 'duplicate_email',
              },
            ],
          },
        }),
      })
    })

    await page.goto('/admin/import-export')

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test_import.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(''),
    })

    // Should show conflict resolution options
    await expect(page.getByText(/跳过|覆盖|新增/i)).toBeVisible()
  })

  test('executes import and shows result', async ({ page }) => {
    // Mock preview
    await page.route('**/api/v1/admin/users/import/preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            batch_id: 'batch-001',
            total_rows: 2,
            valid_rows: 2,
            conflict_rows: 0,
            error_rows: 0,
            preview: [
              { row_number: 1, data: { name: '新员工A' }, status: 'valid' },
              { row_number: 2, data: { name: '新员工B' }, status: 'valid' },
            ],
          },
        }),
      })
    })

    // Mock confirm import
    await page.route('**/api/v1/admin/users/import/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            batch_id: 'batch-001',
            status: 'completed',
            success_rows: 2,
            skipped_rows: 0,
            failed_rows: 0,
            receipt_url: '/api/v1/admin/users/import/batch-001/receipt',
          },
        }),
      })
    })

    await page.goto('/admin/import-export')

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test_import.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(''),
    })

    // Click confirm import
    await page.getByRole('button', { name: /确认导入|开始导入/ }).click()

    // Should show import result
    await expect(page.getByText(/导入成功|完成/i)).toBeVisible()
    await expect(page.getByText('2')).toBeVisible() // Success count
  })
})

test.describe('User Export', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('displays export options', async ({ page }) => {
    // Mock exportable fields API
    await page.route('**/api/v1/admin/users/export/fields*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            fields: [
              { name: 'real_name', label: '姓名' },
              { name: 'employee_code', label: '工号' },
              { name: 'email', label: '邮箱' },
              { name: 'status', label: '状态' },
            ],
          },
        }),
      })
    })

    await page.goto('/admin/import-export')

    // Switch to export tab
    await page.getByRole('tab', { name: /导出|Export/i }).click()

    // Should show export options
    await expect(page.getByText(/导出范围|Scope/i)).toBeVisible()
    await expect(page.getByText(/字段选择|Fields/i)).toBeVisible()
  })

  test('exports users as Excel', async ({ page }) => {
    // Mock exportable fields
    await page.route('**/api/v1/admin/users/export/fields*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { fields: [] },
        }),
      })
    })

    // Mock export API
    await page.route('**/api/v1/admin/users/export*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename=users_export.xlsx',
        },
        body: '',
      })
    })

    await page.goto('/admin/import-export')

    // Switch to export tab
    await page.getByRole('tab', { name: /导出|Export/i }).click()

    // Click export button
    await page.getByRole('button', { name: /导出|Export/i }).click()

    // Verify export API was called
    await page.waitForRequest((req) => req.url().includes('/users/export'))
  })

  test('filters export by department', async ({ page }) => {
    // Mock department tree
    await page.route('**/api/v1/admin/departments/tree*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      })
    })

    // Mock exportable fields
    await page.route('**/api/v1/admin/users/export/fields*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { fields: [] },
        }),
      })
    })

    // Mock export API
    await page.route('**/api/v1/admin/users/export*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename=users_export.xlsx',
        },
        body: '',
      })
    })

    await page.goto('/admin/import-export')

    // Switch to export tab
    await page.getByRole('tab', { name: /导出|Export/i }).click()

    // Select department scope
    await page.getByRole('radio', { name: /按部门|By Department/i }).click()

    // Should show department selector
    await expect(page.getByText(/选择部门|Select Department/i)).toBeVisible()
  })
})

test.describe('Import Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('shows error for invalid file format', async ({ page }) => {
    // Mock error response
    await page.route('**/api/v1/admin/users/import/preview', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'IMP_003',
          message: '文件格式无效，请上传 Excel 文件',
        }),
      })
    })

    await page.goto('/admin/import-export')

    // Upload invalid file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid content'),
    })

    // Should show error message
    await expect(page.getByText(/文件格式无效|格式错误/i)).toBeVisible()
  })

  test('shows error for file too large', async ({ page }) => {
    // Mock error response
    await page.route('**/api/v1/admin/users/import/preview', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'IMP_004',
          message: '文件大小超过限制（最大 10MB）',
        }),
      })
    })

    await page.goto('/admin/import-export')

    // Should show file size limit info
    await expect(page.getByText(/最大|MB/i)).toBeVisible()
  })
})
