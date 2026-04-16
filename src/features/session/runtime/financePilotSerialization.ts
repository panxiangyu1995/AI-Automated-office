/**
 * Finance Pilot - Serialization and Debug Formatting
 * Extracted from financePilot.ts for file size compliance (<800 lines)
 */

import type {
  InvoiceStatus, InvoiceType, ExpenseStatus, ExpenseCategory,
  BudgetStatus, BudgetPeriod, PaymentStatus, PaymentMethod,
  InvoiceContext, ExpenseContext, BudgetContext, PaymentContext,
  FinanceTool, FinanceSummary, FinanceToolExecutionRecord, FinancePilotState,
} from './financePilotTypes'

// ============================================================================
// Debug Name Mappers
// ============================================================================

const INVOICE_STATUS_NAMES: Record<InvoiceStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  rejected: '已拒绝',
  paid: '已付款',
  partial: '部分付款',
  cancelled: '已取消',
  overdue: '已逾期',
}

const INVOICE_TYPE_NAMES: Record<InvoiceType, string> = {
  sales: '销售发票',
  purchase: '采购发票',
  credit_note: '贷项通知单',
  debit_note: '借项通知单',
  proforma: '形式发票',
}

const EXPENSE_STATUS_NAMES: Record<ExpenseStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  pending: '待审批',
  approved: '已审批',
  rejected: '已拒绝',
  reimbursed: '已报销',
  cancelled: '已取消',
}

const EXPENSE_CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  travel: '差旅',
  meals: '餐饮',
  office: '办公',
  equipment: '设备',
  software: '软件',
  marketing: '市场',
  training: '培训',
  entertainment: '娱乐',
  other: '其他',
}

const BUDGET_STATUS_NAMES: Record<BudgetStatus, string> = {
  active: '进行中',
  exceeded: '超支',
  closed: '已关闭',
  draft: '草稿',
}

const BUDGET_PERIOD_NAMES: Record<BudgetPeriod, string> = {
  monthly: '月度',
  quarterly: '季度',
  yearly: '年度',
  custom: '自定义',
}

const PAYMENT_STATUS_NAMES: Record<PaymentStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  refunded: '已退款',
  cancelled: '已取消',
}

const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  bank_transfer: '银行转账',
  credit_card: '信用卡',
  cash: '现金',
  check: '支票',
  online: '在线支付',
}

export function getInvoiceStatusName(status: InvoiceStatus): string {
  return INVOICE_STATUS_NAMES[status] || status
}

export function getInvoiceTypeName(type: InvoiceType): string {
  return INVOICE_TYPE_NAMES[type] || type
}

export function getExpenseStatusName(status: ExpenseStatus): string {
  return EXPENSE_STATUS_NAMES[status] || status
}

export function getExpenseCategoryName(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_NAMES[category] || category
}

export function getBudgetStatusName(status: BudgetStatus): string {
  return BUDGET_STATUS_NAMES[status] || status
}

export function getBudgetPeriodName(period: BudgetPeriod): string {
  return BUDGET_PERIOD_NAMES[period] || period
}

export function getPaymentStatusName(status: PaymentStatus): string {
  return PAYMENT_STATUS_NAMES[status] || status
}

export function getPaymentMethodName(method: PaymentMethod): string {
  return PAYMENT_METHOD_NAMES[method] || method
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeInvoiceContext(context: InvoiceContext): string {
  return JSON.stringify(context)
}

export function deserializeInvoiceContext(json: string): InvoiceContext {
  return JSON.parse(json) as InvoiceContext
}

export function serializeExpenseContext(context: ExpenseContext): string {
  return JSON.stringify(context)
}

export function deserializeExpenseContext(json: string): ExpenseContext {
  return JSON.parse(json) as ExpenseContext
}

export function serializeBudgetContext(context: BudgetContext): string {
  return JSON.stringify(context)
}

export function deserializeBudgetContext(json: string): BudgetContext {
  return JSON.parse(json) as BudgetContext
}

export function serializePaymentContext(context: PaymentContext): string {
  return JSON.stringify(context)
}

export function deserializePaymentContext(json: string): PaymentContext {
  return JSON.parse(json) as PaymentContext
}

export function serializeFinanceTool(tool: FinanceTool): string {
  return JSON.stringify(tool)
}

export function deserializeFinanceTool(json: string): FinanceTool {
  return JSON.parse(json) as FinanceTool
}

export function serializeFinanceSummary(summary: FinanceSummary): string {
  return JSON.stringify(summary)
}

export function deserializeFinanceSummary(json: string): FinanceSummary {
  return JSON.parse(json) as FinanceSummary
}

export function serializeFinancePilotState(state: FinancePilotState): string {
  return JSON.stringify({
    ...state,
    availableTools: Array.from(state.availableTools.entries()),
  })
}

export function deserializeFinancePilotState(json: string): FinancePilotState {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    availableTools: new Map(parsed.availableTools),
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

export function formatInvoiceContext(context: InvoiceContext): string {
  return [
    `发票编号: ${context.invoiceNumber}`,
    `类型: ${getInvoiceTypeName(context.type)}`,
    `状态: ${getInvoiceStatusName(context.status)}`,
    `金额: ${context.amount} ${context.currency}`,
    `开票日期: ${context.issueDate}`,
    `到期日期: ${context.dueDate}`,
    context.customerName ? `客户: ${context.customerName}` : '',
    context.vendorName ? `供应商: ${context.vendorName}` : '',
  ].filter(Boolean).join('\n')
}

export function formatExpenseContext(context: ExpenseContext): string {
  return [
    `费用编号: ${context.expenseNumber}`,
    `类别: ${getExpenseCategoryName(context.category)}`,
    `状态: ${getExpenseStatusName(context.status)}`,
    `金额: ${context.amount} ${context.currency}`,
    `费用日期: ${context.expenseDate}`,
    context.description ? `描述: ${context.description}` : '',
    context.vendor ? `供应商: ${context.vendor}` : '',
  ].filter(Boolean).join('\n')
}

export function formatBudgetContext(context: BudgetContext): string {
  const usagePercent = (context.usedAmount / context.totalAmount) * 100
  return [
    `预算名称: ${context.name}`,
    `周期: ${getBudgetPeriodName(context.period)}`,
    `状态: ${getBudgetStatusName(context.status)}`,
    `预算总额: ${context.totalAmount}`,
    `已使用: ${context.usedAmount} (${usagePercent.toFixed(1)}%)`,
    `剩余: ${context.remainingAmount}`,
  ].join('\n')
}

export function formatPaymentContext(context: PaymentContext): string {
  return [
    `付款编号: ${context.paymentNumber}`,
    `方式: ${getPaymentMethodName(context.method)}`,
    `状态: ${getPaymentStatusName(context.status)}`,
    `金额: ${context.amount} ${context.currency}`,
    context.invoiceNumber ? `关联发票: ${context.invoiceNumber}` : '',
    context.transactionId ? `交易号: ${context.transactionId}` : '',
  ].filter(Boolean).join('\n')
}

export function formatFinanceTool(tool: FinanceTool): string {
  return [
    `工具: ${tool.name}`,
    `类型: ${tool.toolType}`,
    `权限: ${tool.requiredPermission}`,
    `风险等级: ${tool.riskLevel}`,
    tool.requiresConfirmation ? '需要确认: 是' : '',
  ].filter(Boolean).join('\n')
}

export function formatFinanceSummary(summary: FinanceSummary): string {
  const fields = summary.keyFields
    .map(f => `${f.label}: ${f.value}`)
    .join('\n')
  return `【${summary.title}】\n${fields}`
}

export function formatToolExecutionRecord(record: FinanceToolExecutionRecord): string {
  return [
    `工具类型: ${record.toolType}`,
    `执行时间: ${record.timestamp}`,
    `执行人: ${record.userName || record.userId}`,
    `结果: ${record.success ? '成功' : '失败'}`,
    `耗时: ${record.durationMs}ms`,
  ].join('\n')
}
