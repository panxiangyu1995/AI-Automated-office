/**
 * Form Writeback Adapter - Execution
 * Task 87: Story 49.4 - Form Writeback Adapter
 */

import type {
  FieldUpdate,
  FieldUpdateStatus,
  WritebackAction,
  WritebackResult,
  WritebackOptions,
  WritebackTraceEntry,
  WritebackAdapterStore,
  WritebackStatus,
} from './formWritebackAdapterTypes'
import {
  createWritebackTraceEntry,
  canWriteField,
  validateFieldUpdate,
} from './formWritebackAdapterFactories'

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
