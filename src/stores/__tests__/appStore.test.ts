import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../appStore'

describe('appStore', () => {
  beforeEach(() => {
    // Reset to defaults
    const store = useAppStore.getState()
    store.setInitialized(false)
    store.setTheme('system')
    store.setSubAgentUIEnabled(false)
  })

  describe('initial state', () => {
    it('should not be initialized by default', () => {
      expect(useAppStore.getState().initialized).toBe(false)
    })

    it('should have system theme by default', () => {
      expect(useAppStore.getState().theme).toBe('system')
    })

    it('should have sidebar not collapsed by default', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })

    it('should have sub-agent UI disabled by default', () => {
      expect(useAppStore.getState().subAgentUIEnabled).toBe(false)
    })
  })

  describe('initialization', () => {
    it('should set initialized to true', () => {
      useAppStore.getState().setInitialized(true)
      expect(useAppStore.getState().initialized).toBe(true)
    })

    it('should set initialized to false', () => {
      useAppStore.getState().setInitialized(true)
      useAppStore.getState().setInitialized(false)
      expect(useAppStore.getState().initialized).toBe(false)
    })
  })

  describe('theme', () => {
    it('should set light theme', () => {
      useAppStore.getState().setTheme('light')
      expect(useAppStore.getState().theme).toBe('light')
    })

    it('should set dark theme', () => {
      useAppStore.getState().setTheme('dark')
      expect(useAppStore.getState().theme).toBe('dark')
    })

    it('should set system theme', () => {
      useAppStore.getState().setTheme('dark')
      useAppStore.getState().setTheme('system')
      expect(useAppStore.getState().theme).toBe('system')
    })
  })

  describe('sidebar', () => {
    it('should toggle sidebar collapsed', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(true)
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('sub-agent UI', () => {
    it('should enable sub-agent UI', () => {
      useAppStore.getState().setSubAgentUIEnabled(true)
      expect(useAppStore.getState().subAgentUIEnabled).toBe(true)
    })

    it('should disable sub-agent UI', () => {
      useAppStore.getState().setSubAgentUIEnabled(true)
      useAppStore.getState().setSubAgentUIEnabled(false)
      expect(useAppStore.getState().subAgentUIEnabled).toBe(false)
    })
  })
})
