/**
 * Trace and Step Log Module (Story 48.1)
 * 
 * This module provides trace ID generation and step logging for runtime execution.
 * It creates trace identifiers for runtime tasks, links them to sessions and steps,
 * persists step status and timestamps, and exposes trace lookup for debugging.
 */

// ==================== Type Definitions ====================

/**
 * Trace ID format: trace_{timestamp}_{random}
 */
export interface TraceId {
  id: string
  createdAt: number
  source: 'runtime' | 'tool' | 'planner' | 'user'
}

/**
 * Step status values for trace logging
 */
export type TraceStepStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled'

/**
 * Step log entry
 */
export interface StepLogEntry {
  stepId: string
  traceId: string
  sessionId: string
  parentStepId?: string
  stepType: 'tool' | 'planning' | 'execution' | 'confirmation' | 'other'
  status: TraceStepStatus
  name: string
  input?: unknown
  output?: unknown
  error?: string
  startedAt: number
  completedAt?: number
  duration?: number
  metadata?: Record<string, unknown>
}

/**
 * Trace context for linking runtime execution
 */
export interface TraceContext {
  traceId: string
  sessionId: string
  parentTraceId?: string
  rootTraceId: string
  depth: number
  path: string[]
  createdAt: number
  updatedAt: number
}

/**
 * Trace summary for debugging
 */
export interface TraceSummary {
  traceId: string
  sessionId: string
  rootTraceId: string
  totalSteps: number
  completedSteps: number
  failedSteps: number
  pendingSteps: number
  startTime: number
  endTime?: number
  totalDuration?: number
  status: 'running' | 'completed' | 'failed' | 'partial'
}

/**
 * Trace store for persistence
 */
export interface TraceStore {
  traces: Map<string, TraceContext>
  steps: Map<string, StepLogEntry[]>
  traceIndex: Map<string, string[]> // sessionId -> traceIds
  stepIndex: Map<string, string> // stepId -> traceId
}

// ==================== Constants ====================

const TRACE_ID_PREFIX = 'trace'
const STEP_ID_PREFIX = 'step'

// ==================== ID Generation ====================

/**
 * Generate a unique trace ID
 */
export function generateTraceId(source: TraceId['source'] = 'runtime'): TraceId {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return {
    id: `${TRACE_ID_PREFIX}_${timestamp}_${random}`,
    createdAt: timestamp,
    source,
  }
}

/**
 * Generate a unique step ID
 */
export function generateStepId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${STEP_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Validate a trace ID format
 */
export function isValidTraceId(id: string): boolean {
  const pattern = /^trace_\d+_[a-f0-9]{16}$/
  return pattern.test(id)
}

/**
 * Validate a step ID format
 */
export function isValidStepId(id: string): boolean {
  const pattern = /^step_\d+_[a-f0-9]{12}$/
  return pattern.test(id)
}

// ==================== Trace Context Functions ====================

/**
 * Create a new trace context
 */
export function createTraceContext(
  sessionId: string,
  options: {
    parentTraceId?: string
    source?: TraceId['source']
  } = {}
): TraceContext {
  const traceId = generateTraceId(options.source)
  const now = Date.now()
  
  let rootTraceId: string
  let depth: number
  let path: string[]
  
  if (options.parentTraceId) {
    // This is a child trace - would need parent context to calculate depth/path
    // For now, treat as root with parent reference
    rootTraceId = options.parentTraceId
    depth = 1
    path = [options.parentTraceId, traceId.id]
  } else {
    rootTraceId = traceId.id
    depth = 0
    path = [traceId.id]
  }
  
  return {
    traceId: traceId.id,
    sessionId,
    parentTraceId: options.parentTraceId,
    rootTraceId,
    depth,
    path,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Update trace context timestamp
 */
export function touchTraceContext(context: TraceContext): TraceContext {
  return {
    ...context,
    updatedAt: Date.now(),
  }
}

// ==================== Step Log Functions ====================

/**
 * Create a step log entry
 */
export function createStepLogEntry(
  traceId: string,
  sessionId: string,
  stepType: StepLogEntry['stepType'],
  name: string,
  options: {
    parentStepId?: string
    input?: unknown
    metadata?: Record<string, unknown>
  } = {}
): StepLogEntry {
  return {
    stepId: generateStepId(),
    traceId,
    sessionId,
    parentStepId: options.parentStepId,
    stepType,
    status: 'pending',
    name,
    input: options.input,
    startedAt: Date.now(),
    metadata: options.metadata,
  }
}

/**
 * Mark a step as running
 */
export function startStep(entry: StepLogEntry): StepLogEntry {
  return {
    ...entry,
    status: 'running',
    startedAt: Date.now(),
  }
}

/**
 * Mark a step as completed
 */
export function completeStep(
  entry: StepLogEntry,
  output?: unknown
): StepLogEntry {
  const now = Date.now()
  return {
    ...entry,
    status: 'completed',
    output,
    completedAt: now,
    duration: now - entry.startedAt,
  }
}

/**
 * Mark a step as failed
 */
export function failStep(
  entry: StepLogEntry,
  error: string
): StepLogEntry {
  const now = Date.now()
  return {
    ...entry,
    status: 'failed',
    error,
    completedAt: now,
    duration: now - entry.startedAt,
  }
}

/**
 * Mark a step as skipped
 */
export function skipStep(
  entry: StepLogEntry,
  reason?: string
): StepLogEntry {
  const now = Date.now()
  return {
    ...entry,
    status: 'skipped',
    error: reason,
    completedAt: now,
    duration: now - entry.startedAt,
  }
}

/**
 * Mark a step as cancelled
 */
export function cancelStep(
  entry: StepLogEntry,
  reason?: string
): StepLogEntry {
  const now = Date.now()
  return {
    ...entry,
    status: 'cancelled',
    error: reason,
    completedAt: now,
    duration: now - entry.startedAt,
  }
}

// ==================== Trace Store Functions ====================

/**
 * Create an empty trace store
 */
export function createTraceStore(): TraceStore {
  return {
    traces: new Map(),
    steps: new Map(),
    traceIndex: new Map(),
    stepIndex: new Map(),
  }
}

/**
 * Register a trace context in the store
 */
export function registerTrace(
  store: TraceStore,
  context: TraceContext
): TraceStore {
  const newStore = { ...store }
  
  // Add trace context
  newStore.traces = new Map(store.traces)
  newStore.traces.set(context.traceId, context)
  
  // Add to session index
  newStore.traceIndex = new Map(store.traceIndex)
  const sessionTraces = newStore.traceIndex.get(context.sessionId) || []
  newStore.traceIndex.set(context.sessionId, [...sessionTraces, context.traceId])
  
  // Initialize step list for this trace
  newStore.steps = new Map(store.steps)
  if (!newStore.steps.has(context.traceId)) {
    newStore.steps.set(context.traceId, [])
  }
  
  return newStore
}

/**
 * Add a step log entry to the store
 */
export function addStepLog(
  store: TraceStore,
  entry: StepLogEntry
): TraceStore {
  const newStore = { ...store }
  
  // Add step to trace's step list
  newStore.steps = new Map(store.steps)
  const traceSteps = newStore.steps.get(entry.traceId) || []
  newStore.steps.set(entry.traceId, [...traceSteps, entry])
  
  // Add to step index
  newStore.stepIndex = new Map(store.stepIndex)
  newStore.stepIndex.set(entry.stepId, entry.traceId)
  
  return newStore
}

/**
 * Update a step log entry in the store
 */
export function updateStepLog(
  store: TraceStore,
  stepId: string,
  update: (entry: StepLogEntry) => StepLogEntry
): TraceStore | null {
  const traceId = store.stepIndex.get(stepId)
  if (!traceId) return null
  
  const steps = store.steps.get(traceId)
  if (!steps) return null
  
  const stepIndex = steps.findIndex(s => s.stepId === stepId)
  if (stepIndex === -1) return null
  
  const newSteps = [...steps]
  newSteps[stepIndex] = update(steps[stepIndex])
  
  return {
    ...store,
    steps: new Map(store.steps).set(traceId, newSteps),
  }
}

// ==================== Lookup Functions ====================

/**
 * Get a trace context by ID
 */
export function getTraceContext(
  store: TraceStore,
  traceId: string
): TraceContext | undefined {
  return store.traces.get(traceId)
}

/**
 * Get all traces for a session
 */
export function getSessionTraces(
  store: TraceStore,
  sessionId: string
): TraceContext[] {
  const traceIds = store.traceIndex.get(sessionId) || []
  return traceIds
    .map(id => store.traces.get(id))
    .filter((t): t is TraceContext => t !== undefined)
}

/**
 * Get all steps for a trace
 */
export function getTraceSteps(
  store: TraceStore,
  traceId: string
): StepLogEntry[] {
  return store.steps.get(traceId) || []
}

/**
 * Get a single step by ID
 */
export function getStepById(
  store: TraceStore,
  stepId: string
): StepLogEntry | undefined {
  const traceId = store.stepIndex.get(stepId)
  if (!traceId) return undefined
  
  const steps = store.steps.get(traceId)
  if (!steps) return undefined
  
  return steps.find(s => s.stepId === stepId)
}

/**
 * Get steps by status
 */
export function getStepsByStatus(
  store: TraceStore,
  traceId: string,
  status: TraceStepStatus
): StepLogEntry[] {
  const steps = store.steps.get(traceId) || []
  return steps.filter(s => s.status === status)
}

/**
 * Get steps by type
 */
export function getStepsByType(
  store: TraceStore,
  traceId: string,
  stepType: StepLogEntry['stepType']
): StepLogEntry[] {
  const steps = store.steps.get(traceId) || []
  return steps.filter(s => s.stepType === stepType)
}

// ==================== Summary Functions ====================

/**
 * Generate a trace summary
 */
export function generateTraceSummary(
  store: TraceStore,
  traceId: string
): TraceSummary | null {
  const context = store.traces.get(traceId)
  if (!context) return null
  
  const steps = store.steps.get(traceId) || []
  
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const failedSteps = steps.filter(s => s.status === 'failed').length
  const pendingSteps = steps.filter(s => s.status === 'pending' || s.status === 'running').length
  
  const startTime = context.createdAt
  const endTime = steps.length > 0
    ? Math.max(...steps.map(s => s.completedAt || s.startedAt))
    : undefined
  
  const totalDuration = endTime ? endTime - startTime : undefined
  
  let status: TraceSummary['status']
  if (failedSteps > 0 && completedSteps > 0) {
    status = 'partial'
  } else if (failedSteps > 0) {
    status = 'failed'
  } else if (pendingSteps > 0) {
    status = 'running'
  } else {
    status = 'completed'
  }
  
  return {
    traceId: context.traceId,
    sessionId: context.sessionId,
    rootTraceId: context.rootTraceId,
    totalSteps: steps.length,
    completedSteps,
    failedSteps,
    pendingSteps,
    startTime,
    endTime,
    totalDuration,
    status,
  }
}

/**
 * Get trace chain (from root to current)
 */
export function getTraceChain(
  store: TraceStore,
  traceId: string
): TraceContext[] {
  const context = store.traces.get(traceId)
  if (!context) return []
  
  // Follow path from root to current
  return context.path
    .map(id => store.traces.get(id))
    .filter((t): t is TraceContext => t !== undefined)
}

// ==================== Serialization ====================

/**
 * Serializable trace context
 */
export interface SerializableTraceContext {
  traceId: string
  sessionId: string
  parentTraceId?: string
  rootTraceId: string
  depth: number
  path: string[]
  createdAt: number
  updatedAt: number
}

/**
 * Serializable step log entry
 */
export interface SerializableStepLogEntry {
  stepId: string
  traceId: string
  sessionId: string
  parentStepId?: string
  stepType: StepLogEntry['stepType']
  status: TraceStepStatus
  name: string
  input?: unknown
  output?: unknown
  error?: string
  startedAt: number
  completedAt?: number
  duration?: number
  metadata?: Record<string, unknown>
}

/**
 * Serializable trace store
 */
export interface SerializableTraceStore {
  traces: SerializableTraceContext[]
  steps: SerializableStepLogEntry[]
  traceIndex: [string, string[]][]
  stepIndex: [string, string][]
}

/**
 * Serialize a trace context
 */
export function serializeTraceContext(context: TraceContext): SerializableTraceContext {
  return { ...context }
}

/**
 * Serialize a step log entry
 */
export function serializeStepLogEntry(entry: StepLogEntry): SerializableStepLogEntry {
  return { ...entry }
}

/**
 * Serialize a trace store
 */
export function serializeTraceStore(store: TraceStore): SerializableTraceStore {
  return {
    traces: Array.from(store.traces.values()).map(serializeTraceContext),
    steps: Array.from(store.steps.values()).flat().map(serializeStepLogEntry),
    traceIndex: Array.from(store.traceIndex.entries()),
    stepIndex: Array.from(store.stepIndex.entries()),
  }
}

/**
 * Deserialize a trace context
 */
export function deserializeTraceContext(data: SerializableTraceContext): TraceContext {
  return { ...data }
}

/**
 * Deserialize a step log entry
 */
export function deserializeStepLogEntry(data: SerializableStepLogEntry): StepLogEntry {
  return { ...data }
}

/**
 * Deserialize a trace store
 */
export function deserializeTraceStore(data: SerializableTraceStore): TraceStore {
  const traces = new Map<string, TraceContext>()
  data.traces.forEach(t => traces.set(t.traceId, deserializeTraceContext(t)))
  
  const steps = new Map<string, StepLogEntry[]>()
  data.steps.forEach(s => {
    const existing = steps.get(s.traceId) || []
    steps.set(s.traceId, [...existing, deserializeStepLogEntry(s)])
  })
  
  return {
    traces,
    steps,
    traceIndex: new Map(data.traceIndex),
    stepIndex: new Map(data.stepIndex),
  }
}

// ==================== Debug Helpers ====================

/**
 * Format a trace context for debugging
 */
export function formatTraceContext(context: TraceContext): string {
  return `TraceContext(
  id: ${context.traceId},
  session: ${context.sessionId},
  root: ${context.rootTraceId},
  depth: ${context.depth},
  path: ${context.path.join(' -> ')}
)`
}

/**
 * Format a step log entry for debugging
 */
export function formatStepLogEntry(entry: StepLogEntry): string {
  const duration = entry.duration ? ` (${entry.duration}ms)` : ''
  return `StepLogEntry(
  id: ${entry.stepId},
  trace: ${entry.traceId},
  type: ${entry.stepType},
  status: ${entry.status}${duration},
  name: ${entry.name}
)`
}

/**
 * Format a trace summary for debugging
 */
export function formatTraceSummary(summary: TraceSummary): string {
  const duration = summary.totalDuration 
    ? ` (total: ${summary.totalDuration}ms)`
    : ''
  return `TraceSummary(
  id: ${summary.traceId},
  session: ${summary.sessionId},
  status: ${summary.status}${duration},
  steps: ${summary.completedSteps}/${summary.totalSteps} completed,
  failed: ${summary.failedSteps},
  pending: ${summary.pendingSteps}
)`
}
