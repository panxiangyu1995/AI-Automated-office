/**
 * Approval Pilot Integration - Types
 * Task 88: Story 50.1 - Approval Pilot Integration
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import type { DetailBlockReference } from './detailSectionWriteback'
import type { WritebackAuditEntry } from './editorTemplateWriteback'

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
