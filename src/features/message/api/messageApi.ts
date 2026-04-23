/**
 * Message 模块 API
 * Task 182 - 消息搜索与筛选增强
 */

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

/**
 * 安全的 Tauri invoke 调用
 * 在非 Tauri 环境（如 Vite 开发模式）中返回有意义的默认值
 */
async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    if (typeof invoke !== 'function') {
      console.warn(`[messageApi] invoke is not a function, command: ${command}`)
      return null
    }
    return await invoke<T>(command, args)
  } catch (error) {
    console.warn(`[messageApi] invoke failed for command: ${command}`, error)
    return null
  }
}

// Basic CRUD
export async function sendMessage(request: CreateMessageRequest): Promise<Message | null> { return safeInvoke('message_send', { request }) }
export async function listMessages(status?: string): Promise<MessageListItem[] | null> { return safeInvoke('message_list', { status }) }
export async function getMessage(id: string): Promise<Message | null> { return safeInvoke('message_get', { id }) }
export async function markRead(id: string): Promise<void> { await safeInvoke('message_mark_read', { id }) }
export async function readAll(): Promise<void> { await safeInvoke('message_read_all') }
export async function deleteMessage(id: string): Promise<void> { await safeInvoke('message_delete', { id }) }
export async function getUnreadCount(): Promise<UnreadCount | null> { return safeInvoke('message_unread_count') }
export async function getPreferences(): Promise<NotificationPreferences | null> { return safeInvoke('message_get_preferences') }
export async function updatePreferences(preferences: NotificationPreferences): Promise<void> { await safeInvoke('message_update_preferences', { preferences }) }

// Search and Filter (Task 182)
export async function searchMessages(query: MessageSearchQuery): Promise<MessageSearchResult | null> { return safeInvoke('message_search', { query }) }
export async function filterMessages(filter: MessageFilter): Promise<MessageListItem[] | null> { return safeInvoke('message_filter', { filter }) }

// Pin functionality
export async function pinMessage(id: string, reason?: string): Promise<PinnedMessage | null> { return safeInvoke('message_pin', { id, reason }) }
export async function unpinMessage(id: string): Promise<void> { await safeInvoke('message_unpin', { id }) }
export async function listPinnedMessages(): Promise<PinnedMessage[] | null> { return safeInvoke('message_list_pinned') }

// Export
export async function exportMessages(request: ExportRequest): Promise<ExportResult | null> { return safeInvoke('message_export', { request }) }

export const messageApi = {
  // Basic CRUD
  sendMessage,
  listMessages,
  getMessage,
  markRead,
  readAll,
  deleteMessage,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  // Search and Filter
  searchMessages,
  filterMessages,
  // Pin functionality
  pinMessage,
  unpinMessage,
  listPinnedMessages,
  // Export
  exportMessages,
}
