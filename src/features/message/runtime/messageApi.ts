/**
 * Message API Service
 * Task 61: Story 43.2 - Message and Part Model
 * 
 * API service for message and part operations
 */

import {
  type Message,
  type Part,
  type MessageRole,
  type MessageStatus,
  type CreateMessageRequest,
  type CreateMessageResponse,
  type CreatePartRequest,
  type CreatePartResponse,
  type StreamChunk,
  type TextPart,
  type ToolCallPart,
  type ConfirmationPart,
  type ErrorPart,
  type ErrorCode,
  createTextPart,
  createReasoningPart,
  createToolCallPart,
  createToolResultPart,
  createConfirmationPart,
  createErrorPart,
  createUIPatchPart,
} from './messageModel'
import { messageStore } from './messageStore'

// ==================== Message API Class ====================

/**
 * Message API class for managing messages and parts
 */
export class MessageApi {
  /**
   * Create a new message
   */
  async createMessage(request: CreateMessageRequest): Promise<CreateMessageResponse> {
    return await messageStore.getState().createMessage(request)
  }

  /**
   * Get a message by ID
   */
  getMessage(messageId: string): Message | undefined {
    return messageStore.getState().getMessage(messageId)
  }

  /**
   * Get all messages for a session
   */
  getSessionMessages(sessionId: string): Message[] {
    return messageStore.getState().getSessionMessages(sessionId)
  }

  /**
   * Update message status
   */
  updateMessageStatus(messageId: string, status: MessageStatus): boolean {
    return messageStore.getState().updateMessageStatus(messageId, status)
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): boolean {
    return messageStore.getState().deleteMessage(messageId)
  }

  /**
   * Delete all messages for a session
   */
  deleteSessionMessages(sessionId: string): number {
    return messageStore.getState().deleteSessionMessages(sessionId)
  }

  /**
   * Add a part to a message
   */
  async addPart(request: CreatePartRequest): Promise<CreatePartResponse> {
    return await messageStore.getState().addPart(request)
  }

  /**
   * Update a part
   */
  updatePart(messageId: string, partId: string, updates: Partial<Part>): boolean {
    return messageStore.getState().updatePart(messageId, partId, updates)
  }

  /**
   * Remove a part
   */
  removePart(messageId: string, partId: string): boolean {
    return messageStore.getState().removePart(messageId, partId)
  }

  /**
   * Add a text part to a message
   */
  async addTextPart(
    messageId: string,
    content: string,
    format: TextPart['format'] = 'plain',
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createTextPart(content, format)
    return await this.addPart({ messageId, part, position })
  }

  /**
   * Add a reasoning part to a message
   */
  async addReasoningPart(
    messageId: string,
    content: string,
    thinkingProcess?: 'analysis' | 'planning' | 'evaluation' | 'conclusion',
    duration?: number,
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createReasoningPart(content, thinkingProcess, duration)
    return await this.addPart({ messageId, part, position })
  }

  /**
   * Add a tool call part to a message
   */
  async addToolCallPart(
    messageId: string,
    toolId: string,
    toolName: string,
    parameters: ToolCallPart['parameters'],
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createToolCallPart(toolId, toolName, parameters)
    return await this.addPart({ messageId, part, position })
  }

  /**
   * Add a tool result part to a message
   */
  async addToolResultPart(
    messageId: string,
    toolCallId: string,
    toolName: string,
    result: unknown,
    success: boolean,
    errorMessage?: string,
    duration?: number,
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createToolResultPart(toolCallId, toolName, result, success, errorMessage, duration)
    return await this.addPart({ messageId, part, position })
  }

  /**
   * Add a confirmation part to a message
   */
  async addConfirmationPart(
    messageId: string,
    title: string,
    message: string,
    options: ConfirmationPart['options'],
    expiresAt?: number,
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createConfirmationPart(title, message, options, expiresAt)
    return await this.addPart({ messageId, part, position })
  }

  /**
   * Add an error part to a message
   */
  async addErrorPart(
    messageId: string,
    code: ErrorCode,
    errorMessage: string,
    severity: ErrorPart['severity'],
    recoverable: boolean,
    details?: string,
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createErrorPart(code, errorMessage, severity, recoverable, details)
    return await this.addPart({ messageId, part, position })
  }

  /**
   * Add a UI patch part to a message
   */
  async addUIPatchPart(
    messageId: string,
    target: string,
    actions: Parameters<typeof createUIPatchPart>[1],
    version: number,
    position?: number
  ): Promise<CreatePartResponse> {
    const part = createUIPatchPart(target, actions, version)
    return await this.addPart({ messageId, part, position })
  }

  // ==================== Streaming ====================

  /**
   * Start streaming for a message
   */
  startStreaming(sessionId: string, messageId: string): boolean {
    return messageStore.getState().startStreaming(sessionId, messageId)
  }

  /**
   * Stream a text delta
   */
  streamPartDelta(sessionId: string, messageId: string, partId: string, delta: string): boolean {
    return messageStore.getState().streamPartDelta(sessionId, messageId, partId, delta)
  }

  /**
   * End streaming for a message
   */
  endStreaming(sessionId: string, messageId: string): boolean {
    return messageStore.getState().endStreaming(sessionId, messageId)
  }

  /**
   * Subscribe to stream chunks
   */
  subscribeToStream(callback: (chunk: StreamChunk) => void): () => void {
    return messageStore.getState().addStreamListener(callback)
  }

  // ==================== Utility ====================

  /**
   * Get message count
   */
  getMessageCount(sessionId?: string): number {
    return messageStore.getState().getMessageCount(sessionId)
  }

  /**
   * Get last message for a session
   */
  getLastMessage(sessionId: string): Message | undefined {
    return messageStore.getState().getLastMessage(sessionId)
  }

  /**
   * Clear all messages
   */
  clearAll(): void {
    messageStore.getState().clearAll()
  }
}

// ==================== Singleton Instance ====================

let messageApiInstance: MessageApi | null = null

/**
 * Get the singleton message API instance
 */
export function getMessageApi(): MessageApi {
  if (!messageApiInstance) {
    messageApiInstance = new MessageApi()
  }
  return messageApiInstance
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetMessageApi(): void {
  messageApiInstance = null
}

// ==================== Convenience Functions ====================

/**
 * Create a message (convenience function)
 */
export async function createMessage(
  sessionId: string,
  role: MessageRole,
  parts?: Part[],
  metadata?: Message['metadata']
): Promise<CreateMessageResponse> {
  return await getMessageApi().createMessage({ sessionId, role, parts, metadata })
}

/**
 * Get a message by ID (convenience function)
 */
export function getMessage(messageId: string): Message | undefined {
  return getMessageApi().getMessage(messageId)
}

/**
 * Get session messages (convenience function)
 */
export function getSessionMessages(sessionId: string): Message[] {
  return getMessageApi().getSessionMessages(sessionId)
}

/**
 * Add a text part (convenience function)
 */
export async function addTextPart(
  messageId: string,
  content: string,
  format?: TextPart['format']
): Promise<CreatePartResponse> {
  return await getMessageApi().addTextPart(messageId, content, format)
}
