/**
 * Message Module - 统一导出
 */

export * from './types/message.types'
export { messageApi } from './api/messageApi'
export * from './api/messageApi'
export { useMessageStore, useUnreadCount } from './stores/messageStore'
export { NotificationBell } from './components/NotificationBell'
export { MessageList } from './components/MessageList'
export { MessageInput } from './components/MessageInput'
export { MessageSearchPanel } from './components/MessageSearchPanel'
export { MessageDetail } from './components/MessageDetail'
export { MessageExport } from './components/MessageExport'
export { NotificationSettings } from './components/NotificationSettings'
export { AnnouncementList } from './components/AnnouncementList'
export { MessageDashboardComponent } from './components/MessageDashboard'

// Hooks
export {
  useMessages,
  useMessage,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
  useUnreadCount as useUnreadCountHook,
  useMessageSearch,
  useMessageFilter,
  usePinMessage,
  useExportMessages,
  useNotificationPreferences,
  useMessageDashboard,
} from './hooks/useMessage'

export type { MessageDashboard } from './hooks/useMessage'
