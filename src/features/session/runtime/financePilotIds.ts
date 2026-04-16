/**
 * Finance Pilot - ID Generation
 * Extracted from financePilot.ts for file size compliance (<800 lines)
 */

const INVOICE_ID_PREFIX = 'fin-invoice'
const EXPENSE_ID_PREFIX = 'fin-expense'
const BUDGET_ID_PREFIX = 'fin-budget'
const PAYMENT_ID_PREFIX = 'fin-payment'
const SUMMARY_ID_PREFIX = 'fin-summary'
const RECORD_ID_PREFIX = 'fin-record'
const WRITEBACK_ID_PREFIX = 'fin-writeback'
const TOOL_ID_PREFIX = 'fin-tool'

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
