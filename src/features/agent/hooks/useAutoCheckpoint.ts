/**
 * useAutoCheckpoint - 自动检查点 Hook
 * 
 * 订阅 chat:message:add 事件，自动创建检查点
 * 这是一个独立的 hook，用于解耦 CheckpointStore 和 ChatStore
 * 
 * 铁律合规：
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - NFR-23: 检查点可靠性
 * - 架构优化：事件驱动解耦
 */

import { useEffect, useRef } from 'react'
import { eventBus } from '@/hooks/eventBus'
import { useChatStore } from './useChatStore'
import { useCheckpointStore } from './useCheckpointStore'
import type { ChatEvents } from '@/hooks/types/eventBus'
import type { TextPart } from '../../message/runtime/messageModel'

/**
 * useAutoCheckpoint 选项
 */
export interface UseAutoCheckpointOptions {
  /** 是否启用自动检查点 */
  enabled?: boolean
  /** 会话 ID */
  sessionId?: string
}

/**
 * useAutoCheckpoint Hook
 *
 * 自动订阅 chat:message:add 事件，在用户提交消息时创建检查点
 *
 * @example
 * function ChatComponent() {
 *   const sessionId = useChatStore(state => state.activeSessionId)
 *
 *   useAutoCheckpoint({
 *     enabled: true,
 *     sessionId,
 *   })
 *
 *   return <div>...</div>
 * }
 */
export function useAutoCheckpoint(options: UseAutoCheckpointOptions = {}): void {
  const { enabled = true, sessionId } = options

  const autoCheckpointEnabled = useCheckpointStore((state) => state.autoCheckpointEnabled)
  const createCheckpoint = useCheckpointStore((state) => state.createCheckpoint)

  // 使用 ref 追踪订阅
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled || !autoCheckpointEnabled || !sessionId) {
      // 清理订阅
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      return
    }

    // 获取当前会话状态
    const getSessionSnapshot = () => {
      const state = useChatStore.getState()
      const session = state.sessions[sessionId]
      if (!session) {
        return null
      }

      const messageIndex = session.messages.length
      const lastMessage = session.messages[session.messages.length - 1]

      return {
        sessionId,
        messageIndex,
        messageSnapshot: {
          messageIds: session.messages.map((m) => m.id),
          lastMessageContent:
            lastMessage?.parts
              .filter((p): p is TextPart => p.type === 'text')
              .map((p) => p.content)
              .join('\n') || undefined,
        },
      }
    }

    // 订阅事件
    const handleMessageAdd = (payload: ChatEvents.MessageAddPayload) => {
      // 只处理用户消息
      if (payload.role !== 'user') return

      const snapshot = getSessionSnapshot()
      if (!snapshot) return

      createCheckpoint({
        sessionId: snapshot.sessionId,
        type: 'auto',
        messageIndex: snapshot.messageIndex,
        messageSnapshot: snapshot.messageSnapshot,
        metadata: {
          triggerMessageId: payload.messageId,
        },
        label: '消息提交前',
      })
    }

    unsubscribeRef.current = eventBus.subscribe('chat:message:add', handleMessageAdd)

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [enabled, autoCheckpointEnabled, sessionId, createCheckpoint])
}

/**
 * useCheckpointOnEvent - 在特定事件时创建检查点
 *
 * @example
 * function MyComponent() {
 *   const createCheckpointOnEvent = useCheckpointOnEvent()
 *
 *   const handleSave = () => {
 *     createCheckpointOnEvent('manual-save', { label: '保存前' })
 *     // ... 执行保存逻辑
 *   }
 *
 *   return <button onClick={handleSave}>保存</button>
 * }
 */
export function useCheckpointOnEvent(): {
  createCheckpointOnEvent: (
    sessionId: string,
    options?: { label?: string; type?: 'auto' | 'manual' | 'pre_action' }
  ) => void
} {
  const sessionId = useChatStore((state) => state.activeSessionId)
  const createCheckpoint = useCheckpointStore((state) => state.createCheckpoint)
  const autoCheckpointEnabled = useCheckpointStore((state) => state.autoCheckpointEnabled)

  const createCheckpointOnEvent = (
    targetSessionId?: string,
    options?: { label?: string; type?: 'auto' | 'manual' | 'pre_action' }
  ) => {
    if (!autoCheckpointEnabled) return

    const currentSessionId = targetSessionId || sessionId
    if (!currentSessionId) return

    const state = useChatStore.getState()
    const session = state.sessions[currentSessionId]
    if (!session) return

    const lastMessage = session.messages[session.messages.length - 1]

    createCheckpoint({
      sessionId: currentSessionId,
      type: options?.type || 'manual',
      messageIndex: session.messages.length,
      messageSnapshot: {
        messageIds: session.messages.map((m) => m.id),
        lastMessageContent:
          lastMessage?.parts
            .filter((p): p is TextPart => p.type === 'text')
            .map((p) => p.content)
            .join('\n') || undefined,
      },
      metadata: {
        triggerMessageId: 'manual',
      },
      label: options?.label || '手动检查点',
    })
  }

  return { createCheckpointOnEvent }
}
