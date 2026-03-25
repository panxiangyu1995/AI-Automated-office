/**
 * Sales Pilot Integration Module
 * Task 89: Story 50.2 - Sales Pilot Integration
 *
 * Validate the common Agent runtime in the sales scenario.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'

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

// ============================================================================
// ID Generation
// ============================================================================

const SALES_ID_PREFIX = 'sales'
const TOOL_ID_PREFIX = 'sales-tool'
const SUMMARY_ID_PREFIX = 'sales-summary'
const FOLLOWUP_ID_PREFIX = 'sales-followup'
const RECORD_ID_PREFIX = 'sales-record'
const WRITEBACK_ID_PREFIX = 'sales-writeback'
const AUDIT_ID_PREFIX = 'sales-audit'

export function generateCustomerId(): string {
  return `${SALES_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateLeadId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateOpportunityId(): string {
  return `opp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateFollowUpId(): string {
  return `${FOLLOWUP_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateContactId(): string {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateToolId(): string {
  return `${TOOL_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateSalesSummaryId(): string {
  return `${SUMMARY_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateToolRecordId(): string {
  return `${RECORD_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateSalesWritebackId(): string {
  return `${WRITEBACK_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateSalesAuditId(): string {
  return `${AUDIT_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create customer context
 */
export function createCustomerContext(
  name: string,
  status: CustomerStatus = 'new',
  options: Partial<CustomerContext> = {}
): CustomerContext {
  const now = new Date().toISOString()
  return {
    customerId: generateCustomerId(),
    name,
    status,
    priority: options.priority || 'normal',
    source: options.source,
    industry: options.industry,
    companySize: options.companySize,
    location: options.location,
    website: options.website,
    phone: options.phone,
    email: options.email,
    address: options.address,
    contacts: options.contacts || [],
    leads: options.leads || [],
    opportunities: options.opportunities || [],
    followUps: options.followUps || [],
    tags: options.tags || [],
    notes: options.notes,
    createdAt: options.createdAt || now,
    updatedAt: now,
    assignedTo: options.assignedTo,
    assignedToName: options.assignedToName,
  }
}

/**
 * Create customer contact
 */
export function createCustomerContact(
  name: string,
  options: Partial<CustomerContact> = {}
): CustomerContact {
  return {
    contactId: generateContactId(),
    name,
    title: options.title,
    department: options.department,
    phone: options.phone,
    email: options.email,
    isPrimary: options.isPrimary || false,
  }
}

/**
 * Create sales tool
 */
export function createSalesTool(
  toolType: SalesToolType,
  options: Partial<SalesTool> = {}
): SalesTool {
  const defaults: Record<SalesToolType, Partial<SalesTool>> = {
    create_customer: {
      name: '创建客户',
      description: '创建新的客户记录',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    update_customer: {
      name: '更新客户',
      description: '更新客户信息',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    delete_customer: {
      name: '删除客户',
      description: '删除客户记录',
      requiredPermission: 'delete',
      requiresConfirmation: true,
      isDestructive: true,
      riskLevel: 'high',
      confirmationMessage: '确认删除此客户？此操作不可撤销。',
    },
    create_lead: {
      name: '创建线索',
      description: '创建新的销售线索',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    update_lead: {
      name: '更新线索',
      description: '更新线索信息',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    convert_lead: {
      name: '转化线索',
      description: '将线索转化为商机',
      requiredPermission: 'write',
      requiresConfirmation: true,
      isDestructive: false,
      riskLevel: 'medium',
      confirmationMessage: '确认将此线索转化为商机？',
    },
    create_opportunity: {
      name: '创建商机',
      description: '创建新的销售商机',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    update_opportunity: {
      name: '更新商机',
      description: '更新商机信息',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    create_followup: {
      name: '创建跟进',
      description: '创建新的跟进任务',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    update_followup: {
      name: '更新跟进',
      description: '更新跟进信息',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    complete_followup: {
      name: '完成跟进',
      description: '标记跟进为已完成',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    query_customer: {
      name: '查询客户',
      description: '查询客户信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    query_lead: {
      name: '查询线索',
      description: '查询线索信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    query_opportunity: {
      name: '查询商机',
      description: '查询商机信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    generate_summary: {
      name: '生成摘要',
      description: '生成客户/线索/商机摘要',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    fill_followup_form: {
      name: '填充跟进表单',
      description: '自动填充跟进表单',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
  }

  const defaultConfig = defaults[toolType]
  return {
    toolId: generateToolId(),
    toolType,
    name: options.name || defaultConfig.name || toolType,
    description: options.description || defaultConfig.description || '',
    requiredPermission: options.requiredPermission || defaultConfig.requiredPermission || 'read',
    requiresConfirmation: options.requiresConfirmation ?? defaultConfig.requiresConfirmation ?? false,
    isDestructive: options.isDestructive ?? defaultConfig.isDestructive ?? false,
    riskLevel: options.riskLevel || defaultConfig.riskLevel || 'low',
    confirmationMessage: options.confirmationMessage || defaultConfig.confirmationMessage,
    applicableStatuses: options.applicableStatuses,
    validationRules: options.validationRules,
  }
}

/**
 * Create sales pilot contract
 */
export function createSalesPilotContract(
  options: Partial<SalesPilotContract> = {}
): SalesPilotContract {
  return {
    contractId: `sales-contract-${Date.now()}`,
    allowedCustomerStatuses: options.allowedCustomerStatuses || [
      'potential', 'new', 'active', 'inactive', 'churned',
    ],
    allowedLeadStatuses: options.allowedLeadStatuses || [
      'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'disqualified',
    ],
    allowedOpportunityStatuses: options.allowedOpportunityStatuses || [
      'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost',
    ],
    requiredPermission: options.requiredPermission || 'read',
    enableSummaryGeneration: options.enableSummaryGeneration ?? true,
    enableFollowUpFormFill: options.enableFollowUpFormFill ?? true,
    enableWorkbenchCardWriteback: options.enableWorkbenchCardWriteback ?? true,
    enableDetailSectionWriteback: options.enableDetailSectionWriteback ?? true,
    requireConfirmationForActions: options.requireConfirmationForActions || [
      'delete_customer',
      'convert_lead',
    ],
    auditLevel: options.auditLevel || 'basic',
  }
}

/**
 * Create sales pilot state
 */
export function createSalesPilotState(): SalesPilotState {
  return {
    currentCustomer: null,
    currentLead: null,
    currentOpportunity: null,
    currentFollowUp: null,
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
 * Get all default sales tools
 */
export function getDefaultSalesTools(): SalesTool[] {
  const toolTypes: SalesToolType[] = [
    'create_customer',
    'update_customer',
    'delete_customer',
    'create_lead',
    'update_lead',
    'convert_lead',
    'create_opportunity',
    'update_opportunity',
    'create_followup',
    'update_followup',
    'complete_followup',
    'query_customer',
    'query_lead',
    'query_opportunity',
    'generate_summary',
    'fill_followup_form',
  ]
  return toolTypes.map(type => createSalesTool(type))
}

/**
 * Register tool in state
 */
export function registerTool(
  state: SalesPilotState,
  tool: SalesTool
): void {
  state.availableTools.set(tool.toolId, tool)
}

/**
 * Register all default tools
 */
export function registerDefaultTools(state: SalesPilotState): void {
  const tools = getDefaultSalesTools()
  tools.forEach(tool => registerTool(state, tool))
}

/**
 * Get tool by ID
 */
export function getTool(state: SalesPilotState, toolId: string): SalesTool | undefined {
  return state.availableTools.get(toolId)
}

/**
 * Get tool by type
 */
export function getToolByType(state: SalesPilotState, toolType: SalesToolType): SalesTool | undefined {
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

/**
 * Check tool permission
 */
export function checkToolPermission(
  tool: SalesTool,
  userPermission: PermissionLevel
): { allowed: boolean; reason?: string } {
  if (permissionSatisfies(userPermission, tool.requiredPermission)) {
    return { allowed: true }
  }
  return { allowed: false, reason: 'Insufficient permission' }
}

/**
 * Check customer status
 */
export function checkCustomerStatus(
  contract: SalesPilotContract,
  status: CustomerStatus
): boolean {
  return contract.allowedCustomerStatuses.includes(status)
}

/**
 * Check lead status
 */
export function checkLeadStatus(
  contract: SalesPilotContract,
  status: LeadStatus
): boolean {
  return contract.allowedLeadStatuses.includes(status)
}

/**
 * Validate tool input
 */
export function validateToolInput(
  input: SalesToolInput,
  tool: SalesTool,
  _contract: SalesPilotContract
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check permission
  const permCheck = checkToolPermission(tool, input.userPermission)
  if (!permCheck.allowed) {
    errors.push(permCheck.reason || 'Permission denied')
  }

  // Tool-specific validation
  switch (tool.toolType) {
    case 'create_customer':
      if (!input.params.name) {
        errors.push('Customer name is required')
      }
      break

    case 'update_customer':
      if (!input.context) {
        errors.push('Customer context is required')
      }
      break

    case 'delete_customer':
      if (!input.context) {
        errors.push('Customer context is required')
      }
      break

    case 'create_lead':
      if (!input.params.title) {
        errors.push('Lead title is required')
      }
      break

    case 'convert_lead': {
      if (input.contextType !== 'lead') {
        errors.push('Lead context is required for conversion')
      }
      const leadCtx = input.context as LeadContext
      if (leadCtx.status === 'won' || leadCtx.status === 'lost') {
        errors.push('Cannot convert a won or lost lead')
      }
      break
    }

    case 'create_opportunity':
      if (!input.params.name) {
        errors.push('Opportunity name is required')
      }
      if (!input.params.customerId) {
        errors.push('Customer ID is required')
      }
      break

    case 'create_followup':
      if (!input.params.type) {
        errors.push('Follow-up type is required')
      }
      if (!input.params.subject) {
        errors.push('Follow-up subject is required')
      }
      if (!input.params.scheduledAt) {
        errors.push('Scheduled time is required')
      }
      break

    case 'complete_followup': {
      if (input.contextType !== 'followup') {
        errors.push('Follow-up context is required')
      }
      const followUpCtx = input.context as FollowUpContext
      if (followUpCtx.status === 'completed') {
        errors.push('Follow-up is already completed')
      }
      break
    }

    case 'fill_followup_form':
      if (!input.params.formData) {
        errors.push('Form data is required')
      }
      break
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Execute sales tool
 */
export function executeSalesTool(
  input: SalesToolInput,
  tool: SalesTool,
  contract: SalesPilotContract,
  state: SalesPilotState
): SalesToolOutput {
  const startTime = Date.now()

  // Validate input
  const validation = validateToolInput(input, tool, contract)
  if (!validation.valid) {
    return {
      success: false,
      message: 'Validation failed',
      toolType: tool.toolType,
      errors: validation.errors,
    }
  }

  // Check if confirmation is required
  const needsConfirmation = tool.requiresConfirmation && !input.skipConfirmation
  if (needsConfirmation) {
    state.pendingConfirmation = {
      toolId: tool.toolId,
      input,
      message: tool.confirmationMessage || `确认执行操作: ${tool.name}?`,
    }
    return {
      success: false,
      message: 'Confirmation required',
      toolType: tool.toolType,
      requiresConfirmation: true,
      confirmationMessage: tool.confirmationMessage || `确认执行操作: ${tool.name}?`,
    }
  }

  // Dry run check
  if (input.dryRun) {
    return {
      success: true,
      message: 'Dry run - preview only',
      toolType: tool.toolType,
      warnings: ['Dry run - no actual changes made'],
    }
  }

  // Execute tool
  let updatedContext: CustomerContext | LeadContext | OpportunityContext | FollowUpContext | undefined
  let summary: CustomerSummary | LeadSummaryContext | OpportunitySummaryContext | FollowUpSummaryContext | undefined
  const warnings: string[] = []

  try {
    switch (tool.toolType) {
      case 'create_customer':
        updatedContext = executeCreateCustomer(input)
        break

      case 'update_customer':
        updatedContext = executeUpdateCustomer(input)
        break

      case 'delete_customer': {
        // Mark as deleted (soft delete)
        const customerCtx = input.context as CustomerContext
        updatedContext = {
          ...customerCtx,
          status: 'churned' as CustomerStatus,
          updatedAt: new Date().toISOString(),
        }
        warnings.push('Customer marked as churned')
        break
      }

      case 'create_lead': {
        // Create new lead
        const newLead: LeadContext = {
          leadId: generateLeadId(),
          title: input.params.title as string,
          customerId: input.params.customerId as string,
          customerName: input.params.customerName as string,
          status: 'new',
          source: (input.params.source as LeadSource) || 'other',
          estimatedValue: input.params.estimatedValue as number,
          description: input.params.description as string,
          contacts: [],
          followUps: [],
          tags: (input.params.tags as string[]) || [],
          notes: input.params.notes as string,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: input.userId,
          assignedToName: input.userName,
        }
        updatedContext = newLead
        break
      }

      case 'convert_lead': {
        const leadContext = input.context as LeadContext
        // Create opportunity from lead
        const newOpp: OpportunityContext = {
          opportunityId: generateOpportunityId(),
          name: leadContext.title,
          customerId: leadContext.customerId || '',
          customerName: leadContext.customerName || '',
          leadId: leadContext.leadId,
          status: 'prospecting',
          value: leadContext.estimatedValue || 0,
          probability: leadContext.probability || 20,
          description: leadContext.description,
          contacts: leadContext.contacts,
          followUps: [],
          tags: leadContext.tags,
          notes: leadContext.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: input.userId,
          assignedToName: input.userName,
        }
        updatedContext = newOpp
        break
      }

      case 'create_opportunity': {
        const newOpportunity: OpportunityContext = {
          opportunityId: generateOpportunityId(),
          name: input.params.name as string,
          customerId: input.params.customerId as string,
          customerName: input.params.customerName as string,
          status: 'prospecting',
          value: (input.params.value as number) || 0,
          probability: (input.params.probability as number) || 20,
          expectedCloseDate: input.params.expectedCloseDate as string,
          description: input.params.description as string,
          contacts: [],
          followUps: [],
          tags: (input.params.tags as string[]) || [],
          notes: input.params.notes as string,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: input.userId,
          assignedToName: input.userName,
        }
        updatedContext = newOpportunity
        break
      }

      case 'update_opportunity': {
        const oppContext = input.context as OpportunityContext
        updatedContext = {
          ...oppContext,
          ...input.params,
          updatedAt: new Date().toISOString(),
        } as OpportunityContext
        break
      }

      case 'create_followup': {
        const newFollowUp: FollowUpContext = {
          followUpId: generateFollowUpId(),
          type: input.params.type as FollowUpType,
          subject: input.params.subject as string,
          description: input.params.description as string,
          status: 'scheduled',
          scheduledAt: input.params.scheduledAt as string,
          customerId: input.params.customerId as string,
          customerName: input.params.customerName as string,
          leadId: input.params.leadId as string,
          leadTitle: input.params.leadTitle as string,
          opportunityId: input.params.opportunityId as string,
          opportunityName: input.params.opportunityName as string,
          contacts: (input.params.contacts as CustomerContact[]) || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: input.userId,
          assignedToName: input.userName,
        }
        updatedContext = newFollowUp
        break
      }

      case 'complete_followup': {
        const followUpContext = input.context as FollowUpContext
        updatedContext = {
          ...followUpContext,
          status: 'completed' as FollowUpStatus,
          completedAt: new Date().toISOString(),
          duration: input.params.duration as number,
          outcome: input.params.outcome as string,
          nextSteps: input.params.nextSteps as string,
          updatedAt: new Date().toISOString(),
        }
        break
      }

      case 'query_customer':
      case 'query_lead':
      case 'query_opportunity':
        // Query operations return existing context
        updatedContext = input.context
        break

      case 'generate_summary':
        if (input.contextType === 'customer') {
          summary = generateCustomerSummary(input.context as CustomerContext)
        } else if (input.contextType === 'lead') {
          summary = generateLeadSummaryContext(input.context as LeadContext)
        } else if (input.contextType === 'opportunity') {
          summary = generateOpportunitySummaryContext(input.context as OpportunityContext)
        } else if (input.contextType === 'followup') {
          summary = generateFollowUpSummaryContext(input.context as FollowUpContext)
        }
        break

      case 'fill_followup_form': {
        const formData = input.params.formData as Record<string, unknown>
        const followUpForForm = input.context as FollowUpContext
        updatedContext = {
          ...followUpForForm,
          ...formData,
          updatedAt: new Date().toISOString(),
        }
        break
      }
    }

    // Record execution
    const record: SalesToolExecutionRecord = {
      recordId: generateToolRecordId(),
      toolId: tool.toolId,
      toolType: tool.toolType,
      timestamp: new Date().toISOString(),
      userId: input.userId,
      userName: input.userName,
      success: true,
      durationMs: Date.now() - startTime,
      params: input.params,
      result: updatedContext as unknown as Record<string, unknown>,
    }
    state.toolHistory.push(record)

    return {
      success: true,
      message: getSuccessMessage(tool.toolType),
      toolType: tool.toolType,
      updatedContext,
      summary,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: errorMessage,
      toolType: tool.toolType,
      errors: [errorMessage],
    }
  }
}

/**
 * Execute create customer
 */
function executeCreateCustomer(input: SalesToolInput): CustomerContext {
  return createCustomerContext(
    input.params.name as string,
    (input.params.status as CustomerStatus) || 'new',
    {
      priority: input.params.priority as CustomerPriority,
      source: input.params.source as LeadSource,
      industry: input.params.industry as string,
      companySize: input.params.companySize as string,
      location: input.params.location as string,
      website: input.params.website as string,
      phone: input.params.phone as string,
      email: input.params.email as string,
      address: input.params.address as string,
      tags: input.params.tags as string[],
      notes: input.params.notes as string,
      assignedTo: input.userId,
      assignedToName: input.userName,
    }
  )
}

/**
 * Execute update customer
 */
function executeUpdateCustomer(input: SalesToolInput): CustomerContext {
  const context = input.context as CustomerContext
  return {
    ...context,
    ...input.params,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Get success message for tool type
 */
function getSuccessMessage(toolType: SalesToolType): string {
  const messages: Record<SalesToolType, string> = {
    create_customer: '客户已创建',
    update_customer: '客户已更新',
    delete_customer: '客户已删除',
    create_lead: '线索已创建',
    update_lead: '线索已更新',
    convert_lead: '线索已转化为商机',
    create_opportunity: '商机已创建',
    update_opportunity: '商机已更新',
    create_followup: '跟进已创建',
    update_followup: '跟进已更新',
    complete_followup: '跟进已完成',
    query_customer: '查询成功',
    query_lead: '查询成功',
    query_opportunity: '查询成功',
    generate_summary: '摘要已生成',
    fill_followup_form: '表单已填充',
  }
  return messages[toolType] || '操作成功'
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate customer summary
 */
export function generateCustomerSummary(
  customer: CustomerContext,
  options: SalesSummaryOptions = { summaryType: 'brief' }
): CustomerSummary {
  const activeOpportunities = customer.opportunities.filter(
    o => o.status !== 'closed_won' && o.status !== 'closed_lost'
  )
  const activeValue = activeOpportunities.reduce((sum, o) => sum + o.value, 0)
  const totalRevenue = customer.opportunities
    .filter(o => o.status === 'closed_won')
    .reduce((sum, o) => sum + o.value, 0)

  const primaryContact = customer.contacts.find(c => c.isPrimary)
  const pendingFollowUps = customer.followUps.filter(f => f.status === 'scheduled')
  const nextFollowUp = pendingFollowUps.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )[0]

  const keyInsights: string[] = []
  if (customer.priority === 'vip') {
    keyInsights.push('VIP客户，需要重点维护')
  }
  if (activeOpportunities.length > 3) {
    keyInsights.push(`有 ${activeOpportunities.length} 个活跃商机`)
  }
  if (pendingFollowUps.some(f => new Date(f.scheduledAt) < new Date())) {
    keyInsights.push('有逾期未完成的跟进任务')
  }

  return {
    summaryId: generateSalesSummaryId(),
    customerId: customer.customerId,
    customerName: customer.name,
    status: customer.status,
    priority: customer.priority,
    industry: customer.industry,
    location: customer.location,
    primaryContact: options.includeContacts ? primaryContact : undefined,
    leadCount: customer.leads.length,
    opportunityCount: customer.opportunities.length,
    activeOpportunityValue: activeValue,
    totalRevenue,
    followUpCount: customer.followUps.length,
    nextFollowUp: options.includeFollowUps ? nextFollowUp : undefined,
    lastActivity: customer.updatedAt,
    createdAt: customer.createdAt,
    tags: customer.tags,
    keyInsights: options.includeInsights ? keyInsights : [],
  }
}

/**
 * Generate lead summary context
 */
export function generateLeadSummaryContext(
  lead: LeadContext,
  options: SalesSummaryOptions = { summaryType: 'brief' }
): LeadSummaryContext {
  const pendingFollowUps = lead.followUps.filter(f => f.status === 'scheduled')
  const nextFollowUp = pendingFollowUps.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )[0]

  return {
    summaryId: generateSalesSummaryId(),
    leadId: lead.leadId,
    title: lead.title,
    customerName: lead.customerName,
    status: lead.status,
    source: lead.source,
    estimatedValue: lead.estimatedValue,
    probability: lead.probability,
    contactCount: lead.contacts.length,
    followUpCount: lead.followUps.length,
    nextFollowUp: options.includeFollowUps ? nextFollowUp : undefined,
    createdAt: lead.createdAt,
    tags: lead.tags,
  }
}

/**
 * Generate opportunity summary context
 */
export function generateOpportunitySummaryContext(
  opportunity: OpportunityContext,
  options: SalesSummaryOptions = { summaryType: 'brief' }
): OpportunitySummaryContext {
  const pendingFollowUps = opportunity.followUps.filter(f => f.status === 'scheduled')
  const nextFollowUp = pendingFollowUps.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )[0]

  let daysToClose: number | undefined
  if (opportunity.expectedCloseDate) {
    daysToClose = Math.ceil(
      (new Date(opportunity.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  }

  return {
    summaryId: generateSalesSummaryId(),
    opportunityId: opportunity.opportunityId,
    name: opportunity.name,
    customerName: opportunity.customerName,
    status: opportunity.status,
    value: opportunity.value,
    probability: opportunity.probability,
    expectedCloseDate: opportunity.expectedCloseDate,
    daysToClose,
    contactCount: opportunity.contacts.length,
    followUpCount: opportunity.followUps.length,
    nextFollowUp: options.includeFollowUps ? nextFollowUp : undefined,
    createdAt: opportunity.createdAt,
    tags: opportunity.tags,
  }
}

/**
 * Generate follow-up summary context
 */
export function generateFollowUpSummaryContext(
  followUp: FollowUpContext,
  _options: SalesSummaryOptions = { summaryType: 'brief' }
): FollowUpSummaryContext {
  const isOverdue = followUp.status === 'scheduled' &&
    new Date(followUp.scheduledAt) < new Date()

  return {
    summaryId: generateSalesSummaryId(),
    followUpId: followUp.followUpId,
    type: followUp.type,
    subject: followUp.subject,
    status: followUp.status,
    scheduledAt: followUp.scheduledAt,
    completedAt: followUp.completedAt,
    customerName: followUp.customerName,
    leadTitle: followUp.leadTitle,
    opportunityName: followUp.opportunityName,
    contactCount: followUp.contacts.length,
    isOverdue,
    createdAt: followUp.createdAt,
  }
}

// ============================================================================
// Writeback Integration
// ============================================================================

/**
 * Create sales writeback action
 */
export function createSalesWritebackAction(
  sessionId: string,
  contextId: string,
  contextType: 'customer' | 'lead' | 'opportunity' | 'followup',
  writebackType: 'summary' | 'status' | 'form' | 'history' | 'workbench_card',
  content: Record<string, unknown>
): SalesWritebackAction {
  return {
    actionId: generateSalesWritebackId(),
    sessionId,
    contextId,
    contextType,
    writebackType,
    content,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Prepare customer summary for writeback
 */
export function prepareCustomerSummaryWriteback(
  summary: CustomerSummary
): Record<string, unknown> {
  return {
    customerId: summary.customerId,
    customerName: summary.customerName,
    status: summary.status,
    priority: summary.priority,
    industry: summary.industry,
    location: summary.location,
    leadCount: summary.leadCount,
    opportunityCount: summary.opportunityCount,
    activeValue: summary.activeOpportunityValue,
    totalRevenue: summary.totalRevenue,
    followUpCount: summary.followUpCount,
    tags: summary.tags,
    keyInsights: summary.keyInsights,
  }
}

/**
 * Prepare follow-up form for writeback
 */
export function prepareFollowUpFormWriteback(
  followUp: FollowUpContext
): Record<string, unknown> {
  return {
    followUpId: followUp.followUpId,
    type: followUp.type,
    subject: followUp.subject,
    description: followUp.description,
    scheduledAt: followUp.scheduledAt,
    customerId: followUp.customerId,
    customerName: followUp.customerName,
    leadId: followUp.leadId,
    leadTitle: followUp.leadTitle,
    opportunityId: followUp.opportunityId,
    opportunityName: followUp.opportunityName,
    contacts: followUp.contacts,
  }
}

/**
 * Prepare workbench card writeback
 */
export function prepareWorkbenchCardWriteback(
  context: CustomerContext | LeadContext | OpportunityContext,
  cardType: 'metric' | 'list' | 'chart'
): Record<string, unknown> {
  if ('customerId' in context) {
    // Customer context
    const customer = context as CustomerContext
    return {
      cardType,
      title: customer.name,
      subtitle: customer.industry || '客户',
      status: customer.status,
      metrics: {
        opportunities: customer.opportunities.length,
        leads: customer.leads.length,
        followUps: customer.followUps.length,
      },
    }
  } else if ('leadId' in context) {
    // Lead context
    const lead = context as LeadContext
    return {
      cardType,
      title: lead.title,
      subtitle: lead.customerName || '销售线索',
      status: lead.status,
      metrics: {
        estimatedValue: lead.estimatedValue,
        probability: lead.probability,
      },
    }
  } else {
    // Opportunity context
    const opp = context as OpportunityContext
    return {
      cardType,
      title: opp.name,
      subtitle: opp.customerName,
      status: opp.status,
      metrics: {
        value: opp.value,
        probability: opp.probability,
      },
    }
  }
}

// ============================================================================
// Audit Integration
// ============================================================================

/**
 * Create sales audit entry
 */
export function createSalesAuditEntry(
  sessionId: string,
  targetId: string,
  targetType: 'customer' | 'lead' | 'opportunity' | 'followup',
  operation: string,
  actor: string,
  actorId: string,
  success: boolean,
  details?: Record<string, unknown>
): SalesAuditEntry {
  return {
    entryId: generateSalesAuditId(),
    sessionId,
    targetId,
    targetType,
    operation,
    actor,
    actorId,
    timestamp: new Date().toISOString(),
    success,
    details,
  }
}

/**
 * Add audit entry to state
 */
export function addAuditEntryToState(
  state: SalesPilotState,
  entry: SalesAuditEntry
): void {
  state.auditEntries.push(entry)
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeCustomerContext(context: CustomerContext): string {
  return JSON.stringify(context)
}

export function deserializeCustomerContext(json: string): CustomerContext {
  return JSON.parse(json)
}

export function serializeSalesTool(tool: SalesTool): string {
  return JSON.stringify(tool)
}

export function deserializeSalesTool(json: string): SalesTool {
  return JSON.parse(json)
}

export function serializeCustomerSummary(summary: CustomerSummary): string {
  return JSON.stringify(summary)
}

export function deserializeCustomerSummary(json: string): CustomerSummary {
  return JSON.parse(json)
}

export function serializeSalesPilotState(state: SalesPilotState): string {
  return JSON.stringify({
    ...state,
    availableTools: Array.from(state.availableTools.entries()),
  })
}

export function deserializeSalesPilotState(json: string): SalesPilotState {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    availableTools: new Map(parsed.availableTools),
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

const STATUS_NAMES: Record<string, string> = {
  // Customer status
  potential: '潜在客户',
  new: '新客户',
  active: '活跃',
  inactive: '不活跃',
  churned: '已流失',
  // Lead status
  contacted: '已联系',
  qualified: '已验证',
  proposal: '已报价',
  negotiation: '谈判中',
  won: '成交',
  lost: '失败',
  disqualified: '无效',
  // Opportunity status
  prospecting: '寻找机会',
  qualification: '验证中',
  closed_won: '成交',
  closed_lost: '失败',
  // Follow-up status
  scheduled: '已安排',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  overdue: '已逾期',
}

const PRIORITY_NAMES: Record<CustomerPriority, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  vip: 'VIP',
}

/**
 * Format customer context
 */
export function formatCustomerContext(context: CustomerContext): string {
  const lines = [
    `客户: ${context.name}`,
    `状态: ${STATUS_NAMES[context.status] || context.status}`,
    `优先级: ${PRIORITY_NAMES[context.priority]}`,
    `行业: ${context.industry || '未知'}`,
    `联系人: ${context.contacts.length} 人`,
    `线索: ${context.leads.length} 个`,
    `商机: ${context.opportunities.length} 个`,
    `跟进: ${context.followUps.length} 个`,
  ]
  if (context.assignedToName) {
    lines.push(`负责人: ${context.assignedToName}`)
  }
  return lines.join('\n')
}

/**
 * Format sales tool
 */
export function formatSalesTool(tool: SalesTool): string {
  const parts = [tool.name]
  if (tool.riskLevel !== 'low') {
    parts.push(`[${tool.riskLevel === 'high' ? '高风险' : '中风险'}]`)
  }
  if (tool.requiresConfirmation) {
    parts.push('[需确认]')
  }
  return parts.join(' ')
}

/**
 * Format customer summary
 */
export function formatCustomerSummary(summary: CustomerSummary): string {
  const lines = [
    `=== 客户摘要 ===`,
    `客户: ${summary.customerName}`,
    `状态: ${STATUS_NAMES[summary.status] || summary.status}`,
    `优先级: ${PRIORITY_NAMES[summary.priority]}`,
    `商机: ${summary.opportunityCount} 个 (活跃: ¥${summary.activeOpportunityValue.toLocaleString()})`,
    `总收入: ¥${summary.totalRevenue.toLocaleString()}`,
    `跟进: ${summary.followUpCount} 个`,
  ]
  if (summary.keyInsights.length > 0) {
    lines.push(`关键洞察:`)
    summary.keyInsights.forEach(insight => lines.push(`  - ${insight}`))
  }
  return lines.join('\n')
}

/**
 * Format tool execution record
 */
export function formatToolExecutionRecord(record: SalesToolExecutionRecord): string {
  const status = record.success ? '✓' : '✗'
  return `${status} ${record.toolType} by ${record.userName} (${record.durationMs}ms)`
}
