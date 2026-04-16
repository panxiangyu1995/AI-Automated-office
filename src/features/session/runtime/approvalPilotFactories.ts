/**
 * Approval Pilot Integration - ID Generation, Factories & Permissions
 * Task 88: Story 50.1 - Approval Pilot Integration
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'
import type {
  ApprovalType,
  ApprovalPriority,
  ApprovalContext,
  ApprovalTool,
  ApprovalToolType,
  ApprovalToolInput,
  ApprovalHistoryEntry,
  ApprovalAttachment,
  ApprovalKeyField,
  ApprovalPilotContract,
  ApprovalPilotState,
} from './approvalPilotTypes'

// ID Generation
// ============================================================================

let approvalIdCounter = 0
let toolIdCounter = 0
let summaryIdCounter = 0
let historyIdCounter = 0
let recordIdCounter = 0
let writebackIdCounter = 0

export function generateApprovalId(): string {
  return `approval-${Date.now()}-${++approvalIdCounter}`
}

export function generateToolId(): string {
  return `approval-tool-${++toolIdCounter}`
}

export function generateSummaryId(): string {
  return `approval-summary-${Date.now()}-${++summaryIdCounter}`
}

export function generateHistoryEntryId(): string {
  return `approval-history-${Date.now()}-${++historyIdCounter}`
}

export function generateToolRecordId(): string {
  return `approval-record-${Date.now()}-${++recordIdCounter}`
}

export function generateWritebackId(): string {
  return `approval-writeback-${Date.now()}-${++writebackIdCounter}`
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createApprovalContext(
  approvalType: ApprovalType,
  title: string,
  applicantId: string,
  applicantName: string,
  department: string,
  formData: Record<string, unknown> = {},
  options?: {
    priority?: ApprovalPriority
    attachments?: ApprovalAttachment[]
  }
): ApprovalContext {
  const now = new Date().toISOString()
  return {
    approvalId: generateApprovalId(),
    approvalType,
    title,
    applicantId,
    applicantName,
    department,
    status: 'draft',
    priority: options?.priority ?? 'normal',
    createdAt: now,
    updatedAt: now,
    history: [],
    formData,
    attachments: options?.attachments ?? [],
  }
}

export function createApprovalTool(
  toolType: ApprovalToolType,
  options?: {
    name?: string
    description?: string
    requiredPermission?: PermissionLevel
    requiresConfirmation?: boolean
    confirmationMessage?: string
    isDestructive?: boolean
    riskLevel?: 'low' | 'medium' | 'high'
  }
): ApprovalTool {
  const defaultNames: Record<ApprovalToolType, string> = {
    submit: '提交审批',
    approve: '通过审批',
    reject: '拒绝审批',
    return: '退回修改',
    transfer: '转交审批',
    withdraw: '撤回审批',
    comment: '添加评论',
    query: '查询审批',
    summary: '生成摘要',
  }

  const defaultDescriptions: Record<ApprovalToolType, string> = {
    submit: '提交审批申请',
    approve: '通过当前审批',
    reject: '拒绝当前审批',
    return: '退回给申请人修改',
    transfer: '转交给其他人审批',
    withdraw: '撤回审批申请',
    comment: '添加审批评论',
    query: '查询审批详情',
    summary: '生成审批摘要',
  }

  const defaultRiskLevels: Record<ApprovalToolType, 'low' | 'medium' | 'high'> = {
    submit: 'low',
    approve: 'medium',
    reject: 'high',
    return: 'medium',
    transfer: 'medium',
    withdraw: 'low',
    comment: 'low',
    query: 'low',
    summary: 'low',
  }

  return {
    toolId: generateToolId(),
    toolType,
    name: options?.name ?? defaultNames[toolType],
    description: options?.description ?? defaultDescriptions[toolType],
    requiredPermission: options?.requiredPermission ?? 'write',
    requiresConfirmation: options?.requiresConfirmation ?? ['approve', 'reject', 'return', 'transfer'].includes(toolType),
    confirmationMessage: options?.confirmationMessage,
    isDestructive: options?.isDestructive ?? ['reject', 'withdraw'].includes(toolType),
    riskLevel: options?.riskLevel ?? defaultRiskLevels[toolType],
  }
}

export function createApprovalHistoryEntry(
  action: ApprovalHistoryEntry['action'],
  actorId: string,
  actorName: string,
  actorRole: string,
  options?: {
    comment?: string
    fromNode?: string
    toNode?: string
  }
): ApprovalHistoryEntry {
  return {
    entryId: generateHistoryEntryId(),
    timestamp: new Date().toISOString(),
    action,
    actorId,
    actorName,
    actorRole,
    comment: options?.comment,
    fromNode: options?.fromNode,
    toNode: options?.toNode,
  }
}

export function createApprovalKeyField(
  label: string,
  value: string | number | boolean,
  type: ApprovalKeyField['type'] = 'text',
  highlight = false
): ApprovalKeyField {
  return { label, value, type, highlight }
}

export function createApprovalPilotContract(
  options?: {
    allowedApprovalTypes?: ApprovalType[]
    requiredPermission?: PermissionLevel
    enableSummaryGeneration?: boolean
    enableStructuredContentFill?: boolean
    requireConfirmationForActions?: ApprovalToolType[]
    auditLevel?: 'none' | 'basic' | 'full'
    enableWriteback?: boolean
  }
): ApprovalPilotContract {
  return {
    contractId: `approval-pilot-contract-${Date.now()}`,
    allowedApprovalTypes: options?.allowedApprovalTypes ?? [
      'leave', 'expense', 'purchase', 'contract', 'travel', 'overtime', 'recruitment', 'resignation', 'custom',
    ],
    requiredPermission: options?.requiredPermission ?? 'read',
    enableSummaryGeneration: options?.enableSummaryGeneration ?? true,
    enableStructuredContentFill: options?.enableStructuredContentFill ?? true,
    requireConfirmationForActions: options?.requireConfirmationForActions ?? ['approve', 'reject', 'return', 'transfer'],
    auditLevel: options?.auditLevel ?? 'basic',
    enableWriteback: options?.enableWriteback ?? true,
  }
}

export function createApprovalPilotState(): ApprovalPilotState {
  return {
    currentContext: null,
    availableTools: new Map(),
    toolHistory: [],
    pendingConfirmation: null,
    auditEntries: [],
  }
}

// ============================================================================
// Tool Registration
// ============================================================================

/**
 * Get all default approval tools
 */
export function getDefaultApprovalTools(): ApprovalTool[] {
  return [
    createApprovalTool('submit'),
    createApprovalTool('approve'),
    createApprovalTool('reject'),
    createApprovalTool('return'),
    createApprovalTool('transfer'),
    createApprovalTool('withdraw'),
    createApprovalTool('comment', {
      requiredPermission: 'read',
    }),
    createApprovalTool('query', {
      requiredPermission: 'read',
    }),
    createApprovalTool('summary', {
      requiredPermission: 'read',
    }),
  ]
}

/**
 * Register tool in pilot state
 */
export function registerTool(
  state: ApprovalPilotState,
  tool: ApprovalTool
): void {
  state.availableTools.set(tool.toolId, tool)
}

/**
 * Register multiple tools
 */
export function registerDefaultTools(state: ApprovalPilotState): void {
  for (const tool of getDefaultApprovalTools()) {
    registerTool(state, tool)
  }
}

/**
 * Get tool by ID
 */
export function getTool(
  state: ApprovalPilotState,
  toolId: string
): ApprovalTool | undefined {
  return state.availableTools.get(toolId)
}

/**
 * Get tool by type
 */
export function getToolByType(
  state: ApprovalPilotState,
  toolType: ApprovalToolType
): ApprovalTool | undefined {
  for (const tool of state.availableTools.values()) {
    if (tool.toolType === toolType) {
      return tool
    }
  }
  return undefined
}

// ============================================================================
// Permission and Validation
// ============================================================================

export function checkToolPermission(
  tool: ApprovalTool,
  userPermission: PermissionLevel
): { allowed: boolean; reason?: string } {
  if (!permissionSatisfies(userPermission, tool.requiredPermission)) {
    return { allowed: false, reason: 'Insufficient permission' }
  }
  return { allowed: true }
}

export function checkApprovalType(
  contract: ApprovalPilotContract,
  approvalType: ApprovalType
): boolean {
  return contract.allowedApprovalTypes.includes(approvalType)
}

export function validateToolInput(
  input: ApprovalToolInput,
  tool: ApprovalTool,
  contract: ApprovalPilotContract
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check approval type
  if (!checkApprovalType(contract, input.context.approvalType)) {
    errors.push(`Approval type '${input.context.approvalType}' not allowed`)
  }

  // Check permission
  const permCheck = checkToolPermission(tool, input.userPermission)
  if (!permCheck.allowed) {
    errors.push(permCheck.reason!)
  }

  // Tool-specific validation
  switch (tool.toolType) {
    case 'submit':
      if (input.context.status !== 'draft') {
        errors.push('Can only submit draft approvals')
      }
      if (!input.context.title) {
        errors.push('Title is required')
      }
      break

    case 'approve':
    case 'reject':
    case 'return':
      if (input.context.status !== 'pending') {
        errors.push('Can only approve/reject/return pending approvals')
      }
      break

    case 'withdraw':
      if (!['submitted', 'pending'].includes(input.context.status)) {
        errors.push('Can only withdraw submitted or pending approvals')
      }
      break

    case 'comment':
      if (!input.params.comment) {
        errors.push('Comment is required')
      }
      break
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
