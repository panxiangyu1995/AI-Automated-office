/**
 * Approval Pilot Integration - Writeback, Audit, Serialization & Debug
 * Task 88: Story 50.1 - Approval Pilot Integration
 */

import type {
  ApprovalContext,
  ApprovalTool,
  ApprovalSummary,
  ApprovalPilotState,
  ApprovalToolExecutionRecord,
  ApprovalWritebackAction,
} from './approvalPilotTypes'
import type { WritebackAuditEntry } from './editorTemplateWriteback'
import {
  generateWritebackId,
} from './approvalPilotFactories'
import {
  getApprovalTypeName,
  getApprovalStatusName,
  getApprovalPriorityName,
  getActionName,
} from './approvalPilotExecution'

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
