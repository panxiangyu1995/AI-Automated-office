/**
 * Message 模块类型定义
 */

export type MessageType = 'system' | 'approval' | 'task' | 'mention' | 'chat'
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent'
export type MessageStatus = 'unread' | 'read' | 'archived'

export interface Sender {
  id: string
  name: string
  avatar?: string
}

export interface Message {
  id: string
  msgType: MessageType
  title: string
  content: string
  sender: Sender
  recipientId: string
  recipientType: 'user' | 'department' | 'all'
  priority: MessagePriority
  status: MessageStatus
  actionUrl?: string
  metadata?: Record<string, unknown>
  createdAt: number
  readAt?: number
  pinned?: boolean
  pinnedAt?: number
}

export interface DoNotDisturb {
  enabled: boolean
  startTime?: string
  endTime?: string
  days?: number[]
}

export interface NotificationChannels {
  inApp: boolean
  email: boolean
  push: boolean
}

export interface NotificationTypes {
  system: boolean
  approval: boolean
  task: boolean
  mention: boolean
  chat: boolean
}

export interface NotificationPreferences {
  userId: string
  doNotDisturb: DoNotDisturb
  channels: NotificationChannels
  types: NotificationTypes
}

export interface CreateMessageRequest {
  msgType: MessageType
  title: string
  content: string
  recipientId: string
  recipientType: string
  priority?: MessagePriority
  actionUrl?: string
}

export interface MessageListItem {
  id: string
  msgType: MessageType
  title: string
  senderName: string
  status: MessageStatus
  priority: MessagePriority
  createdAt: number
}

export interface UnreadCount {
  total: number
  system: number
  approval: number
  task: number
  mention: number
  chat: number
}

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  system: '系统', approval: '审批', task: '任务', mention: '提及', chat: '聊天'
}

export const MESSAGE_PRIORITY_LABELS: Record<MessagePriority, string> = {
  low: '低', normal: '普通', high: '高', urgent: '紧急'
}

export const MESSAGE_PRIORITY_COLORS: Record<MessagePriority, string> = {
  low: 'text-gray-400',
  normal: 'text-blue-400',
  high: 'text-yellow-500',
  urgent: 'text-red-500',
}

// ============================================================================
// Search and Filter Types (Task 182)
// ============================================================================

export interface MessageSearchQuery {
  keyword?: string
  msgType?: MessageType
  priority?: MessagePriority
  status?: MessageStatus
  senderId?: string
  startDate?: number
  endDate?: number
  pinnedOnly?: boolean
  page?: number
  pageSize?: number
}

export interface MessageSearchResult {
  messages: MessageListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MessageFilter {
  msgType?: MessageType
  priority?: MessagePriority
  status?: MessageStatus
  senderId?: string
  startDate?: number
  endDate?: number
  pinnedOnly: boolean
  searchKeyword?: string
}

export interface PinnedMessage {
  messageId: string
  pinnedAt: number
  reason?: string
}

export type ExportFormat = 'csv' | 'json' | 'txt'

export interface ExportRequest {
  filter: MessageFilter
  format: ExportFormat
  includeContent: boolean
}

export interface ExportResult {
  format: ExportFormat
  filename: string
  data: string
  messageCount: number
}
