/**
 * useChatStore - 聊天状态管理 Hook
 * Story 4.1 - AI对话界面实现
 * Story 4.7 - 检查点自动创建
 * 
 * 管理聊天会话、消息、流式传输状态
 * 使用 EventBus 解耦，事件驱动通知其他模块
 * 
 * 铁律合规：
 * - ARCH: 分层架构，复用消息模型
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - NFR-23: 检查点可靠性
 * - 架构优化：解耦 CheckpointStore，使用事件驱动
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Message, TextPart, Part, MessageStatus, MessageRole } from '../../message/runtime/messageModel'
import { eventBus } from '@/hooks/eventBus'
import { ChatEvents, MessageAddPayload } from '@/hooks/types/eventBus'

// ==================== Helper Functions ====================

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return crypto.randomUUID()
}

// ==================== Types ====================

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

/**
 * Tool call state for real-time status display
 */
export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

export interface ToolCallState {
  tool_call_id: string
  status: ToolCallStatus
  progress?: string
  error?: string
}

export interface ChatStoreState {
  // Sessions
  sessions: Record<string, ChatSession>
  activeSessionId: string | null

  // Streaming
  isStreaming: boolean
  streamingMessageId: string | null
  streamingPartId: string | null
  streamingContent: string

  // Tool call states (for real-time status display)
  toolCallStates: Record<string, ToolCallState>

  // Session Actions
  createSession: (title?: string) => string
  deleteSession: (sessionId: string) => void
  setActiveSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void

  // Message Actions
  addUserMessage: (sessionId: string, content: string) => Message | null
  addAssistantMessage: (sessionId: string, content?: string) => Message | null
  appendPartToMessage: (sessionId: string, messageId: string, part: Part) => void
  updateMessagePart: (sessionId: string, messageId: string, partId: string, updates: Partial<Part>) => void

  // Streaming Actions (with RAF batching)
  startStreaming: (sessionId: string, messageId: string, partId: string) => void
  updateStreamingContent: (content: string) => void
  finalizeStreamingMessage: (sessionId: string) => void
  stopStreaming: () => void

  // Tool call state actions
  updateToolCallState: (toolCallId: string, state: Partial<ToolCallState>) => void
  clearToolCallState: (toolCallId: string) => void

  // Reset
  reset: () => void
}

const initialState = {
  sessions: {},
  activeSessionId: null,
  isStreaming: false,
  streamingMessageId: null,
  streamingPartId: null,
  streamingContent: '',
  toolCallStates: {},
}

// ==================== Message Creation Helpers ====================

function createTextPart(content: string): TextPart {
  return {
    id: generateId(),
    type: 'text',
    content,
    createdAt: Date.now(),
  }
}

function createMessage(
  sessionId: string,
  role: MessageRole,
  parts: Part[],
  status: MessageStatus = 'complete'
): Message {
  const now = Date.now()
  return {
    id: generateId(),
    sessionId,
    role,
    status,
    parts,
    createdAt: now,
    updatedAt: now,
  }
}

// ==================== Store ====================

export const useChatStore = create<ChatStoreState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // ==================== Session Actions ====================
    
    createSession: (title?: string) => {
      const sessionId = generateId()
      const now = Date.now()
      
      const session: ChatSession = {
        id: sessionId,
        title: title ?? '新对话',
        messages: [],
        createdAt: now,
        updatedAt: now,
      }
      
      set((state) => ({
        sessions: {
          ...state.sessions,
          [sessionId]: session,
        },
        activeSessionId: sessionId,
      }))
      
      return sessionId
    },
    
    deleteSession: (sessionId: string) => {
      set((state) => {
        const { [sessionId]: _deleted, ...remaining } = state.sessions
        return {
          sessions: remaining,
          activeSessionId: state.activeSessionId === sessionId 
            ? Object.keys(remaining)[0] ?? null 
            : state.activeSessionId,
        }
      })
    },
    
    setActiveSession: (sessionId: string) => {
      set({ activeSessionId: sessionId })
    },
    
    updateSessionTitle: (sessionId: string, title: string) => {
      set((state) => {
        const session = state.sessions[sessionId]
        if (!session) return state
        
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...session,
              title,
              updatedAt: Date.now(),
            },
          },
        }
      })
    },
    
    // ==================== Message Actions ====================
    
    addUserMessage: (sessionId: string, content: string) => {
      const state = get()
      const session = state.sessions[sessionId]
      if (!session) return null
      
      // 发布事件通知其他模块（解耦 CheckpointStore）
      // 订阅者可以决定是否创建检查点
      eventBus.publish<MessageAddPayload>(ChatEvents.MESSAGE_ADD, {
        sessionId,
        messageId: 'pending', // 将由下方创建后填充
        role: 'user',
        content,
      })
      
      const textPart = createTextPart(content)
      const message = createMessage(sessionId, 'user', [textPart], 'complete')
      
      set((s) => ({
        sessions: {
          ...s.sessions,
          [sessionId]: {
            ...session,
            messages: [...session.messages, message],
            updatedAt: Date.now(),
          },
        },
      }))
      
      // 消息创建后，发布更新事件
      eventBus.publish<MessageAddPayload>(ChatEvents.MESSAGE_ADD, {
        sessionId,
        messageId: message.id,
        role: 'user',
        content,
      })
      
      return message
    },
    
    addAssistantMessage: (sessionId: string, content?: string) => {
      const state = get()
      const session = state.sessions[sessionId]
      if (!session) return null
      
      const parts: Part[] = content ? [createTextPart(content)] : []
      const status: MessageStatus = content ? 'complete' : 'pending'
      const message = createMessage(sessionId, 'assistant', parts, status)
      
      set((s) => ({
        sessions: {
          ...s.sessions,
          [sessionId]: {
            ...session,
            messages: [...session.messages, message],
            updatedAt: Date.now(),
          },
        },
      }))
      
      return message
    },
    
    appendPartToMessage: (sessionId: string, messageId: string, part: Part) => {
      set((state) => {
        const session = state.sessions[sessionId]
        if (!session) return state
        
        const message = session.messages.find(m => m.id === messageId)
        if (!message) return state
        
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...session,
              messages: session.messages.map(m =>
                m.id === messageId
                  ? { ...m, parts: [...m.parts, part], status: 'complete' as MessageStatus, updatedAt: Date.now() }
                  : m
              ),
              updatedAt: Date.now(),
            },
          },
        }
      })
    },
    
    updateMessagePart: (sessionId: string, messageId: string, partId: string, updates: Partial<Part>) => {
      set((state) => {
        const session = state.sessions[sessionId]
        if (!session) return state
        
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...session,
              messages: session.messages.map(m =>
                m.id === messageId
                  ? {
                      ...m,
                      parts: m.parts.map(p =>
                        p.id === partId ? { ...p, ...updates } as Part : p
                      ),
                      updatedAt: Date.now(),
                    }
                  : m
              ),
              updatedAt: Date.now(),
            },
          },
        }
      })
    },
    
    // ==================== Streaming Actions ====================
    
    startStreaming: (sessionId: string, messageId: string, partId: string) => {
      set({
        isStreaming: true,
        streamingMessageId: messageId,
        streamingPartId: partId,
        streamingContent: '',
      })
      
      // 创建空的文本部分用于流式内容
      const state = get()
      const session = state.sessions[sessionId]
      if (session) {
        const message = session.messages.find(m => m.id === messageId)
        if (message && !message.parts.find(p => p.id === partId)) {
          const textPart: TextPart = {
            id: partId,
            type: 'text',
            content: '',
            createdAt: Date.now(),
          }
          get().appendPartToMessage(sessionId, messageId, textPart)
        }
      }
    },
    
    updateStreamingContent: (content: string) => {
      // 使用 RAF 批量更新机制优化性能
      const rafId = requestAnimationFrame(() => {
        set({ streamingContent: content })

        // 实时更新消息内容
        const { streamingMessageId, streamingPartId } = get()
        if (streamingMessageId && streamingPartId) {
          const sessionId = get().activeSessionId
          if (sessionId) {
            set((state) => {
              const session = state.sessions[sessionId]
              if (!session) return state

              return {
                sessions: {
                  ...state.sessions,
                  [sessionId]: {
                    ...session,
                    messages: session.messages.map(m =>
                      m.id === streamingMessageId
                        ? {
                            ...m,
                            parts: m.parts.map(p =>
                              p.id === streamingPartId && p.type === 'text'
                                ? { ...p, content } as TextPart
                                : p
                            ),
                            updatedAt: Date.now(),
                          }
                        : m
                    ),
                  },
                },
              }
            })
          }
        }
      })

      // 存储 RAF ID 以便取消
      return () => cancelAnimationFrame(rafId)
    },

    finalizeStreamingMessage: (sessionId: string) => {
      const { streamingMessageId, streamingPartId, streamingContent } = get()
      
      if (!streamingMessageId || !streamingPartId) return
      
      set((s) => {
        const session = s.sessions[sessionId]
        if (!session) return s
        
        return {
          sessions: {
            ...s.sessions,
            [sessionId]: {
              ...session,
              messages: session.messages.map(m =>
                m.id === streamingMessageId
                  ? {
                      ...m,
                      parts: m.parts.map(p =>
                        p.id === streamingPartId && p.type === 'text'
                          ? { ...p, content: streamingContent } as TextPart
                          : p
                      ),
                      status: 'complete' as MessageStatus,
                      updatedAt: Date.now(),
                    }
                  : m
              ),
              updatedAt: Date.now(),
            },
          },
        }
      })
    },
    
    stopStreaming: () => {
      set({
        isStreaming: false,
        streamingMessageId: null,
        streamingPartId: null,
        streamingContent: '',
      })
    },

    // ==================== Tool Call State Actions ====================

    updateToolCallState: (toolCallId: string, updates: Partial<ToolCallState>) => {
      set((state) => ({
        toolCallStates: {
          ...state.toolCallStates,
          [toolCallId]: {
            ...state.toolCallStates[toolCallId],
            tool_call_id: toolCallId,
            ...updates,
          },
        },
      }))
    },

    clearToolCallState: (toolCallId: string) => {
      set((state) => {
        const { [toolCallId]: _, ...remaining } = state.toolCallStates
        return { toolCallStates: remaining }
      })
    },

    // ==================== Reset ====================
    
    reset: () => {
      set(initialState)
    },
  }))
)

// ==================== Selector Hooks ====================

/**
 * 获取当前活跃的会话
 */
export function useActiveChatSession(): ChatSession | null {
  return useChatStore((state) => {
    const sessionId = state.activeSessionId
    return sessionId ? state.sessions[sessionId] ?? null : null
  })
}

/**
 * 获取当前活跃会话的消息列表
 */
export function useActiveMessages(): Message[] {
  return useChatStore((state) => {
    const sessionId = state.activeSessionId
    const session = sessionId ? state.sessions[sessionId] : null
    return session?.messages ?? []
  })
}

/**
 * 获取流式传输状态
 */
export function useStreamingStatus(): {
  isStreaming: boolean
  streamingContent: string
  streamingMessageId: string | null
} {
  return useChatStore(
    useShallow((state) => ({
      isStreaming: state.isStreaming,
      streamingContent: state.streamingContent,
      streamingMessageId: state.streamingMessageId,
    }))
  )
}

// ==================== Export ====================

export default useChatStore
