/**
 * Settings Feature Module
 * Story 4.4 - AI模型提供商配置
 * 
 * 导出设置相关的组件和 Hooks
 */

// Components
export { SettingsPanel } from './components/SettingsPanel'
export { ModelProviderSettings } from './components/ModelProviderSettings'

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
