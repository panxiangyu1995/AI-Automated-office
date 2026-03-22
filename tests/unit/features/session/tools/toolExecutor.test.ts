/**
 * Tests for Tool Executor and Validation
 * Task 69: Story 45.2 - Tool Executor and Validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ToolExecutor,
  createRuntimeContext,
  createExecutionInput,
  isSuccessfulResult,
  isFailedResult,
  isRetryableError,
  isRecoverableError,
  type ToolRuntimeContext,
  type ToolExecutionResult,
  type ToolExecutionError,
} from '@/features/session/tools/toolExecutor'
import {
  ToolRegistry,
  defineTool,
  stringParam,
  numberParam,
} from '@/features/session/tools'

describe('ToolExecutor', () => {
  let registry: ToolRegistry
  let executor: ToolExecutor
  let context: ToolRuntimeContext

  beforeEach(() => {
    registry = new ToolRegistry()
    executor = new ToolExecutor(registry)
    context = createRuntimeContext('session-1', 'user-1', 'tenant-1', {
      permissions: ['execute:test_tool'],
    })
  })

  describe('Tool Registration', () => {
    it('registers a tool executor', () => {
      const handler = vi.fn()
      executor.registerExecutor('tool1', handler)
      expect(executor.hasExecutor('tool1')).toBe(true)
    })

    it('unregisters a tool executor', () => {
      const handler = vi.fn()
      executor.registerExecutor('tool1', handler)
      executor.unregisterExecutor('tool1')
      expect(executor.hasExecutor('tool1')).toBe(false)
    })
  })

  describe('Input Validation', () => {
    it('validates input against descriptor schema', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withParameter(stringParam('name', 'The name', true))
        .withParameter(numberParam('count', 'The count', false))
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const result = await executor.execute(
        createExecutionInput('test_tool', { name: 'test' }, context)
      )

      expect(result.status).toBe('completed')
    })

    it('fails on missing required parameters', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withParameter(stringParam('name', 'The name', true))
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context) // Missing 'name'
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })

    it('validates parameter types', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withParameter(numberParam('count', 'The count', true))
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const result = await executor.execute(
        createExecutionInput('test_tool', { count: 'not-a-number' }, context)
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Permission Checks', () => {
    it('checks required permissions', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withPermission({ type: 'execute', resource: 'admin_resource', description: 'Requires admin' })
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const limitedContext = createRuntimeContext('s1', 'u1', 't1', {
        permissions: ['execute:user_resource'], // Missing admin_resource
      })

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, limitedContext)
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('PERMISSION_DENIED')
    })

    it('allows execution with correct permissions', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withPermission({ type: 'execute', resource: 'test_tool', description: 'Required' })
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context)
      )

      expect(result.status).toBe('completed')
    })
  })

  describe('Context Injection', () => {
    it('injects runtime context into parameters', async () => {
      let receivedInput: Record<string, unknown> | null = null

      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withContextRequirements({ requiresSession: true, requiresUserContext: true })
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', (input) => {
        receivedInput = input
        return 'ok'
      })

      await executor.execute(createExecutionInput('test_tool', {}, context))

      expect(receivedInput).not.toBeNull()
      expect(receivedInput?.sessionId).toBe('session-1')
      expect(receivedInput?.userId).toBe('user-1')
      expect(receivedInput?._context).toBeDefined()
    })

    it('does not override explicit parameters', async () => {
      let receivedInput: Record<string, unknown> | null = null

      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withParameter(stringParam('sessionId', 'The session', false))
        .withContextRequirements({ requiresSession: true })
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', (input) => {
        receivedInput = input
        return 'ok'
      })

      await executor.execute(
        createExecutionInput('test_tool', { sessionId: 'explicit-session' }, context)
      )

      expect(receivedInput?.sessionId).toBe('explicit-session')
    })
  })

  describe('Error Normalization', () => {
    it('normalizes timeout errors', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withExecutionMode('async')
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', () => new Promise(() => {})) // Never resolves

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context, { timeout: 100 })
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('TIMEOUT')
      expect(result.error?.retryable).toBe(true)
    })

    it('normalizes execution errors', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', () => {
        throw new Error('Something went wrong')
      })

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context)
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('EXECUTION_ERROR')
      expect(result.error?.message).toBe('Something went wrong')
    })

    it('normalizes unknown errors', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', () => {
        throw 'string error'
      })

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context)
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('Lifecycle Tracking', () => {
    it('emits lifecycle events', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const events: string[] = []
      executor.addListener((event) => {
        events.push(event.type)
      })

      await executor.execute(createExecutionInput('test_tool', {}, context))

      expect(events).toContain('tool_call_start')
      expect(events).toContain('tool_call_validation')
      expect(events).toContain('tool_call_context_inject')
      expect(events).toContain('tool_call_execute')
      expect(events).toContain('tool_call_success')
      expect(events).toContain('tool_call_complete')
    })

    it('includes execution id in events', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      let receivedExecutionId: string | null = null
      executor.addListener((event) => {
        if (!receivedExecutionId) {
          receivedExecutionId = event.executionId
        }
      })

      await executor.execute(createExecutionInput('test_tool', {}, context))

      expect(receivedExecutionId).toMatch(/^exec_\d+_\d+$/)
    })
  })

  describe('Timeout Handling', () => {
    it('uses default timeout when not specified', async () => {
      const customExecutor = new ToolExecutor(registry, { defaultTimeout: 500 })

      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withExecutionMode('async')
        .build()

      registry.register(descriptor)
      customExecutor.registerExecutor('test_tool', () => new Promise(() => {}))

      const start = Date.now()
      const result = await customExecutor.execute(
        createExecutionInput('test_tool', {}, context)
      )
      const duration = Date.now() - start

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('TIMEOUT')
      expect(duration).toBeLessThan(1000)
    })

    it('respects max timeout limit', async () => {
      const customExecutor = new ToolExecutor(registry, {
        defaultTimeout: 500,
        maxTimeout: 1000,
      })

      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .withExecutionMode('async')
        .build()

      registry.register(descriptor)
      customExecutor.registerExecutor('test_tool', () => new Promise(() => {}))

      const start = Date.now()
      const result = await customExecutor.execute(
        createExecutionInput('test_tool', {}, context, { timeout: 5000 })
      )
      const duration = Date.now() - start

      expect(result.status).toBe('failed')
      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Tool Availability', () => {
    it('fails for disabled tools', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      registry.register(descriptor)
      registry.disable('test_tool')
      executor.registerExecutor('test_tool', vi.fn().mockReturnValue('ok'))

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context)
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('EXECUTION_ERROR')
    })

    it('fails for non-existent tools', async () => {
      const result = await executor.execute(
        createExecutionInput('nonexistent', {}, context)
      )

      expect(result.status).toBe('failed')
      expect(result.error?.code).toBe('NOT_FOUND')
    })
  })

  describe('Success Results', () => {
    it('returns successful result with output', async () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      registry.register(descriptor)
      executor.registerExecutor('test_tool', () => ({ result: 'success' }))

      const result = await executor.execute(
        createExecutionInput('test_tool', {}, context)
      )

      expect(result.status).toBe('completed')
      expect(result.output).toEqual({ result: 'success' })
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(result.startedAt).toBeLessThanOrEqual(result.completedAt)
    })
  })
})

describe('Helper Functions', () => {
  describe('createRuntimeContext', () => {
    it('creates a runtime context with required fields', () => {
      const ctx = createRuntimeContext('s1', 'u1', 't1')

      expect(ctx.sessionId).toBe('s1')
      expect(ctx.userId).toBe('u1')
      expect(ctx.tenantId).toBe('t1')
      expect(ctx.permissions).toEqual([])
      expect(ctx.metadata).toEqual({})
      expect(ctx.timestamp).toBeGreaterThan(0)
    })

    it('merges optional fields', () => {
      const ctx = createRuntimeContext('s1', 'u1', 't1', {
        permissions: ['perm1'],
        departmentId: 'd1',
      })

      expect(ctx.permissions).toEqual(['perm1'])
      expect(ctx.departmentId).toBe('d1')
    })
  })

  describe('createExecutionInput', () => {
    it('creates an execution input', () => {
      const ctx = createRuntimeContext('s1', 'u1', 't1')
      const input = createExecutionInput('tool1', { a: 1 }, ctx)

      expect(input.toolId).toBe('tool1')
      expect(input.parameters).toEqual({ a: 1 })
      expect(input.context).toBe(ctx)
    })

    it('includes optional fields', () => {
      const ctx = createRuntimeContext('s1', 'u1', 't1')
      const input = createExecutionInput('tool1', {}, ctx, {
        timeout: 5000,
        metadata: { key: 'value' },
      })

      expect(input.timeout).toBe(5000)
      expect(input.metadata).toEqual({ key: 'value' })
    })
  })

  describe('Result Helpers', () => {
    it('isSuccessfulResult returns true for completed', () => {
      const result: ToolExecutionResult = {
        executionId: 'e1',
        toolId: 't1',
        status: 'completed',
        duration: 100,
        startedAt: 1000,
        completedAt: 1100,
        metadata: {},
      }

      expect(isSuccessfulResult(result)).toBe(true)
    })

    it('isFailedResult returns true for failed', () => {
      const result: ToolExecutionResult = {
        executionId: 'e1',
        toolId: 't1',
        status: 'failed',
        error: { code: 'EXECUTION_ERROR', message: 'Error', recoverable: false, retryable: false },
        duration: 100,
        startedAt: 1000,
        completedAt: 1100,
        metadata: {},
      }

      expect(isFailedResult(result)).toBe(true)
    })
  })

  describe('Error Helpers', () => {
    it('isRetryableError returns correct value', () => {
      const retryableError: ToolExecutionError = {
        code: 'TIMEOUT',
        message: 'Timeout',
        recoverable: true,
        retryable: true,
      }

      const nonRetryableError: ToolExecutionError = {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied',
        recoverable: false,
        retryable: false,
      }

      expect(isRetryableError(retryableError)).toBe(true)
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })

    it('isRecoverableError returns correct value', () => {
      const recoverableError: ToolExecutionError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        recoverable: true,
        retryable: false,
      }

      const nonRecoverableError: ToolExecutionError = {
        code: 'INTERNAL_ERROR',
        message: 'Internal error',
        recoverable: false,
        retryable: false,
      }

      expect(isRecoverableError(recoverableError)).toBe(true)
      expect(isRecoverableError(nonRecoverableError)).toBe(false)
    })
  })
})