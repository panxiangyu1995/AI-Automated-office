/**
 * Message Model for AI Conversation
 *
 * This module defines message and part schemas for structured Agent conversation records.
 * For enterprise messages (notifications/approvals/tasks), see ../types/message.types.ts
 */

// ==================== Part Types ====================

/**
 * Part type identifiers
 */
export type PartType =
  | 'text'         // Plain text content
  | 'reasoning'    // Agent reasoning/thinking
  | 'tool_call'    // Tool invocation request
  | 'tool_result'  // Tool execution result
  | 'confirmation' // User confirmation request
  | 'error'        // Error message
  | 'ui_patch'     // UI update instruction

// ==================== Base Part ====================

/**
 * Base part interface
 */
export interface BasePart {
  id: string
  type: PartType
  createdAt: number
  metadata?: Record<string, unknown>
}

// ==================== Text Part ====================

export interface TextPart extends BasePart {
  type: 'text'
  content: string
  format?: 'plain' | 'markdown' | 'html'
}

// ==================== Reasoning Part ====================

export interface ReasoningPart extends BasePart {
  type: 'reasoning'
  content: string
  thinkingProcess?: 'analysis' | 'planning' | 'evaluation' | 'conclusion'
  duration?: number // milliseconds
}

// ==================== Tool Call Part ====================

export interface ToolParameter {
  name: string
  value: unknown
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
}

export interface ToolCallPart extends BasePart {
  type: 'tool_call'
  toolId: string
  toolName: string
  parameters: ToolParameter[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt?: number
  completedAt?: number
}

// ==================== Tool Result Part ====================

export interface ToolResultPart extends BasePart {
  type: 'tool_result'
  toolCallId: string
  toolName: string
  result: unknown
  success: boolean
  errorMessage?: string
  duration?: number // milliseconds
}

// ==================== Confirmation Part ====================

export interface ConfirmationOption {
  id: string
  label: string
  description?: string
  isDefault?: boolean
  isDestructive?: boolean
}

export interface ConfirmationPart extends BasePart {
  type: 'confirmation'
  title: string
  message: string
  options: ConfirmationOption[]
  selectedOptionId?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'timeout'
  expiresAt?: number
  respondedAt?: number
}

// ==================== Error Part ====================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'
export type ErrorCode = 
  | 'UNKNOWN_ERROR'
  | 'INVALID_INPUT'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'TOOL_ERROR'
  | 'STREAM_ERROR'
  | 'SESSION_ERROR'

export interface ErrorPart extends BasePart {
  type: 'error'
  code: ErrorCode
  message: string
  severity: ErrorSeverity
  details?: string
  stackTrace?: string
  recoverable: boolean
  retryCount?: number
  maxRetries?: number
}

// ==================== UI Patch Part ====================

export type UIPatchOperation = 
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'replace'

export interface UIPatchAction {
  operation: UIPatchOperation
  path: string
  value?: unknown
  previousValue?: unknown
}

export interface UIPatchPart extends BasePart {
  type: 'ui_patch'
  target: string // Component or element identifier
  actions: UIPatchAction[]
  version: number
  appliedAt?: number
  revertedAt?: number
}

// ==================== Union Types ====================

/**
 * All part types union
 */
export type Part = 
  | TextPart 
  | ReasoningPart 
  | ToolCallPart 
  | ToolResultPart 
  | ConfirmationPart 
  | ErrorPart 
  | UIPatchPart

// ==================== Message Types ====================

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

/**
 * Message status
 */
export type MessageStatus = 
  | 'pending'     // Message is being created/processed
  | 'streaming'   // Message is actively streaming
  | 'complete'    // Message is complete
  | 'error'       // Message encountered an error
  | 'cancelled'   // Message was cancelled

/**
 * Message record
 */
export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  status: MessageStatus
  parts: Part[]
  createdAt: number
  updatedAt: number
  completedAt?: number
  metadata?: {
    model?: string
    provider?: string
    tokenCount?: number
    latency?: number
    [key: string]: unknown
  }
}

// ==================== Message Creation Types ====================

/**
 * Create message request
 */
export interface CreateMessageRequest {
  sessionId: string
  role: MessageRole
  parts?: Part[]
  metadata?: Message['metadata']
}

/**
 * Create message response
 */
export interface CreateMessageResponse {
  message: Message
  success: boolean
  error?: string
}

// ==================== Part Creation Types ====================

/**
 * Create part request (generic)
 */
export interface CreatePartRequest {
  messageId: string
  part: Omit<Part, 'id' | 'createdAt'>
  position?: number // Insert position, default is append
}

/**
 * Create part response
 */
export interface CreatePartResponse {
  part: Part
  message: Message
  success: boolean
  error?: string
}

// ==================== Streaming Types ====================

/**
 * Stream chunk type
 */
export type StreamChunkType = 
  | 'message_start'
  | 'part_start'
  | 'part_delta'
  | 'part_end'
  | 'message_end'
  | 'error'

/**
 * Stream chunk for frontend streaming
 */
export interface StreamChunk {
  type: StreamChunkType
  sessionId: string
  messageId: string
  partId?: string
  delta?: string          // Text delta for streaming
  part?: Part            // Full part data for part_start/part_end
  message?: Message      // Full message for message_start/message_end
  error?: {
    code: ErrorCode
    message: string
  }
  timestamp: number
}

// ==================== Serialization Contract ====================

/**
 * Serialization format for messages
 */
export interface SerializedMessage {
  id: string
  sessionId: string
  role: MessageRole
  status: MessageStatus
  parts: SerializedPart[]
  createdAt: number
  updatedAt: number
  completedAt?: number
  metadata?: Record<string, unknown>
}

/**
 * Serialization format for parts
 */
export interface SerializedPart {
  id: string
  type: PartType
  createdAt: number
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

// ==================== Helper Functions ====================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create a text part
 */
export function createTextPart(
  content: string,
  format: TextPart['format'] = 'plain',
  metadata?: Record<string, unknown>
): TextPart {
  return {
    id: generateId(),
    type: 'text',
    content,
    format,
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create a reasoning part
 */
export function createReasoningPart(
  content: string,
  thinkingProcess?: ReasoningPart['thinkingProcess'],
  duration?: number,
  metadata?: Record<string, unknown>
): ReasoningPart {
  return {
    id: generateId(),
    type: 'reasoning',
    content,
    thinkingProcess,
    duration,
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create a tool call part
 */
export function createToolCallPart(
  toolId: string,
  toolName: string,
  parameters: ToolParameter[],
  metadata?: Record<string, unknown>
): ToolCallPart {
  return {
    id: generateId(),
    type: 'tool_call',
    toolId,
    toolName,
    parameters,
    status: 'pending',
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create a tool result part
 */
export function createToolResultPart(
  toolCallId: string,
  toolName: string,
  result: unknown,
  success: boolean,
  errorMessage?: string,
  duration?: number,
  metadata?: Record<string, unknown>
): ToolResultPart {
  return {
    id: generateId(),
    type: 'tool_result',
    toolCallId,
    toolName,
    result,
    success,
    errorMessage,
    duration,
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create a confirmation part
 */
export function createConfirmationPart(
  title: string,
  message: string,
  options: ConfirmationOption[],
  expiresAt?: number,
  metadata?: Record<string, unknown>
): ConfirmationPart {
  return {
    id: generateId(),
    type: 'confirmation',
    title,
    message,
    options,
    status: 'pending',
    expiresAt,
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create an error part
 */
export function createErrorPart(
  code: ErrorCode,
  message: string,
  severity: ErrorSeverity,
  recoverable: boolean,
  details?: string,
  metadata?: Record<string, unknown>
): ErrorPart {
  return {
    id: generateId(),
    type: 'error',
    code,
    message,
    severity,
    details,
    recoverable,
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create a UI patch part
 */
export function createUIPatchPart(
  target: string,
  actions: UIPatchAction[],
  version: number,
  metadata?: Record<string, unknown>
): UIPatchPart {
  return {
    id: generateId(),
    type: 'ui_patch',
    target,
    actions,
    version,
    createdAt: Date.now(),
    metadata,
  }
}

/**
 * Create a message
 */
export function createMessage(
  sessionId: string,
  role: MessageRole,
  parts: Part[] = [],
  metadata?: Message['metadata']
): Message {
  const now = Date.now()
  return {
    id: generateId(),
    sessionId,
    role,
    status: parts.length > 0 ? 'complete' : 'pending',
    parts,
    createdAt: now,
    updatedAt: now,
    metadata,
  }
}

/**
 * Serialize a message for transport
 */
export function serializeMessage(message: Message): SerializedMessage {
  return {
    id: message.id,
    sessionId: message.sessionId,
    role: message.role,
    status: message.status,
    parts: message.parts.map(serializePart),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    completedAt: message.completedAt,
    metadata: message.metadata,
  }
}

/**
 * Serialize a part for transport
 */
export function serializePart(part: Part): SerializedPart {
  const { id, type, createdAt, metadata } = part
  // Extract part-specific data
  const data: Record<string, unknown> = {}
  
  switch (type) {
    case 'text': {
      const p = part as TextPart
      data.content = p.content
      data.format = p.format
      break
    }
    case 'reasoning': {
      const p = part as ReasoningPart
      data.content = p.content
      data.thinkingProcess = p.thinkingProcess
      data.duration = p.duration
      break
    }
    case 'tool_call': {
      const p = part as ToolCallPart
      data.toolId = p.toolId
      data.toolName = p.toolName
      data.parameters = p.parameters
      data.status = p.status
      data.startedAt = p.startedAt
      data.completedAt = p.completedAt
      break
    }
    case 'tool_result': {
      const p = part as ToolResultPart
      data.toolCallId = p.toolCallId
      data.toolName = p.toolName
      data.result = p.result
      data.success = p.success
      data.errorMessage = p.errorMessage
      data.duration = p.duration
      break
    }
    case 'confirmation': {
      const p = part as ConfirmationPart
      data.title = p.title
      data.message = p.message
      data.options = p.options
      data.selectedOptionId = p.selectedOptionId
      data.status = p.status
      data.expiresAt = p.expiresAt
      data.respondedAt = p.respondedAt
      break
    }
    case 'error': {
      const p = part as ErrorPart
      data.code = p.code
      data.message = p.message
      data.severity = p.severity
      data.details = p.details
      data.stackTrace = p.stackTrace
      data.recoverable = p.recoverable
      data.retryCount = p.retryCount
      data.maxRetries = p.maxRetries
      break
    }
    case 'ui_patch': {
      const p = part as UIPatchPart
      data.target = p.target
      data.actions = p.actions
      data.version = p.version
      data.appliedAt = p.appliedAt
      data.revertedAt = p.revertedAt
      break
    }
  }

  return {
    id,
    type,
    createdAt,
    data,
    metadata,
  }
}

/**
 * Deserialize a message
 */
export function deserializeMessage(serialized: SerializedMessage): Message {
  return {
    ...serialized,
    parts: serialized.parts.map(deserializePart),
  }
}

/**
 * Deserialize a part
 */
export function deserializePart(serialized: SerializedPart): Part {
  const { id, type, createdAt, data, metadata } = serialized
  
  const basePart: BasePart = {
    id,
    type: type as PartType,
    createdAt,
    metadata,
  }

  switch (type) {
    case 'text':
      return { ...basePart, type: 'text', ...data } as TextPart
    case 'reasoning':
      return { ...basePart, type: 'reasoning', ...data } as ReasoningPart
    case 'tool_call':
      return { ...basePart, type: 'tool_call', ...data } as ToolCallPart
    case 'tool_result':
      return { ...basePart, type: 'tool_result', ...data } as ToolResultPart
    case 'confirmation':
      return { ...basePart, type: 'confirmation', ...data } as ConfirmationPart
    case 'error':
      return { ...basePart, type: 'error', ...data } as ErrorPart
    case 'ui_patch':
      return { ...basePart, type: 'ui_patch', ...data } as UIPatchPart
    default:
      throw new Error(`Unknown part type: ${type}`)
  }
}

/**
 * Validate a part
 */
export function validatePart(part: unknown): part is Part {
  if (!part || typeof part !== 'object') return false
  
  const p = part as Partial<BasePart>
  if (!p.id || !p.type || !p.createdAt) return false
  
  const validTypes: PartType[] = ['text', 'reasoning', 'tool_call', 'tool_result', 'confirmation', 'error', 'ui_patch']
  if (!validTypes.includes(p.type as PartType)) return false
  
  return true
}

/**
 * Validate a message
 */
export function validateMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object') return false
  
  const m = message as Partial<Message>
  if (!m.id || !m.sessionId || !m.role || !m.status || !m.createdAt || !m.updatedAt) return false
  
  const validRoles: MessageRole[] = ['user', 'assistant', 'system', 'tool']
  if (!validRoles.includes(m.role as MessageRole)) return false
  
  const validStatuses: MessageStatus[] = ['pending', 'streaming', 'complete', 'error', 'cancelled']
  if (!validStatuses.includes(m.status as MessageStatus)) return false
  
  if (!Array.isArray(m.parts)) return false
  
  return m.parts.every(validatePart)
}

/**
 * Get text content from a message
 */
export function getMessageText(message: Message): string {
  return message.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map(p => p.content)
    .join('\n')
}

/**
 * Get all tool calls from a message
 */
export function getToolCalls(message: Message): ToolCallPart[] {
  return message.parts.filter((p): p is ToolCallPart => p.type === 'tool_call')
}

/**
 * Get all errors from a message
 */
export function getErrors(message: Message): ErrorPart[] {
  return message.parts.filter((p): p is ErrorPart => p.type === 'error')
}
