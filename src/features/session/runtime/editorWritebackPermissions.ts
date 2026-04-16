/**
 * Editor and Template Writeback - Permission Checking
 * Task 87: Story 49.4 - Editor and Template Writeback
 *
 * Permission and validation checks for writeback operations.
 */

import { permissionSatisfies } from './fieldActionAuthorization'
import type { PermissionLevel } from './fieldActionAuthorization'
import type {
  EditorWritebackContract,
  EditorType,
  TemplateWritebackContract,
  TemplateType,
  EditorState,
} from './editorWritebackTypes'

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
