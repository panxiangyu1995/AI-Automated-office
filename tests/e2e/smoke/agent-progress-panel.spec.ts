import { test, expect } from '@playwright/test'

/**
 * E2E Test: Agent Type Selector & Progress Panel
 * 
 * Tests:
 * - Task 21: Agent Type Selector is visible and selectable
 * - Task 21: Progress panel toggles on/off
 * - Task 21: Activity panel toggles on/off
 * 
 * FR Coverage: FR410-FR439 (Agent Core)
 */

test.describe('Agent Type Selector & Progress Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('topbar-hint-dismissed', 'true')
    })
    await page.goto('/')
  })

  test('agent type selector panel is visible and expandable', async ({ page }) => {
    // Find the agent type selector panel toggle
    const agentTypeToggle = page.getByText('Agent 类型')
    
    // Initially collapsed
    await expect(agentTypeToggle).toBeVisible()
    
    // Click to expand
    await agentTypeToggle.click()
    
    // Should show 4 agent type options
    await expect(page.getByText('通用助手')).toBeVisible()
    await expect(page.getByText('代码探索')).toBeVisible()
    await expect(page.getByText('任务规划')).toBeVisible()
    await expect(page.getByText('代码验证')).toBeVisible()
  })

  test('agent type selection highlights selected type', async ({ page }) => {
    // Expand agent type selector
    await page.getByText('Agent 类型').click()
    
    // Select "代码探索" (Explore)
    await page.getByText('代码探索').click()
    
    // The selected type should have a visual indicator (shield icon in the corner)
    const selectedCard = page.locator('button.rounded-lg.border-2').filter({ hasText: '代码探索' })
    await expect(selectedCard).toHaveClass(/border-\[var\(--ao-button-background/)
  })

  test('progress panel toggles on and off', async ({ page }) => {
    // Find the progress panel toggle button
    const progressButton = page.getByRole('button', { name: /进度/i })
    
    // Initially hidden (no progress panel content visible)
    await expect(page.locator('text=执行进度')).toHaveCount(0)
    
    // Click to show progress panel
    await progressButton.click()
    
    // Progress panel should now be visible
    await expect(page.locator('text=执行进度')).toBeVisible()
    
    // Click again to hide
    await progressButton.click()
    
    // Should be hidden again
    await expect(page.locator('text=执行进度')).toHaveCount(0)
  })

  test('activity panel toggles on and off', async ({ page }) => {
    // Find the activity panel toggle button
    const activityButton = page.getByRole('button', { name: /活动/i })
    
    // Initially hidden
    await expect(page.locator('text=暂无活动记录')).toHaveCount(0)
    
    // Click to show activity panel
    await activityButton.click()
    
    // Activity panel should now be visible (with empty state message)
    await expect(page.locator('text=暂无活动记录')).toBeVisible()
    
    // Click again to hide
    await activityButton.click()
    
    // Should be hidden again
    await expect(page.locator('text=暂无活动记录')).toHaveCount(0)
  })

  test('both panels can be open simultaneously', async ({ page }) => {
    // Open both panels
    await page.getByRole('button', { name: /进度/i }).click()
    await page.getByRole('button', { name: /活动/i }).click()
    
    // Both should be visible
    await expect(page.locator('text=执行进度')).toBeVisible()
    await expect(page.locator('text=暂无活动记录')).toBeVisible()
    
    // Running indicator should show when agent is executing
    await expect(page.getByText(/运行中/i)).toBeVisible()
  })

  test('progress panel shows token usage stats', async ({ page }) => {
    // Open progress panel
    await page.getByRole('button', { name: /进度/i }).click()
    
    // Should show token information
    await expect(page.locator('text=Token:')).toBeVisible()
  })

  test('activity list shows empty state with icon', async ({ page }) => {
    // Open activity panel
    await page.getByRole('button', { name: /活动/i }).click()
    
    // Should show empty state with scroll text icon
    const emptyState = page.locator('text=暂无活动记录')
    await expect(emptyState).toBeVisible()
  })
})
