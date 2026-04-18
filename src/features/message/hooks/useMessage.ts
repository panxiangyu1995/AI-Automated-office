/**
 * Message Hooks
 * Task 182 - 消息搜索与筛选增强
 */

import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type {
  Message,
  MessageListItem,
  UnreadCount,
  NotificationPreferences,
  CreateMessageRequest,
  MessageSearchQuery,
  MessageSearchResult,
  MessageFilter,
  PinnedMessage,
  ExportRequest,
  ExportResult,
} from '../types/message.types'

// ============================================================================
// Basic Message Hooks
// ============================================================================

export function useMessages(status?: string) {
  const [messages, setMessages] = useState<MessageListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<MessageListItem[]>('message_list', { status })
      setMessages(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取消息失败')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return { messages, isLoading, error, refetch: fetchMessages }
}

export function useMessage(id: string) {
  const [message, setMessage] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    setIsLoading(true)
    invoke<Message>('message_get', { id })
      .then(setMessage)
      .catch((e) => setError(e instanceof Error ? e.message : '获取消息失败'))
      .finally(() => setIsLoading(false))
  }, [id])

  return { message, isLoading, error }
}

export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (request: CreateMessageRequest): Promise<Message | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<Message>('message_send', { request })
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送消息失败')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { sendMessage, isLoading, error }
}

export function useMarkAsRead() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markRead = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('message_mark_read', { id })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '标记已读失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const readAll = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('message_read_all')
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '全部已读失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { markRead, readAll, isLoading, error }
}

export function useDeleteMessage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('message_delete', { id })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { deleteMessage, isLoading, error }
}

// ============================================================================
// Unread Count Hook
// ============================================================================

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState<UnreadCount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<UnreadCount>('message_unread_count')
      setUnreadCount(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取未读数失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  return { unreadCount, isLoading, error, refetch: fetchUnreadCount }
}

// ============================================================================
// Search and Filter Hooks (Task 182)
// ============================================================================

export function useMessageSearch() {
  const [result, setResult] = useState<MessageSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: MessageSearchQuery): Promise<MessageSearchResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const searchResult = await invoke<MessageSearchResult>('message_search', { query })
      setResult(searchResult)
      return searchResult
    } catch (e) {
      setError(e instanceof Error ? e.message : '搜索失败')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { result, isLoading, error, search }
}

export function useMessageFilter() {
  const [messages, setMessages] = useState<MessageListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filter = useCallback(async (filter: MessageFilter): Promise<MessageListItem[] | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<MessageListItem[]>('message_filter', { filter })
      setMessages(result)
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : '筛选失败')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { messages, isLoading, error, filter }
}

// ============================================================================
// Pin Hooks
// ============================================================================

export function usePinMessage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pinMessage = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke<PinnedMessage>('message_pin', { id, reason })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '置顶失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unpinMessage = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('message_unpin', { id })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '取消置顶失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const listPinned = useCallback(async (): Promise<PinnedMessage[]> => {
    try {
      return await invoke<PinnedMessage[]>('message_list_pinned')
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取置顶失败')
      return []
    }
  }, [])

  return { pinMessage, unpinMessage, listPinned, isLoading, error }
}

// ============================================================================
// Export Hook
// ============================================================================

export function useExportMessages() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportMessages = useCallback(async (request: ExportRequest): Promise<ExportResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<ExportResult>('message_export', { request })
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { exportMessages, isLoading, error }
}

// ============================================================================
// Notification Preferences Hook
// ============================================================================

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<NotificationPreferences>('message_get_preferences')
      setPreferences(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取偏好失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(async (prefs: NotificationPreferences): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('message_update_preferences', { preferences: prefs })
      setPreferences(prefs)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新偏好失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return { preferences, isLoading, error, fetchPreferences, updatePreferences }
}

// ============================================================================
// Message Dashboard Hook
// ============================================================================

export interface MessageDashboard {
  totalMessages: number
  unreadCount: number
  byType: Record<string, number>
  recentMessages: MessageListItem[]
}

export function useMessageDashboard() {
  const [dashboard, setDashboard] = useState<MessageDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [messages, unread] = await Promise.all([
        invoke<MessageListItem[]>('message_list', { status: undefined }),
        invoke<UnreadCount>('message_unread_count'),
      ])

      const byType: Record<string, number> = {}
      messages.forEach((m) => {
        byType[m.msgType] = (byType[m.msgType] || 0) + 1
      })

      setDashboard({
        totalMessages: messages.length,
        unreadCount: unread?.total || 0,
        byType,
        recentMessages: messages.slice(0, 10),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取仪表盘失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { dashboard, isLoading, error, refetch: fetchDashboard }
}
