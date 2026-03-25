/**
 * Sync Engine - Message Parts Synchronization to Frontend Consumers
 * Task 62: Story 43.3 - Streaming Output and Status Sync
 * 
 * This module provides synchronization mechanisms for message parts.
 */

import type {
  Message,
  Part,
  PartType,
  ErrorCode,
  StreamChunk,
  SerializedMessage,
} from '../../message/runtime/messageModel'
import type {
  RuntimeEvent,
  RuntimeEventListener,
} from './runtimeEvents'
import { RuntimeEventEmitter, eventToStreamChunk } from './runtimeEvents'

// ==================== Sync State Types ====================

/**
 * Sync status
 */
export type SyncStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'synced'
  | 'error'

/**
 * Sync state for a session
 */
export interface SyncState {
  sessionId: string
  status: SyncStatus
  lastSequence: number
  lastSyncTime: number
  pendingChunks: StreamChunk[]
  error?: {
    code: string
    message: string
    timestamp: number
  }
}

/**
 * Sync statistics
 */
export interface SyncStats {
  totalEvents: number
  totalChunks: number
  chunksPerSecond: number
  averageLatency: number
  bufferUsage: number
  lastSyncDuration: number
}

// ==================== Consumer Types ====================

/**
 * Stream chunk consumer
 */
export type StreamChunkConsumer = (chunk: StreamChunk) => void

/**
 * Sync state listener
 */
export type SyncStateListener = (state: SyncState) => void

/**
 * Consumer registration
 */
export interface ConsumerRegistration {
  id: string
  consumer: StreamChunkConsumer
  filter?: (chunk: StreamChunk) => boolean
}

// ==================== Sync Engine Configuration ====================

/**
 * Sync engine configuration
 */
export interface SyncEngineConfig {
  sessionId: string
  eventEmitter?: RuntimeEventEmitter
  maxPendingChunks?: number
  syncInterval?: number
  enableBatching?: boolean
  batchSize?: number
  batchTimeout?: number
}

// ==================== Sync Engine ====================

/**
 * Sync Engine
 * 
 * Manages synchronization of message parts to frontend consumers.
 */
export class SyncEngine {
  private sessionId: string
  private eventEmitter: RuntimeEventEmitter
  private status: SyncStatus = 'disconnected'
  private lastSequence: number = 0
  private lastSyncTime: number = 0
  private pendingChunks: StreamChunk[] = []
  private maxPendingChunks: number
  private consumers: Map<string, ConsumerRegistration> = new Map()
  private stateListeners: Set<SyncStateListener> = new Set()
  private enableBatching: boolean
  private batchSize: number
  private batchTimeout: number
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private batchBuffer: StreamChunk[] = []
  private unsubscribeFromEvents: (() => void) | null = null
  private stats: SyncStats = {
    totalEvents: 0,
    totalChunks: 0,
    chunksPerSecond: 0,
    averageLatency: 0,
    bufferUsage: 0,
    lastSyncDuration: 0,
  }
  private latencySamples: number[] = []

  constructor(config: SyncEngineConfig) {
    this.sessionId = config.sessionId
    this.eventEmitter = config.eventEmitter ?? new RuntimeEventEmitter({
      sessionId: config.sessionId,
    })
    this.maxPendingChunks = config.maxPendingChunks ?? 1000
    this.enableBatching = config.enableBatching ?? true
    this.batchSize = config.batchSize ?? 10
    this.batchTimeout = config.batchTimeout ?? 50
  }

  // ==================== Lifecycle ====================

  /**
   * Start the sync engine
   */
  start(): void {
    if (this.status !== 'disconnected') return

    this.setStatus('connecting')

    // Subscribe to runtime events
    this.unsubscribeFromEvents = this.eventEmitter.addEventListener('*', this.handleRuntimeEvent)

    this.setStatus('connected')
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    if (this.unsubscribeFromEvents) {
      this.unsubscribeFromEvents()
      this.unsubscribeFromEvents = null
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    this.setStatus('disconnected')
  }

  // ==================== Event Handling ====================

  /**
   * Handle runtime events
   */
  private handleRuntimeEvent: RuntimeEventListener = (event: RuntimeEvent) => {
    this.stats.totalEvents++

    // Convert to stream chunk
    const chunk = eventToStreamChunk(event)
    if (!chunk) return

    // Track latency
    const latency = Date.now() - event.timestamp
    this.latencySamples.push(latency)
    if (this.latencySamples.length > 100) {
      this.latencySamples.shift()
    }

    // Update sequence tracking
    this.lastSequence = event.sequence
    this.lastSyncTime = Date.now()

    // Process chunk
    this.processChunk(chunk)
  }

  /**
   * Process a stream chunk
   */
  private processChunk(chunk: StreamChunk): void {
    this.stats.totalChunks++

    if (this.enableBatching) {
      this.batchBuffer.push(chunk)

      // Flush if batch is full
      if (this.batchBuffer.length >= this.batchSize) {
        this.flushBatch()
      } else if (!this.batchTimer) {
        // Set timeout for partial batch
        this.batchTimer = setTimeout(() => this.flushBatch(), this.batchTimeout)
      }
    } else {
      // Send immediately
      this.deliverChunk(chunk)
    }
  }

  /**
   * Flush batched chunks
   */
  private flushBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    if (this.batchBuffer.length === 0) return

    // Deliver all chunks in batch
    this.batchBuffer.forEach(chunk => this.deliverChunk(chunk))
    this.batchBuffer = []
  }

  /**
   * Deliver chunk to consumers
   */
  private deliverChunk(chunk: StreamChunk): void {
    this.consumers.forEach(({ consumer, filter }) => {
      try {
        if (!filter || filter(chunk)) {
          consumer(chunk)
        }
      } catch (error) {
        console.error('Error delivering chunk to consumer:', error)
      }
    })
  }

  // ==================== Consumer Management ====================

  /**
   * Register a consumer
   */
  registerConsumer(
    id: string,
    consumer: StreamChunkConsumer,
    filter?: (chunk: StreamChunk) => boolean
  ): () => void {
    this.consumers.set(id, { id, consumer, filter })
    
    return () => {
      this.consumers.delete(id)
    }
  }

  /**
   * Unregister a consumer
   */
  unregisterConsumer(id: string): void {
    this.consumers.delete(id)
  }

  /**
   * Get registered consumer IDs
   */
  getConsumerIds(): string[] {
    return Array.from(this.consumers.keys())
  }

  // ==================== State Management ====================

  /**
   * Update sync status
   */
  private setStatus(status: SyncStatus): void {
    this.status = status
    this.notifyStateListeners()
  }

  /**
   * Set sync error
   */
  setError(code: string, message: string): void {
    this.setStatus('error')
    this.pendingChunks.push({
      type: 'error',
      sessionId: this.sessionId,
      messageId: '',
      error: { code: code as ErrorCode, message },
      timestamp: Date.now(),
    })
  }

  /**
   * Clear error
   */
  clearError(): void {
    if (this.status === 'error') {
      this.setStatus('connected')
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      sessionId: this.sessionId,
      status: this.status,
      lastSequence: this.lastSequence,
      lastSyncTime: this.lastSyncTime,
      pendingChunks: [...this.pendingChunks],
      error: this.status === 'error' ? {
        code: 'SYNC_ERROR',
        message: 'Sync error occurred',
        timestamp: Date.now(),
      } : undefined,
    }
  }

  // ==================== State Listeners ====================

  /**
   * Add state listener
   */
  addStateListener(listener: SyncStateListener): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Notify all state listeners
   */
  private notifyStateListeners(): void {
    const state = this.getState()
    this.stateListeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  // ==================== Pending Chunks Management ====================

  /**
   * Get pending chunks
   */
  getPendingChunks(): StreamChunk[] {
    return [...this.pendingChunks]
  }

  /**
   * Clear pending chunks
   */
  clearPendingChunks(): void {
    this.pendingChunks = []
  }

  /**
   * Add pending chunk (for replay)
   */
  addPendingChunk(chunk: StreamChunk): void {
    this.pendingChunks.push(chunk)
    if (this.pendingChunks.length > this.maxPendingChunks) {
      this.pendingChunks.shift()
    }
  }

  // ==================== Statistics ====================

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    // Calculate average latency
    const avgLatency = this.latencySamples.length > 0
      ? this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length
      : 0

    // Calculate chunks per second
    const uptime = Date.now() - (this.lastSyncTime || Date.now())
    const chunksPerSecond = uptime > 0 ? (this.stats.totalChunks / (uptime / 1000)) : 0

    return {
      ...this.stats,
      averageLatency: Math.round(avgLatency * 100) / 100,
      chunksPerSecond: Math.round(chunksPerSecond * 100) / 100,
      bufferUsage: this.pendingChunks.length / this.maxPendingChunks,
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      totalChunks: 0,
      chunksPerSecond: 0,
      averageLatency: 0,
      bufferUsage: 0,
      lastSyncDuration: 0,
    }
    this.latencySamples = []
  }

  // ==================== Getters ====================

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Get event emitter
   */
  getEventEmitter(): RuntimeEventEmitter {
    return this.eventEmitter
  }

  /**
   * Get current status
   */
  getStatus(): SyncStatus {
    return this.status
  }

  /**
   * Get last sequence number
   */
  getLastSequence(): number {
    return this.lastSequence
  }
}

// ==================== Helper Functions ====================

/**
 * Create a sync engine
 */
export function createSyncEngine(
  sessionId: string,
  options?: Partial<SyncEngineConfig>
): SyncEngine {
  return new SyncEngine({
    sessionId,
    ...options,
  })
}

/**
 * Create a message sync snapshot
 */
export function createMessageSnapshot(
  message: Message,
  sessionId: string
): StreamChunk[] {
  const chunks: StreamChunk[] = []
  const timestamp = Date.now()

  // Message start chunk
  chunks.push({
    type: 'message_start',
    sessionId,
    messageId: message.id,
    message,
    timestamp,
  })

  // Part chunks
  message.parts.forEach(part => {
    chunks.push({
      type: 'part_start',
      sessionId,
      messageId: message.id,
      partId: part.id,
      part,
      timestamp,
    })
    chunks.push({
      type: 'part_end',
      sessionId,
      messageId: message.id,
      partId: part.id,
      part,
      timestamp,
    })
  })

  // Message end chunk
  chunks.push({
    type: 'message_end',
    sessionId,
    messageId: message.id,
    message,
    timestamp,
  })

  return chunks
}

/**
 * Sync serialized messages
 */
export function syncSerializedMessages(
  messages: SerializedMessage[],
  consumer: StreamChunkConsumer,
  sessionId: string
): void {
  messages.forEach(serialized => {
    const message: Message = {
      ...serialized,
      parts: serialized.parts.map(sp => ({
        id: sp.id,
        type: sp.type as PartType,
        createdAt: sp.createdAt,
        ...sp.data,
        metadata: sp.metadata,
      } as Part)),
    }

    const chunks = createMessageSnapshot(message, sessionId)
    chunks.forEach(consumer)
  })
}
