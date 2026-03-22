/**
 * Message and Part Model Unit Tests
 * Task 61: Story 43.2 - Message and Part Model
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  type Part,
  type TextPart,
  type ReasoningPart,
  type ToolCallPart,
  type ToolResultPart,
  type ConfirmationPart,
  type ErrorPart,
  type UIPatchPart,
  type Message,
  type SerializedMessage,
  generateId,
  createTextPart,
  createReasoningPart,
  createToolCallPart,
  createToolResultPart,
  createConfirmationPart,
  createErrorPart,
  createUIPatchPart,
  createMessage,
  serializeMessage,
  serializePart,
  deserializeMessage,
  deserializePart,
  validatePart,
  validateMessage,
  getMessageText,
  getToolCalls,
  getErrors,
} from '@/features/message/runtime/messageModel'

// ==================== ID Generation ====================

describe('generateId', () => {
  it('should generate a 32-character hex string', () => {
    const id = generateId()
    expect(id).toHaveLength(32)
    expect(/^[0-9a-f]+$/.test(id)).toBe(true)
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

// ==================== Part Creation ====================

describe('Part Creation Functions', () => {
  describe('createTextPart', () => {
    it('should create a text part with default format', () => {
      const part = createTextPart('Hello, world!')
      
      expect(part.type).toBe('text')
      expect(part.content).toBe('Hello, world!')
      expect(part.format).toBe('plain')
      expect(part.id).toBeDefined()
      expect(part.createdAt).toBeDefined()
    })

    it('should create a text part with markdown format', () => {
      const part = createTextPart('# Title', 'markdown')
      
      expect(part.format).toBe('markdown')
    })

    it('should create a text part with metadata', () => {
      const part = createTextPart('Test', 'plain', { source: 'test' })
      
      expect(part.metadata).toEqual({ source: 'test' })
    })
  })

  describe('createReasoningPart', () => {
    it('should create a reasoning part', () => {
      const part = createReasoningPart('Thinking...', 'analysis', 500)
      
      expect(part.type).toBe('reasoning')
      expect(part.content).toBe('Thinking...')
      expect(part.thinkingProcess).toBe('analysis')
      expect(part.duration).toBe(500)
    })
  })

  describe('createToolCallPart', () => {
    it('should create a tool call part', () => {
      const parameters = [
        { name: 'query', value: 'test', type: 'string' as const },
        { name: 'limit', value: 10, type: 'number' as const },
      ]
      const part = createToolCallPart('tool-1', 'search', parameters)
      
      expect(part.type).toBe('tool_call')
      expect(part.toolId).toBe('tool-1')
      expect(part.toolName).toBe('search')
      expect(part.parameters).toEqual(parameters)
      expect(part.status).toBe('pending')
    })
  })

  describe('createToolResultPart', () => {
    it('should create a successful tool result part', () => {
      const part = createToolResultPart(
        'call-1',
        'search',
        { results: ['a', 'b'] },
        true
      )
      
      expect(part.type).toBe('tool_result')
      expect(part.toolCallId).toBe('call-1')
      expect(part.success).toBe(true)
      expect(part.result).toEqual({ results: ['a', 'b'] })
    })

    it('should create a failed tool result part', () => {
      const part = createToolResultPart(
        'call-1',
        'search',
        null,
        false,
        'Query failed'
      )
      
      expect(part.success).toBe(false)
      expect(part.errorMessage).toBe('Query failed')
    })
  })

  describe('createConfirmationPart', () => {
    it('should create a confirmation part', () => {
      const options = [
        { id: 'yes', label: 'Yes', isDefault: true },
        { id: 'no', label: 'No', isDestructive: true },
      ]
      const expiresAt = Date.now() + 60000
      const part = createConfirmationPart('Confirm?', 'Are you sure?', options, expiresAt)
      
      expect(part.type).toBe('confirmation')
      expect(part.title).toBe('Confirm?')
      expect(part.message).toBe('Are you sure?')
      expect(part.options).toEqual(options)
      expect(part.status).toBe('pending')
      expect(part.expiresAt).toBe(expiresAt)
    })
  })

  describe('createErrorPart', () => {
    it('should create an error part', () => {
      const part = createErrorPart(
        'TOOL_ERROR',
        'Tool execution failed',
        'error',
        true,
        'Stack trace here'
      )
      
      expect(part.type).toBe('error')
      expect(part.code).toBe('TOOL_ERROR')
      expect(part.message).toBe('Tool execution failed')
      expect(part.severity).toBe('error')
      expect(part.recoverable).toBe(true)
      expect(part.details).toBe('Stack trace here')
    })
  })

  describe('createUIPatchPart', () => {
    it('should create a UI patch part', () => {
      const actions = [
        { operation: 'update' as const, path: '/title', value: 'New Title' },
        { operation: 'delete' as const, path: '/subtitle' },
      ]
      const part = createUIPatchPart('card-1', actions, 1)
      
      expect(part.type).toBe('ui_patch')
      expect(part.target).toBe('card-1')
      expect(part.actions).toEqual(actions)
      expect(part.version).toBe(1)
    })
  })
})

// ==================== Message Creation ====================

describe('createMessage', () => {
  it('should create a message with default values', () => {
    const message = createMessage('session-1', 'user')
    
    expect(message.id).toBeDefined()
    expect(message.sessionId).toBe('session-1')
    expect(message.role).toBe('user')
    expect(message.status).toBe('pending')
    expect(message.parts).toEqual([])
    expect(message.createdAt).toBeDefined()
    expect(message.updatedAt).toBeDefined()
  })

  it('should create a message with parts', () => {
    const textPart = createTextPart('Hello')
    const message = createMessage('session-1', 'assistant', [textPart])
    
    expect(message.parts).toHaveLength(1)
    expect(message.status).toBe('complete')
  })

  it('should create a message with metadata', () => {
    const message = createMessage('session-1', 'assistant', [], {
      model: 'gpt-4',
      provider: 'openai',
    })
    
    expect(message.metadata?.model).toBe('gpt-4')
    expect(message.metadata?.provider).toBe('openai')
  })
})

// ==================== Serialization ====================

describe('Serialization', () => {
  describe('serializePart', () => {
    it('should serialize a text part', () => {
      const part = createTextPart('Hello', 'markdown')
      const serialized = serializePart(part)
      
      expect(serialized.id).toBe(part.id)
      expect(serialized.type).toBe('text')
      expect(serialized.data.content).toBe('Hello')
      expect(serialized.data.format).toBe('markdown')
    })

    it('should serialize a tool call part', () => {
      const part = createToolCallPart('tool-1', 'search', [])
      const serialized = serializePart(part)
      
      expect(serialized.type).toBe('tool_call')
      expect(serialized.data.toolId).toBe('tool-1')
      expect(serialized.data.toolName).toBe('search')
    })
  })

  describe('serializeMessage', () => {
    it('should serialize a message with parts', () => {
      const parts = [createTextPart('Hello'), createTextPart('World')]
      const message = createMessage('session-1', 'assistant', parts)
      const serialized = serializeMessage(message)
      
      expect(serialized.id).toBe(message.id)
      expect(serialized.sessionId).toBe('session-1')
      expect(serialized.parts).toHaveLength(2)
    })
  })

  describe('deserializePart', () => {
    it('should deserialize a text part', () => {
      const part = createTextPart('Hello', 'markdown')
      const serialized = serializePart(part)
      const deserialized = deserializePart(serialized) as TextPart
      
      expect(deserialized.id).toBe(part.id)
      expect(deserialized.type).toBe('text')
      expect(deserialized.content).toBe('Hello')
      expect(deserialized.format).toBe('markdown')
    })

    it('should deserialize a tool call part', () => {
      const part = createToolCallPart('tool-1', 'search', [])
      const serialized = serializePart(part)
      const deserialized = deserializePart(serialized) as ToolCallPart
      
      expect(deserialized.type).toBe('tool_call')
      expect(deserialized.toolId).toBe('tool-1')
    })
  })

  describe('deserializeMessage', () => {
    it('should round-trip a message', () => {
      const parts = [
        createTextPart('Hello'),
        createReasoningPart('Thinking...'),
        createToolCallPart('tool-1', 'search', []),
      ]
      const message = createMessage('session-1', 'assistant', parts, { model: 'gpt-4' })
      
      const serialized = serializeMessage(message)
      const deserialized = deserializeMessage(serialized)
      
      expect(deserialized.id).toBe(message.id)
      expect(deserialized.sessionId).toBe('session-1')
      expect(deserialized.parts).toHaveLength(3)
      expect(deserialized.metadata?.model).toBe('gpt-4')
    })
  })
})

// ==================== Validation ====================

describe('Validation', () => {
  describe('validatePart', () => {
    it('should validate a valid text part', () => {
      const part = createTextPart('Hello')
      expect(validatePart(part)).toBe(true)
    })

    it('should validate a valid tool call part', () => {
      const part = createToolCallPart('tool-1', 'search', [])
      expect(validatePart(part)).toBe(true)
    })

    it('should reject invalid parts', () => {
      expect(validatePart(null)).toBe(false)
      expect(validatePart({})).toBe(false)
      expect(validatePart({ type: 'text' })).toBe(false)
      expect(validatePart({ id: '1', type: 'invalid', createdAt: Date.now() })).toBe(false)
    })
  })

  describe('validateMessage', () => {
    it('should validate a valid message', () => {
      const message = createMessage('session-1', 'user')
      expect(validateMessage(message)).toBe(true)
    })

    it('should validate a message with parts', () => {
      const message = createMessage('session-1', 'assistant', [createTextPart('Hello')])
      expect(validateMessage(message)).toBe(true)
    })

    it('should reject invalid messages', () => {
      expect(validateMessage(null)).toBe(false)
      expect(validateMessage({})).toBe(false)
      expect(validateMessage({ id: '1' })).toBe(false)
      expect(validateMessage({ id: '1', sessionId: 's1', role: 'invalid', status: 'pending', parts: [], createdAt: 1, updatedAt: 1 })).toBe(false)
    })

    it('should reject message with invalid parts', () => {
      const message = {
        id: '1',
        sessionId: 's1',
        role: 'assistant',
        status: 'pending',
        parts: [{ invalid: true }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(validateMessage(message)).toBe(false)
    })
  })
})

// ==================== Utility Functions ====================

describe('Utility Functions', () => {
  describe('getMessageText', () => {
    it('should extract text from message', () => {
      const message = createMessage('session-1', 'assistant', [
        createTextPart('Hello'),
        createTextPart('World'),
      ])
      
      expect(getMessageText(message)).toBe('Hello\nWorld')
    })

    it('should return empty string for message without text parts', () => {
      const message = createMessage('session-1', 'assistant', [
        createToolCallPart('tool-1', 'search', []),
      ])
      
      expect(getMessageText(message)).toBe('')
    })
  })

  describe('getToolCalls', () => {
    it('should extract tool calls from message', () => {
      const toolCall = createToolCallPart('tool-1', 'search', [])
      const message = createMessage('session-1', 'assistant', [
        createTextPart('Hello'),
        toolCall,
      ])
      
      const toolCalls = getToolCalls(message)
      expect(toolCalls).toHaveLength(1)
      expect(toolCalls[0].id).toBe(toolCall.id)
    })

    it('should return empty array for message without tool calls', () => {
      const message = createMessage('session-1', 'assistant', [
        createTextPart('Hello'),
      ])
      
      expect(getToolCalls(message)).toEqual([])
    })
  })

  describe('getErrors', () => {
    it('should extract errors from message', () => {
      const error = createErrorPart('TOOL_ERROR', 'Failed', 'error', true)
      const message = createMessage('session-1', 'assistant', [
        createTextPart('Hello'),
        error,
      ])
      
      const errors = getErrors(message)
      expect(errors).toHaveLength(1)
      expect(errors[0].code).toBe('TOOL_ERROR')
    })

    it('should return empty array for message without errors', () => {
      const message = createMessage('session-1', 'assistant', [
        createTextPart('Hello'),
      ])
      
      expect(getErrors(message)).toEqual([])
    })
  })
})
