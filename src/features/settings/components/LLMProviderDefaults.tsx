/**
 * LLM Provider Defaults - Story 21.2
 * LLM提供商默认设置
 * 
 * 功能：
 * - 设置全局和会话级别默认值
 * - 支持模型参数配置
 * - 持久化有效的默认选择
 */

import { useState, useMemo } from 'react'
import { 
  Settings, Globe, Layers, RotateCcw, 
  Info, AlertCircle, Check, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Types
export type DefaultLevel = 'global' | 'session'
export type ConfigStatus = 'active' | 'pending' | 'deprecated'
export type ParamType = 'number' | 'string' | 'boolean' | 'enum'

export interface ModelParameter {
  name: string
  type: ParamType
  defaultValue: string | number | boolean
  currentValue: string | number | boolean
  min?: number
  max?: number
  step?: number
  options?: string[]
  description: string
  required: boolean
}

export interface ProviderDefaultConfig {
  id: string
  level: DefaultLevel
  providerId: string
  providerName: string
  modelId: string
  modelName: string
  parameters: ModelParameter[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  status: ConfigStatus
  version: number
}

export interface DefaultSelectionHistory {
  id: string
  level: DefaultLevel
  previousProviderId: string
  previousModelId: string
  newProviderId: string
  newModelId: string
  changedBy: string
  changedAt: string
  reason: string
  rolledBack: boolean
}

export interface EffectiveDefaults {
  globalDefault: ProviderDefaultConfig | null
  sessionDefaults: ProviderDefaultConfig[]
  effectiveConfig: ProviderDefaultConfig | null
  pendingChanges: boolean
}

export interface LLMProviderDefaultsState {
  effectiveDefaults: EffectiveDefaults
  availableProviders: Array<{
    id: string
    name: string
    models: Array<{ id: string; name: string; parameters: ModelParameter[] }>
  }>
  history: DefaultSelectionHistory[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

// Mock data generators
const generateMockParameters = (): ModelParameter[] => [
  {
    name: 'temperature',
    type: 'number',
    defaultValue: 0.7,
    currentValue: 0.7,
    min: 0,
    max: 2,
    step: 0.1,
    description: '控制输出的随机性，值越大越随机',
    required: false,
  },
  {
    name: 'max_tokens',
    type: 'number',
    defaultValue: 4096,
    currentValue: 4096,
    min: 1,
    max: 128000,
    step: 1,
    description: '最大生成token数',
    required: true,
  },
  {
    name: 'top_p',
    type: 'number',
    defaultValue: 0.9,
    currentValue: 0.9,
    min: 0,
    max: 1,
    step: 0.1,
    description: '核采样参数',
    required: false,
  },
  {
    name: 'frequency_penalty',
    type: 'number',
    defaultValue: 0,
    currentValue: 0,
    min: -2,
    max: 2,
    step: 0.1,
    description: '频率惩罚',
    required: false,
  },
  {
    name: 'presence_penalty',
    type: 'number',
    defaultValue: 0,
    currentValue: 0,
    min: -2,
    max: 2,
    step: 0.1,
    description: '存在惩罚',
    required: false,
  },
  {
    name: 'stream',
    type: 'boolean',
    defaultValue: true,
    currentValue: true,
    description: '是否启用流式输出',
    required: false,
  },
]

const generateMockState = (): LLMProviderDefaultsState => ({
  effectiveDefaults: {
    globalDefault: {
      id: 'default-global',
      level: 'global',
      providerId: 'openai',
      providerName: 'OpenAI',
      modelId: 'gpt-4-turbo',
      modelName: 'GPT-4 Turbo',
      parameters: generateMockParameters(),
      isActive: true,
      createdAt: '2026-03-20T10:00:00Z',
      updatedAt: '2026-03-24T08:30:00Z',
      createdBy: 'admin',
      status: 'active',
      version: 3,
    },
    sessionDefaults: [
      {
        id: 'default-session-1',
        level: 'session',
        providerId: 'zhipu',
        providerName: '智谱AI',
        modelId: 'glm-4',
        modelName: 'GLM-4',
        parameters: generateMockParameters(),
        isActive: true,
        createdAt: '2026-03-23T14:00:00Z',
        updatedAt: '2026-03-24T09:00:00Z',
        createdBy: 'user1',
        status: 'active',
        version: 1,
      },
    ],
    effectiveConfig: null,
    pendingChanges: false,
  },
  availableProviders: [
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', parameters: generateMockParameters() },
        { id: 'gpt-4o', name: 'GPT-4o', parameters: generateMockParameters() },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', parameters: generateMockParameters() },
      ],
    },
    {
      id: 'zhipu',
      name: '智谱AI',
      models: [
        { id: 'glm-4', name: 'GLM-4', parameters: generateMockParameters() },
        { id: 'glm-3-turbo', name: 'GLM-3 Turbo', parameters: generateMockParameters() },
      ],
    },
    {
      id: 'dashscope',
      name: '百炼',
      models: [
        { id: 'qwen-max', name: 'Qwen Max', parameters: generateMockParameters() },
        { id: 'qwen-plus', name: 'Qwen Plus', parameters: generateMockParameters() },
      ],
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', parameters: generateMockParameters() },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', parameters: generateMockParameters() },
      ],
    },
  ],
  history: [
    {
      id: 'hist-1',
      level: 'global',
      previousProviderId: 'zhipu',
      previousModelId: 'glm-4',
      newProviderId: 'openai',
      newModelId: 'gpt-4-turbo',
      changedBy: 'admin',
      changedAt: '2026-03-24T08:30:00Z',
      reason: '性能优化，切换到更稳定的提供商',
      rolledBack: false,
    },
    {
      id: 'hist-2',
      level: 'session',
      previousProviderId: 'openai',
      previousModelId: 'gpt-3.5-turbo',
      newProviderId: 'zhipu',
      newModelId: 'glm-4',
      changedBy: 'user1',
      changedAt: '2026-03-24T09:00:00Z',
      reason: '会话需要中文优化',
      rolledBack: false,
    },
  ],
  isLoading: false,
  isSaving: false,
  error: null,
})

// Parameter Input Component
function ParameterInput({ 
  param, 
  onChange 
}: { 
  param: ModelParameter
  onChange: (value: string | number | boolean) => void 
}) {
  const renderInput = () => {
    switch (param.type) {
      case 'number':
        return (
          <div className="flex items-center gap-4">
            <Slider
              value={[param.currentValue as number]}
              min={param.min}
              max={param.max}
              step={param.step}
              onValueChange={(value) => onChange(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={param.currentValue as number}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              min={param.min}
              max={param.max}
              step={param.step}
              className="w-24"
            />
          </div>
        )
      case 'boolean':
        return (
          <Switch
            checked={param.currentValue as boolean}
            onCheckedChange={onChange}
          />
        )
      case 'enum':
        return (
          <Select
            value={param.currentValue as string}
            onValueChange={onChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            type="text"
            value={param.currentValue as string}
            onChange={(e) => onChange(e.target.value)}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {param.name}
          {param.required && <span className="text-red-500">*</span>}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{param.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <span className="text-sm text-muted-foreground">
          默认: {String(param.defaultValue)}
        </span>
      </div>
      {renderInput()}
    </div>
  )
}

// Config Card Component
function ConfigCard({ 
  config, 
  onEdit, 
  onDeactivate 
}: { 
  config: ProviderDefaultConfig
  onEdit: () => void
  onDeactivate: () => void 
}) {
  const levelColors: Record<DefaultLevel, string> = {
    global: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    session: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  }

  const statusColors: Record<ConfigStatus, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    deprecated: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{config.providerName}</CardTitle>
            <Badge className={levelColors[config.level]}>
              {config.level === 'global' ? '全局' : '会话'}
            </Badge>
            <Badge className={statusColors[config.status]}>
              {config.status === 'active' ? '生效中' : 
               config.status === 'pending' ? '待生效' : '已废弃'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              编辑
            </Button>
            {config.isActive && (
              <Button variant="ghost" size="sm" onClick={onDeactivate}>
                停用
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          模型: {config.modelName} | 版本: v{config.version}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间:</span>{' '}
              {new Date(config.createdAt).toLocaleString('zh-CN')}
            </div>
            <div>
              <span className="text-muted-foreground">更新时间:</span>{' '}
              {new Date(config.updatedAt).toLocaleString('zh-CN')}
            </div>
            <div>
              <span className="text-muted-foreground">创建者:</span> {config.createdBy}
            </div>
            <div>
              <span className="text-muted-foreground">参数数量:</span> {config.parameters.length}
            </div>
          </div>
          
          {/* Key Parameters Summary */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {config.parameters.slice(0, 4).map((param) => (
              <Badge key={param.name} variant="outline" className="text-xs">
                {param.name}: {String(param.currentValue)}
              </Badge>
            ))}
            {config.parameters.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{config.parameters.length - 4} 更多
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// History Item Component
function HistoryItem({ history }: { history: DefaultSelectionHistory }) {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg">
      <div className={`p-2 rounded-full ${history.level === 'global' ? 'bg-blue-100' : 'bg-purple-100'}`}>
        {history.level === 'global' ? (
          <Globe className="h-4 w-4 text-blue-600" />
        ) : (
          <Layers className="h-4 w-4 text-purple-600" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {history.previousProviderId}/{history.previousModelId}
          </span>
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          <span className="font-medium">
            {history.newProviderId}/{history.newModelId}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {history.reason}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>操作人: {history.changedBy}</span>
          <span>{new Date(history.changedAt).toLocaleString('zh-CN')}</span>
          {history.rolledBack && <Badge variant="outline">已回滚</Badge>}
        </div>
      </div>
      {!history.rolledBack && (
        <Button variant="ghost" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          回滚
        </Button>
      )}
    </div>
  )
}

// Main Component
export function LLMProviderDefaults() {
  const [state, setState] = useState<LLMProviderDefaultsState>(generateMockState())
  const [activeTab, setActiveTab] = useState<string>('defaults')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<DefaultLevel>('global')
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [currentParams, setCurrentParams] = useState<ModelParameter[]>([])

  const globalDefault = state.effectiveDefaults.globalDefault
  const sessionDefaults = state.effectiveDefaults.sessionDefaults

  const selectedProvider = useMemo(() => 
    state.availableProviders.find(p => p.id === selectedProviderId),
    [state.availableProviders, selectedProviderId]
  )

  const selectedModel = useMemo(() =>
    selectedProvider?.models.find(m => m.id === selectedModelId),
    [selectedProvider, selectedModelId]
  )

  const handleProviderChange = (providerId: string) => {
    setSelectedProviderId(providerId)
    setSelectedModelId('')
    setCurrentParams([])
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    const model = selectedProvider?.models.find(m => m.id === modelId)
    if (model) {
      setCurrentParams(model.parameters.map(p => ({ ...p })))
    }
  }

  const handleParamChange = (index: number, value: string | number | boolean) => {
    setCurrentParams(prev => prev.map((p, i) => 
      i === index ? { ...p, currentValue: value } : p
    ))
  }

  const handleSave = () => {
    // Save logic would go here
    setState(prev => ({ ...prev, isSaving: true }))
    setTimeout(() => {
      setState(prev => ({ ...prev, isSaving: false }))
      setEditDialogOpen(false)
    }, 1000)
  }

  const handleResetToDefault = (paramIndex: number) => {
    setCurrentParams(prev => prev.map((p, i) =>
      i === paramIndex ? { ...p, currentValue: p.defaultValue } : p
    ))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            LLM 提供商默认设置
          </h2>
          <p className="text-muted-foreground">
            配置全局和会话级别的 LLM 提供商默认值
          </p>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedProviderId('')
              setSelectedModelId('')
              setCurrentParams([])
            }}>
              新建默认配置
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>配置默认提供商</DialogTitle>
              <DialogDescription>
                设置全局或会话级别的 LLM 提供商默认值
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Level Selection */}
              <div className="space-y-2">
                <Label>配置级别</Label>
                <Select
                  value={selectedLevel}
                  onValueChange={(v) => setSelectedLevel(v as DefaultLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        全局默认
                      </div>
                    </SelectItem>
                    <SelectItem value="session">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        会话默认
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>提供商</Label>
                <Select
                  value={selectedProviderId}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.availableProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Selection */}
              {selectedProvider && (
                <div className="space-y-2">
                  <Label>模型</Label>
                  <Select
                    value={selectedModelId}
                    onValueChange={handleModelChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider.models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Parameters Configuration */}
              {selectedModel && currentParams.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>模型参数</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentParams(currentParams.map(p => ({ ...p, currentValue: p.defaultValue })))}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重置全部
                    </Button>
                  </div>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    {currentParams.map((param, index) => (
                      <div key={param.name} className="flex items-center gap-2">
                        <div className="flex-1">
                          <ParameterInput
                            param={param}
                            onChange={(value) => handleParamChange(index, value)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetToDefault(index)}
                          disabled={param.currentValue === param.defaultValue}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning for Global Changes */}
              {selectedLevel === 'global' && selectedModel && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      全局配置变更影响
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      全局默认值变更将影响所有未设置会话级默认值的会话
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!selectedModelId || state.isSaving}>
                {state.isSaving ? '保存中...' : '保存配置'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="defaults">当前配置</TabsTrigger>
          <TabsTrigger value="history">变更历史</TabsTrigger>
        </TabsList>

        <TabsContent value="defaults" className="space-y-6">
          {/* Global Default */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              全局默认
            </h3>
            {globalDefault ? (
              <ConfigCard
                config={globalDefault}
                onEdit={() => {
                  setSelectedLevel('global')
                  setSelectedProviderId(globalDefault.providerId)
                  setSelectedModelId(globalDefault.modelId)
                  setCurrentParams(globalDefault.parameters.map(p => ({ ...p })))
                  setEditDialogOpen(true)
                }}
                onDeactivate={() => {}}
              />
            ) : (
              <Card>
                <CardContent className="py-0">
                  <EmptyState variant="data" title="未设置全局默认" description="点击上方按钮创建" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Session Defaults */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5" />
              会话默认
            </h3>
            {sessionDefaults.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sessionDefaults.map((config) => (
                  <ConfigCard
                    key={config.id}
                    config={config}
                    onEdit={() => {
                      setSelectedLevel('session')
                      setSelectedProviderId(config.providerId)
                      setSelectedModelId(config.modelId)
                      setCurrentParams(config.parameters.map(p => ({ ...p })))
                      setEditDialogOpen(true)
                    }}
                    onDeactivate={() => {}}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-0">
                  <EmptyState variant="data" title="未设置会话默认" description="当前没有会话默认配置" />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">变更历史</h3>
            <Badge variant="outline">{state.history.length} 条记录</Badge>
          </div>
          <div className="space-y-3">
            {state.history.map((item) => (
              <HistoryItem key={item.id} history={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Effective Config Summary */}
      {state.effectiveDefaults.pendingChanges && (
        <Card className="border-yellow-500">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>有待生效的配置变更</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  撤销
                </Button>
                <Button size="sm">
                  <Check className="h-4 w-4 mr-1" />
                  应用变更
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LLMProviderDefaults
