/**
 * Runtime Events - Ordered Event Emission During Execution
 * Task 62: Story 43.3 - Streaming Output and Status Sync
 * 
 * This module provides ordered runtime event emission for streaming output.
 */

import type { Message, Part, StreamChunk, ErrorCode } from '../../message/runtime/messageModel'

// ==================== Event Types ====================

/**
 * Runtime event type
 */
export type RuntimeEventType =
  | 'session_start'
  | 'session_end'
  | 'message_start'
  | 'message_end'
  | 'part_start'
  | 'part_delta'
  | 'part_end'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'warning'
  | 'debug'

/**
 * Base runtime event
 */
export interface BaseRuntimeEvent {
  id: string
  type: RuntimeEventType
  sessionId: string
  timestamp: number
  sequence: number
}

/**
 * Session start event
 */
export interface SessionStartEvent extends BaseRuntimeEvent {
  type: 'session_start'
  metadata?: {
    model?: string
    provider?: string
    userId?: string
  }
}

/**
 * Session end event
 */
export interface SessionEndEvent extends BaseRuntimeEvent {
  type: 'session_end'
  reason: 'completed' | 'cancelled' | 'error' | 'timeout'
  duration: number
}

/**
 * Message start event
 */
export interface MessageStartEvent extends BaseRuntimeEvent {
  type: 'message_start'
  messageId: string
  message: Message
}

/**
 * Message end event
 */
export interface MessageEndEvent extends BaseRuntimeEvent {
  type: 'message_end'
  messageId: string
  message: Message
}

/**
 * Part start event
 */
export interface PartStartEvent extends BaseRuntimeEvent {
  type: 'part_start'
  messageId: string
  partId: string
  part: Part
}

/**
 * Part delta event (for streaming text)
 */
export interface PartDeltaEvent extends BaseRuntimeEvent {
  type: 'part_delta'
  messageId: string
  partId: string
  delta: string
}

/**
 * Part end event
 */
export interface PartEndEvent extends BaseRuntimeEvent {
  type: 'part_end'
  messageId: string
  partId: string
  part: Part
}

/**
 * Tool call event
 */
export interface ToolCallEvent extends BaseRuntimeEvent {
  type: 'tool_call'
  messageId: string
  toolId: string
  toolName: string
  parameters: Record<string, unknown>
}

/**
 * Tool result event
 */
export interface ToolResultEvent extends BaseRuntimeEvent {
  type: 'tool_result'
  messageId: string
  toolId: string
  result: unknown
  success: boolean
  duration?: number
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseRuntimeEvent {
  type: 'error'
  messageId?: string
  code: ErrorCode
  message: string
  recoverable: boolean
}

/**
 * Warning event
 */
export interface WarningEvent extends BaseRuntimeEvent {
  type: 'warning'
  messageId?: string
  message: string
}

/**
 * Debug event
 */
export interface DebugEvent extends BaseRuntimeEvent {
  type: 'debug'
  messageId?: string
  data: Record<string, unknown>
}

/**
 * All runtime events union
 */
export type RuntimeEvent =
  | SessionStartEvent
  | SessionEndEvent
  | MessageStartEvent
  | MessageEndEvent
  | PartStartEvent
  | PartDeltaEvent
  | PartEndEvent
  | ToolCallEvent
  | ToolResultEvent
  | ErrorEvent
  | WarningEvent
  | DebugEvent

// ==================== Event Listener Types ====================

/**
 * Event listener function
 */
export type RuntimeEventListener = (event: RuntimeEvent) => void

/**
 * Event filter function
 */
export type EventFilter = (event: RuntimeEvent) => boolean

// ==================== Event Emitter ====================

/**
 * Runtime event emitter configuration
 */
export interface RuntimeEventEmitterConfig {
  sessionId: string
  bufferSize?: number
  enableDebug?: boolean
}

/**
 * Runtime event emitter
 * 
 * Provides ordered event emission with buffering and replay capabilities.
 */
export class RuntimeEventEmitter {
  private sessionId: string
  private sequence: number = 0
  private buffer: RuntimeEvent[] = []
  private bufferSize: number
  private listeners: Map<string, Set<RuntimeEventListener>> = new Map()
  private enabled: boolean = true
  private enableDebug: boolean

  constructor(config: RuntimeEventEmitterConfig) {
    this.sessionId = config.sessionId
    this.bufferSize = config.bufferSize ?? 1000
    this.enableDebug = config.enableDebug ?? false
  }

  /**
   * Generate a unique event ID
   */
  private generateId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Get next sequence number
   */
  private nextSequence(): number {
    return ++this.sequence
  }

  /**
   * Create base event properties
   */
  private createBase(): Omit<BaseRuntimeEvent, 'type'> {
    return {
      id: this.generateId(),
      sessionId: this.sessionId,
      timestamp: Date.now(),
      sequence: this.nextSequence(),
    }
  }

  /**
   * Emit an event
   */
  private emit(event: RuntimeEvent): void {
    if (!this.enabled) return

    // Add to buffer
    this.buffer.push(event)
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift()
    }

    // Notify listeners
    const typeListeners = this.listeners.get(event.type)
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error)
        }
      })
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*')
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in wildcard event listener:', error)
        }
      })
    }

    // Debug logging
    if (this.enableDebug) {
      console.debug(`[RuntimeEvent] ${event.type} #${event.sequence}`, event)
    }
  }

  // ==================== Event Creation Methods ====================

  /**
   * Emit session start event
   */
  emitSessionStart(metadata?: SessionStartEvent['metadata']): SessionStartEvent {
    const base = this.createBase()
    const event: SessionStartEvent = {
      ...base,
      type: 'session_start',
      metadata,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit session end event
   */
  emitSessionEnd(reason: SessionEndEvent['reason'], duration: number): SessionEndEvent {
    const base = this.createBase()
    const event: SessionEndEvent = {
      ...base,
      type: 'session_end',
      reason,
      duration,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit message start event
   */
  emitMessageStart(messageId: string, message: Message): MessageStartEvent {
    const base = this.createBase()
    const event: MessageStartEvent = {
      ...base,
      type: 'message_start',
      messageId,
      message,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit message end event
   */
  emitMessageEnd(messageId: string, message: Message): MessageEndEvent {
    const base = this.createBase()
    const event: MessageEndEvent = {
      ...base,
      type: 'message_end',
      messageId,
      message,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit part start event
   */
  emitPartStart(messageId: string, part: Part): PartStartEvent {
    const base = this.createBase()
    const event: PartStartEvent = {
      ...base,
      type: 'part_start',
      messageId,
      partId: part.id,
      part,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit part delta event (for streaming text)
   */
  emitPartDelta(messageId: string, partId: string, delta: string): PartDeltaEvent {
    const base = this.createBase()
    const event: PartDeltaEvent = {
      ...base,
      type: 'part_delta',
      messageId,
      partId,
      delta,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit part end event
   */
  emitPartEnd(messageId: string, part: Part): PartEndEvent {
    const base = this.createBase()
    const event: PartEndEvent = {
      ...base,
      type: 'part_end',
      messageId,
      partId: part.id,
      part,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit tool call event
   */
  emitToolCall(
    messageId: string,
    toolId: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): ToolCallEvent {
    const base = this.createBase()
    const event: ToolCallEvent = {
      ...base,
      type: 'tool_call',
      messageId,
      toolId,
      toolName,
      parameters,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit tool result event
   */
  emitToolResult(
    messageId: string,
    toolId: string,
    result: unknown,
    success: boolean,
    duration?: number
  ): ToolResultEvent {
    const base = this.createBase()
    const event: ToolResultEvent = {
      ...base,
      type: 'tool_result',
      messageId,
      toolId,
      result,
      success,
      duration,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit error event
   */
  emitError(
    code: ErrorCode,
    message: string,
    recoverable: boolean,
    messageId?: string
  ): ErrorEvent {
    const base = this.createBase()
    const event: ErrorEvent = {
      ...base,
      type: 'error',
      messageId,
      code,
      message,
      recoverable,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit warning event
   */
  emitWarning(message: string, messageId?: string): WarningEvent {
    const base = this.createBase()
    const event: WarningEvent = {
      ...base,
      type: 'warning',
      messageId,
      message,
    }
    this.emit(event)
    return event
  }

  /**
   * Emit debug event
   */
  emitDebug(data: Record<string, unknown>, messageId?: string): DebugEvent {
    const base = this.createBase()
    const event: DebugEvent = {
      ...base,
      type: 'debug',
      messageId,
      data,
    }
    this.emit(event)
    return event
  }

  // ==================== Listener Management ====================

  /**
   * Add event listener
   * 
   * @param type - Event type or '*' for all events
   * @param listener - Listener function
   * @returns Unsubscribe function
   */
  addEventListener(type: RuntimeEventType | '*', listener: RuntimeEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
    
    return () => {
      this.listeners.get(type)?.delete(listener)
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: RuntimeEventType | '*', listener: RuntimeEventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  /**
   * Add filtered event listener
   */
  addFilteredListener(
    filter: EventFilter,
    listener: RuntimeEventListener
  ): () => void {
    const wrapper: RuntimeEventListener = (event) => {
      if (filter(event)) {
        listener(event)
      }
    }
    return this.addEventListener('*', wrapper)
  }

  // ==================== Buffer Management ====================

  /**
   * Get buffered events
   */
  getBuffer(): RuntimeEvent[] {
    return [...this.buffer]
  }

  /**
   * Get events since a sequence number
   */
  getEventsSince(sequence: number): RuntimeEvent[] {
    return this.buffer.filter(e => e.sequence > sequence)
  }

  /**
   * Get events in a sequence range
   */
  getEventsInRange(startSeq: number, endSeq: number): RuntimeEvent[] {
    return this.buffer.filter(e => e.sequence >= startSeq && e.sequence <= endSeq)
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.buffer = []
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(): number {
    return this.sequence
  }

  // ==================== Control Methods ====================

  /**
   * Enable or disable event emission
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Check if emitter is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }
}

// ==================== Helper Functions ====================

/**
 * Create a runtime event emitter
 */
export function createRuntimeEventEmitter(
  sessionId: string,
  options?: Partial<RuntimeEventEmitterConfig>
): RuntimeEventEmitter {
  return new RuntimeEventEmitter({
    sessionId,
    ...options,
  })
}

/**
 * Convert runtime event to stream chunk
 */
export function eventToStreamChunk(event: RuntimeEvent): StreamChunk | null {
  const base = {
    sessionId: event.sessionId,
    timestamp: event.timestamp,
  }

  switch (event.type) {
    case 'message_start':
      return {
        type: 'message_start',
        ...base,
        messageId: event.messageId,
        message: event.message,
      }

    case 'message_end':
      return {
        type: 'message_end',
        ...base,
        messageId: event.messageId,
        message: event.message,
      }

    case 'part_start':
      return {
        type: 'part_start',
        ...base,
        messageId: event.messageId,
        partId: event.partId,
        part: event.part,
      }

    case 'part_delta':
      return {
        type: 'part_delta',
        ...base,
        messageId: event.messageId,
        partId: event.partId,
        delta: event.delta,
      }

    case 'part_end':
      return {
        type: 'part_end',
        ...base,
        messageId: event.messageId,
        partId: event.partId,
        part: event.part,
      }

    case 'error':
      return {
        type: 'error',
        ...base,
        messageId: event.messageId ?? '',
        error: {
          code: event.code,
          message: event.message,
        },
      }

    default:
      return null
  }
}

/**
 * Filter events by type
 */
export function filterEventsByType(
  events: RuntimeEvent[],
  ...types: RuntimeEventType[]
): RuntimeEvent[] {
  return events.filter(e => types.includes(e.type))
}

/**
 * Filter events by message
 */
export function filterEventsByMessage(
  events: RuntimeEvent[],
  messageId: string
): RuntimeEvent[] {
  return events.filter(e => {
    const eventWithMessage = e as Partial<MessageStartEvent>
    return eventWithMessage.messageId === messageId
  })
}
