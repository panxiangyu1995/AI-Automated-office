/**
 * Reconnect Handler - Handle Reconnect and Replay for Active Sessions
 * Task 62: Story 43.3 - Streaming Output and Status Sync
 * 
 * This module provides reconnection and replay capabilities for active sessions.
 */

import type { RuntimeEvent } from './runtimeEvents'
import type { SyncState, SyncStateListener } from './syncEngine'
import { SyncEngine } from './syncEngine'

// ==================== Reconnect State Types ====================

/**
 * Reconnect status
 */
export type ReconnectStatus =
  | 'idle'
  | 'reconnecting'
  | 'replaying'
  | 'connected'
  | 'failed'
  | 'abandoned'

/**
 * Reconnect attempt record
 */
export interface ReconnectAttempt {
  id: string
  timestamp: number
  status: 'pending' | 'success' | 'failed'
  duration?: number
  eventsReplayed?: number
  error?: string
}

/**
 * Reconnect state
 */
export interface ReconnectState {
  status: ReconnectStatus
  sessionId: string
  attemptCount: number
  maxAttempts: number
  lastAttempt?: ReconnectAttempt
  lastSequence: number
  eventsSinceDisconnect: number
  reconnectStartTime?: number
  nextRetryDelay: number
}

/**
 * Reconnect configuration
 */
export interface ReconnectConfig {
  sessionId: string
  syncEngine: SyncEngine
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  replayBatchSize?: number
  statePersistence?: boolean
}

/**
 * Reconnect state listener
 */
export type ReconnectStateListener = (state: ReconnectState) => void

// ==================== Event Storage ====================

/**
 * Event storage interface
 */
export interface EventStorage {
  getEvents(sessionId: string): Promise<RuntimeEvent[]>
  getEventsSince(sessionId: string, sequence: number): Promise<RuntimeEvent[]>
  addEvent(sessionId: string, event: RuntimeEvent): Promise<void>
  clearEvents(sessionId: string): Promise<void>
}

/**
 * In-memory event storage
 */
export class InMemoryEventStorage implements EventStorage {
  private events: Map<string, RuntimeEvent[]> = new Map()

  async getEvents(sessionId: string): Promise<RuntimeEvent[]> {
    return this.events.get(sessionId) ?? []
  }

  async getEventsSince(sessionId: string, sequence: number): Promise<RuntimeEvent[]> {
    const events = this.events.get(sessionId) ?? []
    return events.filter(e => e.sequence > sequence)
  }

  async addEvent(sessionId: string, event: RuntimeEvent): Promise<void> {
    if (!this.events.has(sessionId)) {
      this.events.set(sessionId, [])
    }
    this.events.get(sessionId)!.push(event)
  }

  async clearEvents(sessionId: string): Promise<void> {
    this.events.delete(sessionId)
  }
}

// ==================== Reconnect Handler ====================

/**
 * Reconnect Handler
 * 
 * Manages reconnection and replay for active sessions.
 */
export class ReconnectHandler {
  private sessionId: string
  private syncEngine: SyncEngine
  private maxAttempts: number
  private baseDelay: number
  private maxDelay: number
  private backoffMultiplier: number
  private replayBatchSize: number
  private eventStorage: EventStorage

  private status: ReconnectStatus = 'idle'
  private attemptCount: number = 0
  private eventsSinceDisconnect: number = 0
  private reconnectStartTime?: number
  private nextRetryDelay: number

  private attempts: ReconnectAttempt[] = []
  private stateListeners: Set<ReconnectStateListener> = new Set()
  private syncStateUnsubscribe?: () => void
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private savedLastSequence: number = 0

  constructor(config: ReconnectConfig) {
    this.sessionId = config.sessionId
    this.syncEngine = config.syncEngine
    this.maxAttempts = config.maxAttempts ?? 5
    this.baseDelay = config.baseDelay ?? 1000
    this.maxDelay = config.maxDelay ?? 30000
    this.backoffMultiplier = config.backoffMultiplier ?? 2
    this.replayBatchSize = config.replayBatchSize ?? 50
    this.nextRetryDelay = this.baseDelay
    this.eventStorage = new InMemoryEventStorage()
  }

  // ==================== Lifecycle ====================

  /**
   * Initialize the reconnect handler
   */
  initialize(): void {
    // Subscribe to sync state changes
    this.syncStateUnsubscribe = this.syncEngine.addStateListener(
      this.handleSyncStateChange
    )
  }

  /**
   * Cleanup the reconnect handler
   */
  cleanup(): void {
    if (this.syncStateUnsubscribe) {
      this.syncStateUnsubscribe()
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
  }

  // ==================== State Change Handling ====================

  /**
   * Handle sync state changes
   */
  private handleSyncStateChange: SyncStateListener = (state: SyncState) => {
    switch (state.status) {
      case 'disconnected':
        this.handleDisconnect()
        break
      case 'connected':
        this.handleConnected()
        break
      case 'error':
        this.handleError(state)
        break
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    if (this.status === 'reconnecting' || this.status === 'replaying') return

    this.savedLastSequence = this.syncEngine.getLastSequence()
    this.setStatus('reconnecting')
    this.scheduleReconnect()
  }

  /**
   * Handle successful connection
   */
  private handleConnected(): void {
    if (this.status === 'replaying') {
      this.finishReconnect(true)
    } else {
      this.resetReconnect()
      this.setStatus('connected')
    }
  }

  /**
   * Handle error
   */
  private handleError(_state: SyncState): void {
    if (this.status === 'reconnecting') {
      // Another attempt failed
      this.attemptCount++
      if (this.attemptCount >= this.maxAttempts) {
        this.finishReconnect(false)
      } else {
        this.scheduleReconnect()
      }
    }
  }

  // ==================== Reconnection Logic ====================

  /**
   * Schedule a reconnect attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect()
    }, this.nextRetryDelay)

    // Calculate next delay with exponential backoff
    this.nextRetryDelay = Math.min(
      this.nextRetryDelay * this.backoffMultiplier,
      this.maxDelay
    )
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    const attemptId = this.generateAttemptId()
    const attempt: ReconnectAttempt = {
      id: attemptId,
      timestamp: Date.now(),
      status: 'pending',
    }
    this.attempts.push(attempt)
    this.reconnectStartTime = Date.now()

    try {
      // Start sync engine
      this.syncEngine.start()

      // Wait for connection
      await this.waitForConnection()

      // Start replay if we have saved sequence
      if (this.savedLastSequence > 0) {
        await this.replayEvents()
      }

      // Success
      attempt.status = 'success'
      attempt.duration = Date.now() - attempt.timestamp
      attempt.eventsReplayed = this.eventsSinceDisconnect

    } catch (error) {
      attempt.status = 'failed'
      attempt.error = error instanceof Error ? error.message : 'Unknown error'
      attempt.duration = Date.now() - attempt.timestamp

      // Check if we should retry
      if (this.attemptCount < this.maxAttempts) {
        this.scheduleReconnect()
      } else {
        this.finishReconnect(false)
      }
    }
  }

  /**
   * Wait for connection
   */
  private async waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()

      const checkConnection = () => {
        const status = this.syncEngine.getStatus()
        if (status === 'connected' || status === 'syncing' || status === 'synced') {
          resolve()
          return
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error('Connection timeout'))
          return
        }

        setTimeout(checkConnection, 100)
      }

      checkConnection()
    })
  }

  // ==================== Replay Logic ====================

  /**
   * Replay events since disconnect
   */
  private async replayEvents(): Promise<void> {
    this.setStatus('replaying')

    try {
      // Get events since last saved sequence
      const events = await this.eventStorage.getEventsSince(
        this.sessionId,
        this.savedLastSequence
      )

      this.eventsSinceDisconnect = events.length

      // Replay in batches
      for (let i = 0; i < events.length; i += this.replayBatchSize) {
        const batch = events.slice(i, i + this.replayBatchSize)
        await this.replayBatch(batch)
      }

    } catch (error) {
      console.error('Error during replay:', error)
      throw error
    }
  }

  /**
   * Replay a batch of events
   */
  private async replayBatch(events: RuntimeEvent[]): Promise<void> {
    // Get pending chunks from sync engine
    const pendingChunks = this.syncEngine.getPendingChunks()

    // Deliver each chunk to consumers
    for (const event of events) {
      // Store event for potential future replays
      await this.eventStorage.addEvent(this.sessionId, event)
    }

    // Process pending chunks
    pendingChunks.forEach(chunk => {
      this.syncEngine.addPendingChunk(chunk)
    })
  }

  // ==================== State Management ====================

  /**
   * Set reconnect status
   */
  private setStatus(status: ReconnectStatus): void {
    this.status = status
    this.notifyStateListeners()
  }

  /**
   * Finish reconnect
   */
  private finishReconnect(success: boolean): void {
    if (success) {
      this.resetReconnect()
      this.setStatus('connected')
    } else {
      this.setStatus('failed')
    }
  }

  /**
   * Reset reconnect state
   */
  private resetReconnect(): void {
    this.attemptCount = 0
    this.nextRetryDelay = this.baseDelay
    this.eventsSinceDisconnect = 0
    this.reconnectStartTime = undefined
  }

  /**
   * Abandon reconnection
   */
  abandon(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.setStatus('abandoned')
  }

  // ==================== State Listeners ====================

  /**
   * Add state listener
   */
  addStateListener(listener: ReconnectStateListener): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Notify state listeners
   */
  private notifyStateListeners(): void {
    const state = this.getState()
    this.stateListeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in reconnect state listener:', error)
      }
    })
  }

  // ==================== Getters ====================

  /**
   * Get current state
   */
  getState(): ReconnectState {
    return {
      status: this.status,
      sessionId: this.sessionId,
      attemptCount: this.attemptCount,
      maxAttempts: this.maxAttempts,
      lastAttempt: this.attempts[this.attempts.length - 1],
      lastSequence: this.syncEngine.getLastSequence(),
      eventsSinceDisconnect: this.eventsSinceDisconnect,
      reconnectStartTime: this.reconnectStartTime,
      nextRetryDelay: this.nextRetryDelay,
    }
  }

  /**
   * Get all attempts
   */
  getAttempts(): ReconnectAttempt[] {
    return [...this.attempts]
  }

  /**
   * Get event storage
   */
  getEventStorage(): EventStorage {
    return this.eventStorage
  }

  // ==================== Utilities ====================

  /**
   * Generate attempt ID
   */
  private generateAttemptId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

// ==================== Helper Functions ====================

/**
 * Create a reconnect handler
 */
export function createReconnectHandler(
  sessionId: string,
  syncEngine: SyncEngine,
  options?: Partial<ReconnectConfig>
): ReconnectHandler {
  return new ReconnectHandler({
    sessionId,
    syncEngine,
    ...options,
  })
}

/**
 * Calculate next retry delay
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  multiplier: number = 2
): number {
  const delay = baseDelay * Math.pow(multiplier, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Check if reconnect is needed
 */
export function isReconnectNeeded(
  syncState: SyncState,
  lastKnownSequence: number
): boolean {
  return (
    syncState.status === 'disconnected' ||
    syncState.status === 'error' ||
    syncState.lastSequence < lastKnownSequence
  )
}

/**
 * Get events to replay
 */
export async function getEventsToReplay(
  storage: EventStorage,
  sessionId: string,
  fromSequence: number
): Promise<RuntimeEvent[]> {
  return storage.getEventsSince(sessionId, fromSequence)
}

/**
 * Persist reconnect state
 */
export function persistReconnectState(
  state: ReconnectState,
  key: string = 'reconnect_state'
): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      sessionId: state.sessionId,
      lastSequence: state.lastSequence,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.warn('Failed to persist reconnect state:', error)
  }
}

/**
 * Restore reconnect state
 */
export function restoreReconnectState(
  key: string = 'reconnect_state'
): { sessionId: string; lastSequence: number; timestamp: number } | null {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.warn('Failed to restore reconnect state:', error)
    return null
  }
}
