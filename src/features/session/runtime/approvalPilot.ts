/**
 * Approval Pilot Integration Module
 * Task 88: Story 50.1 - Approval Pilot Integration
 *
 * Validate the common Agent runtime in the approval scenario.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'
import type { DetailBlockReference } from './detailSectionWriteback'
import type { WritebackAuditEntry } from './editorTemplateWriteback'

// ============================================================================
// Types
// ============================================================================

/**
 * Approval type
 */
export type ApprovalType =
  | 'leave'        // 请假审批
  | 'expense'      // 费用报销审批
  | 'purchase'     // 采购审批
  | 'contract'     // 合同审批
  | 'travel'       // 出差审批
  | 'overtime'     // 加班审批
  | 'recruitment'  // 招聘审批
  | 'resignation'  // 离职审批
  | 'custom'       // 自定义审批

/**
 * Approval status
 */
export type ApprovalStatus =
  | 'draft'        // 草稿
  | 'submitted'    // 已提交
  | 'pending'      // 待审批
  | 'approved'     // 已通过
  | 'rejected'     // 已拒绝
  | 'cancelled'    // 已取消
  | 'withdrawn'    // 已撤回

/**
 * Approval priority
 */
export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Approval decision
 */
export type ApprovalDecision = 'approve' | 'reject' | 'return' | 'transfer'

/**
 * Approval tool type
 */
export type ApprovalToolType =
  | 'submit'       // 提交审批
  | 'approve'      // 通过审批
  | 'reject'       // 拒绝审批
  | 'return'       // 退回修改
  | 'transfer'     // 转交审批
  | 'withdraw'     // 撤回审批
  | 'comment'      // 添加评论
  | 'query'        // 查询审批
  | 'summary'      // 生成摘要

/**
 * Approval context
 */
export interface ApprovalContext {
  /** Approval ID */
  approvalId: string
  /** Approval type */
  approvalType: ApprovalType
  /** Approval title */
  title: string
  /** Applicant ID */
  applicantId: string
  /** Applicant name */
  applicantName: string
  /** Department */
  department: string
  /** Current status */
  status: ApprovalStatus
  /** Priority */
  priority: ApprovalPriority
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
  /** Current approver ID */
  currentApproverId?: string
  /** Current approver name */
  currentApproverName?: string
  /** Approval history */
  history: ApprovalHistoryEntry[]
  /** Form data */
  formData: Record<string, unknown>
  /** Attachments */
  attachments: ApprovalAttachment[]
}

/**
 * Approval history entry
 */
export interface ApprovalHistoryEntry {
  /** Entry ID */
  entryId: string
  /** Timestamp */
  timestamp: string
  /** Action type */
  action: 'submit' | 'approve' | 'reject' | 'return' | 'transfer' | 'withdraw' | 'comment'
  /** Actor ID */
  actorId: string
  /** Actor name */
  actorName: string
  /** Actor role */
  actorRole: string
  /** Comment */
  comment?: string
  /** From node (for transfer) */
  fromNode?: string
  /** To node (for transfer) */
  toNode?: string
}

/**
 * Approval attachment
 */
export interface ApprovalAttachment {
  /** Attachment ID */
  attachmentId: string
  /** File name */
  name: string
  /** File type */
  type: string
  /** File size */
  size: number
  /** Upload timestamp */
  uploadedAt: string
  /** Uploaded by */
  uploadedBy: string
}

/**
 * Approval tool definition
 */
export interface ApprovalTool {
  /** Tool ID */
  toolId: string
  /** Tool type */
  toolType: ApprovalToolType
  /** Tool name */
  name: string
  /** Tool description */
  description: string
  /** Required permission */
  requiredPermission: PermissionLevel
  /** Requires confirmation */
  requiresConfirmation: boolean
  /** Confirmation message */
  confirmationMessage?: string
  /** Is destructive action */
  isDestructive: boolean
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * Approval tool execution input
 */
export interface ApprovalToolInput {
  /** Tool ID */
  toolId: string
  /** Approval context */
  context: ApprovalContext
  /** Input parameters */
  params: Record<string, unknown>
  /** User permission */
  userPermission: PermissionLevel
  /** User ID */
  userId: string
  /** User name */
  userName: string
  /** Skip confirmation */
  skipConfirmation?: boolean
  /** Dry run mode */
  dryRun?: boolean
}

/**
 * Approval tool execution output
 */
export interface ApprovalToolOutput {
  /** Success flag */
  success: boolean
  /** Result message */
  message?: string
  /** Updated context */
  updatedContext?: ApprovalContext
  /** Generated summary */
  summary?: ApprovalSummary
  /** Validation errors */
  errors?: string[]
  /** Warnings */
  warnings?: string[]
  /** Requires confirmation */
  requiresConfirmation?: boolean
  /** Confirmation message */
  confirmationMessage?: string
}

/**
 * Approval summary
 */
export interface ApprovalSummary {
  /** Summary ID */
  summaryId: string
  /** Approval ID */
  approvalId: string
  /** Summary type */
  summaryType: 'brief' | 'detailed' | 'full'
  /** Title */
  title: string
  /** Applicant info */
  applicant: {
    id: string
    name: string
    department: string
    position?: string
  }
  /** Approval type */
  approvalType: ApprovalType
  /** Current status */
  status: ApprovalStatus
  /** Priority */
  priority: ApprovalPriority
  /** Summary content */
  content: string
  /** Key fields */
  keyFields: ApprovalKeyField[]
  /** Timeline */
  timeline: ApprovalTimelineEntry[]
  /** Current approver */
  currentApprover?: {
    id: string
    name: string
    role: string
  }
  /** Generated at */
  generatedAt: string
}

/**
 * Approval key field
 */
export interface ApprovalKeyField {
  /** Field label */
  label: string
  /** Field value */
  value: string | number | boolean
  /** Field type */
  type: 'text' | 'number' | 'date' | 'money' | 'duration' | 'select'
  /** Is highlighted */
  highlight?: boolean
}

/**
 * Approval timeline entry
 */
export interface ApprovalTimelineEntry {
  /** Entry ID */
  entryId: string
  /** Timestamp */
  timestamp: string
  /** Action */
  action: string
  /** Actor */
  actor: string
  /** Actor role */
  role: string
  /** Status after action */
  status: ApprovalStatus
  /** Comment */
  comment?: string
}

/**
 * Approval summary generation options
 */
export interface ApprovalSummaryOptions {
  /** Summary type */
  summaryType?: 'brief' | 'detailed' | 'full'
  /** Include history */
  includeHistory?: boolean
  /** Include attachments */
  includeAttachments?: boolean
  /** Max content length */
  maxContentLength?: number
}

/**
 * Approval writeback action
 */
export interface ApprovalWritebackAction {
  /** Action ID */
  actionId: string
  /** Session ID */
  sessionId: string
  /** Approval ID */
  approvalId: string
  /** Writeback type */
  writebackType: 'summary' | 'status' | 'form' | 'comment' | 'history'
  /** Target blocks */
  targetBlocks: DetailBlockReference[]
  /** Content to write */
  content: Record<string, unknown>
  /** Timestamp */
  timestamp: string
}

/**
 * Approval pilot runtime state
 */
export interface ApprovalPilotState {
  /** Current approval context */
  currentContext: ApprovalContext | null
  /** Available tools */
  availableTools: Map<string, ApprovalTool>
  /** Tool execution history */
  toolHistory: ApprovalToolExecutionRecord[]
  /** Pending confirmation */
  pendingConfirmation: ApprovalToolInput | null
  /** Audit entries */
  auditEntries: WritebackAuditEntry[]
}

/**
 * Approval tool execution record
 */
export interface ApprovalToolExecutionRecord {
  /** Record ID */
  recordId: string
  /** Tool ID */
  toolId: string
  /** Tool type */
  toolType: ApprovalToolType
  /** Timestamp */
  timestamp: string
  /** User ID */
  userId: string
  /** User name */
  userName: string
  /** Success */
  success: boolean
  /** Duration in ms */
  durationMs: number
  /** Input params */
  params: Record<string, unknown>
  /** Output message */
  message?: string
  /** Errors */
  errors?: string[]
}

/**
 * Approval pilot contract
 */
export interface ApprovalPilotContract {
  /** Contract ID */
  contractId: string
  /** Allowed approval types */
  allowedApprovalTypes: ApprovalType[]
  /** Minimum required permission */
  requiredPermission: PermissionLevel
  /** Enable summary generation */
  enableSummaryGeneration: boolean
  /** Enable structured content fill */
  enableStructuredContentFill: boolean
  /** Require confirmation for actions */
  requireConfirmationForActions: ApprovalToolType[]
  /** Audit level */
  auditLevel: 'none' | 'basic' | 'full'
  /** Enable writeback */
  enableWriteback: boolean
}

// ============================================================================
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
// Tool Execution
// ============================================================================

/**
 * Execute approval tool
 */
export function executeApprovalTool(
  input: ApprovalToolInput,
  tool: ApprovalTool,
  contract: ApprovalPilotContract,
  state: ApprovalPilotState
): ApprovalToolOutput {
  const startTime = Date.now()

  // Validate input
  const validation = validateToolInput(input, tool, contract)
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    }
  }

  // Check if confirmation is required
  const requiresConfirmation =
    !input.skipConfirmation &&
    (tool.requiresConfirmation || contract.requireConfirmationForActions.includes(tool.toolType))

  if (requiresConfirmation && !input.dryRun) {
    const confirmationMessage =
      tool.confirmationMessage ?? `确认执行操作: ${tool.name}?`

    return {
      success: false,
      message: 'Confirmation required',
      requiresConfirmation: true,
      confirmationMessage,
    }
  }

  // Dry run - return success without changes
  if (input.dryRun) {
    return {
      success: true,
      message: `Dry run: ${tool.name} would succeed`,
      warnings: ['Dry run - no actual changes made'],
    }
  }

  // Execute the tool action
  const result = executeToolAction(input, tool)
  const durationMs = Date.now() - startTime

  // Record execution
  const record: ApprovalToolExecutionRecord = {
    recordId: generateToolRecordId(),
    toolId: tool.toolId,
    toolType: tool.toolType,
    timestamp: new Date().toISOString(),
    userId: input.userId,
    userName: input.userName,
    success: result.success,
    durationMs,
    params: input.params,
    message: result.message,
    errors: result.errors,
  }
  state.toolHistory.push(record)

  // Update context if successful
  if (result.success && result.updatedContext) {
    state.currentContext = result.updatedContext
  }

  return result
}

/**
 * Execute the actual tool action
 */
function executeToolAction(
  input: ApprovalToolInput,
  tool: ApprovalTool
): ApprovalToolOutput {
  const context = { ...input.context }
  const now = new Date().toISOString()

  switch (tool.toolType) {
    case 'submit': {
      context.status = 'submitted'
      context.updatedAt = now
      context.history.push(
        createApprovalHistoryEntry('submit', input.userId, input.userName, '申请人')
      )
      return {
        success: true,
        message: '审批已提交',
        updatedContext: context,
      }
    }

    case 'approve': {
      context.status = 'approved'
      context.updatedAt = now
      context.history.push(
        createApprovalHistoryEntry(
          'approve',
          input.userId,
          input.userName,
          '审批人',
          { comment: input.params.comment as string }
        )
      )
      return {
        success: true,
        message: '审批已通过',
        updatedContext: context,
      }
    }

    case 'reject': {
      context.status = 'rejected'
      context.updatedAt = now
      context.history.push(
        createApprovalHistoryEntry(
          'reject',
          input.userId,
          input.userName,
          '审批人',
          { comment: input.params.comment as string }
        )
      )
      return {
        success: true,
        message: '审批已拒绝',
        updatedContext: context,
      }
    }

    case 'return': {
      context.status = 'draft'
      context.updatedAt = now
      context.history.push(
        createApprovalHistoryEntry(
          'return',
          input.userId,
          input.userName,
          '审批人',
          { comment: input.params.comment as string }
        )
      )
      return {
        success: true,
        message: '审批已退回修改',
        updatedContext: context,
      }
    }

    case 'transfer': {
      context.updatedAt = now
      context.currentApproverId = input.params.targetUserId as string
      context.currentApproverName = input.params.targetUserName as string
      context.history.push(
        createApprovalHistoryEntry(
          'transfer',
          input.userId,
          input.userName,
          '审批人',
          {
            fromNode: input.params.fromNode as string,
            toNode: input.params.toNode as string,
          }
        )
      )
      return {
        success: true,
        message: '审批已转交',
        updatedContext: context,
      }
    }

    case 'withdraw': {
      context.status = 'withdrawn'
      context.updatedAt = now
      context.history.push(
        createApprovalHistoryEntry('withdraw', input.userId, input.userName, '申请人')
      )
      return {
        success: true,
        message: '审批已撤回',
        updatedContext: context,
      }
    }

    case 'comment': {
      context.updatedAt = now
      context.history.push(
        createApprovalHistoryEntry(
          'comment',
          input.userId,
          input.userName,
          '评论人',
          { comment: input.params.comment as string }
        )
      )
      return {
        success: true,
        message: '评论已添加',
        updatedContext: context,
      }
    }

    case 'query': {
      return {
        success: true,
        message: '查询成功',
        updatedContext: context,
      }
    }

    case 'summary': {
      const summary = generateApprovalSummary(context, {
        summaryType: input.params.summaryType as 'brief' | 'detailed' | 'full' ?? 'detailed',
      })
      return {
        success: true,
        message: '摘要已生成',
        summary,
      }
    }

    default:
      return {
        success: false,
        errors: [`Unknown tool type: ${(tool as ApprovalTool).toolType}`],
      }
  }
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate approval summary
 */
export function generateApprovalSummary(
  context: ApprovalContext,
  options: ApprovalSummaryOptions = {}
): ApprovalSummary {
  const summaryType = options.summaryType ?? 'detailed'

  // Build content
  let content = ''
  content += `审批标题: ${context.title}\n`
  content += `审批类型: ${getApprovalTypeName(context.approvalType)}\n`
  content += `申请人: ${context.applicantName} (${context.department})\n`
  content += `当前状态: ${getApprovalStatusName(context.status)}\n`
  content += `优先级: ${getApprovalPriorityName(context.priority)}\n`

  if (context.currentApproverName) {
    content += `当前审批人: ${context.currentApproverName}\n`
  }

  // Add key fields from form data
  const keyFields = extractKeyFields(context)

  if (summaryType !== 'brief' && context.history.length > 0) {
    content += '\n审批历史:\n'
    const historyLimit = summaryType === 'full' ? context.history.length : Math.min(5, context.history.length)
    for (let i = 0; i < historyLimit; i++) {
      const entry = context.history[i]
      content += `- ${formatHistoryEntry(entry)}\n`
    }
    if (context.history.length > historyLimit) {
      content += `... 还有 ${context.history.length - historyLimit} 条记录\n`
    }
  }

  if (summaryType === 'full' && options.includeAttachments && context.attachments.length > 0) {
    content += '\n附件:\n'
    for (const att of context.attachments) {
      content += `- ${att.name} (${formatFileSize(att.size)})\n`
    }
  }

  // Build timeline
  const timeline: ApprovalTimelineEntry[] = context.history.map((entry) => ({
    entryId: entry.entryId,
    timestamp: entry.timestamp,
    action: getActionName(entry.action),
    actor: entry.actorName,
    role: entry.actorRole,
    status: getStatusAfterAction(entry.action),
    comment: entry.comment,
  }))

  return {
    summaryId: generateSummaryId(),
    approvalId: context.approvalId,
    summaryType,
    title: context.title,
    applicant: {
      id: context.applicantId,
      name: context.applicantName,
      department: context.department,
    },
    approvalType: context.approvalType,
    status: context.status,
    priority: context.priority,
    content,
    keyFields,
    timeline,
    currentApprover: context.currentApproverId
      ? {
          id: context.currentApproverId,
          name: context.currentApproverName ?? '',
          role: '审批人',
        }
      : undefined,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Extract key fields from context
 */
function extractKeyFields(context: ApprovalContext): ApprovalKeyField[] {
  const fields: ApprovalKeyField[] = []

  // Common fields
  if (context.formData.reason) {
    fields.push(createApprovalKeyField('事由', context.formData.reason as string, 'text'))
  }

  // Type-specific fields
  switch (context.approvalType) {
    case 'leave':
      if (context.formData.startDate) {
        fields.push(createApprovalKeyField('开始日期', context.formData.startDate as string, 'date'))
      }
      if (context.formData.endDate) {
        fields.push(createApprovalKeyField('结束日期', context.formData.endDate as string, 'date'))
      }
      if (context.formData.duration) {
        fields.push(createApprovalKeyField('请假天数', context.formData.duration as number, 'duration', true))
      }
      if (context.formData.leaveType) {
        fields.push(createApprovalKeyField('请假类型', context.formData.leaveType as string, 'text'))
      }
      break

    case 'expense':
      if (context.formData.amount) {
        fields.push(createApprovalKeyField('报销金额', context.formData.amount as number, 'money', true))
      }
      if (context.formData.category) {
        fields.push(createApprovalKeyField('费用类别', context.formData.category as string, 'text'))
      }
      break

    case 'travel':
      if (context.formData.destination) {
        fields.push(createApprovalKeyField('目的地', context.formData.destination as string, 'text'))
      }
      if (context.formData.startDate) {
        fields.push(createApprovalKeyField('出发日期', context.formData.startDate as string, 'date'))
      }
      if (context.formData.endDate) {
        fields.push(createApprovalKeyField('返回日期', context.formData.endDate as string, 'date'))
      }
      break

    case 'purchase':
      if (context.formData.amount) {
        fields.push(createApprovalKeyField('采购金额', context.formData.amount as number, 'money', true))
      }
      if (context.formData.itemName) {
        fields.push(createApprovalKeyField('采购物品', context.formData.itemName as string, 'text'))
      }
      if (context.formData.quantity) {
        fields.push(createApprovalKeyField('数量', context.formData.quantity as number, 'number'))
      }
      break
  }

  return fields
}

// ============================================================================
// Helper Functions
// ============================================================================

function getApprovalTypeName(type: ApprovalType): string {
  const names: Record<ApprovalType, string> = {
    leave: '请假审批',
    expense: '费用报销',
    purchase: '采购审批',
    contract: '合同审批',
    travel: '出差审批',
    overtime: '加班审批',
    recruitment: '招聘审批',
    resignation: '离职审批',
    custom: '自定义审批',
  }
  return names[type]
}

function getApprovalStatusName(status: ApprovalStatus): string {
  const names: Record<ApprovalStatus, string> = {
    draft: '草稿',
    submitted: '已提交',
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    withdrawn: '已撤回',
  }
  return names[status]
}

function getApprovalPriorityName(priority: ApprovalPriority): string {
  const names: Record<ApprovalPriority, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  }
  return names[priority]
}

function getActionName(action: string): string {
  const names: Record<string, string> = {
    submit: '提交',
    approve: '通过',
    reject: '拒绝',
    return: '退回',
    transfer: '转交',
    withdraw: '撤回',
    comment: '评论',
  }
  return names[action] ?? action
}

function getStatusAfterAction(action: string): ApprovalStatus {
  const statusMap: Record<string, ApprovalStatus> = {
    submit: 'submitted',
    approve: 'approved',
    reject: 'rejected',
    return: 'draft',
    transfer: 'pending',
    withdraw: 'withdrawn',
    comment: 'pending',
  }
  return statusMap[action] ?? 'pending'
}

function formatHistoryEntry(entry: ApprovalHistoryEntry): string {
  const actionName = getActionName(entry.action)
  let text = `${entry.timestamp} - ${entry.actorName}(${entry.actorRole}) ${actionName}`
  if (entry.comment) {
    text += `: ${entry.comment}`
  }
  return text
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================================================
// Writeback Integration
// ============================================================================

/**
 * Create writeback action for approval
 */
export function createApprovalWritebackAction(
  sessionId: string,
  approvalId: string,
  writebackType: ApprovalWritebackAction['writebackType'],
  content: Record<string, unknown>
): ApprovalWritebackAction {
  return {
    actionId: generateWritebackId(),
    sessionId,
    approvalId,
    writebackType,
    targetBlocks: [],
    content,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Prepare summary content for writeback
 */
export function prepareSummaryWriteback(
  summary: ApprovalSummary
): Record<string, unknown> {
  return {
    summaryId: summary.summaryId,
    title: summary.title,
    applicantName: summary.applicant.name,
    applicantDepartment: summary.applicant.department,
    approvalType: getApprovalTypeName(summary.approvalType),
    status: getApprovalStatusName(summary.status),
    priority: getApprovalPriorityName(summary.priority),
    content: summary.content,
    keyFields: summary.keyFields,
    currentApprover: summary.currentApprover?.name,
    generatedAt: summary.generatedAt,
  }
}

/**
 * Prepare status update for writeback
 */
export function prepareStatusWriteback(
  context: ApprovalContext
): Record<string, unknown> {
  return {
    approvalId: context.approvalId,
    status: context.status,
    statusName: getApprovalStatusName(context.status),
    updatedAt: context.updatedAt,
    currentApprover: context.currentApproverName,
  }
}

/**
 * Prepare form data for writeback
 */
export function prepareFormWriteback(
  context: ApprovalContext
): Record<string, unknown> {
  return {
    approvalId: context.approvalId,
    formData: context.formData,
    attachments: context.attachments.map((a) => ({
      id: a.attachmentId,
      name: a.name,
      type: a.type,
      size: a.size,
    })),
  }
}

/**
 * Prepare history for writeback
 */
export function prepareHistoryWriteback(
  context: ApprovalContext
): Record<string, unknown> {
  return {
    approvalId: context.approvalId,
    history: context.history.map((h) => ({
      id: h.entryId,
      timestamp: h.timestamp,
      action: getActionName(h.action),
      actor: h.actorName,
      role: h.actorRole,
      comment: h.comment,
    })),
  }
}

// ============================================================================
// Audit Integration
// ============================================================================

/**
 * Create audit entry for approval action
 */
export function createApprovalAuditEntry(
  sessionId: string,
  context: ApprovalContext,
  action: string,
  actor: string,
  success: boolean,
  metadata?: Record<string, unknown>
): WritebackAuditEntry {
  return {
    entryId: `approval-audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sessionId,
    targetType: 'editor',
    targetId: context.approvalId,
    operation: action,
    actor,
    success,
    metadata,
  }
}

/**
 * Add audit entry to state
 */
export function addAuditEntryToState(
  state: ApprovalPilotState,
  entry: WritebackAuditEntry
): void {
  state.auditEntries.push(entry)
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeApprovalContext(context: ApprovalContext): string {
  return JSON.stringify(context)
}

export function deserializeApprovalContext(json: string): ApprovalContext {
  return JSON.parse(json) as ApprovalContext
}

export function serializeApprovalTool(tool: ApprovalTool): string {
  return JSON.stringify(tool)
}

export function deserializeApprovalTool(json: string): ApprovalTool {
  return JSON.parse(json) as ApprovalTool
}

export function serializeApprovalSummary(summary: ApprovalSummary): string {
  return JSON.stringify(summary)
}

export function deserializeApprovalSummary(json: string): ApprovalSummary {
  return JSON.parse(json) as ApprovalSummary
}

export function serializeApprovalPilotState(state: ApprovalPilotState): string {
  return JSON.stringify({
    currentContext: state.currentContext,
    availableTools: Array.from(state.availableTools.entries()),
    toolHistory: state.toolHistory,
    pendingConfirmation: state.pendingConfirmation,
    auditEntries: state.auditEntries,
  })
}

export function deserializeApprovalPilotState(json: string): ApprovalPilotState {
  const parsed = JSON.parse(json)
  return {
    currentContext: parsed.currentContext,
    availableTools: new Map(parsed.availableTools),
    toolHistory: parsed.toolHistory,
    pendingConfirmation: parsed.pendingConfirmation,
    auditEntries: parsed.auditEntries,
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

export function formatApprovalContext(context: ApprovalContext): string {
  const lines = [
    `审批: ${context.title}`,
    `类型: ${getApprovalTypeName(context.approvalType)}`,
    `申请人: ${context.applicantName} (${context.department})`,
    `状态: ${getApprovalStatusName(context.status)}`,
    `优先级: ${getApprovalPriorityName(context.priority)}`,
  ]
  if (context.currentApproverName) {
    lines.push(`当前审批人: ${context.currentApproverName}`)
  }
  return lines.join(' | ')
}

export function formatApprovalTool(tool: ApprovalTool): string {
  const risk = tool.riskLevel === 'high' ? ' [高风险]' : tool.riskLevel === 'medium' ? ' [中风险]' : ''
  const confirm = tool.requiresConfirmation ? ' [需确认]' : ''
  return `${tool.name}${risk}${confirm}`
}

export function formatApprovalSummary(summary: ApprovalSummary): string {
  return `审批摘要: ${summary.title} (${getApprovalStatusName(summary.status)})`
}

export function formatToolExecutionRecord(record: ApprovalToolExecutionRecord): string {
  const status = record.success ? '✓' : '✗'
  const time = new Date(record.timestamp).toLocaleTimeString()
  return `[${time}] ${status} ${record.toolType} by ${record.userName} (${record.durationMs}ms)`
}
