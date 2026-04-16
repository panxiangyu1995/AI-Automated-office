/**
 * Session Runtime - Pilot Exports
 * Approval, sales, finance pilot integrations
 */

// Staged Review Flow
export {
  type ReviewTargetKind,
  type CandidateChangeStatus,
  type ReviewPackageStatus,
  type ReviewActorType,
  type ReviewActionResult,
  type CandidateChange,
  type StagedReviewPackage,
  type ReviewPackageOptions,
  type StagedReviewState,
  normalizeFormWritebackToReviewPackage,
  normalizeDetailWritebackToReviewPackage,
  normalizeWorkbenchWritebackToReviewPackage,
  normalizeEditorWritebackToReviewPackage,
  normalizeTemplateWritebackToReviewPackage,
  useStagedReviewStore,
  useStagedReviewPackages,
  countPendingCandidateChanges,
} from './stagedReviewFlow'

// Approval Pilot Integration (Task 88: Story 50.1)
export {
  // Types
  type ApprovalType,
  type ApprovalStatus,
  type ApprovalPriority,
  type ApprovalDecision,
  type ApprovalToolType,
  type ApprovalContext,
  type ApprovalHistoryEntry,
  type ApprovalAttachment,
  type ApprovalTool,
  type ApprovalToolInput,
  type ApprovalToolOutput,
  type ApprovalSummary,
  type ApprovalKeyField,
  type ApprovalSummaryOptions,
  type ApprovalWritebackAction,
  type ApprovalPilotState,
  type ApprovalToolExecutionRecord,
  type ApprovalPilotContract,

  // ID Generation
  generateApprovalId,
  generateToolId,
  generateSummaryId as generateApprovalSummaryId,
  generateHistoryEntryId as generateApprovalHistoryEntryId,
  generateToolRecordId,
  generateWritebackId as generateApprovalWritebackId,

  // Factory Functions
  createApprovalContext,
  createApprovalTool,
  createApprovalHistoryEntry,
  createApprovalKeyField,
  createApprovalPilotContract,
  createApprovalPilotState,

  // Tool Registration
  getDefaultApprovalTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,

  // Permission and Validation
  checkToolPermission,
  checkApprovalType,
  validateToolInput,

  // Tool Execution
  executeApprovalTool,

  // Summary Generation
  generateApprovalSummary,

  // Writeback Integration
  createApprovalWritebackAction,
  prepareSummaryWriteback,
  prepareStatusWriteback,
  prepareFormWriteback,
  prepareHistoryWriteback,

  // Audit Integration
  createApprovalAuditEntry,
  addAuditEntryToState,

  // Serialization
  serializeApprovalContext,
  deserializeApprovalContext,
  serializeApprovalTool,
  deserializeApprovalTool,
  serializeApprovalSummary,
  deserializeApprovalSummary,
  serializeApprovalPilotState,
  deserializeApprovalPilotState,

  // Debug Formatting
  formatApprovalContext,
  formatApprovalTool,
  formatApprovalSummary,
  formatToolExecutionRecord,
} from './approvalPilot'

// Sales Pilot Integration (Task 89: Story 50.2)
export {
  // Types
  type CustomerStatus,
  type CustomerPriority,
  type LeadStatus,
  type LeadSource,
  type OpportunityStatus,
  type FollowUpType,
  type FollowUpStatus,
  type SalesToolType,
  type CustomerContext,
  type CustomerContact,
  type LeadContext,
  type OpportunityContext,
  type FollowUpContext,
  type SalesTool,
  type SalesToolInput,
  type SalesToolOutput,
  type CustomerSummary,
  type SalesSummaryOptions,
  type SalesWritebackAction,
  type SalesPilotState,
  type SalesToolExecutionRecord,
  type SalesPilotContract,

  // ID Generation
  generateCustomerId,
  generateLeadId,
  generateOpportunityId,
  generateFollowUpId,
  generateContactId,
  generateToolId as generateSalesToolId,
  generateSalesSummaryId,
  generateToolRecordId as generateSalesToolRecordId,
  generateSalesWritebackId,
  generateSalesAuditId,

  // Factory Functions
  createCustomerContext,
  createCustomerContact,
  createSalesTool,
  createSalesPilotContract,
  createSalesPilotState,

  // Tool Registration
  getDefaultSalesTools,
  registerTool as registerSalesTool,
  registerDefaultTools as registerDefaultSalesTools,
  getTool as getSalesTool,
  getToolByType as getSalesToolByType,

  // Permission and Validation
  checkToolPermission as checkSalesToolPermission,
  checkCustomerStatus,
  checkLeadStatus,
  validateToolInput as validateSalesToolInput,

  // Tool Execution
  executeSalesTool,

  // Summary Generation
  generateCustomerSummary,
  generateLeadSummaryContext,
  generateOpportunitySummaryContext,
  generateFollowUpSummaryContext,

  // Writeback Integration
  createSalesWritebackAction,
  prepareCustomerSummaryWriteback,
  prepareFollowUpFormWriteback,
  prepareWorkbenchCardWriteback,

  // Audit Integration
  createSalesAuditEntry,
  addAuditEntryToState as addSalesAuditEntryToState,

  // Serialization
  serializeCustomerContext,
  deserializeCustomerContext,
  serializeSalesTool,
  deserializeSalesTool,
  serializeCustomerSummary,
  deserializeCustomerSummary,
  serializeSalesPilotState,
  deserializeSalesPilotState,

  // Debug Formatting
  formatCustomerContext,
  formatSalesTool,
  formatCustomerSummary,
  formatToolExecutionRecord as formatSalesToolExecutionRecord,
} from './salesPilot'

// Finance Pilot Integration (Task 90: Story 50.3)
export {
  // Types
  type InvoiceStatus,
  type InvoiceType,
  type ExpenseStatus,
  type ExpenseCategory,
  type BudgetStatus,
  type BudgetPeriod,
  type PaymentStatus,
  type PaymentMethod,
  type FinanceToolType,
  type InvoiceContext,
  type InvoiceLineItem,
  type ExpenseContext,
  type BudgetContext,
  type BudgetCategory,
  type BudgetAlert,
  type PaymentContext,
  type FinanceTool,
  type FinanceValidationRule,
  type FinanceToolInput,
  type FinanceToolOutput,
  type FinanceSummary,
  type FinanceSummaryField,
  type FinanceWritebackAction,
  type FinanceToolExecutionRecord,
  type FinancePilotContract,
  type FinancePilotState,

  // ID Generation
  generateInvoiceId,
  generateExpenseId,
  generateBudgetId,
  generatePaymentId,
  generateFinanceSummaryId,
  generateFinanceToolId,
  generateFinanceRecordId,
  generateFinanceWritebackId,

  // Context Factory
  createInvoiceContext,
  createExpenseContext,
  createBudgetContext,
  createPaymentContext,

  // Tool Factory
  createFinanceTool,

  // Contract and State Factory
  createFinancePilotContract,
  createFinancePilotState,

  // Tool Registration
  getDefaultFinanceTools,
  registerTool as registerFinanceTool,
  registerDefaultTools as registerDefaultFinanceTools,
  getTool as getFinanceTool,
  getToolByType as getFinanceToolByType,

  // Permission and Validation
  checkToolPermission as checkFinanceToolPermission,
  checkInvoiceStatus,
  checkExpenseStatus,
  checkBudgetStatus,
  checkPaymentStatus,
  validateToolInput as validateFinanceToolInput,

  // Tool Execution
  executeFinanceTool,

  // Summary Generation
  generateInvoiceSummary,
  generateExpenseSummary,
  generateBudgetSummary,
  generatePaymentSummary,

  // Writeback Integration
  createFinanceWritebackAction,
  prepareInvoiceWriteback,
  prepareExpenseWriteback,
  prepareBudgetWriteback,
  preparePaymentWriteback,
  prepareStatusWriteback as prepareFinanceStatusWriteback,

  // Serialization
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

  // Debug Formatting
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
  formatToolExecutionRecord as formatFinanceToolExecutionRecord,
} from './financePilot'
