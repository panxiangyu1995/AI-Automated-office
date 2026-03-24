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

export { CustomRuleAddition } from './components/CustomRuleAddition'
export type {
  ConditionOperator,
  ConditionType,
  LogicalOperator,
  RuleCondition,
  RuleConditionGroup,
  CustomRule
} from './components/CustomRuleAddition'

export { PromptDebugMode } from './components/PromptDebugMode'
export type {
  DebugStatus,
  SafetyLevel,
  ConvergenceStrategy,
  TriggeredRule,
  SafetyBlock,
  ConvergenceHit,
  DebugResult,
  PromptDebugModeProps
} from './components/PromptDebugMode'

export { SubAgentRegistry } from './components/SubAgentRegistry'
export type {
  SubAgentStatus,
  SubAgentTemplate,
  SubAgent,
  SubAgentTemplateInfo,
  SubAgentRegistryProps
} from './components/SubAgentRegistry'

export { SubAgentPersonaConfig } from './components/SubAgentPersonaConfig'
export type {
  PersonaStatus,
  TriggerType,
  SoulTemplate,
  TriggerCondition,
  PersonaConfig,
  PersonaAuditEntry,
  SubAgentPersonaConfigProps
} from './components/SubAgentPersonaConfig'

export { SubAgentToolBinding } from './components/SubAgentToolBinding'
export type {
  ToolBindingStatus,
  SubAgentToolPolicy,
  SkillLevel,
  MCPToolBinding,
  SkillBinding,
  ToolBindingAuditEntry,
  SubAgentToolBindingProps
} from './components/SubAgentToolBinding'

export { SubAgentPermissionConfig } from './components/SubAgentPermissionConfig'
export type {
  PermissionBoundary,
  DataAccessLevel,
  VisibilityLevel,
  DepartmentPermission,
  KnowledgeScope,
  PermissionConfig,
  PermissionAuditEntry,
  SubAgentPermissionConfigProps
} from './components/SubAgentPermissionConfig'

export { SubAgentModelConfig } from './components/SubAgentModelConfig'
export type {
  ModelProvider,
  SubAgentModelParameter,
  ModelConfig,
  ModelAuditEntry,
  SubAgentModelConfigProps
} from './components/SubAgentModelConfig'

export { SubAgentRouting } from './components/SubAgentRouting'
export type {
  RoutingMode,
  MatchStrategy,
  ConfidenceLevel,
  RoutingRule,
  RoutingDecision,
  RoutingStats,
  SubAgentRoutingProps
} from './components/SubAgentRouting'

export { SubAgentExecutionMonitor } from './components/SubAgentExecutionMonitor'
export type {
  SubAgentExecutionRiskLevel,
  ExecutionTrace,
  ExecutionMetrics,
  SubAgentExecution,
  ExecutionStep,
  MonitorStats,
  SubAgentExecutionMonitorProps
} from './components/SubAgentExecutionMonitor'

export { KnowledgeDocUpload } from './components/KnowledgeDocUpload'
export type {
  DocStatus,
  DocCategory,
  ViewMode,
  KnowledgeDocument,
  UploadTask,
  KnowledgeStats,
  KnowledgeDocUploadProps
} from './components/KnowledgeDocUpload'

export { KnowledgeQARetrieval } from './components/KnowledgeQARetrieval'
export type {
  RetrievalStrategy,
  QAConfidenceLevel,
  KnowledgeChunk,
  RetrievedKnowledge,
  QAAnswer,
  Citation,
  KnowledgeBase,
  RetrievalStats,
  KnowledgeQARetrievalProps
} from './components/KnowledgeQARetrieval'

export { TicketKnowledgeGeneration } from './components/TicketKnowledgeGeneration'
export type {
  GenerationStatus,
  WorkflowSource,
  EntryQuality,
  SourceTicket,
  DraftEntry,
  GenerationTask,
  KnowledgeGenerationStats,
  TicketKnowledgeGenerationProps
} from './components/TicketKnowledgeGeneration'

export { KnowledgeEntryManagement } from './components/KnowledgeEntryManagement'
export type {
  EntryStatus,
  EntryCategory,
  AccessScope,
  KnowledgeEntryItem,
  EntryAuditRecord,
  EntryMergeCandidate,
  KnowledgeEntryManagementProps
} from './components/KnowledgeEntryManagement'

export { KnowledgeBaseAccessControl } from './components/KnowledgeBaseAccessControl'
export type {
  RoleType,
  AccessLevel,
  ScopeType,
  RolePermission,
  DepartmentAccess,
  UserAccess,
  KnowledgeBaseACL,
  AccessControlStats
} from './components/KnowledgeBaseAccessControl'

export { KnowledgeQualityEvaluation } from './components/KnowledgeQualityEvaluation'
export type {
  QualityScore,
  QualityMetric,
  UpdatePriority,
  QualityTrend,
  QualityScoreResult,
  QualityStats,
  KnowledgeQualityEvaluationProps
} from './components/KnowledgeQualityEvaluation'

export { SkillMdParsing } from './components/SkillMdParsing'
export type {
  ParsedSkillStatus,
  ParsedToolType,
  ParsedTriggerType,
  ParsedParamType,
  SkillMetadata,
  SkillTool,
  ParsedSkillParameter,
  SkillTrigger,
  ParsedSkill,
  ParseResult,
  SkillParsingStats
} from './components/SkillMdParsing'

export { SoulMdParsing } from './components/SoulMdParsing'
export type {
  ParsedPersonaStatus,
  SoulElementType,
  EditableField,
  SoulIdentity,
  SoulValues,
  SoulBehavior,
  SoulSpeaking,
  SoulEmotional,
  SoulBackground,
  SoulPersona,
  AuditEntry,
  ParsedSoulResult,
  SoulParsingStats
} from './components/SoulMdParsing'

export { PluginAdaptation } from './components/PluginAdaptation'
export type {
  PluginStatus,
  SandboxLevel,
  CapabilityType,
  PluginTool,
  PluginCapability,
  PluginAdaptation as PluginAdaptationType,
  AdaptationStats
} from './components/PluginAdaptation'

export { ClawHubMarketplace } from './components/ClawHubMarketplace'
export type {
  ResourceStatus,
  ResourceCategory,
  SecurityLevel,
  MarketplaceResource,
  SecurityCheck,
  InstallationRequest,
  MarketplaceStats
} from './components/ClawHubMarketplace'

export { PrivateMarketConfig } from './components/PrivateMarketConfig'
export type {
  MarketStatus,
  ResourceVisibility,
  ReviewStatus,
  MarketEndpoint,
  UploadedResource,
  PrivateMarketConfig as PrivateMarketConfigType,
  PrivateMarketStats
} from './components/PrivateMarketConfig'

export { ResourceSecurityManagement } from './components/ResourceSecurityManagement'
export type {
  ValidationStatus,
  ScanLevel,
  SecurityRiskLevel,
  ApprovalStatus,
  SignatureType,
  SecurityValidation,
  SecurityScan,
  SecurityIssue,
  ApprovalRequest,
  SecurityAuditEntry,
  SecurityPolicy,
  ResourceSecurityStats
} from './components/ResourceSecurityManagement'

export { ResourceExecutionAudit } from './components/ResourceExecutionAudit'
export type {
  AuditExecutionStatus,
  ExecutionPattern,
  ResourceType,
  ExecutionRecord,
  AlertRule,
  AlertCondition,
  AlertEvent,
  AuditExport,
  AuditStats
} from './components/ResourceExecutionAudit'

export { ConnectorFrameworkAuth } from './components/ConnectorFrameworkAuth'
export type {
  ConnectorAuthType,
  ConnectorStatus,
  HealthStatus,
  ConnectorAuth,
  Connector,
  RetryPolicy,
  ConnectorLog,
  ConnectorStats
} from './components/ConnectorFrameworkAuth'

export { ConnectorHealthMonitor } from './components/ConnectorHealthMonitor'
export type {
  ConnectorHealthLevel,
  RetryStatus,
  DowngradeLevel,
  ConnectorHealth,
  RetryAttempt,
  Incident,
  DowngradeEvent,
  HealthStats
} from './components/ConnectorHealthMonitor'

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