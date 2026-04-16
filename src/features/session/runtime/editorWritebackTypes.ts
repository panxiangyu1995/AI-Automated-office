/**
 * Editor and Template Writeback - Types
 * Task 87: Story 49.4 - Editor and Template Writeback
 *
 * Type definitions for editor and template writeback operations.
 */

import type { PermissionLevel } from './fieldActionAuthorization'

// ============================================================================
// Types
// ============================================================================

/**
 * Editor type
 */
export type EditorType =
  | 'text'      // Plain text editor
  | 'code'      // Code editor (Monaco-like)
  | 'markdown'  // Markdown editor
  | 'rich-text' // Rich text editor (WYSIWYG)
  | 'form'      // Form editor
  | 'custom'    // Custom editor type

/**
 * Template type
 */
export type TemplateType =
  | 'document'  // Document template
  | 'email'     // Email template
  | 'report'    // Report template
  | 'contract'  // Contract template
  | 'form'      // Form template
  | 'custom'    // Custom template

/**
 * Editor reference
 */
export interface EditorReference {
  /** Editor instance ID */
  editorId: string
  /** Editor type */
  editorType: EditorType
  /** Associated file path (optional) */
  filePath?: string
  /** Document ID (for cloud documents) */
  documentId?: string
}

/**
 * Template reference
 */
export interface TemplateReference {
  /** Template instance ID */
  templateId: string
  /** Template type */
  templateType: TemplateType
  /** Template name */
  name: string
  /** Template version */
  version?: string
}

/**
 * Content position
 */
export interface ContentPosition {
  /** Line number (1-based) */
  line: number
  /** Column number (1-based) */
  column: number
}

/**
 * Content range
 */
export interface ContentRange {
  /** Start position */
  start: ContentPosition
  /** End position */
  end: ContentPosition
}

/**
 * Text content update
 */
export interface TextContentUpdate {
  /** Content to insert */
  content: string
  /** Range to replace (undefined for append) */
  range?: ContentRange
  /** Position to insert at (alternative to range) */
  position?: ContentPosition
}

/**
 * Template slot reference
 */
export interface TemplateSlotRef {
  /** Slot name */
  slotName: string
  /** Slot path (for nested slots) */
  slotPath?: string[]
}

/**
 * Template content update
 */
export interface TemplateContentUpdate {
  /** Target slot */
  slot: TemplateSlotRef
  /** Content to insert */
  content: string | Record<string, unknown>
  /** Content format */
  format: 'plain' | 'markdown' | 'html' | 'json'
}

/**
 * Editor state
 */
export interface EditorState {
  /** Current content */
  content: string
  /** Content hash for change detection */
  contentHash: string
  /** Dirty state */
  isDirty: boolean
  /** Last saved content */
  lastSavedContent?: string
  /** Last saved timestamp */
  lastSavedAt?: string
  /** Current version */
  version: number
  /** Language/mode for code editors */
  language?: string
  /** Encoding */
  encoding?: string
}

/**
 * Template state
 */
export interface TemplateState {
  /** Template ID */
  templateId: string
  /** Current values for slots */
  slotValues: Record<string, string | Record<string, unknown>>
  /** Dirty slots */
  dirtySlots: Set<string>
  /** Last saved values */
  lastSavedValues?: Record<string, string | Record<string, unknown>>
  /** Last saved timestamp */
  lastSavedAt?: string
  /** Current version */
  version: number
}

/**
 * Editor writeback operation type
 */
export type EditorWritebackOperationType =
  | 'replace'   // Replace entire content
  | 'insert'    // Insert at position
  | 'append'    // Append to end
  | 'prepend'   // Prepend to beginning
  | 'delete'    // Delete range
  | 'format'    // Apply formatting

/**
 * Template writeback operation type
 */
export type TemplateWritebackOperationType =
  | 'fill'      // Fill a slot
  | 'replace'   // Replace slot content
  | 'clear'     // Clear a slot
  | 'reset'     // Reset to default

/**
 * Editor writeback operation
 */
export interface EditorWritebackOperation {
  /** Operation ID */
  operationId: string
  /** Operation type */
  operation: EditorWritebackOperationType
  /** Target editor */
  editorRef: EditorReference
  /** Content update data */
  update?: TextContentUpdate
  /** New content (for replace) */
  newContent?: string
  /** Position for insert/append */
  position?: ContentPosition
  /** Range for delete */
  range?: ContentRange
  /** Skip permission check */
  skipPermissionCheck?: boolean
  /** Preserve undo history */
  preserveUndoHistory?: boolean
}

/**
 * Template writeback operation
 */
export interface TemplateWritebackOperation {
  /** Operation ID */
  operationId: string
  /** Operation type */
  operation: TemplateWritebackOperationType
  /** Target template */
  templateRef: TemplateReference
  /** Target slot */
  slot: TemplateSlotRef
  /** Content update */
  update?: TemplateContentUpdate
  /** Skip permission check */
  skipPermissionCheck?: boolean
}

/**
 * Editor writeback action
 */
export interface EditorWritebackAction {
  /** Action ID */
  actionId: string
  /** Session ID */
  sessionId: string
  /** Editor reference */
  editorRef: EditorReference
  /** Operations to perform */
  operations: EditorWritebackOperation[]
  /** Action timestamp */
  timestamp: string
  /** Action status */
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed'
}

/**
 * Template writeback action
 */
export interface TemplateWritebackAction {
  /** Action ID */
  actionId: string
  /** Session ID */
  sessionId: string
  /** Template reference */
  templateRef: TemplateReference
  /** Operations to perform */
  operations: TemplateWritebackOperation[]
  /** Action timestamp */
  timestamp: string
  /** Action status */
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed'
}

/**
 * Editor writeback contract
 */
export interface EditorWritebackContract {
  /** Contract ID */
  contractId: string
  /** Allowed editor types */
  allowedEditorTypes: EditorType[]
  /** Minimum required permission */
  requiredPermission: PermissionLevel
  /** Allow dirty overwrite */
  allowDirtyOverwrite: boolean
  /** Require confirmation before dirty overwrite */
  requireConfirmationOnDirty: boolean
  /** Max content size (in bytes) */
  maxContentSize?: number
  /** Allowed languages (for code editors) */
  allowedLanguages?: string[]
  /** Preserve version boundaries */
  preserveVersionBoundaries: boolean
  /** Auto-save after writeback */
  autoSaveAfterWriteback: boolean
  /** Audit level */
  auditLevel: 'none' | 'basic' | 'full'
}

/**
 * Template writeback contract
 */
export interface TemplateWritebackContract {
  /** Contract ID */
  contractId: string
  /** Allowed template types */
  allowedTemplateTypes: TemplateType[]
  /** Minimum required permission */
  requiredPermission: PermissionLevel
  /** Allowed slots (undefined = all) */
  allowedSlots?: string[]
  /** Slot-level permissions */
  slotPermissions?: Record<string, PermissionLevel>
  /** Require slot validation */
  requireSlotValidation: boolean
  /** Auto-save after writeback */
  autoSaveAfterWriteback: boolean
  /** Audit level */
  auditLevel: 'none' | 'basic' | 'full'
}

/**
 * Editor writeback result
 */
export interface EditorWritebackResult {
  /** Operation ID */
  operationId: string
  /** Editor ID */
  editorId: string
  /** Success flag */
  success: boolean
  /** Error message */
  error?: string
  /** Warning messages */
  warnings?: string[]
  /** Resulting content hash */
  contentHash?: string
  /** New version number */
  newVersion?: number
  /** Dirty state after operation */
  isDirty?: boolean
}

/**
 * Template writeback result
 */
export interface TemplateWritebackResult {
  /** Operation ID */
  operationId: string
  /** Template ID */
  templateId: string
  /** Slot name */
  slotName: string
  /** Success flag */
  success: boolean
  /** Error message */
  error?: string
  /** Warning messages */
  warnings?: string[]
}

/**
 * Editor writeback outcome
 */
export interface EditorWritebackOutcome {
  /** Overall success */
  success: boolean
  /** Total operations */
  totalOperations: number
  /** Successful operations */
  successfulOperations: number
  /** Failed operations */
  failedOperations: number
  /** Individual results */
  results: EditorWritebackResult[]
  /** Final editor state */
  finalState?: EditorState
}

/**
 * Template writeback outcome
 */
export interface TemplateWritebackOutcome {
  /** Overall success */
  success: boolean
  /** Total operations */
  totalOperations: number
  /** Successful operations */
  successfulOperations: number
  /** Failed operations */
  failedOperations: number
  /** Individual results */
  results: TemplateWritebackResult[]
  /** Final template state */
  finalState?: TemplateState
}

/**
 * Editor writeback trace
 */
export interface EditorWritebackTrace {
  /** Trace ID */
  traceId: string
  /** Action ID */
  actionId: string
  /** Timestamp */
  timestamp: string
  /** Operation type */
  operation: EditorWritebackOperationType
  /** Editor ID */
  editorId: string
  /** Trace status */
  status: 'started' | 'completed' | 'failed' | 'skipped' | 'rolled-back'
  /** Details */
  details?: string
  /** Duration in ms */
  durationMs?: number
  /** Content before */
  contentBefore?: string
  /** Content after */
  contentAfter?: string
}

/**
 * Template writeback trace
 */
export interface TemplateWritebackTrace {
  /** Trace ID */
  traceId: string
  /** Action ID */
  actionId: string
  /** Timestamp */
  timestamp: string
  /** Operation type */
  operation: TemplateWritebackOperationType
  /** Template ID */
  templateId: string
  /** Slot name */
  slotName: string
  /** Trace status */
  status: 'started' | 'completed' | 'failed' | 'skipped' | 'rolled-back'
  /** Details */
  details?: string
  /** Duration in ms */
  durationMs?: number
  /** Value before */
  valueBefore?: string | Record<string, unknown>
  /** Value after */
  valueAfter?: string | Record<string, unknown>
}

/**
 * Audit entry for writeback operations
 */
export interface WritebackAuditEntry {
  /** Entry ID */
  entryId: string
  /** Timestamp */
  timestamp: string
  /** Session ID */
  sessionId: string
  /** Target type */
  targetType: 'editor' | 'template'
  /** Target ID */
  targetId: string
  /** Operation type */
  operation: string
  /** Actor (user or agent) */
  actor: string
  /** Success flag */
  success: boolean
  /** Content before */
  contentBefore?: string
  /** Content after */
  contentAfter?: string
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Editor writeback store
 */
export interface EditorWritebackStore {
  /** Editors by ID */
  editors: Map<string, EditorState>
  /** Actions by ID */
  actions: Map<string, EditorWritebackAction>
  /** Contracts by ID */
  contracts: Map<string, EditorWritebackContract>
  /** Outcomes by action ID */
  outcomes: Map<string, EditorWritebackOutcome>
  /** Traces by action ID */
  traces: Map<string, EditorWritebackTrace[]>
  /** Audit entries */
  auditEntries: WritebackAuditEntry[]
}

/**
 * Template writeback store
 */
export interface TemplateWritebackStore {
  /** Templates by ID */
  templates: Map<string, TemplateState>
  /** Actions by ID */
  actions: Map<string, TemplateWritebackAction>
  /** Contracts by ID */
  contracts: Map<string, TemplateWritebackContract>
  /** Outcomes by action ID */
  outcomes: Map<string, TemplateWritebackOutcome>
  /** Traces by action ID */
  traces: Map<string, TemplateWritebackTrace[]>
  /** Audit entries */
  auditEntries: WritebackAuditEntry[]
}
