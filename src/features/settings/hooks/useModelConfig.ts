/**
 * useModelConfig - 模型配置管理 Hook
 * Story 4.4 - AI模型提供商配置
 * 
 * 管理 AI 模型提供商、API 密钥、连接状态
 * 
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - ARCH-037: 本地优先存储
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== Types ====================

export type ProviderType = 'openai' | 'anthropic' | 'dashscope' | 'zhipu' | 'deepseek' | 'minimax' | 'custom'

/**
 * Configuration level for three-tier hierarchy
 * Priority: User > Tenant > Official
 */
export type ConfigLevel = 'official' | 'tenant' | 'user'

/**
 * Agent execution mode for Plan/Act dual configuration
 */
export type AgentMode = 'plan' | 'act'

export interface ModelInfo {
  id: string
  name: string
  provider: ProviderType
  maxTokens?: number
  supportsVision?: boolean
  supportsFunctionCall?: boolean
}

export interface ProviderConfig {
  type: ProviderType
  name: string
  apiKey: string
  baseUrl?: string
  models: ModelInfo[]
  isActive: boolean
}

/**
 * Mode-specific configuration for Plan/Act dual config
 */
export interface ModeConfig {
  provider: ProviderType
  modelId: string
  apiKey?: string
  baseUrl?: string
}

/**
 * Routing configuration for Plan/Act dual configuration
 */
export interface RoutingConfig {
  planMode?: ModeConfig
  actMode: ModeConfig
}

export interface ConnectionStatus {
  isConnected: boolean
  lastChecked: number | null
  error: string | null
}

export interface ModelConfigState {
  // Provider Configuration
  providers: Record<ProviderType, ProviderConfig>
  activeProvider: ProviderType
  selectedModel: string | null

  // Three-tier Configuration Level
  configLevel: ConfigLevel
  tenantId: string | null
  userId: string | null

  // Plan/Act Dual Configuration Mode
  agentMode: AgentMode
  routingConfig: RoutingConfig | null
  enableRoutingConfig: boolean

  // Connection Status
  connectionStatus: ConnectionStatus
  isTestingConnection: boolean

  // Actions
  setActiveProvider: (provider: ProviderType) => void
  setSelectedModel: (modelId: string) => void
  updateApiKey: (provider: ProviderType, apiKey: string) => void
  updateBaseUrl: (provider: ProviderType, baseUrl: string) => void
  testConnection: () => Promise<boolean>
  resetConnectionStatus: () => void

  // Three-tier Configuration Actions
  setConfigLevel: (level: ConfigLevel) => void
  setTenantId: (tenantId: string | null) => void
  setUserId: (userId: string | null) => void

  // Plan/Act Mode Actions
  setAgentMode: (mode: AgentMode) => void
  setEnableRoutingConfig: (enabled: boolean) => void
  updateRoutingConfig: (config: RoutingConfig) => void
  updateModeConfig: (mode: AgentMode, config: Partial<ModeConfig>) => void

  // Backend API Actions
  loadConfigFromBackend: () => Promise<void>
  saveConfigToBackend: () => Promise<void>
}

// ==================== Default Models ====================

const DEFAULT_MODELS: Record<ProviderType, ModelInfo[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', supportsVision: true, supportsFunctionCall: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', supportsVision: true, supportsFunctionCall: true },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', supportsFunctionCall: true },
  ],
  anthropic: [
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', supportsVision: true },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', supportsVision: true },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', supportsVision: true },
  ],
  dashscope: [
    { id: 'qwen-max', name: 'Qwen Max', provider: 'dashscope', supportsFunctionCall: true },
    { id: 'qwen-plus', name: 'Qwen Plus', provider: 'dashscope', supportsFunctionCall: true },
    { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'dashscope' },
  ],
  zhipu: [
    { id: 'glm-4', name: 'GLM-4', provider: 'zhipu', supportsFunctionCall: true },
    { id: 'glm-4-air', name: 'GLM-4 Air', provider: 'zhipu' },
    { id: 'glm-3-turbo', name: 'GLM-3 Turbo', provider: 'zhipu' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', supportsFunctionCall: true },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', supportsFunctionCall: true },
  ],
  minimax: [
    { id: 'abab6.5-chat', name: 'ABAB 6.5 Chat', provider: 'minimax', supportsFunctionCall: true },
    { id: 'abab5.5-chat', name: 'ABAB 5.5 Chat', provider: 'minimax' },
  ],
  custom: [],
}

const DEFAULT_PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    type: 'openai',
    name: 'OpenAI',
    apiKey: '',
    models: DEFAULT_MODELS.openai,
    isActive: true,
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic',
    apiKey: '',
    models: DEFAULT_MODELS.anthropic,
    isActive: true,
  },
  dashscope: {
    type: 'dashscope',
    name: '阿里云百炼',
    apiKey: '',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: DEFAULT_MODELS.dashscope,
    isActive: true,
  },
  zhipu: {
    type: 'zhipu',
    name: '智谱 AI',
    apiKey: '',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: DEFAULT_MODELS.zhipu,
    isActive: true,
  },
  deepseek: {
    type: 'deepseek',
    name: 'DeepSeek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    models: DEFAULT_MODELS.deepseek,
    isActive: true,
  },
  minimax: {
    type: 'minimax',
    name: 'Minimax',
    apiKey: '',
    baseUrl: 'https://api.minimax.chat/v1',
    models: DEFAULT_MODELS.minimax,
    isActive: true,
  },
  custom: {
    type: 'custom',
    name: '自定义',
    apiKey: '',
    baseUrl: '',
    models: [],
    isActive: true,
  },
}

// ==================== Store ====================

export const useModelConfig = create<ModelConfigState>()(
  persist(
    (set, get) => ({
      providers: DEFAULT_PROVIDERS,
      activeProvider: 'openai',
      selectedModel: 'gpt-4o',

      // Three-tier Configuration Level
      configLevel: 'user',
      tenantId: null,
      userId: null,

      // Plan/Act Dual Configuration Mode
      agentMode: 'act',
      routingConfig: null,
      enableRoutingConfig: false,

      // Connection Status
      connectionStatus: {
        isConnected: false,
        lastChecked: null,
        error: null,
      },
      isTestingConnection: false,

      setActiveProvider: (provider) => {
        const providerConfig = get().providers[provider]
        const defaultModel = providerConfig.models[0]?.id ?? null
        set({
          activeProvider: provider,
          selectedModel: defaultModel,
          connectionStatus: {
            isConnected: false,
            lastChecked: null,
            error: null,
          },
        })
      },

      setSelectedModel: (modelId) => {
        set({ selectedModel: modelId })
      },

      updateApiKey: (provider, apiKey) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              apiKey,
            },
          },
        }))
      },

      updateBaseUrl: (provider, baseUrl) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              baseUrl,
            },
          },
        }))
      },

      testConnection: async () => {
        const { activeProvider, providers } = get()
        const providerConfig = providers[activeProvider]

        if (!providerConfig.apiKey) {
          set({
            connectionStatus: {
              isConnected: false,
              lastChecked: Date.now(),
              error: '请先输入 API 密钥',
            },
          })
          return false
        }

        set({ isTestingConnection: true })

        try {
          // Simulate API connection test
          // In real implementation, this would call the actual API
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // For now, just validate that API key format looks reasonable
          const isValidFormat = providerConfig.apiKey.length >= 10

          if (isValidFormat) {
            set({
              connectionStatus: {
                isConnected: true,
                lastChecked: Date.now(),
                error: null,
              },
              isTestingConnection: false,
            })
            return true
          } else {
            throw new Error('API 密钥格式无效')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '连接失败'
          set({
            connectionStatus: {
              isConnected: false,
              lastChecked: Date.now(),
              error: errorMessage,
            },
            isTestingConnection: false,
          })
          return false
        }
      },

      resetConnectionStatus: () => {
        set({
          connectionStatus: {
            isConnected: false,
            lastChecked: null,
            error: null,
          },
        })
      },

      // Three-tier Configuration Actions
      setConfigLevel: (level) => {
        set({ configLevel: level })
      },

      setTenantId: (tenantId) => {
        set({ tenantId })
      },

      setUserId: (userId) => {
        set({ userId })
      },

      // Plan/Act Mode Actions
      setAgentMode: (mode) => {
        set({ agentMode: mode })
      },

      setEnableRoutingConfig: (enabled) => {
        set({ enableRoutingConfig: enabled })
      },

      updateRoutingConfig: (config) => {
        set({ routingConfig: config })
      },

      updateModeConfig: (mode, config) => {
        const currentConfig = get().routingConfig
        if (!currentConfig) {
          // Initialize with current settings as act mode
          const actMode: ModeConfig = {
            provider: get().activeProvider,
            modelId: get().selectedModel ?? '',
            apiKey: get().providers[get().activeProvider]?.apiKey,
            baseUrl: get().providers[get().activeProvider]?.baseUrl,
          }
          const planMode: ModeConfig = {
            provider: get().activeProvider,
            modelId: get().selectedModel ?? '',
          }
          set({
            routingConfig: mode === 'act'
              ? { planMode, actMode: { ...actMode, ...config } as ModeConfig }
              : { planMode: { ...planMode, ...config } as ModeConfig, actMode },
          })
        } else {
          if (mode === 'act') {
            set({
              routingConfig: {
                ...currentConfig,
                actMode: { ...currentConfig.actMode, ...config } as ModeConfig,
              },
            })
          } else {
            set({
              routingConfig: {
                ...currentConfig,
                planMode: { ...(currentConfig.planMode ?? { provider: get().activeProvider, modelId: get().selectedModel ?? '' }), ...config } as ModeConfig,
              },
            })
          }
        }
      },

      // Backend API Actions
      loadConfigFromBackend: async () => {
        const { activeProvider, tenantId, userId } = get()
        try {
          // Call backend API to get active config
          const response = await fetch(`/api/provider-config?provider_type=${activeProvider}&tenant_id=${tenantId}&user_id=${userId}`)
          if (response.ok) {
            const config = await response.json()
            if (config) {
              set({
                providers: {
                  ...get().providers,
                  [activeProvider]: {
                    ...get().providers[activeProvider],
                    apiKey: config.encrypted_api_key || '',
                    baseUrl: config.api_endpoint || '',
                  },
                },
                selectedModel: config.model || get().selectedModel,
              })
            }
          }
        } catch (error) {
          console.error('Failed to load config from backend:', error)
        }
      },

      saveConfigToBackend: async () => {
        const { activeProvider, providers, selectedModel, configLevel, tenantId, userId, routingConfig } = get()
        const providerConfig = providers[activeProvider]
        try {
          const payload = {
            provider_type: activeProvider,
            api_endpoint: providerConfig.baseUrl,
            encrypted_api_key: providerConfig.apiKey,
            model: selectedModel,
            level: configLevel,
            tenant_id: tenantId,
            user_id: userId,
            is_active: true,
            routing_config: routingConfig ? {
              plan_mode: routingConfig.planMode ? {
                provider: routingConfig.planMode.provider,
                model_id: routingConfig.planMode.modelId,
                api_endpoint: routingConfig.planMode.baseUrl,
                api_key: routingConfig.planMode.apiKey,
              } : undefined,
              act_mode: {
                provider: routingConfig.actMode.provider,
                model_id: routingConfig.actMode.modelId,
                api_endpoint: routingConfig.actMode.baseUrl,
                api_key: routingConfig.actMode.apiKey,
              },
            } : undefined,
          }
          await fetch('/api/provider-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        } catch (error) {
          console.error('Failed to save config to backend:', error)
        }
      },
    }),
    {
      name: 'model-config-storage',
      partialize: (state) => ({
        providers: state.providers,
        activeProvider: state.activeProvider,
        selectedModel: state.selectedModel,
        configLevel: state.configLevel,
        tenantId: state.tenantId,
        userId: state.userId,
        agentMode: state.agentMode,
        routingConfig: state.routingConfig,
        enableRoutingConfig: state.enableRoutingConfig,
      }),
    }
  )
)

// ==================== Selector Hooks ====================

/**
 * 获取当前活跃的提供商配置
 */
export function useActiveProviderConfig(): ProviderConfig | null {
  return useModelConfig((state) => {
    const provider = state.activeProvider
    return state.providers[provider] ?? null
  })
}

/**
 * 获取当前选中的模型信息
 */
export function useSelectedModelInfo(): ModelInfo | null {
  return useModelConfig((state) => {
    const provider = state.activeProvider
    const modelId = state.selectedModel
    const providerConfig = state.providers[provider]
    if (!providerConfig || !modelId) return null
    return providerConfig.models.find((m) => m.id === modelId) ?? null
  })
}

// ==================== Export ====================

export default useModelConfig
