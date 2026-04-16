/**
 * Sales Pilot Integration (Story 50.2)
 * Task 89: Sales Pilot Integration
 *
 * Barrel re-export from sub-modules:
 *  - salesPilotTypes.ts       (type definitions)
 *  - salesPilotExecution.ts   (ID gen + factories + tool registration + permissions + execution + summary)
 *  - salesPilotStore.ts       (writeback + audit + serialization + debug)
 */

export type {
  CustomerStatus, CustomerPriority, LeadStatus, LeadSource, OpportunityStatus,
  FollowUpType, FollowUpStatus, SalesToolType,
  CustomerContext, CustomerContact, LeadSummary, OpportunitySummary, FollowUpSummary,
  LeadContext, OpportunityContext, FollowUpContext,
  SalesTool, SalesToolInput, SalesToolOutput,
  SalesSummaryOptions,
  SalesPilotState, SalesToolExecutionRecord,
  SalesPilotContract, SalesWritebackAction,
  CustomerSummary, LeadSummaryContext, OpportunitySummaryContext, FollowUpSummaryContext,
  SalesAuditEntry,
} from './salesPilotTypes'

export {
  generateCustomerId,
  generateLeadId,
  generateOpportunityId,
  generateFollowUpId,
  generateContactId,
  generateToolId,
  generateSalesSummaryId,
  generateToolRecordId,
  generateSalesWritebackId,
  generateSalesAuditId,
  createCustomerContext,
  createCustomerContact,
  createSalesTool,
  createSalesPilotContract,
  createSalesPilotState,
  getDefaultSalesTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,
  checkToolPermission,
  checkCustomerStatus,
  checkLeadStatus,
  validateToolInput,
  executeSalesTool,
  generateCustomerSummary,
  generateLeadSummaryContext,
  generateOpportunitySummaryContext,
  generateFollowUpSummaryContext,
} from './salesPilotExecution'

export {
  createSalesWritebackAction,
  prepareCustomerSummaryWriteback,
  prepareFollowUpFormWriteback,
  prepareWorkbenchCardWriteback,
  createSalesAuditEntry,
  addAuditEntryToState,
  serializeCustomerContext,
  deserializeCustomerContext,
  serializeSalesTool,
  deserializeSalesTool,
  serializeCustomerSummary,
  deserializeCustomerSummary,
  serializeSalesPilotState,
  deserializeSalesPilotState,
  formatCustomerContext,
  formatSalesTool,
  formatCustomerSummary,
  formatToolExecutionRecord,
} from './salesPilotStore'
