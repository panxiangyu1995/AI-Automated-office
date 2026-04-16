/**
 * Sales Pilot Types - 销售Pilot类型定义
 * Story 50.2
 */

import type { PermissionLevel } from './fieldActionAuthorization'

// ============================================================================
// Types
// ============================================================================

/**
 * Customer status
 */
export type CustomerStatus =
  | 'potential'  // 潜在客户
  | 'new'        // 新客户
  | 'active'     // 活跃客户
  | 'inactive'   // 不活跃客户
  | 'churned'    // 流失客户

/**
 * Customer priority
 */
export type CustomerPriority = 'low' | 'normal' | 'high' | 'vip'

/**
 * Lead status
 */
export type LeadStatus =
  | 'new'          // 新线索
  | 'contacted'    // 已联系
  | 'qualified'    // 已验证
  | 'proposal'     // 已报价
  | 'negotiation'  // 谈判中
  | 'won'          // 成交
  | 'lost'         // 失败
  | 'disqualified' // 无效

/**
 * Lead source
 */
export type LeadSource =
  | 'website'      // 官网
  | 'referral'     // 推荐
  | 'event'        // 活动
  | 'call'         // 电话
  | 'email'        // 邮件
  | 'social'       // 社交媒体
  | 'advertisement'// 广告
  | 'other'        // 其他

/**
 * Opportunity status
 */
export type OpportunityStatus =
  | 'prospecting'  // 寻找机会
  | 'qualification'// 验证中
  | 'proposal'     // 已报价
  | 'negotiation'  // 谈判中
  | 'closed_won'   // 成交
  | 'closed_lost'  // 失败

/**
 * Follow-up type
 */
export type FollowUpType =
  | 'call'         // 电话跟进
  | 'email'        // 邮件跟进
  | 'meeting'      // 会议跟进
  | 'visit'        // 上门拜访
  | 'demo'         // 产品演示
  | 'proposal'     // 发送报价
  | 'other'        // 其他

/**
 * Follow-up status
 */
export type FollowUpStatus =
  | 'scheduled'    // 已安排
  | 'in_progress'  // 进行中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'overdue'      // 已逾期

/**
 * Sales tool type
 */
export type SalesToolType =
  | 'create_customer'     // 创建客户
  | 'update_customer'     // 更新客户
  | 'delete_customer'     // 删除客户
  | 'create_lead'         // 创建线索
  | 'update_lead'         // 更新线索
  | 'convert_lead'        // 转化线索
  | 'create_opportunity'  // 创建商机
  | 'update_opportunity'  // 更新商机
  | 'create_followup'     // 创建跟进
  | 'update_followup'     // 更新跟进
  | 'complete_followup'   // 完成跟进
  | 'query_customer'      // 查询客户
  | 'query_lead'          // 查询线索
  | 'query_opportunity'   // 查询商机
  | 'generate_summary'    // 生成摘要
  | 'fill_followup_form'  // 填充跟进表单

/**
 * Customer context
 */
export interface CustomerContext {
  customerId: string
  name: string
  status: CustomerStatus
  priority: CustomerPriority
  source?: LeadSource
  industry?: string
  companySize?: string
  location?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  contacts: CustomerContact[]
  leads: LeadSummary[]
  opportunities: OpportunitySummary[]
  followUps: FollowUpSummary[]
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  assignedToName?: string
}

/**
 * Customer contact
 */
export interface CustomerContact {
  contactId: string
  name: string
  title?: string
  department?: string
  phone?: string
  email?: string
  isPrimary: boolean
}

/**
 * Lead summary
 */
export interface LeadSummary {
  leadId: string
  title: string
  status: LeadStatus
  source: LeadSource
  estimatedValue?: number
  createdAt: string
}

/**
 * Opportunity summary
 */
export interface OpportunitySummary {
  opportunityId: string
  name: string
  status: OpportunityStatus
  value: number
  probability: number
  expectedCloseDate?: string
  createdAt: string
}

/**
 * Follow-up summary
 */
export interface FollowUpSummary {
  followUpId: string
  type: FollowUpType
  subject: string
  status: FollowUpStatus
  scheduledAt: string
  completedAt?: string
}

/**
 * Lead context
 */
export interface LeadContext {
  leadId: string
  title: string
  customerId?: string
  customerName?: string
  status: LeadStatus
  source: LeadSource
  estimatedValue?: number
  probability?: number
  description?: string
  contacts: CustomerContact[]
  followUps: FollowUpSummary[]
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  assignedToName?: string
}

/**
 * Opportunity context
 */
export interface OpportunityContext {
  opportunityId: string
  name: string
  customerId: string
  customerName: string
  leadId?: string
  status: OpportunityStatus
  value: number
  probability: number
  expectedCloseDate?: string
  description?: string
  contacts: CustomerContact[]
  followUps: FollowUpSummary[]
  competitors?: string[]
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  assignedToName?: string
}

/**
 * Follow-up context
 */
export interface FollowUpContext {
  followUpId: string
  type: FollowUpType
  subject: string
  description?: string
  status: FollowUpStatus
  scheduledAt: string
  completedAt?: string
  duration?: number // minutes
  outcome?: string
  nextSteps?: string
  customerId?: string
  customerName?: string
  leadId?: string
  leadTitle?: string
  opportunityId?: string
  opportunityName?: string
  contacts: CustomerContact[]
  createdAt: string
  updatedAt: string
  assignedTo: string
  assignedToName: string
}

/**
 * Sales tool definition
 */
export interface SalesTool {
  toolId: string
  toolType: SalesToolType
  name: string
  description: string
  requiredPermission: PermissionLevel
  requiresConfirmation: boolean
  isDestructive: boolean
  riskLevel: 'low' | 'medium' | 'high'
  confirmationMessage?: string
  applicableStatuses?: string[]
  validationRules?: SalesValidationRule[]
}

/**
 * Sales validation rule
 */
export interface SalesValidationRule {
  field: string
  rule: 'required' | 'email' | 'phone' | 'url' | 'minLength' | 'maxLength' | 'pattern'
  value?: string | number
  message: string
}

/**
 * Sales tool input
 */
export interface SalesToolInput {
  toolId: string
  contextType: 'customer' | 'lead' | 'opportunity' | 'followup'
  context: CustomerContext | LeadContext | OpportunityContext | FollowUpContext
  params: Record<string, unknown>
  userPermission: PermissionLevel
  userId: string
  userName: string
  skipConfirmation?: boolean
  dryRun?: boolean
}

/**
 * Sales tool output
 */
export interface SalesToolOutput {
  success: boolean
  message: string
  toolType: SalesToolType
  updatedContext?: CustomerContext | LeadContext | OpportunityContext | FollowUpContext
  requiresConfirmation?: boolean
  confirmationMessage?: string
  warnings?: string[]
  errors?: string[]
  summary?: CustomerSummary | LeadSummaryContext | OpportunitySummaryContext | FollowUpSummaryContext
}

/**
 * Customer summary
 */
export interface CustomerSummary {
  summaryId: string
  customerId: string
  customerName: string
  status: CustomerStatus
  priority: CustomerPriority
  industry?: string
  location?: string
  primaryContact?: CustomerContact
  leadCount: number
  opportunityCount: number
  activeOpportunityValue: number
  totalRevenue: number
  followUpCount: number
  nextFollowUp?: FollowUpSummary
  lastActivity?: string
  createdAt: string
  tags: string[]
  keyInsights: string[]
}

/**
 * Lead summary context
 */
export interface LeadSummaryContext {
  summaryId: string
  leadId: string
  title: string
  customerName?: string
  status: LeadStatus
  source: LeadSource
  estimatedValue?: number
  probability?: number
  contactCount: number
  followUpCount: number
  nextFollowUp?: FollowUpSummary
  createdAt: string
  tags: string[]
}

/**
 * Opportunity summary context
 */
export interface OpportunitySummaryContext {
  summaryId: string
  opportunityId: string
  name: string
  customerName: string
  status: OpportunityStatus
  value: number
  probability: number
  expectedCloseDate?: string
  daysToClose?: number
  contactCount: number
  followUpCount: number
  nextFollowUp?: FollowUpSummary
  createdAt: string
  tags: string[]
}

/**
 * Follow-up summary context
 */
export interface FollowUpSummaryContext {
  summaryId: string
  followUpId: string
  type: FollowUpType
  subject: string
  status: FollowUpStatus
  scheduledAt: string
  completedAt?: string
  customerName?: string
  leadTitle?: string
  opportunityName?: string
  contactCount: number
  isOverdue: boolean
  createdAt: string
}

/**
 * Summary options
 */
export interface SalesSummaryOptions {
  summaryType: 'brief' | 'detailed' | 'full'
  includeContacts?: boolean
  includeFollowUps?: boolean
  includeInsights?: boolean
}

/**
 * Sales writeback action
 */
export interface SalesWritebackAction {
  actionId: string
  sessionId: string
  contextId: string
  contextType: 'customer' | 'lead' | 'opportunity' | 'followup'
  writebackType: 'summary' | 'status' | 'form' | 'history' | 'workbench_card'
  content: Record<string, unknown>
  timestamp: string
}

/**
 * Sales pilot state
 */
export interface SalesPilotState {
  currentCustomer: CustomerContext | null
  currentLead: LeadContext | null
  currentOpportunity: OpportunityContext | null
  currentFollowUp: FollowUpContext | null
  availableTools: Map<string, SalesTool>
  toolHistory: SalesToolExecutionRecord[]
  pendingConfirmation: {
    toolId: string
    input: SalesToolInput
    message: string
  } | null
  auditEntries: SalesAuditEntry[]
}

/**
 * Sales tool execution record
 */
export interface SalesToolExecutionRecord {
  recordId: string
  toolId: string
  toolType: SalesToolType
  timestamp: string
  userId: string
  userName: string
  success: boolean
  durationMs: number
  params: Record<string, unknown>
  result?: Record<string, unknown>
  errors?: string[]
}

/**
 * Sales audit entry
 */
export interface SalesAuditEntry {
  entryId: string
  sessionId: string
  targetId: string
  targetType: 'customer' | 'lead' | 'opportunity' | 'followup'
  operation: string
  actor: string
  actorId: string
  timestamp: string
  success: boolean
  details?: Record<string, unknown>
}

/**
 * Sales pilot contract
 */
export interface SalesPilotContract {
  contractId: string
  allowedCustomerStatuses: CustomerStatus[]
  allowedLeadStatuses: LeadStatus[]
  allowedOpportunityStatuses: OpportunityStatus[]
  requiredPermission: PermissionLevel
  enableSummaryGeneration: boolean
  enableFollowUpFormFill: boolean
  enableWorkbenchCardWriteback: boolean
  enableDetailSectionWriteback: boolean
  requireConfirmationForActions: SalesToolType[]
  auditLevel: 'none' | 'basic' | 'full'
}
