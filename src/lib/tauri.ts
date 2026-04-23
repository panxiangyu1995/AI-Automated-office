/**
 * Tauri 命令封装
 * 提供类型安全的 Rust 后端调用接口
 *
 * 使用动态 import 避免在非 Tauri 环境（如 Vite 开发模式）中调用失败
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

// ==================== Safe Invoke ====================

/**
 * Tauri API 可用性缓存
 */
let tauriAvailable: boolean | null = null

/**
 * 检查 Tauri API 是否可用
 */
async function isTauriAvailable(): Promise<boolean> {
  if (tauriAvailable !== null) {
    return tauriAvailable
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    tauriAvailable = typeof invoke === 'function'
  } catch {
    tauriAvailable = false
  }
  return tauriAvailable
}

/**
 * 安全的 Tauri invoke 调用
 * 在非 Tauri 环境（如 Vite 开发模式）中返回 null 而不是抛出异常
 */
export async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    const available = await isTauriAvailable()
    if (!available) {
      console.warn(`[tauri] Tauri API not available, skipping command: ${command}`)
      return null
    }
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<T>(command, args)
  } catch (error) {
    console.warn(`[tauri] invoke failed for command: ${command}`, error)
    return null
  }
}

// ==================== System Commands ====================

export async function getAppVersion(): Promise<string | null> {
  return safeInvoke<string>('get_app_version')
}

export async function getPlatform(): Promise<string | null> {
  return safeInvoke<string>('get_platform')
}

// ==================== Config Commands ====================

export async function getConfig<T>(key: string): Promise<T | null> {
  return safeInvoke<T>('get_config', { key })
}

export async function setConfig(key: string, value: unknown): Promise<void> {
  await safeInvoke('set_config', { key, value })
}

// ==================== Storage Commands ====================

export async function getStorage<T>(key: string): Promise<T | null> {
  return safeInvoke<T>('get_storage', { key })
}

export async function setStorage(key: string, value: unknown): Promise<void> {
  await safeInvoke('set_storage', { key, value })
}

export async function removeStorage(key: string): Promise<void> {
  await safeInvoke('remove_storage', { key })
}

// ==================== Session Cache Commands ====================

/**
 * Save session metadata to local encrypted cache
 * @param metadata - Session metadata (must not contain password or access_token)
 * @throws Error if security violation or storage error
 */
export async function saveSessionMetadata(metadata: SessionMetadata): Promise<void> {
  await safeInvoke('save_session_metadata', { metadata })
}

/**
 * Get session metadata from local cache
 * @returns Session metadata if valid cache exists, null otherwise
 */
export async function getSessionMetadata(): Promise<SessionMetadata | null> {
  return safeInvoke<SessionMetadata>('get_session_metadata')
}

/**
 * Clear session cache (call on logout or session invalid)
 */
export async function clearSessionCache(): Promise<void> {
  await safeInvoke('clear_session_cache')
}

/**
 * Check if session cache exists
 */
export async function hasSessionCache(): Promise<boolean> {
  const result = await safeInvoke<boolean>('has_session_cache')
  return result ?? false
}

// ==================== Network Commands ====================

/**
 * 检测当前网络连通状态
 */
export async function checkNetworkStatus(): Promise<boolean> {
  const result = await safeInvoke<boolean>('check_network_status')
  return result ?? false
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
export async function getPendingRequests(): Promise<unknown[]> {
  const result = await safeInvoke<unknown[]>('get_pending_requests')
  return result ?? []
}

/**
 * 处理待同步的请求并返回结果
 */
export async function processPendingRequests(): Promise<SyncResult[]> {
  const result = await safeInvoke<SyncResult[]>('process_pending_requests')
  return result ?? []
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
export async function createWebSocketConnection(
  config: WebSocketConfig,
  sessionId?: string
): Promise<string | null> {
  return safeInvoke<string>('create_websocket_connection', { config, sessionId })
}

/**
 * Get WebSocket connection state
 */
export async function getWebSocketConnectionState(
  sessionId: string
): Promise<WebSocketConnectionState | null> {
  return safeInvoke<WebSocketConnectionState>('get_websocket_connection_state', { sessionId })
}

/**
 * Check if WebSocket is connected
 */
export async function isWebSocketConnected(sessionId: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('is_websocket_connected', { sessionId })
  return result ?? false
}

/**
 * Close WebSocket connection
 */
export async function closeWebSocketConnection(sessionId: string): Promise<void> {
  await safeInvoke('close_websocket_connection', { sessionId })
}

/**
 * Send message through WebSocket
 */
export async function sendWebSocketMessage(
  sessionId: string,
  event: WebSocketEvent
): Promise<void> {
  await safeInvoke('send_websocket_message', { sessionId, event })
}

/**
 * Get all active WebSocket sessions
 */
export async function getActiveWebSocketSessions(): Promise<string[]> {
  const result = await safeInvoke<string[]>('get_active_websocket_sessions')
  return result ?? []
}

/**
 * Get API base URL from Tauri backend
 */
export async function getApiBaseUrl(): Promise<string | null> {
  return safeInvoke<string>('get_api_base_url')
}
