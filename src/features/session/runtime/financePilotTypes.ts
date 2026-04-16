/**
 * Finance Pilot Types - 财务Pilot类型定义
 *
 * Story 50.3 - Finance Pilot Integration
 */

import type { PermissionLevel } from './fieldActionAuthorization'

// ============================================================================
// Enums and Types
// ============================================================================

export type InvoiceStatus =
  | 'draft' | 'pending' | 'approved' | 'rejected' | 'paid' | 'partial' | 'cancelled' | 'overdue'

export type InvoiceType = 'sales' | 'purchase' | 'credit_note' | 'debit_note' | 'proforma'

export type ExpenseStatus =
  | 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'reimbursed' | 'cancelled'

export type ExpenseCategory =
  | 'travel' | 'meals' | 'office' | 'equipment' | 'software' | 'marketing' | 'training' | 'entertainment' | 'other'

export type BudgetStatus = 'active' | 'exceeded' | 'closed' | 'draft'

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check' | 'online'

export type FinanceToolType =
  | 'create_invoice' | 'update_invoice' | 'submit_invoice' | 'approve_invoice' | 'reject_invoice' | 'cancel_invoice' | 'query_invoice'
  | 'create_expense' | 'update_expense' | 'submit_expense' | 'approve_expense' | 'reject_expense' | 'query_expense'
  | 'create_budget' | 'update_budget' | 'check_budget' | 'query_budget'
  | 'create_payment' | 'process_payment' | 'query_payment'
  | 'generate_summary' | 'fill_expense_form'

export interface InvoiceContext {
  invoiceId: string; invoiceNumber: string; type: InvoiceType; status: InvoiceStatus
  customerId?: string; customerName?: string; vendorId?: string; vendorName?: string
  amount: number; currency: string; taxAmount?: number; taxRate?: number
  issueDate: string; dueDate: string; paidAmount?: number; description?: string
  lineItems?: InvoiceLineItem[]; attachments?: string[]
  createdAt: string; updatedAt: string; createdBy: string; createdByName?: string
}

export interface InvoiceLineItem {
  itemId: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate?: number
}

export interface ExpenseContext {
  expenseId: string; expenseNumber: string; category: ExpenseCategory; status: ExpenseStatus
  amount: number; currency: string; expenseDate: string; description?: string; receiptUrl?: string
  vendor?: string; projectId?: string; projectName?: string; departmentId?: string; departmentName?: string
  approvedBy?: string; approvedByName?: string; approvedAt?: string; reimbursedAt?: string
  createdAt: string; updatedAt: string; createdBy: string; createdByName?: string
}

export interface BudgetContext {
  budgetId: string; name: string; departmentId?: string; departmentName?: string
  projectId?: string; projectName?: string; period: BudgetPeriod; status: BudgetStatus
  totalAmount: number; usedAmount: number; remainingAmount: number
  startDate: string; endDate: string; categories?: BudgetCategory[]; alerts?: BudgetAlert[]
  createdAt: string; updatedAt: string
}

export interface BudgetCategory { categoryId: string; name: string; allocatedAmount: number; usedAmount: number }
export interface BudgetAlert { alertId: string; threshold: number; triggered: boolean; triggeredAt?: string }

export interface PaymentContext {
  paymentId: string; paymentNumber: string; invoiceId?: string; invoiceNumber?: string
  status: PaymentStatus; method: PaymentMethod; amount: number; currency: string
  payerId?: string; payerName?: string; payeeId?: string; payeeName?: string
  transactionId?: string; paymentDate?: string; description?: string
  createdAt: string; updatedAt: string; createdBy: string; createdByName?: string
}

export interface FinanceTool {
  toolId: string; toolType: FinanceToolType; name: string; description: string
  requiredPermission: PermissionLevel; requiresConfirmation: boolean; isDestructive: boolean
  riskLevel: 'low' | 'medium' | 'high'; confirmationMessage?: string
  applicableStatuses?: string[]; validationRules?: FinanceValidationRule[]
}

export interface FinanceValidationRule {
  field: string; rule: 'required' | 'email' | 'phone' | 'url' | 'minLength' | 'maxLength' | 'pattern' | 'minValue' | 'maxValue'
  value?: string | number; message: string
}

export interface FinanceToolInput {
  toolId: string; toolType: FinanceToolType; userId: string; userName?: string
  userPermission: PermissionLevel; params: Record<string, unknown>
  contextType?: 'invoice' | 'expense' | 'budget' | 'payment'
  context?: InvoiceContext | ExpenseContext | BudgetContext | PaymentContext; dryRun?: boolean
}

export interface FinanceToolOutput {
  success: boolean; message: string; toolType: FinanceToolType
  updatedContext?: InvoiceContext | ExpenseContext | BudgetContext | PaymentContext
  summary?: FinanceSummary; requiresConfirmation?: boolean; confirmationMessage?: string
  writebackActions?: FinanceWritebackAction[]; errors?: string[]; warnings?: string[]
}

export interface FinanceSummary {
  summaryId: string; summaryType: 'invoice' | 'expense' | 'budget' | 'payment' | 'overview'
  title: string; keyFields: FinanceSummaryField[]; amount?: number; currency?: string
  status?: string; createdAt: string; createdBy: string
}

export interface FinanceSummaryField {
  key: string; label: string; value: string | number; type?: 'text' | 'amount' | 'date' | 'status' | 'percentage'
}

export interface SummaryWritebackAction {
  actionId: string; actionType: 'generate_summary'
  summaryType: 'invoice' | 'expense' | 'budget' | 'payment' | 'financial'; data: Record<string, unknown>
}

export interface FormWritebackAction {
  actionId: string; actionType: 'fill_form'
  formType: 'expense' | 'invoice' | 'payment'; data: Record<string, unknown>
}

export type FinanceWritebackAction =
  | SummaryWritebackAction | FormWritebackAction
  | { actionId: string; actionType: 'update_list' | 'update_status' | 'update_amount'; target: string; data: Record<string, unknown> }

export interface FinanceToolExecutionRecord {
  recordId: string; toolId: string; toolType: FinanceToolType; timestamp: string
  userId: string; userName?: string; success: boolean; durationMs: number
  params: Record<string, unknown>; result?: Record<string, unknown>; errors?: string[]
}

export interface FinancePilotContract {
  contractId: string; allowedInvoiceStatuses: InvoiceStatus[]; allowedExpenseStatuses: ExpenseStatus[]
  allowedBudgetStatuses: BudgetStatus[]; allowedPaymentStatuses: PaymentStatus[]
  allowedExpenseCategories: ExpenseCategory[]; allowedPaymentMethods: PaymentMethod[]
  defaultCurrency: string; maxInvoiceAmount?: number; maxExpenseAmount?: number; requireApprovalThreshold?: number
}

export interface FinancePilotState {
  currentInvoice?: InvoiceContext; currentExpense?: ExpenseContext
  currentBudget?: BudgetContext; currentPayment?: PaymentContext
  availableTools: Map<string, FinanceTool>; toolHistory: FinanceToolExecutionRecord[]
  contract: FinancePilotContract
}
