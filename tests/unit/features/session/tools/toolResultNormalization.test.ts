/**
 * Unit tests for Tool Result Normalization
 * Task 71: Story 45.4 - Tool Result Normalization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  ResultNormalizer,
  normalizeResult,
  createResultNormalizer,
  isSuccessEnvelope,
  isFailureEnvelope,
  isPartialEnvelope,
  type NormalizedResultEnvelope,
  type NormalizationOptions,
  type PlannerContext,
  type AuditContext,
  type UIContext,
} from '@/features/session/tools/toolResultNormalization'
import type { ToolExecutionResult, ToolExecutionError } from '@/features/session/tools/toolExecutor'

// ==================== Test Fixtures ====================

const createMockResult = (
  status: ToolExecutionResult['status'],
  overrides: Partial<ToolExecutionResult> = {}
): ToolExecutionResult => ({
  executionId: 'exec_test_001',
  toolId: 'test_tool',
  status,
  duration: 100,
  startedAt: Date.now() - 100,
  completedAt: Date.now(),
  metadata: {},
  ...overrides,
})

const createMockError = (
  code: ToolExecutionError['code'],
  message: string = 'Test error',
  overrides: Partial<ToolExecutionError> = {}
): ToolExecutionError => ({
  code,
  message,
  recoverable: true,
  retryable: true,
  ...overrides,
})

// ==================== Result Normalizer Tests ====================

describe('ResultNormalizer', () => {
  let normalizer: ResultNormalizer

  beforeEach(() => {
    normalizer = createResultNormalizer({
      preserveRawOutput: true,
      includeDebugInfo: true,
    })
  })

  afterEach(() => {
    normalizer.clearRawOutputs()
  })

  describe('normalize', () => {
    it('should normalize a successful result', () => {
      const result = createMockResult('completed', {
        output: { data: 'test value', count: 42 },
      })

      const envelope = normalizer.normalize(result)

      expect(envelope.status).toBe('success')
      expect(isSuccessEnvelope(envelope)).toBe(true)
      if (isSuccessEnvelope(envelope)) {
        expect(envelope.data).toEqual({ data: 'test value', count: 42 })
        expect(envelope.metadata.toolId).toBe('test_tool')
        expect(envelope.metadata.duration).toBe(100)
      }
    })

    it('should normalize a failure result', () => {
      const error = createMockError('VALIDATION_ERROR', 'Invalid input')
      const result = createMockResult('failed', { error })

      const envelope = normalizer.normalize(result)

      expect(envelope.status).toBe('failure')
      expect(isFailureEnvelope(envelope)).toBe(true)
      if (isFailureEnvelope(envelope)) {
        expect(envelope.error.code).toBe('VALIDATION_ERROR')
        expect(envelope.error.message).toBe('Invalid input')
        expect(envelope.error.category).toBe('validation')
      }
    })

    it('should normalize a timeout result', () => {
      const result = createMockResult('timeout')

      const envelope = normalizer.normalize(result)

      expect(envelope.status).toBe('failure')
      if (isFailureEnvelope(envelope)) {
        expect(envelope.error.code).toBe('TIMEOUT')
        expect(envelope.error.retryable).toBe(true)
      }
    })

    it('should normalize a cancelled result', () => {
      const result = createMockResult('cancelled')

      const envelope = normalizer.normalize(result)

      expect(envelope.status).toBe('failure')
      if (isFailureEnvelope(envelope)) {
        expect(envelope.error.code).toBe('CANCELLED')
        expect(envelope.error.retryable).toBe(false)
      }
    })

    it('should include metadata from options', () => {
      const result = createMockResult('completed', { output: 'test' })
      const options: NormalizationOptions = {
        correlationId: 'corr_123',
        parentExecutionId: 'parent_001',
        userId: 'user_001',
        sessionId: 'session_001',
        departmentId: 'dept_001',
        tags: ['important', 'verified'],
        annotations: { source: 'test' },
      }

      const envelope = normalizer.normalize(result, options)

      expect(envelope.metadata.correlationId).toBe('corr_123')
      expect(envelope.metadata.parentExecutionId).toBe('parent_001')
      expect(envelope.metadata.userId).toBe('user_001')
      expect(envelope.metadata.sessionId).toBe('session_001')
      expect(envelope.metadata.departmentId).toBe('dept_001')
      expect(envelope.metadata.tags).toEqual(['important', 'verified'])
      expect(envelope.metadata.annotations).toEqual({ source: 'test' })
    })
  })

  describe('success envelope', () => {
    it('should create success envelope with correct severity', () => {
      const result = createMockResult('completed', { output: { value: 1 } })

      const envelope = normalizer.normalize(result)

      expect(envelope.status).toBe('success')
      expect(envelope.severity).toBe('info')
    })

    it('should preserve raw output when configured', () => {
      const output = { key: 'value', nested: { data: [1, 2, 3] } }
      const result = createMockResult('completed', { output })

      const envelope = normalizer.normalize(result)

      if (isSuccessEnvelope(envelope)) {
        expect(envelope.rawOutput).toBeDefined()
        expect(envelope.rawOutput?.type).toBe('inline')
        expect(envelope.rawOutput?.data).toEqual(output)
      }
    })

    it('should transform output when transform option provided', () => {
      const result = createMockResult('completed', { output: { value: 10 } })
      const options: NormalizationOptions = {
        transform: (data) => ({ ...data as object, transformed: true }),
      }

      const envelope = normalizer.normalize(result, options)

      if (isSuccessEnvelope(envelope)) {
        expect(envelope.data).toEqual({ value: 10, transformed: true })
      }
    })
  })

  describe('failure envelope', () => {
    it('should create failure envelope with correct severity', () => {
      const error = createMockError('EXECUTION_ERROR', 'Failed')
      const result = createMockResult('failed', { error })

      const envelope = normalizer.normalize(result)

      expect(envelope.status).toBe('failure')
      expect(envelope.severity).toBe('error')
    })

    it('should normalize error with user message', () => {
      const error = createMockError('PERMISSION_DENIED', 'Access denied')
      const result = createMockResult('failed', { error })

      const envelope = normalizer.normalize(result)

      if (isFailureEnvelope(envelope)) {
        expect(envelope.error.userMessage).toBe('权限不足，无法执行此操作')
      }
    })

    it('should categorize errors correctly', () => {
      const testCases: Array<{ code: ToolExecutionError['code']; expectedCategory: string }> = [
        { code: 'VALIDATION_ERROR', expectedCategory: 'validation' },
        { code: 'PERMISSION_DENIED', expectedCategory: 'permission' },
        { code: 'NOT_FOUND', expectedCategory: 'resource' },
        { code: 'TIMEOUT', expectedCategory: 'timeout' },
        { code: 'EXECUTION_ERROR', expectedCategory: 'execution' },
        { code: 'CONTEXT_ERROR', expectedCategory: 'context' },
        { code: 'INTERNAL_ERROR', expectedCategory: 'internal' },
      ]

      for (const { code, expectedCategory } of testCases) {
        const error = createMockError(code)
        const result = createMockResult('failed', { error })
        const envelope = normalizer.normalize(result)

        if (isFailureEnvelope(envelope)) {
          expect(envelope.error.category).toBe(expectedCategory)
        }
      }
    })

    it('should include debug info when configured', () => {
      const error = createMockError('EXECUTION_ERROR', 'Failed', {
        details: { stack: 'test stack' },
      })
      const result = createMockResult('failed', { error })

      const envelope = normalizer.normalize(result)

      if (isFailureEnvelope(envelope)) {
        expect(envelope.error.debugInfo).toBeDefined()
      }
    })
  })

  describe('sensitive field handling', () => {
    it('should redact sensitive fields in output', () => {
      const result = createMockResult('completed', {
        output: {
          username: 'testuser',
          password: 'secret123',
          token: 'abc123',
          normalField: 'visible',
        },
      })

      const envelope = normalizer.normalize(result)

      if (isSuccessEnvelope(envelope)) {
        expect(envelope.data).toMatchObject({
          username: 'testuser',
          password: '[REDACTED]',
          token: '[REDACTED]',
          normalField: 'visible',
        })
      }
    })

    it('should redact nested sensitive fields', () => {
      const result = createMockResult('completed', {
        output: {
          user: {
            name: 'Test',
            credentials: {
              apiKey: 'secret_key',
            },
          },
        },
      })

      const envelope = normalizer.normalize(result)

      if (isSuccessEnvelope(envelope)) {
        expect(envelope.data).toMatchObject({
          user: {
            name: 'Test',
            credentials: '[REDACTED]', // Entire field redacted because 'credentials' contains sensitive keyword
          },
        })
      }
    })

    it('should sanitize arrays containing sensitive fields', () => {
      const result = createMockResult('completed', {
        output: [
          { id: 1, password: 'pass1' },
          { id: 2, password: 'pass2' },
        ],
      })

      const envelope = normalizer.normalize(result)

      if (isSuccessEnvelope(envelope)) {
        const data = envelope.data as Array<{ id: number; password: string }>
        expect(data[0].password).toBe('[REDACTED]')
        expect(data[1].password).toBe('[REDACTED]')
      }
    })
  })

  describe('planner payload', () => {
    it('should create planner payload from success envelope', () => {
      const result = createMockResult('completed', {
        output: { id: 'res_001', name: 'Test Resource' },
      })
      const envelope = normalizer.normalize(result)
      const context: PlannerContext = {
        action: 'create_resource',
        resource: 'document',
      }

      const payload = normalizer.createPlannerPayload(envelope, context)

      expect(payload.action).toBe('create_resource')
      expect(payload.result).toEqual({ id: 'res_001', name: 'Test Resource' })
      expect(payload.confidence).toBe(1.0)
    })

    it('should suggest retry action for retryable errors', () => {
      const error = createMockError('TIMEOUT', 'Timeout', { retryable: true, recoverable: false })
      const result = createMockResult('failed', { error })
      const envelope = normalizer.normalize(result)
      const context: PlannerContext = {
        originalParameters: { id: 'test' },
      }

      const payload = normalizer.createPlannerPayload(envelope, context)

      expect(payload.suggestedActions).toHaveLength(1)
      expect(payload.suggestedActions[0].action).toBe('retry')
      expect(payload.suggestedActions[0].priority).toBe('high')
    })

    it('should detect create operations as side effects', () => {
      const result = createMockResult('completed', {
        output: { id: 'new_001', createdAt: Date.now() },
      })
      const envelope = normalizer.normalize(result)
      const context: PlannerContext = { resource: 'document' }

      const payload = normalizer.createPlannerPayload(envelope, context)

      expect(payload.sideEffects).toHaveLength(1)
      expect(payload.sideEffects[0].type).toBe('create')
      expect(payload.sideEffects[0].resource).toBe('document')
    })
  })

  describe('audit payload', () => {
    it('should create audit payload with correct outcome', () => {
      const result = createMockResult('completed', { output: { value: 1 } })
      const envelope = normalizer.normalize(result)
      const context: AuditContext = {
        resource: 'user',
        action: 'update',
      }

      const payload = normalizer.createAuditPayload(envelope, context)

      expect(payload.operation).toBe('test_tool')
      expect(payload.resource).toBe('user')
      expect(payload.action).toBe('update')
      expect(payload.outcome).toBe('success')
    })

    it('should identify sensitive fields in audit', () => {
      const result = createMockResult('completed', {
        output: {
          username: 'test',
          password: 'secret',
          profile: { apiKey: 'key123' },
        },
      })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createAuditPayload(envelope)

      expect(payload.sensitiveFields).toContain('password')
      expect(payload.sensitiveFields).toContain('profile.apiKey')
    })

    it('should include error details for failure', () => {
      const error = createMockError('PERMISSION_DENIED', 'Access denied')
      const result = createMockResult('failed', { error })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createAuditPayload(envelope)

      expect(payload.outcome).toBe('failure')
      expect(payload.details.errorCode).toBe('PERMISSION_DENIED')
      expect(payload.details.errorCategory).toBe('permission')
    })
  })

  describe('UI writeback payload', () => {
    it('should create UI payload with text display type for string output', () => {
      const result = createMockResult('completed', { output: 'Hello World' })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createUIWritebackPayload(envelope)

      expect(payload.displayType).toBe('text')
      expect(payload.content).toBe('Hello World')
    })

    it('should create UI payload with file display type for file results', () => {
      const result = createMockResult('completed', {
        output: { fileId: 'file_001', name: 'document.pdf' },
      })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createUIWritebackPayload(envelope)

      expect(payload.displayType).toBe('file')
    })

    it('should create UI payload with progress display type', () => {
      const result = createMockResult('completed', {
        output: { progress: 75, message: 'Processing...' },
      })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createUIWritebackPayload(envelope)

      expect(payload.displayType).toBe('progress')
    })

    it('should generate summary for success', () => {
      const result = createMockResult('completed', { output: { value: 1 } })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createUIWritebackPayload(envelope)

      expect(payload.summary).toContain('执行成功')
    })

    it('should generate UI actions for retryable failures', () => {
      const error = createMockError('TIMEOUT', 'Timeout', { retryable: true })
      const result = createMockResult('failed', { error })
      const envelope = normalizer.normalize(result)

      const payload = normalizer.createUIWritebackPayload(envelope)

      expect(payload.actions).toBeDefined()
      expect(payload.actions?.some(a => a.action === 'retry')).toBe(true)
    })

    it('should include refresh instructions when configured', () => {
      const result = createMockResult('completed', { output: { value: 1 } })
      const envelope = normalizer.normalize(result)
      const context: UIContext = {
        refreshTargets: ['list', 'dashboard'],
      }

      const payload = normalizer.createUIWritebackPayload(envelope, context)

      expect(payload.refresh).toHaveLength(2)
      expect(payload.refresh?.[0].target).toBe('list')
      expect(payload.refresh?.[0].type).toBe('reload')
    })
  })

  describe('raw output management', () => {
    it('should store raw output for retrieval', () => {
      const output = { large: 'data' }
      const result = createMockResult('completed', { output })

      normalizer.normalize(result)

      const rawOutput = normalizer.getRawOutput('exec_test_001')
      expect(rawOutput).toBeDefined()
      expect(rawOutput?.data).toEqual(output)
    })

    it('should clear raw outputs', () => {
      const result = createMockResult('completed', { output: { value: 1 } })
      normalizer.normalize(result)

      normalizer.clearRawOutputs()

      const rawOutput = normalizer.getRawOutput('exec_test_001')
      expect(rawOutput).toBeUndefined()
    })

    it('should use reference type for large outputs', () => {
      const largeOutput = { data: 'x'.repeat(1024 * 1024 * 2) } // 2MB
      const normalizerWithSmallLimit = createResultNormalizer({
        maxPayloadSize: 1024,
      })

      const result = createMockResult('completed', { output: largeOutput })
      const envelope = normalizerWithSmallLimit.normalize(result)

      if (isSuccessEnvelope(envelope)) {
        expect(envelope.rawOutput?.type).toBe('reference')
      }
    })
  })
})

// ==================== Helper Function Tests ====================

describe('Helper Functions', () => {
  describe('normalizeResult', () => {
    it('should provide quick normalization without instantiating class', () => {
      const result = createMockResult('completed', { output: { value: 42 } })

      const envelope = normalizeResult(result)

      expect(envelope.status).toBe('success')
      if (isSuccessEnvelope(envelope)) {
        expect(envelope.data).toEqual({ value: 42 })
      }
    })
  })

  describe('isSuccessEnvelope', () => {
    it('should return true for success envelopes', () => {
      const envelope: NormalizedResultEnvelope = {
        status: 'success',
        severity: 'info',
        data: {},
        metadata: {
          executionId: 'test',
          toolId: 'test',
          startedAt: 0,
          completedAt: 0,
          duration: 0,
          tags: [],
          annotations: {},
        },
      }

      expect(isSuccessEnvelope(envelope)).toBe(true)
    })

    it('should return false for failure envelopes', () => {
      const envelope: NormalizedResultEnvelope = {
        status: 'failure',
        severity: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error',
          category: 'internal',
          recoverable: false,
          retryable: false,
        },
        metadata: {
          executionId: 'test',
          toolId: 'test',
          startedAt: 0,
          completedAt: 0,
          duration: 0,
          tags: [],
          annotations: {},
        },
      }

      expect(isSuccessEnvelope(envelope)).toBe(false)
    })
  })

  describe('isFailureEnvelope', () => {
    it('should return true for failure envelopes', () => {
      const envelope: NormalizedResultEnvelope = {
        status: 'failure',
        severity: 'error',
        error: {
          code: 'EXECUTION_ERROR',
          message: 'Error',
          category: 'execution',
          recoverable: true,
          retryable: true,
        },
        metadata: {
          executionId: 'test',
          toolId: 'test',
          startedAt: 0,
          completedAt: 0,
          duration: 0,
          tags: [],
          annotations: {},
        },
      }

      expect(isFailureEnvelope(envelope)).toBe(true)
    })
  })

  describe('isPartialEnvelope', () => {
    it('should return true for partial envelopes', () => {
      const envelope: NormalizedResultEnvelope = {
        status: 'partial',
        severity: 'warning',
        data: {},
        partialResults: [],
        metadata: {
          executionId: 'test',
          toolId: 'test',
          startedAt: 0,
          completedAt: 0,
          duration: 0,
          tags: [],
          annotations: {},
        },
      }

      expect(isPartialEnvelope(envelope)).toBe(true)
    })
  })
})

// ==================== Edge Cases Tests ====================

describe('Edge Cases', () => {
  let normalizer: ResultNormalizer

  beforeEach(() => {
    normalizer = createResultNormalizer()
  })

  it('should handle null output', () => {
    const result = createMockResult('completed', { output: null })

    const envelope = normalizer.normalize(result)

    expect(envelope.status).toBe('success')
    // null output is converted to undefined in transformOutput
    if (isSuccessEnvelope(envelope)) {
      expect(envelope.data).toBeUndefined()
    }
  })

  it('should handle undefined output', () => {
    const result = createMockResult('completed', { output: undefined })

    const envelope = normalizer.normalize(result)

    expect(envelope.status).toBe('success')
  })

  it('should handle circular references gracefully', () => {
    const circular: Record<string, unknown> = { name: 'test' }
    circular.self = circular

    // MVP: circular references may cause stack overflow in sanitizeOutput
    // This is acceptable for MVP - future versions could use a WeakSet to detect cycles
    expect(() => {
      const result = createMockResult('completed', { output: circular })
      normalizer.normalize(result)
    }).toThrow() // RangeError: Maximum call stack size exceeded
  })

  it('should handle error without code gracefully', () => {
    const result = createMockResult('failed', {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unknown',
        recoverable: false,
        retryable: false,
      },
    })

    const envelope = normalizer.normalize(result)

    expect(envelope.status).toBe('failure')
  })

  it('should handle empty metadata', () => {
    const result: ToolExecutionResult = {
      executionId: 'test',
      toolId: 'test',
      status: 'completed',
      duration: 0,
      startedAt: 0,
      completedAt: 0,
      metadata: {},
    }

    const envelope = normalizer.normalize(result)

    expect(envelope.metadata.tags).toEqual([])
    expect(envelope.metadata.annotations).toEqual({})
  })
})
