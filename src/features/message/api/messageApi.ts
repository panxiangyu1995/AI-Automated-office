/**
 * Message 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { Message, MessageListItem, UnreadCount, NotificationPreferences, CreateMessageRequest } from '../types/message.types'

export async function sendMessage(request: CreateMessageRequest): Promise<Message> { return invoke('message_send', { request }) }
export async function listMessages(status?: string): Promise<MessageListItem[]> { return invoke('message_list', { status }) }
export async function getMessage(id: string): Promise<Message> { return invoke('message_get', { id }) }
export async function markRead(id: string): Promise<void> { return invoke('message_mark_read', { id }) }
export async function readAll(): Promise<void> { return invoke('message_read_all') }
export async function deleteMessage(id: string): Promise<void> { return invoke('message_delete', { id }) }
export async function getUnreadCount(): Promise<UnreadCount> { return invoke('message_unread_count') }
export async function getPreferences(): Promise<NotificationPreferences> { return invoke('message_get_preferences') }
export async function updatePreferences(preferences: NotificationPreferences): Promise<void> { return invoke('message_update_preferences', { preferences }) }

export const messageApi = { sendMessage, listMessages, getMessage, markRead, readAll, deleteMessage, getUnreadCount, getPreferences, updatePreferences }
