/**
 * usePluginSidebar Hook
 * 
 * Syncs plugin sidebar registrations with the UI store.
 * Uses EventBus and PluginLifecycle for reactive updates and lifecycle management.
 * Should be used in the AppLayout or Sidebar component.
 */

import { useEffect } from 'react'
import { registerBuiltinSidebarEntries, PluginSidebarRegistry } from '@/lib/pluginSidebarRegistry'
import { useUIStore } from '@/stores/uiStore'
import { eventBus } from './eventBus'
import { pluginLifecycleManager } from './pluginLifecycle'

/**
 * Plugin sidebar lifecycle hooks
 */
const pluginSidebarHooks = {
  onInit: async () => {
    // Register built-in sidebar entries on initialization
    registerBuiltinSidebarEntries()
  },

  onMount: async () => {
  },

  onUnmount: async () => {
    // Clean up subscriptions when unmounting
    PluginSidebarRegistry.unregister('builtin')
  },
  
  onEvent: (event: string, payload: unknown) => {
    // Forward relevant events
    if (event.startsWith('plugin:')) {
      eventBus.publish(event, payload)
    }
  },
}

export function usePluginSidebar() {
  const setDynamicSidebarEntries = useUIStore(state => state.setDynamicSidebarEntries)
  const setActivityBarBadge = useUIStore(state => state.setActivityBarBadge)

  // Register to lifecycle manager
  useEffect(() => {
    pluginLifecycleManager.register('plugin-sidebar', pluginSidebarHooks, {
      name: 'Plugin Sidebar',
      version: '1.0.0',
    })
  }, [])

  // Setup reactive updates using EventBus
  useEffect(() => {
    // Sync function to update UI store
    const syncToStore = () => {
      const entries = PluginSidebarRegistry.toSidebarEntries()
      setDynamicSidebarEntries(entries)

      // Sync badges
      const badges = PluginSidebarRegistry.getBadges()
      for (const badge of badges) {
        setActivityBarBadge(badge.targetId, badge.count, badge.color)
      }
    }

    // Subscribe to PluginSidebarRegistry changes
    const unsubscribeRegistry = PluginSidebarRegistry.subscribe(syncToStore)

    // Subscribe to plugin lifecycle events from EventBus
    const unsubscribeEventBus = eventBus.subscribe('plugin:registered', syncToStore)
    const unsubscribeUnregister = eventBus.subscribe('plugin:unregistered', syncToStore)

    // Initial sync
    syncToStore()

    // Cleanup function
    return () => {
      unsubscribeRegistry()
      unsubscribeEventBus()
      unsubscribeUnregister()
      
      // Cleanup via lifecycle manager
      pluginLifecycleManager.unregister('plugin-sidebar').catch((err) => {
        console.error('[usePluginSidebar] Failed to unregister:', err)
      })
    }
  }, [setDynamicSidebarEntries, setActivityBarBadge])

  return {
    registry: PluginSidebarRegistry,
  }
}
