/**
 * Approval Pilot Integration Module
 * Task 88: Story 50.1 - Approval Pilot Integration
 *
 * Validate the common Agent runtime in the approval scenario.
 *
 * Barrel re-export from sub-modules:
 *  - approvalPilotTypes.ts      (type definitions)
 *  - approvalPilotFactories.ts  (ID generation + factories + tool registration + permissions)
 *  - approvalPilotExecution.ts  (tool execution + summary generation + helpers)
 *  - approvalPilotStore.ts      (writeback + audit + serialization + debug)
 */

export type {
  ApprovalType,
  ApprovalStatus,
  ApprovalPriority,
  ApprovalDecision,
  ApprovalToolType,
  ApprovalContext,
  ApprovalHistoryEntry,
  ApprovalAttachment,
  ApprovalTool,
  ApprovalToolInput,
  ApprovalToolOutput,
  ApprovalSummary,
  ApprovalKeyField,
  ApprovalTimelineEntry,
  ApprovalSummaryOptions,
  ApprovalWritebackAction,
  ApprovalPilotState,
  ApprovalToolExecutionRecord,
  ApprovalPilotContract,
} from './approvalPilotTypes'

export {
  generateApprovalId,
  generateToolId,
  generateSummaryId,
  generateHistoryEntryId,
  generateToolRecordId,
  generateWritebackId,
  createApprovalContext,
  createApprovalTool,
  createApprovalHistoryEntry,
  createApprovalKeyField,
  createApprovalPilotContract,
  createApprovalPilotState,
  getDefaultApprovalTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,
  checkToolPermission,
  checkApprovalType,
  validateToolInput,
} from './approvalPilotFactories'

export {
  executeApprovalTool,
  generateApprovalSummary,
  getApprovalTypeName,
  getApprovalStatusName,
  getApprovalPriorityName,
  getActionName,
} from './approvalPilotExecution'

export {
  createApprovalWritebackAction,
  prepareSummaryWriteback,
  prepareStatusWriteback,
  prepareFormWriteback,
  prepareHistoryWriteback,
  createApprovalAuditEntry,
  addAuditEntryToState,
  serializeApprovalContext,
  deserializeApprovalContext,
  serializeApprovalTool,
  deserializeApprovalTool,
  serializeApprovalSummary,
  deserializeApprovalSummary,
  serializeApprovalPilotState,
  deserializeApprovalPilotState,
  formatApprovalContext,
  formatApprovalTool,
  formatApprovalSummary,
  formatToolExecutionRecord,
} from './approvalPilotStore'
