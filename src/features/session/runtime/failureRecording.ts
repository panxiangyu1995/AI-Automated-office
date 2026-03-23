/**
 * Failure and Result Recording Module (Story 48.3)
 * 
 * Persist runtime results and failure causes for task-level analysis.
 * 
 * Key features:
 * - Record final result summary for each task
 * - Persist failure reasons and impacted step ids
 * - Store retry and replan outcomes
 * - Expose records for recovery and analysis flows
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Result status for task execution
 */
export type ResultStatus =
  | 'success'
  | 'partial_success'
  | 'failure'
  | 'cancelled'
  | 'timeout'
  | 'replan_triggered'

/**
 * Failure category for classification
 */
export type FailureCategory =
  | 'tool_failure'
  | 'permission_denied'
  | 'confirmation_rejected'
  | 'validation_error'
  | 'resource_unavailable'
  | 'timeout'
  | 'internal_error'
  | 'user_cancelled'
  | 'dependency_failure'
  | 'unknown'

/**
 * Retry outcome status
 */
export type RetryOutcomeStatus =
  | 'pending'
  | 'in_progress'
  | 'succeeded'
  | 'failed'
  | 'exhausted'
  | 'cancelled'

/**
 * Replan outcome status
 */
export type ReplanOutcomeStatus =
  | 'pending'
  | 'in_progress'
  | 'succeeded'
  | 'failed'
  | 'exhausted'
  | 'cancelled'

/**
 * Step reference for impacted steps
 */
export interface ImpactedStep {
  stepId: string
  stepType: string
  error?: string
  timestamp: number
}

/**
 * Failure reason details
 */
export interface FailureReason {
  category: FailureCategory
  code?: string
  message: string
  details?: Record<string, unknown>
  recoverable: boolean
  suggestedAction?: string
}

/**
 * Result summary for successful or partial execution
 */
export interface ResultSummary {
  outputType: 'text' | 'structured' | 'file' | 'action' | 'none'
  outputValue?: string | Record<string, unknown> | string[]
  confidence?: number
  metadata?: Record<string, unknown>
}

/**
 * Retry outcome
 */
export interface RetryOutcome {
  outcomeId: string
  attemptNumber: number
  status: RetryOutcomeStatus
  startTime: number
  endTime?: number
  result?: ResultSummary
  failureReason?: FailureReason
}

/**
 * Replan outcome
 */
export interface ReplanOutcome {
  outcomeId: string
  attemptNumber: number
  status: ReplanOutcomeStatus
  startTime: number
  endTime?: number
  originalPlan?: string
  revisedPlan?: string
  result?: ResultSummary
  failureReason?: FailureReason
}

/**
 * Task execution record
 */
export interface TaskExecutionRecord {
  recordId: string
  sessionId: string
  traceId: string
  taskId: string
  taskName: string
  taskDescription?: string
  
  // Status and timing
  status: ResultStatus
  startTime: number
  endTime?: number
  
  // Result
  result?: ResultSummary
  
  // Failure
  failureReason?: FailureReason
  impactedSteps: ImpactedStep[]
  
  // Retry and replan
  retryOutcomes: RetryOutcome[]
  replanOutcomes: ReplanOutcome[]
  
  // Metadata
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

/**
 * Execution record store
 */
export interface ExecutionRecordStore {
  records: Map<string, TaskExecutionRecord>
  sessionIndex: Map<string, Set<string>> // sessionId -> recordIds
  traceIndex: Map<string, Set<string>> // traceId -> recordIds
}

/**
 * Query options for execution records
 */
export interface ExecutionQueryOptions {
  sessionId?: string
  traceId?: string
  taskId?: string
  status?: ResultStatus | ResultStatus[]
  failureCategory?: FailureCategory | FailureCategory[]
  startTimeFrom?: number
  startTimeTo?: number
  limit?: number
  offset?: number
}

/**
 * Execution statistics
 */
export interface ExecutionStatistics {
  totalRecords: number
  byStatus: Record<ResultStatus, number>
  byFailureCategory: Record<FailureCategory, number>
  averageDuration: number
  successRate: number
  failureRate: number
  retrySuccessRate: number
  replanSuccessRate: number
}

/**
 * Serializable execution record store
 */
export interface SerializableExecutionRecordStore {
  records: TaskExecutionRecord[]
}

// ============================================================================
// Constants
// ============================================================================

export const RECORD_ID_PREFIX = 'exec'
export const OUTCOME_ID_PREFIX = 'outcome'

export const FAILURE_CATEGORIES: FailureCategory[] = [
  'tool_failure',
  'permission_denied',
  'confirmation_rejected',
  'validation_error',
  'resource_unavailable',
  'timeout',
  'internal_error',
  'user_cancelled',
  'dependency_failure',
  'unknown'
]

export const RESULT_STATUSES: ResultStatus[] = [
  'success',
  'partial_success',
  'failure',
  'cancelled',
  'timeout',
  'replan_triggered'
]

export const RECOVERABLE_FAILURES: FailureCategory[] = [
  'tool_failure',
  'timeout',
  'resource_unavailable',
  'dependency_failure'
]

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique execution record ID
 */
export function generateRecordId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${RECORD_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique outcome ID
 */
export function generateOutcomeId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${OUTCOME_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Validate execution record ID
 */
export function isValidRecordId(id: string): boolean {
  return /^exec_\d+_[a-f0-9]{16}$/.test(id)
}

/**
 * Validate outcome ID
 */
export function isValidOutcomeId(id: string): boolean {
  return /^outcome_\d+_[a-f0-9]{8}$/.test(id)
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an impacted step
 */
export function createImpactedStep(
  stepId: string,
  stepType: string,
  error?: string
): ImpactedStep {
  return {
    stepId,
    stepType,
    error,
    timestamp: Date.now()
  }
}

/**
 * Create a failure reason
 */
export function createFailureReason(
  category: FailureCategory,
  message: string,
  options?: {
    code?: string
    details?: Record<string, unknown>
    recoverable?: boolean
    suggestedAction?: string
  }
): FailureReason {
  return {
    category,
    message,
    code: options?.code,
    details: options?.details,
    recoverable: options?.recoverable ?? RECOVERABLE_FAILURES.includes(category),
    suggestedAction: options?.suggestedAction
  }
}

/**
 * Create an execution result summary
 */
export function createExecutionResultSummary(
  outputType: ResultSummary['outputType'],
  options?: {
    outputValue?: ResultSummary['outputValue']
    confidence?: number
    metadata?: Record<string, unknown>
  }
): ResultSummary {
  const result: ResultSummary = {
    outputType,
    outputValue: options?.outputValue,
    confidence: options?.confidence,
    metadata: options?.metadata
  }
  
  // Remove undefined values for cleaner serialization
  if (result.outputValue === undefined) delete result.outputValue
  if (result.confidence === undefined) delete result.confidence
  if (result.metadata === undefined) delete result.metadata
  
  return result
}

/**
 * Create a retry outcome
 */
export function createRetryOutcome(
  attemptNumber: number,
  status: RetryOutcomeStatus = 'pending'
): RetryOutcome {
  return {
    outcomeId: generateOutcomeId(),
    attemptNumber,
    status,
    startTime: Date.now()
  }
}

/**
 * Create a replan outcome
 */
export function createReplanOutcome(
  attemptNumber: number,
  status: ReplanOutcomeStatus = 'pending'
): ReplanOutcome {
  return {
    outcomeId: generateOutcomeId(),
    attemptNumber,
    status,
    startTime: Date.now()
  }
}

/**
 * Create a task execution record
 */
export function createTaskExecutionRecord(
  sessionId: string,
  traceId: string,
  taskId: string,
  taskName: string,
  options?: {
    taskDescription?: string
    metadata?: Record<string, unknown>
  }
): TaskExecutionRecord {
  const now = Date.now()
  return {
    recordId: generateRecordId(),
    sessionId,
    traceId,
    taskId,
    taskName,
    taskDescription: options?.taskDescription,
    status: 'success', // Default, will be updated during execution
    startTime: now,
    impactedSteps: [],
    retryOutcomes: [],
    replanOutcomes: [],
    metadata: options?.metadata ?? {},
    createdAt: now,
    updatedAt: now
  }
}

// ============================================================================
// Status Update Functions
// ============================================================================

/**
 * Mark task execution as successful
 */
export function markExecutionSuccess(
  record: TaskExecutionRecord,
  result?: ResultSummary
): TaskExecutionRecord {
  const now = Date.now()
  return {
    ...record,
    status: 'success',
    endTime: now,
    result,
    updatedAt: now
  }
}

/**
 * Mark task execution as partial success
 */
export function markExecutionPartialSuccess(
  record: TaskExecutionRecord,
  result: ResultSummary,
  partialFailure?: FailureReason
): TaskExecutionRecord {
  const now = Date.now()
  return {
    ...record,
    status: 'partial_success',
    endTime: now,
    result,
    failureReason: partialFailure,
    updatedAt: now
  }
}

/**
 * Mark task execution as failed
 */
export function markExecutionFailure(
  record: TaskExecutionRecord,
  failureReason: FailureReason,
  impactedSteps?: ImpactedStep[]
): TaskExecutionRecord {
  const now = Date.now()
  return {
    ...record,
    status: 'failure',
    endTime: now,
    failureReason,
    impactedSteps: impactedSteps ?? record.impactedSteps,
    updatedAt: now
  }
}

/**
 * Mark task execution as cancelled
 */
export function markExecutionCancelled(
  record: TaskExecutionRecord,
  reason?: string
): TaskExecutionRecord {
  const now = Date.now()
  return {
    ...record,
    status: 'cancelled',
    endTime: now,
    failureReason: reason ? {
      category: 'user_cancelled',
      message: reason,
      recoverable: false
    } : undefined,
    updatedAt: now
  }
}

/**
 * Mark task execution as timed out
 */
export function markExecutionTimeout(
  record: TaskExecutionRecord,
  timeoutMs: number
): TaskExecutionRecord {
  const now = Date.now()
  return {
    ...record,
    status: 'timeout',
    endTime: now,
    failureReason: {
      category: 'timeout',
      message: `Task timed out after ${timeoutMs}ms`,
      recoverable: true,
      suggestedAction: 'Retry with increased timeout or optimize task'
    },
    updatedAt: now
  }
}

/**
 * Mark task as replan triggered
 */
export function markReplanTriggered(
  record: TaskExecutionRecord,
  reason: string
): TaskExecutionRecord {
  const now = Date.now()
  return {
    ...record,
    status: 'replan_triggered',
    failureReason: {
      category: 'tool_failure',
      message: reason,
      recoverable: true,
      suggestedAction: 'Replanning task execution'
    },
    updatedAt: now
  }
}

// ============================================================================
// Impacted Steps Management
// ============================================================================

/**
 * Add an impacted step to a record
 */
export function addImpactedStep(
  record: TaskExecutionRecord,
  step: ImpactedStep
): TaskExecutionRecord {
  return {
    ...record,
    impactedSteps: [...record.impactedSteps, step],
    updatedAt: Date.now()
  }
}

/**
 * Add multiple impacted steps
 */
export function addImpactedSteps(
  record: TaskExecutionRecord,
  steps: ImpactedStep[]
): TaskExecutionRecord {
  return {
    ...record,
    impactedSteps: [...record.impactedSteps, ...steps],
    updatedAt: Date.now()
  }
}

// ============================================================================
// Retry Management
// ============================================================================

/**
 * Add a retry outcome to a record
 */
export function addRetryOutcome(
  record: TaskExecutionRecord,
  outcome: RetryOutcome
): TaskExecutionRecord {
  return {
    ...record,
    retryOutcomes: [...record.retryOutcomes, outcome],
    updatedAt: Date.now()
  }
}

/**
 * Update a retry outcome
 */
export function updateRetryOutcome(
  record: TaskExecutionRecord,
  outcomeId: string,
  updates: Partial<Pick<RetryOutcome, 'status' | 'endTime' | 'result' | 'failureReason'>>
): TaskExecutionRecord {
  return {
    ...record,
    retryOutcomes: record.retryOutcomes.map(outcome =>
      outcome.outcomeId === outcomeId
        ? { ...outcome, ...updates }
        : outcome
    ),
    updatedAt: Date.now()
  }
}

/**
 * Mark retry as succeeded
 */
export function markRetrySucceeded(
  record: TaskExecutionRecord,
  outcomeId: string,
  result?: ResultSummary
): TaskExecutionRecord {
  return updateRetryOutcome(record, outcomeId, {
    status: 'succeeded',
    endTime: Date.now(),
    result
  })
}

/**
 * Mark retry as failed
 */
export function markRetryFailed(
  record: TaskExecutionRecord,
  outcomeId: string,
  failureReason?: FailureReason
): TaskExecutionRecord {
  return updateRetryOutcome(record, outcomeId, {
    status: 'failed',
    endTime: Date.now(),
    failureReason
  })
}

/**
 * Mark retry as exhausted
 */
export function markRetryExhausted(
  record: TaskExecutionRecord,
  outcomeId: string
): TaskExecutionRecord {
  return updateRetryOutcome(record, outcomeId, {
    status: 'exhausted',
    endTime: Date.now()
  })
}

// ============================================================================
// Replan Management
// ============================================================================

/**
 * Add a replan outcome to a record
 */
export function addReplanOutcome(
  record: TaskExecutionRecord,
  outcome: ReplanOutcome
): TaskExecutionRecord {
  return {
    ...record,
    replanOutcomes: [...record.replanOutcomes, outcome],
    updatedAt: Date.now()
  }
}

/**
 * Update a replan outcome
 */
export function updateReplanOutcome(
  record: TaskExecutionRecord,
  outcomeId: string,
  updates: Partial<Pick<ReplanOutcome, 'status' | 'endTime' | 'revisedPlan' | 'result' | 'failureReason'>>
): TaskExecutionRecord {
  return {
    ...record,
    replanOutcomes: record.replanOutcomes.map(outcome =>
      outcome.outcomeId === outcomeId
        ? { ...outcome, ...updates }
        : outcome
    ),
    updatedAt: Date.now()
  }
}

/**
 * Mark replan as succeeded
 */
export function markReplanSucceeded(
  record: TaskExecutionRecord,
  outcomeId: string,
  revisedPlan?: string,
  result?: ResultSummary
): TaskExecutionRecord {
  return updateReplanOutcome(record, outcomeId, {
    status: 'succeeded',
    endTime: Date.now(),
    revisedPlan,
    result
  })
}

/**
 * Mark replan as failed
 */
export function markReplanFailed(
  record: TaskExecutionRecord,
  outcomeId: string,
  failureReason?: FailureReason
): TaskExecutionRecord {
  return updateReplanOutcome(record, outcomeId, {
    status: 'failed',
    endTime: Date.now(),
    failureReason
  })
}

/**
 * Mark replan as exhausted
 */
export function markReplanExhausted(
  record: TaskExecutionRecord,
  outcomeId: string
): TaskExecutionRecord {
  return updateReplanOutcome(record, outcomeId, {
    status: 'exhausted',
    endTime: Date.now()
  })
}

// ============================================================================
// Store Functions
// ============================================================================

/**
 * Create an execution record store
 */
export function createExecutionRecordStore(): ExecutionRecordStore {
  return {
    records: new Map(),
    sessionIndex: new Map(),
    traceIndex: new Map()
  }
}

/**
 * Add a record to the store
 */
export function addExecutionRecord(
  store: ExecutionRecordStore,
  record: TaskExecutionRecord
): ExecutionRecordStore {
  const newStore = {
    records: new Map(store.records),
    sessionIndex: new Map(store.sessionIndex),
    traceIndex: new Map(store.traceIndex)
  }
  
  // Add to main records
  newStore.records.set(record.recordId, record)
  
  // Update session index
  const sessionRecords = newStore.sessionIndex.get(record.sessionId) ?? new Set()
  newStore.sessionIndex.set(record.sessionId, new Set([...sessionRecords, record.recordId]))
  
  // Update trace index
  const traceRecords = newStore.traceIndex.get(record.traceId) ?? new Set()
  newStore.traceIndex.set(record.traceId, new Set([...traceRecords, record.recordId]))
  
  return newStore
}

/**
 * Update a record in the store
 */
export function updateExecutionRecord(
  store: ExecutionRecordStore,
  record: TaskExecutionRecord
): ExecutionRecordStore {
  if (!store.records.has(record.recordId)) {
    return store
  }
  
  const newStore = {
    records: new Map(store.records),
    sessionIndex: store.sessionIndex,
    traceIndex: store.traceIndex
  }
  
  newStore.records.set(record.recordId, record)
  return newStore
}

/**
 * Get a record by ID
 */
export function getExecutionRecord(
  store: ExecutionRecordStore,
  recordId: string
): TaskExecutionRecord | undefined {
  return store.records.get(recordId)
}

/**
 * Get records by session ID
 */
export function getSessionRecords(
  store: ExecutionRecordStore,
  sessionId: string
): TaskExecutionRecord[] {
  const recordIds = store.sessionIndex.get(sessionId)
  if (!recordIds) return []
  
  return Array.from(recordIds)
    .map(id => store.records.get(id))
    .filter((r): r is TaskExecutionRecord => r !== undefined)
}

/**
 * Get records by trace ID
 */
export function getTraceRecords(
  store: ExecutionRecordStore,
  traceId: string
): TaskExecutionRecord[] {
  const recordIds = store.traceIndex.get(traceId)
  if (!recordIds) return []
  
  return Array.from(recordIds)
    .map(id => store.records.get(id))
    .filter((r): r is TaskExecutionRecord => r !== undefined)
}

/**
 * Get records by task ID
 */
export function getTaskRecords(
  store: ExecutionRecordStore,
  taskId: string
): TaskExecutionRecord[] {
  return Array.from(store.records.values()).filter(r => r.taskId === taskId)
}

/**
 * Query records with filters
 */
export function queryExecutionRecords(
  store: ExecutionRecordStore,
  options: ExecutionQueryOptions
): TaskExecutionRecord[] {
  let records = Array.from(store.records.values())
  
  // Filter by sessionId
  if (options.sessionId) {
    records = getSessionRecords(store, options.sessionId)
  }
  
  // Filter by traceId
  if (options.traceId) {
    records = records.filter(r => r.traceId === options.traceId)
  }
  
  // Filter by taskId
  if (options.taskId) {
    records = records.filter(r => r.taskId === options.taskId)
  }
  
  // Filter by status
  if (options.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status]
    records = records.filter(r => statuses.includes(r.status))
  }
  
  // Filter by failure category
  if (options.failureCategory) {
    const categories = Array.isArray(options.failureCategory) 
      ? options.failureCategory 
      : [options.failureCategory]
    records = records.filter(r => 
      r.failureReason && categories.includes(r.failureReason.category)
    )
  }
  
  // Filter by time range
  if (options.startTimeFrom !== undefined) {
    records = records.filter(r => r.startTime >= options.startTimeFrom!)
  }
  if (options.startTimeTo !== undefined) {
    records = records.filter(r => r.startTime <= options.startTimeTo!)
  }
  
  // Sort by start time (newest first)
  records.sort((a, b) => b.startTime - a.startTime)
  
  // Apply pagination
  const offset = options.offset ?? 0
  const limit = options.limit ?? records.length
  
  return records.slice(offset, offset + limit)
}

/**
 * Get records by status
 */
export function getRecordsByStatus(
  store: ExecutionRecordStore,
  status: ResultStatus
): TaskExecutionRecord[] {
  return Array.from(store.records.values()).filter(r => r.status === status)
}

/**
 * Get failed records
 */
export function getFailedRecords(store: ExecutionRecordStore): TaskExecutionRecord[] {
  return Array.from(store.records.values()).filter(r => 
    r.status === 'failure' || r.status === 'timeout'
  )
}

/**
 * Get recoverable failures
 */
export function getRecoverableFailures(store: ExecutionRecordStore): TaskExecutionRecord[] {
  return Array.from(store.records.values()).filter(r => 
    r.failureReason?.recoverable === true
  )
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculate execution statistics
 */
export function calculateExecutionStatistics(
  store: ExecutionRecordStore
): ExecutionStatistics {
  const records = Array.from(store.records.values())
  const totalRecords = records.length
  
  // By status
  const byStatus: Record<ResultStatus, number> = {
    success: 0,
    partial_success: 0,
    failure: 0,
    cancelled: 0,
    timeout: 0,
    replan_triggered: 0
  }
  
  // By failure category
  const byFailureCategory: Record<FailureCategory, number> = {
    tool_failure: 0,
    permission_denied: 0,
    confirmation_rejected: 0,
    validation_error: 0,
    resource_unavailable: 0,
    timeout: 0,
    internal_error: 0,
    user_cancelled: 0,
    dependency_failure: 0,
    unknown: 0
  }
  
  let totalDuration = 0
  let successCount = 0
  let failureCount = 0
  let retrySuccessCount = 0
  let retryTotalCount = 0
  let replanSuccessCount = 0
  let replanTotalCount = 0
  
  for (const record of records) {
    // Status count
    byStatus[record.status]++
    
    // Failure category count
    if (record.failureReason) {
      byFailureCategory[record.failureReason.category]++
    }
    
    // Duration
    if (record.endTime !== undefined) {
      totalDuration += record.endTime - record.startTime
    }
    
    // Success/failure count
    if (record.status === 'success' || record.status === 'partial_success') {
      successCount++
    } else if (record.status === 'failure' || record.status === 'timeout') {
      failureCount++
    }
    
    // Retry stats
    for (const retry of record.retryOutcomes) {
      retryTotalCount++
      if (retry.status === 'succeeded') {
        retrySuccessCount++
      }
    }
    
    // Replan stats
    for (const replan of record.replanOutcomes) {
      replanTotalCount++
      if (replan.status === 'succeeded') {
        replanSuccessCount++
      }
    }
  }
  
  const recordsWithDuration = records.filter(r => r.endTime !== undefined).length
  
  return {
    totalRecords,
    byStatus,
    byFailureCategory,
    averageDuration: recordsWithDuration > 0 ? totalDuration / recordsWithDuration : 0,
    successRate: totalRecords > 0 ? successCount / totalRecords : 0,
    failureRate: totalRecords > 0 ? failureCount / totalRecords : 0,
    retrySuccessRate: retryTotalCount > 0 ? retrySuccessCount / retryTotalCount : 0,
    replanSuccessRate: replanTotalCount > 0 ? replanSuccessCount / replanTotalCount : 0
  }
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize an execution record
 */
export function serializeExecutionRecord(record: TaskExecutionRecord): string {
  return JSON.stringify(record)
}

/**
 * Deserialize an execution record
 */
export function deserializeExecutionRecord(data: string): TaskExecutionRecord {
  return JSON.parse(data) as TaskExecutionRecord
}

/**
 * Serialize an execution record store
 */
export function serializeExecutionStore(store: ExecutionRecordStore): string {
  const serializable: SerializableExecutionRecordStore = {
    records: Array.from(store.records.values())
  }
  return JSON.stringify(serializable)
}

/**
 * Deserialize an execution record store
 */
export function deserializeExecutionStore(data: string): ExecutionRecordStore {
  const serializable = JSON.parse(data) as SerializableExecutionRecordStore
  const store = createExecutionRecordStore()
  
  for (const record of serializable.records) {
    store.records.set(record.recordId, record)
    
    // Rebuild indexes
    const sessionRecords = store.sessionIndex.get(record.sessionId) ?? new Set()
    sessionRecords.add(record.recordId)
    store.sessionIndex.set(record.sessionId, sessionRecords)
    
    const traceRecords = store.traceIndex.get(record.traceId) ?? new Set()
    traceRecords.add(record.recordId)
    store.traceIndex.set(record.traceId, traceRecords)
  }
  
  return store
}

// ============================================================================
// Debug Formatting
// ============================================================================

/**
 * Format an execution record for debugging
 */
export function formatExecutionRecord(record: TaskExecutionRecord): string {
  const lines: string[] = [
    `Execution Record: ${record.recordId}`,
    `  Task: ${record.taskName} (${record.taskId})`,
    `  Session: ${record.sessionId}`,
    `  Trace: ${record.traceId}`,
    `  Status: ${record.status}`,
    `  Started: ${new Date(record.startTime).toISOString()}`,
  ]
  
  if (record.endTime !== undefined) {
    lines.push(`  Ended: ${new Date(record.endTime).toISOString()}`)
    lines.push(`  Duration: ${record.endTime - record.startTime}ms`)
  }
  
  if (record.result) {
    lines.push(`  Result Type: ${record.result.outputType}`)
    if (record.result.confidence !== undefined) {
      lines.push(`  Confidence: ${record.result.confidence}`)
    }
  }
  
  if (record.failureReason) {
    lines.push(`  Failure: [${record.failureReason.category}] ${record.failureReason.message}`)
    lines.push(`    Recoverable: ${record.failureReason.recoverable}`)
  }
  
  if (record.impactedSteps.length > 0) {
    lines.push(`  Impacted Steps: ${record.impactedSteps.length}`)
    for (const step of record.impactedSteps) {
      lines.push(`    - ${step.stepId} (${step.stepType})`)
    }
  }
  
  if (record.retryOutcomes.length > 0) {
    lines.push(`  Retries: ${record.retryOutcomes.length}`)
    for (const retry of record.retryOutcomes) {
      lines.push(`    - Attempt ${retry.attemptNumber}: ${retry.status}`)
    }
  }
  
  if (record.replanOutcomes.length > 0) {
    lines.push(`  Replans: ${record.replanOutcomes.length}`)
    for (const replan of record.replanOutcomes) {
      lines.push(`    - Attempt ${replan.attemptNumber}: ${replan.status}`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Format execution statistics for debugging
 */
export function formatExecutionStatistics(stats: ExecutionStatistics): string {
  const lines: string[] = [
    'Execution Statistics:',
    `  Total Records: ${stats.totalRecords}`,
    `  Average Duration: ${stats.averageDuration.toFixed(2)}ms`,
    `  Success Rate: ${(stats.successRate * 100).toFixed(2)}%`,
    `  Failure Rate: ${(stats.failureRate * 100).toFixed(2)}%`,
    `  Retry Success Rate: ${(stats.retrySuccessRate * 100).toFixed(2)}%`,
    `  Replan Success Rate: ${(stats.replanSuccessRate * 100).toFixed(2)}%`,
    '',
    '  By Status:'
  ]
  
  for (const [status, count] of Object.entries(stats.byStatus)) {
    if (count > 0) {
      lines.push(`    ${status}: ${count}`)
    }
  }
  
  lines.push('')
  lines.push('  By Failure Category:')
  
  for (const [category, count] of Object.entries(stats.byFailureCategory)) {
    if (count > 0) {
      lines.push(`    ${category}: ${count}`)
    }
  }
  
  return lines.join('\n')
}
