/**
 * Form Writeback Adapter - Types
 * Task 87: Story 49.4 - Form Writeback Adapter
 */


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

