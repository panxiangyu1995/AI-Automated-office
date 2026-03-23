/**
 * ModelProviderSettings - 模型提供商设置组件
 * Story 4.4 - AI模型提供商配置
 * 
 * 提供模型选择、API密钥管理、连接测试
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，使用 Zustand 状态管理
 */

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { cn } from '@/lib/utils'
import { 
  useModelConfig, 
  useActiveProviderConfig,
  useSelectedModelInfo
} from '../hooks/useModelConfig'

// ==================== Types ====================

interface ModelProviderSettingsProps {
  className?: string
}

// ==================== Provider Select ====================

function ProviderSelect() {
  const { providers, activeProvider, setActiveProvider } = useModelConfig()
  
  const providerList = Object.values(providers).filter((p) => p.isActive)
  
  return (
    <div className="space-y-2">
      <Label>选择提供商</Label>
      <div className="grid grid-cols-2 gap-2">
        {providerList.map((provider) => (
          <button
            key={provider.type}
            onClick={() => setActiveProvider(provider.type)}
            className={cn(
              'px-3 py-2 text-sm rounded-lg border transition-colors text-left',
              activeProvider === provider.type
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            )}
            style={activeProvider === provider.type ? { 
              borderColor: '#1E3A5F',
              backgroundColor: 'rgba(30, 58, 95, 0.05)',
              color: '#1E3A5F'
            } : undefined}
          >
            {provider.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ==================== Model Select ====================

function ModelSelect() {
  const { selectedModel, setSelectedModel } = useModelConfig()
  const activeProviderConfig = useActiveProviderConfig()
  
  if (!activeProviderConfig || activeProviderConfig.models.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-2">
      <Label>选择模型</Label>
      <select
        value={selectedModel ?? ''}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        style={{ borderColor: selectedModel ? '#1E3A5F' : undefined }}
      >
        {activeProviderConfig.models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
            {model.supportsVision ? ' (支持视觉)' : ''}
            {model.supportsFunctionCall ? ' (支持函数调用)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

// ==================== API Key Input ====================

function ApiKeyInput() {
  const { activeProvider, updateApiKey } = useModelConfig()
  const activeProviderConfig = useActiveProviderConfig()
  const [showKey, setShowKey] = useState(false)
  
  if (!activeProviderConfig) return null
  
  return (
    <div className="space-y-2">
      <Label>API 密钥</Label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={activeProviderConfig.apiKey}
          onChange={(e) => updateApiKey(activeProvider, e.target.value)}
          placeholder="请输入 API 密钥"
          className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
        >
          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        API 密钥将安全存储在本地，不会上传到服务器
      </p>
    </div>
  )
}

// ==================== Base URL Input ====================

function BaseUrlInput() {
  const { activeProvider, updateBaseUrl } = useModelConfig()
  const activeProviderConfig = useActiveProviderConfig()
  
  // Only show for providers that support custom base URL
  const supportsCustomUrl = ['dashscope', 'zhipu', 'deepseek', 'minimax', 'custom'].includes(activeProvider)
  
  if (!activeProviderConfig || !supportsCustomUrl) return null
  
  return (
    <div className="space-y-2">
      <Label>API 端点（可选）</Label>
      <input
        type="text"
        value={activeProviderConfig.baseUrl ?? ''}
        onChange={(e) => updateBaseUrl(activeProvider, e.target.value)}
        placeholder="自定义 API 端点 URL"
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <p className="text-xs text-slate-400">
        留空使用默认端点
      </p>
    </div>
  )
}

// ==================== Connection Test ====================

function ConnectionTest() {
  const { connectionStatus, isTestingConnection, testConnection } = useModelConfig()
  const selectedModel = useSelectedModelInfo()
  
  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  
  return (
    <div className="space-y-3">
      <Label>连接测试</Label>
      
      <div className="flex items-center gap-3">
        <Button
          onClick={testConnection}
          disabled={isTestingConnection}
          variant="outline"
          size="sm"
        >
          {isTestingConnection ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              测试中...
            </>
          ) : (
            '测试连接'
          )}
        </Button>
        
        {connectionStatus.lastChecked && (
          <span className="text-xs text-slate-400">
            上次测试: {formatTime(connectionStatus.lastChecked)}
          </span>
        )}
      </div>
      
      {connectionStatus.lastChecked && (
        <div 
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            connectionStatus.isConnected 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          )}
        >
          {connectionStatus.isConnected ? (
            <>
              <CheckCircle size={16} />
              连接成功
            </>
          ) : (
            <>
              <XCircle size={16} />
              {connectionStatus.error ?? '连接失败'}
            </>
          )}
        </div>
      )}
      
      {selectedModel && (
        <div className="text-xs text-slate-500">
          当前模型: {selectedModel.name}
          {selectedModel.supportsVision && ' · 支持图片'}
          {selectedModel.supportsFunctionCall && ' · 支持工具调用'}
        </div>
      )}
    </div>
  )
}

// ==================== Main Component ====================

export function ModelProviderSettings({ className }: ModelProviderSettingsProps) {
  const activeProviderConfig = useActiveProviderConfig()
  
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-800">模型提供商</h3>
        <p className="text-sm text-slate-500 mt-1">
          配置 AI 模型提供商和 API 密钥
        </p>
      </div>
      
      <ProviderSelect />
      
      {activeProviderConfig && (
        <>
          <ModelSelect />
          <ApiKeyInput />
          <BaseUrlInput />
          <ConnectionTest />
        </>
      )}
      
      <div className="pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          提示: API 密钥存储在本地浏览器中，请勿在公共电脑上保存敏感密钥。
        </p>
      </div>
    </div>
  )
}

export default ModelProviderSettings
