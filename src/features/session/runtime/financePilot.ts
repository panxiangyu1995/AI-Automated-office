/**
 * Finance Pilot Integration
 *
 * Story 50.3 - Finance Pilot Integration
 * Validates the common Agent runtime in the finance scenario.
 *
 * Features:
 * - Invoice processing and management
 * - Expense tracking and approval
 * - Budget monitoring and control
 * - Payment processing
 * - Financial reporting and summaries
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'

// ============================================================================
// Constants
// ============================================================================

const INVOICE_ID_PREFIX = 'fin-invoice'
const EXPENSE_ID_PREFIX = 'fin-expense'
const BUDGET_ID_PREFIX = 'fin-budget'
const PAYMENT_ID_PREFIX = 'fin-payment'
const SUMMARY_ID_PREFIX = 'fin-summary'
const RECORD_ID_PREFIX = 'fin-record'
const WRITEBACK_ID_PREFIX = 'fin-writeback'
const TOOL_ID_PREFIX = 'fin-tool'

// ============================================================================
// Enums and Types
// ============================================================================

/**
 * Invoice status
 */
export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'partial'
  | 'cancelled'
  | 'overdue'

/**
 * Invoice type
 */
export type InvoiceType =
  | 'sales'
  | 'purchase'
  | 'credit_note'
  | 'debit_note'
  | 'proforma'

/**
 * Expense status
 */
export type ExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reimbursed'
  | 'cancelled'

/**
 * Expense category
 */
export type ExpenseCategory =
  | 'travel'
  | 'meals'
  | 'office'
  | 'equipment'
  | 'software'
  | 'marketing'
  | 'training'
  | 'entertainment'
  | 'other'

/**
 * Budget status
 */
export type BudgetStatus =
  | 'active'
  | 'exceeded'
  | 'closed'
  | 'draft'

/**
 * Budget period
 */
export type BudgetPeriod =
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom'

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled'

/**
 * Payment method
 */
export type PaymentMethod =
  | 'bank_transfer'
  | 'credit_card'
  | 'cash'
  | 'check'
  | 'online'

/**
 * Finance tool type
 */
export type FinanceToolType =
  // Invoice operations
  | 'create_invoice'
  | 'update_invoice'
  | 'submit_invoice'
  | 'approve_invoice'
  | 'reject_invoice'
  | 'cancel_invoice'
  | 'query_invoice'
  // Expense operations
  | 'create_expense'
  | 'update_expense'
  | 'submit_expense'
  | 'approve_expense'
  | 'reject_expense'
  | 'query_expense'
  // Budget operations
  | 'create_budget'
  | 'update_budget'
  | 'check_budget'
  | 'query_budget'
  // Payment operations
  | 'create_payment'
  | 'process_payment'
  | 'query_payment'
  // Reporting
  | 'generate_summary'
  | 'fill_expense_form'

/**
 * Invoice context
 */
export interface InvoiceContext {
  invoiceId: string
  invoiceNumber: string
  type: InvoiceType
  status: InvoiceStatus
  customerId?: string
  customerName?: string
  vendorId?: string
  vendorName?: string
  amount: number
  currency: string
  taxAmount?: number
  taxRate?: number
  issueDate: string
  dueDate: string
  paidAmount?: number
  description?: string
  lineItems?: InvoiceLineItem[]
  attachments?: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName?: string
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  itemId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  taxRate?: number
}

/**
 * Expense context
 */
export interface ExpenseContext {
  expenseId: string
  expenseNumber: string
  category: ExpenseCategory
  status: ExpenseStatus
  amount: number
  currency: string
  expenseDate: string
  description?: string
  receiptUrl?: string
  vendor?: string
  projectId?: string
  projectName?: string
  departmentId?: string
  departmentName?: string
  approvedBy?: string
  approvedByName?: string
  approvedAt?: string
  reimbursedAt?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName?: string
}

/**
 * Budget context
 */
export interface BudgetContext {
  budgetId: string
  name: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  period: BudgetPeriod
  status: BudgetStatus
  totalAmount: number
  usedAmount: number
  remainingAmount: number
  startDate: string
  endDate: string
  categories?: BudgetCategory[]
  alerts?: BudgetAlert[]
  createdAt: string
  updatedAt: string
}

/**
 * Budget category
 */
export interface BudgetCategory {
  categoryId: string
  name: string
  allocatedAmount: number
  usedAmount: number
}

/**
 * Budget alert
 */
export interface BudgetAlert {
  alertId: string
  threshold: number
  triggered: boolean
  triggeredAt?: string
}

/**
 * Payment context
 */
export interface PaymentContext {
  paymentId: string
  paymentNumber: string
  invoiceId?: string
  invoiceNumber?: string
  status: PaymentStatus
  method: PaymentMethod
  amount: number
  currency: string
  payerId?: string
  payerName?: string
  payeeId?: string
  payeeName?: string
  transactionId?: string
  paymentDate?: string
  description?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName?: string
}

/**
 * Finance tool definition
 */
export interface FinanceTool {
  toolId: string
  toolType: FinanceToolType
  name: string
  description: string
  requiredPermission: PermissionLevel
  requiresConfirmation: boolean
  isDestructive: boolean
  riskLevel: 'low' | 'medium' | 'high'
  confirmationMessage?: string
  applicableStatuses?: string[]
  validationRules?: FinanceValidationRule[]
}

/**
 * Finance validation rule
 */
export interface FinanceValidationRule {
  field: string
  rule: 'required' | 'email' | 'phone' | 'url' | 'minLength' | 'maxLength' | 'pattern' | 'minValue' | 'maxValue'
  value?: string | number
  message: string
}

/**
 * Finance tool input
 */
export interface FinanceToolInput {
  toolId: string
  toolType: FinanceToolType
  userId: string
  userName?: string
  userPermission: PermissionLevel
  params: Record<string, unknown>
  contextType?: 'invoice' | 'expense' | 'budget' | 'payment'
  context?: InvoiceContext | ExpenseContext | BudgetContext | PaymentContext
  dryRun?: boolean
}

/**
 * Finance tool output
 */
export interface FinanceToolOutput {
  success: boolean
  message: string
  toolType: FinanceToolType
  updatedContext?: InvoiceContext | ExpenseContext | BudgetContext | PaymentContext
  summary?: FinanceSummary
  requiresConfirmation?: boolean
  confirmationMessage?: string
  writebackActions?: FinanceWritebackAction[]
  errors?: string[]
  warnings?: string[]
}

/**
 * Finance summary
 */
export interface FinanceSummary {
  summaryId: string
  summaryType: 'invoice' | 'expense' | 'budget' | 'payment' | 'overview'
  title: string
  keyFields: FinanceSummaryField[]
  amount?: number
  currency?: string
  status?: string
  createdAt: string
  createdBy: string
}

/**
 * Finance summary field
 */
export interface FinanceSummaryField {
  key: string
  label: string
  value: string | number
  type?: 'text' | 'amount' | 'date' | 'status' | 'percentage'
}

/**
 * Summary writeback action for finance
 */
export interface SummaryWritebackAction {
  actionId: string
  actionType: 'generate_summary'
  summaryType: 'invoice' | 'expense' | 'budget' | 'payment' | 'financial'
  data: Record<string, unknown>
}

/**
 * Form writeback action for finance
 */
export interface FormWritebackAction {
  actionId: string
  actionType: 'fill_form'
  formType: 'expense' | 'invoice' | 'payment'
  data: Record<string, unknown>
}

/**
 * Finance writeback action
 */
export type FinanceWritebackAction =
  | SummaryWritebackAction
  | FormWritebackAction
  | {
      actionId: string
      actionType: 'update_list' | 'update_status' | 'update_amount'
      target: string
      data: Record<string, unknown>
    }

/**
 * Finance tool execution record
 */
export interface FinanceToolExecutionRecord {
  recordId: string
  toolId: string
  toolType: FinanceToolType
  timestamp: string
  userId: string
  userName?: string
  success: boolean
  durationMs: number
  params: Record<string, unknown>
  result?: Record<string, unknown>
  errors?: string[]
}

/**
 * Finance pilot contract
 */
export interface FinancePilotContract {
  contractId: string
  allowedInvoiceStatuses: InvoiceStatus[]
  allowedExpenseStatuses: ExpenseStatus[]
  allowedBudgetStatuses: BudgetStatus[]
  allowedPaymentStatuses: PaymentStatus[]
  allowedExpenseCategories: ExpenseCategory[]
  allowedPaymentMethods: PaymentMethod[]
  defaultCurrency: string
  maxInvoiceAmount?: number
  maxExpenseAmount?: number
  requireApprovalThreshold?: number
}

/**
 * Finance pilot state
 */
export interface FinancePilotState {
  currentInvoice?: InvoiceContext
  currentExpense?: ExpenseContext
  currentBudget?: BudgetContext
  currentPayment?: PaymentContext
  availableTools: Map<string, FinanceTool>
  toolHistory: FinanceToolExecutionRecord[]
  contract: FinancePilotContract
}

// ============================================================================
// ID Generation
// ============================================================================

export function generateInvoiceId(): string {
  return `${INVOICE_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateExpenseId(): string {
  return `${EXPENSE_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateBudgetId(): string {
  return `${BUDGET_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generatePaymentId(): string {
  return `${PAYMENT_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateFinanceSummaryId(): string {
  return `${SUMMARY_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateFinanceToolId(): string {
  return `${TOOL_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateFinanceRecordId(): string {
  return `${RECORD_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateFinanceWritebackId(): string {
  return `${WRITEBACK_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ============================================================================
// Context Factory Functions
// ============================================================================

export function createInvoiceContext(
  invoiceNumber: string,
  type: InvoiceType,
  amount: number,
  currency: string,
  options: Partial<InvoiceContext> = {}
): InvoiceContext {
  const now = new Date().toISOString()
  return {
    invoiceId: generateInvoiceId(),
    invoiceNumber,
    type,
    status: 'draft',
    amount,
    currency,
    issueDate: now.split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy || 'system',
    ...options,
  }
}

export function createExpenseContext(
  expenseNumber: string,
  category: ExpenseCategory,
  amount: number,
  currency: string,
  options: Partial<ExpenseContext> = {}
): ExpenseContext {
  const now = new Date().toISOString()
  return {
    expenseId: generateExpenseId(),
    expenseNumber,
    category,
    status: 'draft',
    amount,
    currency,
    expenseDate: now.split('T')[0],
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy || 'system',
    ...options,
  }
}

export function createBudgetContext(
  name: string,
  totalAmount: number,
  period: BudgetPeriod,
  options: Partial<BudgetContext> = {}
): BudgetContext {
  const now = new Date().toISOString()
  return {
    budgetId: generateBudgetId(),
    name,
    period,
    status: 'draft',
    totalAmount,
    usedAmount: 0,
    remainingAmount: totalAmount,
    startDate: now.split('T')[0],
    endDate: calculatePeriodEnd(now, period),
    createdAt: now,
    updatedAt: now,
    ...options,
  }
}

export function createPaymentContext(
  paymentNumber: string,
  amount: number,
  currency: string,
  method: PaymentMethod,
  options: Partial<PaymentContext> = {}
): PaymentContext {
  const now = new Date().toISOString()
  return {
    paymentId: generatePaymentId(),
    paymentNumber,
    status: 'pending',
    method,
    amount,
    currency,
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy || 'system',
    ...options,
  }
}

function calculatePeriodEnd(startDate: string, period: BudgetPeriod): string {
  const start = new Date(startDate)
  switch (period) {
    case 'monthly':
      start.setMonth(start.getMonth() + 1)
      break
    case 'quarterly':
      start.setMonth(start.getMonth() + 3)
      break
    case 'yearly':
      start.setFullYear(start.getFullYear() + 1)
      break
    default:
      start.setMonth(start.getMonth() + 1)
  }
  return start.toISOString().split('T')[0]
}

// ============================================================================
// Tool Factory Functions
// ============================================================================

export function createFinanceTool(
  toolType: FinanceToolType,
  options: Partial<FinanceTool> = {}
): FinanceTool {
  const defaults: Record<FinanceToolType, Partial<FinanceTool>> = {
    // Invoice operations
    create_invoice: {
      name: '创建发票',
      description: '创建新的发票记录',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    update_invoice: {
      name: '更新发票',
      description: '更新发票信息',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    submit_invoice: {
      name: '提交发票',
      description: '提交发票进行审批',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    approve_invoice: {
      name: '审批发票',
      description: '审批通过发票',
      requiredPermission: 'admin',
      requiresConfirmation: true,
      isDestructive: false,
      riskLevel: 'high',
      confirmationMessage: '确认审批通过此发票？审批后将进入付款流程。',
    },
    reject_invoice: {
      name: '拒绝发票',
      description: '拒绝发票申请',
      requiredPermission: 'admin',
      requiresConfirmation: true,
      isDestructive: false,
      riskLevel: 'medium',
      confirmationMessage: '确认拒绝此发票？',
    },
    cancel_invoice: {
      name: '取消发票',
      description: '取消发票',
      requiredPermission: 'delete',
      requiresConfirmation: true,
      isDestructive: true,
      riskLevel: 'high',
      confirmationMessage: '确认取消此发票？此操作不可撤销。',
    },
    query_invoice: {
      name: '查询发票',
      description: '查询发票信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    // Expense operations
    create_expense: {
      name: '创建费用',
      description: '创建新的费用记录',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    update_expense: {
      name: '更新费用',
      description: '更新费用信息',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    submit_expense: {
      name: '提交费用',
      description: '提交费用进行审批',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    approve_expense: {
      name: '审批费用',
      description: '审批通过费用报销',
      requiredPermission: 'admin',
      requiresConfirmation: true,
      isDestructive: false,
      riskLevel: 'high',
      confirmationMessage: '确认审批通过此费用报销？',
    },
    reject_expense: {
      name: '拒绝费用',
      description: '拒绝费用报销申请',
      requiredPermission: 'admin',
      requiresConfirmation: true,
      isDestructive: false,
      riskLevel: 'medium',
      confirmationMessage: '确认拒绝此费用报销？',
    },
    query_expense: {
      name: '查询费用',
      description: '查询费用信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    // Budget operations
    create_budget: {
      name: '创建预算',
      description: '创建新的预算',
      requiredPermission: 'admin',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'medium',
    },
    update_budget: {
      name: '更新预算',
      description: '更新预算信息',
      requiredPermission: 'admin',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'medium',
    },
    check_budget: {
      name: '检查预算',
      description: '检查预算使用情况',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    query_budget: {
      name: '查询预算',
      description: '查询预算信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    // Payment operations
    create_payment: {
      name: '创建付款',
      description: '创建新的付款记录',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'medium',
    },
    process_payment: {
      name: '处理付款',
      description: '处理执行付款',
      requiredPermission: 'admin',
      requiresConfirmation: true,
      isDestructive: true,
      riskLevel: 'high',
      confirmationMessage: '确认执行此付款？此操作将实际划转资金。',
    },
    query_payment: {
      name: '查询付款',
      description: '查询付款信息',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    // Reporting
    generate_summary: {
      name: '生成摘要',
      description: '生成财务摘要报告',
      requiredPermission: 'read',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
    fill_expense_form: {
      name: '填充费用表单',
      description: '自动填充费用报销表单',
      requiredPermission: 'write',
      requiresConfirmation: false,
      isDestructive: false,
      riskLevel: 'low',
    },
  }

  const defaultConfig = defaults[toolType]
  return {
    toolId: generateFinanceToolId(),
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

// ============================================================================
// Contract and State Factory Functions
// ============================================================================

export function createFinancePilotContract(
  options: Partial<FinancePilotContract> = {}
): FinancePilotContract {
  return {
    contractId: `finance-contract-${Date.now()}`,
    allowedInvoiceStatuses: options.allowedInvoiceStatuses || [
      'draft', 'pending', 'approved', 'rejected', 'paid', 'partial', 'cancelled', 'overdue',
    ],
    allowedExpenseStatuses: options.allowedExpenseStatuses || [
      'draft', 'submitted', 'pending', 'approved', 'rejected', 'reimbursed', 'cancelled',
    ],
    allowedBudgetStatuses: options.allowedBudgetStatuses || [
      'active', 'exceeded', 'closed', 'draft',
    ],
    allowedPaymentStatuses: options.allowedPaymentStatuses || [
      'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled',
    ],
    allowedExpenseCategories: options.allowedExpenseCategories || [
      'travel', 'meals', 'office', 'equipment', 'software', 'marketing', 'training', 'entertainment', 'other',
    ],
    allowedPaymentMethods: options.allowedPaymentMethods || [
      'bank_transfer', 'credit_card', 'cash', 'check', 'online',
    ],
    defaultCurrency: options.defaultCurrency || 'CNY',
    maxInvoiceAmount: options.maxInvoiceAmount,
    maxExpenseAmount: options.maxExpenseAmount,
    requireApprovalThreshold: options.requireApprovalThreshold,
  }
}

export function createFinancePilotState(
  contract?: FinancePilotContract
): FinancePilotState {
  return {
    availableTools: new Map(),
    toolHistory: [],
    contract: contract || createFinancePilotContract(),
  }
}

// ============================================================================
// Tool Registration
// ============================================================================

export function getDefaultFinanceTools(): FinanceTool[] {
  const toolTypes: FinanceToolType[] = [
    'create_invoice',
    'update_invoice',
    'submit_invoice',
    'approve_invoice',
    'reject_invoice',
    'cancel_invoice',
    'query_invoice',
    'create_expense',
    'update_expense',
    'submit_expense',
    'approve_expense',
    'reject_expense',
    'query_expense',
    'create_budget',
    'update_budget',
    'check_budget',
    'query_budget',
    'create_payment',
    'process_payment',
    'query_payment',
    'generate_summary',
    'fill_expense_form',
  ]
  return toolTypes.map(type => createFinanceTool(type))
}

export function registerTool(state: FinancePilotState, tool: FinanceTool): void {
  state.availableTools.set(tool.toolId, tool)
}

export function registerDefaultTools(state: FinancePilotState): void {
  const tools = getDefaultFinanceTools()
  tools.forEach(tool => registerTool(state, tool))
}

export function getTool(state: FinancePilotState, toolId: string): FinanceTool | undefined {
  return state.availableTools.get(toolId)
}

export function getToolByType(state: FinancePilotState, toolType: FinanceToolType): FinanceTool | undefined {
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
  tool: FinanceTool,
  userPermission: PermissionLevel
): { allowed: boolean; reason?: string } {
  if (permissionSatisfies(userPermission, tool.requiredPermission)) {
    return { allowed: true }
  }
  return { allowed: false, reason: 'Insufficient permission' }
}

export function checkInvoiceStatus(
  contract: FinancePilotContract,
  status: InvoiceStatus
): boolean {
  return contract.allowedInvoiceStatuses.includes(status)
}

export function checkExpenseStatus(
  contract: FinancePilotContract,
  status: ExpenseStatus
): boolean {
  return contract.allowedExpenseStatuses.includes(status)
}

export function checkBudgetStatus(
  contract: FinancePilotContract,
  status: BudgetStatus
): boolean {
  return contract.allowedBudgetStatuses.includes(status)
}

export function checkPaymentStatus(
  contract: FinancePilotContract,
  status: PaymentStatus
): boolean {
  return contract.allowedPaymentStatuses.includes(status)
}

export function validateToolInput(
  input: FinanceToolInput,
  tool: FinanceTool,
  _contract: FinancePilotContract
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check permission
  const permCheck = checkToolPermission(tool, input.userPermission)
  if (!permCheck.allowed) {
    errors.push(permCheck.reason || 'Permission denied')
  }

  // Tool-specific validation
  switch (tool.toolType) {
    case 'create_invoice':
      if (!input.params.invoiceNumber) {
        errors.push('Invoice number is required')
      }
      if (!input.params.amount || (input.params.amount as number) <= 0) {
        errors.push('Valid amount is required')
      }
      break

    case 'update_invoice':
    case 'submit_invoice':
    case 'approve_invoice':
    case 'reject_invoice':
    case 'cancel_invoice':
      if (!input.context) {
        errors.push('Invoice context is required')
      }
      break

    case 'create_expense':
      if (!input.params.category) {
        errors.push('Expense category is required')
      }
      if (!input.params.amount || (input.params.amount as number) <= 0) {
        errors.push('Valid amount is required')
      }
      break

    case 'update_expense':
    case 'submit_expense':
    case 'approve_expense':
    case 'reject_expense':
      if (!input.context) {
        errors.push('Expense context is required')
      }
      break

    case 'create_budget':
      if (!input.params.name) {
        errors.push('Budget name is required')
      }
      if (!input.params.totalAmount || (input.params.totalAmount as number) <= 0) {
        errors.push('Valid total amount is required')
      }
      break

    case 'create_payment':
      if (!input.params.amount || (input.params.amount as number) <= 0) {
        errors.push('Valid amount is required')
      }
      if (!input.params.method) {
        errors.push('Payment method is required')
      }
      break

    case 'process_payment': {
      if (input.contextType !== 'payment') {
        errors.push('Payment context is required')
      }
      const paymentCtx = input.context as PaymentContext
      if (paymentCtx?.status !== 'pending') {
        errors.push('Only pending payments can be processed')
      }
      break
    }
  }

  // Custom validation rules
  if (tool.validationRules) {
    for (const rule of tool.validationRules) {
      const value = input.params[rule.field]
      if (rule.rule === 'required' && !value) {
        errors.push(rule.message)
      }
      if (rule.rule === 'minValue' && typeof value === 'number' && value < (rule.value as number)) {
        errors.push(rule.message)
      }
      if (rule.rule === 'maxValue' && typeof value === 'number' && value > (rule.value as number)) {
        errors.push(rule.message)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Tool Execution
// ============================================================================

export function executeFinanceTool(
  state: FinancePilotState,
  input: FinanceToolInput
): FinanceToolOutput {
  const startTime = Date.now()
  const tool = getToolByType(state, input.toolType)

  if (!tool) {
    return {
      success: false,
      message: `Tool not found: ${input.toolType}`,
      toolType: input.toolType,
      errors: ['Tool not found'],
    }
  }

  // Validate input
  const validation = validateToolInput(input, tool, state.contract)
  if (!validation.valid) {
    return {
      success: false,
      message: 'Validation failed',
      toolType: input.toolType,
      errors: validation.errors,
    }
  }

  // Check if confirmation is needed
  if (tool.requiresConfirmation && !input.dryRun) {
    return {
      success: false,
      message: 'Confirmation required',
      toolType: input.toolType,
      requiresConfirmation: true,
      confirmationMessage: tool.confirmationMessage,
    }
  }

  // Dry run mode
  if (input.dryRun) {
    return {
      success: true,
      message: `Dry run: ${tool.name} would be executed`,
      toolType: input.toolType,
      requiresConfirmation: tool.requiresConfirmation,
      confirmationMessage: tool.confirmationMessage,
    }
  }

  try {
    let updatedContext: InvoiceContext | ExpenseContext | BudgetContext | PaymentContext | undefined
    let summary: FinanceSummary | undefined
    const writebackActions: FinanceWritebackAction[] = []
    const warnings: string[] = []

    switch (input.toolType) {
      case 'create_invoice': {
        const newInvoice = createInvoiceContext(
          input.params.invoiceNumber as string,
          (input.params.type as InvoiceType) || 'sales',
          input.params.amount as number,
          (input.params.currency as string) || state.contract.defaultCurrency,
          {
            customerId: input.params.customerId as string,
            customerName: input.params.customerName as string,
            vendorId: input.params.vendorId as string,
            vendorName: input.params.vendorName as string,
            description: input.params.description as string,
            createdBy: input.userId,
            createdByName: input.userName,
          }
        )
        state.currentInvoice = newInvoice
        updatedContext = newInvoice
        summary = generateInvoiceSummary(newInvoice)
        writebackActions.push(prepareInvoiceWriteback(newInvoice))
        break
      }

      case 'update_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            ...input.params,
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
        }
        break

      case 'submit_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          if (invoiceCtx.status !== 'draft') {
            return {
              success: false,
              message: 'Only draft invoices can be submitted',
              toolType: input.toolType,
              errors: ['Invalid invoice status'],
            }
          }
          updatedContext = {
            ...invoiceCtx,
            status: 'pending',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'pending'))
        }
        break

      case 'approve_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'approved'))
        }
        break

      case 'reject_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            status: 'rejected',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'rejected'))
        }
        break

      case 'cancel_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'cancelled'))
        }
        break

      case 'create_expense': {
        const newExpense = createExpenseContext(
          input.params.expenseNumber as string,
          input.params.category as ExpenseCategory,
          input.params.amount as number,
          (input.params.currency as string) || state.contract.defaultCurrency,
          {
            description: input.params.description as string,
            receiptUrl: input.params.receiptUrl as string,
            vendor: input.params.vendor as string,
            projectId: input.params.projectId as string,
            projectName: input.params.projectName as string,
            departmentId: input.params.departmentId as string,
            departmentName: input.params.departmentName as string,
            createdBy: input.userId,
            createdByName: input.userName,
          }
        )
        state.currentExpense = newExpense
        updatedContext = newExpense
        summary = generateExpenseSummary(newExpense)
        writebackActions.push(prepareExpenseWriteback(newExpense))
        break
      }

      case 'update_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          updatedContext = {
            ...expenseCtx,
            ...input.params,
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
        }
        break

      case 'submit_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          if (expenseCtx.status !== 'draft') {
            return {
              success: false,
              message: 'Only draft expenses can be submitted',
              toolType: input.toolType,
              errors: ['Invalid expense status'],
            }
          }
          updatedContext = {
            ...expenseCtx,
            status: 'submitted',
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('expense', updatedContext.expenseId, 'submitted'))
        }
        break

      case 'approve_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          updatedContext = {
            ...expenseCtx,
            status: 'approved',
            approvedBy: input.userId,
            approvedByName: input.userName,
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('expense', updatedContext.expenseId, 'approved'))
        }
        break

      case 'reject_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          updatedContext = {
            ...expenseCtx,
            status: 'rejected',
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('expense', updatedContext.expenseId, 'rejected'))
        }
        break

      case 'create_budget': {
        const newBudget = createBudgetContext(
          input.params.name as string,
          input.params.totalAmount as number,
          (input.params.period as BudgetPeriod) || 'monthly',
          {
            departmentId: input.params.departmentId as string,
            departmentName: input.params.departmentName as string,
            projectId: input.params.projectId as string,
            projectName: input.params.projectName as string,
          }
        )
        state.currentBudget = newBudget
        updatedContext = newBudget
        summary = generateBudgetSummary(newBudget)
        writebackActions.push(prepareBudgetWriteback(newBudget))
        break
      }

      case 'update_budget':
        if (input.contextType === 'budget' && input.context) {
          const budgetCtx = input.context as BudgetContext
          updatedContext = {
            ...budgetCtx,
            ...input.params,
            remainingAmount: (input.params.totalAmount as number) ?? budgetCtx.totalAmount - budgetCtx.usedAmount,
            updatedAt: new Date().toISOString(),
          } as BudgetContext
          state.currentBudget = updatedContext
          summary = generateBudgetSummary(updatedContext)
        }
        break

      case 'check_budget':
        if (input.contextType === 'budget' && input.context) {
          const budgetCtx = input.context as BudgetContext
          const usagePercent = (budgetCtx.usedAmount / budgetCtx.totalAmount) * 100
          if (usagePercent >= 90) {
            warnings.push(`预算使用率已达 ${usagePercent.toFixed(1)}%，请注意控制`)
          } else if (usagePercent >= 75) {
            warnings.push(`预算使用率已达 ${usagePercent.toFixed(1)}%`)
          }
          updatedContext = budgetCtx
          summary = generateBudgetSummary(budgetCtx)
        }
        break

      case 'create_payment': {
        const newPayment = createPaymentContext(
          input.params.paymentNumber as string,
          input.params.amount as number,
          (input.params.currency as string) || state.contract.defaultCurrency,
          input.params.method as PaymentMethod,
          {
            invoiceId: input.params.invoiceId as string,
            invoiceNumber: input.params.invoiceNumber as string,
            payerId: input.params.payerId as string,
            payerName: input.params.payerName as string,
            payeeId: input.params.payeeId as string,
            payeeName: input.params.payeeName as string,
            description: input.params.description as string,
            createdBy: input.userId,
            createdByName: input.userName,
          }
        )
        state.currentPayment = newPayment
        updatedContext = newPayment
        summary = generatePaymentSummary(newPayment)
        writebackActions.push(preparePaymentWriteback(newPayment))
        break
      }

      case 'process_payment':
        if (input.contextType === 'payment' && input.context) {
          const paymentCtx = input.context as PaymentContext
          updatedContext = {
            ...paymentCtx,
            status: 'completed',
            transactionId: `TXN-${Date.now()}`,
            paymentDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as PaymentContext
          state.currentPayment = updatedContext
          summary = generatePaymentSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('payment', updatedContext.paymentId, 'completed'))
        }
        break

      case 'generate_summary':
        if (input.context) {
          switch (input.contextType) {
            case 'invoice':
              summary = generateInvoiceSummary(input.context as InvoiceContext)
              break
            case 'expense':
              summary = generateExpenseSummary(input.context as ExpenseContext)
              break
            case 'budget':
              summary = generateBudgetSummary(input.context as BudgetContext)
              break
            case 'payment':
              summary = generatePaymentSummary(input.context as PaymentContext)
              break
          }
        }
        break

      case 'fill_expense_form':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          writebackActions.push({
            actionId: generateFinanceWritebackId(),
            actionType: 'update_list',
            target: 'expense_form',
            data: {
              category: expenseCtx.category,
              amount: expenseCtx.amount,
              currency: expenseCtx.currency,
              description: expenseCtx.description,
              expenseDate: expenseCtx.expenseDate,
            },
          })
          summary = generateExpenseSummary(expenseCtx)
        }
        break
    }

    // Record execution
    const record: FinanceToolExecutionRecord = {
      recordId: generateFinanceRecordId(),
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
      writebackActions: writebackActions.length > 0 ? writebackActions : undefined,
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: errorMessage,
      toolType: input.toolType,
      errors: [errorMessage],
    }
  }
}

function getSuccessMessage(toolType: FinanceToolType): string {
  const messages: Record<FinanceToolType, string> = {
    create_invoice: '发票创建成功',
    update_invoice: '发票更新成功',
    submit_invoice: '发票已提交审批',
    approve_invoice: '发票审批通过',
    reject_invoice: '发票已拒绝',
    cancel_invoice: '发票已取消',
    query_invoice: '发票查询成功',
    create_expense: '费用创建成功',
    update_expense: '费用更新成功',
    submit_expense: '费用已提交审批',
    approve_expense: '费用审批通过',
    reject_expense: '费用已拒绝',
    query_expense: '费用查询成功',
    create_budget: '预算创建成功',
    update_budget: '预算更新成功',
    check_budget: '预算检查完成',
    query_budget: '预算查询成功',
    create_payment: '付款创建成功',
    process_payment: '付款处理成功',
    query_payment: '付款查询成功',
    generate_summary: '摘要生成成功',
    fill_expense_form: '表单填充成功',
  }
  return messages[toolType] || '操作成功'
}

// ============================================================================
// Summary Generation
// ============================================================================

export function generateInvoiceSummary(invoice: InvoiceContext): FinanceSummary {
  return {
    summaryId: generateFinanceSummaryId(),
    summaryType: 'invoice',
    title: `发票: ${invoice.invoiceNumber}`,
    keyFields: [
      { key: 'invoiceNumber', label: '发票编号', value: invoice.invoiceNumber },
      { key: 'type', label: '类型', value: getInvoiceTypeName(invoice.type) },
      { key: 'status', label: '状态', value: getInvoiceStatusName(invoice.status), type: 'status' },
      { key: 'amount', label: '金额', value: invoice.amount, type: 'amount' },
      { key: 'currency', label: '币种', value: invoice.currency },
      { key: 'issueDate', label: '开票日期', value: invoice.issueDate, type: 'date' },
      { key: 'dueDate', label: '到期日期', value: invoice.dueDate, type: 'date' },
    ],
    amount: invoice.amount,
    currency: invoice.currency,
    status: invoice.status,
    createdAt: new Date().toISOString(),
    createdBy: invoice.createdBy,
  }
}

export function generateExpenseSummary(expense: ExpenseContext): FinanceSummary {
  return {
    summaryId: generateFinanceSummaryId(),
    summaryType: 'expense',
    title: `费用: ${expense.expenseNumber}`,
    keyFields: [
      { key: 'expenseNumber', label: '费用编号', value: expense.expenseNumber },
      { key: 'category', label: '类别', value: getExpenseCategoryName(expense.category) },
      { key: 'status', label: '状态', value: getExpenseStatusName(expense.status), type: 'status' },
      { key: 'amount', label: '金额', value: expense.amount, type: 'amount' },
      { key: 'currency', label: '币种', value: expense.currency },
      { key: 'expenseDate', label: '费用日期', value: expense.expenseDate, type: 'date' },
    ],
    amount: expense.amount,
    currency: expense.currency,
    status: expense.status,
    createdAt: new Date().toISOString(),
    createdBy: expense.createdBy,
  }
}

export function generateBudgetSummary(budget: BudgetContext): FinanceSummary {
  const usagePercent = (budget.usedAmount / budget.totalAmount) * 100
  return {
    summaryId: generateFinanceSummaryId(),
    summaryType: 'budget',
    title: `预算: ${budget.name}`,
    keyFields: [
      { key: 'name', label: '预算名称', value: budget.name },
      { key: 'period', label: '周期', value: getBudgetPeriodName(budget.period) },
      { key: 'status', label: '状态', value: getBudgetStatusName(budget.status), type: 'status' },
      { key: 'totalAmount', label: '预算总额', value: budget.totalAmount, type: 'amount' },
      { key: 'usedAmount', label: '已使用', value: budget.usedAmount, type: 'amount' },
      { key: 'remainingAmount', label: '剩余金额', value: budget.remainingAmount, type: 'amount' },
      { key: 'usagePercent', label: '使用率', value: `${usagePercent.toFixed(1)}%`, type: 'percentage' },
    ],
    amount: budget.totalAmount,
    status: budget.status,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
  }
}

export function generatePaymentSummary(payment: PaymentContext): FinanceSummary {
  return {
    summaryId: generateFinanceSummaryId(),
    summaryType: 'payment',
    title: `付款: ${payment.paymentNumber}`,
    keyFields: [
      { key: 'paymentNumber', label: '付款编号', value: payment.paymentNumber },
      { key: 'method', label: '付款方式', value: getPaymentMethodName(payment.method) },
      { key: 'status', label: '状态', value: getPaymentStatusName(payment.status), type: 'status' },
      { key: 'amount', label: '金额', value: payment.amount, type: 'amount' },
      { key: 'currency', label: '币种', value: payment.currency },
    ],
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    createdAt: new Date().toISOString(),
    createdBy: payment.createdBy,
  }
}

// ============================================================================
// Writeback Integration
// ============================================================================

export function createFinanceWritebackAction(
  actionType: 'update_list' | 'update_status' | 'update_amount',
  target: string,
  data: Record<string, unknown>
): FinanceWritebackAction {
  return {
    actionId: generateFinanceWritebackId(),
    actionType,
    target,
    data,
  }
}

export function createSummaryWritebackAction(
  summaryType: SummaryWritebackAction['summaryType'],
  data: Record<string, unknown>
): SummaryWritebackAction {
  return {
    actionId: generateFinanceWritebackId(),
    actionType: 'generate_summary',
    summaryType,
    data,
  }
}

export function createFormWritebackAction(
  formType: FormWritebackAction['formType'],
  data: Record<string, unknown>
): FormWritebackAction {
  return {
    actionId: generateFinanceWritebackId(),
    actionType: 'fill_form',
    formType,
    data,
  }
}

export function prepareInvoiceWriteback(invoice: InvoiceContext): FinanceWritebackAction {
  return createFinanceWritebackAction('update_list', 'invoice_list', {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    amount: invoice.amount,
    currency: invoice.currency,
  })
}

export function prepareExpenseWriteback(expense: ExpenseContext): FinanceWritebackAction {
  return createFinanceWritebackAction('update_list', 'expense_list', {
    expenseId: expense.expenseId,
    expenseNumber: expense.expenseNumber,
    category: expense.category,
    status: expense.status,
    amount: expense.amount,
    currency: expense.currency,
  })
}

export function prepareBudgetWriteback(budget: BudgetContext): FinanceWritebackAction {
  return createFinanceWritebackAction('update_list', 'budget_list', {
    budgetId: budget.budgetId,
    name: budget.name,
    status: budget.status,
    totalAmount: budget.totalAmount,
    usedAmount: budget.usedAmount,
  })
}

export function preparePaymentWriteback(payment: PaymentContext): FinanceWritebackAction {
  return createFinanceWritebackAction('update_list', 'payment_list', {
    paymentId: payment.paymentId,
    paymentNumber: payment.paymentNumber,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
  })
}

export function prepareStatusWriteback(
  contextType: 'invoice' | 'expense' | 'budget' | 'payment',
  contextId: string,
  status: string
): FinanceWritebackAction {
  return createFinanceWritebackAction('update_status', `${contextType}_${contextId}`, { status })
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
