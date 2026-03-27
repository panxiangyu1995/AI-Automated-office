/**
 * Streaming Host Context - React Hooks for Streaming Integration
 * Task 62: Story 43.3 - Streaming Output and Status Sync
 * 
 * This module provides React hooks for streaming integration.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { StreamChunk } from '../../message/runtime/messageModel'
import type { RuntimeEventType, RuntimeEventListener } from './runtimeEvents'
import { RuntimeEventEmitter, createRuntimeEventEmitter } from './runtimeEvents'
import type { SyncState, StreamChunkConsumer } from './syncEngine'
import { SyncEngine, createSyncEngine } from './syncEngine'
import type { ReconnectState } from './reconnectHandler'
import { ReconnectHandler, createReconnectHandler } from './reconnectHandler'
import { attachTauriRuntimeEventBridge } from './runtimeEventBridge'

// ==================== Context Types ====================

/**
 * Streaming context value
 */
export interface StreamingContextValue {
  sessionId: string
  eventEmitter: RuntimeEventEmitter
  syncEngine: SyncEngine
  reconnectHandler: ReconnectHandler
  syncState: SyncState
  reconnectState: ReconnectState
  isStreaming: boolean
  isReconnecting: boolean
  startStreaming: () => void
  stopStreaming: () => void
  subscribe: (consumer: StreamChunkConsumer, filter?: (chunk: StreamChunk) => boolean) => () => void
  subscribeToEvents: (type: RuntimeEventType | '*', listener: RuntimeEventListener) => () => void
  getStats: () => ReturnType<SyncEngine['getStats']>
}

/**
 * Streaming provider props
 */
export interface StreamingProviderProps {
  sessionId: string
  children: React.ReactNode
  config?: {
    maxPendingChunks?: number
    syncInterval?: number
    enableBatching?: boolean
    batchSize?: number
    batchTimeout?: number
    maxReconnectAttempts?: number
    reconnectBaseDelay?: number
  }
}

// ==================== Context ====================

const StreamingContext = createContext<StreamingContextValue | null>(null)

// ==================== Provider ====================

/**
 * Streaming Provider Component
 * 
 * Provides streaming context to child components.
 */
export function StreamingProvider({
  sessionId,
  children,
  config,
}: StreamingProviderProps): React.ReactElement {
  // Create instances
  const eventEmitterRef = useRef<RuntimeEventEmitter | null>(null)
  const syncEngineRef = useRef<SyncEngine | null>(null)
  const reconnectHandlerRef = useRef<ReconnectHandler | null>(null)
  const bridgeUnlistenRef = useRef<null | (() => void)>(null)

  // State
  const [syncState, setSyncState] = useState<SyncState>({
    sessionId,
    status: 'disconnected',
    lastSequence: 0,
    lastSyncTime: 0,
    pendingChunks: [],
  })
  const [reconnectState, setReconnectState] = useState<ReconnectState>({
    status: 'idle',
    sessionId,
    attemptCount: 0,
    maxAttempts: config?.maxReconnectAttempts ?? 5,
    lastSequence: 0,
    eventsSinceDisconnect: 0,
    nextRetryDelay: config?.reconnectBaseDelay ?? 1000,
  })
  const [isStreaming, setIsStreaming] = useState(false)

  // Initialize instances
  // eslint-disable react-hooks/exhaustive-deps
  useEffect(() => {
    // Create event emitter
    eventEmitterRef.current = createRuntimeEventEmitter(sessionId)

    // Create sync engine
    syncEngineRef.current = createSyncEngine(sessionId, {
      eventEmitter: eventEmitterRef.current,
      maxPendingChunks: config?.maxPendingChunks,
      syncInterval: config?.syncInterval,
      enableBatching: config?.enableBatching,
      batchSize: config?.batchSize,
      batchTimeout: config?.batchTimeout,
    })

    // Create reconnect handler
    reconnectHandlerRef.current = createReconnectHandler(
      sessionId,
      syncEngineRef.current,
      {
        maxAttempts: config?.maxReconnectAttempts,
        baseDelay: config?.reconnectBaseDelay,
      }
    )

    // Initialize reconnect handler
    reconnectHandlerRef.current.initialize()

    // Subscribe to state changes
    const unsubSync = syncEngineRef.current.addStateListener(setSyncState)
    const unsubReconnect = reconnectHandlerRef.current.addStateListener(setReconnectState)
    let isMounted = true

    const attachBridge = async () => {
      if (!eventEmitterRef.current || !syncEngineRef.current || !reconnectHandlerRef.current) {
        return
      }
      const unlisten = await attachTauriRuntimeEventBridge({
        sessionId,
        eventEmitter: eventEmitterRef.current,
        syncEngine: syncEngineRef.current,
        reconnectHandler: reconnectHandlerRef.current,
      })
      if (!isMounted) {
        unlisten()
        return
      }
      bridgeUnlistenRef.current = unlisten
    }

    void attachBridge()

    return () => {
      isMounted = false
      if (bridgeUnlistenRef.current) {
        bridgeUnlistenRef.current()
        bridgeUnlistenRef.current = null
      }
      unsubSync()
      unsubReconnect()
      reconnectHandlerRef.current?.cleanup()
      syncEngineRef.current?.stop()
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop streaming
  const startStreaming = useCallback(() => {
    syncEngineRef.current?.start()
    setIsStreaming(true)
  }, [])

  const stopStreaming = useCallback(() => {
    syncEngineRef.current?.stop()
    setIsStreaming(false)
  }, [])

  // Subscribe to chunks
  const subscribe = useCallback((
    consumer: StreamChunkConsumer,
    filter?: (chunk: StreamChunk) => boolean
  ) => {
    if (!syncEngineRef.current) return () => {}
    return syncEngineRef.current.registerConsumer(
      `consumer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      consumer,
      filter
    )
  }, [])

  // Subscribe to events
  const subscribeToEvents = useCallback((
    type: RuntimeEventType | '*',
    listener: RuntimeEventListener
  ) => {
    if (!eventEmitterRef.current) return () => {}
    return eventEmitterRef.current.addEventListener(type, listener)
  }, [])

  // Get stats
  const getStats = useCallback(() => {
    return syncEngineRef.current?.getStats() ?? {
      totalEvents: 0,
      totalChunks: 0,
      chunksPerSecond: 0,
      averageLatency: 0,
      bufferUsage: 0,
      lastSyncDuration: 0,
    }
  }, [])

  // Check reconnecting status
  const isReconnecting = reconnectState.status === 'reconnecting' || reconnectState.status === 'replaying'

  const value: StreamingContextValue = {
    sessionId,
    eventEmitter: eventEmitterRef.current!,
    syncEngine: syncEngineRef.current!,
    reconnectHandler: reconnectHandlerRef.current!,
    syncState,
    reconnectState,
    isStreaming,
    isReconnecting,
    startStreaming,
    stopStreaming,
    subscribe,
    subscribeToEvents,
    getStats,
  }

  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  )
}

// ==================== Hooks ====================

/**
 * Use streaming context
 */
export function useStreamingContext(): StreamingContextValue {
  const context = useContext(StreamingContext)
  if (!context) {
    throw new Error('useStreamingContext must be used within a StreamingProvider')
  }
  return context
}

/**
 * Use streaming state
 */
export function useStreamingState(): {
  isStreaming: boolean
  isReconnecting: boolean
  syncStatus: SyncState['status']
  reconnectStatus: ReconnectState['status']
} {
  const { isStreaming, isReconnecting, syncState, reconnectState } = useStreamingContext()
  return {
    isStreaming,
    isReconnecting,
    syncStatus: syncState.status,
    reconnectStatus: reconnectState.status,
  }
}

/**
 * Use stream chunks subscription
 */
export function useStreamChunks(
  onChunk: (chunk: StreamChunk) => void,
  filter?: (chunk: StreamChunk) => boolean
): void {
  const { subscribe } = useStreamingContext()

  useEffect(() => {
    return subscribe(onChunk, filter)
  }, [subscribe, onChunk, filter])
}

/**
 * Use runtime events subscription
 */
export function useRuntimeEvents(
  type: RuntimeEventType | '*',
  onEvent: RuntimeEventListener
): void {
  const { subscribeToEvents } = useStreamingContext()

  useEffect(() => {
    return subscribeToEvents(type, onEvent)
  }, [subscribeToEvents, type, onEvent])
}

/**
 * Use streaming stats
 */
export function useStreamingStats(): ReturnType<SyncEngine['getStats']> {
  const { getStats } = useStreamingContext()
  const [stats, setStats] = useState(getStats)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [getStats])

  return stats
}

/**
 * Use streaming control
 */
export function useStreamingControl(): {
  start: () => void
  stop: () => void
  isStreaming: boolean
} {
  const { startStreaming, stopStreaming, isStreaming } = useStreamingContext()
  return {
    start: startStreaming,
    stop: stopStreaming,
    isStreaming,
  }
}

/**
 * Use reconnect state
 */
export function useReconnectState(): ReconnectState {
  const { reconnectState } = useStreamingContext()
  return reconnectState
}

/**
 * Use message stream
 */
export function useMessageStream(messageId: string | null): {
  chunks: StreamChunk[]
  isComplete: boolean
  error: { code: string; message: string } | null
} {
  const [chunks, setChunks] = useState<StreamChunk[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)

  useStreamChunks(
    useCallback((chunk: StreamChunk) => {
      if (!messageId || chunk.messageId !== messageId) return

      setChunks(prev => [...prev, chunk])

      if (chunk.type === 'message_end') {
        setIsComplete(true)
      }

      if (chunk.type === 'error' && chunk.error) {
        setError(chunk.error)
      }
    }, [messageId])
  )

  // Reset when messageId changes
  useEffect(() => {
    setChunks([])
    setIsComplete(false)
    setError(null)
  }, [messageId])

  return { chunks, isComplete, error }
}

/**
 * Use part stream
 */
export function usePartStream(messageId: string, partId: string | null): {
  content: string
  isComplete: boolean
} {
  const [content, setContent] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useStreamChunks(
    useCallback((chunk: StreamChunk) => {
      if (!partId || chunk.messageId !== messageId || chunk.partId !== partId) return

      if (chunk.type === 'part_delta' && chunk.delta) {
        setContent(prev => prev + chunk.delta)
      }

      if (chunk.type === 'part_end') {
        setIsComplete(true)
      }
    }, [messageId, partId])
  )

  // Reset when partId changes
  useEffect(() => {
    setContent('')
    setIsComplete(false)
  }, [partId])

  return { content, isComplete }
}

// ==================== Factory Functions ====================

/**
 * Create a streaming context for workbench
 */
export function createWorkbenchStreamingContext(sessionId: string): {
  provider: React.FC<{ children: React.ReactNode }>
  hooks: {
    useStreamingContext: () => StreamingContextValue
    useStreamingState: typeof useStreamingState
    useStreamChunks: typeof useStreamChunks
    useRuntimeEvents: typeof useRuntimeEvents
    useStreamingStats: typeof useStreamingStats
    useStreamingControl: typeof useStreamingControl
    useReconnectState: typeof useReconnectState
    useMessageStream: typeof useMessageStream
    usePartStream: typeof usePartStream
  }
} {
  return {
    provider: ({ children }) => (
      <StreamingProvider sessionId={sessionId}>{children}</StreamingProvider>
    ),
    hooks: {
      useStreamingContext,
      useStreamingState,
      useStreamChunks,
      useRuntimeEvents,
      useStreamingStats,
      useStreamingControl,
      useReconnectState,
      useMessageStream,
      usePartStream,
    },
  }
}

/**
 * Create a streaming context for dashboard
 */
export function createDashboardStreamingContext(sessionId: string): {
  provider: React.FC<{ children: React.ReactNode }>
  hooks: {
    useStreamingContext: () => StreamingContextValue
    useStreamingState: typeof useStreamingState
    useStreamingStats: typeof useStreamingStats
  }
} {
  return {
    provider: ({ children }) => (
      <StreamingProvider
        sessionId={sessionId}
        config={{
          enableBatching: true,
          batchSize: 20,
          batchTimeout: 100,
        }}
      >
        {children}
      </StreamingProvider>
    ),
    hooks: {
      useStreamingContext,
      useStreamingState,
      useStreamingStats,
    },
  }
}
