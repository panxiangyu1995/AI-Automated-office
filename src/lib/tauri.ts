import { invoke } from '@tauri-apps/api/core'
import type { QueuedRequest } from './api/types'

/**
 * Tauri 命令封装
 * 提供类型安全的 Rust 后端调用接口
 */

// ==================== Session Cache Types ====================

/**
 * Session metadata for local caching
 * Note: Does NOT contain password or access_token for security
 */
export interface SessionMetadata {
  user_id: string
  username: string
  display_name?: string
  tenant_id: string
  tenant_name?: string
  refresh_token: string
  expires_at: number // Unix timestamp in seconds
  last_active_at: number
  created_at: number
}

// ==================== System Commands ====================

export const getAppVersion = async (): Promise<string> => {
  return invoke('get_app_version')
}

export const getPlatform = async (): Promise<string> => {
  return invoke('get_platform')
}

// ==================== Config Commands ====================

export const getConfig = async <T>(key: string): Promise<T | null> => {
  return invoke('get_config', { key })
}

export const setConfig = async (key: string, value: unknown): Promise<void> => {
  return invoke('set_config', { key, value })
}

// ==================== Storage Commands ====================

export const getStorage = async <T>(key: string): Promise<T | null> => {
  return invoke('get_storage', { key })
}

export const setStorage = async (key: string, value: unknown): Promise<void> => {
  return invoke('set_storage', { key, value })
}

export const removeStorage = async (key: string): Promise<void> => {
  return invoke('remove_storage', { key })
}

// ==================== Session Cache Commands ====================

/**
 * Save session metadata to local encrypted cache
 * @param metadata - Session metadata (must not contain password or access_token)
 * @throws Error if security violation or storage error
 */
export const saveSessionMetadata = async (metadata: SessionMetadata): Promise<void> => {
  return invoke('save_session_metadata', { metadata })
}

/**
 * Get session metadata from local cache
 * @returns Session metadata if valid cache exists, null otherwise
 */
export const getSessionMetadata = async (): Promise<SessionMetadata | null> => {
  return invoke<SessionMetadata | null>('get_session_metadata')
}

/**
 * Clear session cache (call on logout or session invalid)
 */
export const clearSessionCache = async (): Promise<void> => {
  return invoke('clear_session_cache')
}

/**
 * Check if session cache exists
 */
export const hasSessionCache = async (): Promise<boolean> => {
  return invoke<boolean>('has_session_cache')
}

// ==================== Network Commands ====================

/**
 * 检测当前网络连通状态
 */
export const checkNetworkStatus = async (): Promise<boolean> => {
  return invoke('check_network_status')
}

export interface SyncResult {
  id: string
  success: boolean
  status_code?: number
  error?: string
}

/**
 * 获取待同步的请求列表
 */
export const getPendingRequests = async (): Promise<QueuedRequest[]> => {
  return invoke('get_pending_requests')
}

/**
 * 处理待同步的请求并返回结果
 */
export const processPendingRequests = async (): Promise<SyncResult[]> => {
  return invoke('process_pending_requests')
}

// ==================== WebSocket Commands (Task 136) ====================

export interface WebSocketConfig {
  url: string
  token?: string
  heartbeat_interval_ms?: number
  heartbeat_timeout_ms?: number
  max_reconnect_attempts?: number
  initial_reconnect_delay_ms?: number
}

export interface WebSocketConnectionState {
  session_id: string
  is_connected: boolean
  last_pong_at: number | null
  reconnect_attempts: number
  max_reconnect_attempts: number
  reconnect_delay_ms: number
  url: string | null
}

export type WebSocketEventType =
  | 'Ping'
  | 'Pong'
  | 'SessionStart'
  | 'SessionEnd'
  | 'MessageStart'
  | 'MessageEnd'
  | 'ToolCall'
  | 'ToolResult'
  | 'PartDelta'
  | 'Error'
  | 'SyncStatus'
  | 'SyncComplete'
  | 'Connected'
  | 'Disconnected'

export interface WebSocketEvent {
  type: WebSocketEventType
  session_id?: string
  message_id?: string
  timestamp?: number
  content?: string
  code?: string
  status?: string
  pending?: number
  synced_at?: number
  reason?: string
  payload?: Record<string, unknown>
}

/**
 * Create a new WebSocket connection
 */
export const createWebSocketConnection = async (
  config: WebSocketConfig,
  sessionId?: string
): Promise<string> => {
  return invoke('create_websocket_connection', { config, sessionId })
}

/**
 * Get WebSocket connection state
 */
export const getWebSocketConnectionState = async (
  sessionId: string
): Promise<WebSocketConnectionState> => {
  return invoke('get_websocket_connection_state', { sessionId })
}

/**
 * Check if WebSocket is connected
 */
export const isWebSocketConnected = async (sessionId: string): Promise<boolean> => {
  return invoke('is_websocket_connected', { sessionId })
}

/**
 * Close WebSocket connection
 */
export const closeWebSocketConnection = async (sessionId: string): Promise<void> => {
  return invoke('close_websocket_connection', { sessionId })
}

/**
 * Send message through WebSocket
 */
export const sendWebSocketMessage = async (
  sessionId: string,
  event: WebSocketEvent
): Promise<void> => {
  return invoke('send_websocket_message', { sessionId, event })
}

/**
 * Get all active WebSocket sessions
 */
export const getActiveWebSocketSessions = async (): Promise<string[]> => {
  return invoke('get_active_websocket_sessions')
}
