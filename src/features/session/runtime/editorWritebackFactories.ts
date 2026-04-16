/**
 * Editor and Template Writeback - ID Generation & Factory Functions
 * Task 87: Story 49.4 - Editor and Template Writeback
 *
 * ID generators, content hashing, and factory functions for creating
 * writeback entities.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import type {
  EditorReference,
  EditorType,
  TemplateReference,
  TemplateType,
  ContentPosition,
  ContentRange,
  TextContentUpdate,
  TemplateSlotRef,
  TemplateContentUpdate,
  EditorState,
  TemplateState,
  EditorWritebackOperation,
  EditorWritebackOperationType,
  TemplateWritebackOperation,
  TemplateWritebackOperationType,
  EditorWritebackAction,
  TemplateWritebackAction,
  EditorWritebackContract,
  TemplateWritebackContract,
} from './editorWritebackTypes'

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

export function computeContentHash(content: string): string {
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
