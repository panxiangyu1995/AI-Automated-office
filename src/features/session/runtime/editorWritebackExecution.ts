/**
 * Editor and Template Writeback - Execution
 * Task 87: Story 49.4 - Editor and Template Writeback
 *
 * Execution logic for editor and template writeback operations.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import type {
  EditorWritebackOperation,
  EditorWritebackContract,
  EditorState,
  EditorWritebackResult,
  EditorWritebackAction,
  EditorWritebackTrace,
  EditorWritebackOutcome,
  TemplateWritebackOperation,
  TemplateWritebackContract,
  TemplateState,
  TemplateWritebackResult,
  TemplateWritebackAction,
  TemplateWritebackTrace,
  TemplateWritebackOutcome,
} from './editorWritebackTypes'
import {
  generateEditorTraceId,
  generateTemplateTraceId,
  createEditorState,
  createTemplateState,
  computeContentHash,
} from './editorWritebackFactories'
import {
  isEditorTypeAllowed,
  checkContentSize,
  checkLanguage,
  isTemplateTypeAllowed,
  isSlotAllowed,
  checkEditorPermission,
  checkSlotPermission,
} from './editorWritebackPermissions'

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
