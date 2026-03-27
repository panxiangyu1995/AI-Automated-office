import { listen } from '@tauri-apps/api/event'
import type { RuntimeEvent, RuntimeEventType } from './runtimeEvents'
import type { RuntimeEventEmitter } from './runtimeEvents'
import type { SyncEngine } from './syncEngine'
import type { ReconnectHandler } from './reconnectHandler'
import {
  createTextPart,
  type Message,
  type MessageRole,
  type MessageStatus,
  type ErrorCode,
} from '../../message/runtime/messageModel'

export interface BackendRuntimeEvent {
  id: string
  type: RuntimeEventType
  sessionId: string
  timestamp: number
  sequence: number
  messageId?: string
  payload?: Record<string, unknown>
}

interface RuntimeEventBridgeOptions {
  sessionId: string
  eventEmitter: RuntimeEventEmitter
  syncEngine: SyncEngine
  reconnectHandler: ReconnectHandler
}

function buildMessage(
  sessionId: string,
  messageId: string,
  role: MessageRole,
  content: string,
  metadata?: Record<string, unknown>,
  status: MessageStatus = 'complete'
): Message {
  const part = createTextPart(content, 'plain')
  const now = Date.now()
  return {
    id: messageId,
    sessionId,
    role,
    status,
    parts: [part],
    createdAt: now,
    updatedAt: now,
    completedAt: status === 'complete' ? now : undefined,
    metadata,
  }
}

function toRuntimeEvent(event: BackendRuntimeEvent): RuntimeEvent | null {
  switch (event.type) {
    case 'session_start': {
      return {
        id: event.id,
        type: 'session_start',
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        sequence: event.sequence,
        metadata: event.payload as { model?: string; provider?: string; userId?: string } | undefined,
      }
    }
    case 'session_end': {
      const payload = event.payload ?? {}
      return {
        id: event.id,
        type: 'session_end',
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        sequence: event.sequence,
        reason: (payload.reason as 'completed' | 'cancelled' | 'error' | 'timeout') ?? 'completed',
        duration: Number(payload.duration ?? 0),
      }
    }
    case 'message_start': {
      if (!event.messageId) return null
      const payload = event.payload ?? {}
      const role = (payload.role as MessageRole) ?? 'assistant'
      const content = (payload.content as string) ?? ''
      const message = buildMessage(event.sessionId, event.messageId, role, content, payload.metadata as Record<string, unknown>, 'streaming')
      return {
        id: event.id,
        type: 'message_start',
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        sequence: event.sequence,
        messageId: event.messageId,
        message,
      }
    }
    case 'message_end': {
      if (!event.messageId) return null
      const payload = event.payload ?? {}
      const role = (payload.role as MessageRole) ?? 'assistant'
      const content = (payload.content as string) ?? ''
      const message = buildMessage(event.sessionId, event.messageId, role, content, payload.metadata as Record<string, unknown>, 'complete')
      return {
        id: event.id,
        type: 'message_end',
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        sequence: event.sequence,
        messageId: event.messageId,
        message,
      }
    }
    case 'error': {
      const payload = event.payload ?? {}
      return {
        id: event.id,
        type: 'error',
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        sequence: event.sequence,
        messageId: event.messageId,
        code: (payload.code as ErrorCode) ?? 'UNKNOWN_ERROR',
        message: (payload.message as string) ?? 'Unknown runtime error',
        recoverable: Boolean(payload.recoverable),
      }
    }
    default:
      return null
  }
}

export async function attachTauriRuntimeEventBridge(
  options: RuntimeEventBridgeOptions
): Promise<() => void> {
  const { sessionId, eventEmitter, syncEngine, reconnectHandler } = options
  let lastSequence = 0
  const eventStorage = reconnectHandler.getEventStorage()

  const unlisten = await listen<BackendRuntimeEvent>('agent_runtime_event', (event) => {
    const payload = event.payload
    if (!payload || payload.sessionId !== sessionId) return

    if (payload.sequence <= lastSequence) {
      return
    }

    if (lastSequence > 0 && payload.sequence > lastSequence + 1) {
      syncEngine.setError('STREAM_ERROR', 'Runtime event sequence gap detected')
    }

    lastSequence = payload.sequence
    const runtimeEvent = toRuntimeEvent(payload)
    if (!runtimeEvent) return

    eventEmitter.emitExternal(runtimeEvent)
    void eventStorage.addEvent(sessionId, runtimeEvent)
  })

  return () => {
    unlisten()
  }
}
