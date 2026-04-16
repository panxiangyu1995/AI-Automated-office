/**
 * Approval Pilot Integration - Execution & Summary
 * Task 88: Story 50.1 - Approval Pilot Integration
 */

import type {
  ApprovalType,
  ApprovalStatus,
  ApprovalPriority,
  ApprovalContext,
  ApprovalTool,
  ApprovalToolInput,
  ApprovalToolOutput,
  ApprovalSummary,
  ApprovalKeyField,
  ApprovalTimelineEntry,
  ApprovalSummaryOptions,
  ApprovalPilotState,
  ApprovalPilotContract,
  ApprovalToolExecutionRecord,
  ApprovalHistoryEntry,
} from './approvalPilotTypes'
import {
  generateToolRecordId,
  generateSummaryId,
  createApprovalHistoryEntry,
  createApprovalKeyField,
  validateToolInput,
} from './approvalPilotFactories'

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

export function getApprovalTypeName(type: ApprovalType): string {
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

export function getApprovalStatusName(status: ApprovalStatus): string {
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

export function getApprovalPriorityName(priority: ApprovalPriority): string {
  const names: Record<ApprovalPriority, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  }
  return names[priority]
}

export function getActionName(action: string): string {
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
