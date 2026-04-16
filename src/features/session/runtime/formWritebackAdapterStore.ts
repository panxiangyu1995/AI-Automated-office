/**
 * Form Writeback Adapter - Store, Serialization & Debug
 * Task 87: Story 49.4 - Form Writeback Adapter
 */

import type {
  WritebackContract,
  WritebackAction,
  WritebackTraceEntry,
  WritebackAdapterStore,
  WritebackStatus,
  FieldReference,
  WritebackPermission,
  FieldValidationRule,
  FieldUpdate,
  ResultToFieldMapping,
  WritebackResult,
} from './formWritebackAdapterTypes'
import { createWritebackAdapterStore } from './formWritebackAdapterFactories'

// Store Operations
// ============================================================================

/**
 * Register a writeback contract
 */
export function registerContract(
  store: WritebackAdapterStore,
  contract: WritebackContract
): WritebackAdapterStore {
  const newStore = createWritebackAdapterStore()
  
  // Copy existing contracts
  for (const [key, value] of store.contracts) {
    newStore.contracts.set(key, value)
  }
  
  // Add new contract
  newStore.contracts.set(contract.formId, contract)
  
  // Copy other maps
  for (const [key, value] of store.actions) {
    newStore.actions.set(key, value)
  }
  for (const [key, value] of store.mappings) {
    newStore.mappings.set(key, value)
  }
  for (const [key, value] of store.traces) {
    newStore.traces.set(key, value)
  }
  
  return newStore
}

/**
 * Add a writeback action
 */
export function addAction(
  store: WritebackAdapterStore,
  action: WritebackAction
): WritebackAdapterStore {
  const newStore = createWritebackAdapterStore()
  
  // Copy existing data
  for (const [key, value] of store.contracts) {
    newStore.contracts.set(key, value)
  }
  for (const [key, value] of store.actions) {
    newStore.actions.set(key, value)
  }
  for (const [key, value] of store.mappings) {
    newStore.mappings.set(key, value)
  }
  for (const [key, value] of store.traces) {
    newStore.traces.set(key, [...value])
  }
  
  // Add new action
  newStore.actions.set(action.actionId, action)
  newStore.traces.set(action.actionId, [])
  
  return newStore
}

/**
 * Add trace entries
 */
export function addTraceEntries(
  store: WritebackAdapterStore,
  actionId: string,
  entries: WritebackTraceEntry[]
): WritebackAdapterStore {
  const newStore = createWritebackAdapterStore()
  
  // Copy existing data
  for (const [key, value] of store.contracts) {
    newStore.contracts.set(key, value)
  }
  for (const [key, value] of store.actions) {
    newStore.actions.set(key, value)
  }
  for (const [key, value] of store.mappings) {
    newStore.mappings.set(key, value)
  }
  for (const [key, value] of store.traces) {
    newStore.traces.set(key, [...value])
  }
  
  // Add trace entries
  const existing = newStore.traces.get(actionId) ?? []
  newStore.traces.set(actionId, [...existing, ...entries])
  
  return newStore
}

/**
 * Get contract by form ID
 */
export function getContract(
  store: WritebackAdapterStore,
  formId: string
): WritebackContract | undefined {
  return store.contracts.get(formId)
}

/**
 * Get action by ID
 */
export function getAction(
  store: WritebackAdapterStore,
  actionId: string
): WritebackAction | undefined {
  return store.actions.get(actionId)
}

/**
 * Get trace entries for an action
 */
export function getTraceEntries(
  store: WritebackAdapterStore,
  actionId: string
): WritebackTraceEntry[] {
  return store.traces.get(actionId) ?? []
}

/**
 * Get actions by form ID
 */
export function getActionsByForm(
  store: WritebackAdapterStore,
  formId: string
): WritebackAction[] {
  return Array.from(store.actions.values()).filter(a => a.formId === formId)
}

/**
 * Get actions by session ID
 */
export function getActionsBySession(
  store: WritebackAdapterStore,
  sessionId: string
): WritebackAction[] {
  return Array.from(store.actions.values()).filter(a => a.sessionId === sessionId)
}

/**
 * Get actions by status
 */
export function getActionsByStatus(
  store: WritebackAdapterStore,
  status: WritebackStatus
): WritebackAction[] {
  return Array.from(store.actions.values()).filter(a => a.status === status)
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serializable writeback contract
 */
export interface SerializableWritebackContract {
  formId: string
  allowedFields: FieldReference[]
  fieldPermissions: [string, WritebackPermission][]
  validationRules: [string, FieldValidationRule[]][]
  requiresApproval: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Serializable writeback action
 */
export interface SerializableWritebackAction {
  actionId: string
  sessionId: string
  traceId: string
  formId: string
  updates: FieldUpdate[]
  status: WritebackStatus
  source: string
  createdAt: number
  updatedAt: number
  completedAt?: number
  metadata?: Record<string, unknown>
}

/**
 * Serializable writeback adapter store
 */
export interface SerializableWritebackAdapterStore {
  contracts: SerializableWritebackContract[]
  actions: SerializableWritebackAction[]
  mappings: ResultToFieldMapping[]
}

/**
 * Serialize a writeback contract
 */
export function serializeContract(contract: WritebackContract): SerializableWritebackContract {
  return {
    formId: contract.formId,
    allowedFields: contract.allowedFields,
    fieldPermissions: Array.from(contract.fieldPermissions.entries()),
    validationRules: Array.from(contract.validationRules.entries()),
    requiresApproval: contract.requiresApproval,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt
  }
}

/**
 * Deserialize a writeback contract
 */
export function deserializeContract(data: SerializableWritebackContract): WritebackContract {
  return {
    formId: data.formId,
    allowedFields: data.allowedFields,
    fieldPermissions: new Map(data.fieldPermissions),
    validationRules: new Map(data.validationRules),
    requiresApproval: data.requiresApproval,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  }
}

/**
 * Serialize a writeback action
 */
export function serializeAction(action: WritebackAction): SerializableWritebackAction {
  return {
    actionId: action.actionId,
    sessionId: action.sessionId,
    traceId: action.traceId,
    formId: action.formId,
    updates: action.updates,
    status: action.status,
    source: action.source,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
    completedAt: action.completedAt,
    metadata: action.metadata
  }
}

/**
 * Deserialize a writeback action
 */
export function deserializeAction(data: SerializableWritebackAction): WritebackAction {
  return {
    actionId: data.actionId,
    sessionId: data.sessionId,
    traceId: data.traceId,
    formId: data.formId,
    updates: data.updates,
    status: data.status,
    source: data.source,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt,
    metadata: data.metadata
  }
}

/**
 * Serialize a writeback adapter store
 */
export function serializeWritebackStore(store: WritebackAdapterStore): SerializableWritebackAdapterStore {
  return {
    contracts: Array.from(store.contracts.values()).map(serializeContract),
    actions: Array.from(store.actions.values()).map(serializeAction),
    mappings: Array.from(store.mappings.values())
  }
}

/**
 * Deserialize a writeback adapter store
 */
export function deserializeWritebackStore(data: SerializableWritebackAdapterStore): WritebackAdapterStore {
  const store = createWritebackAdapterStore()
  
  for (const contract of data.contracts) {
    store.contracts.set(contract.formId, deserializeContract(contract))
  }
  
  for (const action of data.actions) {
    store.actions.set(action.actionId, deserializeAction(action))
  }
  
  for (const mapping of data.mappings) {
    store.mappings.set(mapping.mappingId, mapping)
  }
  
  return store
}

// ============================================================================
// Debug Formatting
// ============================================================================

/**
 * Format a field reference for debugging
 */
export function formatFieldReference(field: FieldReference): string {
  const path = field.fieldPath ? ` (${field.fieldPath})` : ''
  return `[${field.formId}:${field.fieldId}${path}] (${field.dataType})`
}

/**
 * Format a field update for debugging
 */
export function formatFieldUpdate(update: FieldUpdate): string {
  return `Update ${update.updateId}:
  Field: ${formatFieldReference(update.field)}
  Status: ${update.status}
  Original: ${JSON.stringify(update.originalValue)}
  New: ${JSON.stringify(update.newValue)}
  Errors: ${update.validationErrors?.join(', ') ?? 'none'}`
}

/**
 * Format a writeback action for debugging
 */
export function formatWritebackAction(action: WritebackAction): string {
  const status = action.completedAt
    ? `${action.status} (completed at ${new Date(action.completedAt).toISOString()})`
    : action.status
    
  return `WritebackAction ${action.actionId}:
  Form: ${action.formId}
  Session: ${action.sessionId}
  Trace: ${action.traceId}
  Status: ${status}
  Source: ${action.source}
  Updates: ${action.updates.length}
  Created: ${new Date(action.createdAt).toISOString()}`
}

/**
 * Format a writeback result for debugging
 */
export function formatWritebackResult(result: WritebackResult): string {
  return `WritebackResult:
  Success: ${result.success}
  Action: ${result.actionId}
  Applied: ${result.appliedUpdates.length}
  Rejected: ${result.rejectedUpdates.length}
  Failed: ${result.failedUpdates.length}
  Trace: ${result.trace.length} entries
  Error: ${result.error ?? 'none'}`
}

/**
 * Format a trace entry for debugging
 */
export function formatTraceEntry(entry: WritebackTraceEntry): string {
  const field = entry.field ? ` [${entry.field.fieldId}]` : ''
  return `[${new Date(entry.timestamp).toISOString()}] ${entry.type}${field}: ${entry.message}`
}
