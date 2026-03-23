/**
 * useChatStore - 聊天状态管理 Hook
 * Story 4.1 - AI对话界面实现
 * Story 4.7 - 检查点自动创建
 * 
 * 管理聊天会话、消息、流式传输状态
 * 在消息提交时自动创建检查点
 * 
 * 铁律合规：
 * - ARCH: 分层架构，复用消息模型
 * - ARCH-037: 使用 Zustand 进行状态管理
 * - NFR-23: 检查点可靠性
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Message, TextPart, Part, MessageStatus, MessageRole } from '../../message/runtime/messageModel'
import { useCheckpointStore } from './useCheckpointStore'

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

export interface ChatStoreState {
  // Sessions
  sessions: Record<string, ChatSession>
  activeSessionId: string | null
  
  // Streaming
  isStreaming: boolean
  streamingMessageId: string | null
  streamingPartId: string | null
  streamingContent: string
  
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
  
  // Streaming Actions
  startStreaming: (sessionId: string, messageId: string, partId: string) => void
  updateStreamingContent: (content: string) => void
  finalizeStreamingMessage: (sessionId: string) => void
  stopStreaming: () => void
  
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      
      // 在添加消息前创建检查点（Story 4.7）
      const checkpointStore = useCheckpointStore.getState()
      if (checkpointStore.autoCheckpointEnabled) {
        const messageIndex = session.messages.length
        const lastMessage = session.messages[session.messages.length - 1]
        
        checkpointStore.createCheckpoint({
          sessionId,
          type: 'auto',
          messageIndex,
          messageSnapshot: {
            messageIds: session.messages.map(m => m.id),
            lastMessageContent: lastMessage?.parts
              .filter((p): p is TextPart => p.type === 'text')
              .map(p => p.content)
              .join('\n') || undefined,
          },
          metadata: {
            triggerMessageId: 'pending', // 将在消息创建后更新
          },
          label: `消息提交前`,
        })
      }
      
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
  return useChatStore((state) => ({
    isStreaming: state.isStreaming,
    streamingContent: state.streamingContent,
    streamingMessageId: state.streamingMessageId,
  }))
}

// ==================== Export ====================

export default useChatStore