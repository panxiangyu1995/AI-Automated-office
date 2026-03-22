/**
 * Streaming Output and Status Sync Tests
 * Task 62: Story 43.3 - Streaming Output and Status Sync
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  RuntimeEventEmitter,
  createRuntimeEventEmitter,
  eventToStreamChunk,
  filterEventsByType,
  filterEventsByMessage,
} from '@/features/streaming/runtime'
import {
  SyncEngine,
  createSyncEngine,
  createMessageSnapshot,
} from '@/features/streaming/runtime'
import {
  ReconnectHandler,
  InMemoryEventStorage,
  createReconnectHandler,
  calculateRetryDelay,
  isReconnectNeeded,
} from '@/features/streaming/runtime'
import type { RuntimeEvent, Message, Part } from '@/features/message/runtime'

// ==================== Test Data ====================

const createTestMessage = (id: string = 'msg-1', parts: Part[] = []): Message => ({
  id,
  sessionId: 'session-1',
  role: 'assistant',
  status: 'complete',
  parts,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

const createTestPart = (id: string = 'part-1'): Part => ({
  id,
  type: 'text',
  content: 'Hello world',
  createdAt: Date.now(),
})

// ==================== Runtime Event Emitter Tests ====================

describe('RuntimeEventEmitter', () => {
  let emitter: RuntimeEventEmitter

  beforeEach(() => {
    emitter = new RuntimeEventEmitter({ sessionId: 'test-session' })
  })

  describe('constructor', () => {
    it('should create emitter with session ID', () => {
      expect(emitter).toBeDefined()
      expect(emitter.getSessionId()).toBe('test-session')
    })

    it('should accept optional config', () => {
      const customEmitter = new RuntimeEventEmitter({
        sessionId: 'custom-session',
        bufferSize: 100,
        enabled: false,
      })
      expect(customEmitter).toBeDefined()
    })
  })

  describe('event emission', () => {
    it('should emit session start event', () => {
      const listener = vi.fn()
      emitter.addEventListener('session_start', listener)

      const event = emitter.emitSessionStart({ model: 'gpt-4' })

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('session_start')
      expect(event.sessionId).toBe('test-session')
      expect(event.metadata?.model).toBe('gpt-4')
    })

    it('should emit session end event', () => {
      const listener = vi.fn()
      emitter.addEventListener('session_end', listener)

      const event = emitter.emitSessionEnd('completed', 5000)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('session_end')
      expect(event.reason).toBe('completed')
      expect(event.duration).toBe(5000)
    })

    it('should emit message start event', () => {
      const listener = vi.fn()
      emitter.addEventListener('message_start', listener)

      const message = createTestMessage()
      const event = emitter.emitMessageStart('msg-1', message)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('message_start')
      expect(event.messageId).toBe('msg-1')
      expect(event.message).toEqual(message)
    })

    it('should emit message end event', () => {
      const listener = vi.fn()
      emitter.addEventListener('message_end', listener)

      const message = createTestMessage()
      const event = emitter.emitMessageEnd('msg-1', message)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('message_end')
      expect(event.messageId).toBe('msg-1')
    })

    it('should emit part start event', () => {
      const listener = vi.fn()
      emitter.addEventListener('part_start', listener)

      const part = createTestPart()
      const event = emitter.emitPartStart('msg-1', part)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('part_start')
      expect(event.messageId).toBe('msg-1')
      expect(event.partId).toBe('part-1')
    })

    it('should emit part delta event', () => {
      const listener = vi.fn()
      emitter.addEventListener('part_delta', listener)

      const event = emitter.emitPartDelta('msg-1', 'part-1', 'Hello')

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('part_delta')
      expect(event.delta).toBe('Hello')
    })

    it('should emit part end event', () => {
      const listener = vi.fn()
      emitter.addEventListener('part_end', listener)

      const part = createTestPart()
      const event = emitter.emitPartEnd('msg-1', part)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('part_end')
    })

    it('should emit tool call event', () => {
      const listener = vi.fn()
      emitter.addEventListener('tool_call', listener)

      const event = emitter.emitToolCall('msg-1', 'tool-1', 'read_file', { path: '/test' })

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('tool_call')
      expect(event.toolId).toBe('tool-1')
      expect(event.toolName).toBe('read_file')
    })

    it('should emit tool result event', () => {
      const listener = vi.fn()
      emitter.addEventListener('tool_result', listener)

      const event = emitter.emitToolResult('msg-1', 'tool-1', 'file content', true, 100)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('tool_result')
      expect(event.result).toBe('file content')
      expect(event.success).toBe(true)
    })

    it('should emit error event', () => {
      const listener = vi.fn()
      emitter.addEventListener('error', listener)

      const event = emitter.emitError('UNKNOWN_ERROR', 'Something went wrong', true)

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('error')
      expect(event.code).toBe('UNKNOWN_ERROR')
      expect(event.recoverable).toBe(true)
    })

    it('should emit warning event', () => {
      const listener = vi.fn()
      emitter.addEventListener('warning', listener)

      const event = emitter.emitWarning('This is a warning')

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('warning')
      expect(event.message).toBe('This is a warning')
    })

    it('should emit debug event', () => {
      const listener = vi.fn()
      emitter.addEventListener('debug', listener)

      const event = emitter.emitDebug({ key: 'value' })

      expect(listener).toHaveBeenCalledWith(event)
      expect(event.type).toBe('debug')
      expect(event.data).toEqual({ key: 'value' })
    })
  })

  describe('listener management', () => {
    it('should support wildcard listener', () => {
      const listener = vi.fn()
      emitter.addEventListener('*', listener)

      emitter.emitSessionStart()
      emitter.emitSessionEnd('completed', 1000)

      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = emitter.addEventListener('session_start', listener)

      emitter.emitSessionStart()
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      emitter.emitSessionStart()
      expect(listener).toHaveBeenCalledTimes(1) // Not called again
    })

    it('should remove listener', () => {
      const listener = vi.fn()
      emitter.addEventListener('session_start', listener)

      emitter.emitSessionStart()
      expect(listener).toHaveBeenCalledTimes(1)

      emitter.removeEventListener('session_start', listener)
      emitter.emitSessionStart()
      expect(listener).toHaveBeenCalledTimes(1) // Not called again
    })
  })

  describe('buffer management', () => {
    it('should buffer events', () => {
      emitter.emitSessionStart()
      emitter.emitSessionEnd('completed', 1000)

      const buffer = emitter.getBuffer()
      expect(buffer).toHaveLength(2)
    })

    it('should get events since sequence', () => {
      emitter.emitSessionStart()
      emitter.emitSessionEnd('completed', 1000)
      emitter.emitSessionStart()

      const events = emitter.getEventsSince(2)
      expect(events).toHaveLength(1)
      expect(events[0].sequence).toBe(3)
    })

    it('should clear buffer', () => {
      emitter.emitSessionStart()
      emitter.emitSessionEnd('completed', 1000)

      emitter.clearBuffer()
      expect(emitter.getBuffer()).toHaveLength(0)
    })
  })

  describe('enable/disable', () => {
    it('should be enabled by default', () => {
      expect(emitter.isEnabled()).toBe(true)
    })

    it('should not emit when disabled', () => {
      emitter.setEnabled(false)
      const listener = vi.fn()
      emitter.addEventListener('session_start', listener)

      emitter.emitSessionStart()
      expect(listener).not.toHaveBeenCalled()
    })

    it('should toggle enabled state', () => {
      emitter.setEnabled(false)
      expect(emitter.isEnabled()).toBe(false)

      emitter.setEnabled(true)
      expect(emitter.isEnabled()).toBe(true)
    })
  })
})

// ==================== Helper Function Tests ====================

describe('helper functions', () => {
  describe('createRuntimeEventEmitter', () => {
    it('should create emitter with options', () => {
      const emitter = createRuntimeEventEmitter('session-1', { bufferSize: 50 })
      expect(emitter).toBeInstanceOf(RuntimeEventEmitter)
      expect(emitter.getSessionId()).toBe('session-1')
    })
  })

  describe('eventToStreamChunk', () => {
    it('should convert message_start event to chunk', () => {
      const emitter = new RuntimeEventEmitter({ sessionId: 'test' })
      const message = createTestMessage()
      const event = emitter.emitMessageStart('msg-1', message)
      const chunk = eventToStreamChunk(event)

      expect(chunk).toBeDefined()
      expect(chunk?.type).toBe('message_start')
      expect(chunk?.messageId).toBe('msg-1')
    })

    it('should convert part_delta event to chunk', () => {
      const emitter = new RuntimeEventEmitter({ sessionId: 'test' })
      const event = emitter.emitPartDelta('msg-1', 'part-1', 'Hello')
      const chunk = eventToStreamChunk(event)

      expect(chunk).toBeDefined()
      expect(chunk?.type).toBe('part_delta')
      expect(chunk?.delta).toBe('Hello')
    })

    it('should return null for unsupported event types', () => {
      const emitter = new RuntimeEventEmitter({ sessionId: 'test' })
      const event = emitter.emitWarning('test')
      // Warning doesn't convert to a stream chunk
      const chunk = eventToStreamChunk(event as any)
      expect(chunk).toBeNull()
    })
  })

  describe('filterEventsByType', () => {
    it('should filter events by type', () => {
      const emitter = new RuntimeEventEmitter({ sessionId: 'test' })
      emitter.emitSessionStart()
      emitter.emitSessionEnd('completed', 1000)
      emitter.emitSessionStart()

      const buffer = emitter.getBuffer()
      const filtered = filterEventsByType(buffer, 'session_start')

      expect(filtered).toHaveLength(2)
    })
  })

  describe('filterEventsByMessage', () => {
    it('should filter events by message ID', () => {
      const emitter = new RuntimeEventEmitter({ sessionId: 'test' })
      const message = createTestMessage()
      emitter.emitMessageStart('msg-1', message)
      emitter.emitMessageEnd('msg-1', message)
      emitter.emitMessageStart('msg-2', message)

      const buffer = emitter.getBuffer()
      const filtered = filterEventsByMessage(buffer, 'msg-1')

      expect(filtered).toHaveLength(2)
    })
  })
})

// ==================== Sync Engine Tests ====================

describe('SyncEngine', () => {
  let syncEngine: SyncEngine

  beforeEach(() => {
    syncEngine = createSyncEngine('test-session')
  })

  describe('lifecycle', () => {
    it('should start and stop', () => {
      expect(syncEngine.getStatus()).toBe('disconnected')

      syncEngine.start()
      expect(syncEngine.getStatus()).toBe('connected')

      syncEngine.stop()
      expect(syncEngine.getStatus()).toBe('disconnected')
    })
  })

  describe('consumer management', () => {
    it('should register consumers', () => {
      const consumer = vi.fn()
      const unregister = syncEngine.registerConsumer('consumer-1', consumer)

      expect(syncEngine.getConsumerIds()).toContain('consumer-1')

      unregister()
      expect(syncEngine.getConsumerIds()).not.toContain('consumer-1')
    })

    it('should unregister consumers', () => {
      const consumer = vi.fn()
      syncEngine.registerConsumer('consumer-1', consumer)

      expect(syncEngine.getConsumerIds()).toContain('consumer-1')

      syncEngine.unregisterConsumer('consumer-1')
      expect(syncEngine.getConsumerIds()).not.toContain('consumer-1')
    })

    it('should support filtered consumers', () => {
      const consumer = vi.fn()
      const filter = (chunk: any) => chunk.type === 'message_start'
      syncEngine.registerConsumer('consumer-1', consumer, filter)
      syncEngine.start()

      // The consumer is registered with a filter
      expect(syncEngine.getConsumerIds()).toContain('consumer-1')
    })
  })

  describe('state management', () => {
    it('should provide sync state', () => {
      const state = syncEngine.getState()
      expect(state.sessionId).toBe('test-session')
      expect(state.status).toBe('disconnected')
    })

    it('should notify state listeners', () => {
      const listener = vi.fn()
      syncEngine.addStateListener(listener)

      syncEngine.start()
      expect(listener).toHaveBeenCalled()
    })
  })

  describe('statistics', () => {
    it('should provide stats', () => {
      const stats = syncEngine.getStats()
      expect(stats.totalEvents).toBe(0)
      expect(stats.totalChunks).toBe(0)
    })

    it('should reset stats', () => {
      syncEngine.resetStats()
      const stats = syncEngine.getStats()
      expect(stats.totalEvents).toBe(0)
    })
  })

  describe('pending chunks', () => {
    it('should manage pending chunks', () => {
      const chunk = {
        type: 'message_start' as const,
        sessionId: 'test-session',
        messageId: 'msg-1',
        timestamp: Date.now(),
      }

      syncEngine.addPendingChunk(chunk)
      expect(syncEngine.getPendingChunks()).toHaveLength(1)

      syncEngine.clearPendingChunks()
      expect(syncEngine.getPendingChunks()).toHaveLength(0)
    })
  })
})

// ==================== Reconnect Handler Tests ====================

describe('ReconnectHandler', () => {
  let syncEngine: SyncEngine
  let reconnectHandler: ReconnectHandler

  beforeEach(() => {
    syncEngine = createSyncEngine('test-session')
    reconnectHandler = createReconnectHandler('test-session', syncEngine)
  })

  describe('lifecycle', () => {
    it('should initialize and cleanup', () => {
      reconnectHandler.initialize()
      const state = reconnectHandler.getState()
      expect(state.sessionId).toBe('test-session')

      reconnectHandler.cleanup()
    })
  })

  describe('state', () => {
    it('should provide reconnect state', () => {
      const state = reconnectHandler.getState()
      expect(state.status).toBe('idle')
      expect(state.attemptCount).toBe(0)
    })

    it('should track attempts', () => {
      const attempts = reconnectHandler.getAttempts()
      expect(attempts).toHaveLength(0)
    })
  })

  describe('abandon', () => {
    it('should abandon reconnection', () => {
      reconnectHandler.abandon()
      const state = reconnectHandler.getState()
      expect(state.status).toBe('abandoned')
    })
  })
})

// ==================== InMemoryEventStorage Tests ====================

describe('InMemoryEventStorage', () => {
  let storage: InMemoryEventStorage

  beforeEach(() => {
    storage = new InMemoryEventStorage()
  })

  it('should store and retrieve events', async () => {
    const event = {
      id: 'event-1',
      type: 'session_start' as const,
      sessionId: 'session-1',
      timestamp: Date.now(),
      sequence: 1,
    }

    await storage.addEvent('session-1', event)
    const events = await storage.getEvents('session-1')

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual(event)
  })

  it('should get events since sequence', async () => {
    const events = [
      { id: '1', type: 'session_start' as const, sessionId: 's1', timestamp: 1, sequence: 1 },
      { id: '2', type: 'session_end' as const, sessionId: 's1', timestamp: 2, sequence: 2 },
      { id: '3', type: 'session_start' as const, sessionId: 's1', timestamp: 3, sequence: 3 },
    ]

    for (const event of events) {
      await storage.addEvent('s1', event)
    }

    const since = await storage.getEventsSince('s1', 1)
    expect(since).toHaveLength(2)
  })

  it('should clear events', async () => {
    const event = {
      id: 'event-1',
      type: 'session_start' as const,
      sessionId: 'session-1',
      timestamp: Date.now(),
      sequence: 1,
    }

    await storage.addEvent('session-1', event)
    await storage.clearEvents('session-1')
    const events = await storage.getEvents('session-1')

    expect(events).toHaveLength(0)
  })
})

// ==================== Reconnect Helper Tests ====================

describe('reconnect helper functions', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate delay with exponential backoff', () => {
      expect(calculateRetryDelay(1)).toBe(1000)
      expect(calculateRetryDelay(2)).toBe(2000)
      expect(calculateRetryDelay(3)).toBe(4000)
    })

    it('should respect max delay', () => {
      expect(calculateRetryDelay(10, 1000, 5000)).toBe(5000)
    })
  })

  describe('isReconnectNeeded', () => {
    it('should return true for disconnected state', () => {
      const state = {
        sessionId: 's1',
        status: 'disconnected' as const,
        lastSequence: 0,
        lastSyncTime: 0,
        pendingChunks: [],
      }
      expect(isReconnectNeeded(state, 0)).toBe(true)
    })

    it('should return true for error state', () => {
      const state = {
        sessionId: 's1',
        status: 'error' as const,
        lastSequence: 0,
        lastSyncTime: 0,
        pendingChunks: [],
      }
      expect(isReconnectNeeded(state, 0)).toBe(true)
    })

    it('should return true for stale sequence', () => {
      const state = {
        sessionId: 's1',
        status: 'connected' as const,
        lastSequence: 5,
        lastSyncTime: 0,
        pendingChunks: [],
      }
      expect(isReconnectNeeded(state, 10)).toBe(true)
    })

    it('should return false for up-to-date connection', () => {
      const state = {
        sessionId: 's1',
        status: 'connected' as const,
        lastSequence: 10,
        lastSyncTime: Date.now(),
        pendingChunks: [],
      }
      expect(isReconnectNeeded(state, 5)).toBe(false)
    })
  })
})

// ==================== Message Snapshot Tests ====================

describe('createMessageSnapshot', () => {
  it('should create chunks from message', () => {
    const message = createTestMessage('msg-1', [createTestPart('part-1')])
    const chunks = createMessageSnapshot(message, 'session-1')

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].type).toBe('message_start')
    expect(chunks[chunks.length - 1].type).toBe('message_end')
  })

  it('should include part chunks', () => {
    const message = createTestMessage('msg-1', [
      createTestPart('part-1'),
      createTestPart('part-2'),
    ])
    const chunks = createMessageSnapshot(message, 'session-1')

    const partStartChunks = chunks.filter(c => c.type === 'part_start')
    expect(partStartChunks).toHaveLength(2)
  })
})
