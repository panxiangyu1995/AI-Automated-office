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