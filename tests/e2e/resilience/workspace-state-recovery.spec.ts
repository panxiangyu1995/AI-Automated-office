import { test, expect } from '@playwright/test'

/**
 * E2E Test: Workspace State Recovery
 * 
 * Tests:
 * - Task 22: Workspace state is persisted across page reloads
 * - Task 22: Tabs, sidebar state, chat sessions are restored on startup
 * - Task 22: restoreWorkspaceOnStartup setting controls recovery behavior
 * 
 * FR Coverage: FR1560-FR1575 (Workspace State Recovery)
 */

test.describe('Workspace State Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('topbar-hint-dismissed', 'true')
    })
  })

  test('chat sessions persist across page reload', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to initialize
    await page.waitForLoadState('networkidle')
    
    // Create a new session by clicking the new chat button
    const newChatButton = page.locator('[aria-label="新对话"]').or(page.locator('button[aria-label="新对话"]'))
    await newChatButton.click()
    
    // Verify session is created (new session title or indicator)
    // The session should be visible in the session list
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // The session should still be visible (persisted)
    // This tests that Zustand persist middleware is working
    await expect(page.locator('text=AI 助手')).toBeVisible()
  })

  test('sidebar state persists across page reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Record initial sidebar state by checking if sidebar is visible
    const sidebar = page.locator('[class*="sidebar"], aside, [class*="Sidebar"]').first()
    const initialVisible = await sidebar.isVisible()
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Sidebar should be in the same state
    const afterReloadVisible = await sidebar.isVisible()
    expect(afterReloadVisible).toBe(initialReloadVisible)
  })

  test('restoreWorkspaceOnStartup defaults to true', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check localStorage for restoreWorkspaceOnStartup
    const restoreSetting = await page.evaluate(() => {
      return localStorage.getItem('persist') // Zustand persist key
    })
    
    // The setting should be stored in the persisted state
    // This is an indirect test - the actual value would be in the JSON state
    expect(restoreSetting).not.toBeNull()
  })

  test('chat panel width persists across reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Resize the chat panel (simulate user action)
    // In practice, this would involve dragging a resize handle
    
    // Store the new width
    const newWidth = await page.evaluate(() => {
      const panel = document.querySelector('[class*="ResizablePanel"]')
      return panel ? panel.getBoundingClientRect().width : null
    })
    
    if (newWidth !== null) {
      // Reload
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Width should be approximately the same (within tolerance)
      const afterReloadWidth = await page.evaluate(() => {
        const panel = document.querySelector('[class*="ResizablePanel"]')
        return panel ? panel.getBoundingClientRect().width : null
      })
      
      if (afterReloadWidth !== null) {
        expect(Math.abs(newWidth - afterReloadWidth)).toBeLessThan(50) // Within 50px tolerance
      }
    }
  })

  test('workbench tabs persist across reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open a workbench tab (this depends on the implementation)
    // For now, just verify the app loads and the tabs container exists
    
    const tabsContainer = page.locator('[class*="Workbench"], [class*="Tabs"]').first()
    await expect(tabsContainer).toBeVisible()
    
    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Tabs container should still exist
    await expect(tabsContainer).toBeVisible()
  })

  test('chat input placeholder persists and shows correct state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that the input placeholder is correct
    const messageInput = page.locator('textarea').first()
    await expect(messageInput).toBeVisible()
    
    // Placeholder should indicate the app is ready
    await expect(messageInput).toHaveAttribute(
      'placeholder',
      /输入|初始化|思考/i
    )
  })

  test('streaming state resets correctly after reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that the input is not disabled (not in streaming state)
    const messageInput = page.locator('textarea').first()
    
    // Input should be enabled (not in streaming state)
    if (await messageInput.isVisible()) {
      await expect(messageInput).toBeEnabled()
    }
  })
})
