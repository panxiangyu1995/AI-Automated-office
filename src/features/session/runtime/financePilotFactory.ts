/**
 * Finance Pilot - Factory Functions
 * Context creation, tool factory, contract and state factories
 * Extracted from financePilot.ts for file size compliance (<800 lines)
 */

import type {
  InvoiceType, ExpenseCategory, BudgetPeriod, PaymentMethod, FinanceToolType,
  InvoiceContext, ExpenseContext, BudgetContext, PaymentContext,
  FinanceTool, FinancePilotContract, FinancePilotState,
} from './financePilotTypes'
import {
  generateInvoiceId, generateExpenseId, generateBudgetId,
  generatePaymentId, generateFinanceToolId,
} from './financePilotIds'

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
