/**
 * Message 模块 Store
 */

import { create } from 'zustand'
import type { MessageListItem, UnreadCount, NotificationPreferences } from '../types/message.types'
import { messageApi } from '../api/messageApi'

interface MessageState {
  messages: MessageListItem[]
  unreadCount: UnreadCount | null
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: string | null
  fetchMessages: (status?: string) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  fetchPreferences: () => Promise<void>
  markRead: (id: string) => Promise<void>
  readAll: () => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  clearError: () => void
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [], unreadCount: null, preferences: null, isLoading: false, error: null,

  fetchMessages: async (status?: string) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await messageApi.listMessages(status)
      set({ messages, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取消息失败', isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await messageApi.getUnreadCount()
      set({ unreadCount })
    } catch (e) {
      console.error('获取未读数失败:', e)
    }
  },

  fetchPreferences: async () => {
    try {
      const preferences = await messageApi.getPreferences()
      set({ preferences })
    } catch (e) {
      console.error('获取偏好失败:', e)
    }
  },

  markRead: async (id: string) => {
    try {
      await messageApi.markRead(id)
      await get().fetchMessages()
      await get().fetchUnreadCount()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '标记已读失败' })
    }
  },

  readAll: async () => {
    try {
      await messageApi.readAll()
      await get().fetchMessages()
      await get().fetchUnreadCount()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '全部已读失败' })
    }
  },

  deleteMessage: async (id: string) => {
    try {
      await messageApi.deleteMessage(id)
      await get().fetchMessages()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '删除失败' })
    }
  },

  clearError: () => set({ error: null }),
}))

export const useUnreadCount = () => useMessageStore((s) => s.unreadCount)
