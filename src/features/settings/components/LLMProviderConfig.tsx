/**
 * LLMProviderConfig.tsx
 * Story 21.1 - LLM提供商添加与配置
 * 
 * 功能：
 * - 提供商注册表：支持预设和自定义OpenAI兼容提供商
 * - 安全凭证存储：安全存储提供商凭证
 * - 连接测试：从控制平面测试提供商连接性
 */

import { useState, useMemo } from 'react'
import { 
  Plus, Trash2, Edit, Check, X, Eye, EyeOff, 
  RefreshCw, Server
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

/** 提供商类型 */
export type ProviderType = 
  | 'openai'       // OpenAI
  | 'anthropic'    // Anthropic Claude
  | 'azure'        // Azure OpenAI
  | 'dashscope'    // 阿里百炼
  | 'zhipu'        // 智谱AI
  | 'deepseek'     // DeepSeek
  | 'minimax'      // Minimax
  | 'moonshot'     // Moonshot
  | 'custom'       // 自定义

/** 提供商状态 */
export type ProviderStatus = 
  | 'active'       // 濂活
  | 'inactive'     // 未激活
  | 'testing'      // 测试中
  | 'error'        // 错误

/** 认证类型 */
export type AuthType = 
  | 'api_key'      // API Key
  | 'bearer'       // Bearer Token
  | 'oauth'        // OAuth 2.0
  | 'custom'       // 自定义头

/** 提供商配置 */
export interface ProviderConfig {
  id: string
  name: string
  type: ProviderType
  baseUrl: string
  authType: AuthType
  apiKey?: string // 加密存储
  headers?: Record<string, string>
  defaultModel?: string
  availableModels: string[]
  maxTokens: number
  temperature?: number
  timeout: number
  retryCount: number
  status: ProviderStatus
  lastTested?: Date
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

/** 连接测试结果 */
export interface ConnectionTestResult {
  providerId: string
  success: boolean
  latency?: number
  errorMessage?: string
  testedAt: Date
  modelAvailable: string[]
}

/** 提供商统计 */
export interface ProviderStats {
  totalProviders: number
  activeProviders: number
  totalRequests: number
  successRate: number
  averageLatency: number
  lastUpdated: Date
}

/** 配置变更记录 */
export interface ConfigChangeRecord {
  id: string
  providerId: string
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate'
  before?: Partial<ProviderConfig>
  after?: Partial<ProviderConfig>
  actor: string
  timestamp: Date
  reason?: string
}

/** LLM提供商配置状态 */
export interface LLMProviderConfigState {
  providers: ProviderConfig[]
  testResults: ConnectionTestResult[]
  changeHistory: ConfigChangeRecord[]
  stats: ProviderStats
  isEditing: boolean
  editingProviderId?: string
}

// ============================================================================
// 预设提供商模板

const PRESET_PROVIDERS: Partial<ProviderConfig>[] = [
  {
    type: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authType: 'api_key',
    availableModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    maxTokens: 128000,
    timeout: 60000,
    retryCount: 3,
  },
  {
    type: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    authType: 'api_key',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    maxTokens: 200000,
    timeout: 60000,
    retryCount: 3,
  },
  {
    type: 'dashscope',
    name: '阿里百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    authType: 'api_key',
    availableModels: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    maxTokens: 6000,
    timeout: 30000,
    retryCount: 3,
  },
  {
    type: 'zhipu',
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    authType: 'api_key',
    availableModels: ['glm-4-plus', 'glm-4-0520', 'glm-4-air', 'glm-4-airx'],
    maxTokens: 128000,
    timeout: 30000,
    retryCount: 3,
  },
  {
    type: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    authType: 'api_key',
    availableModels: ['deepseek-chat', 'deepseek-reasoner'],
    maxTokens: 64000,
    timeout: 30000,
    retryCount: 3,
  },
  {
    type: 'minimax',
    name: 'Minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    authType: 'api_key',
    availableModels: ['abab6.5-chat', 'abab6.5s-chat', 'abab5.5-chat'],
    maxTokens: 24000,
    timeout: 30000,
    retryCount: 3,
  },
  {
    type: 'azure',
    name: 'Azure OpenAI',
    baseUrl: '', // 用户需要填写
    authType: 'api_key',
    availableModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-35-turbo'],
    maxTokens: 128000,
    timeout: 60000,
    retryCount: 3,
  },
]

// ============================================================================
// 模拟数据

const createMockProviders = (): ProviderConfig[] => [
  {
    id: 'provider-1',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    authType: 'api_key',
    apiKey: 'sk-************',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    maxTokens: 128000,
    temperature: 0.7,
    timeout: 60000,
    retryCount: 3,
    status: 'active',
    lastTested: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'provider-2',
    name: '阿里百炼',
    type: 'dashscope',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    authType: 'api_key',
    apiKey: 'sk-************',
    defaultModel: 'qwen-max',
    availableModels: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    maxTokens: 6000,
    timeout: 30000,
    retryCount: 3,
    status: 'active',
    lastTested: new Date(Date.now() - 7200000),
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'provider-3',
    name: '智谱AI',
    type: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    authType: 'api_key',
    apiKey: '************',
    defaultModel: 'glm-4-plus',
    availableModels: ['glm-4-plus', 'glm-4-air'],
    maxTokens: 128000,
    timeout: 30000,
    retryCount: 3,
    status: 'inactive',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
]

const createMockTestResults = (): ConnectionTestResult[] => [
  {
    providerId: 'provider-1',
    success: true,
    latency: 245,
    testedAt: new Date(Date.now() - 3600000),
    modelAvailable: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    providerId: 'provider-2',
    success: true,
    latency: 156,
    testedAt: new Date(Date.now() - 7200000),
    modelAvailable: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
  },
]

// ============================================================================
// 子组件

/** 状态徽章 */
function StatusBadge({ status }: { status: ProviderStatus }) {
  const config: Record<ProviderStatus, { label: string; className: string }> = {
    active: { label: '已激活', className: 'bg-green-100 text-green-700' },
    inactive: { label: '未激活', className: 'bg-gray-100 text-gray-600' },
    testing: { label: '测试中', className: 'bg-blue-100 text-blue-700' },
    error: { label: '错误', className: 'bg-red-100 text-red-700' },
  }
  
  const { label, className } = config[status]
  
  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {label}
    </Badge>
  )
}

/** 提供商卡片 */
function ProviderCard({
  provider,
  testResult,
  onEdit,
  onDelete,
  onTest,
  onToggleActive,
}: {
  provider: ProviderConfig
  testResult?: ConnectionTestResult
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
  onToggleActive: (id: string) => void
}) {
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">{provider.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={provider.status} />
            <Badge variant="outline" className="text-xs">
              {provider.type}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs truncate">{provider.baseUrl}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">默认模型: </span>
            <span className="font-medium">{provider.defaultModel || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">最大Token: </span>
            <span>{(provider.maxTokens / 1000).toFixed(0)}K</span>
          </div>
          <div>
            <span className="text-muted-foreground">超时: </span>
            <span>{(provider.timeout / 1000).toFixed(0)}s</span>
          </div>
        </div>
        
        {testResult && (
          <div className={cn(
            'text-xs p-2 rounded mb-3',
            testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            <div className="flex items-center justify-between">
              <span>
                {testResult.success 
                  ? `连接成功 - 延迟: ${testResult.latency}ms`
                  : `连接失败: ${testResult.errorMessage}`}
              </span>
              <span className="text-muted-foreground">
                {new Date(testResult.testedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onTest(provider.id)}>
            <RefreshCw className="h-3 w-3 mr-1" />
            测试连接
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(provider.id)}>
            <Edit className="h-3 w-3 mr-1" />
            编辑
          </Button>
          <Button 
            size="sm" 
            variant={provider.status === 'active' ? 'outline' : 'default'}
            onClick={() => onToggleActive(provider.id)}
          >
            {provider.status === 'active' ? (
              <>
                <X className="h-3 w-3 mr-1" />
                停用
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                激活
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onDelete(provider.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** 提供商编辑对话框 */
function ProviderEditDialog({
  open,
  onClose,
  onSave,
  provider,
  presetProviders,
}: {
  open: boolean
  onClose: () => void
  onSave: (config: Partial<ProviderConfig>) => void
  provider?: ProviderConfig
  presetProviders: Partial<ProviderConfig>[]
}) {
  const [formData, setFormData] = useState<Partial<ProviderConfig>>(
    provider || { type: 'openai', authType: 'api_key', timeout: 30000, retryCount: 3, maxTokens: 4000, availableModels: [] }
  )
  const [showApiKey, setShowApiKey] = useState(false)
  
  const isEditing = !!provider
  
  const handlePresetSelect = (type: ProviderType) => {
    const preset = presetProviders.find(p => p.type === type)
    if (preset) {
      setFormData(prev => ({
        ...prev,
        ...preset,
        id: prev.id,
        apiKey: prev.apiKey,
      }))
    }
  }
  
  const handleSave = () => {
    onSave(formData)
    onClose()
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑提供商' : '添加提供商'}</DialogTitle>
          <DialogDescription>
            配置LLM提供商的连接信息和认证参数
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">提供商类型</label>
            <Select
              value={formData.type}
              onValueChange={(value: ProviderType) => handlePresetSelect(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetProviders.map(p => (
                  <SelectItem key={p.type} value={p.type!}>
                    {p.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">提供商名称</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入提供商名称"
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <label className="text-xs font-medium">API 基础URL</label>
            <Input
              value={formData.baseUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://api.example.com/v1"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">认证类型</label>
            <Select
              value={formData.authType}
              onValueChange={(value: AuthType) => setFormData(prev => ({ ...prev, authType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="oauth">OAuth 2.0</SelectItem>
                <SelectItem value="custom">自定义头</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">API Key</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="输入 API Key"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">默认模型</label>
            <Select
              value={formData.defaultModel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, defaultModel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择默认模型" />
              </SelectTrigger>
              <SelectContent>
                {(formData.availableModels || []).map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">最大Token数</label>
            <Input
              type="number"
              value={formData.maxTokens || 4000}
              onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4000 }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">请求超时 (ms)</label>
            <Input
              type="number"
              value={formData.timeout || 30000}
              onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">重试次数</label>
            <Input
              type="number"
              value={formData.retryCount || 3}
              onChange={(e) => setFormData(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 3 }))}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? '保存更改' : '添加提供商'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// 主组件

export function LLMProviderConfig() {
  const [state, setState] = useState<LLMProviderConfigState>({
    providers: createMockProviders(),
    testResults: createMockTestResults(),
    changeHistory: [],
    stats: {
      totalProviders: 3,
      activeProviders: 2,
      totalRequests: 150,
      successRate: 98.5,
      averageLatency: 185,
      lastUpdated: new Date(),
    },
    isEditing: false,
  })
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // 统计数据
  const stats = useMemo(() => {
    const activeProviders = state.providers.filter(p => p.status === 'active')
    return {
      ...state.stats,
      totalProviders: state.providers.length,
      activeProviders: activeProviders.length,
    }
  }, [state])
  
  // 添加提供商
  const handleAddProvider = (config: Partial<ProviderConfig>) => {
    const newProvider: ProviderConfig = {
      id: `provider-${Date.now()}`,
      name: config.name || '新提供商',
      type: config.type || 'custom',
      baseUrl: config.baseUrl || '',
      authType: config.authType || 'api_key',
      apiKey: config.apiKey,
      defaultModel: config.defaultModel,
      availableModels: config.availableModels || [],
      maxTokens: config.maxTokens || 4000,
      timeout: config.timeout || 30000,
      retryCount: config.retryCount || 3,
      status: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    setState(prev => ({
      ...prev,
      providers: [...prev.providers, newProvider],
    }))
  }
  
  // 编辑提供商
  const handleEditProvider = (id: string) => {
    setState(prev => ({
      ...prev,
      isEditing: true,
      editingProviderId: id,
    }))
    setShowAddDialog(true)
  }
  
  // 保存编辑
  const handleSaveProvider = (config: Partial<ProviderConfig>) => {
    if (state.editingProviderId) {
      setState(prev => ({
        ...prev,
        isEditing: false,
        editingProviderId: undefined,
        providers: prev.providers.map(p => 
          p.id === state.editingProviderId 
            ? { ...p, ...config, updatedAt: new Date() }
            : p
        ),
      }))
    } else {
      handleAddProvider(config)
    }
  }
  
  // 删除提供商
  const handleDeleteProvider = (id: string) => {
    setState(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id),
    }))
  }
  
  // 测试连接
  const handleTestConnection = (id: string) => {
    setState(prev => ({
      ...prev,
      providers: prev.providers.map(p => 
        p.id === id ? { ...p, status: 'testing' as const } : p
      ),
    }))
    
    // 模拟测试
    setTimeout(() => {
      const success = Math.random() > 0.2
      const latency = Math.floor(Math.random() * 300) + 50
      
      setState(prev => ({
        ...prev,
        providers: prev.providers.map(p => 
          p.id === id 
            ? { 
              ...p, 
              status: success ? 'active' as const : 'error' as const,
              lastTested: new Date(),
              errorMessage: success ? undefined : '连接超时',
            }
            : p
        ),
        testResults: [
          ...prev.testResults.filter(r => r.providerId !== id),
          {
            providerId: id,
            success,
            latency: success ? latency : undefined,
            errorMessage: success ? undefined : '连接超时',
            testedAt: new Date(),
            modelAvailable: success ? prev.providers.find(p => p.id === id)?.availableModels || [] : [],
          },
        ],
      }))
    }, 1500)
  }
  
  // 切换激活状态
  const handleToggleActive = (id: string) => {
    setState(prev => ({
      ...prev,
      providers: prev.providers.map(p => 
        p.id === id 
          ? { 
              ...p, 
              status: p.status === 'active' ? 'inactive' as const : 'active' as const,
              updatedAt: new Date(),
            }
          : p
      ),
    }))
  }
  
  // 关闭对话框
  const handleCloseDialog = () => {
    setShowAddDialog(false)
    setState(prev => ({
      ...prev,
      isEditing: false,
      editingProviderId: undefined,
    }))
  }
  
  const editingProvider = state.isEditing && state.editingProviderId
    ? state.providers.find(p => p.id === state.editingProviderId)
    : undefined
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">LLM 提供商配置</CardTitle>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-3 w-3 mr-1" />
            添加提供商
          </Button>
        </div>
        <CardDescription>
          管理LLM提供商的注册、认证和连接测试
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">提供商总数</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalProviders}</div>
            <div className="text-xs text-muted-foreground">个提供商</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">已激活</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeProviders}</div>
            <div className="text-xs text-muted-foreground">个激活</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">成功率</div>
            <div className="text-2xl font-bold text-amber-600">{stats.successRate}%</div>
            <div className="text-xs text-muted-foreground">请求成功率</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">平均延迟</div>
            <div className="text-2xl font-bold text-purple-600">{stats.averageLatency}ms</div>
            <div className="text-xs text-muted-foreground">响应时间</div>
          </Card>
        </div>
        
        <Separator className="my-4" />
        
        {/* 提供商列表 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">提供商列表</h3>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">已激活</SelectItem>
                <SelectItem value="inactive">未激活</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] pr-4">
          {state.providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              testResult={state.testResults.find(r => r.providerId === provider.id)}
              onEdit={handleEditProvider}
              onDelete={handleDeleteProvider}
              onTest={handleTestConnection}
              onToggleActive={handleToggleActive}
            />
          ))}
        </ScrollArea>
      </CardContent>
      
      {/* 编辑对话框 */}
      <ProviderEditDialog
        open={showAddDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveProvider}
        provider={editingProvider}
        presetProviders={PRESET_PROVIDERS}
      />
    </Card>
  )
}

export default LLMProviderConfig
