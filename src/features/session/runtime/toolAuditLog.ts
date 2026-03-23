/**
 * Tool Audit Log Module (Story 48.2)
 * 
 * This module provides audit logging for all tool calls in the runtime.
 * It persists audit entries for each tool call, records input and result summaries,
 * links permission and confirmation outcomes to tool events, and makes audit events
 * available for future governance views.
 */

// ==================== Type Definitions ====================

/**
 * Audit entry status
 */
export type AuditStatus = 
  | 'pending'
  | 'executing'
  | 'success'
  | 'failure'
  | 'permission_denied'
  | 'confirmation_rejected'
  | 'timeout'
  | 'cancelled'

/**
 * Permission outcome
 */
export interface PermissionOutcome {
  granted: boolean
  permissionId: string
  requestedAt: number
  resolvedAt: number
  reason?: string
}

/**
 * Confirmation outcome
 */
export interface ConfirmationOutcome {
  confirmed: boolean
  confirmationId: string
  requestedAt: number
  resolvedAt: number
  userResponse?: string
  reason?: string
}

/**
 * Tool call input summary
 */
export interface ToolInputSummary {
  toolName: string
  toolId: string
  parameters?: Record<string, unknown>
  parameterCount: number
  hasSensitiveData: boolean
  truncatedParameters?: string
}

/**
 * Tool call result summary
 */
export interface ToolResultSummary {
  success: boolean
  resultType: 'data' | 'error' | 'empty' | 'streaming'
  resultSize?: number
  resultPreview?: string
  error?: {
    code: string
    message: string
    stack?: string
  }
  duration?: number
}

/**
 * Tool audit entry
 */
export interface ToolAuditEntry {
  auditId: string
  traceId: string
  sessionId: string
  stepId?: string
  taskId?: string
  
  // Tool identification
  toolName: string
  toolId: string
  toolType: 'core' | 'plugin' | 'mcp'
  
  // Timestamps
  createdAt: number
  startedAt?: number
  completedAt?: number
  duration?: number
  
  // Status
  status: AuditStatus
  
  // Input/Output
  input: ToolInputSummary
  result?: ToolResultSummary
  
  // Permission and Confirmation
  permissionOutcome?: PermissionOutcome
  confirmationOutcome?: ConfirmationOutcome
  
  // Actor
  actor: {
    userId?: string
    tenantId?: string
    departmentId?: string
    sessionId: string
  }
  
  // Metadata
  metadata?: Record<string, unknown>
  
  // Governance
  governanceTags?: string[]
  retentionCategory: 'standard' | 'sensitive' | 'critical'
}

/**
 * Audit log store
 */
export interface AuditLogStore {
  entries: Map<string, ToolAuditEntry>
  sessionIndex: Map<string, string[]>  // sessionId -> auditIds
  toolIndex: Map<string, string[]>     // toolId -> auditIds
  traceIndex: Map<string, string[]>    // traceId -> auditIds
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
  sessionId?: string
  traceId?: string
  toolId?: string
  toolName?: string
  status?: AuditStatus
  fromDate?: number
  toDate?: number
  userId?: string
  tenantId?: string
  limit?: number
  offset?: number
}

/**
 * Audit statistics
 */
export interface AuditStatistics {
  totalEntries: number
  successCount: number
  failureCount: number
  permissionDeniedCount: number
  confirmationRejectedCount: number
  timeoutCount: number
  cancelledCount: number
  averageDuration?: number
  toolUsageCounts: Record<string, number>
  statusCounts: Record<AuditStatus, number>
}

// ==================== Constants ====================

const AUDIT_ID_PREFIX = 'audit'
const MAX_PREVIEW_LENGTH = 200
const SENSITIVE_PARAM_NAMES = ['password', 'secret', 'token', 'key', 'credential', 'auth']

// ==================== ID Generation ====================

/**
 * Generate a unique tool audit ID
 */
export function generateToolAuditId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${AUDIT_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Validate an audit ID format
 */
export function isValidAuditId(id: string): boolean {
  const pattern = /^audit_\d+_[a-f0-9]{16}$/
  return pattern.test(id)
}

// ==================== Input/Output Summary Functions ====================

/**
 * Check if a parameter name might contain sensitive data
 */
export function isSensitiveParameter(paramName: string): boolean {
  const lowerName = paramName.toLowerCase()
  return SENSITIVE_PARAM_NAMES.some(sensitive => lowerName.includes(sensitive))
}

/**
 * Create an input summary from tool parameters
 */
export function createInputSummary(
  toolName: string,
  toolId: string,
  parameters?: Record<string, unknown>
): ToolInputSummary {
  const paramEntries = parameters ? Object.entries(parameters) : []
  const hasSensitiveData = paramEntries.some(([key]) => isSensitiveParameter(key))
  
  let truncatedParameters: string | undefined
  if (parameters) {
    const jsonStr = JSON.stringify(parameters)
    if (jsonStr.length > MAX_PREVIEW_LENGTH) {
      truncatedParameters = jsonStr.substring(0, MAX_PREVIEW_LENGTH) + '...'
    }
  }
  
  return {
    toolName,
    toolId,
    parameters: hasSensitiveData ? undefined : parameters,
    parameterCount: paramEntries.length,
    hasSensitiveData,
    truncatedParameters,
  }
}

/**
 * Create a result summary from tool output
 */
export function createResultSummary(
  result: unknown,
  error?: { code: string; message: string; stack?: string },
  duration?: number
): ToolResultSummary {
  if (error) {
    return {
      success: false,
      resultType: 'error',
      error,
      duration,
    }
  }
  
  if (result === undefined || result === null) {
    return {
      success: true,
      resultType: 'empty',
      duration,
    }
  }
  
  const resultStr = JSON.stringify(result)
  const resultSize = resultStr.length
  
  // Check if result is streaming
  const isStreaming = typeof result === 'object' && result !== null && 
    ('stream' in result || 'asyncIterator' in result)
  
  return {
    success: true,
    resultType: isStreaming ? 'streaming' : 'data',
    resultSize,
    resultPreview: resultStr.length > MAX_PREVIEW_LENGTH 
      ? resultStr.substring(0, MAX_PREVIEW_LENGTH) + '...'
      : resultStr,
    duration,
  }
}

// ==================== Permission and Confirmation Functions ====================

/**
 * Create a permission outcome
 */
export function createPermissionOutcome(
  granted: boolean,
  permissionId: string,
  reason?: string
): PermissionOutcome {
  const now = Date.now()
  return {
    granted,
    permissionId,
    requestedAt: now,
    resolvedAt: now,
    reason,
  }
}

/**
 * Create a confirmation outcome
 */
export function createConfirmationOutcome(
  confirmed: boolean,
  confirmationId: string,
  userResponse?: string,
  reason?: string
): ConfirmationOutcome {
  const now = Date.now()
  return {
    confirmed,
    confirmationId,
    requestedAt: now,
    resolvedAt: now,
    userResponse,
    reason,
  }
}

// ==================== Audit Entry Functions ====================

/**
 * Create a new tool audit entry
 */
export function createToolAuditEntry(
  traceId: string,
  sessionId: string,
  toolName: string,
  toolId: string,
  toolType: ToolAuditEntry['toolType'],
  actor: ToolAuditEntry['actor'],
  options: {
    stepId?: string
    taskId?: string
    parameters?: Record<string, unknown>
    metadata?: Record<string, unknown>
    governanceTags?: string[]
    retentionCategory?: ToolAuditEntry['retentionCategory']
  } = {}
): ToolAuditEntry {
  return {
    auditId: generateToolAuditId(),
    traceId,
    sessionId,
    stepId: options.stepId,
    taskId: options.taskId,
    toolName,
    toolId,
    toolType,
    createdAt: Date.now(),
    status: 'pending',
    input: createInputSummary(toolName, toolId, options.parameters),
    actor,
    metadata: options.metadata,
    governanceTags: options.governanceTags,
    retentionCategory: options.retentionCategory ?? 'standard',
  }
}

/**
 * Mark an audit entry as executing
 */
export function markExecuting(entry: ToolAuditEntry): ToolAuditEntry {
  return {
    ...entry,
    status: 'executing',
    startedAt: Date.now(),
  }
}

/**
 * Mark an audit entry as successful
 */
export function markSuccess(
  entry: ToolAuditEntry,
  result: unknown,
  duration?: number
): ToolAuditEntry {
  const actualDuration = duration ?? (entry.startedAt ? Date.now() - entry.startedAt : undefined)
  return {
    ...entry,
    status: 'success',
    completedAt: Date.now(),
    duration: actualDuration,
    result: createResultSummary(result, undefined, actualDuration),
  }
}

/**
 * Mark an audit entry as failed
 */
export function markFailure(
  entry: ToolAuditEntry,
  error: { code: string; message: string; stack?: string },
  duration?: number
): ToolAuditEntry {
  const actualDuration = duration ?? (entry.startedAt ? Date.now() - entry.startedAt : undefined)
  return {
    ...entry,
    status: 'failure',
    completedAt: Date.now(),
    duration: actualDuration,
    result: createResultSummary(undefined, error, actualDuration),
  }
}

/**
 * Mark an audit entry as permission denied
 */
export function markPermissionDenied(
  entry: ToolAuditEntry,
  permissionOutcome: PermissionOutcome
): ToolAuditEntry {
  return {
    ...entry,
    status: 'permission_denied',
    completedAt: Date.now(),
    permissionOutcome,
  }
}

/**
 * Mark an audit entry as confirmation rejected
 */
export function markConfirmationRejected(
  entry: ToolAuditEntry,
  confirmationOutcome: ConfirmationOutcome
): ToolAuditEntry {
  return {
    ...entry,
    status: 'confirmation_rejected',
    completedAt: Date.now(),
    confirmationOutcome,
  }
}

/**
 * Mark an audit entry as timed out
 */
export function markTimeout(entry: ToolAuditEntry): ToolAuditEntry {
  return {
    ...entry,
    status: 'timeout',
    completedAt: Date.now(),
    duration: entry.startedAt ? Date.now() - entry.startedAt : undefined,
  }
}

/**
 * Mark an audit entry as cancelled
 */
export function markCancelled(entry: ToolAuditEntry, reason?: string): ToolAuditEntry {
  return {
    ...entry,
    status: 'cancelled',
    completedAt: Date.now(),
    duration: entry.startedAt ? Date.now() - entry.startedAt : undefined,
    metadata: { ...entry.metadata, cancelReason: reason },
  }
}

// ==================== Audit Store Functions ====================

/**
 * Create an empty audit log store
 */
export function createAuditLogStore(): AuditLogStore {
  return {
    entries: new Map(),
    sessionIndex: new Map(),
    toolIndex: new Map(),
    traceIndex: new Map(),
  }
}

/**
 * Add an audit entry to the store
 */
export function addAuditEntry(
  store: AuditLogStore,
  entry: ToolAuditEntry
): AuditLogStore {
  const newStore = { ...store }
  
  // Add entry
  newStore.entries = new Map(store.entries)
  newStore.entries.set(entry.auditId, entry)
  
  // Update session index
  newStore.sessionIndex = new Map(store.sessionIndex)
  const sessionAudits = newStore.sessionIndex.get(entry.sessionId) || []
  newStore.sessionIndex.set(entry.sessionId, [...sessionAudits, entry.auditId])
  
  // Update tool index
  newStore.toolIndex = new Map(store.toolIndex)
  const toolAudits = newStore.toolIndex.get(entry.toolId) || []
  newStore.toolIndex.set(entry.toolId, [...toolAudits, entry.auditId])
  
  // Update trace index
  newStore.traceIndex = new Map(store.traceIndex)
  const traceAudits = newStore.traceIndex.get(entry.traceId) || []
  newStore.traceIndex.set(entry.traceId, [...traceAudits, entry.auditId])
  
  return newStore
}

/**
 * Update an audit entry in the store
 */
export function updateAuditEntry(
  store: AuditLogStore,
  auditId: string,
  update: (entry: ToolAuditEntry) => ToolAuditEntry
): AuditLogStore | null {
  const entry = store.entries.get(auditId)
  if (!entry) return null
  
  const updatedEntry = update(entry)
  
  return {
    ...store,
    entries: new Map(store.entries).set(auditId, updatedEntry),
  }
}

// ==================== Query Functions ====================

/**
 * Get an audit entry by ID
 */
export function getAuditEntry(
  store: AuditLogStore,
  auditId: string
): ToolAuditEntry | undefined {
  return store.entries.get(auditId)
}

/**
 * Get all audit entries for a session
 */
export function getSessionAuditEntries(
  store: AuditLogStore,
  sessionId: string
): ToolAuditEntry[] {
  const auditIds = store.sessionIndex.get(sessionId) || []
  return auditIds
    .map(id => store.entries.get(id))
    .filter((e): e is ToolAuditEntry => e !== undefined)
}

/**
 * Get all audit entries for a trace
 */
export function getTraceAuditEntries(
  store: AuditLogStore,
  traceId: string
): ToolAuditEntry[] {
  const auditIds = store.traceIndex.get(traceId) || []
  return auditIds
    .map(id => store.entries.get(id))
    .filter((e): e is ToolAuditEntry => e !== undefined)
}

/**
 * Get all audit entries for a tool
 */
export function getToolAuditEntries(
  store: AuditLogStore,
  toolId: string
): ToolAuditEntry[] {
  const auditIds = store.toolIndex.get(toolId) || []
  return auditIds
    .map(id => store.entries.get(id))
    .filter((e): e is ToolAuditEntry => e !== undefined)
}

/**
 * Query audit entries with filters
 */
export function queryAuditEntries(
  store: AuditLogStore,
  options: AuditQueryOptions = {}
): ToolAuditEntry[] {
  let entries = Array.from(store.entries.values())
  
  // Filter by session
  if (options.sessionId) {
    entries = entries.filter(e => e.sessionId === options.sessionId)
  }
  
  // Filter by trace
  if (options.traceId) {
    entries = entries.filter(e => e.traceId === options.traceId)
  }
  
  // Filter by tool
  if (options.toolId) {
    entries = entries.filter(e => e.toolId === options.toolId)
  }
  
  // Filter by tool name
  if (options.toolName) {
    entries = entries.filter(e => e.toolName === options.toolName)
  }
  
  // Filter by status
  if (options.status) {
    entries = entries.filter(e => e.status === options.status)
  }
  
  // Filter by date range
  if (options.fromDate) {
    entries = entries.filter(e => e.createdAt >= options.fromDate!)
  }
  if (options.toDate) {
    entries = entries.filter(e => e.createdAt <= options.toDate!)
  }
  
  // Filter by user
  if (options.userId) {
    entries = entries.filter(e => e.actor.userId === options.userId)
  }
  
  // Filter by tenant
  if (options.tenantId) {
    entries = entries.filter(e => e.actor.tenantId === options.tenantId)
  }
  
  // Sort by createdAt descending
  entries.sort((a, b) => b.createdAt - a.createdAt)
  
  // Apply pagination
  const offset = options.offset ?? 0
  const limit = options.limit ?? entries.length
  
  return entries.slice(offset, offset + limit)
}

/**
 * Get entries by status
 */
export function getEntriesByStatus(
  store: AuditLogStore,
  status: AuditStatus
): ToolAuditEntry[] {
  return Array.from(store.entries.values()).filter(e => e.status === status)
}

// ==================== Statistics Functions ====================

/**
 * Calculate audit statistics
 */
export function calculateAuditStatistics(
  store: AuditLogStore,
  options: AuditQueryOptions = {}
): AuditStatistics {
  const entries = queryAuditEntries(store, options)
  
  const toolUsageCounts: Record<string, number> = {}
  const statusCounts: Record<AuditStatus, number> = {
    pending: 0,
    executing: 0,
    success: 0,
    failure: 0,
    permission_denied: 0,
    confirmation_rejected: 0,
    timeout: 0,
    cancelled: 0,
  }
  
  let totalDuration = 0
  let durationCount = 0
  
  for (const entry of entries) {
    // Count tool usage
    toolUsageCounts[entry.toolName] = (toolUsageCounts[entry.toolName] ?? 0) + 1
    
    // Count status
    statusCounts[entry.status]++
    
    // Sum durations
    if (entry.duration !== undefined) {
      totalDuration += entry.duration
      durationCount++
    }
  }
  
  return {
    totalEntries: entries.length,
    successCount: statusCounts.success,
    failureCount: statusCounts.failure,
    permissionDeniedCount: statusCounts.permission_denied,
    confirmationRejectedCount: statusCounts.confirmation_rejected,
    timeoutCount: statusCounts.timeout,
    cancelledCount: statusCounts.cancelled,
    averageDuration: durationCount > 0 ? totalDuration / durationCount : undefined,
    toolUsageCounts,
    statusCounts,
  }
}

// ==================== Governance Functions ====================

/**
 * Get entries with governance tags
 */
export function getGovernanceTaggedEntries(
  store: AuditLogStore,
  tag: string
): ToolAuditEntry[] {
  return Array.from(store.entries.values()).filter(
    e => e.governanceTags?.includes(tag)
  )
}

/**
 * Get entries by retention category
 */
export function getEntriesByRetentionCategory(
  store: AuditLogStore,
  category: ToolAuditEntry['retentionCategory']
): ToolAuditEntry[] {
  return Array.from(store.entries.values()).filter(
    e => e.retentionCategory === category
  )
}

// ==================== Serialization ====================

/**
 * Serializable audit entry
 */
export interface SerializableToolAuditEntry {
  auditId: string
  traceId: string
  sessionId: string
  stepId?: string
  taskId?: string
  toolName: string
  toolId: string
  toolType: ToolAuditEntry['toolType']
  createdAt: number
  startedAt?: number
  completedAt?: number
  duration?: number
  status: AuditStatus
  input: ToolInputSummary
  result?: ToolResultSummary
  permissionOutcome?: PermissionOutcome
  confirmationOutcome?: ConfirmationOutcome
  actor: ToolAuditEntry['actor']
  metadata?: Record<string, unknown>
  governanceTags?: string[]
  retentionCategory: ToolAuditEntry['retentionCategory']
}

/**
 * Serializable audit log store
 */
export interface SerializableAuditLogStore {
  entries: SerializableToolAuditEntry[]
  sessionIndex: [string, string[]][]
  toolIndex: [string, string[]][]
  traceIndex: [string, string[]][]
}

/**
 * Serialize an audit entry
 */
export function serializeAuditEntry(entry: ToolAuditEntry): SerializableToolAuditEntry {
  return { ...entry }
}

/**
 * Deserialize an audit entry
 */
export function deserializeAuditEntry(data: SerializableToolAuditEntry): ToolAuditEntry {
  return { ...data }
}

/**
 * Serialize an audit log store
 */
export function serializeAuditLogStore(store: AuditLogStore): SerializableAuditLogStore {
  return {
    entries: Array.from(store.entries.values()).map(serializeAuditEntry),
    sessionIndex: Array.from(store.sessionIndex.entries()),
    toolIndex: Array.from(store.toolIndex.entries()),
    traceIndex: Array.from(store.traceIndex.entries()),
  }
}

/**
 * Deserialize an audit log store
 */
export function deserializeAuditLogStore(data: SerializableAuditLogStore): AuditLogStore {
  const entries = new Map<string, ToolAuditEntry>()
  data.entries.forEach(e => entries.set(e.auditId, deserializeAuditEntry(e)))
  
  return {
    entries,
    sessionIndex: new Map(data.sessionIndex),
    toolIndex: new Map(data.toolIndex),
    traceIndex: new Map(data.traceIndex),
  }
}

// ==================== Debug Helpers ====================

/**
 * Format an audit entry for debugging
 */
export function formatAuditEntry(entry: ToolAuditEntry): string {
  const duration = entry.duration ? ` (${entry.duration}ms)` : ''
  return `ToolAuditEntry(
  id: ${entry.auditId},
  tool: ${entry.toolName} (${entry.toolType}),
  status: ${entry.status}${duration},
  trace: ${entry.traceId},
  session: ${entry.sessionId}
)`
}

/**
 * Format audit statistics for debugging
 */
export function formatAuditStatistics(stats: AuditStatistics): string {
  return `AuditStatistics(
  total: ${stats.totalEntries},
  success: ${stats.successCount},
  failure: ${stats.failureCount},
  permission_denied: ${stats.permissionDeniedCount},
  confirmation_rejected: ${stats.confirmationRejectedCount},
  avg_duration: ${stats.averageDuration?.toFixed(2) ?? 'N/A'}ms
)`
}
