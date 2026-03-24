/**
 * Settings Feature Module
 * Story 4.4 - AI模型提供商配置
 * Story 21.1 - LLM提供商添加与配置
 * Story 21.2 - LLM提供商默认设置
 * Story 21.3 - MCP服务添加与配置
 * Story 21.4 - MCP服务连接管理
 * 
 * 导出设置相关的组件和 Hooks
 */

// Components
export { SettingsPanel } from './components/SettingsPanel'
export { ModelProviderSettings } from './components/ModelProviderSettings'
export { LLMProviderConfig } from './components/LLMProviderConfig'
export type {
  ProviderType as LLMProviderType,
  ProviderStatus,
  AuthType,
  ProviderConfig as LLMProviderConfigType,
  ConnectionTestResult,
  ProviderStats as LLMProviderStats,
  ConfigChangeRecord,
  LLMProviderConfigState,
} from './components/LLMProviderConfig'

export { LLMProviderDefaults } from './components/LLMProviderDefaults'
export type {
  DefaultLevel,
  ConfigStatus,
  ParamType,
  ModelParameter,
  ProviderDefaultConfig,
  DefaultSelectionHistory,
  EffectiveDefaults,
  LLMProviderDefaultsState
} from './components/LLMProviderDefaults'

export { MCPServiceConfig } from './components/MCPServiceConfig'
export type {
  MCPServiceStatus,
  MCPServiceType,
  RuntimePolicy,
  LogLevel,
  MCPServiceArg,
  MCPServiceEnv,
  MCPServiceCapability,
  MCPServiceConfig as MCPServiceConfigType,
  MCPServiceRecord,
  MCPServiceStats,
  MCPServiceConfigState
} from './components/MCPServiceConfig'

export { MCPServiceConnection } from './components/MCPServiceConnection'
export type {
  ConnectionStatus,
  HealthLevel,
  OperationType,
  HealthCheck,
  ServiceConnection,
  ConnectionOperation,
  ConnectionStats,
  ServiceConnectionState
} from './components/MCPServiceConnection'

export { MCPToolDiscovery } from './components/MCPToolDiscovery'
export type {
  ToolStatus,
  ToolCategory,
  MCPTool,
  ToolRegistry,
  ToolBinding,
  ToolDiscoveryStats,
  ToolDiscoveryState
} from './components/MCPToolDiscovery'

export { MCPApprovePolicy } from './components/MCPApprovePolicy'
export type {
  ApprovePolicy,
  PolicyScope,
  PolicySource,
  ToolApprovePolicy,
  PolicyCondition,
  PolicyAuditEntry,
  DefaultPolicyConfig,
  PolicyStats,
  ApprovePolicyState
} from './components/MCPApprovePolicy'

export { MCPBulkConfig } from './components/MCPBulkConfig'
export type {
  ToolStatus as BulkToolStatus,
  BulkAction,
  RiskLevel,
  MCPToolItem,
  BulkOperation,
  BulkAuditEntry,
  BulkConfigState,
  BulkConfigStats
} from './components/MCPBulkConfig'

export { ToolExecutionLog } from './components/ToolExecutionLog'
export type {
  ExecutionStatus,
  ApproveDecision,
  ExecutionToolCategory,
  RiskLevel as ExecutionRiskLevel,
  ExportFormat,
  ToolExecutionRecord,
  AuditLogEntry,
  ExecutionStats,
  LogExportConfig
} from './components/ToolExecutionLog'

export { SkillConfiguration } from './components/SkillConfiguration'
export type {
  SkillStatus,
  SkillSource,
  SkillScope,
  LoadPriority,
  DowngradeTrigger,
  ParameterType,
  SkillParameter,
  SkillDependency,
  SkillDowngradeRecord,
  InstalledSkill,
  SkillConfigState,
  SkillStats
} from './components/SkillConfiguration'

export { SystemPromptEditor } from './components/SystemPromptEditor'
export type {
  PromptLayer,
  PromptSource,
  PromptStatus,
  VariableType,
  ApplyStatus,
  PromptVariable,
  PromptSourceLabel,
  PromptLayerContent,
  PromptAuditEntry,
  PromptEditorState
} from './components/SystemPromptEditor'

export { PromptTemplateManagement } from './components/PromptTemplateManagement'
export type {
  TemplateType,
  TemplateScope,
  TemplateStatus,
  AssignmentTarget,
  ExportFormat as TemplateExportFormat,
  TemplateVariable,
  PromptTemplate,
  TemplateAssignment,
  TemplateCategory,
  TemplateStats,
  TemplateManagementState
} from './components/PromptTemplateManagement'

export { PromptVariablePreview } from './components/PromptVariablePreview'
export type {
  VariableStatus,
  TokenType,
  VariableValue,
  TokenEstimate,
  PromptPreviewConfig,
  PromptPreviewState
} from './components/PromptVariablePreview'

export { PromptVersioning } from './components/PromptVersioning'
export type {
  VersionAction,
  KnowledgeSource,
  WritebackStatus,
  PromptDiff,
  PromptVersion,
  KnowledgeEntry,
  WritebackConfig,
  PromptVersioningState
} from './components/PromptVersioning'

export { RulesListManagement } from './components/RulesListManagement'
export type {
  RuleCategory,
  RulePriority,
  RuleStatus,
  Rule,
  RuleGroup,
  RuleStats
} from './components/RulesListManagement'

// Hooks
export { 
  useModelConfig, 
  useActiveProviderConfig,
  useSelectedModelInfo,
  type ProviderType,
  type ModelInfo,
  type ProviderConfig,
  type ConnectionStatus as ModelConnectionStatus,
  type ModelConfigState
} from './hooks/useModelConfig'