/**
 * useHistoryStore - 历史对话管理 Hook
 * Story 4.3 - 历史对话管理
 * 
 * 管理历史会话的搜索、过滤、归档
 * 
 * 铁律合规：
 * - ARCH: 分层架构，复用消息模型
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - FR11: 提供可搜索的历史对话管理
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useChatStore, type ChatSession } from './useChatStore'

// ==================== Types ====================

export type TimeFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'older'

export interface HistoryFilter {
  keyword: string
  timeRange: TimeFilter
}

export interface ArchivedSession {
  id: string
  originalSessionId: string
  title: string
  messageCount: number
  createdAt: number
  archivedAt: number
}

export interface HistoryStoreState {
  // Filters
  filter: HistoryFilter
  
  // Archived sessions (safe deletion archive)
  archivedSessions: Record<string, ArchivedSession>
  
  // Filter Actions
  setKeyword: (keyword: string) => void
  setTimeRange: (range: TimeFilter) => void
  clearFilters: () => void
  
  // Search Actions
  searchSessions: () => ChatSession[]
  filterByTimeRange: (sessions: ChatSession[], range: TimeFilter) => ChatSession[]
  
  // Archive Actions
  archiveSession: (sessionId: string) => void
  restoreSession: (archiveId: string) => string | null
  deleteArchivedSession: (archiveId: string) => void
  getArchivedSessions: () => ArchivedSession[]
  
  // Utility
  getFilteredSessions: () => ChatSession[]
}

const initialFilter: HistoryFilter = {
  keyword: '',
  timeRange: 'all',
}

// ==================== Time Filter Helpers ====================

/**
 * 判断时间戳是否在时间范围内
 */
function isInRange(timestamp: number, range: TimeFilter): boolean {
  if (range === 'all') return true
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (range) {
    case 'today':
      return timestamp >= today.getTime()
    case 'yesterday':
      return timestamp >= today.getTime() - 24 * 60 * 60 * 1000 && timestamp < today.getTime()
    case 'week':
      return timestamp >= today.getTime() - 7 * 24 * 60 * 60 * 1000
    case 'month':
      return timestamp >= today.getTime() - 30 * 24 * 60 * 60 * 1000
    case 'older':
      return timestamp < today.getTime() - 30 * 24 * 60 * 60 * 1000
    default:
      return true
  }
}

// ==================== Store ====================

export const useHistoryStore = create<HistoryStoreState>()(
  subscribeWithSelector((set, get) => ({
    filter: initialFilter,
    archivedSessions: {},
    
    // ==================== Filter Actions ====================
    
    setKeyword: (keyword: string) => {
      set((state) => ({
        filter: { ...state.filter, keyword },
      }))
    },
    
    setTimeRange: (timeRange: TimeFilter) => {
      set((state) => ({
        filter: { ...state.filter, timeRange },
      }))
    },
    
    clearFilters: () => {
      set({ filter: initialFilter })
    },
    
    // ==================== Search Actions ====================
    
    searchSessions: () => {
      const { filter } = get()
      const chatState = useChatStore.getState()
      const sessions = Object.values(chatState.sessions)
      
      // Apply keyword filter
      let filtered = sessions
      if (filter.keyword.trim()) {
        const keyword = filter.keyword.toLowerCase().trim()
        filtered = sessions.filter((session) => {
          // Search in title
          if (session.title.toLowerCase().includes(keyword)) return true
          
          // Search in messages
          return session.messages.some((msg) => 
            msg.parts.some((part) => {
              if (part.type === 'text') {
                return part.content.toLowerCase().includes(keyword)
              }
              return false
            })
          )
        })
      }
      
      // Apply time filter
      filtered = get().filterByTimeRange(filtered, filter.timeRange)
      
      // Sort by updatedAt (newest first)
      return filtered.sort((a, b) => b.updatedAt - a.updatedAt)
    },
    
    filterByTimeRange: (sessions: ChatSession[], range: TimeFilter) => {
      if (range === 'all') return sessions
      return sessions.filter((session) => isInRange(session.updatedAt, range))
    },
    
    // ==================== Archive Actions ====================
    
    archiveSession: (sessionId: string) => {
      const chatState = useChatStore.getState()
      const session = chatState.sessions[sessionId]
      if (!session) return
      
      const archiveId = crypto.randomUUID()
      const archivedSession: ArchivedSession = {
        id: archiveId,
        originalSessionId: sessionId,
        title: session.title,
        messageCount: session.messages.length,
        createdAt: session.createdAt,
        archivedAt: Date.now(),
      }
      
      set((state) => ({
        archivedSessions: {
          ...state.archivedSessions,
          [archiveId]: archivedSession,
        },
      }))
      
      // Delete from active sessions
      useChatStore.getState().deleteSession(sessionId)
    },
    
    restoreSession: (archiveId: string) => {
      const { archivedSessions } = get()
      const archived = archivedSessions[archiveId]
      if (!archived) return null
      
      // Create a new session with the archived info
      const sessionId = useChatStore.getState().createSession(archived.title)
      
      // Remove from archive
      set((state) => {
        const { [archiveId]: _removed, ...remaining } = state.archivedSessions
        return { archivedSessions: remaining }
      })
      
      return sessionId
    },
    
    deleteArchivedSession: (archiveId: string) => {
      set((state) => {
        const { [archiveId]: _removed, ...remaining } = state.archivedSessions
        return { archivedSessions: remaining }
      })
    },
    
    getArchivedSessions: () => {
      return Object.values(get().archivedSessions).sort((a, b) => b.archivedAt - a.archivedAt)
    },
    
    // ==================== Utility ====================
    
    getFilteredSessions: () => {
      return get().searchSessions()
    },
  }))
)

// ==================== Selector Hooks ====================

/**
 * 获取过滤后的会话列表
 */
export function useFilteredSessions(): ChatSession[] {
  return useHistoryStore((state) => state.searchSessions())
}

/**
 * 获取当前过滤条件
 */
export function useHistoryFilter(): HistoryFilter {
  return useHistoryStore((state) => state.filter)
}

/**
 * 获取归档的会话列表
 */
export function useArchivedSessions(): ArchivedSession[] {
  return useHistoryStore((state) => state.getArchivedSessions())
}

// ==================== Export ====================

export default useHistoryStore
