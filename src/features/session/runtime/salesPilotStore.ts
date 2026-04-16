/**
 * Sales Pilot - Writeback, Audit, Serialization & Debug
 * Task 89: Story 50.2 - Sales Pilot Integration
 */

import type {
  CustomerContext,
  CustomerSummary,
  CustomerPriority,
  LeadContext,
  OpportunityContext,
  FollowUpContext,
  SalesTool,
  SalesPilotState,
  SalesToolExecutionRecord,
  SalesWritebackAction,
  SalesAuditEntry,
} from './salesPilotTypes'
import {
  generateSalesWritebackId,
  generateSalesAuditId,
} from './salesPilotExecution'

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
