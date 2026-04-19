/**
 * Pilot Domain - Pilot 集成组件
 * 组件文件位于 ../ 根目录
 */

export {
  ApprovalPilotIntegration,
  type ApprovalPilotIntegrationProps,
  type ApprovalPhase,
  type BindingStatus as ApprovalBindingStatus,
  type ExecutionStatus as ApprovalExecutionStatus,
  type ApprovalContext,
  type ToolBinding as ApprovalToolBinding,
  type RuntimeStep as ApprovalRuntimeStep,
  type AuditEntry as ApprovalAuditEntry,
  type ApprovalPilotStats
} from '../ApprovalPilotIntegration'

export {
  SalesPilotIntegration,
  type SalesPilotIntegrationProps,
  type SalesPhase,
  type BindingStatus as SalesBindingStatus,
  type ExecutionStatus as SalesExecutionStatus,
  type OpportunityStage,
  type SalesContext,
  type SalesToolBinding,
  type SalesRuntimeStep,
  type SalesAuditEntry,
  type SalesPilotStats
} from '../SalesPilotIntegration'

export {
  FinancePilotIntegration,
  type FinancePilotIntegrationProps,
  type FinancePhase,
  type BindingStatus as FinanceBindingStatus,
  type ExecutionStatus as FinanceExecutionStatus,
  type TransactionType,
  type FinanceContext,
  type FinanceToolBinding,
  type FinanceRuntimeStep,
  type FinanceAuditEntry,
  type FinancePilotStats
} from '../FinancePilotIntegration'
