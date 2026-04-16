/**
 * ModelProviderSettings - 模型提供商设置组件
 * Story 4.4 - AI模型提供商配置
 *
 * 提供模型选择、API密钥管理、连接测试
 * 支持三级配置层级（平台/租户/用户）和Plan/Act双配置
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用 GitHub Dark 颜色系统
 * - ARCH: 分层架构，使用 Zustand 状态管理
 */

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Shield, Building2, User, Layers } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { cn } from '@/lib/utils'
import {
  useModelConfig,
  useActiveProviderConfig,
  useSelectedModelInfo,
  type ConfigLevel,
  type AgentMode,
  type ModeConfig
} from '../hooks/useModelConfig'

// ==================== Types ====================

interface ModelProviderSettingsProps {
  className?: string
}

// Configuration level display info
const CONFIG_LEVEL_INFO: Record<ConfigLevel, { label: string; icon: typeof Shield; description: string; priority: number }> = {
  official: {
    label: '平台官方',
    icon: Shield,
    description: '平台预设的默认配置，所有用户可见',
    priority: 3,
  },
  tenant: {
    label: '租户级',
    icon: Building2,
    description: '租户管理员配置，覆盖平台设置',
    priority: 2,
  },
  user: {
    label: '用户级',
    icon: User,
    description: '个人用户配置，优先级最高',
    priority: 1,
  },
}

// ==================== Config Level Selector ====================

function ConfigLevelSelector() {
  const { configLevel, setConfigLevel, tenantId, setTenantId, userId, setUserId } = useModelConfig()

  const currentLevelInfo = CONFIG_LEVEL_INFO[configLevel]
  const LevelIcon = currentLevelInfo.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={16} style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
        <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>配置层级</Label>
      </div>

      {/* Level Selection Tabs */}
      <div className="flex gap-2">
        {(Object.keys(CONFIG_LEVEL_INFO) as ConfigLevel[]).map((level) => {
          const info = CONFIG_LEVEL_INFO[level]
          const Icon = info.icon
          return (
            <button
              key={level}
              onClick={() => setConfigLevel(level)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                configLevel === level
                  ? 'border-transparent'
                  : 'border-[var(--ao-border)] hover:border-[var(--ao-workbench.secondaryForeground)]'
              )}
              style={configLevel === level ? {
                backgroundColor: 'var(--ao-button.linkForeground)',
                color: 'var(--ao-activityBar.activeForeground)',
              } : {
                backgroundColor: 'var(--ao-bottomPanel.background)',
                color: 'var(--ao-foreground)',
              }}
            >
              <Icon size={14} />
              {info.label}
            </button>
          )
        })}
      </div>

      {/* Level Info Card */}
      <div
        className="p-3 rounded-lg border"
        style={{
          backgroundColor: 'rgba(31, 111, 235, 0.1)',
          borderColor: 'rgba(31, 111, 235, 0.3)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <LevelIcon size={14} style={{ color: 'var(--ao-button.linkForeground)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--ao-button.linkForeground)' }}>
            当前: {currentLevelInfo.label}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(88, 166, 255, 0.2)', color: 'var(--ao-button.linkForeground)' }}>
            优先级 {currentLevelInfo.priority}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          {currentLevelInfo.description}
        </p>
      </div>

      {/* Tenant ID Input (for tenant level) */}
      {configLevel === 'tenant' && (
        <div className="space-y-2">
          <Label className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>租户 ID</Label>
          <Input
            type="text"
            value={tenantId ?? ''}
            onChange={(e) => setTenantId(e.target.value || null)}
            placeholder="输入租户 ID"
            style={{
              backgroundColor: 'var(--ao-commandPalette.footerBackground)',
              borderColor: 'var(--ao-border)',
              color: 'var(--ao-foreground)',
            }}
          />
        </div>
      )}

      {/* User ID Input (for user level) */}
      {configLevel === 'user' && (
        <div className="space-y-2">
          <Label className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>用户 ID</Label>
          <Input
            type="text"
            value={userId ?? ''}
            onChange={(e) => setUserId(e.target.value || null)}
            placeholder="输入用户 ID"
            style={{
              backgroundColor: 'var(--ao-commandPalette.footerBackground)',
              borderColor: 'var(--ao-border)',
              color: 'var(--ao-foreground)',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ==================== Config Priority Preview ====================

function ConfigPriorityPreview() {
  const { configLevel } = useModelConfig()

  const levels = (Object.keys(CONFIG_LEVEL_INFO) as ConfigLevel[]).sort(
    (a, b) => CONFIG_LEVEL_INFO[b].priority - CONFIG_LEVEL_INFO[a].priority
  )

  return (
    <div className="space-y-3">
      <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>配置优先级</Label>
      <div className="space-y-2">
        {levels.map((level, _index) => {
          const info = CONFIG_LEVEL_INFO[level]
          const isActive = configLevel === level
          return (
            <div
              key={level}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg border',
                isActive && 'border-[var(--ao-button.linkForeground)]'
              )}
              style={{
                backgroundColor: isActive ? 'rgba(31, 111, 235, 0.15)' : 'var(--ao-bottomPanel.background)',
                borderColor: isActive ? 'var(--ao-button.linkForeground)' : 'var(--ao-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: isActive ? 'var(--ao-button.linkForeground)' : 'var(--ao-border)',
                    color: isActive ? 'var(--ao-activityBar.activeForeground)' : 'var(--ao-workbench.secondaryForeground)',
                  }}
                >
                  {info.priority}
                </span>
                <span style={{ color: isActive ? 'var(--ao-foreground)' : 'var(--ao-workbench.secondaryForeground)' }}>
                  {info.label}
                </span>
              </div>
              {isActive && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--ao-sidebarActiveIndicator)', color: 'var(--ao-activityBar.activeForeground)' }}>
                  当前生效
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
        用户级 &gt; 租户级 &gt; 平台官方（高优先级会覆盖低优先级）
      </p>
    </div>
  )
}

// ==================== Provider Select ====================

function ProviderSelect() {
  const { providers, activeProvider, setActiveProvider } = useModelConfig()

  const providerList = Object.values(providers).filter((p) => p.isActive)

  return (
    <div className="space-y-3">
      <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>选择提供商</Label>
      <div className="grid grid-cols-2 gap-2">
        {providerList.map((provider) => (
          <button
            key={provider.type}
            onClick={() => setActiveProvider(provider.type)}
            className={cn(
              'px-3 py-3 text-sm rounded-lg border transition-all duration-200 text-left',
              activeProvider === provider.type
                ? 'border-transparent shadow-sm'
                : 'border-[var(--ao-border)] hover:border-[var(--ao-workbench.secondaryForeground)]'
            )}
            style={activeProvider === provider.type ? {
              backgroundColor: 'var(--ao-sidebarActiveIndicator)',
              color: 'var(--ao-activityBar.activeForeground)',
              boxShadow: '0 2px 4px rgba(35, 134, 54, 0.3)'
            } : {
              backgroundColor: 'var(--ao-bottomPanel.background)',
              color: 'var(--ao-foreground)'
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
      <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>选择模型</Label>
      <Select value={selectedModel ?? ''} onValueChange={setSelectedModel}>
        <SelectTrigger 
          className="w-full"
          style={{ 
            backgroundColor: 'var(--ao-commandPalette.footerBackground)', 
            borderColor: 'var(--ao-border)', 
            color: 'var(--ao-foreground)' 
          }}
        >
          <SelectValue placeholder="请选择模型" />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          {activeProviderConfig.models.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              style={{ color: 'var(--ao-foreground)' }}
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
      <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>API 密钥</Label>
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          value={activeProviderConfig.apiKey}
          onChange={(e) => updateApiKey(activeProvider, e.target.value)}
          placeholder="请输入 API 密钥"
          className="pr-10"
          style={{ 
            backgroundColor: 'var(--ao-commandPalette.footerBackground)', 
            borderColor: 'var(--ao-border)', 
            color: 'var(--ao-foreground)' 
          }}
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
          style={{ color: 'var(--ao-workbench.secondaryForeground)' }}
        >
          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
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
      <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>API 端点（可选）</Label>
      <Input
        type="text"
        value={activeProviderConfig.baseUrl ?? ''}
        onChange={(e) => updateBaseUrl(activeProvider, e.target.value)}
        placeholder="自定义 API 端点 URL"
        style={{
          backgroundColor: 'var(--ao-commandPalette.footerBackground)',
          borderColor: 'var(--ao-border)',
          color: 'var(--ao-foreground)'
        }}
      />
      <p className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
        留空使用默认端点
      </p>
    </div>
  )
}

// ==================== Plan/Act Mode Config ====================

function PlanActModeConfig() {
  const {
    agentMode,
    setAgentMode,
    enableRoutingConfig,
    setEnableRoutingConfig,
    routingConfig,
    providers,
    updateModeConfig,
    activeProvider,
    selectedModel,
  } = useModelConfig()
  const activeProviderConfig = useActiveProviderConfig()

  // Initialize routing config with current settings
  const initializeRoutingConfig = (mode: AgentMode) => {
    const currentConfig: ModeConfig = {
      provider: activeProvider,
      modelId: selectedModel ?? '',
      apiKey: activeProviderConfig?.apiKey,
      baseUrl: activeProviderConfig?.baseUrl,
    }
    if (mode === 'act') {
      updateModeConfig('act', currentConfig)
    } else {
      updateModeConfig('plan', currentConfig)
    }
  }

  const handleEnableChange = (enabled: boolean) => {
    if (enabled && !routingConfig) {
      // Initialize both modes with current settings
      const currentConfig: ModeConfig = {
        provider: activeProvider,
        modelId: selectedModel ?? '',
        apiKey: activeProviderConfig?.apiKey,
        baseUrl: activeProviderConfig?.baseUrl,
      }
      updateModeConfig('act', currentConfig)
      updateModeConfig('plan', { ...currentConfig, apiKey: undefined })
    }
    setEnableRoutingConfig(enabled)
  }

  const getProviderModels = (provider: string) => {
    return providers[provider as keyof typeof providers]?.models ?? []
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
          <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>Plan/Act 双配置</Label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
            {enableRoutingConfig ? '启用' : '禁用'}
          </span>
          <Switch
            checked={enableRoutingConfig}
            onCheckedChange={handleEnableChange}
          />
        </div>
      </div>

      {enableRoutingConfig && (
        <>
          {/* Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAgentMode('plan')
                if (!routingConfig) initializeRoutingConfig('plan')
              }}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                agentMode === 'plan'
                  ? 'border-transparent'
                  : 'border-[var(--ao-border)] hover:border-[var(--ao-workbench.secondaryForeground)]'
              )}
              style={agentMode === 'plan' ? {
                backgroundColor: 'var(--ao-infoForeground)',
                color: 'var(--ao-activityBar.activeForeground)',
              } : {
                backgroundColor: 'var(--ao-bottomPanel.background)',
                color: 'var(--ao-foreground)',
              }}
            >
              Plan 模式
            </button>
            <button
              onClick={() => {
                setAgentMode('act')
                if (!routingConfig) initializeRoutingConfig('act')
              }}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                agentMode === 'act'
                  ? 'border-transparent'
                  : 'border-[var(--ao-border)] hover:border-[var(--ao-workbench.secondaryForeground)]'
              )}
              style={agentMode === 'act' ? {
                backgroundColor: 'var(--ao-sidebarActiveIndicator)',
                color: 'var(--ao-activityBar.activeForeground)',
              } : {
                backgroundColor: 'var(--ao-bottomPanel.background)',
                color: 'var(--ao-foreground)',
              }}
            >
              Act 模式
            </button>
          </div>

          {/* Mode Description */}
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              backgroundColor: agentMode === 'plan' ? 'rgba(163, 113, 247, 0.1)' : 'rgba(35, 134, 54, 0.1)',
              border: `1px solid ${agentMode === 'plan' ? 'rgba(163, 113, 247, 0.3)' : 'rgba(35, 134, 54, 0.3)'}`,
              color: 'var(--ao-workbench.secondaryForeground)',
            }}
          >
            {agentMode === 'plan' ? (
              <p><strong style={{ color: 'var(--ao-infoForeground)' }}>Plan 模式</strong>：用于生成任务计划的阶段，仅使用只读工具</p>
            ) : (
              <p><strong style={{ color: 'var(--ao-sidebarActiveIndicator)' }}>Act 模式</strong>：用于执行已批准计划的阶段，可以使用所有工具</p>
            )}
          </div>

          {/* Mode-specific Configuration */}
          {routingConfig && (
            <div className="space-y-3">
              <Label className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
                {agentMode === 'plan' ? 'Plan' : 'Act'} 模式配置
              </Label>

              {/* Provider Select */}
              <Select
                value={(agentMode === 'plan' ? routingConfig.planMode?.provider : routingConfig.actMode.provider) ?? activeProvider}
                onValueChange={(value) => updateModeConfig(agentMode, { provider: value as typeof activeProvider, modelId: '' })}
              >
                <SelectTrigger
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--ao-commandPalette.footerBackground)',
                    borderColor: 'var(--ao-border)',
                    color: 'var(--ao-foreground)',
                  }}
                >
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
                  {Object.values(providers).filter((p) => p.isActive).map((provider) => (
                    <SelectItem
                      key={provider.type}
                      value={provider.type}
                      style={{ color: 'var(--ao-foreground)' }}
                    >
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Model Select */}
              <Select
                value={(agentMode === 'plan' ? routingConfig.planMode?.modelId : routingConfig.actMode.modelId) ?? selectedModel ?? ''}
                onValueChange={(value) => updateModeConfig(agentMode, { modelId: value })}
              >
                <SelectTrigger
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--ao-commandPalette.footerBackground)',
                    borderColor: 'var(--ao-border)',
                    color: 'var(--ao-foreground)',
                  }}
                >
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
                  {getProviderModels(
                    (agentMode === 'plan' ? routingConfig.planMode?.provider : routingConfig.actMode.provider) ?? activeProvider
                  ).map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      style={{ color: 'var(--ao-foreground)' }}
                    >
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
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
      <Label className="text-sm" style={{ color: 'var(--ao-foreground)' }}>连接测试</Label>
      
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
          <span className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
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
            ? { backgroundColor: 'rgba(63, 185, 80, 0.1)', color: 'var(--ao-successForeground)', border: '1px solid rgba(63, 185, 80, 0.3)' }
            : { backgroundColor: 'rgba(248, 81, 73, 0.1)', color: 'var(--ao-errorForeground)', border: '1px solid rgba(248, 81, 73, 0.3)' }
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
        <div className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
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
        <h3 className="text-base font-semibold" style={{ color: 'var(--ao-foreground)' }}>模型提供商</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          配置 AI 模型提供商和 API 密钥
        </p>
      </div>

      {/* Configuration Level Section */}
      <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: 'var(--ao-foreground)' }}>
            层级配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ConfigLevelSelector />
          <ConfigPriorityPreview />
        </CardContent>
      </Card>

      {/* Provider Configuration Section */}
      <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: 'var(--ao-foreground)' }}>
            提供商配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

      {/* Plan/Act Mode Configuration */}
      <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
        <CardContent className="pt-6">
          <PlanActModeConfig />
        </CardContent>
      </Card>

      <div className="pt-4" style={{ borderTop: '1px solid var(--ao-border)' }}>
        <p className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          提示: API 密钥存储在本地浏览器中，请勿在公共电脑上保存敏感密钥。
        </p>
      </div>
    </div>
  )
}

export default ModelProviderSettings
