/**
 * ModelProviderSettings - 模型提供商设置组件
 * Story 4.4 - AI模型提供商配置
 * 
 * 提供模型选择、API密钥管理、连接测试
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用 GitHub Dark 颜色系统
 * - ARCH: 分层架构，使用 Zustand 状态管理
 */

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
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
    <div className="space-y-3">
      <Label className="text-sm" style={{ color: '#C9D1D9' }}>选择提供商</Label>
      <div className="grid grid-cols-2 gap-2">
        {providerList.map((provider) => (
          <button
            key={provider.type}
            onClick={() => setActiveProvider(provider.type)}
            className={cn(
              'px-3 py-3 text-sm rounded-lg border transition-all duration-200 text-left',
              activeProvider === provider.type
                ? 'border-transparent shadow-sm'
                : 'border-[#30363D] hover:border-[#8B949E]'
            )}
            style={activeProvider === provider.type ? { 
              backgroundColor: '#238636', 
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(35, 134, 54, 0.3)'
            } : { 
              backgroundColor: '#161B22', 
              color: '#C9D1D9' 
            }}
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
    <div className="space-y-3">
      <Label className="text-sm" style={{ color: '#C9D1D9' }}>选择模型</Label>
      <Select value={selectedModel ?? ''} onValueChange={setSelectedModel}>
        <SelectTrigger 
          className="w-full"
          style={{ 
            backgroundColor: '#0D1117', 
            borderColor: '#30363D', 
            color: '#C9D1D9' 
          }}
        >
          <SelectValue placeholder="请选择模型" />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
          {activeProviderConfig.models.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              style={{ color: '#C9D1D9' }}
            >
              {model.name}
              {model.supportsVision ? ' (支持视觉)' : ''}
              {model.supportsFunctionCall ? ' (支持函数调用)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
    <div className="space-y-3">
      <Label className="text-sm" style={{ color: '#C9D1D9' }}>API 密钥</Label>
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          value={activeProviderConfig.apiKey}
          onChange={(e) => updateApiKey(activeProvider, e.target.value)}
          placeholder="请输入 API 密钥"
          className="pr-10"
          style={{ 
            backgroundColor: '#0D1117', 
            borderColor: '#30363D', 
            color: '#C9D1D9' 
          }}
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
          style={{ color: '#8B949E' }}
        >
          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <p className="text-xs" style={{ color: '#8B949E' }}>
        API 密钥将安全存储在本地，不会上传到服务器
      </p>
    </div>
  )
}

// ==================== Base URL Input ====================

function BaseUrlInput() {
  const { activeProvider, updateBaseUrl } = useModelConfig()
  const activeProviderConfig = useActiveProviderConfig()
  
  const supportsCustomUrl = ['dashscope', 'zhipu', 'deepseek', 'minimax', 'custom'].includes(activeProvider)
  
  if (!activeProviderConfig || !supportsCustomUrl) return null
  
  return (
    <div className="space-y-3">
      <Label className="text-sm" style={{ color: '#C9D1D9' }}>API 端点（可选）</Label>
      <Input
        type="text"
        value={activeProviderConfig.baseUrl ?? ''}
        onChange={(e) => updateBaseUrl(activeProvider, e.target.value)}
        placeholder="自定义 API 端点 URL"
        style={{ 
          backgroundColor: '#0D1117', 
          borderColor: '#30363D', 
          color: '#C9D1D9' 
        }}
      />
      <p className="text-xs" style={{ color: '#8B949E' }}>
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
      <Label className="text-sm" style={{ color: '#C9D1D9' }}>连接测试</Label>
      
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
          <span className="text-xs" style={{ color: '#8B949E' }}>
            上次测试: {formatTime(connectionStatus.lastChecked)}
          </span>
        )}
      </div>
      
      {connectionStatus.lastChecked && (
        <div 
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          )}
          style={connectionStatus.isConnected 
            ? { backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3FB950', border: '1px solid rgba(63, 185, 80, 0.3)' }
            : { backgroundColor: 'rgba(248, 81, 73, 0.1)', color: '#F85149', border: '1px solid rgba(248, 81, 73, 0.3)' }
          }
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
        <div className="text-xs" style={{ color: '#8B949E' }}>
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
        <h3 className="text-base font-semibold" style={{ color: '#C9D1D9' }}>模型提供商</h3>
        <p className="text-sm mt-1" style={{ color: '#8B949E' }}>
          配置 AI 模型提供商和 API 密钥
        </p>
      </div>
      
      <Card style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
        <CardContent className="pt-6 space-y-6">
          <ProviderSelect />
          
          {activeProviderConfig && (
            <>
              <ModelSelect />
              <ApiKeyInput />
              <BaseUrlInput />
              <ConnectionTest />
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="pt-4" style={{ borderTop: '1px solid #30363D' }}>
        <p className="text-xs" style={{ color: '#8B949E' }}>
          提示: API 密钥存储在本地浏览器中，请勿在公共电脑上保存敏感密钥。
        </p>
      </div>
    </div>
  )
}

export default ModelProviderSettings
