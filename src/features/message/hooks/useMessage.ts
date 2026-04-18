/**
 * Message 模块 Hooks - 使用统一 Hooks 封装
 * Phase 11-20: 应用统一Hooks到各业务模块
 */

import { useMemo } from 'react'
import { useTauriCommand } from '@/hooks/useTauriCommand'
import type {
  Message,
  MessageListItem,
  MessageType,
  MessageStatus,
  DoNotDisturb,
} from '../types/message.types'

// ==================== 消息 Hooks ====================

/**
 * 消息列表 Hook
 */
export function useMessages(type?: MessageType, status?: MessageStatus) {
  return useTauriCommand<MessageListItem[]>({
    command: 'message_list',
    params: { type, status },
  })
}

/**
 * 单个消息 Hook
 */
export function useMessage(id: string | null) {
  return useTauriCommand<Message | null>({
    command: 'message_get',
    params: id ? { id } : undefined,
  })
}

/**
 * 发送消息 Hook
 */
export function useSendMessage() {
  return useTauriCommand<Message>({
    command: 'message_send',
  })
}

/**
 * 标记已读 Hook
 */
export function useMarkAsRead() {
  return useTauriCommand<void>({
    command: 'message_mark_read',
  })
}

/**
 * 标记全部已读 Hook
 */
export function useMarkAllAsRead() {
  return useTauriCommand<void>({
    command: 'message_mark_all_read',
  })
}

/**
 * 删除消息 Hook
 */
export function useDeleteMessage() {
  return useTauriCommand<void>({
    command: 'message_delete',
  })
}

/**
 * 置顶消息 Hook
 */
export function usePinMessage() {
  return useTauriCommand<void>({
    command: 'message_pin',
  })
}

// ==================== 通知设置 Hooks ====================

/**
 * 获取通知设置 Hook
 */
export function useNotificationSettings() {
  return useTauriCommand<Record<string, unknown>>({
    command: 'message_get_notification_settings',
  })
}

/**
 * 更新通知设置 Hook
 */
export function useUpdateNotificationSettings() {
  return useTauriCommand<Record<string, unknown>>({
    command: 'message_update_notification_settings',
  })
}

/**
 * 勿扰模式 Hook
 */
export function useDoNotDisturb() {
  return useTauriCommand<DoNotDisturb>({
    command: 'message_set_dnd',
  })
}

// ==================== 统计 Hooks ====================

/**
 * 未读消息统计 Hook
 */
export function useUnreadCount() {
  return useTauriCommand<{ total: number; byType: Record<MessageType, number> }>({
    command: 'message_get_unread_count',
  })
}

// ==================== 辅助 Hooks ====================

/**
 * 消息仪表盘 Hook（组合多个数据源）
 */
export function useMessageDashboard() {
  const unreadCount = useUnreadCount()
  const unreadMessages = useMessages(undefined, 'unread')
  const systemMessages = useMessages('system')

  return useMemo(
    () => ({
      unreadCount,
      unreadMessages,
      systemMessages,
      isLoading: unreadCount.loading || unreadMessages.loading,
      error: unreadCount.error || unreadMessages.error,
    }),
    [unreadCount, unreadMessages, systemMessages]
  )
}
