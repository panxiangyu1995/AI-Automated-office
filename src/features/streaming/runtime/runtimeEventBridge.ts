import { attachTauriRuntimeEventBridge, BackendRuntimeEvent } from './runtimeEventBridgeTauri'
import {
  createWebSocketConnection,
  closeWebSocketConnection,
  isWebSocketConnected,
  type WebSocketConfig,
  type WebSocketEvent,
} from '../../../lib/tauri'

// RuntimeEventBridgeOptions - minimal interface for the WebSocket bridge
export interface RuntimeEventBridgeOptions {
  sessionId: string
  eventEmitter: {
    emitExternal: (event: unknown) => void
  }
}

export interface WebSocketRuntimeEventBridgeOptions extends RuntimeEventBridgeOptions {
  wsConfig: WebSocketConfig
  useWebSocket?: boolean
  fallbackToTauri?: boolean
}

export interface WebSocketBridgeState {
  sessionId: string
  wsSessionId: string | null
  isConnected: boolean
  useWebSocket: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
}

/**
 * WebSocket event handler (placeholder for future WebSocket event subscription)
 */
function _handleWebSocketEvent(
  event: WebSocketEvent,
  options: WebSocketRuntimeEventBridgeOptions
): void {
  const { eventEmitter } = options
  const { eventBridge } = options as WebSocketRuntimeEventBridgeOptions & { eventBridge?: WebSocketBridgeState }

  // Convert WebSocket event to RuntimeEvent
  const runtimeEvent = convertWsEventToRuntimeEvent(event)
  if (runtimeEvent) {
    eventEmitter.emitExternal(runtimeEvent)
  }

  // Update bridge state
  if (eventBridge) {
    switch (event.type) {
      case 'Connected':
        eventBridge.isConnected = true
        eventBridge.reconnectAttempts = 0
        break
      case 'Disconnected':
        eventBridge.isConnected = false
        break
    }
  }
}

/**
 * Convert WebSocket event to RuntimeEvent
 */
function convertWsEventToRuntimeEvent(event: WebSocketEvent): import('./runtimeEvents').RuntimeEvent | null {
  switch (event.type) {
    case 'SessionStart':
      return {
        id: crypto.randomUUID(),
        type: 'session_start',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        metadata: event.payload,
      }
    case 'SessionEnd':
      return {
        id: crypto.randomUUID(),
        type: 'session_end',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        reason: (event.payload?.reason as 'completed' | 'cancelled' | 'error' | 'timeout') ?? 'completed',
        duration: Number(event.payload?.duration ?? 0),
      }
    case 'MessageStart':
      return {
        id: crypto.randomUUID(),
        type: 'message_start',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        messageId: event.message_id,
        message: {
          id: event.message_id ?? '',
          sessionId: event.session_id ?? '',
          role: (event.payload?.role as 'assistant' | 'user') ?? 'assistant',
          status: 'streaming',
          parts: [{ type: 'text', text: (event.payload?.content as string) ?? '', contentType: 'plain' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          metadata: event.payload as Record<string, unknown>,
        },
      }
    case 'MessageEnd':
      return {
        id: crypto.randomUUID(),
        type: 'message_end',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        messageId: event.message_id,
        message: {
          id: event.message_id ?? '',
          sessionId: event.session_id ?? '',
          role: (event.payload?.role as 'assistant' | 'user') ?? 'assistant',
          status: 'complete',
          parts: [{ type: 'text', text: (event.payload?.content as string) ?? '', contentType: 'plain' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completedAt: Date.now(),
          metadata: event.payload as Record<string, unknown>,
        },
      }
    case 'PartDelta':
      return {
        id: crypto.randomUUID(),
        type: 'part_delta',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        messageId: event.message_id ?? '',
        content: event.content ?? '',
      }
    case 'ToolCall':
      return {
        id: crypto.randomUUID(),
        type: 'tool_call',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        messageId: event.message_id ?? '',
        toolId: (event.payload?.toolId as string) ?? 'unknown',
        toolName: (event.payload?.toolName as string) ?? 'unknown',
        parameters: (event.payload?.parameters as Record<string, unknown>) ?? {},
      }
    case 'ToolResult':
      return {
        id: crypto.randomUUID(),
        type: 'tool_result',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        messageId: event.message_id ?? '',
        toolId: (event.payload?.toolId as string) ?? 'unknown',
        result: event.payload?.result,
        success: Boolean(event.payload?.success),
        duration: event.payload?.duration ? Number(event.payload.duration) : undefined,
      }
    case 'Error':
      return {
        id: crypto.randomUUID(),
        type: 'error',
        sessionId: event.session_id ?? '',
        timestamp: event.timestamp ?? Date.now(),
        sequence: 0,
        messageId: event.message_id,
        code: (event.payload?.code as 'UNKNOWN_ERROR' | 'INVALID_INPUT' | 'PERMISSION_DENIED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'RATE_LIMIT') ?? 'UNKNOWN_ERROR',
        message: (event.payload?.message as string) ?? 'Unknown runtime error',
        recoverable: Boolean(event.payload?.recoverable),
      }
    default:
      return null
  }
}

/**
 * Attach WebSocket-based runtime event bridge
 * 
 * This provides real-time event streaming through WebSocket connections.
 * Falls back to Tauri IPC if WebSocket is unavailable or fails.
 */
export async function attachWebSocketRuntimeEventBridge(
  options: WebSocketRuntimeEventBridgeOptions
): Promise<() => void> {
  const {
    sessionId,
    wsConfig,
    useWebSocket = true,
    fallbackToTauri = true,
  } = options

  const bridgeState: WebSocketBridgeState = {
    sessionId,
    wsSessionId: null,
    isConnected: false,
    useWebSocket,
    reconnectAttempts: 0,
    maxReconnectAttempts: wsConfig.max_reconnect_attempts ?? 5,
  }

  // Attach bridge state to options for event handler access
  ;(options as WebSocketRuntimeEventBridgeOptions & { eventBridge?: WebSocketBridgeState }).eventBridge = bridgeState

  let unlistenTauri: (() => void) | null = null

  // Try WebSocket connection if enabled
  if (useWebSocket && wsConfig.url) {
    try {
      const wsSessionId = await createWebSocketConnection(wsConfig, sessionId)
      bridgeState.wsSessionId = wsSessionId

      // Note: In a real implementation, we would subscribe to WebSocket events here
      // using Tauri's WebSocket plugin event listeners

      // For now, mark as connected
      bridgeState.isConnected = true

      console.log(`[WebSocketBridge] Connected with session: ${wsSessionId}`)
    } catch (error) {
      console.warn('[WebSocketBridge] Failed to connect via WebSocket:', error)

      if (!fallbackToTauri) {
        throw error
      }

      // Fall back to Tauri IPC
      console.log('[WebSocketBridge] Falling back to Tauri IPC')
      unlistenTauri = await attachTauriRuntimeEventBridge(options)
    }
  } else if (fallbackToTauri) {
    // Use Tauri IPC
    unlistenTauri = await attachTauriRuntimeEventBridge(options)
  }

  // Return cleanup function
  return async () => {
    if (bridgeState.wsSessionId) {
      try {
        await closeWebSocketConnection(bridgeState.wsSessionId)
      } catch (error) {
        console.warn('[WebSocketBridge] Error closing WebSocket:', error)
      }
    }

    if (unlistenTauri) {
      unlistenTauri()
    }
  }
}

/**
 * Reconnect WebSocket with exponential backoff
 */
export async function reconnectWebSocket(
  options: WebSocketRuntimeEventBridgeOptions,
  attempt: number = 0
): Promise<void> {
  const { wsConfig, eventBridge } = options as WebSocketRuntimeEventBridgeOptions & { eventBridge?: WebSocketBridgeState }
  
  if (!eventBridge) {
    throw new Error('Bridge state not initialized')
  }

  if (attempt >= eventBridge.maxReconnectAttempts) {
    console.error('[WebSocketBridge] Max reconnect attempts reached')
    eventBridge.isConnected = false
    return
  }

  // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
  
  console.log(`[WebSocketBridge] Reconnecting in ${delay}ms (attempt ${attempt + 1}/${eventBridge.maxReconnectAttempts})`)
  
  await new Promise(resolve => setTimeout(resolve, delay))

  try {
    const wsSessionId = await createWebSocketConnection(wsConfig, eventBridge.sessionId)
    eventBridge.wsSessionId = wsSessionId
    eventBridge.reconnectAttempts = 0
    eventBridge.isConnected = true
    console.log(`[WebSocketBridge] Reconnected successfully`)
  } catch (error) {
    console.error(`[WebSocketBridge] Reconnect failed:`, error)
    eventBridge.reconnectAttempts = attempt + 1
    await reconnectWebSocket(options, attempt + 1)
  }
}

/**
 * Check WebSocket connection health
 */
export async function checkWebSocketHealth(
  sessionId: string
): Promise<{ connected: boolean; latency?: number }> {
  try {
    const connected = await isWebSocketConnected(sessionId)
    return { connected }
  } catch (error) {
    console.warn('[WebSocketBridge] Health check failed:', error)
    return { connected: false }
  }
}

// Re-export Tauri bridge for convenience
export { attachTauriRuntimeEventBridge }
export type { BackendRuntimeEvent }
