import { useState, useMemo, useCallback } from 'react'
import {
  Bot,
  Settings,
  Plus,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  History,
  Brain,
  Gauge,
  Zap,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type ModelProvider = 'openai' | 'zhipu' | 'dashscope' | 'deepseek' | 'minimax'

export interface SubAgentModelParameter {
  name: string
  value: number | string
  min?: number
  max?: number
  step?: number
}

export interface ModelConfig {
  subAgentId: string
  provider: ModelProvider
  modelName: string
  temperature: number
  maxTokens: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
  customParameters: SubAgentModelParameter[]
  fallbackEnabled: boolean
  fallbackProvider?: ModelProvider
  fallbackModel?: string
  timeout: number
  maxRetries: number
  lastModified: string
  version: number
}

export interface ModelAuditEntry {
  id: string
  timestamp: string
  action: 'create' | 'update' | 'apply' | 'rollback'
  actor: string
  before?: Partial<ModelConfig>
  after?: Partial<ModelConfig>
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface SubAgentModelConfigProps {
  className?: string
}

// Mock Sub-Agent list
const MOCK_SUB_AGENTS = [
  { id: 'subagent-001', name: 'HR助手', template: 'specialist', enabled: true },
  { id: 'subagent-002', name: '财务分析师', template: 'analyst', enabled: true },
  { id: 'subagent-003', name: '销售协调员', template: 'coordinator', enabled: true },
  { id: 'subagent-004', name: 'IT支持助手', template: 'general', enabled: false },
]

// Mock providers with models
const MOCK_PROVIDERS: { id: ModelProvider; name: string; models: string[] }[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'zhipu', name: '智谱AI', models: ['glm-4', 'glm-4-flash', 'glm-4-plus'] },
  { id: 'dashscope', name: '百炼', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'minimax', name: 'MiniMax', models: ['abab6-chat', 'abab6-gsht'] },
]

// Default parameters for each provider
const DEFAULT_PARAMS: Record<ModelProvider, { temperature: number; maxTokens: number; topP: number }> = {
  openai: { temperature: 0.7, maxTokens: 4096, topP: 1.0 },
  zhipu: { temperature: 0.8, maxTokens: 4096, topP: 0.95 },
  dashscope: { temperature: 0.75, maxTokens: 4096, topP: 0.95 },
  deepseek: { temperature: 0.7, maxTokens: 4096, topP: 1.0 },
  minimax: { temperature: 0.8, maxTokens: 4096, topP: 0.95 },
}

// Mock audit history
const createMockAuditHistory = (): ModelAuditEntry[] => [
  {
    id: 'audit-001',
    timestamp: '2026-03-24T10:30:00Z',
    action: 'apply',
    actor: 'admin',
    after: { provider: 'openai', modelName: 'gpt-4o' },
    status: 'success',
  },
  {
    id: 'audit-002',
    timestamp: '2026-03-24T09:15:00Z',
    action: 'update',
    actor: 'admin',
    before: { temperature: 0.7 },
    after: { temperature: 0.8 },
    status: 'success',
  },
  {
    id: 'audit-003',
    timestamp: '2026-03-23T16:45:00Z',
    action: 'update',
    actor: 'admin',
    before: { maxTokens: 2048 },
    after: { maxTokens: 4096 },
    status: 'success',
  },
]

export function SubAgentModelConfig({ className = '' }: SubAgentModelConfigProps) {
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null)
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null)
  const [auditHistory] = useState<ModelAuditEntry[]>(createMockAuditHistory)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Get selected sub-agent info
  const selectedSubAgent = useMemo(() => {
    return MOCK_SUB_AGENTS.find(a => a.id === selectedSubAgentId)
  }, [selectedSubAgentId])

  // Get selected provider info
  const selectedProvider = useMemo(() => {
    if (!modelConfig) return null
    return MOCK_PROVIDERS.find(p => p.id === modelConfig.provider)
  }, [modelConfig])

  // Load model config for selected sub-agent
  const handleSelectSubAgent = useCallback((subAgentId: string) => {
    setSelectedSubAgentId(subAgentId)
    // Mock: load default model config
    setModelConfig({
      subAgentId,
      provider: 'openai',
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0,
      presencePenalty: 0,
      frequencyPenalty: 0,
      customParameters: [],
      fallbackEnabled: false,
      timeout: 30,
      maxRetries: 3,
      lastModified: new Date().toISOString(),
      version: 1,
    })
    setSubmitMessage(null)
  }, [])

  // Update provider
  const handleProviderChange = useCallback((provider: ModelProvider) => {
    if (!modelConfig) return
    const defaults = DEFAULT_PARAMS[provider]
    const providerInfo = MOCK_PROVIDERS.find(p => p.id === provider)
    setModelConfig(prev => prev ? {
      ...prev,
      provider,
      modelName: providerInfo?.models[0] || '',
      temperature: defaults.temperature,
      maxTokens: defaults.maxTokens,
      topP: defaults.topP,
      lastModified: new Date().toISOString(),
    } : null)
  }, [modelConfig])

  // Update model
  const handleModelChange = useCallback((modelName: string) => {
    if (!modelConfig) return
    setModelConfig(prev => prev ? {
      ...prev,
      modelName,
      lastModified: new Date().toISOString(),
    } : null)
  }, [modelConfig])

  // Update parameter
  const handleParameterChange = useCallback((param: string, value: number) => {
    if (!modelConfig) return
    setModelConfig(prev => prev ? {
      ...prev,
      [param]: value,
      lastModified: new Date().toISOString(),
    } : null)
  }, [modelConfig])

  // Toggle fallback
  const handleToggleFallback = useCallback(() => {
    if (!modelConfig) return
    setModelConfig(prev => prev ? {
      ...prev,
      fallbackEnabled: !prev.fallbackEnabled,
      lastModified: new Date().toISOString(),
    } : null)
  }, [modelConfig])

  // Update fallback settings
  const handleUpdateFallback = useCallback((updates: Partial<ModelConfig>) => {
    if (!modelConfig) return
    setModelConfig(prev => prev ? {
      ...prev,
      ...updates,
      lastModified: new Date().toISOString(),
    } : null)
  }, [modelConfig])

  // Apply model config
  const handleApply = useCallback(async () => {
    if (!modelConfig) return

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setModelConfig(prev => prev ? {
        ...prev,
        version: prev.version + 1,
        lastModified: new Date().toISOString(),
      } : null)
      setSubmitMessage({ type: 'success', text: '模型配置已应用' })
    } catch {
      setSubmitMessage({ type: 'error', text: '应用失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [modelConfig])

  // Rollback
  const handleRollback = useCallback(async () => {
    if (!modelConfig || modelConfig.version <= 1) return

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setModelConfig(prev => prev ? {
        ...prev,
        version: prev.version - 1,
        lastModified: new Date().toISOString(),
      } : null)
      setSubmitMessage({ type: 'success', text: '已回滚到上一版本' })
    } catch {
      setSubmitMessage({ type: 'error', text: '回滚失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [modelConfig])

  // Reset to defaults
  const handleResetToDefaults = useCallback(() => {
    if (!modelConfig) return
    const defaults = DEFAULT_PARAMS[modelConfig.provider]
    setModelConfig(prev => prev ? {
      ...prev,
      temperature: defaults.temperature,
      maxTokens: defaults.maxTokens,
      topP: defaults.topP,
      presencePenalty: 0,
      frequencyPenalty: 0,
      customParameters: [],
      lastModified: new Date().toISOString(),
    } : null)
    setSubmitMessage({ type: 'success', text: '已恢复默认参数' })
  }, [modelConfig])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Sub-Agent 模型配置
          </h2>
          <p className="text-muted-foreground">
            为 Sub-Agent 选择模型提供商和参数配置
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sub-Agent List */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                选择 Sub-Agent
              </h3>
              <div className="space-y-2">
                {MOCK_SUB_AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSubAgentId === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    } ${!agent.enabled ? 'opacity-50' : ''}`}
                    onClick={() => handleSelectSubAgent(agent.id)}
                    disabled={!agent.enabled}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      {agent.enabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6 capitalize">
                      {agent.template}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Config Panel */}
        <div className="col-span-12 lg:col-span-8">
          {!selectedSubAgentId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">请从左侧选择一个 Sub-Agent 进行模型配置</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                {/* Sub-Agent Info Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{selectedSubAgent?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {selectedSubAgent?.template}
                      </div>
                    </div>
                  </div>
                  {modelConfig && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        v{modelConfig.version}
                      </Badge>
                      <Badge variant="outline">
                        {selectedProvider?.name} / {modelConfig.modelName}
                      </Badge>
                    </div>
                  )}
                </div>

                {modelConfig && (
                  <Tabs defaultValue="provider">
                    <TabsList className="mb-4">
                      <TabsTrigger value="provider">提供商</TabsTrigger>
                      <TabsTrigger value="parameters">参数</TabsTrigger>
                      <TabsTrigger value="fallback">备用方案</TabsTrigger>
                      <TabsTrigger value="limits">限制</TabsTrigger>
                      <TabsTrigger value="audit">审计历史</TabsTrigger>
                    </TabsList>

                    {/* Provider Tab */}
                    <TabsContent value="provider" className="space-y-4">
                      {/* Provider Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          选择提供商
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                          {MOCK_PROVIDERS.map(provider => (
                            <button
                              key={provider.id}
                              className={`p-3 rounded-lg border text-center transition-colors ${
                                modelConfig.provider === provider.id
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => handleProviderChange(provider.id)}
                            >
                              <div className="font-medium text-sm">{provider.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Model Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          选择模型
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProvider?.models.map(model => (
                            <button
                              key={model}
                              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                                modelConfig.modelName === model
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => handleModelChange(model)}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Current Selection Summary */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">当前配置</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">提供商:</span>
                            <span className="font-medium">{selectedProvider?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">模型:</span>
                            <span className="font-medium">{modelConfig.modelName}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Parameters Tab */}
                    <TabsContent value="parameters" className="space-y-4">
                      <div className="space-y-4">
                        {/* Temperature */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <Gauge className="h-4 w-4" />
                              Temperature (创造性)
                            </Label>
                            <span className="text-sm font-medium">{modelConfig.temperature}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={modelConfig.temperature}
                            onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>精确</span>
                            <span>平衡</span>
                            <span>创造</span>
                          </div>
                        </div>

                        {/* Max Tokens */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <Sliders className="h-4 w-4" />
                              最大 Token 数
                            </Label>
                            <span className="text-sm font-medium">{modelConfig.maxTokens}</span>
                          </div>
                          <input
                            type="range"
                            min="256"
                            max="16384"
                            step="256"
                            value={modelConfig.maxTokens}
                            onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>256</span>
                            <span>8192</span>
                            <span>16384</span>
                          </div>
                        </div>

                        {/* Top P */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Top P (核采样)</Label>
                            <span className="text-sm font-medium">{modelConfig.topP}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={modelConfig.topP}
                            onChange={(e) => handleParameterChange('topP', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        {/* Presence Penalty */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Presence Penalty (出现惩罚)</Label>
                            <span className="text-sm font-medium">{modelConfig.presencePenalty}</span>
                          </div>
                          <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={modelConfig.presencePenalty}
                            onChange={(e) => handleParameterChange('presencePenalty', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        {/* Frequency Penalty */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Frequency Penalty (频率惩罚)</Label>
                            <span className="text-sm font-medium">{modelConfig.frequencyPenalty}</span>
                          </div>
                          <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={modelConfig.frequencyPenalty}
                            onChange={(e) => handleParameterChange('frequencyPenalty', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <Button variant="outline" onClick={handleResetToDefaults}>
                        恢复默认参数
                      </Button>
                    </TabsContent>

                    {/* Fallback Tab */}
                    <TabsContent value="fallback" className="space-y-4">
                      {/* Enable Fallback Toggle */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">启用备用方案</div>
                            <div className="text-xs text-muted-foreground">
                              当主模型失败时自动切换到备用模型
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={modelConfig.fallbackEnabled ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleToggleFallback}
                        >
                          {modelConfig.fallbackEnabled ? '启用' : '禁用'}
                        </Button>
                      </div>

                      {modelConfig.fallbackEnabled && (
                        <div className="space-y-4">
                          {/* Fallback Provider */}
                          <div className="space-y-2">
                            <Label>备用提供商</Label>
                            <select
                              className="w-full border rounded px-3 py-2"
                              value={modelConfig.fallbackProvider || ''}
                              onChange={(e) => handleUpdateFallback({ fallbackProvider: e.target.value as ModelProvider })}
                            >
                              <option value="">选择备用提供商</option>
                              {MOCK_PROVIDERS.filter(p => p.id !== modelConfig.provider).map(provider => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Fallback Model */}
                          {modelConfig.fallbackProvider && (
                            <div className="space-y-2">
                              <Label>备用模型</Label>
                              <select
                                className="w-full border rounded px-3 py-2"
                                value={modelConfig.fallbackModel || ''}
                                onChange={(e) => handleUpdateFallback({ fallbackModel: e.target.value })}
                              >
                                <option value="">选择备用模型</option>
                                {MOCK_PROVIDERS.find(p => p.id === modelConfig.fallbackProvider)?.models.map(model => (
                                  <option key={model} value={model}>
                                    {model}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Limits Tab */}
                    <TabsContent value="limits" className="space-y-4">
                      {/* Timeout */}
                      <div className="space-y-2">
                        <Label>请求超时 (秒)</Label>
                        <Input
                          type="number"
                          min="5"
                          max="300"
                          value={modelConfig.timeout}
                          onChange={(e) => handleParameterChange('timeout', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          超过此时间将视为请求失败
                        </p>
                      </div>

                      {/* Max Retries */}
                      <div className="space-y-2">
                        <Label>最大重试次数</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={modelConfig.maxRetries}
                          onChange={(e) => handleParameterChange('maxRetries', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          请求失败后的最大重试次数
                        </p>
                      </div>
                    </TabsContent>

                    {/* Audit History Tab */}
                    <TabsContent value="audit">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          审计历史
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          查看模型配置的变更历史和操作记录
                        </p>
                      </div>

                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {auditHistory.map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="mt-1">
                                {entry.action === 'create' && <Plus className="h-4 w-4 text-green-500" />}
                                {entry.action === 'update' && <Settings className="h-4 w-4 text-blue-500" />}
                                {entry.action === 'apply' && entry.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                {entry.action === 'apply' && entry.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                {entry.action === 'rollback' && <RotateCcw className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {entry.action === 'create' ? '创建' :
                                     entry.action === 'update' ? '更新' :
                                     entry.action === 'apply' ? '应用' :
                                     entry.action === 'rollback' ? '回滚' : entry.action}
                                  </span>
                                  <Badge
                                    variant={entry.status === 'success' ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {entry.status === 'success' ? '成功' : '失败'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(entry.timestamp).toLocaleString()}
                                  <span className="ml-2">by {entry.actor}</span>
                                </div>
                                {entry.errorMessage && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {entry.errorMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Action Buttons */}
                {modelConfig && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleRollback} disabled={isSubmitting || modelConfig.version <= 1}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        回滚
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {submitMessage && (
                        <span className={`text-sm ${
                          submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {submitMessage.text}
                        </span>
                      )}
                      <Button onClick={handleApply} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        应用配置
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}