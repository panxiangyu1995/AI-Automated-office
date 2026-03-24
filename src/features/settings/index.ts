/**
 * Settings Feature Module
 * Story 4.4 - AI模型提供商配置
 * Story 21.1 - LLM提供商添加与配置
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

// Hooks
export { 
  useModelConfig, 
  useActiveProviderConfig,
  useSelectedModelInfo,
  type ProviderType,
  type ModelInfo,
  type ProviderConfig,
  type ConnectionStatus,
  type ModelConfigState
} from './hooks/useModelConfig'
