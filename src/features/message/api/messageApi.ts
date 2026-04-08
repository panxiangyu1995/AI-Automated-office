/**
 * Message 模块 API
 * Task 182 - 消息搜索与筛选增强
 */

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

// Basic CRUD
export async function sendMessage(request: CreateMessageRequest): Promise<Message> { return invoke('message_send', { request }) }
export async function listMessages(status?: string): Promise<MessageListItem[]> { return invoke('message_list', { status }) }
export async function getMessage(id: string): Promise<Message> { return invoke('message_get', { id }) }
export async function markRead(id: string): Promise<void> { return invoke('message_mark_read', { id }) }
export async function readAll(): Promise<void> { return invoke('message_read_all') }
export async function deleteMessage(id: string): Promise<void> { return invoke('message_delete', { id }) }
export async function getUnreadCount(): Promise<UnreadCount> { return invoke('message_unread_count') }
export async function getPreferences(): Promise<NotificationPreferences> { return invoke('message_get_preferences') }
export async function updatePreferences(preferences: NotificationPreferences): Promise<void> { return invoke('message_update_preferences', { preferences }) }

// Search and Filter (Task 182)
export async function searchMessages(query: MessageSearchQuery): Promise<MessageSearchResult> { return invoke('message_search', { query }) }
export async function filterMessages(filter: MessageFilter): Promise<MessageListItem[]> { return invoke('message_filter', { filter }) }

// Pin functionality
export async function pinMessage(id: string, reason?: string): Promise<PinnedMessage> { return invoke('message_pin', { id, reason }) }
export async function unpinMessage(id: string): Promise<void> { return invoke('message_unpin', { id }) }
export async function listPinnedMessages(): Promise<PinnedMessage[]> { return invoke('message_list_pinned') }

// Export
export async function exportMessages(request: ExportRequest): Promise<ExportResult> { return invoke('message_export', { request }) }

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
