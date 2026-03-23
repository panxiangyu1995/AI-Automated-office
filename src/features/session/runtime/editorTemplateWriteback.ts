/**
 * Editor and Template Writeback Module
 * Task 87: Story 49.4 - Editor and Template Writeback
 *
 * Write Agent output into editor and template hosts through controlled contracts.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'

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

// ============================================================================
// ID Generation
// ============================================================================

let editorOpCounter = 0
let templateOpCounter = 0
let editorActionCounter = 0
let templateActionCounter = 0
let editorContractCounter = 0
let templateContractCounter = 0
let editorTraceCounter = 0
let templateTraceCounter = 0
let auditCounter = 0

export function generateEditorOperationId(): string {
  return `editor-op-${Date.now()}-${++editorOpCounter}`
}

export function generateTemplateOperationId(): string {
  return `template-op-${Date.now()}-${++templateOpCounter}`
}

export function generateEditorActionId(): string {
  return `editor-action-${Date.now()}-${++editorActionCounter}`
}

export function generateTemplateActionId(): string {
  return `template-action-${Date.now()}-${++templateActionCounter}`
}

export function generateEditorContractId(): string {
  return `editor-contract-${Date.now()}-${++editorContractCounter}`
}

export function generateTemplateContractId(): string {
  return `template-contract-${Date.now()}-${++templateContractCounter}`
}

export function generateEditorTraceId(): string {
  return `editor-trace-${Date.now()}-${++editorTraceCounter}`
}

export function generateTemplateTraceId(): string {
  return `template-trace-${Date.now()}-${++templateTraceCounter}`
}

export function generateAuditEntryId(): string {
  return `audit-${Date.now()}-${++auditCounter}`
}

// ============================================================================
// Content Hash (Simple Implementation)
// ============================================================================

function computeContentHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `hash-${Math.abs(hash).toString(16)}`
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createEditorReference(
  editorId: string,
  editorType: EditorType,
  options?: {
    filePath?: string
    documentId?: string
  }
): EditorReference {
  return {
    editorId,
    editorType,
    filePath: options?.filePath,
    documentId: options?.documentId,
  }
}

export function createTemplateReference(
  templateId: string,
  templateType: TemplateType,
  name: string,
  options?: {
    version?: string
  }
): TemplateReference {
  return {
    templateId,
    templateType,
    name,
    version: options?.version,
  }
}

export function createContentPosition(line: number, column: number): ContentPosition {
  return { line, column }
}

export function createContentRange(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): ContentRange {
  return {
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn },
  }
}

export function createTextContentUpdate(
  content: string,
  options?: {
    range?: ContentRange
    position?: ContentPosition
  }
): TextContentUpdate {
  return {
    content,
    range: options?.range,
    position: options?.position,
  }
}

export function createTemplateSlotRef(
  slotName: string,
  slotPath?: string[]
): TemplateSlotRef {
  return { slotName, slotPath }
}

export function createTemplateContentUpdate(
  slot: TemplateSlotRef,
  content: string | Record<string, unknown>,
  format: 'plain' | 'markdown' | 'html' | 'json' = 'plain'
): TemplateContentUpdate {
  return { slot, content, format }
}

export function createEditorState(
  content: string,
  options?: {
    isDirty?: boolean
    lastSavedContent?: string
    lastSavedAt?: string
    version?: number
    language?: string
    encoding?: string
  }
): EditorState {
  return {
    content,
    contentHash: computeContentHash(content),
    isDirty: options?.isDirty ?? false,
    lastSavedContent: options?.lastSavedContent,
    lastSavedAt: options?.lastSavedAt,
    version: options?.version ?? 1,
    language: options?.language,
    encoding: options?.encoding,
  }
}

export function createTemplateState(
  templateId: string,
  slotValues: Record<string, string | Record<string, unknown>> = {},
  options?: {
    lastSavedValues?: Record<string, string | Record<string, unknown>>
    lastSavedAt?: string
    version?: number
  }
): TemplateState {
  return {
    templateId,
    slotValues,
    dirtySlots: new Set(),
    lastSavedValues: options?.lastSavedValues,
    lastSavedAt: options?.lastSavedAt,
    version: options?.version ?? 1,
  }
}

export function createEditorWritebackOperation(
  editorRef: EditorReference,
  operation: EditorWritebackOperationType,
  options?: {
    update?: TextContentUpdate
    newContent?: string
    position?: ContentPosition
    range?: ContentRange
    skipPermissionCheck?: boolean
    preserveUndoHistory?: boolean
  }
): EditorWritebackOperation {
  return {
    operationId: generateEditorOperationId(),
    operation,
    editorRef,
    update: options?.update,
    newContent: options?.newContent,
    position: options?.position,
    range: options?.range,
    skipPermissionCheck: options?.skipPermissionCheck,
    preserveUndoHistory: options?.preserveUndoHistory,
  }
}

export function createTemplateWritebackOperation(
  templateRef: TemplateReference,
  operation: TemplateWritebackOperationType,
  slot: TemplateSlotRef,
  options?: {
    update?: TemplateContentUpdate
    skipPermissionCheck?: boolean
  }
): TemplateWritebackOperation {
  return {
    operationId: generateTemplateOperationId(),
    operation,
    templateRef,
    slot,
    update: options?.update,
    skipPermissionCheck: options?.skipPermissionCheck,
  }
}

export function createEditorWritebackAction(
  sessionId: string,
  editorRef: EditorReference,
  operations: EditorWritebackOperation[]
): EditorWritebackAction {
  return {
    actionId: generateEditorActionId(),
    sessionId,
    editorRef,
    operations,
    timestamp: new Date().toISOString(),
    status: 'pending',
  }
}

export function createTemplateWritebackAction(
  sessionId: string,
  templateRef: TemplateReference,
  operations: TemplateWritebackOperation[]
): TemplateWritebackAction {
  return {
    actionId: generateTemplateActionId(),
    sessionId,
    templateRef,
    operations,
    timestamp: new Date().toISOString(),
    status: 'pending',
  }
}

export function createEditorWritebackContract(
  options: {
    allowedEditorTypes?: EditorType[]
    requiredPermission?: PermissionLevel
    allowDirtyOverwrite?: boolean
    requireConfirmationOnDirty?: boolean
    maxContentSize?: number
    allowedLanguages?: string[]
    preserveVersionBoundaries?: boolean
    autoSaveAfterWriteback?: boolean
    auditLevel?: 'none' | 'basic' | 'full'
  } = {}
): EditorWritebackContract {
  return {
    contractId: generateEditorContractId(),
    allowedEditorTypes: options.allowedEditorTypes ?? ['text', 'code', 'markdown', 'rich-text', 'form', 'custom'],
    requiredPermission: options.requiredPermission ?? 'write',
    allowDirtyOverwrite: options.allowDirtyOverwrite ?? true,
    requireConfirmationOnDirty: options.requireConfirmationOnDirty ?? true,
    maxContentSize: options.maxContentSize,
    allowedLanguages: options.allowedLanguages,
    preserveVersionBoundaries: options.preserveVersionBoundaries ?? true,
    autoSaveAfterWriteback: options.autoSaveAfterWriteback ?? false,
    auditLevel: options.auditLevel ?? 'basic',
  }
}

export function createTemplateWritebackContract(
  options: {
    allowedTemplateTypes?: TemplateType[]
    requiredPermission?: PermissionLevel
    allowedSlots?: string[]
    slotPermissions?: Record<string, PermissionLevel>
    requireSlotValidation?: boolean
    autoSaveAfterWriteback?: boolean
    auditLevel?: 'none' | 'basic' | 'full'
  } = {}
): TemplateWritebackContract {
  return {
    contractId: generateTemplateContractId(),
    allowedTemplateTypes: options.allowedTemplateTypes ?? ['document', 'email', 'report', 'contract', 'form', 'custom'],
    requiredPermission: options.requiredPermission ?? 'write',
    allowedSlots: options.allowedSlots,
    slotPermissions: options.slotPermissions,
    requireSlotValidation: options.requireSlotValidation ?? true,
    autoSaveAfterWriteback: options.autoSaveAfterWriteback ?? false,
    auditLevel: options.auditLevel ?? 'basic',
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

export function isEditorTypeAllowed(
  contract: EditorWritebackContract,
  editorType: EditorType
): boolean {
  return contract.allowedEditorTypes.includes(editorType)
}

export function isTemplateTypeAllowed(
  contract: TemplateWritebackContract,
  templateType: TemplateType
): boolean {
  return contract.allowedTemplateTypes.includes(templateType)
}

export function isSlotAllowed(
  contract: TemplateWritebackContract,
  slotName: string
): boolean {
  if (!contract.allowedSlots) return true
  return contract.allowedSlots.includes(slotName)
}

export function checkEditorPermission(
  contract: EditorWritebackContract,
  userPermission: PermissionLevel,
  editorState?: EditorState
): { allowed: boolean; reason?: string } {
  // Check base permission
  if (!permissionSatisfies(userPermission, contract.requiredPermission)) {
    return { allowed: false, reason: 'Insufficient permission' }
  }

  // Check dirty state
  if (editorState?.isDirty && !contract.allowDirtyOverwrite) {
    return { allowed: false, reason: 'Editor has unsaved changes' }
  }

  return { allowed: true }
}

export function checkSlotPermission(
  contract: TemplateWritebackContract,
  slotName: string,
  userPermission: PermissionLevel
): { allowed: boolean; reason?: string } {
  // Check if slot is allowed
  if (!isSlotAllowed(contract, slotName)) {
    return { allowed: false, reason: `Slot '${slotName}' not allowed` }
  }

  // Check slot-level permission
  const slotPerm = contract.slotPermissions?.[slotName]
  if (slotPerm && !permissionSatisfies(userPermission, slotPerm)) {
    return { allowed: false, reason: `Insufficient permission for slot '${slotName}'` }
  }

  // Check base permission
  if (!permissionSatisfies(userPermission, contract.requiredPermission)) {
    return { allowed: false, reason: 'Insufficient permission' }
  }

  return { allowed: true }
}

export function checkContentSize(
  contract: EditorWritebackContract,
  content: string
): { valid: boolean; reason?: string } {
  if (contract.maxContentSize && content.length > contract.maxContentSize) {
    return { valid: false, reason: `Content size ${content.length} exceeds maximum ${contract.maxContentSize}` }
  }
  return { valid: true }
}

export function checkLanguage(
  contract: EditorWritebackContract,
  language: string
): { valid: boolean; reason?: string } {
  if (contract.allowedLanguages && !contract.allowedLanguages.includes(language)) {
    return { valid: false, reason: `Language '${language}' not allowed` }
  }
  return { valid: true }
}

// ============================================================================
// Editor Writeback Execution
// ============================================================================

export function executeEditorOperation(
  operation: EditorWritebackOperation,
  contract: EditorWritebackContract,
  editorState: EditorState
): { result: EditorWritebackResult; newState: EditorState } {
  const result: EditorWritebackResult = {
    operationId: operation.operationId,
    editorId: operation.editorRef.editorId,
    success: false,
  }

  // Check editor type
  if (!isEditorTypeAllowed(contract, operation.editorRef.editorType)) {
    result.error = `Editor type '${operation.editorRef.editorType}' not allowed`
    return { result, newState: editorState }
  }

  // Check content size
  const contentToWrite = operation.newContent ?? operation.update?.content ?? ''
  const sizeCheck = checkContentSize(contract, contentToWrite)
  if (!sizeCheck.valid) {
    result.error = sizeCheck.reason
    return { result, newState: editorState }
  }

  // Check language for code editors
  if (operation.editorRef.editorType === 'code' && editorState.language) {
    const langCheck = checkLanguage(contract, editorState.language)
    if (!langCheck.valid) {
      result.error = langCheck.reason
      return { result, newState: editorState }
    }
  }

  let newContent = editorState.content
  const warnings: string[] = []

  switch (operation.operation) {
    case 'replace': {
      if (operation.newContent === undefined) {
        result.error = 'New content required for replace operation'
        return { result, newState: editorState }
      }
      newContent = operation.newContent
      break
    }

    case 'insert': {
      if (!operation.update?.content) {
        result.error = 'Content required for insert operation'
        return { result, newState: editorState }
      }
      const pos = operation.position ?? operation.update.position ?? { line: 1, column: 1 }
      const lines = editorState.content.split('\n')
      if (pos.line < 1 || pos.line > lines.length + 1) {
        result.error = `Invalid line number ${pos.line}`
        return { result, newState: editorState }
      }
      const lineIndex = pos.line - 1
      if (lineIndex === lines.length) {
        // Append new line at end
        lines.push(operation.update.content)
      } else {
        const line = lines[lineIndex]
        const col = Math.max(1, Math.min(pos.column, line.length + 1))
        lines[lineIndex] = line.slice(0, col - 1) + operation.update.content + line.slice(col - 1)
      }
      newContent = lines.join('\n')
      break
    }

    case 'append': {
      if (!operation.update?.content) {
        result.error = 'Content required for append operation'
        return { result, newState: editorState }
      }
      newContent = editorState.content + operation.update.content
      break
    }

    case 'prepend': {
      if (!operation.update?.content) {
        result.error = 'Content required for prepend operation'
        return { result, newState: editorState }
      }
      newContent = operation.update.content + editorState.content
      break
    }

    case 'delete': {
      if (!operation.range && !operation.update?.range) {
        result.error = 'Range required for delete operation'
        return { result, newState: editorState }
      }
      const range = operation.range ?? operation.update!.range!
      const lines = editorState.content.split('\n')
      
      // Simple implementation: delete lines in range
      const startLine = Math.max(0, range.start.line - 1)
      const endLine = Math.min(lines.length - 1, range.end.line - 1)
      
      if (startLine > endLine) {
        result.error = 'Invalid range for delete'
        return { result, newState: editorState }
      }
      
      lines.splice(startLine, endLine - startLine + 1)
      newContent = lines.join('\n')
      break
    }

    case 'format': {
      // Format is a no-op in this implementation (would apply formatting in real editor)
      result.warnings = ['Format operation not implemented in basic editor']
      break
    }
  }

  // Create new state
  const newVersion = contract.preserveVersionBoundaries
    ? editorState.version + 1
    : editorState.version

  const newState: EditorState = {
    content: newContent,
    contentHash: computeContentHash(newContent),
    isDirty: newContent !== editorState.lastSavedContent,
    lastSavedContent: editorState.lastSavedContent,
    lastSavedAt: editorState.lastSavedAt,
    version: newVersion,
    language: editorState.language,
    encoding: editorState.encoding,
  }

  result.success = true
  result.contentHash = newState.contentHash
  result.newVersion = newState.version
  result.isDirty = newState.isDirty
  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return { result, newState }
}

export function executeEditorWriteback(
  action: EditorWritebackAction,
  contract: EditorWritebackContract,
  userPermission: PermissionLevel,
  _department: string,
  options?: {
    existingEditor?: EditorState
    dryRun?: boolean
  }
): {
  outcome: EditorWritebackOutcome
  traces: EditorWritebackTrace[]
  editorState: EditorState
} {
  let editorState = options?.existingEditor ?? createEditorState('')
  const traces: EditorWritebackTrace[] = []
  const results: EditorWritebackResult[] = []

  action.status = 'validating'

  for (const operation of action.operations) {
    const startTime = Date.now()

    const trace: EditorWritebackTrace = {
      traceId: generateEditorTraceId(),
      actionId: action.actionId,
      timestamp: new Date().toISOString(),
      operation: operation.operation,
      editorId: operation.editorRef.editorId,
      status: 'started',
    }
    traces.push(trace)

    // Permission check
    if (!operation.skipPermissionCheck) {
      const permCheck = checkEditorPermission(contract, userPermission, editorState)
      if (!permCheck.allowed) {
        trace.status = 'skipped'
        trace.details = permCheck.reason
        trace.durationMs = Date.now() - startTime
        results.push({
          operationId: operation.operationId,
          editorId: operation.editorRef.editorId,
          success: false,
          error: permCheck.reason,
        })
        continue
      }

      // Check dirty state warning
      if (editorState.isDirty && contract.requireConfirmationOnDirty) {
        trace.details = 'Warning: Editor has unsaved changes'
      }
    }

    // Dry run
    if (options?.dryRun) {
      trace.status = 'completed'
      trace.details = 'Dry run - no actual changes'
      trace.durationMs = Date.now() - startTime
      results.push({
        operationId: operation.operationId,
        editorId: operation.editorRef.editorId,
        success: true,
        warnings: ['Dry run - no actual changes made'],
      })
      continue
    }

    // Execute operation
    const opResult = executeEditorOperation(operation, contract, editorState)
    results.push(opResult.result)

    if (opResult.result.success) {
      editorState = opResult.newState
    }

    trace.status = opResult.result.success ? 'completed' : 'failed'
    trace.details = opResult.result.error
    trace.durationMs = Date.now() - startTime
    trace.contentAfter = opResult.result.success ? editorState.content : undefined
  }

  // Determine overall status
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  const outcome: EditorWritebackOutcome = {
    success: failCount === 0,
    totalOperations: results.length,
    successfulOperations: successCount,
    failedOperations: failCount,
    results,
    finalState: editorState,
  }

  action.status = outcome.success ? 'completed' : 'failed'

  return { outcome, traces, editorState }
}

// ============================================================================
// Template Writeback Execution
// ============================================================================

export function executeTemplateOperation(
  operation: TemplateWritebackOperation,
  contract: TemplateWritebackContract,
  templateState: TemplateState
): { result: TemplateWritebackResult; newState: TemplateState } {
  const result: TemplateWritebackResult = {
    operationId: operation.operationId,
    templateId: operation.templateRef.templateId,
    slotName: operation.slot.slotName,
    success: false,
  }

  // Check template type
  if (!isTemplateTypeAllowed(contract, operation.templateRef.templateType)) {
    result.error = `Template type '${operation.templateRef.templateType}' not allowed`
    return { result, newState: templateState }
  }

  // Check slot
  if (!isSlotAllowed(contract, operation.slot.slotName)) {
    result.error = `Slot '${operation.slot.slotName}' not allowed`
    return { result, newState: templateState }
  }

  const newSlotValues = { ...templateState.slotValues }
  const newDirtySlots = new Set(templateState.dirtySlots)

  switch (operation.operation) {
    case 'fill':
    case 'replace': {
      if (!operation.update?.content) {
        result.error = 'Content required for fill/replace operation'
        return { result, newState: templateState }
      }
      newSlotValues[operation.slot.slotName] = operation.update.content
      newDirtySlots.add(operation.slot.slotName)
      break
    }

    case 'clear': {
      delete newSlotValues[operation.slot.slotName]
      newDirtySlots.add(operation.slot.slotName)
      break
    }

    case 'reset': {
      if (templateState.lastSavedValues && operation.slot.slotName in templateState.lastSavedValues) {
        newSlotValues[operation.slot.slotName] = templateState.lastSavedValues[operation.slot.slotName]
      } else {
        delete newSlotValues[operation.slot.slotName]
      }
      newDirtySlots.add(operation.slot.slotName)
      break
    }
  }

  const newState: TemplateState = {
    templateId: templateState.templateId,
    slotValues: newSlotValues,
    dirtySlots: newDirtySlots,
    lastSavedValues: templateState.lastSavedValues,
    lastSavedAt: templateState.lastSavedAt,
    version: templateState.version,
  }

  result.success = true
  return { result, newState }
}

export function executeTemplateWriteback(
  action: TemplateWritebackAction,
  contract: TemplateWritebackContract,
  userPermission: PermissionLevel,
  _department: string,
  options?: {
    existingTemplate?: TemplateState
    dryRun?: boolean
  }
): {
  outcome: TemplateWritebackOutcome
  traces: TemplateWritebackTrace[]
  templateState: TemplateState
} {
  let templateState = options?.existingTemplate ?? createTemplateState(action.templateRef.templateId)
  const traces: TemplateWritebackTrace[] = []
  const results: TemplateWritebackResult[] = []

  action.status = 'validating'

  for (const operation of action.operations) {
    const startTime = Date.now()

    const trace: TemplateWritebackTrace = {
      traceId: generateTemplateTraceId(),
      actionId: action.actionId,
      timestamp: new Date().toISOString(),
      operation: operation.operation,
      templateId: operation.templateRef.templateId,
      slotName: operation.slot.slotName,
      status: 'started',
    }
    traces.push(trace)

    // Permission check
    if (!operation.skipPermissionCheck) {
      const slotPerm = checkSlotPermission(contract, operation.slot.slotName, userPermission)
      if (!slotPerm.allowed) {
        trace.status = 'skipped'
        trace.details = slotPerm.reason
        trace.durationMs = Date.now() - startTime
        results.push({
          operationId: operation.operationId,
          templateId: operation.templateRef.templateId,
          slotName: operation.slot.slotName,
          success: false,
          error: slotPerm.reason,
        })
        continue
      }
    }

    // Dry run
    if (options?.dryRun) {
      trace.status = 'completed'
      trace.details = 'Dry run - no actual changes'
      trace.durationMs = Date.now() - startTime
      results.push({
        operationId: operation.operationId,
        templateId: operation.templateRef.templateId,
        slotName: operation.slot.slotName,
        success: true,
        warnings: ['Dry run - no actual changes made'],
      })
      continue
    }

    // Execute operation
    const opResult = executeTemplateOperation(operation, contract, templateState)
    results.push(opResult.result)

    if (opResult.result.success) {
      templateState = opResult.newState
    }

    trace.status = opResult.result.success ? 'completed' : 'failed'
    trace.details = opResult.result.error
    trace.durationMs = Date.now() - startTime
    trace.valueAfter = opResult.result.success
      ? templateState.slotValues[operation.slot.slotName]
      : undefined
  }

  // Determine overall status
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  const outcome: TemplateWritebackOutcome = {
    success: failCount === 0,
    totalOperations: results.length,
    successfulOperations: successCount,
    failedOperations: failCount,
    results,
    finalState: templateState,
  }

  action.status = outcome.success ? 'completed' : 'failed'

  return { outcome, traces, templateState }
}

// ============================================================================
// Store Operations
// ============================================================================

export function createEditorWritebackStore(): EditorWritebackStore {
  return {
    editors: new Map(),
    actions: new Map(),
    contracts: new Map(),
    outcomes: new Map(),
    traces: new Map(),
    auditEntries: [],
  }
}

export function createTemplateWritebackStore(): TemplateWritebackStore {
  return {
    templates: new Map(),
    actions: new Map(),
    contracts: new Map(),
    outcomes: new Map(),
    traces: new Map(),
    auditEntries: [],
  }
}

// Editor store operations
export function registerEditorContract(
  store: EditorWritebackStore,
  contract: EditorWritebackContract
): void {
  store.contracts.set(contract.contractId, contract)
}

export function getEditorContract(
  store: EditorWritebackStore,
  contractId: string
): EditorWritebackContract | undefined {
  return store.contracts.get(contractId)
}

export function addEditorToStore(
  store: EditorWritebackStore,
  editorId: string,
  state: EditorState
): void {
  store.editors.set(editorId, state)
}

export function getEditorFromStore(
  store: EditorWritebackStore,
  editorId: string
): EditorState | undefined {
  return store.editors.get(editorId)
}

export function addEditorAction(
  store: EditorWritebackStore,
  action: EditorWritebackAction
): void {
  store.actions.set(action.actionId, action)
}

export function getEditorAction(
  store: EditorWritebackStore,
  actionId: string
): EditorWritebackAction | undefined {
  return store.actions.get(actionId)
}

export function getEditorActionsBySession(
  store: EditorWritebackStore,
  sessionId: string
): EditorWritebackAction[] {
  return Array.from(store.actions.values()).filter((a) => a.sessionId === sessionId)
}

export function addEditorOutcome(
  store: EditorWritebackStore,
  actionId: string,
  outcome: EditorWritebackOutcome
): void {
  store.outcomes.set(actionId, outcome)
}

export function getEditorOutcome(
  store: EditorWritebackStore,
  actionId: string
): EditorWritebackOutcome | undefined {
  return store.outcomes.get(actionId)
}

export function addEditorTraces(
  store: EditorWritebackStore,
  actionId: string,
  traces: EditorWritebackTrace[]
): void {
  store.traces.set(actionId, traces)
}

export function getEditorTraces(
  store: EditorWritebackStore,
  actionId: string
): EditorWritebackTrace[] | undefined {
  return store.traces.get(actionId)
}

export function addEditorAuditEntry(
  store: EditorWritebackStore,
  entry: WritebackAuditEntry
): void {
  store.auditEntries.push(entry)
}

// Template store operations
export function registerTemplateContract(
  store: TemplateWritebackStore,
  contract: TemplateWritebackContract
): void {
  store.contracts.set(contract.contractId, contract)
}

export function getTemplateContract(
  store: TemplateWritebackStore,
  contractId: string
): TemplateWritebackContract | undefined {
  return store.contracts.get(contractId)
}

export function addTemplateToStore(
  store: TemplateWritebackStore,
  templateId: string,
  state: TemplateState
): void {
  store.templates.set(templateId, state)
}

export function getTemplateFromStore(
  store: TemplateWritebackStore,
  templateId: string
): TemplateState | undefined {
  return store.templates.get(templateId)
}

export function addTemplateAction(
  store: TemplateWritebackStore,
  action: TemplateWritebackAction
): void {
  store.actions.set(action.actionId, action)
}

export function getTemplateAction(
  store: TemplateWritebackStore,
  actionId: string
): TemplateWritebackAction | undefined {
  return store.actions.get(actionId)
}

export function getTemplateActionsBySession(
  store: TemplateWritebackStore,
  sessionId: string
): TemplateWritebackAction[] {
  return Array.from(store.actions.values()).filter((a) => a.sessionId === sessionId)
}

export function addTemplateOutcome(
  store: TemplateWritebackStore,
  actionId: string,
  outcome: TemplateWritebackOutcome
): void {
  store.outcomes.set(actionId, outcome)
}

export function getTemplateOutcome(
  store: TemplateWritebackStore,
  actionId: string
): TemplateWritebackOutcome | undefined {
  return store.outcomes.get(actionId)
}

export function addTemplateTraces(
  store: TemplateWritebackStore,
  actionId: string,
  traces: TemplateWritebackTrace[]
): void {
  store.traces.set(actionId, traces)
}

export function getTemplateTraces(
  store: TemplateWritebackStore,
  actionId: string
): TemplateWritebackTrace[] | undefined {
  return store.traces.get(actionId)
}

export function addTemplateAuditEntry(
  store: TemplateWritebackStore,
  entry: WritebackAuditEntry
): void {
  store.auditEntries.push(entry)
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeEditorRef(ref: EditorReference): string {
  return JSON.stringify(ref)
}

export function deserializeEditorRef(json: string): EditorReference {
  return JSON.parse(json) as EditorReference
}

export function serializeTemplateRef(ref: TemplateReference): string {
  return JSON.stringify(ref)
}

export function deserializeTemplateRef(json: string): TemplateReference {
  return JSON.parse(json) as TemplateReference
}

export function serializeEditorState(state: EditorState): string {
  return JSON.stringify(state)
}

export function deserializeEditorState(json: string): EditorState {
  return JSON.parse(json) as EditorState
}

export function serializeTemplateState(state: TemplateState): string {
  return JSON.stringify({
    ...state,
    dirtySlots: Array.from(state.dirtySlots),
  })
}

export function deserializeTemplateState(json: string): TemplateState {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    dirtySlots: new Set(parsed.dirtySlots),
  }
}

export function serializeEditorAction(action: EditorWritebackAction): string {
  return JSON.stringify(action)
}

export function deserializeEditorAction(json: string): EditorWritebackAction {
  return JSON.parse(json) as EditorWritebackAction
}

export function serializeTemplateAction(action: TemplateWritebackAction): string {
  return JSON.stringify(action)
}

export function deserializeTemplateAction(json: string): TemplateWritebackAction {
  return JSON.parse(json) as TemplateWritebackAction
}

export function serializeEditorContract(contract: EditorWritebackContract): string {
  return JSON.stringify(contract)
}

export function deserializeEditorContract(json: string): EditorWritebackContract {
  return JSON.parse(json) as EditorWritebackContract
}

export function serializeTemplateContract(contract: TemplateWritebackContract): string {
  return JSON.stringify(contract)
}

export function deserializeTemplateContract(json: string): TemplateWritebackContract {
  return JSON.parse(json) as TemplateWritebackContract
}

export function serializeEditorOutcome(outcome: EditorWritebackOutcome): string {
  return JSON.stringify(outcome)
}

export function deserializeEditorOutcome(json: string): EditorWritebackOutcome {
  return JSON.parse(json) as EditorWritebackOutcome
}

export function serializeTemplateOutcome(outcome: TemplateWritebackOutcome): string {
  return JSON.stringify(outcome)
}

export function deserializeTemplateOutcome(json: string): TemplateWritebackOutcome {
  return JSON.parse(json) as TemplateWritebackOutcome
}

export function serializeEditorWritebackStore(store: EditorWritebackStore): string {
  return JSON.stringify({
    editors: Array.from(store.editors.entries()),
    actions: Array.from(store.actions.entries()),
    contracts: Array.from(store.contracts.entries()),
    outcomes: Array.from(store.outcomes.entries()),
    traces: Array.from(store.traces.entries()),
    auditEntries: store.auditEntries,
  })
}

export function deserializeEditorWritebackStore(json: string): EditorWritebackStore {
  const parsed = JSON.parse(json)
  return {
    editors: new Map(parsed.editors),
    actions: new Map(parsed.actions),
    contracts: new Map(parsed.contracts),
    outcomes: new Map(parsed.outcomes),
    traces: new Map(parsed.traces),
    auditEntries: parsed.auditEntries,
  }
}

export function serializeTemplateWritebackStore(store: TemplateWritebackStore): string {
  return JSON.stringify({
    templates: Array.from(store.templates.entries()).map(([id, state]) => [
      id,
      { ...state, dirtySlots: Array.from(state.dirtySlots) },
    ]),
    actions: Array.from(store.actions.entries()),
    contracts: Array.from(store.contracts.entries()),
    outcomes: Array.from(store.outcomes.entries()),
    traces: Array.from(store.traces.entries()),
    auditEntries: store.auditEntries,
  })
}

export function deserializeTemplateWritebackStore(json: string): TemplateWritebackStore {
  const parsed = JSON.parse(json)
  return {
    templates: new Map(
      parsed.templates.map(([id, state]: [string, Record<string, unknown>]) => [
        id,
        { ...state, dirtySlots: new Set(state.dirtySlots as string[]) },
      ])
    ),
    actions: new Map(parsed.actions),
    contracts: new Map(parsed.contracts),
    outcomes: new Map(parsed.outcomes),
    traces: new Map(parsed.traces),
    auditEntries: parsed.auditEntries,
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

export function formatEditorRef(ref: EditorReference): string {
  const parts = [ref.editorId, ref.editorType]
  if (ref.filePath) parts.push(`file:${ref.filePath}`)
  if (ref.documentId) parts.push(`doc:${ref.documentId}`)
  return parts.join(' | ')
}

export function formatTemplateRef(ref: TemplateReference): string {
  const parts = [ref.templateId, ref.templateType, ref.name]
  if (ref.version) parts.push(`v${ref.version}`)
  return parts.join(' | ')
}

export function formatContentRange(range: ContentRange): string {
  return `L${range.start.line}:${range.start.column}-L${range.end.line}:${range.end.column}`
}

export function formatEditorState(state: EditorState): string {
  const lines = state.content.split('\n').length
  const chars = state.content.length
  const dirty = state.isDirty ? ' [dirty]' : ''
  return `Editor: ${lines} lines, ${chars} chars, v${state.version}${dirty}`
}

export function formatTemplateState(state: TemplateState): string {
  const slots = Object.keys(state.slotValues).length
  const dirty = state.dirtySlots.size
  return `Template: ${slots} slots, ${dirty} dirty, v${state.version}`
}

export function formatEditorWritebackResult(result: EditorWritebackResult): string {
  const status = result.success ? '✓' : '✗'
  const parts = [status, result.operationId, result.editorId]
  if (result.error) parts.push(`error: ${result.error}`)
  if (result.newVersion) parts.push(`v${result.newVersion}`)
  if (result.isDirty) parts.push('[dirty]')
  return parts.join(' | ')
}

export function formatTemplateWritebackResult(result: TemplateWritebackResult): string {
  const status = result.success ? '✓' : '✗'
  const parts = [status, result.operationId, result.templateId, result.slotName]
  if (result.error) parts.push(`error: ${result.error}`)
  return parts.join(' | ')
}

export function formatEditorWritebackOutcome(outcome: EditorWritebackOutcome): string {
  const status = outcome.success ? '✓' : '✗'
  return `Editor Writeback: ${status} (${outcome.successfulOperations}/${outcome.totalOperations})`
}

export function formatTemplateWritebackOutcome(outcome: TemplateWritebackOutcome): string {
  const status = outcome.success ? '✓' : '✗'
  return `Template Writeback: ${status} (${outcome.successfulOperations}/${outcome.totalOperations})`
}

export function formatEditorTrace(trace: EditorWritebackTrace): string {
  const time = new Date(trace.timestamp).toLocaleTimeString()
  const duration = trace.durationMs ? ` (${trace.durationMs}ms)` : ''
  return `[${time}] ${trace.operation} on ${trace.editorId}: ${trace.status}${duration}`
}

export function formatTemplateTrace(trace: TemplateWritebackTrace): string {
  const time = new Date(trace.timestamp).toLocaleTimeString()
  const duration = trace.durationMs ? ` (${trace.durationMs}ms)` : ''
  return `[${time}] ${trace.operation} on ${trace.templateId}.${trace.slotName}: ${trace.status}${duration}`
}
