/**
 * useAgentRuntime - Agent Runtime Integration Hook
 * Story 51.4 - Chat host integration and E2E baseline
 * 
 * Connects the frontend chat panel to the real backend agent runtime
 * via Tauri commands and event streaming.
 * 
 * 铁律合规：
 * - ARCH: 分层架构，前端通过 Tauri IPC 调用后端
 * - NFR-1: 性能优化，使用流式传输
 * - UX-04: 透明可控的 AI 交互
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useChatStore } from './useChatStore'

// ==================== Types ====================

/**
 * Backend runtime event from Rust
 */
interface BackendRuntimeEvent {
  id: string
  type: RuntimeEventType
  sessionId: string
  timestamp: number
  sequence: number
  messageId?: string
  payload?: Record<string, unknown>
}

/**
 * Runtime event types (matching Rust enum)
 */
type RuntimeEventType =
  | 'session_start'
  | 'session_end'
  | 'message_start'
  | 'message_end'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'warning'
  | 'debug'

/**
 * Start session request
 */
interface StartSessionRequest {
  tenantId: string
  userId: string
  title?: string
}

/**
 * Start session response
 */
interface StartSessionResponse {
  sessionId: string
  sessionKey: string
}

/**
 * Execute agent request
 */
interface ExecuteAgentRequest {
  tenantId: string
  userId: string
  sessionId: string
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Execute agent response
 */
interface ExecuteAgentResponse {
  sessionId: string
  traceId: string
  status: 'completed' | 'interrupted' | 'failed'
  content?: string
  error?: string
}

/**
 * Agent runtime state
 */
export interface AgentRuntimeState {
  /** Current session ID from backend */
  backendSessionId: string | null
  /** Whether the runtime is initialized */
  isInitialized: boolean
  /** Whether an agent execution is in progress */
  isExecuting: boolean
  /** Last error from runtime */
  error: string | null
  /** Current trace ID */
  traceId: string | null
}

/**
 * Agent runtime options
 */
export interface UseAgentRuntimeOptions {
  /** Tenant ID for multi-tenancy */
  tenantId?: string
  /** User ID */
  userId?: string
  /** Auto-initialize session on mount */
  autoInit?: boolean
  /** Callback when session starts */
  onSessionStart?: (sessionId: string) => void
  /** Callback when session ends */
  onSessionEnd?: (reason: string, duration: number) => void
  /** Callback on error */
  onError?: (error: string) => void
}

// ==================== Default Values ====================

const DEFAULT_TENANT_ID = 'default'
const DEFAULT_USER_ID = 'default-user'

// ==================== Hook ====================

/**
 * Hook for integrating with the backend agent runtime
 */
export function useAgentRuntime(options: UseAgentRuntimeOptions = {}) {
  const {
    tenantId = DEFAULT_TENANT_ID,
    userId = DEFAULT_USER_ID,
    autoInit = false,
    onSessionStart,
    onSessionEnd,
    onError,
  } = options

  // State
  const [state, setState] = useState<AgentRuntimeState>({
    backendSessionId: null,
    isInitialized: false,
    isExecuting: false,
    error: null,
    traceId: null,
  })

  // Refs
  const unlistenRef = useRef<UnlistenFn | null>(null)
  const sessionKeyRef = useRef<string | null>(null)

  // Chat store
  const {
    activeSessionId,
    addUserMessage,
    addAssistantMessage,
    startStreaming,
    updateStreamingContent,
    finalizeStreamingMessage,
    stopStreaming,
  } = useChatStore()

  // ==================== Event Handling ====================

  /**
   * Handle backend runtime events
   */
  const handleRuntimeEvent = useCallback(
    (event: BackendRuntimeEvent) => {
      // Ignore events for other sessions
      if (event.sessionId !== state.backendSessionId) return

      switch (event.type) {
        case 'session_start': {
          setState((s) => ({ ...s, isExecuting: true, error: null }))
          onSessionStart?.(event.sessionId)
          break
        }

        case 'session_end': {
          const payload = event.payload ?? {}
          const reason = (payload.reason as string) ?? 'completed'
          const duration = (payload.duration as number) ?? 0
          setState((s) => ({ ...s, isExecuting: false }))
          stopStreaming()
          onSessionEnd?.(reason, duration)
          break
        }

        case 'message_start': {
          if (!event.messageId || !activeSessionId) return
          const payload = event.payload ?? {}
          const role = (payload.role as 'user' | 'assistant') ?? 'assistant'
          const content = (payload.content as string) ?? ''

          if (role === 'assistant') {
            // Start streaming for assistant messages
            const partId = `part-${Date.now()}`
            startStreaming(activeSessionId, event.messageId, partId)
            // Update content if provided
            if (content) {
              updateStreamingContent(content)
            }
          } else if (role === 'user') {
            // User messages are added by the caller, just log here
            console.log('[AgentRuntime] User message confirmed:', event.messageId)
          }
          break
        }

        case 'message_end': {
          if (!event.messageId || !activeSessionId) return
          finalizeStreamingMessage(activeSessionId)
          break
        }

        case 'tool_call': {
          // Tool calls are logged but don't need streaming updates
          // They will be shown in the debug panel
          console.log('[AgentRuntime] Tool call:', event.payload)
          break
        }

        case 'tool_result': {
          // Tool results are logged but don't need streaming updates
          console.log('[AgentRuntime] Tool result:', event.payload)
          break
        }

        case 'error': {
          const payload = event.payload ?? {}
          const errorMsg = (payload.message as string) ?? 'Unknown error'
          setState((s) => ({ ...s, error: errorMsg, isExecuting: false }))
          stopStreaming()
          onError?.(errorMsg)
          break
        }

        default:
          // Ignore other events
          break
      }
    },
    [
      state.backendSessionId,
      activeSessionId,
      startStreaming,
      updateStreamingContent,
      finalizeStreamingMessage,
      stopStreaming,
      onSessionStart,
      onSessionEnd,
      onError,
    ]
  )

  // ==================== Session Management ====================

  /**
   * Initialize a new backend session
   */
  const initSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await invoke<StartSessionResponse>('start_agent_session', {
        request: {
          tenantId,
          userId,
          title: `Chat Session ${Date.now()}`,
        } as StartSessionRequest,
      })

      sessionKeyRef.current = response.sessionKey
      setState((s) => ({
        ...s,
        backendSessionId: response.sessionId,
        isInitialized: true,
        error: null,
      }))

      return response.sessionId
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setState((s) => ({ ...s, error: errorMsg }))
      onError?.(errorMsg)
      return null
    }
  }, [tenantId, userId, onError])

  /**
   * Execute agent with user message
   */
  const executeAgent = useCallback(
    async (message: string): Promise<void> => {
      const sessionId = state.backendSessionId

      if (!sessionId) {
        const errorMsg = 'No active backend session'
        setState((s) => ({ ...s, error: errorMsg }))
        onError?.(errorMsg)
        return
      }

      if (!activeSessionId) {
        const errorMsg = 'No active chat session'
        setState((s) => ({ ...s, error: errorMsg }))
        onError?.(errorMsg)
        return
      }

      try {
        setState((s) => ({ ...s, isExecuting: true, error: null }))

        // Add user message to chat store
        addUserMessage(activeSessionId, message)

        // Create assistant message placeholder
        const assistantMessage = addAssistantMessage(activeSessionId)
        if (!assistantMessage) {
          throw new Error('Failed to create assistant message')
        }

        // Start streaming
        const partId = `part-${Date.now()}`
        startStreaming(activeSessionId, assistantMessage.id, partId)

        // Execute agent on backend
        const response = await invoke<ExecuteAgentResponse>('execute_agent', {
          request: {
            tenantId,
            userId,
            sessionId,
            message,
          } as ExecuteAgentRequest,
        })

        setState((s) => ({ ...s, traceId: response.traceId }))

        // Handle response
        if (response.status === 'completed' && response.content) {
          updateStreamingContent(response.content)
          finalizeStreamingMessage(activeSessionId)
        } else if (response.status === 'interrupted') {
          stopStreaming()
        } else if (response.status === 'failed') {
          const errorMsg = response.error ?? 'Agent execution failed'
          setState((s) => ({ ...s, error: errorMsg }))
          onError?.(errorMsg)
          stopStreaming()
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setState((s) => ({ ...s, error: errorMsg, isExecuting: false }))
        stopStreaming()
        onError?.(errorMsg)
      } finally {
        setState((s) => ({ ...s, isExecuting: false }))
      }
    },
    [
      state.backendSessionId,
      activeSessionId,
      tenantId,
      userId,
      addUserMessage,
      addAssistantMessage,
      startStreaming,
      updateStreamingContent,
      finalizeStreamingMessage,
      stopStreaming,
      onError,
    ]
  )

  /**
   * Interrupt current execution
   */
  const interrupt = useCallback(async (): Promise<boolean> => {
    const sessionId = state.backendSessionId
    if (!sessionId) return false

    try {
      const result = await invoke<boolean>('interrupt_agent_session', {
        sessionId,
      })

      if (result) {
        stopStreaming()
        setState((s) => ({ ...s, isExecuting: false }))
      }

      return result
    } catch (err) {
      console.error('[AgentRuntime] Interrupt failed:', err)
      return false
    }
  }, [state.backendSessionId, stopStreaming])

  /**
   * Reset runtime state
   */
  const reset = useCallback(() => {
    setState({
      backendSessionId: null,
      isInitialized: false,
      isExecuting: false,
      error: null,
      traceId: null,
    })
    sessionKeyRef.current = null
  }, [])

  // ==================== Lifecycle ====================

  // Setup event listener
  useEffect(() => {
    let mounted = true

    const setupListener = async () => {
      unlistenRef.current = await listen<BackendRuntimeEvent>(
        'agent_runtime_event',
        (event) => {
          if (mounted) {
            handleRuntimeEvent(event.payload)
          }
        }
      )
    }

    void setupListener()

    return () => {
      mounted = false
      if (unlistenRef.current) {
        unlistenRef.current()
        unlistenRef.current = null
      }
    }
  }, [handleRuntimeEvent])

  // Auto-initialize session
  useEffect(() => {
    if (autoInit && !state.isInitialized) {
      void initSession()
    }
  }, [autoInit, state.isInitialized, initSession])

  // ==================== Return ====================

  return {
    // State
    ...state,
    // Actions
    initSession,
    executeAgent,
    interrupt,
    reset,
  }
}

export default useAgentRuntime
