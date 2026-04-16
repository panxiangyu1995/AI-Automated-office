/**
 * Finance Pilot Integration
 *
 * Story 50.3 - Finance Pilot Integration
 * Validates the common Agent runtime in the finance scenario.
 *
 * Refactored: sub-modules extracted for file size compliance (<800 lines)
 * - financePilotIds.ts        - ID generation
 * - financePilotFactory.ts    - Context, tool, contract, state factories
 * - financePilotExecution.ts  - Permission, validation, execution
 * - financePilotWriteback.ts  - Summary generation, writeback integration
 * - financePilotSerialization.ts - Serialization, debug formatting
 */

// Types
export type {
  InvoiceStatus, InvoiceType, ExpenseStatus, ExpenseCategory,
  BudgetStatus, BudgetPeriod, PaymentStatus, PaymentMethod, FinanceToolType,
  InvoiceContext, InvoiceLineItem, ExpenseContext, BudgetContext, BudgetCategory, BudgetAlert,
  PaymentContext, FinanceTool, FinanceValidationRule, FinanceToolInput, FinanceToolOutput,
  FinanceSummary, FinanceSummaryField, SummaryWritebackAction, FormWritebackAction,
  FinanceWritebackAction, FinanceToolExecutionRecord, FinancePilotContract, FinancePilotState,
} from './financePilotTypes'

// ID Generation
export {
  generateInvoiceId,
  generateExpenseId,
  generateBudgetId,
  generatePaymentId,
  generateFinanceSummaryId,
  generateFinanceToolId,
  generateFinanceRecordId,
  generateFinanceWritebackId,
} from './financePilotIds'

// Context Factory
export {
  createInvoiceContext,
  createExpenseContext,
  createBudgetContext,
  createPaymentContext,
} from './financePilotFactory'

// Tool Factory
export { createFinanceTool } from './financePilotFactory'

// Contract and State Factory
export {
  createFinancePilotContract,
  createFinancePilotState,
} from './financePilotFactory'

// Tool Registration
export {
  getDefaultFinanceTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,
} from './financePilotFactory'

// Permission and Validation
export {
  checkToolPermission,
  checkInvoiceStatus,
  checkExpenseStatus,
  checkBudgetStatus,
  checkPaymentStatus,
  validateToolInput,
} from './financePilotExecution'

// Tool Execution
export { executeFinanceTool } from './financePilotExecution'

// Summary Generation
export {
  generateInvoiceSummary,
  generateExpenseSummary,
  generateBudgetSummary,
  generatePaymentSummary,
} from './financePilotWriteback'

// Writeback Integration
export {
  createFinanceWritebackAction,
  createSummaryWritebackAction,
  createFormWritebackAction,
  prepareInvoiceWriteback,
  prepareExpenseWriteback,
  prepareBudgetWriteback,
  preparePaymentWriteback,
  prepareStatusWriteback,
} from './financePilotWriteback'

// Serialization
export {
  serializeInvoiceContext,
  deserializeInvoiceContext,
  serializeExpenseContext,
  deserializeExpenseContext,
  serializeBudgetContext,
  deserializeBudgetContext,
  serializePaymentContext,
  deserializePaymentContext,
  serializeFinanceTool,
  deserializeFinanceTool,
  serializeFinanceSummary,
  deserializeFinanceSummary,
  serializeFinancePilotState,
  deserializeFinancePilotState,
} from './financePilotSerialization'

// Debug Formatting
export {
  getInvoiceStatusName,
  getInvoiceTypeName,
  getExpenseStatusName,
  getExpenseCategoryName,
  getBudgetStatusName,
  getBudgetPeriodName,
  getPaymentStatusName,
  getPaymentMethodName,
  formatInvoiceContext,
  formatExpenseContext,
  formatBudgetContext,
  formatPaymentContext,
  formatFinanceTool,
  formatFinanceSummary,
  formatToolExecutionRecord,
} from './financePilotSerialization'
