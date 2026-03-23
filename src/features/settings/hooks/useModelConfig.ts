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
    }),
    {
      name: 'model-config-storage',
      partialize: (state) => ({
        providers: state.providers,
        activeProvider: state.activeProvider,
        selectedModel: state.selectedModel,
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
