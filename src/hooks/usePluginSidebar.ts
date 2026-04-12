/**
 * usePluginSidebar Hook
 * 
 * Syncs plugin sidebar registrations with the UI store.
 * Should be used in the AppLayout or Sidebar component.
 */

import { useEffect } from 'react'
import { registerBuiltinSidebarEntries, PluginSidebarRegistry } from '@/lib/pluginSidebarRegistry'
import { useUIStore } from '@/stores/uiStore'

export function usePluginSidebar() {
  const setDynamicSidebarEntries = useUIStore(state => state.setDynamicSidebarEntries)
  const setActivityBarBadge = useUIStore(state => state.setActivityBarBadge)

  useEffect(() => {
    // Register built-in sidebar entries
    registerBuiltinSidebarEntries()

    // Sync with store
    const update = () => {
      const entries = PluginSidebarRegistry.toSidebarEntries()
      setDynamicSidebarEntries(entries)

      // Sync badges
      const badges = PluginSidebarRegistry.getBadges()
      for (const badge of badges) {
        setActivityBarBadge(badge.targetId, badge.count, badge.color)
      }
    }

    // Initial sync
    update()

    // Subscribe to changes
    return PluginSidebarRegistry.subscribe(update)
  }, [setDynamicSidebarEntries, setActivityBarBadge])

  return {
    registry: PluginSidebarRegistry,
  }
}
