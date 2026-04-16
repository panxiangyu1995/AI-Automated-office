/**
 * Finance Pilot - Summary Generation and Writeback Integration
 * Extracted from financePilot.ts for file size compliance (<800 lines)
 */

import type {
  InvoiceContext, ExpenseContext, BudgetContext, PaymentContext,
  FinanceSummary, FinanceWritebackAction, SummaryWritebackAction, FormWritebackAction,
} from './financePilotTypes'
import { generateFinanceSummaryId, generateFinanceWritebackId } from './financePilotIds'
import {
  getInvoiceStatusName, getInvoiceTypeName,
  getExpenseStatusName, getExpenseCategoryName,
  getBudgetStatusName, getBudgetPeriodName,
  getPaymentStatusName, getPaymentMethodName,
} from './financePilotSerialization'

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
