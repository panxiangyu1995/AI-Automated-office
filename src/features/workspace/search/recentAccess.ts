/**
 * Recent Access Tracking
 * 
 * Tracks recently accessed resources across the application.
 * Stores access history in localStorage for persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SearchResult, MAX_RECENT_ITEMS } from './types'

/**
 * Recent access record
 */
export interface RecentAccessRecord {
  id: string
  type: SearchResult['type']
  title: string
  workspaceId?: string
  accessedAt: Date
}

/**
 * Recent access state
 */
interface RecentAccessState {
  /** Recent items per workspace */
  byWorkspace: Record<string, RecentAccessRecord[]>
  /** Global recent items (cross-workspace) */
  global: RecentAccessRecord[]
  
  // Actions
  trackAccess: (result: SearchResult) => void
  getRecentForWorkspace: (workspaceId?: string, limit?: number) => RecentAccessRecord[]
  getGlobalRecent: (limit?: number) => RecentAccessRecord[]
  clearWorkspaceHistory: (workspaceId: string) => void
  clearGlobalHistory: () => void
  clearAll: () => void
}

/**
 * Zustand store for recent access tracking
 */
export const useRecentAccessStore = create<RecentAccessState>()(
  persist(
    (set, get) => ({
      byWorkspace: {},
      global: [],
      
      trackAccess: (result: SearchResult) => {
        const record: RecentAccessRecord = {
          id: result.id,
          type: result.type,
          title: result.title,
          workspaceId: result.workspaceId,
          accessedAt: new Date(),
        }
        
        set(state => {
          const newByWorkspace = { ...state.byWorkspace }
          const newGlobal = [...state.global]
          
          // Update workspace-specific history
          if (result.workspaceId) {
            const workspaceHistory = newByWorkspace[result.workspaceId] ?? []
            
            // Remove existing entry for this item
            const filteredWorkspace = workspaceHistory.filter(r => r.id !== result.id)
            
            // Add to front
            newByWorkspace[result.workspaceId] = [
              record,
              ...filteredWorkspace,
            ].slice(0, MAX_RECENT_ITEMS)
          }
          
          // Update global history
          const filteredGlobal = newGlobal.filter(r => r.id !== result.id)
          return {
            byWorkspace: newByWorkspace,
            global: [
              record,
              ...filteredGlobal,
            ].slice(0, MAX_RECENT_ITEMS),
          }
        })
      },
      
      getRecentForWorkspace: (workspaceId?: string, limit = 10) => {
        const state = get()
        
        if (!workspaceId) {
          return state.global.slice(0, limit)
        }
        
        // Merge workspace-specific and global, deduplicate
        const workspaceHistory = state.byWorkspace[workspaceId] ?? []
        const seen = new Set(workspaceHistory.map(r => r.id))
        const additionalFromGlobal = state.global
          .filter(r => !seen.has(r.id))
          .slice(0, limit - workspaceHistory.length)
        
        return [...workspaceHistory, ...additionalFromGlobal].slice(0, limit)
      },
      
      getGlobalRecent: (limit = 10) => {
        return get().global.slice(0, limit)
      },
      
      clearWorkspaceHistory: (workspaceId: string) => {
        set(state => {
          const newByWorkspace = { ...state.byWorkspace }
          delete newByWorkspace[workspaceId]
          return { byWorkspace: newByWorkspace }
        })
      },
      
      clearGlobalHistory: () => {
        set({ global: [] })
      },
      
      clearAll: () => {
        set({ byWorkspace: {}, global: [] })
      },
    }),
    {
      name: 'recent-access-storage',
      partialize: (state) => ({
        byWorkspace: state.byWorkspace,
        global: state.global,
      }),
    }
  )
)

/**
 * Hook for tracking access to a search result
 */
export function useTrackAccess() {
  const trackAccess = useRecentAccessStore(state => state.trackAccess)
  
  return (result: SearchResult) => {
    trackAccess(result)
  }
}

/**
 * Hook for getting recent items
 */
export function useRecentItems(workspaceId?: string, limit = 10) {
  const getRecentForWorkspace = useRecentAccessStore(state => state.getRecentForWorkspace)
  const getGlobalRecent = useRecentAccessStore(state => state.getGlobalRecent)
  
  if (workspaceId) {
    return getRecentForWorkspace(workspaceId, limit)
  }
  return getGlobalRecent(limit)
}
