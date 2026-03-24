/**
 * Session Feature Module
 * Task 60: Story 43.1 - Session Lifecycle Management
 */

export * from './runtime'

// Tools - selective exports to avoid conflicts with runtime
export type {
  ToolCategory,
  ToolExecutionMode,
  ToolParameterType,
  ToolParameter,
  ToolReturnType,
  ToolCapabilities,
  ToolPermissionRequirement,
  ToolDependency,
  ToolMetadata,
  ToolContextRequirements,
  ToolDescriptor,
} from './tools'

export type {
  ToolLookupFilter,
  ToolLookupResult,
  RegistryStatistics,
  RegistryChangeEvent,
  RegistryChangeListener,
  ToolRegistryConfig,
} from './tools'

export {
  ToolRegistry,
  getToolRegistry,
  createToolRegistry,
  registerCoreTools,
} from './tools'

// Components
export { ToolRegistryPanel } from './components/ToolRegistryPanel'
export type { ToolRegistryPanelProps } from './components/ToolRegistryPanel'
export {
  ToolCallStatusDisplay,
  ToolCallStatusStream,
  ToolCallCard,
} from './components/ToolCallStatusDisplay'
export type {
  ToolCallStatusDisplayProps,
  ToolCallStatusStreamProps,
} from './components/ToolCallStatusDisplay'
export { ToolCallDetailDialog } from './components/ToolCallDetailDialog'
export type { ToolCallDetailDialogProps } from './components/ToolCallDetailDialog'
export {
  ToolFailureHandling,
  ToolFailureCard,
  BatchFailureHandling,
  ErrorType,
} from './components/ToolFailureHandling'
export type {
  ToolFailureHandlingProps,
  FailureGuidanceProps,
  FallbackResultInputProps,
  BatchFailureHandlingProps,
} from './components/ToolFailureHandling'
export { ResultCorrection, InlineResultEditor, CorrectionRationaleDialog } from './components/ResultCorrection'
export type {
  ResultCorrectionProps,
  InlineResultEditorProps,
  CorrectionRationaleDialogProps,
  CorrectionRecord,
  CorrectionRule,
  CorrectionType,
} from './components/ResultCorrection'
export { ModuleCapabilityStatus, ModuleStatusCard } from './components/ModuleCapabilityStatus'
export type {
  ModuleCapabilityStatusProps,
  ModuleStatusCardProps,
  ModuleCapabilityState,
  CapabilityStats,
  ModuleHealthStatus,
  HandshakeStatus,
  CapabilityType,
} from './components/ModuleCapabilityStatus'
export { ToolRetryPolicy } from './components/ToolRetryPolicy'
export type {
  ToolRetryPolicyProps,
  RetryPolicyConfig,
  ErrorRetryConfig,
  RetryableErrorType,
  BackoffStrategy,
} from './components/ToolRetryPolicy'
export { ToolDowngradePolicy, createDefaultToolDowngradePolicy } from './components/ToolDowngradePolicy'
export type {
  ToolDowngradePolicyProps,
  ToolDowngradePolicyConfig,
  DowngradeConfig,
  DowngradeBehavior,
  DowngradeTrigger,
} from './components/ToolDowngradePolicy'
export { 
  SensitiveOperationConfirmation, 
  createExampleSensitiveOperation,
  createExampleRiskDetail,
} from './components/SensitiveOperationConfirmation'
export type {
  SensitiveOperationConfirmationProps,
  SensitiveOperation,
  RiskDetail,
  ConfirmationConfig,
  RiskLevel,
  SensitiveOperationType,
  ConfirmationResult,
} from './components/SensitiveOperationConfirmation'
export { OperationBlacklist, createDefaultBlacklistConfig } from './components/OperationBlacklist'
export type {
  OperationBlacklistProps,
  BlacklistEntry,
  BlacklistConfig,
  BlacklistScope,
  BlacklistStatus,
  AuditRecord,
} from './components/OperationBlacklist'
export { 
  ToolPermissionCheck, 
  createExamplePermissionCheckResult,
  createExamplePermissionHistory,
} from './components/ToolPermissionCheck'
export type {
  ToolPermissionCheckProps,
  PermissionCheckResult,
  PermissionRequirement,
  PermissionCheckItem,
  PermissionHistoryRecord,
  PermissionStatus,
  PermissionType,
} from './components/ToolPermissionCheck'

// ToolHistory
export { ToolHistory } from './components/ToolHistory'
export type {
  ToolExecutionStatus,
  ToolHistoryCategory,
  ToolHistoryEntry,
  ToolHistoryStats,
} from './components/ToolHistory'

// Session Memory Management
export { SessionMemoryManagement } from './components/SessionMemoryManagement'
export type {
  MemoryScope,
  MemorySource,
  MemoryStatus,
  MemoryConfidence,
  MemoryEntry,
  MemoryStats,
  MemoryAuditLog,
} from './components/SessionMemoryManagement'

// User Preference Memory
export { UserPreferenceMemory } from './components/UserPreferenceMemory'
export type {
  PreferenceScene,
  PreferenceType,
  PreferenceStatus,
  UserPreference,
  PreferenceCategory,
  PreferenceStats,
} from './components/UserPreferenceMemory'

// Memory Update Decisioning
export { MemoryUpdateDecisioning } from './components/MemoryUpdateDecisioning'
export type {
  UpdateAction,
  ConflictResolution,
  UpdateSource,
  UpdateStatus,
  MemoryUpdateDecision,
  ConflictRule,
  UpdateStats,
} from './components/MemoryUpdateDecisioning'

// Agent Observability Panel
export { AgentObservabilityPanel } from './components/AgentObservabilityPanel'
export type { SessionMetrics, TenantStatistics, ReportType } from './components/AgentObservabilityPanel'