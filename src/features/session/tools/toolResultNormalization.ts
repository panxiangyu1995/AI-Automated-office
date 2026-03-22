/**
 * Tool Result Normalization
 * Task 71: Story 45.4 - Tool Result Normalization
 * 
 * Standardizes tool results so they can be consumed by planner, audit,
 * and UI writeback layers. Provides normalized success and failure envelopes,
 * structured result payloads, and raw output preservation.
 */

import type { ToolExecutionResult, ToolExecutionError, ToolErrorCode } from './toolExecutor'

// ==================== Normalized Result Types ====================

/**
 * Normalized result status
 */
export type NormalizedStatus =
  | 'success'
  | 'failure'
  | 'partial'
  | 'pending'
  | 'cancelled'

/**
 * Result severity for audit and monitoring
 */
export type ResultSeverity =
  | 'info'      // Normal operation
  | 'warning'   // Unexpected but handled
  | 'error'     // Operation failed
  | 'critical'  // System-level failure

/**
 * Normalized success envelope
 */
export interface NormalizedSuccessEnvelope<T = unknown> {
  status: 'success'
  severity: ResultSeverity
  data: T
  metadata: ResultMetadata
  rawOutput?: RawOutputReference
}

/**
 * Normalized failure envelope
 */
export interface NormalizedFailureEnvelope {
  status: 'failure'
  severity: ResultSeverity
  error: NormalizedError
  metadata: ResultMetadata
  rawOutput?: RawOutputReference
}

/**
 * Normalized partial success envelope
 */
export interface NormalizedPartialEnvelope<T = unknown> {
  status: 'partial'
  severity: ResultSeverity
  data: T
  partialResults: PartialResultItem[]
  metadata: ResultMetadata
  rawOutput?: RawOutputReference
}

/**
 * Union type for all normalized envelopes
 */
export type NormalizedResultEnvelope<T = unknown> =
  | NormalizedSuccessEnvelope<T>
  | NormalizedFailureEnvelope
  | NormalizedPartialEnvelope<T>

/**
 * Normalized error with additional context
 */
export interface NormalizedError {
  code: ToolErrorCode
  message: string
  category: ErrorCategory
  details?: Record<string, unknown>
  recoverable: boolean
  retryable: boolean
  userMessage?: string
  debugInfo?: Record<string, unknown>
}

/**
 * Error category for classification
 */
export type ErrorCategory =
  | 'validation'     // Input validation failures
  | 'permission'     // Access/permission denied
  | 'resource'       // Resource not found or unavailable
  | 'timeout'        // Operation timed out
  | 'execution'      // Execution/runtime error
  | 'context'        // Context/environment error
  | 'internal'       // Internal system error
  | 'unknown'        // Unclassified error

/**
 * Result metadata for tracking and audit
 */
export interface ResultMetadata {
  executionId: string
  toolId: string
  startedAt: number
  completedAt: number
  duration: number
  correlationId?: string
  parentExecutionId?: string
  departmentId?: string
  userId?: string
  sessionId?: string
  tags: string[]
  annotations: Record<string, unknown>
}

/**
 * Raw output reference for preserving original data
 */
export interface RawOutputReference {
  type: 'inline' | 'reference' | 'external'
  data?: unknown
  path?: string
  contentType?: string
  size?: number
  checksum?: string
}

/**
 * Partial result item for multi-step operations
 */
export interface PartialResultItem {
  step: string
  status: 'success' | 'failure' | 'skipped'
  data?: unknown
  error?: NormalizedError
  duration: number
}

// ==================== Structured Result Payloads ====================

/**
 * Structured result payload types for different consumers
 */
export interface PlannerPayload {
  action: string
  result: unknown
  sideEffects: SideEffect[]
  suggestedActions: SuggestedAction[]
  confidence: number
}

export interface AuditPayload {
  operation: string
  resource: string
  action: string
  outcome: 'success' | 'failure' | 'partial'
  details: Record<string, unknown>
  sensitiveFields: string[]
}

export interface UIWritebackPayload {
  displayType: 'text' | 'data' | 'file' | 'status' | 'progress'
  content: unknown
  summary?: string
  actions?: UIAction[]
  refresh?: RefreshInstruction[]
}

/**
 * Side effect record
 */
export interface SideEffect {
  type: 'create' | 'update' | 'delete' | 'notify' | 'trigger'
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
}

/**
 * Suggested action for planner
 */
export interface SuggestedAction {
  action: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  parameters?: Record<string, unknown>
}

/**
 * UI action button
 */
export interface UIAction {
  label: string
  action: string
  icon?: string
  style?: 'primary' | 'secondary' | 'danger'
  parameters?: Record<string, unknown>
}

/**
 * Refresh instruction for UI
 */
export interface RefreshInstruction {
  target: string
  type: 'reload' | 'update' | 'remove'
  resourceId?: string
}

// ==================== Result Normalizer Class ====================

/**
 * Configuration for result normalization
 */
export interface ResultNormalizerConfig {
  preserveRawOutput: boolean
  includeDebugInfo: boolean
  maxPayloadSize: number
  sensitiveFields: string[]
  defaultSeverity: ResultSeverity
}

const DEFAULT_NORMALIZER_CONFIG: ResultNormalizerConfig = {
  preserveRawOutput: true,
  includeDebugInfo: false,
  maxPayloadSize: 1024 * 1024, // 1MB
  sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'credential'],
  defaultSeverity: 'info',
}

/**
 * Result Normalizer
 * 
 * Transforms raw tool execution results into normalized envelopes
 * and structured payloads for different consumers.
 */
export class ResultNormalizer {
  private config: ResultNormalizerConfig
  private rawOutputStore: Map<string, RawOutputReference> = new Map()

  constructor(config: Partial<ResultNormalizerConfig> = {}) {
    this.config = { ...DEFAULT_NORMALIZER_CONFIG, ...config }
  }

  /**
   * Normalize a tool execution result
   */
  normalize<T = unknown>(
    result: ToolExecutionResult,
    options: NormalizationOptions = {}
  ): NormalizedResultEnvelope<T> {
    const metadata = this.extractMetadata(result, options)
    
    if (result.status === 'completed') {
      return this.normalizeSuccess<T>(result, metadata, options)
    }

    if (result.status === 'failed') {
      return this.normalizeFailure(result, metadata, options)
    }

    // Handle other statuses (timeout, cancelled)
    return this.normalizeNonCompletion(result, metadata, options)
  }

  /**
   * Normalize a successful result
   */
  private normalizeSuccess<T>(
    result: ToolExecutionResult,
    metadata: ResultMetadata,
    options: NormalizationOptions
  ): NormalizedSuccessEnvelope<T> {
    const data = this.transformOutput<T>(result.output, options)
    const rawOutput = this.preserveRawOutput(result.output, result.executionId)

    return {
      status: 'success',
      severity: this.determineSeverity(result, 'success'),
      data,
      metadata,
      rawOutput,
    }
  }

  /**
   * Normalize a failure result
   */
  private normalizeFailure(
    result: ToolExecutionResult,
    metadata: ResultMetadata,
    _options: NormalizationOptions
  ): NormalizedFailureEnvelope {
    const normalizedError = result.error
      ? this.normalizeError(result.error)
      : this.createUnknownError()

    const rawOutput = result.output
      ? this.preserveRawOutput(result.output, result.executionId)
      : undefined

    return {
      status: 'failure',
      severity: this.determineSeverity(result, 'failure'),
      error: normalizedError,
      metadata,
      rawOutput,
    }
  }

  /**
   * Normalize non-completion statuses (timeout, cancelled)
   */
  private normalizeNonCompletion(
    result: ToolExecutionResult,
    metadata: ResultMetadata,
    _options: NormalizationOptions
  ): NormalizedFailureEnvelope {
    const errorCode = result.status === 'timeout' ? 'TIMEOUT' : 'CANCELLED'
    
    return {
      status: 'failure',
      severity: result.status === 'timeout' ? 'error' : 'warning',
      error: {
        code: errorCode,
        message: `Tool execution ${result.status}`,
        category: this.errorCodeToCategory(errorCode),
        recoverable: result.status === 'timeout',
        retryable: result.status === 'timeout',
        userMessage: result.status === 'timeout'
          ? '操作超时，请稍后重试'
          : '操作已取消',
      },
      metadata,
    }
  }

  /**
   * Normalize error for audit and display
   */
  normalizeError(error: ToolExecutionError): NormalizedError {
    return {
      code: error.code,
      message: error.message,
      category: this.errorCodeToCategory(error.code),
      details: error.details,
      recoverable: error.recoverable,
      retryable: error.retryable,
      userMessage: this.generateUserMessage(error),
      debugInfo: this.config.includeDebugInfo ? error.details : undefined,
    }
  }

  /**
   * Create planner-specific payload
   */
  createPlannerPayload(
    envelope: NormalizedResultEnvelope,
    context: PlannerContext = {}
  ): PlannerPayload {
    const isSuccess = envelope.status === 'success'
    const isPartial = envelope.status === 'partial'

    return {
      action: context.action || 'tool_execution',
      result: isSuccess ? (envelope as NormalizedSuccessEnvelope).data :
              isPartial ? (envelope as NormalizedPartialEnvelope).data : null,
      sideEffects: this.extractSideEffects(envelope, context),
      suggestedActions: this.generateSuggestedActions(envelope, context),
      confidence: this.calculateConfidence(envelope),
    }
  }

  /**
   * Create audit-specific payload
   */
  createAuditPayload(
    envelope: NormalizedResultEnvelope,
    context: AuditContext = {}
  ): AuditPayload {
    return {
      operation: envelope.metadata.toolId,
      resource: context.resource || 'unknown',
      action: context.action || 'execute',
      outcome: envelope.status === 'success' ? 'success' :
               envelope.status === 'partial' ? 'partial' : 'failure',
      details: this.sanitizeDetails(envelope),
      sensitiveFields: this.identifySensitiveFields(envelope),
    }
  }

  /**
   * Create UI writeback payload
   */
  createUIWritebackPayload(
    envelope: NormalizedResultEnvelope,
    context: UIContext = {}
  ): UIWritebackPayload {
    const isSuccess = envelope.status === 'success'
    const isPartial = envelope.status === 'partial'
    const isFailure = envelope.status === 'failure'

    return {
      displayType: this.determineDisplayType(envelope, context),
      content: isSuccess ? (envelope as NormalizedSuccessEnvelope).data :
               isPartial ? (envelope as NormalizedPartialEnvelope).data :
               isFailure ? (envelope as NormalizedFailureEnvelope).error : null,
      summary: this.generateSummary(envelope),
      actions: this.generateUIActions(envelope, context),
      refresh: this.determineRefreshInstructions(envelope, context),
    }
  }

  /**
   * Get raw output reference
   */
  getRawOutput(executionId: string): RawOutputReference | undefined {
    return this.rawOutputStore.get(executionId)
  }

  /**
   * Clear raw output store
   */
  clearRawOutputs(): void {
    this.rawOutputStore.clear()
  }

  // ==================== Private Methods ====================

  private extractMetadata(
    result: ToolExecutionResult,
    options: NormalizationOptions
  ): ResultMetadata {
    return {
      executionId: result.executionId,
      toolId: result.toolId,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      duration: result.duration,
      correlationId: options.correlationId,
      parentExecutionId: options.parentExecutionId,
      departmentId: options.departmentId,
      userId: options.userId,
      sessionId: options.sessionId,
      tags: options.tags || [],
      annotations: options.annotations || {},
    }
  }

  private transformOutput<T>(
    output: unknown,
    options: NormalizationOptions
  ): T {
    if (output === undefined || output === null) {
      return undefined as T
    }

    // Apply transformations
    let transformed: unknown = output

    // Sanitize sensitive fields
    if (options.sanitize !== false) {
      transformed = this.sanitizeOutput(transformed)
    }

    // Transform to expected type
    if (options.transform) {
      transformed = options.transform(transformed)
    }

    return transformed as T
  }

  private preserveRawOutput(
    output: unknown,
    executionId: string
  ): RawOutputReference | undefined {
    if (!this.config.preserveRawOutput || output === undefined) {
      return undefined
    }

    const size = this.estimateSize(output)
    
    // Store inline if small enough
    if (size < this.config.maxPayloadSize) {
      const ref: RawOutputReference = {
        type: 'inline',
        data: output,
        contentType: 'application/json',
        size,
      }
      this.rawOutputStore.set(executionId, ref)
      return ref
    }

    // For large outputs, create a reference only
    const ref: RawOutputReference = {
      type: 'reference',
      path: `raw://${executionId}`,
      contentType: 'application/json',
      size,
    }
    this.rawOutputStore.set(executionId, { ...ref, data: output })
    return ref
  }

  private sanitizeOutput(output: unknown): unknown {
    if (typeof output !== 'object' || output === null) {
      return output
    }

    if (Array.isArray(output)) {
      return output.map(item => this.sanitizeOutput(item))
    }

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(output as Record<string, unknown>)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = this.sanitizeOutput(value)
      }
    }
    return sanitized
  }

  private isSensitiveField(field: string): boolean {
    const lowerField = field.toLowerCase()
    return this.config.sensitiveFields.some(sensitive =>
      lowerField.includes(sensitive.toLowerCase())
    )
  }

  private determineSeverity(
    result: ToolExecutionResult,
    _fallback: 'success' | 'failure'
  ): ResultSeverity {
    if (result.status === 'failed') return 'error'
    if (result.status === 'timeout') return 'error'
    if (result.status === 'cancelled') return 'warning'
    if (result.status === 'completed') {
      // Check for warnings in output
      if (result.metadata?.warnings) return 'warning'
      return 'info'
    }
    return this.config.defaultSeverity
  }

  private errorCodeToCategory(code: ToolErrorCode): ErrorCategory {
    const mapping: Record<ToolErrorCode, ErrorCategory> = {
      VALIDATION_ERROR: 'validation',
      PERMISSION_DENIED: 'permission',
      NOT_FOUND: 'resource',
      TIMEOUT: 'timeout',
      EXECUTION_ERROR: 'execution',
      CONTEXT_ERROR: 'context',
      CANCELLED: 'execution',
      INTERNAL_ERROR: 'internal',
    }
    return mapping[code] || 'unknown'
  }

  private generateUserMessage(error: ToolExecutionError): string {
    const messages: Record<ToolErrorCode, string> = {
      VALIDATION_ERROR: '输入参数验证失败',
      PERMISSION_DENIED: '权限不足，无法执行此操作',
      NOT_FOUND: '请求的资源不存在',
      TIMEOUT: '操作超时，请稍后重试',
      EXECUTION_ERROR: '执行过程中发生错误',
      CONTEXT_ERROR: '执行环境配置错误',
      CANCELLED: '操作已取消',
      INTERNAL_ERROR: '系统内部错误',
    }
    return messages[error.code] || '未知错误'
  }

  private createUnknownError(): NormalizedError {
    return {
      code: 'INTERNAL_ERROR',
      message: 'Unknown error occurred',
      category: 'unknown',
      recoverable: false,
      retryable: false,
      userMessage: '发生未知错误',
    }
  }

  private extractSideEffects(
    envelope: NormalizedResultEnvelope,
    context: PlannerContext
  ): SideEffect[] {
    const effects: SideEffect[] = []
    
    if (envelope.status === 'success' && context.sideEffects) {
      effects.push(...context.sideEffects)
    }
    
    // Auto-detect side effects from data
    if (envelope.status === 'success') {
      const data = (envelope as NormalizedSuccessEnvelope).data
      if (this.hasCreateOperation(data)) {
        effects.push({
          type: 'create',
          resource: context.resource || 'unknown',
          resourceId: this.extractResourceId(data),
        })
      }
    }
    
    return effects
  }

  private generateSuggestedActions(
    envelope: NormalizedResultEnvelope,
    context: PlannerContext
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = []
    
    if (envelope.status === 'failure') {
      const error = (envelope as NormalizedFailureEnvelope).error
      
      if (error.retryable) {
        actions.push({
          action: 'retry',
          priority: 'high',
          reason: '操作可重试',
          parameters: context.originalParameters,
        })
      }
      
      if (error.recoverable) {
        actions.push({
          action: 'recover',
          priority: 'medium',
          reason: '存在恢复路径',
        })
      }
    }
    
    return actions
  }

  private calculateConfidence(envelope: NormalizedResultEnvelope): number {
    if (envelope.status === 'success') return 1.0
    if (envelope.status === 'partial') return 0.5
    return 0.0
  }

  private sanitizeDetails(envelope: NormalizedResultEnvelope): Record<string, unknown> {
    const details: Record<string, unknown> = {
      toolId: envelope.metadata.toolId,
      duration: envelope.metadata.duration,
      status: envelope.status,
    }
    
    if (envelope.status === 'failure') {
      const error = (envelope as NormalizedFailureEnvelope).error
      details.errorCode = error.code
      details.errorCategory = error.category
    }
    
    return this.sanitizeOutput(details) as Record<string, unknown>
  }

  private identifySensitiveFields(envelope: NormalizedResultEnvelope): string[] {
    const sensitive: string[] = []
    
    const checkObject = (obj: unknown, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) return
      
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const currentPath = path ? `${path}.${key}` : key
        if (this.isSensitiveField(key)) {
          sensitive.push(currentPath)
        }
        checkObject(value, currentPath)
      }
    }
    
    if (envelope.status === 'success') {
      checkObject((envelope as NormalizedSuccessEnvelope).data)
    }
    
    return sensitive
  }

  private determineDisplayType(
    envelope: NormalizedResultEnvelope,
    context: UIContext
  ): UIWritebackPayload['displayType'] {
    if (context.displayType) return context.displayType
    
    if (envelope.status === 'failure') return 'status'
    
    const data = envelope.status === 'success'
      ? (envelope as NormalizedSuccessEnvelope).data
      : null
    
    if (typeof data === 'string') return 'text'
    if (data && typeof data === 'object' && 'fileId' in data) return 'file'
    if (data && typeof data === 'object' && 'progress' in data) return 'progress'
    
    return 'data'
  }

  private generateSummary(envelope: NormalizedResultEnvelope): string {
    if (envelope.status === 'success') {
      return `工具 ${envelope.metadata.toolId} 执行成功`
    }
    if (envelope.status === 'partial') {
      const partial = envelope as NormalizedPartialEnvelope
      const successCount = partial.partialResults.filter(r => r.status === 'success').length
      return `部分完成: ${successCount}/${partial.partialResults.length} 步骤成功`
    }
    if (envelope.status === 'failure') {
      const error = (envelope as NormalizedFailureEnvelope).error
      return error.userMessage || error.message
    }
    return '未知状态'
  }

  private generateUIActions(
    envelope: NormalizedResultEnvelope,
    context: UIContext
  ): UIAction[] {
    const actions: UIAction[] = []
    
    if (envelope.status === 'failure') {
      const error = (envelope as NormalizedFailureEnvelope).error
      
      if (error.retryable) {
        actions.push({
          label: '重试',
          action: 'retry',
          icon: 'refresh',
          style: 'primary',
        })
      }
      
      actions.push({
        label: '关闭',
        action: 'dismiss',
        style: 'secondary',
      })
    }
    
    if (envelope.status === 'success' && context.actions) {
      actions.push(...context.actions)
    }
    
    return actions
  }

  private determineRefreshInstructions(
    envelope: NormalizedResultEnvelope,
    context: UIContext
  ): RefreshInstruction[] {
    const refresh: RefreshInstruction[] = []
    
    if (envelope.status === 'success' && context.refreshTargets) {
      for (const target of context.refreshTargets) {
        refresh.push({
          target,
          type: 'reload',
        })
      }
    }
    
    return refresh
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length
    } catch {
      return 0
    }
  }

  private hasCreateOperation(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false
    const obj = data as Record<string, unknown>
    return 'id' in obj && 'createdAt' in obj
  }

  private extractResourceId(data: unknown): string | undefined {
    if (typeof data !== 'object' || data === null) return undefined
    const obj = data as Record<string, unknown>
    return typeof obj.id === 'string' ? obj.id : undefined
  }
}

// ==================== Context Types ====================

export interface NormalizationOptions {
  correlationId?: string
  parentExecutionId?: string
  departmentId?: string
  userId?: string
  sessionId?: string
  tags?: string[]
  annotations?: Record<string, unknown>
  sanitize?: boolean
  transform?: (output: unknown) => unknown
}

export interface PlannerContext {
  action?: string
  resource?: string
  originalParameters?: Record<string, unknown>
  sideEffects?: SideEffect[]
}

export interface AuditContext {
  resource?: string
  action?: string
}

export interface UIContext {
  displayType?: UIWritebackPayload['displayType']
  actions?: UIAction[]
  refreshTargets?: string[]
}

// ==================== Factory Functions ====================

/**
 * Create a result normalizer instance
 */
export function createResultNormalizer(
  config: Partial<ResultNormalizerConfig> = {}
): ResultNormalizer {
  return new ResultNormalizer(config)
}

/**
 * Quick normalize function for simple cases
 */
export function normalizeResult<T = unknown>(
  result: ToolExecutionResult,
  options: NormalizationOptions = {}
): NormalizedResultEnvelope<T> {
  const normalizer = new ResultNormalizer()
  return normalizer.normalize<T>(result, options)
}

/**
 * Check if an envelope represents success
 */
export function isSuccessEnvelope(
  envelope: NormalizedResultEnvelope
): envelope is NormalizedSuccessEnvelope {
  return envelope.status === 'success'
}

/**
 * Check if an envelope represents failure
 */
export function isFailureEnvelope(
  envelope: NormalizedResultEnvelope
): envelope is NormalizedFailureEnvelope {
  return envelope.status === 'failure'
}

/**
 * Check if an envelope represents partial success
 */
export function isPartialEnvelope(
  envelope: NormalizedResultEnvelope
): envelope is NormalizedPartialEnvelope {
  return envelope.status === 'partial'
}
