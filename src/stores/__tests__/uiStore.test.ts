import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    // Reset to default state
    useUIStore.getState().resetLayout()
  })

  describe('initial state', () => {
    it('should have default sidebar width', () => {
      expect(useUIStore.getState().sidebarWidth).toBe(240)
    })

    it('should have sidebar not collapsed by default', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    })

    it('should have chat panel not collapsed by default', () => {
      expect(useUIStore.getState().chatPanelCollapsed).toBe(false)
    })

    it('should have dashboard as active activity item', () => {
      expect(useUIStore.getState().activeActivityItem).toBe('dashboard')
    })

    it('should have bottom panel collapsed by default', () => {
      expect(useUIStore.getState().bottomPanelCollapsed).toBe(true)
    })

    it('should have top bar visible by default', () => {
      expect(useUIStore.getState().topBarVisible).toBe(true)
    })

    it('should have AI panel visible by default', () => {
      expect(useUIStore.getState().aiPanelVisible).toBe(true)
    })
  })

  describe('sidebar actions', () => {
    it('should toggle sidebar collapsed state', () => {
      const store = useUIStore.getState()
      expect(store.sidebarCollapsed).toBe(false)
      store.toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(true)
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    })

    it('should set sidebar width', () => {
      useUIStore.getState().setSidebarWidth(300)
      expect(useUIStore.getState().sidebarWidth).toBe(300)
    })
  })

  describe('chat panel actions', () => {
    it('should open chat panel', () => {
      useUIStore.getState().closeChatPanel()
      expect(useUIStore.getState().chatPanelCollapsed).toBe(true)
      useUIStore.getState().openChatPanel()
      expect(useUIStore.getState().chatPanelCollapsed).toBe(false)
    })

    it('should close chat panel and reset secondary surface', () => {
      useUIStore.getState().openAgentSecondarySurface('sessions')
      useUIStore.getState().closeChatPanel()
      expect(useUIStore.getState().chatPanelCollapsed).toBe(true)
      expect(useUIStore.getState().agentSecondarySurface).toBe('none')
    })

    it('should set chat panel width', () => {
      useUIStore.getState().setChatPanelWidth(500)
      expect(useUIStore.getState().chatPanelWidth).toBe(500)
    })
  })

  describe('activity item', () => {
    it('should set active activity item', () => {
      useUIStore.getState().setActiveActivityItem('hr')
      expect(useUIStore.getState().activeActivityItem).toBe('hr')
    })

    it('should switch between activity items', () => {
      useUIStore.getState().setActiveActivityItem('finance')
      expect(useUIStore.getState().activeActivityItem).toBe('finance')
      useUIStore.getState().setActiveActivityItem('settings')
      expect(useUIStore.getState().activeActivityItem).toBe('settings')
    })
  })

  describe('quick search', () => {
    it('should open and close quick search', () => {
      useUIStore.getState().openQuickSearch()
      expect(useUIStore.getState().quickSearchOpen).toBe(true)
      useUIStore.getState().closeQuickSearch()
      expect(useUIStore.getState().quickSearchOpen).toBe(false)
    })

    it('should toggle quick search', () => {
      expect(useUIStore.getState().quickSearchOpen).toBe(false)
      useUIStore.getState().toggleQuickSearch()
      expect(useUIStore.getState().quickSearchOpen).toBe(true)
    })
  })

  describe('sidebar entries', () => {
    it('should set dynamic sidebar entries', () => {
      const entries = [{ id: 'test', label: 'Test', kind: 'dynamic' as const, target: { path: '/test', mode: 'dynamic' as const } }]
      useUIStore.getState().setDynamicSidebarEntries(entries)
      expect(useUIStore.getState().dynamicSidebarEntries).toEqual(entries)
    })

    it('should register recent sidebar entry', () => {
      const entry = { id: 'recent1', label: 'Recent Item', kind: 'recent' as const, target: { path: '/recent', mode: 'static' as const } }
      useUIStore.getState().clearRecentSidebarEntries()
      useUIStore.getState().registerRecentSidebarEntry(entry)
      expect(useUIStore.getState().recentSidebarEntries).toHaveLength(1)
      expect(useUIStore.getState().recentSidebarEntries[0].id).toBe('recent1')
    })

    it('should limit recent entries to 6', () => {
      useUIStore.getState().clearRecentSidebarEntries()
      for (let i = 0; i < 8; i++) {
        useUIStore.getState().registerRecentSidebarEntry({
          id: `item-${i}`,
          label: `Item ${i}`,
          kind: 'recent' as const,
          target: { path: `/item-${i}`, mode: 'static' as const },
        })
      }
      expect(useUIStore.getState().recentSidebarEntries).toHaveLength(6)
    })

    it('should clear recent sidebar entries', () => {
      useUIStore.getState().registerRecentSidebarEntry({
        id: 'r1', label: 'R1', kind: 'recent' as const, target: { path: '/r1', mode: 'static' as const },
      })
      useUIStore.getState().clearRecentSidebarEntries()
      expect(useUIStore.getState().recentSidebarEntries).toHaveLength(0)
    })
  })

  describe('activity bar badges', () => {
    it('should set activity bar badge', () => {
      useUIStore.getState().setActivityBarBadge('approval', 5)
      expect(useUIStore.getState().activityBarBadges.approval.count).toBe(5)
    })

    it('should set badge with color', () => {
      useUIStore.getState().setActivityBarBadge('approval', 3, 'var(--ao-warningForeground)')
      const badge = useUIStore.getState().activityBarBadges.approval
      expect(badge.count).toBe(3)
      expect(badge.color).toBe('var(--ao-warningForeground)')
    })
  })

  describe('reset layout', () => {
    it('should reset to default values', () => {
      useUIStore.getState().setSidebarWidth(300)
      useUIStore.getState().toggleSidebar()
      useUIStore.getState().resetLayout()
      expect(useUIStore.getState().sidebarWidth).toBe(240)
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    })
  })
})
