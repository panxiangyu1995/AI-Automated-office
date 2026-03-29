/**
 * PlanActModeConfig.tsx
 * Story 21.24 - LLM Provider Plan/Act 双配置模式
 *
 * 功能：
 * - Plan模式配置（只读工具专用Provider）
 * - Act模式配置（全部工具使用Provider）
 * - 当前模式指示器
 * - Plan/Act模式切换
 */

import { useState } from 'react'
import {
  Bot,
  Eye,
  Rocket,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

/** Agent运行模式 */
export type AgentMode = 'plan' | 'act'

/** 单个模式的提供商配置 */
export interface ModeProviderConfig {
  providerId: string
  modelId: string
  apiEndpoint?: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
}

/** Plan/Act双配置 */
export interface PlanActConfig {
  planMode: ModeProviderConfig | null
  actMode: ModeProviderConfig
  currentMode: AgentMode
}

/** 提供商信息 */
export interface ProviderInfo {
  id: string
  name: string
  type: string
  availableModels: string[]
}

/** 模式状态 */
export interface ModeStatus {
  currentMode: AgentMode
  isReadOnlyToolsOnly: boolean
  availableToolsCount: number
  filteredToolsCount: number
}

// ============================================================================
// 常量定义

const AGENT_MODE_INFO = {
  plan: {
    label: 'Plan 模式',
    description: '规划模式，仅允许使用只读工具，适合分析、检索、调研类任务',
    icon: Eye,
    color: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  act: {
    label: 'Act 模式',
    description: '执行模式，允许使用全部工具，适合需要实际操作的任务',
    icon: Rocket,
    color: 'text-green-500',
    badge: 'bg-green-100 text-green-700 border-green-200',
  },
} as const

// ============================================================================
// Plan模式配置卡片

interface PlanModeCardProps {
  config: ModeProviderConfig | null
  providers: ProviderInfo[]
  onConfigChange: (config: ModeProviderConfig | null) => void
  onTestConnection?: (config: ModeProviderConfig) => Promise<boolean>
}

function PlanModeCard({
  config,
  providers,
  onConfigChange,
  onTestConnection,
}: PlanModeCardProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null)

  const selectedProvider = providers.find((p) => p.id === config?.providerId)
  const availableModels = selectedProvider?.availableModels || []

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    onConfigChange({
      providerId,
      modelId: provider?.availableModels[0] || '',
      apiEndpoint: config?.apiEndpoint,
      apiKey: config?.apiKey,
    })
  }

  const handleModelChange = (modelId: string) => {
    if (config) {
      onConfigChange({ ...config, modelId })
    }
  }

  const handleTestConnection = async () => {
    if (!config || !onTestConnection) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const success = await onTestConnection(config)
      setTestResult(success ? 'success' : 'failed')
    } catch {
      setTestResult('failed')
    }
    setIsTesting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Eye className={cn('h-4 w-4', AGENT_MODE_INFO.plan.color)} />
        <span className="font-medium">Plan 模式配置</span>
        <Badge variant="outline" className="text-xs">仅只读工具</Badge>
      </div>

      {config ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">提供商</Label>
              <Select value={config.providerId} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">模型</Label>
              <Select value={config.modelId} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !onTestConnection}
            >
              {isTesting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              测试连接
            </Button>
            {testResult === 'success' && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {testResult === 'failed' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-2">
          尚未配置Plan模式提供商
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Act模式配置卡片

interface ActModeCardProps {
  config: ModeProviderConfig
  providers: ProviderInfo[]
  onConfigChange: (config: ModeProviderConfig) => void
  onTestConnection?: (config: ModeProviderConfig) => Promise<boolean>
}

function ActModeCard({
  config,
  providers,
  onConfigChange,
  onTestConnection,
}: ActModeCardProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null)

  const selectedProvider = providers.find((p) => p.id === config.providerId)
  const availableModels = selectedProvider?.availableModels || []

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    onConfigChange({
      providerId,
      modelId: provider?.availableModels[0] || '',
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey,
    })
  }

  const handleModelChange = (modelId: string) => {
    onConfigChange({ ...config, modelId })
  }

  const handleTestConnection = async () => {
    if (!onTestConnection) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const success = await onTestConnection(config)
      setTestResult(success ? 'success' : 'failed')
    } catch {
      setTestResult('failed')
    }
    setIsTesting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Rocket className={cn('h-4 w-4', AGENT_MODE_INFO.act.color)} />
        <span className="font-medium">Act 模式配置</span>
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          全部工具
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">提供商</Label>
            <Select value={config.providerId} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">模型</Label>
            <Select value={config.modelId} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting || !onTestConnection}
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            测试连接
          </Button>
          {testResult === 'success' && (
            <Check className="h-4 w-4 text-green-500" />
          )}
          {testResult === 'failed' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 当前模式指示器

interface CurrentModeIndicatorProps {
  status: ModeStatus
  onModeSwitch?: (mode: AgentMode) => void
}

function CurrentModeIndicator({ status, onModeSwitch }: CurrentModeIndicatorProps) {
  const modeInfo = AGENT_MODE_INFO[status.currentMode]
  const Icon = modeInfo.icon

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-full bg-background', modeInfo.badge)}>
          <Icon className={cn('h-5 w-5', modeInfo.color)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{modeInfo.label}</span>
            <Badge variant="outline" className="text-xs">
              {status.currentMode === 'plan'
                ? `${status.filteredToolsCount}/${status.availableToolsCount} 工具可用`
                : `${status.availableToolsCount} 工具可用`}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{modeInfo.description}</p>
        </div>
      </div>

      {onModeSwitch && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onModeSwitch(status.currentMode === 'plan' ? 'act' : 'plan')}
          className="gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          切换到 {status.currentMode === 'plan' ? 'Act' : 'Plan'}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// 主配置组件

interface PlanActModeConfigProps {
  className?: string
  initialConfig?: Partial<PlanActConfig>
  providers?: ProviderInfo[]
  onConfigChange?: (config: PlanActConfig) => void
  onModeSwitch?: (mode: AgentMode) => void
}

export function PlanActModeConfig({
  className,
  initialConfig,
  providers = [],
  onConfigChange,
  onModeSwitch,
}: PlanActModeConfigProps) {
  const [config, setConfig] = useState<PlanActConfig>({
    planMode: initialConfig?.planMode || null,
    actMode: initialConfig?.actMode || {
      providerId: providers[0]?.id || '',
      modelId: providers[0]?.availableModels[0] || '',
    },
    currentMode: initialConfig?.currentMode || 'act',
  })

  const [modeStatus] = useState<ModeStatus>({
    currentMode: config.currentMode,
    isReadOnlyToolsOnly: config.currentMode === 'plan',
    availableToolsCount: config.currentMode === 'act' ? 156 : 45,
    filteredToolsCount: config.currentMode === 'plan' ? 45 : 156,
  })

  const handlePlanConfigChange = (planConfig: ModeProviderConfig | null) => {
    setConfig((prev) => {
      const newConfig = { ...prev, planMode: planConfig }
      onConfigChange?.(newConfig)
      return newConfig
    })
  }

  const handleActConfigChange = (actConfig: ModeProviderConfig) => {
    setConfig((prev) => {
      const newConfig = { ...prev, actMode: actConfig }
      onConfigChange?.(newConfig)
      return newConfig
    })
  }

  const handleModeSwitch = (mode: AgentMode) => {
    setConfig((prev) => {
      const newConfig = { ...prev, currentMode: mode }
      onConfigChange?.(newConfig)
      onModeSwitch?.(mode)
      return newConfig
    })
  }

  // 模拟测试连接
  const handleTestConnection = async (_cfg: ModeProviderConfig): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return Math.random() > 0.2
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Agent 模式配置</CardTitle>
        </div>
        <CardDescription>
          配置 Plan/Act 双模式使用的不同Provider，实现精细化的工具权限控制
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 当前模式指示器 */}
        <CurrentModeIndicator status={modeStatus} onModeSwitch={handleModeSwitch} />

        <Separator />

        {/* Plan/Act 配置Tabs */}
        <Tabs defaultValue="act" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan" className="gap-1">
              <Eye className="h-3 w-3" />
              Plan 模式
            </TabsTrigger>
            <TabsTrigger value="act" className="gap-1">
              <Rocket className="h-3 w-3" />
              Act 模式
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-4">
            <PlanModeCard
              config={config.planMode}
              providers={providers}
              onConfigChange={handlePlanConfigChange}
              onTestConnection={handleTestConnection}
            />

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Plan 模式说明:</strong> Plan模式仅允许使用标记为"只读"的工具，
                如查询、搜索、获取信息等操作。适合进行任务规划、数据分析、方案调研等场景。
              </p>
            </div>
          </TabsContent>

          <TabsContent value="act" className="mt-4">
            <ActModeCard
              config={config.actMode}
              providers={providers}
              onConfigChange={handleActConfigChange}
              onTestConnection={handleTestConnection}
            />

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Act 模式说明:</strong> Act模式允许使用全部工具，
                包括可能对系统进行修改的操作。结合敏感度评估和审批流程，确保操作安全。
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PlanActModeConfig
