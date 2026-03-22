/**
 * Tool Executor and Validation
 * Task 69: Story 45.2 - Tool Executor and Validation
 * 
 * This module provides a unified tool executor with input validation,
 * runtime context injection, error normalization, and lifecycle tracking.
 */

import type {
  ToolDescriptor,
} from './toolDescriptor'
import { validateParameters, isToolAvailable } from './toolDescriptor'
import type { ToolRegistry } from './toolRegistry'

// ==================== Types ====================

/**
 * Runtime context passed to tool executors
 */
export interface ToolRuntimeContext {
  sessionId: string
  userId: string
  tenantId: string
  departmentId?: string
  pageId?: string
  resourceId?: string
  permissions: string[]
  metadata: Record<string, unknown>
  timestamp: number
}

/**
 * Tool execution input
 */
export interface ToolExecutionInput {
  toolId: string
  parameters: Record<string, unknown>
  context: ToolRuntimeContext
  executionId?: string
  parentExecutionId?: string
  timeout?: number
  metadata?: Record<string, unknown>
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  executionId: string
  toolId: string
  status: ToolExecutionStatus
  output?: unknown
  error?: ToolExecutionError
  duration: number
  startedAt: number
  completedAt: number
  metadata: Record<string, unknown>
}

/**
 * Tool execution status
 */
export type ToolExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

/**
 * Normalized execution error
 */
export interface ToolExecutionError {
  code: ToolErrorCode
  message: string
  details?: Record<string, unknown>
  recoverable: boolean
  retryable: boolean
}

/**
 * Tool error codes
 */
export type ToolErrorCode =
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'TIMEOUT'
  | 'EXECUTION_ERROR'
  | 'CONTEXT_ERROR'
  | 'CANCELLED'
  | 'INTERNAL_ERROR'

/**
 * Tool call lifecycle event
 */
export interface ToolCallLifecycleEvent {
  type: ToolCallEventType
  executionId: string
  toolId: string
  timestamp: number
  data?: Record<string, unknown>
}

/**
 * Tool call event types
 */
export type ToolCallEventType =
  | 'tool_call_start'
  | 'tool_call_validation'
  | 'tool_call_context_inject'
  | 'tool_call_execute'
  | 'tool_call_success'
  | 'tool_call_error'
  | 'tool_call_complete'

/**
 * Tool executor function type
 */
export type ToolExecutorFn = (
  input: Record<string, unknown>,
  context: ToolRuntimeContext
) => Promise<unknown> | unknown

/**
 * Tool executor configuration
 */
export interface ToolExecutorConfig {
  defaultTimeout: number
  maxTimeout: number
  validateInput: boolean
  injectContext: boolean
  trackLifecycle: boolean
  normalizeErrors: boolean
}

/**
 * Tool executor listener
 */
export type ToolExecutorListener = (event: ToolCallLifecycleEvent) => void

// ==================== Default Configuration ====================

const DEFAULT_CONFIG: ToolExecutorConfig = {
  defaultTimeout: 30000,
  maxTimeout: 300000,
  validateInput: true,
  injectContext: true,
  trackLifecycle: true,
  normalizeErrors: true,
}

// ==================== Tool Executor Class ====================

/**
 * Unified Tool Executor
 * 
 * Provides:
 * - Input validation against descriptor schema
 * - Runtime context injection
 * - Error normalization
 * - Lifecycle tracking
 */
export class ToolExecutor {
  private registry: ToolRegistry
  private executors: Map<string, ToolExecutorFn> = new Map()
  private listeners: Set<ToolExecutorListener> = new Set()
  private config: ToolExecutorConfig
  private executionCounter: number = 0

  constructor(registry: ToolRegistry, config: Partial<ToolExecutorConfig> = {}) {
    this.registry = registry
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Register a tool executor function
   */
  registerExecutor(toolId: string, executor: ToolExecutorFn): void {
    this.executors.set(toolId, executor)
  }

  /**
   * Unregister a tool executor function
   */
  unregisterExecutor(toolId: string): void {
    this.executors.delete(toolId)
  }

  /**
   * Check if an executor is registered
   */
  hasExecutor(toolId: string): boolean {
    return this.executors.has(toolId)
  }

  /**
   * Add lifecycle event listener
   */
  addListener(listener: ToolExecutorListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Execute a tool
   */
  async execute(input: ToolExecutionInput): Promise<ToolExecutionResult> {
    const executionId = input.executionId || this.generateExecutionId()
    const startedAt = Date.now()

    // Emit start event
    this.emitEvent({
      type: 'tool_call_start',
      executionId,
      toolId: input.toolId,
      timestamp: startedAt,
      data: { parameters: input.parameters },
    })

    try {
      // Step 1: Get tool descriptor
      const descriptor = this.registry.get(input.toolId)
      if (!descriptor) {
        return this.createErrorResult(
          executionId,
          input.toolId,
          startedAt,
          {
            code: 'NOT_FOUND',
            message: `Tool not found: ${input.toolId}`,
            recoverable: false,
            retryable: false,
          }
        )
      }

      // Step 2: Check availability
      if (!isToolAvailable(descriptor)) {
        return this.createErrorResult(
          executionId,
          input.toolId,
          startedAt,
          {
            code: 'EXECUTION_ERROR',
            message: `Tool is not available: ${descriptor.deprecated ? 'deprecated' : 'disabled'}`,
            details: { deprecated: descriptor.deprecated, enabled: descriptor.enabled },
            recoverable: false,
            retryable: false,
          }
        )
      }

      // Step 3: Validate input
      if (this.config.validateInput) {
        this.emitEvent({
          type: 'tool_call_validation',
          executionId,
          toolId: input.toolId,
          timestamp: Date.now(),
          data: { phase: 'input_validation' },
        })

        const validation = this.validateInput(descriptor, input.parameters)
        if (!validation.valid) {
          return this.createErrorResult(
            executionId,
            input.toolId,
            startedAt,
            {
              code: 'VALIDATION_ERROR',
              message: `Input validation failed: ${validation.errors.join(', ')}`,
              details: { errors: validation.errors },
              recoverable: true,
              retryable: false,
            }
          )
        }
      }

      // Step 4: Check permissions
      const permissionCheck = this.checkPermissions(descriptor, input.context)
      if (!permissionCheck.allowed) {
        return this.createErrorResult(
          executionId,
          input.toolId,
          startedAt,
          {
            code: 'PERMISSION_DENIED',
            message: `Permission denied: ${permissionCheck.reason}`,
            details: { required: permissionCheck.required, missing: permissionCheck.missing },
            recoverable: false,
            retryable: false,
          }
        )
      }

      // Step 5: Inject runtime context
      let enrichedInput = input.parameters
      if (this.config.injectContext) {
        this.emitEvent({
          type: 'tool_call_context_inject',
          executionId,
          toolId: input.toolId,
          timestamp: Date.now(),
          data: { phase: 'context_injection' },
        })

        enrichedInput = this.injectContext(input.parameters, input.context, descriptor)
      }

      // Step 6: Get executor
      const executor = this.executors.get(input.toolId)
      if (!executor) {
        return this.createErrorResult(
          executionId,
          input.toolId,
          startedAt,
          {
            code: 'NOT_FOUND',
            message: `No executor registered for tool: ${input.toolId}`,
            recoverable: false,
            retryable: false,
          }
        )
      }

      // Step 7: Execute with timeout
      this.emitEvent({
        type: 'tool_call_execute',
        executionId,
        toolId: input.toolId,
        timestamp: Date.now(),
        data: { phase: 'execution_start' },
      })

      const timeout = Math.min(
        input.timeout || this.config.defaultTimeout,
        this.config.maxTimeout
      )

      const result = await this.executeWithTimeout(
        executor,
        enrichedInput,
        input.context,
        timeout
      )

      const completedAt = Date.now()
      const duration = completedAt - startedAt

      // Success
      this.emitEvent({
        type: 'tool_call_success',
        executionId,
        toolId: input.toolId,
        timestamp: completedAt,
        data: { duration },
      })

      this.emitEvent({
        type: 'tool_call_complete',
        executionId,
        toolId: input.toolId,
        timestamp: completedAt,
        data: { status: 'completed', duration },
      })

      return {
        executionId,
        toolId: input.toolId,
        status: 'completed',
        output: result,
        duration,
        startedAt,
        completedAt,
        metadata: input.metadata || {},
      }
    } catch (error) {
      const completedAt = Date.now()
      const duration = completedAt - startedAt

      // Normalize error
      const normalizedError = this.config.normalizeErrors
        ? this.normalizeError(error)
        : this.createUnknownError(error)

      this.emitEvent({
        type: 'tool_call_error',
        executionId,
        toolId: input.toolId,
        timestamp: completedAt,
        data: { error: normalizedError, duration },
      })

      this.emitEvent({
        type: 'tool_call_complete',
        executionId,
        toolId: input.toolId,
        timestamp: completedAt,
        data: { status: 'failed', duration },
      })

      return {
        executionId,
        toolId: input.toolId,
        status: 'failed',
        error: normalizedError,
        duration,
        startedAt,
        completedAt,
        metadata: input.metadata || {},
      }
    }
  }

  /**
   * Cancel an execution (for streaming/async tools)
   */
  cancel(executionId: string): boolean {
    // In a full implementation, this would cancel running executions
    // For now, just emit an event
    this.emitEvent({
      type: 'tool_call_complete',
      executionId,
      toolId: '',
      timestamp: Date.now(),
      data: { status: 'cancelled' },
    })
    return true
  }

  // ==================== Private Methods ====================

  private generateExecutionId(): string {
    this.executionCounter++
    return `exec_${Date.now()}_${this.executionCounter}`
  }

  private validateInput(
    descriptor: ToolDescriptor,
    parameters: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    return validateParameters(descriptor, parameters)
  }

  private checkPermissions(
    descriptor: ToolDescriptor,
    context: ToolRuntimeContext
  ): { allowed: boolean; reason?: string; required?: string[]; missing?: string[] } {
    if (!descriptor.permissions || descriptor.permissions.length === 0) {
      return { allowed: true }
    }

    const required = descriptor.permissions.map(p => `${p.type}:${p.resource}`)
    const missing = required.filter(p => !context.permissions.includes(p))

    if (missing.length > 0) {
      return {
        allowed: false,
        reason: 'Missing required permissions',
        required,
        missing,
      }
    }

    return { allowed: true }
  }

  private injectContext(
    parameters: Record<string, unknown>,
    context: ToolRuntimeContext,
    descriptor: ToolDescriptor
  ): Record<string, unknown> {
    const enriched = { ...parameters }

    // Add context requirements based on descriptor
    if (descriptor.contextRequirements) {
      const req = descriptor.contextRequirements

      if (req.requiresSession && !enriched.sessionId) {
        enriched.sessionId = context.sessionId
      }
      if (req.requiresUserContext && !enriched.userId) {
        enriched.userId = context.userId
      }
      if (req.requiresWorkspace && !enriched.tenantId) {
        enriched.tenantId = context.tenantId
      }
      if (context.departmentId) {
        enriched.departmentId = context.departmentId
      }
      if (context.pageId) {
        enriched.pageId = context.pageId
      }
      if (context.resourceId) {
        enriched.resourceId = context.resourceId
      }
    }

    // Always add timestamp if not present
    if (!enriched._context) {
      enriched._context = {
        ...context,
        timestamp: context.timestamp || Date.now(),
      }
    }

    return enriched
  }

  private async executeWithTimeout(
    executor: ToolExecutorFn,
    input: Record<string, unknown>,
    context: ToolRuntimeContext,
    timeout: number
  ): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`))
      }, timeout)

      Promise.resolve(executor(input, context))
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  private normalizeError(error: unknown): ToolExecutionError {
    if (this.isToolExecutionError(error)) {
      return error
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return {
          code: 'TIMEOUT',
          message: error.message,
          recoverable: true,
          retryable: true,
        }
      }

      if (error.message.includes('permission')) {
        return {
          code: 'PERMISSION_DENIED',
          message: error.message,
          recoverable: false,
          retryable: false,
        }
      }

      if (error.message.includes('validation')) {
        return {
          code: 'VALIDATION_ERROR',
          message: error.message,
          recoverable: true,
          retryable: false,
        }
      }

      if (error.message.includes('cancelled')) {
        return {
          code: 'CANCELLED',
          message: error.message,
          recoverable: false,
          retryable: false,
        }
      }

      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        details: { stack: error.stack },
        recoverable: true,
        retryable: true,
      }
    }

    return this.createUnknownError(error)
  }

  private createUnknownError(error: unknown): ToolExecutionError {
    return {
      code: 'INTERNAL_ERROR',
      message: String(error),
      recoverable: false,
      retryable: false,
    }
  }

  private isToolExecutionError(error: unknown): error is ToolExecutionError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'recoverable' in error &&
      'retryable' in error
    )
  }

  private createErrorResult(
    executionId: string,
    toolId: string,
    startedAt: number,
    error: ToolExecutionError
  ): ToolExecutionResult {
    const completedAt = Date.now()
    return {
      executionId,
      toolId,
      status: 'failed',
      error,
      duration: completedAt - startedAt,
      startedAt,
      completedAt,
      metadata: {},
    }
  }

  private emitEvent(event: ToolCallLifecycleEvent): void {
    if (!this.config.trackLifecycle) return

    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // Ignore listener errors
      }
    }
  }
}

// ==================== Helper Functions ====================

/**
 * Create a default tool runtime context
 */
export function createRuntimeContext(
  sessionId: string,
  userId: string,
  tenantId: string,
  options: Partial<ToolRuntimeContext> = {}
): ToolRuntimeContext {
  return {
    sessionId,
    userId,
    tenantId,
    permissions: options.permissions || [],
    metadata: options.metadata || {},
    timestamp: Date.now(),
    ...options,
  }
}

/**
 * Create a tool execution input
 */
export function createExecutionInput(
  toolId: string,
  parameters: Record<string, unknown>,
  context: ToolRuntimeContext,
  options: Partial<ToolExecutionInput> = {}
): ToolExecutionInput {
  return {
    toolId,
    parameters,
    context,
    ...options,
  }
}

/**
 * Check if a result is successful
 */
export function isSuccessfulResult(result: ToolExecutionResult): boolean {
  return result.status === 'completed'
}

/**
 * Check if a result is a failure
 */
export function isFailedResult(result: ToolExecutionResult): boolean {
  return result.status === 'failed'
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: ToolExecutionError): boolean {
  return error.retryable
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: ToolExecutionError): boolean {
  return error.recoverable
}
