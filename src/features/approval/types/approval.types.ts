import type { DetailSectionSchema } from '@/features/forms/runtime/detailSectionSchema'
import type { FieldPermission } from '@/features/forms/runtime/formSchema'

/**
 * Approval flow status
 */
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled'

/**
 * Approval node type in flow
 */
export type ApprovalNodeType = 'start' | 'approval' | 'cc' | 'condition' | 'end'

/**
 * Approval action type
 */
export type ApprovalActionType = 'approve' | 'reject' | 'withdraw' | 'delegate' | 'transfer' | 'add_signer' | 'comment'

/**
 * Approval node in flow
 */
export interface ApprovalNode {
  id: string
  type: ApprovalNodeType
  name: string
  order: number
  assigneeType?: 'user' | 'role' | 'department' | 'manager'
  assigneeIds?: string[]
  status: ApprovalStatus
  operatedAt?: string
  operatorId?: string
  operatorName?: string
  comment?: string
}

/**
 * Approval flow instance
 */
export interface ApprovalFlow {
  id: string
  name: string
  status: ApprovalStatus
  currentNodeId?: string
  nodes: ApprovalNode[]
  initiatorId: string
  initiatorName: string
  startedAt: string
  completedAt?: string
}

/**
 * Approval content schema - defines the dynamic content structure
 */
export interface ApprovalContentSchema {
  id: string
  formSchemaId?: string
  detailSchema: DetailSectionSchema
  version: string
}

/**
 * Approval instance data
 */
export interface ApprovalInstance {
  id: string
  title: string
  type: string
  typeName: string
  schemaId: string
  contentSchema: ApprovalContentSchema
  flow: ApprovalFlow
  formData: Record<string, unknown>
  status: ApprovalStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName: string
}

/**
 * Permission context for approval operations
 */
export interface ApprovalPermissionContext {
  canView: boolean
  canApprove: boolean
  canReject: boolean
  canWithdraw: boolean
  canDelegate: boolean
  canTransfer: boolean
  canAddSigner: boolean
  canComment: boolean
  canEditForm: boolean
  allowedActions: ApprovalActionType[]
}

/**
 * Approval action request
 */
export interface ApprovalActionRequest {
  instanceId: string
  action: ApprovalActionType
  nodeId?: string
  comment?: string
  delegateTo?: string
  transferTo?: string
}

/**
 * Approval action result
 */
export interface ApprovalActionResult {
  success: boolean
  instanceId: string
  newStatus: ApprovalStatus
  nextNodeId?: string
  message?: string
}

/**
 * Resolve approval permission based on user role and flow state
 */
export function resolveApprovalPermission(
  instance: ApprovalInstance,
  currentUserId: string,
  currentUserRoles: string[]
): ApprovalPermissionContext {
  const { flow, status } = instance
  const currentNode = flow.nodes.find((n) => n.id === flow.currentNodeId)

  // Basic view permission - anyone in the flow or with approval permission
  const isInFlow = flow.nodes.some(
    (n) =>
      n.assigneeIds?.includes(currentUserId) ||
      (n.assigneeType === 'role' && n.assigneeIds?.some((r) => currentUserRoles.includes(r)))
  )
  const canView = isInFlow || currentUserId === flow.initiatorId

  // Check if current user is an assignee of current node
  const isCurrentAssignee =
    currentNode?.assigneeIds?.includes(currentUserId) ||
    (currentNode?.assigneeType === 'role' &&
      currentNode?.assigneeIds?.some((r) => currentUserRoles.includes(r)))

  // Check if current user is the initiator
  const isInitiator = currentUserId === flow.initiatorId

  // Determine allowed actions based on status and role
  const allowedActions: ApprovalActionType[] = []

  if (status === 'pending' && isCurrentAssignee) {
    if (currentNode?.type === 'approval') {
      allowedActions.push('approve', 'reject', 'delegate', 'transfer', 'add_signer')
    }
    allowedActions.push('comment')
  }

  if (status === 'pending' && isInitiator) {
    allowedActions.push('withdraw', 'comment')
  }

  if (status === 'draft' && isInitiator) {
    allowedActions.push('comment')
  }

  // Build permission context
  return {
    canView,
    canApprove: allowedActions.includes('approve'),
    canReject: allowedActions.includes('reject'),
    canWithdraw: allowedActions.includes('withdraw'),
    canDelegate: allowedActions.includes('delegate'),
    canTransfer: allowedActions.includes('transfer'),
    canAddSigner: allowedActions.includes('add_signer'),
    canComment: allowedActions.includes('comment'),
    canEditForm: status === 'draft' && isInitiator,
    allowedActions,
  }
}

/**
 * Get field permission for approval form
 */
export function getApprovalFieldPermission(
  _instance: ApprovalInstance,
  _fieldId: string,
  permissionContext: ApprovalPermissionContext
): FieldPermission {
  // If can edit form, allow edit
  if (permissionContext.canEditForm) {
    return { canView: true, canEdit: true }
  }

  // Otherwise read-only
  return { canView: true, canEdit: false }
}

/**
 * Validate approval action request
 */
export function validateApprovalActionRequest(request: ApprovalActionRequest): string[] {
  const errors: string[] = []

  if (!request.instanceId) {
    errors.push('Instance ID is required')
  }

  if (!request.action) {
    errors.push('Action is required')
  }

  if (request.action === 'delegate' && !request.delegateTo) {
    errors.push('Delegate target is required for delegate action')
  }

  if (request.action === 'transfer' && !request.transferTo) {
    errors.push('Transfer target is required for transfer action')
  }

  return errors
}
