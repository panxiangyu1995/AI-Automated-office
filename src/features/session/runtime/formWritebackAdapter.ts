/**
 * Form Writeback Adapter (Story 49.1)
 * Task 84: Write normalized Agent results into approved dynamic form targets.
 *
 * This module provides functionality for:
 * - Defining writeback contracts for form fields
 * - Mapping normalized runtime results into field updates
 * - Checking form field permissions before writeback
 * - Recording writeback actions in the runtime trace
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Field data type for writeback
 */
export type FieldDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'array'
  | 'object'
  | 'file'
  | 'currency'

/**
 * Writeback permission level
 */
export type WritebackPermission =
  | 'read-only'
  | 'edit'
  | 'admin'

/**
 * Field update status
 */
export type FieldUpdateStatus =
  | 'pending'
  | 'validated'
  | 'applied'
  | 'rejected'
  | 'failed'

/**
 * Writeback action status
 */
export type WritebackStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled'

/**
 * Field reference for identifying form fields
 */
export interface FieldReference {
  /** Form ID */
  formId: string
  /** Field ID */
  fieldId: string
  /** Field name/path */
  fieldPath?: string
  /** Field data type */
  dataType: FieldDataType
}

/**
 * Permission check result for a field
 */
export interface FieldPermissionResult {
  /** Field reference */
  field: FieldReference
  /** Whether write is allowed */
  allowed: boolean
  /** Permission level */
  permissionLevel: WritebackPermission
  /** Reason if not allowed */
  reason?: string
  /** Checked at timestamp */
  checkedAt: number
}

/**
 * Field update to be applied
 */
export interface FieldUpdate {
  /** Unique update ID */
  updateId: string
  /** Field reference */
  field: FieldReference
  /** Original value before update */
  originalValue: unknown
  /** New value to set */
  newValue: unknown
  /** Update status */
  status: FieldUpdateStatus
  /** Validation errors if any */
  validationErrors?: string[]
  /** Created at timestamp */
  createdAt: number
  /** Updated at timestamp */
  updatedAt: number
}

/**
 * Writeback action for a form
 */
export interface WritebackAction {
  /** Unique action ID */
  actionId: string
  /** Session ID */
  sessionId: string
  /** Trace ID */
  traceId: string
  /** Form ID */
  formId: string
  /** List of field updates */
  updates: FieldUpdate[]
  /** Overall status */
  status: WritebackStatus
  /** Source of the writeback (tool, agent, user) */
  source: string
  /** Created at timestamp */
  createdAt: number
  /** Updated at timestamp */
  updatedAt: number
  /** Completed at timestamp */
  completedAt?: number
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Writeback contract defining rules for a form
 */
export interface WritebackContract {
  /** Form ID */
  formId: string
  /** Allowed fields for writeback */
  allowedFields: FieldReference[]
  /** Permission requirements per field */
  fieldPermissions: Map<string, WritebackPermission>
  /** Validation rules per field */
  validationRules: Map<string, FieldValidationRule[]>
  /** Whether writeback requires approval */
  requiresApproval: boolean
  /** Created at timestamp */
  createdAt: number
  /** Updated at timestamp */
  updatedAt: number
}

/**
 * Field validation rule
 */
export interface FieldValidationRule {
  /** Rule type */
  type: 'required' | 'format' | 'range' | 'custom' | 'type-check'
  /** Rule parameters */
  params?: Record<string, unknown>
  /** Error message */
  errorMessage: string
}

/**
 * Normalized result from tool execution
 */
export interface NormalizedResult {
  /** Result ID */
  resultId: string
  /** Output type */
  outputType: 'value' | 'list' | 'object' | 'file' | 'error'
  /** Output value */
  value: unknown
  /** Confidence level */
  confidence?: number
  /** Source tool */
  sourceTool: string
  /** Timestamp */
  timestamp: number
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Mapping rule from result to field
 */
export interface ResultToFieldMapping {
  /** Mapping ID */
  mappingId: string
  /** Result path (for nested results) */
  resultPath: string
  /** Target field reference */
  targetField: FieldReference
  /** Transformation function name */
  transform?: string
  /** Whether required */
  required: boolean
}

/**
 * Writeback trace entry
 */
export interface WritebackTraceEntry {
  /** Entry ID */
  entryId: string
  /** Action ID */
  actionId: string
  /** Entry type */
  type: 'permission-check' | 'validation' | 'update' | 'completion' | 'error'
  /** Field reference if applicable */
  field?: FieldReference
  /** Message */
  message: string
  /** Details */
  details?: Record<string, unknown>
  /** Timestamp */
  timestamp: number
}

/**
 * Writeback adapter store
 */
export interface WritebackAdapterStore {
  /** Writeback contracts by form ID */
  contracts: Map<string, WritebackContract>
  /** Writeback actions by action ID */
  actions: Map<string, WritebackAction>
  /** Result mappings by mapping ID */
  mappings: Map<string, ResultToFieldMapping>
  /** Trace entries by action ID */
  traces: Map<string, WritebackTraceEntry[]>
}

/**
 * Writeback options
 */
export interface WritebackOptions {
  /** Skip permission check */
  skipPermissionCheck?: boolean
  /** Skip validation */
  skipValidation?: boolean
  /** Force update even if same value */
  forceUpdate?: boolean
  /** Dry run - don't actually apply */
  dryRun?: boolean
  /** Metadata to attach */
  metadata?: Record<string, unknown>
}

/**
 * Writeback result
 */
export interface WritebackResult {
  /** Success */
  success: boolean
  /** Action ID */
  actionId: string
  /** Applied updates */
  appliedUpdates: FieldUpdate[]
  /** Rejected updates */
  rejectedUpdates: FieldUpdate[]
  /** Failed updates */
  failedUpdates: FieldUpdate[]
  /** Trace entries */
  trace: WritebackTraceEntry[]
  /** Error message if failed */
  error?: string
}

// ============================================================================
// Constants
// ============================================================================

export const UPDATE_ID_PREFIX = 'upd'
export const ACTION_ID_PREFIX = 'wba'
export const MAPPING_ID_PREFIX = 'map'
export const TRACE_ENTRY_ID_PREFIX = 'wte'
export const CONTRACT_ID_PREFIX = 'wbc'

export const FIELD_DATA_TYPES: FieldDataType[] = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'array',
  'object',
  'file',
  'currency'
]

export const WRITEBACK_PERMISSIONS: WritebackPermission[] = [
  'read-only',
  'edit',
  'admin'
]

export const FIELD_UPDATE_STATUSES: FieldUpdateStatus[] = [
  'pending',
  'validated',
  'applied',
  'rejected',
  'failed'
]

export const WRITEBACK_STATUSES: WritebackStatus[] = [
  'pending',
  'in-progress',
  'completed',
  'partial',
  'failed',
  'cancelled'
]

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique update ID
 */
export function generateUpdateId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${UPDATE_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique action ID
 */
export function generateActionId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${ACTION_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique mapping ID
 */
export function generateMappingId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${MAPPING_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique trace entry ID
 */
export function generateTraceEntryId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${TRACE_ENTRY_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique contract ID
 */
export function generateContractId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${CONTRACT_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Check if a string is a valid update ID
 */
export function isValidUpdateId(id: string): boolean {
  return id.startsWith(`${UPDATE_ID_PREFIX}_`)
}

/**
 * Check if a string is a valid action ID
 */
export function isValidActionId(id: string): boolean {
  return id.startsWith(`${ACTION_ID_PREFIX}_`)
}

/**
 * Check if a string is a valid mapping ID
 */
export function isValidMappingId(id: string): boolean {
  return id.startsWith(`${MAPPING_ID_PREFIX}_`)
}

/**
 * Check if a string is a valid trace entry ID
 */
export function isValidTraceEntryId(id: string): boolean {
  return id.startsWith(`${TRACE_ENTRY_ID_PREFIX}_`)
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a field reference
 */
export function createFieldReference(
  formId: string,
  fieldId: string,
  dataType: FieldDataType,
  options?: { fieldPath?: string }
): FieldReference {
  return {
    formId,
    fieldId,
    fieldPath: options?.fieldPath,
    dataType
  }
}

/**
 * Create a field permission result
 */
export function createFieldPermissionResult(
  field: FieldReference,
  allowed: boolean,
  permissionLevel: WritebackPermission,
  reason?: string
): FieldPermissionResult {
  return {
    field,
    allowed,
    permissionLevel,
    reason,
    checkedAt: Date.now()
  }
}

/**
 * Create a field update
 */
export function createFieldUpdate(
  field: FieldReference,
  newValue: unknown,
  originalValue?: unknown
): FieldUpdate {
  const now = Date.now()
  return {
    updateId: generateUpdateId(),
    field,
    originalValue,
    newValue,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Create a writeback action
 */
export function createWritebackAction(
  sessionId: string,
  traceId: string,
  formId: string,
  source: string,
  updates: FieldUpdate[] = [],
  metadata?: Record<string, unknown>
): WritebackAction {
  const now = Date.now()
  return {
    actionId: generateActionId(),
    sessionId,
    traceId,
    formId,
    updates,
    status: 'pending',
    source,
    createdAt: now,
    updatedAt: now,
    metadata
  }
}

/**
 * Create a writeback contract
 */
export function createWritebackContract(
  formId: string,
  allowedFields: FieldReference[],
  options?: {
    fieldPermissions?: Map<string, WritebackPermission>
    validationRules?: Map<string, FieldValidationRule[]>
    requiresApproval?: boolean
  }
): WritebackContract {
  const now = Date.now()
  return {
    formId,
    allowedFields,
    fieldPermissions: options?.fieldPermissions ?? new Map(),
    validationRules: options?.validationRules ?? new Map(),
    requiresApproval: options?.requiresApproval ?? false,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Create a field validation rule
 */
export function createValidationRule(
  type: FieldValidationRule['type'],
  errorMessage: string,
  params?: Record<string, unknown>
): FieldValidationRule {
  return {
    type,
    params,
    errorMessage
  }
}

/**
 * Create a result to field mapping
 */
export function createResultToFieldMapping(
  resultPath: string,
  targetField: FieldReference,
  options?: { transform?: string; required?: boolean }
): ResultToFieldMapping {
  return {
    mappingId: generateMappingId(),
    resultPath,
    targetField,
    transform: options?.transform,
    required: options?.required ?? false
  }
}

/**
 * Create a writeback trace entry
 */
export function createWritebackTraceEntry(
  actionId: string,
  type: WritebackTraceEntry['type'],
  message: string,
  options?: { field?: FieldReference; details?: Record<string, unknown> }
): WritebackTraceEntry {
  return {
    entryId: generateTraceEntryId(),
    actionId,
    type,
    field: options?.field,
    message,
    details: options?.details,
    timestamp: Date.now()
  }
}

/**
 * Create a writeback adapter store
 */
export function createWritebackAdapterStore(): WritebackAdapterStore {
  return {
    contracts: new Map(),
    actions: new Map(),
    mappings: new Map(),
    traces: new Map()
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check if a field is in the allowed list
 */
export function isFieldAllowed(
  contract: WritebackContract,
  field: FieldReference
): boolean {
  return contract.allowedFields.some(
    f => f.formId === field.formId && f.fieldId === field.fieldId
  )
}

/**
 * Get permission level for a field
 */
export function getFieldPermission(
  contract: WritebackContract,
  field: FieldReference
): WritebackPermission {
  const key = `${field.formId}:${field.fieldId}`
  return contract.fieldPermissions.get(key) ?? 'read-only'
}

/**
 * Check if write is allowed for a field
 */
export function canWriteField(
  contract: WritebackContract,
  field: FieldReference
): FieldPermissionResult {
  const isAllowed = isFieldAllowed(contract, field)
  
  if (!isAllowed) {
    return createFieldPermissionResult(
      field,
      false,
      'read-only',
      'Field is not in the allowed list'
    )
  }
  
  const permission = getFieldPermission(contract, field)
  
  if (permission === 'read-only') {
    return createFieldPermissionResult(
      field,
      false,
      permission,
      'Field is read-only'
    )
  }
  
  return createFieldPermissionResult(field, true, permission)
}

/**
 * Check permissions for multiple fields
 */
export function checkFieldPermissions(
  contract: WritebackContract,
  fields: FieldReference[]
): FieldPermissionResult[] {
  return fields.map(field => canWriteField(contract, field))
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a value against a rule
 */
export function validateValueAgainstRule(
  value: unknown,
  rule: FieldValidationRule
): { valid: boolean; error?: string } {
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return { valid: false, error: rule.errorMessage }
      }
      break
      
    case 'type-check': {
      const expectedType = rule.params?.type as string
      if (expectedType && typeof value !== expectedType) {
        return { valid: false, error: rule.errorMessage }
      }
      break
    }
    
    case 'format': {
      const pattern = rule.params?.pattern as string
      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern)
        if (!regex.test(value)) {
          return { valid: false, error: rule.errorMessage }
        }
      }
      break
    }
    
    case 'range': {
      const min = rule.params?.min as number | undefined
      const max = rule.params?.max as number | undefined
      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return { valid: false, error: rule.errorMessage }
        }
        if (max !== undefined && value > max) {
          return { valid: false, error: rule.errorMessage }
        }
      }
      break
    }
    
    case 'custom':
      // Custom validation would be handled by external validator
      break
  }
  
  return { valid: true }
}

/**
 * Validate a field update
 */
export function validateFieldUpdate(
  update: FieldUpdate,
  rules: FieldValidationRule[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const rule of rules) {
    const result = validateValueAgainstRule(update.newValue, rule)
    if (!result.valid && result.error) {
      errors.push(result.error)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate multiple field updates
 */
export function validateFieldUpdates(
  contract: WritebackContract,
  updates: FieldUpdate[]
): Map<string, { valid: boolean; errors: string[] }> {
  const results = new Map<string, { valid: boolean; errors: string[] }>()
  
  for (const update of updates) {
    const key = `${update.field.formId}:${update.field.fieldId}`
    const rules = contract.validationRules.get(key) ?? []
    results.set(update.updateId, validateFieldUpdate(update, rules))
  }
  
  return results
}

// ============================================================================
// Result Mapping
// ============================================================================

/**
 * Extract value from normalized result by path
 */
export function extractValueByPath(
  result: NormalizedResult,
  path: string
): unknown {
  if (!path || path === '.' || path === '$') {
    return result.value
  }
  
  const parts = path.split('.')
  let current: unknown = result.value
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  
  return current
}

/**
 * Map normalized result to field updates
 */
export function mapResultToUpdates(
  result: NormalizedResult,
  mappings: ResultToFieldMapping[],
  getOriginalValue?: (field: FieldReference) => unknown
): FieldUpdate[] {
  const updates: FieldUpdate[] = []
  
  for (const mapping of mappings) {
    const value = extractValueByPath(result, mapping.resultPath)
    
    // Skip if value is undefined and not required
    if (value === undefined && !mapping.required) {
      continue
    }
    
    const originalValue = getOriginalValue?.(mapping.targetField)
    const update = createFieldUpdate(mapping.targetField, value, originalValue)
    
    updates.push(update)
  }
  
  return updates
}

// ============================================================================
// Writeback Execution
// ============================================================================

/**
 * Update field update status
 */
export function updateFieldStatus(
  update: FieldUpdate,
  status: FieldUpdateStatus,
  validationErrors?: string[]
): FieldUpdate {
  return {
    ...update,
    status,
    validationErrors,
    updatedAt: Date.now()
  }
}

/**
 * Update writeback action status
 */
export function updateWritebackStatus(
  action: WritebackAction,
  status: WritebackStatus,
  updates?: FieldUpdate[]
): WritebackAction {
  const now = Date.now()
  return {
    ...action,
    status,
    updates: updates ?? action.updates,
    updatedAt: now,
    completedAt: status === 'completed' || status === 'failed' || status === 'cancelled'
      ? now
      : action.completedAt
  }
}

/**
 * Execute writeback for a form
 */
export function executeWriteback(
  store: WritebackAdapterStore,
  action: WritebackAction,
  options: WritebackOptions = {}
): WritebackResult {
  const trace: WritebackTraceEntry[] = []
  const appliedUpdates: FieldUpdate[] = []
  const rejectedUpdates: FieldUpdate[] = []
  const failedUpdates: FieldUpdate[] = []
  
  // Get contract
  const contract = store.contracts.get(action.formId)
  
  if (!contract) {
    trace.push(createWritebackTraceEntry(
      action.actionId,
      'error',
      `No writeback contract found for form ${action.formId}`
    ))
    
    return {
      success: false,
      actionId: action.actionId,
      appliedUpdates,
      rejectedUpdates,
      failedUpdates: action.updates,
      trace,
      error: 'No writeback contract found'
    }
  }
  
  // Check if requires approval
  if (contract.requiresApproval && !options.dryRun) {
    trace.push(createWritebackTraceEntry(
      action.actionId,
      'error',
      'Writeback requires approval'
    ))
    
    return {
      success: false,
      actionId: action.actionId,
      appliedUpdates,
      rejectedUpdates,
      failedUpdates: action.updates,
      trace,
      error: 'Writeback requires approval'
    }
  }
  
  // Process each update
  for (const update of action.updates) {
    const fieldKey = `${update.field.formId}:${update.field.fieldId}`
    
    // Permission check
    if (!options.skipPermissionCheck) {
      const permissionResult = canWriteField(contract, update.field)
      
      trace.push(createWritebackTraceEntry(
        action.actionId,
        'permission-check',
        permissionResult.allowed
          ? `Permission granted for field ${update.field.fieldId}`
          : `Permission denied for field ${update.field.fieldId}: ${permissionResult.reason}`,
        { field: update.field, details: { permissionResult } }
      ))
      
      if (!permissionResult.allowed) {
        rejectedUpdates.push(updateFieldStatus(update, 'rejected', [permissionResult.reason ?? 'Permission denied']))
        continue
      }
    }
    
    // Validation
    if (!options.skipValidation) {
      const rules = contract.validationRules.get(fieldKey) ?? []
      const validationResult = validateFieldUpdate(update, rules)
      
      trace.push(createWritebackTraceEntry(
        action.actionId,
        'validation',
        validationResult.valid
          ? `Validation passed for field ${update.field.fieldId}`
          : `Validation failed for field ${update.field.fieldId}`,
        { field: update.field, details: { errors: validationResult.errors } }
      ))
      
      if (!validationResult.valid) {
        rejectedUpdates.push(updateFieldStatus(update, 'rejected', validationResult.errors))
        continue
      }
    }
    
    // Check if value changed (unless force update)
    if (!options.forceUpdate && update.originalValue === update.newValue) {
      trace.push(createWritebackTraceEntry(
        action.actionId,
        'update',
        `Skipping field ${update.field.fieldId} - value unchanged`,
        { field: update.field }
      ))
      continue
    }
    
    // Apply update (or simulate in dry run)
    if (options.dryRun) {
      trace.push(createWritebackTraceEntry(
        action.actionId,
        'update',
        `[DRY RUN] Would update field ${update.field.fieldId}`,
        { field: update.field, details: { newValue: update.newValue } }
      ))
    } else {
      trace.push(createWritebackTraceEntry(
        action.actionId,
        'update',
        `Updated field ${update.field.fieldId}`,
        { field: update.field, details: { newValue: update.newValue } }
      ))
    }
    
    appliedUpdates.push(updateFieldStatus(update, 'applied'))
  }
  
  // Determine overall status
  const totalUpdates = action.updates.length
  const appliedCount = appliedUpdates.length
  const rejectedCount = rejectedUpdates.length
  const failedCount = failedUpdates.length
  
  let success: boolean
  let finalStatus: WritebackStatus
  
  if (options.dryRun) {
    success = true
    finalStatus = 'completed'
  } else if (appliedCount === totalUpdates) {
    success = true
    finalStatus = 'completed'
  } else if (appliedCount > 0) {
    success = false
    finalStatus = 'partial'
  } else {
    success = false
    finalStatus = 'failed'
  }
  
  trace.push(createWritebackTraceEntry(
    action.actionId,
    'completion',
    `Writeback ${finalStatus}: ${appliedCount} applied, ${rejectedCount} rejected, ${failedCount} failed`,
    { details: { appliedCount, rejectedCount, failedCount, totalUpdates } }
  ))
  
  return {
    success,
    actionId: action.actionId,
    appliedUpdates,
    rejectedUpdates,
    failedUpdates,
    trace
  }
}

// ============================================================================
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
