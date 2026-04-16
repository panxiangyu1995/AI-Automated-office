/**
 * Form Writeback Adapter - Constants, ID Generation, Factories & Permissions
 * Task 87: Story 49.4 - Form Writeback Adapter
 */

import type {
  FieldDataType,
  WritebackPermission,
  FieldUpdateStatus,
  WritebackStatus,
  FieldReference,
  FieldPermissionResult,
  FieldUpdate,
  WritebackAction,
  WritebackContract,
  FieldValidationRule,
  NormalizedResult,
  ResultToFieldMapping,
  WritebackTraceEntry,
  WritebackAdapterStore,
} from './formWritebackAdapterTypes'

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
