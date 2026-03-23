/**
 * Runtime Metrics and Debug View Module (Story 48.4)
 * 
 * Provide baseline runtime metrics and a debug inspection view.
 * 
 * Key features:
 * - Collect runtime success and latency metrics
 * - Track retry and confirmation counts
 * - Expose a minimal debug inspection view
 * - Support filtering by trace or session id
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Metric severity level
 */
export type MetricSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Metric category for grouping
 */
export type MetricCategory =
  | 'performance'
  | 'reliability'
  | 'resource'
  | 'business'
  | 'error'
  | 'custom'

/**
 * Metric data point
 */
export interface MetricPoint {
  timestamp: number
  value: number
  tags?: Record<string, string>
}

/**
 * Metric aggregation result
 */
export interface MetricAggregation {
  count: number
  sum: number
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
}

/**
 * Runtime metric definition
 */
export interface RuntimeMetric {
  metricId: string
  name: string
  category: MetricCategory
  unit: string
  description?: string
  severity: MetricSeverity
  points: MetricPoint[]
  aggregation?: MetricAggregation
  createdAt: number
  updatedAt: number
}

/**
 * Latency metrics
 */
export interface LatencyMetrics {
  totalOperations: number
  averageLatencyMs: number
  minLatencyMs: number
  maxLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  timeoutCount: number
}

/**
 * Success metrics
 */
export interface SuccessMetrics {
  totalOperations: number
  successCount: number
  failureCount: number
  partialSuccessCount: number
  successRate: number
  failureRate: number
}

/**
 * Retry metrics
 */
export interface RetryMetrics {
  totalRetries: number
  successfulRetries: number
  failedRetries: number
  exhaustedRetries: number
  retrySuccessRate: number
  averageRetriesPerOperation: number
}

/**
 * Confirmation metrics
 */
export interface ConfirmationMetrics {
  totalConfirmations: number
  approvedConfirmations: number
  rejectedConfirmations: number
  timedOutConfirmations: number
  approvalRate: number
  averageConfirmationTimeMs: number
}

/**
 * Runtime metrics summary
 */
export interface RuntimeMetricsSummary {
  sessionId: string
  traceId?: string
  collectedAt: number
  latency: LatencyMetrics
  success: SuccessMetrics
  retry: RetryMetrics
  confirmation: ConfirmationMetrics
  customMetrics: Map<string, RuntimeMetric>
}

/**
 * Debug view entry
 */
export interface DebugViewEntry {
  entryId: string
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  category: string
  message: string
  details?: Record<string, unknown>
  traceId?: string
  sessionId?: string
  stepId?: string
}

/**
 * Debug view filter
 */
export interface DebugViewFilter {
  sessionId?: string
  traceId?: string
  level?: DebugViewEntry['level'] | DebugViewEntry['level'][]
  category?: string | string[]
  messageContains?: string
  startTime?: number
  endTime?: number
  limit?: number
  offset?: number
}

/**
 * Debug view store
 */
export interface DebugViewStore {
  entries: Map<string, DebugViewEntry>
  sessionIndex: Map<string, Set<string>>
  traceIndex: Map<string, Set<string>>
}

/**
 * Metrics store
 */
export interface MetricsStore {
  metrics: Map<string, RuntimeMetric>
  sessionIndex: Map<string, Set<string>>
  categoryIndex: Map<string, Set<string>>
}

/**
 * Serializable metrics store
 */
export interface SerializableMetricsStore {
  metrics: RuntimeMetric[]
}

/**
 * Serializable debug view store
 */
export interface SerializableDebugViewStore {
  entries: DebugViewEntry[]
}

// ============================================================================
// Constants
// ============================================================================

export const METRIC_ID_PREFIX = 'metric'
export const DEBUG_ENTRY_ID_PREFIX = 'debug'

export const METRIC_CATEGORIES: MetricCategory[] = [
  'performance',
  'reliability',
  'resource',
  'business',
  'error',
  'custom'
]

export const METRIC_SEVERITIES: MetricSeverity[] = [
  'info',
  'warning',
  'error',
  'critical'
]

export const DEBUG_LEVELS: DebugViewEntry['level'][] = [
  'debug',
  'info',
  'warn',
  'error'
]

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique metric ID
 */
export function generateMetricId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${METRIC_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique debug entry ID
 */
export function generateDebugEntryId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${DEBUG_ENTRY_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Validate metric ID
 */
export function isValidMetricId(id: string): boolean {
  return /^metric_\d+_[a-f0-9]{16}$/.test(id)
}

/**
 * Validate debug entry ID
 */
export function isValidDebugEntryId(id: string): boolean {
  return /^debug_\d+_[a-f0-9]{8}$/.test(id)
}

// ============================================================================
// Metric Point Functions
// ============================================================================

/**
 * Create a metric point
 */
export function createMetricPoint(
  value: number,
  tags?: Record<string, string>
): MetricPoint {
  return {
    timestamp: Date.now(),
    value,
    tags
  }
}

/**
 * Calculate aggregation for metric points
 */
export function calculateMetricAggregation(points: MetricPoint[]): MetricAggregation {
  if (points.length === 0) {
    return {
      count: 0,
      sum: 0,
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0
    }
  }

  const values = points.map(p => p.value).sort((a, b) => a - b)
  const count = values.length
  const sum = values.reduce((a, b) => a + b, 0)

  return {
    count,
    sum,
    min: values[0],
    max: values[count - 1],
    avg: sum / count,
    p50: values[Math.floor(count * 0.5)] ?? values[0],
    p95: values[Math.floor(count * 0.95)] ?? values[count - 1],
    p99: values[Math.floor(count * 0.99)] ?? values[count - 1]
  }
}

// ============================================================================
// Runtime Metric Functions
// ============================================================================

/**
 * Create a runtime metric
 */
export function createRuntimeMetric(
  name: string,
  category: MetricCategory,
  unit: string,
  options?: {
    description?: string
    severity?: MetricSeverity
    initialPoint?: MetricPoint
  }
): RuntimeMetric {
  const now = Date.now()
  const points = options?.initialPoint ? [options.initialPoint] : []

  return {
    metricId: generateMetricId(),
    name,
    category,
    unit,
    description: options?.description,
    severity: options?.severity ?? 'info',
    points,
    aggregation: points.length > 0 ? calculateMetricAggregation(points) : undefined,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Add a point to a metric
 */
export function addMetricPoint(
  metric: RuntimeMetric,
  point: MetricPoint
): RuntimeMetric {
  const points = [...metric.points, point]
  return {
    ...metric,
    points,
    aggregation: calculateMetricAggregation(points),
    updatedAt: Date.now()
  }
}

/**
 * Add multiple points to a metric
 */
export function addMetricPoints(
  metric: RuntimeMetric,
  newPoints: MetricPoint[]
): RuntimeMetric {
  const points = [...metric.points, ...newPoints]
  return {
    ...metric,
    points,
    aggregation: calculateMetricAggregation(points),
    updatedAt: Date.now()
  }
}

// ============================================================================
// Metrics Summary Functions
// ============================================================================

/**
 * Create empty latency metrics
 */
export function createEmptyLatencyMetrics(): LatencyMetrics {
  return {
    totalOperations: 0,
    averageLatencyMs: 0,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    p50LatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    timeoutCount: 0
  }
}

/**
 * Create empty success metrics
 */
export function createEmptySuccessMetrics(): SuccessMetrics {
  return {
    totalOperations: 0,
    successCount: 0,
    failureCount: 0,
    partialSuccessCount: 0,
    successRate: 0,
    failureRate: 0
  }
}

/**
 * Create empty retry metrics
 */
export function createEmptyRetryMetrics(): RetryMetrics {
  return {
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    exhaustedRetries: 0,
    retrySuccessRate: 0,
    averageRetriesPerOperation: 0
  }
}

/**
 * Create empty confirmation metrics
 */
export function createEmptyConfirmationMetrics(): ConfirmationMetrics {
  return {
    totalConfirmations: 0,
    approvedConfirmations: 0,
    rejectedConfirmations: 0,
    timedOutConfirmations: 0,
    approvalRate: 0,
    averageConfirmationTimeMs: 0
  }
}

/**
 * Create runtime metrics summary
 */
export function createRuntimeMetricsSummary(
  sessionId: string,
  options?: {
    traceId?: string
  }
): RuntimeMetricsSummary {
  return {
    sessionId,
    traceId: options?.traceId,
    collectedAt: Date.now(),
    latency: createEmptyLatencyMetrics(),
    success: createEmptySuccessMetrics(),
    retry: createEmptyRetryMetrics(),
    confirmation: createEmptyConfirmationMetrics(),
    customMetrics: new Map()
  }
}

/**
 * Update latency metrics from operation durations
 */
export function updateLatencyMetrics(
  metrics: LatencyMetrics,
  durationMs: number,
  isTimeout: boolean = false
): LatencyMetrics {
  const newTotal = metrics.totalOperations + 1
  const newSum = metrics.averageLatencyMs * metrics.totalOperations + durationMs
  const newTimeouts = metrics.timeoutCount + (isTimeout ? 1 : 0)

  // We use a simplified approach that updates the aggregates
  // In a real implementation, we'd store all durations for accurate percentiles

  return {
    totalOperations: newTotal,
    averageLatencyMs: newSum / newTotal,
    minLatencyMs: metrics.totalOperations === 0 ? durationMs : Math.min(metrics.minLatencyMs, durationMs),
    maxLatencyMs: Math.max(metrics.maxLatencyMs, durationMs),
    // Percentiles need full data, so we'll approximate
    p50LatencyMs: newSum / newTotal,
    p95LatencyMs: newSum / newTotal,
    p99LatencyMs: newSum / newTotal,
    timeoutCount: newTimeouts
  }
}

/**
 * Update success metrics
 */
export function updateSuccessMetrics(
  metrics: SuccessMetrics,
  isSuccess: boolean,
  isPartial: boolean = false
): SuccessMetrics {
  const newTotal = metrics.totalOperations + 1

  let newSuccessCount = metrics.successCount
  let newFailureCount = metrics.failureCount
  let newPartialCount = metrics.partialSuccessCount

  if (isSuccess) {
    if (isPartial) {
      newPartialCount++
    } else {
      newSuccessCount++
    }
  } else {
    newFailureCount++
  }

  return {
    totalOperations: newTotal,
    successCount: newSuccessCount,
    failureCount: newFailureCount,
    partialSuccessCount: newPartialCount,
    successRate: newTotal > 0 ? newSuccessCount / newTotal : 0,
    failureRate: newTotal > 0 ? newFailureCount / newTotal : 0
  }
}

/**
 * Update retry metrics
 */
export function updateRetryMetrics(
  metrics: RetryMetrics,
  isSuccess: boolean | null,
  isExhausted: boolean = false
): RetryMetrics {
  const newTotal = metrics.totalRetries + 1

  let newSuccessful = metrics.successfulRetries
  let newFailed = metrics.failedRetries
  let newExhausted = metrics.exhaustedRetries

  if (isExhausted) {
    newExhausted++
  } else if (isSuccess === true) {
    newSuccessful++
  } else if (isSuccess === false) {
    newFailed++
  }

  return {
    totalRetries: newTotal,
    successfulRetries: newSuccessful,
    failedRetries: newFailed,
    exhaustedRetries: newExhausted,
    retrySuccessRate: newTotal > 0 ? newSuccessful / newTotal : 0,
    averageRetriesPerOperation: metrics.averageRetriesPerOperation // This needs to be calculated differently
  }
}

/**
 * Update confirmation metrics
 */
export function updateConfirmationMetrics(
  metrics: ConfirmationMetrics,
  isApproved: boolean | null,
  confirmationTimeMs?: number
): ConfirmationMetrics {
  const newTotal = metrics.totalConfirmations + 1

  let newApproved = metrics.approvedConfirmations
  let newRejected = metrics.rejectedConfirmations
  let newTimedOut = metrics.timedOutConfirmations

  if (isApproved === true) {
    newApproved++
  } else if (isApproved === false) {
    newRejected++
  } else {
    newTimedOut++
  }

  // Update average confirmation time
  let newAvgTime = metrics.averageConfirmationTimeMs
  if (confirmationTimeMs !== undefined) {
    newAvgTime = (metrics.averageConfirmationTimeMs * metrics.totalConfirmations + confirmationTimeMs) / newTotal
  }

  return {
    totalConfirmations: newTotal,
    approvedConfirmations: newApproved,
    rejectedConfirmations: newRejected,
    timedOutConfirmations: newTimedOut,
    approvalRate: newTotal > 0 ? newApproved / newTotal : 0,
    averageConfirmationTimeMs: newAvgTime
  }
}

/**
 * Add custom metric to summary
 */
export function addCustomMetric(
  summary: RuntimeMetricsSummary,
  metric: RuntimeMetric
): RuntimeMetricsSummary {
  const newMetrics = new Map(summary.customMetrics)
  newMetrics.set(metric.name, metric)

  return {
    ...summary,
    collectedAt: Date.now()
  }
}

// ============================================================================
// Debug View Functions
// ============================================================================

/**
 * Create a debug view entry
 */
export function createDebugEntry(
  level: DebugViewEntry['level'],
  category: string,
  message: string,
  options?: {
    details?: Record<string, unknown>
    traceId?: string
    sessionId?: string
    stepId?: string
  }
): DebugViewEntry {
  return {
    entryId: generateDebugEntryId(),
    timestamp: Date.now(),
    level,
    category,
    message,
    details: options?.details,
    traceId: options?.traceId,
    sessionId: options?.sessionId,
    stepId: options?.stepId
  }
}

/**
 * Create debug view store
 */
export function createDebugViewStore(): DebugViewStore {
  return {
    entries: new Map(),
    sessionIndex: new Map(),
    traceIndex: new Map()
  }
}

/**
 * Add entry to debug view store
 */
export function addDebugEntry(
  store: DebugViewStore,
  entry: DebugViewEntry
): DebugViewStore {
  const newStore = {
    entries: new Map(store.entries),
    sessionIndex: new Map(store.sessionIndex),
    traceIndex: new Map(store.traceIndex)
  }

  newStore.entries.set(entry.entryId, entry)

  if (entry.sessionId) {
    const sessionEntries = newStore.sessionIndex.get(entry.sessionId) ?? new Set()
    newStore.sessionIndex.set(entry.sessionId, new Set([...sessionEntries, entry.entryId]))
  }

  if (entry.traceId) {
    const traceEntries = newStore.traceIndex.get(entry.traceId) ?? new Set()
    newStore.traceIndex.set(entry.traceId, new Set([...traceEntries, entry.entryId]))
  }

  return newStore
}

/**
 * Get debug entry by ID
 */
export function getDebugEntry(
  store: DebugViewStore,
  entryId: string
): DebugViewEntry | undefined {
  return store.entries.get(entryId)
}

/**
 * Query debug entries
 */
export function queryDebugEntries(
  store: DebugViewStore,
  filter: DebugViewFilter
): DebugViewEntry[] {
  let entries: DebugViewEntry[]

  // Filter by session
  if (filter.sessionId) {
    const entryIds = store.sessionIndex.get(filter.sessionId)
    entries = entryIds
      ? Array.from(entryIds).map(id => store.entries.get(id)).filter((e): e is DebugViewEntry => e !== undefined)
      : []
  } else if (filter.traceId) {
    const entryIds = store.traceIndex.get(filter.traceId)
    entries = entryIds
      ? Array.from(entryIds).map(id => store.entries.get(id)).filter((e): e is DebugViewEntry => e !== undefined)
      : []
  } else {
    entries = Array.from(store.entries.values())
  }

  // Filter by level
  if (filter.level) {
    const levels = Array.isArray(filter.level) ? filter.level : [filter.level]
    entries = entries.filter(e => levels.includes(e.level))
  }

  // Filter by category
  if (filter.category) {
    const categories = Array.isArray(filter.category) ? filter.category : [filter.category]
    entries = entries.filter(e => categories.includes(e.category))
  }

  // Filter by message
  if (filter.messageContains) {
    const search = filter.messageContains.toLowerCase()
    entries = entries.filter(e => e.message.toLowerCase().includes(search))
  }

  // Filter by time range
  if (filter.startTime !== undefined) {
    entries = entries.filter(e => e.timestamp >= filter.startTime!)
  }
  if (filter.endTime !== undefined) {
    entries = entries.filter(e => e.timestamp <= filter.endTime!)
  }

  // Sort by timestamp (newest first)
  entries.sort((a, b) => b.timestamp - a.timestamp)

  // Apply pagination
  const offset = filter.offset ?? 0
  const limit = filter.limit ?? entries.length

  return entries.slice(offset, offset + limit)
}

/**
 * Get entries by session ID
 */
export function getSessionDebugEntries(
  store: DebugViewStore,
  sessionId: string
): DebugViewEntry[] {
  const entryIds = store.sessionIndex.get(sessionId)
  if (!entryIds) return []

  return Array.from(entryIds)
    .map(id => store.entries.get(id))
    .filter((e): e is DebugViewEntry => e !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get entries by trace ID
 */
export function getTraceDebugEntries(
  store: DebugViewStore,
  traceId: string
): DebugViewEntry[] {
  const entryIds = store.traceIndex.get(traceId)
  if (!entryIds) return []

  return Array.from(entryIds)
    .map(id => store.entries.get(id))
    .filter((e): e is DebugViewEntry => e !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get entries by level
 */
export function getEntriesByLevel(
  store: DebugViewStore,
  level: DebugViewEntry['level']
): DebugViewEntry[] {
  return Array.from(store.entries.values())
    .filter(e => e.level === level)
    .sort((a, b) => b.timestamp - a.timestamp)
}

// ============================================================================
// Metrics Store Functions
// ============================================================================

/**
 * Create metrics store
 */
export function createMetricsStore(): MetricsStore {
  return {
    metrics: new Map(),
    sessionIndex: new Map(),
    categoryIndex: new Map()
  }
}

/**
 * Add metric to store
 */
export function addMetric(
  store: MetricsStore,
  sessionId: string,
  metric: RuntimeMetric
): MetricsStore {
  const newStore = {
    metrics: new Map(store.metrics),
    sessionIndex: new Map(store.sessionIndex),
    categoryIndex: new Map(store.categoryIndex)
  }

  newStore.metrics.set(metric.metricId, metric)

  // Update session index
  const sessionMetrics = newStore.sessionIndex.get(sessionId) ?? new Set()
  newStore.sessionIndex.set(sessionId, new Set([...sessionMetrics, metric.metricId]))

  // Update category index
  const categoryMetrics = newStore.categoryIndex.get(metric.category) ?? new Set()
  newStore.categoryIndex.set(metric.category, new Set([...categoryMetrics, metric.metricId]))

  return newStore
}

/**
 * Get metric by ID
 */
export function getMetric(
  store: MetricsStore,
  metricId: string
): RuntimeMetric | undefined {
  return store.metrics.get(metricId)
}

/**
 * Get metrics by session
 */
export function getSessionMetrics(
  store: MetricsStore,
  sessionId: string
): RuntimeMetric[] {
  const metricIds = store.sessionIndex.get(sessionId)
  if (!metricIds) return []

  return Array.from(metricIds)
    .map(id => store.metrics.get(id))
    .filter((m): m is RuntimeMetric => m !== undefined)
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(
  store: MetricsStore,
  category: MetricCategory
): RuntimeMetric[] {
  const metricIds = store.categoryIndex.get(category)
  if (!metricIds) return []

  return Array.from(metricIds)
    .map(id => store.metrics.get(id))
    .filter((m): m is RuntimeMetric => m !== undefined)
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize a runtime metric
 */
export function serializeRuntimeMetric(metric: RuntimeMetric): string {
  return JSON.stringify(metric)
}

/**
 * Deserialize a runtime metric
 */
export function deserializeRuntimeMetric(data: string): RuntimeMetric {
  return JSON.parse(data) as RuntimeMetric
}

/**
 * Serialize metrics store
 */
export function serializeMetricsStore(store: MetricsStore): string {
  const serializable: SerializableMetricsStore = {
    metrics: Array.from(store.metrics.values())
  }
  return JSON.stringify(serializable)
}

/**
 * Deserialize metrics store
 */
export function deserializeMetricsStore(data: string): MetricsStore {
  const serializable = JSON.parse(data) as SerializableMetricsStore
  const store = createMetricsStore()

  for (const metric of serializable.metrics) {
    store.metrics.set(metric.metricId, metric)

    // Rebuild category index
    const categoryMetrics = store.categoryIndex.get(metric.category) ?? new Set()
    categoryMetrics.add(metric.metricId)
    store.categoryIndex.set(metric.category, categoryMetrics)
  }

  return store
}

/**
 * Serialize debug view entry
 */
export function serializeDebugEntry(entry: DebugViewEntry): string {
  return JSON.stringify(entry)
}

/**
 * Deserialize debug view entry
 */
export function deserializeDebugEntry(data: string): DebugViewEntry {
  return JSON.parse(data) as DebugViewEntry
}

/**
 * Serialize debug view store
 */
export function serializeDebugViewStore(store: DebugViewStore): string {
  const serializable: SerializableDebugViewStore = {
    entries: Array.from(store.entries.values())
  }
  return JSON.stringify(serializable)
}

/**
 * Deserialize debug view store
 */
export function deserializeDebugViewStore(data: string): DebugViewStore {
  const serializable = JSON.parse(data) as SerializableDebugViewStore
  const store = createDebugViewStore()

  for (const entry of serializable.entries) {
    store.entries.set(entry.entryId, entry)

    if (entry.sessionId) {
      const sessionEntries = store.sessionIndex.get(entry.sessionId) ?? new Set()
      sessionEntries.add(entry.entryId)
      store.sessionIndex.set(entry.sessionId, sessionEntries)
    }

    if (entry.traceId) {
      const traceEntries = store.traceIndex.get(entry.traceId) ?? new Set()
      traceEntries.add(entry.entryId)
      store.traceIndex.set(entry.traceId, traceEntries)
    }
  }

  return store
}

// ============================================================================
// Debug Formatting
// ============================================================================

/**
 * Format a metric for debugging
 */
export function formatRuntimeMetric(metric: RuntimeMetric): string {
  const lines: string[] = [
    `Metric: ${metric.name} (${metric.metricId})`,
    `  Category: ${metric.category}`,
    `  Unit: ${metric.unit}`,
    `  Severity: ${metric.severity}`,
    `  Points: ${metric.points.length}`
  ]

  if (metric.description) {
    lines.push(`  Description: ${metric.description}`)
  }

  if (metric.aggregation) {
    lines.push('  Aggregation:')
    lines.push(`    Count: ${metric.aggregation.count}`)
    lines.push(`    Min: ${metric.aggregation.min}`)
    lines.push(`    Max: ${metric.aggregation.max}`)
    lines.push(`    Avg: ${metric.aggregation.avg.toFixed(2)}`)
    lines.push(`    P50: ${metric.aggregation.p50.toFixed(2)}`)
    lines.push(`    P95: ${metric.aggregation.p95.toFixed(2)}`)
    lines.push(`    P99: ${metric.aggregation.p99.toFixed(2)}`)
  }

  return lines.join('\n')
}

/**
 * Format a debug entry for debugging
 */
export function formatDebugEntry(entry: DebugViewEntry): string {
  const lines: string[] = [
    `[${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}`,
    `  Time: ${new Date(entry.timestamp).toISOString()}`,
    `  ID: ${entry.entryId}`
  ]

  if (entry.sessionId) {
    lines.push(`  Session: ${entry.sessionId}`)
  }
  if (entry.traceId) {
    lines.push(`  Trace: ${entry.traceId}`)
  }
  if (entry.stepId) {
    lines.push(`  Step: ${entry.stepId}`)
  }

  if (entry.details) {
    lines.push('  Details:')
    for (const [key, value] of Object.entries(entry.details)) {
      lines.push(`    ${key}: ${JSON.stringify(value)}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format metrics summary for debugging
 */
export function formatMetricsSummary(summary: RuntimeMetricsSummary): string {
  const lines: string[] = [
    'Runtime Metrics Summary:',
    `  Session: ${summary.sessionId}`,
    `  Collected: ${new Date(summary.collectedAt).toISOString()}`,
    '',
    '  Latency:',
    `    Total Operations: ${summary.latency.totalOperations}`,
    `    Average: ${summary.latency.averageLatencyMs.toFixed(2)}ms`,
    `    Min: ${summary.latency.minLatencyMs}ms`,
    `    Max: ${summary.latency.maxLatencyMs}ms`,
    `    Timeouts: ${summary.latency.timeoutCount}`,
    '',
    '  Success:',
    `    Total: ${summary.success.totalOperations}`,
    `    Success: ${summary.success.successCount}`,
    `    Failure: ${summary.success.failureCount}`,
    `    Rate: ${(summary.success.successRate * 100).toFixed(2)}%`,
    '',
    '  Retry:',
    `    Total: ${summary.retry.totalRetries}`,
    `    Successful: ${summary.retry.successfulRetries}`,
    `    Rate: ${(summary.retry.retrySuccessRate * 100).toFixed(2)}%`,
    '',
    '  Confirmation:',
    `    Total: ${summary.confirmation.totalConfirmations}`,
    `    Approved: ${summary.confirmation.approvedConfirmations}`,
    `    Rate: ${(summary.confirmation.approvalRate * 100).toFixed(2)}%`
  ]

  return lines.join('\n')
}
