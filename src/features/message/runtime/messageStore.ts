/**
 * Message Store
 * Task 61: Story 43.2 - Message and Part Model
 * 
 * In-memory store for managing messages and parts
 */

import { create } from 'zustand'
import {
  type Message,
  type Part,
  type MessageStatus,
  type CreateMessageRequest,
  type CreateMessageResponse,
  type CreatePartRequest,
  type CreatePartResponse,
  type StreamChunk,
  createMessage as createMessageFn,
  generateId,
  validatePart,
} from './messageModel'

// ==================== Store Types ====================

export interface MessageStateListener {
  (event: MessageStateChangeEvent): void
}

export interface MessageStateChangeEvent {
  type: 'message_created' | 'message_updated' | 'message_deleted' | 'part_added' | 'part_updated'
  message?: Message
  part?: Part
  sessionId?: string
  timestamp: number
}

export interface StreamListener {
  (chunk: StreamChunk): void
}

export interface MessageStore {
  // State
  messages: Map<string, Message>
  sessionMessages: Map<string, string[]> // sessionId -> messageIds
  stateListeners: Set<MessageStateListener>
  streamListeners: Set<StreamListener>
  
  // Message CRUD
  createMessage: (request: CreateMessageRequest) => Promise<CreateMessageResponse>
  getMessage: (messageId: string) => Message | undefined
  getSessionMessages: (sessionId: string) => Message[]
  updateMessageStatus: (messageId: string, status: MessageStatus) => boolean
  deleteMessage: (messageId: string) => boolean
  deleteSessionMessages: (sessionId: string) => number
  
  // Part CRUD
  addPart: (request: CreatePartRequest) => Promise<CreatePartResponse>
  updatePart: (messageId: string, partId: string, updates: Partial<Part>) => boolean
  removePart: (messageId: string, partId: string) => boolean
  
  // Streaming
  startStreaming: (sessionId: string, messageId: string) => boolean
  streamPartDelta: (sessionId: string, messageId: string, partId: string, delta: string) => boolean
  endStreaming: (sessionId: string, messageId: string) => boolean
  emitStreamChunk: (chunk: StreamChunk) => void
  
  // Listeners
  addStateListener: (listener: MessageStateListener) => () => void
  addStreamListener: (listener: StreamListener) => () => void
  
  // Utility
  getMessageCount: (sessionId?: string) => number
  getLastMessage: (sessionId: string) => Message | undefined
  clearAll: () => void
}

// ==================== Store Implementation ====================

let wsInitialized = false;

function initWebSocket() {
  if (wsInitialized) return;
  wsInitialized = true;

  if (typeof window !== "undefined") {
    import("@/lib/ws").then(({ connectWs, on }) => {
      connectWs();

      on("new_message", (msg) => {
        const payload = msg.payload as { message: Message };
        if (payload?.message) {
          set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(payload.message.id, payload.message);
            return { messages: newMessages };
          });
          get().stateListeners.forEach((listener) =>
            listener({
              type: "message_created",
              message: payload.message,
              sessionId: payload.message.sessionId,
              timestamp: Date.now(),
            })
          );
        }
      });

      on("message_read", (msg) => {
        const payload = msg.payload as { messageId: string };
        if (payload?.messageId) {
          get().updateMessageStatus(payload.messageId, "complete");
        }
      });
    }).catch(() => {
      wsInitialized = false;
    });
  }
}

export const messageStore = create<MessageStore>((set, get) => ({
  messages: new Map(),
  sessionMessages: new Map(),
  stateListeners: new Set(),
  streamListeners: new Set(),

  // Initialize WebSocket connection
  ...(() => { initWebSocket(); return {}; })(),

  // ==================== Message CRUD ====================
  messages: new Map(),
  sessionMessages: new Map(),
  stateListeners: new Set(),
  streamListeners: new Set(),

  // ==================== Message CRUD ====================
  
  createMessage: async (request: CreateMessageRequest): Promise<CreateMessageResponse> => {
    try {
      const message = createMessageFn(
        request.sessionId,
        request.role,
        request.parts ?? [],
        request.metadata
      )

      set((state) => {
        const newMessages = new Map(state.messages)
        newMessages.set(message.id, message)

        const newSessionMessages = new Map(state.sessionMessages)
        const existingIds = newSessionMessages.get(request.sessionId) ?? []
        newSessionMessages.set(request.sessionId, [...existingIds, message.id])

        return {
          messages: newMessages,
          sessionMessages: newSessionMessages,
        }
      })

      // Emit state change event
      const event: MessageStateChangeEvent = {
        type: 'message_created',
        message,
        sessionId: request.sessionId,
        timestamp: Date.now(),
      }
      get().stateListeners.forEach(listener => listener(event))

      // Emit stream chunk for message start
      get().emitStreamChunk({
        type: 'message_start',
        sessionId: request.sessionId,
        messageId: message.id,
        message,
        timestamp: Date.now(),
      })

      return {
        message,
        success: true,
      }
    } catch (error) {
      return {
        message: null as unknown as Message,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  getMessage: (messageId: string): Message | undefined => {
    return get().messages.get(messageId)
  },

  getSessionMessages: (sessionId: string): Message[] => {
    const messageIds = get().sessionMessages.get(sessionId) ?? []
    return messageIds
      .map(id => get().messages.get(id))
      .filter((m): m is Message => m !== undefined)
  },

  updateMessageStatus: (messageId: string, status: MessageStatus): boolean => {
    const message = get().messages.get(messageId)
    if (!message) return false

    set((state) => {
      const newMessages = new Map(state.messages)
      const existingMessage = newMessages.get(messageId)
      if (!existingMessage) return {}

      const updatedMessage: Message = {
        ...existingMessage,
        status,
        updatedAt: Date.now(),
        completedAt: status === 'complete' ? Date.now() : existingMessage.completedAt,
      }

      newMessages.set(messageId, updatedMessage)
      return { messages: newMessages }
    })

    // Emit state change event
    const updatedMessage = get().messages.get(messageId)
    if (updatedMessage) {
      const event: MessageStateChangeEvent = {
        type: 'message_updated',
        message: updatedMessage,
        sessionId: updatedMessage.sessionId,
        timestamp: Date.now(),
      }
      get().stateListeners.forEach(listener => listener(event))
    }

    return true
  },

  deleteMessage: (messageId: string): boolean => {
    const message = get().messages.get(messageId)
    if (!message) return false

    set((state) => {
      const newMessages = new Map(state.messages)
      newMessages.delete(messageId)

      const newSessionMessages = new Map(state.sessionMessages)
      const sessionIds = newSessionMessages.get(message.sessionId) ?? []
      newSessionMessages.set(
        message.sessionId,
        sessionIds.filter(id => id !== messageId)
      )

      return {
        messages: newMessages,
        sessionMessages: newSessionMessages,
      }
    })

    // Emit state change event
    const event: MessageStateChangeEvent = {
      type: 'message_deleted',
      sessionId: message.sessionId,
      timestamp: Date.now(),
    }
    get().stateListeners.forEach(listener => listener(event))

    return true
  },

  deleteSessionMessages: (sessionId: string): number => {
    const messageIds = get().sessionMessages.get(sessionId) ?? []
    let deletedCount = 0

    set((state) => {
      const newMessages = new Map(state.messages)
      messageIds.forEach(id => {
        if (newMessages.delete(id)) deletedCount++
      })

      const newSessionMessages = new Map(state.sessionMessages)
      newSessionMessages.delete(sessionId)

      return {
        messages: newMessages,
        sessionMessages: newSessionMessages,
      }
    })

    return deletedCount
  },

  // ==================== Part CRUD ====================
  
  addPart: async (request: CreatePartRequest): Promise<CreatePartResponse> => {
    const message = get().messages.get(request.messageId)
    if (!message) {
      return {
        part: null as unknown as Part,
        message: null as unknown as Message,
        success: false,
        error: 'Message not found',
      }
    }

    const part = {
      ...request.part,
      id: generateId(),
      createdAt: Date.now(),
    } as Part

    if (!validatePart(part)) {
      return {
        part: null as unknown as Part,
        message: null as unknown as Message,
        success: false,
        error: 'Invalid part',
      }
    }

    set((state) => {
      const newMessages = new Map(state.messages)
      const existingMessage = newMessages.get(request.messageId)
      if (!existingMessage) return {}

      const position = request.position ?? existingMessage.parts.length
      const newParts = [...existingMessage.parts]
      newParts.splice(position, 0, part)

      const updatedMessage: Message = {
        ...existingMessage,
        parts: newParts,
        updatedAt: Date.now(),
      }

      newMessages.set(request.messageId, updatedMessage)
      return { messages: newMessages }
    })

    const updatedMessage = get().messages.get(request.messageId)!
    
    // Emit state change event
    const event: MessageStateChangeEvent = {
      type: 'part_added',
      message: updatedMessage,
      part,
      sessionId: updatedMessage.sessionId,
      timestamp: Date.now(),
    }
    get().stateListeners.forEach(listener => listener(event))

    // Emit stream chunk for part start
    get().emitStreamChunk({
      type: 'part_start',
      sessionId: updatedMessage.sessionId,
      messageId: request.messageId,
      partId: part.id,
      part,
      timestamp: Date.now(),
    })

    return {
      part,
      message: updatedMessage,
      success: true,
    }
  },

  updatePart: (messageId: string, partId: string, updates: Partial<Part>): boolean => {
    const message = get().messages.get(messageId)
    if (!message) return false

    const partIndex = message.parts.findIndex(p => p.id === partId)
    if (partIndex === -1) return false

    set((state) => {
      const newMessages = new Map(state.messages)
      const existingMessage = newMessages.get(messageId)
      if (!existingMessage) return {}

      const newParts = [...existingMessage.parts]
      newParts[partIndex] = { ...newParts[partIndex], ...updates } as Part

      const updatedMessage: Message = {
        ...existingMessage,
        parts: newParts,
        updatedAt: Date.now(),
      }

      newMessages.set(messageId, updatedMessage)
      return { messages: newMessages }
    })

    const updatedMessage = get().messages.get(messageId)
    if (updatedMessage) {
      const event: MessageStateChangeEvent = {
        type: 'part_updated',
        message: updatedMessage,
        part: updatedMessage.parts[partIndex],
        sessionId: updatedMessage.sessionId,
        timestamp: Date.now(),
      }
      get().stateListeners.forEach(listener => listener(event))
    }

    return true
  },

  removePart: (messageId: string, partId: string): boolean => {
    const message = get().messages.get(messageId)
    if (!message) return false

    const partIndex = message.parts.findIndex(p => p.id === partId)
    if (partIndex === -1) return false

    set((state) => {
      const newMessages = new Map(state.messages)
      const existingMessage = newMessages.get(messageId)
      if (!existingMessage) return {}

      const updatedMessage: Message = {
        ...existingMessage,
        parts: existingMessage.parts.filter(p => p.id !== partId),
        updatedAt: Date.now(),
      }

      newMessages.set(messageId, updatedMessage)
      return { messages: newMessages }
    })

    return true
  },

  // ==================== Streaming ====================
  
  startStreaming: (_sessionId: string, messageId: string): boolean => {
    return get().updateMessageStatus(messageId, 'streaming')
  },

  streamPartDelta: (_sessionId: string, messageId: string, partId: string, delta: string): boolean => {
    const message = get().messages.get(messageId)
    if (!message || message.status !== 'streaming') return false

    const part = message.parts.find(p => p.id === partId)
    if (!part || part.type !== 'text') return false

    // Update text part with delta
    set((state) => {
      const newMessages = new Map(state.messages)
      const existingMessage = newMessages.get(messageId)
      if (!existingMessage) return {}

      const newParts = existingMessage.parts.map(p => {
        if (p.id === partId && p.type === 'text') {
          return { ...p, content: p.content + delta } as Part
        }
        return p
      })

      const updatedMessage: Message = {
        ...existingMessage,
        parts: newParts,
        updatedAt: Date.now(),
      }

      newMessages.set(messageId, updatedMessage)
      return { messages: newMessages }
    })

    // Emit stream chunk
    get().emitStreamChunk({
      type: 'part_delta',
      sessionId: _sessionId,
      messageId,
      partId,
      delta,
      timestamp: Date.now(),
    })

    return true
  },

  endStreaming: (sessionId: string, messageId: string): boolean => {
    const success = get().updateMessageStatus(messageId, 'complete')
    
    if (success) {
      const message = get().messages.get(messageId)
      if (message) {
        get().emitStreamChunk({
          type: 'message_end',
          sessionId,
          messageId,
          message,
          timestamp: Date.now(),
        })
      }
    }

    return success
  },

  emitStreamChunk: (chunk: StreamChunk): void => {
    get().streamListeners.forEach(listener => listener(chunk))
  },

  // ==================== Listeners ====================
  
  addStateListener: (listener: MessageStateListener): (() => void) => {
    initWebSocket();
    set((state) => {
      const newListeners = new Set(state.stateListeners)
      newListeners.add(listener)
      return { stateListeners: newListeners }
    })

    return () => {
      set((state) => {
        const newListeners = new Set(state.stateListeners)
        newListeners.delete(listener)
        return { stateListeners: newListeners }
      })
    }
  },

  addStreamListener: (listener: StreamListener): (() => void) => {
    set((state) => {
      const newListeners = new Set(state.streamListeners)
      newListeners.add(listener)
      return { streamListeners: newListeners }
    })

    return () => {
      set((state) => {
        const newListeners = new Set(state.streamListeners)
        newListeners.delete(listener)
        return { streamListeners: newListeners }
      })
    }
  },

  // ==================== Utility ====================
  
  getMessageCount: (sessionId?: string): number => {
    if (sessionId) {
      return get().sessionMessages.get(sessionId)?.length ?? 0
    }
    return get().messages.size
  },

  getLastMessage: (sessionId: string): Message | undefined => {
    const messageIds = get().sessionMessages.get(sessionId) ?? []
    if (messageIds.length === 0) return undefined
    
    const lastId = messageIds[messageIds.length - 1]
    return get().messages.get(lastId)
  },

  clearAll: (): void => {
    set({
      messages: new Map(),
      sessionMessages: new Map(),
    })
  },
}))

// ==================== Utility Hooks ====================

/**
 * Hook to get messages for a session
 */
export function useSessionMessages(sessionId: string): Message[] {
  return messageStore((state) => {
    const messageIds = state.sessionMessages.get(sessionId) ?? []
    return messageIds
      .map(id => state.messages.get(id))
      .filter((m): m is Message => m !== undefined)
  })
}

/**
 * Hook to get a specific message
 */
export function useMessage(messageId: string): Message | undefined {
  return messageStore((state) => state.messages.get(messageId))
}

/**
 * Hook to get the last message for a session
 */
export function useLastMessage(sessionId: string): Message | undefined {
  return messageStore((state) => {
    const messageIds = state.sessionMessages.get(sessionId) ?? []
    if (messageIds.length === 0) return undefined
    
    const lastId = messageIds[messageIds.length - 1]
    return state.messages.get(lastId)
  })
}
