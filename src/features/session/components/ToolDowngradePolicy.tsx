/**
 * ToolDowngradePolicy - 工具调用降级方案组件
 * Story 5.8 - 工具调用降级方案
 */
import { useState, useCallback } from 'react'
import {
  ArrowDownCircle,
  Settings,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Zap,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const BRAND_COLOR = 'var(--ao-button.background)'

// 降级行为类型
export type DowngradeBehavior = 
  | 'fallback_tool'      // 使用备选工具
  | 'cached_response'    // 使用缓存响应
  | 'default_value'      // 使用默认值
  | 'graceful_error'     // 优雅错误处理
  | 'user_input'         // 请求用户输入
  | 'skip_operation'     // 跳过操作

// 降级触发条件
export type DowngradeTrigger =
  | 'tool_unavailable'   // 工具不可用
  | 'timeout'            // 超时
  | 'rate_limit'         // 限流
  | 'permission_denied'  // 权限拒绝
  | 'validation_failed'  // 验证失败
  | 'runtime_error'      // 运行时错误

// 降级配置
export interface DowngradeConfig {
  trigger: DowngradeTrigger
  enabled: boolean
  behavior: DowngradeBehavior
  fallbackToolId?: string
  cachedResponseMaxAge?: number // 缓存最大有效期（秒）
  defaultValue?: string
  userPrompt?: string           // 请求用户输入时的提示
  errorMessage?: string         // 自定义错误消息
  priority: number              // 优先级（数字越小越优先）
}

// 工具降级策略
export interface ToolDowngradePolicyConfig {
  id: string
  name: string
  description?: string
  toolId: string
  toolName: string
  globalEnabled: boolean
  defaultBehavior: DowngradeBehavior
  downgradeConfigs: DowngradeConfig[]
  notifyUser: boolean           // 是否通知用户
  logDowngrade: boolean         // 是否记录降级日志
  createdAt: number
  updatedAt: number
}

// 触发条件配置
const TRIGGER_CONFIG: Record<DowngradeTrigger, { label: string; description: string; color: string }> = {
  tool_unavailable: {
    label: '工具不可用',
    description: '目标工具无法访问或已下线',
    color: 'text-red-500',
  },
  timeout: {
    label: '执行超时',
    description: '工具执行超过时间限制',
    color: 'text-orange-500',
  },
  rate_limit: {
    label: '请求限流',
    description: 'API 调用达到限流阈值',
    color: 'text-yellow-500',
  },
  permission_denied: {
    label: '权限拒绝',
    description: '用户无执行该工具的权限',
    color: 'text-purple-500',
  },
  validation_failed: {
    label: '验证失败',
    description: '输入参数验证失败',
    color: 'text-blue-500',
  },
  runtime_error: {
    label: '运行时错误',
    description: '工具执行过程中发生错误',
    color: 'text-red-500',
  },
}

// 降级行为配置
const BEHAVIOR_CONFIG: Record<DowngradeBehavior, { label: string; description: string; icon: React.ReactNode }> = {
  fallback_tool: {
    label: '备选工具',
    description: '使用配置的备选工具替代执行',
    icon: <Zap className="h-3 w-3" />,
  },
  cached_response: {
    label: '缓存响应',
    description: '返回最近一次成功的缓存结果',
    icon: <Shield className="h-3 w-3" />,
  },
  default_value: {
    label: '默认值',
    description: '返回预设的默认值',
    icon: <Settings className="h-3 w-3" />,
  },
  graceful_error: {
    label: '优雅错误',
    description: '返回友好的错误提示',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  user_input: {
    label: '请求用户输入',
    description: '提示用户提供替代输入或决策',
    icon: <Info className="h-3 w-3" />,
  },
  skip_operation: {
    label: '跳过操作',
    description: '静默跳过该操作继续执行',
    icon: <ArrowDownCircle className="h-3 w-3" />,
  },
}

// 默认降级配置
function createDefaultDowngradeConfigs(): DowngradeConfig[] {
  return [
    {
      trigger: 'tool_unavailable',
      enabled: true,
      behavior: 'graceful_error',
      priority: 1,
      errorMessage: '该工具当前不可用，请稍后重试',
    },
    {
      trigger: 'timeout',
      enabled: true,
      behavior: 'fallback_tool',
      priority: 2,
    },
    {
      trigger: 'rate_limit',
      enabled: true,
      behavior: 'cached_response',
      cachedResponseMaxAge: 3600,
      priority: 3,
    },
    {
      trigger: 'permission_denied',
      enabled: true,
      behavior: 'graceful_error',
      priority: 4,
      errorMessage: '您没有执行该操作的权限',
    },
    {
      trigger: 'validation_failed',
      enabled: true,
      behavior: 'user_input',
      priority: 5,
      userPrompt: '输入参数验证失败，请提供正确的输入',
    },
    {
      trigger: 'runtime_error',
      enabled: true,
      behavior: 'graceful_error',
      priority: 6,
      errorMessage: '执行过程中发生错误',
    },
  ]
}

export interface ToolDowngradePolicyProps {
  config: ToolDowngradePolicyConfig
  onSave?: (config: ToolDowngradePolicyConfig) => void
  onReset?: () => void
  readOnly?: boolean
}

export function ToolDowngradePolicy({
  config,
  onSave,
  onReset,
  readOnly = false,
}: ToolDowngradePolicyProps): React.ReactNode {
  const [localConfig, setLocalConfig] = useState<ToolDowngradePolicyConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const updateConfig = useCallback((updates: Partial<ToolDowngradePolicyConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates, updatedAt: Date.now() }))
    setHasChanges(true)
  }, [])

  const updateDowngradeConfig = useCallback((index: number, updates: Partial<DowngradeConfig>) => {
    setLocalConfig(prev => {
      const newConfigs = [...prev.downgradeConfigs]
      newConfigs[index] = { ...newConfigs[index], ...updates }
      return { ...prev, downgradeConfigs: newConfigs, updatedAt: Date.now() }
    })
    setHasChanges(true)
  }, [])

  const toggleCardExpanded = useCallback((trigger: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(trigger)) {
        newSet.delete(trigger)
      } else {
        newSet.add(trigger)
      }
      return newSet
    })
  }, [])

  const handleSave = useCallback(() => {
    onSave?.(localConfig)
    setHasChanges(false)
  }, [localConfig, onSave])

  const handleReset = useCallback(() => {
    setLocalConfig({
      ...config,
      downgradeConfigs: createDefaultDowngradeConfigs(),
      updatedAt: Date.now(),
    })
    setHasChanges(true)
    onReset?.()
  }, [config, onReset])

  const getBehaviorIcon = (behavior: DowngradeBehavior): React.ReactNode => {
    return BEHAVIOR_CONFIG[behavior]?.icon || <Settings className="h-3 w-3" />
  }

  return (
    <div className="space-y-4">
      {/* 全局设置 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" style={{ color: BRAND_COLOR }} />
              <div>
                <CardTitle className="text-base">降级策略: {localConfig.toolName}</CardTitle>
                <CardDescription className="text-sm">
                  配置工具不可用时的降级行为
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Info className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      当工具执行失败或不可用时，系统将按照配置的降级策略进行处理
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 启用开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">启用降级策略</Label>
              <Badge variant={localConfig.globalEnabled ? 'default' : 'secondary'} className="text-xs">
                {localConfig.globalEnabled ? '已启用' : '已禁用'}
              </Badge>
            </div>
            <Switch
              checked={localConfig.globalEnabled}
              onCheckedChange={(checked) => updateConfig({ globalEnabled: checked })}
              disabled={readOnly}
            />
          </div>

          {/* 默认降级行为 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">默认降级行为</Label>
              <Select
                value={localConfig.defaultBehavior}
                onValueChange={(v) => updateConfig({ defaultBehavior: v as DowngradeBehavior })}
                disabled={readOnly || !localConfig.globalEnabled}
              >
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BEHAVIOR_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        {v.icon}
                        <span>{v.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 通知选项 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={localConfig.notifyUser}
                onCheckedChange={(checked) => updateConfig({ notifyUser: checked })}
                disabled={readOnly || !localConfig.globalEnabled}
              />
              <Label className="text-xs">通知用户</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={localConfig.logDowngrade}
                onCheckedChange={(checked) => updateConfig({ logDowngrade: checked })}
                disabled={readOnly || !localConfig.globalEnabled}
              />
              <Label className="text-xs">记录日志</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 降级配置列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">触发条件配置</h3>
          <Badge variant="outline" className="text-xs">
            {localConfig.downgradeConfigs.filter(c => c.enabled).length} / {localConfig.downgradeConfigs.length} 已启用
          </Badge>
        </div>

        {localConfig.downgradeConfigs
          .sort((a, b) => a.priority - b.priority)
          .map((dgConfig) => {
            const tc = TRIGGER_CONFIG[dgConfig.trigger]
            const bc = BEHAVIOR_CONFIG[dgConfig.behavior]
            const isExpanded = expandedCards.has(dgConfig.trigger)
            const originalIndex = localConfig.downgradeConfigs.findIndex(c => c.trigger === dgConfig.trigger)

            return (
              <Card key={dgConfig.trigger} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpanded(dgConfig.trigger)}>
                  <CardHeader className="pb-3 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={dgConfig.enabled}
                          onCheckedChange={(checked) => updateDowngradeConfig(originalIndex, { enabled: checked })}
                          disabled={readOnly || !localConfig.globalEnabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <CardTitle className={cn('text-sm', tc.color)}>{tc.label}</CardTitle>
                          <CardDescription className="text-xs">{tc.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          {getBehaviorIcon(dgConfig.behavior)}
                          {bc.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          优先级 {dgConfig.priority}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-3 pt-0">
                      {/* 降级行为选择 */}
                      <div>
                        <Label className="text-xs">降级行为</Label>
                        <Select
                          value={dgConfig.behavior}
                          onValueChange={(v) => updateDowngradeConfig(originalIndex, { behavior: v as DowngradeBehavior })}
                          disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                        >
                          <SelectTrigger className="h-8 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BEHAVIOR_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                <div className="flex items-center gap-2">
                                  {v.icon}
                                  <span>{v.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 根据行为类型显示不同配置 */}
                      {dgConfig.behavior === 'fallback_tool' && (
                        <div>
                          <Label className="text-xs">备选工具 ID</Label>
                          <Input
                            placeholder="输入备选工具的标识符"
                            value={dgConfig.fallbackToolId || ''}
                            onChange={(e) => updateDowngradeConfig(originalIndex, { fallbackToolId: e.target.value })}
                            disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                            className="h-8 mt-1"
                          />
                        </div>
                      )}

                      {dgConfig.behavior === 'cached_response' && (
                        <div>
                          <Label className="text-xs">缓存最大有效期（秒）</Label>
                          <Input
                            type="number"
                            min={60}
                            max={86400}
                            value={dgConfig.cachedResponseMaxAge || 3600}
                            onChange={(e) => updateDowngradeConfig(originalIndex, { cachedResponseMaxAge: parseInt(e.target.value) || 3600 })}
                            disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                            className="h-8 mt-1"
                          />
                        </div>
                      )}

                      {dgConfig.behavior === 'default_value' && (
                        <div>
                          <Label className="text-xs">默认值</Label>
                          <Textarea
                            placeholder="输入默认返回值"
                            value={dgConfig.defaultValue || ''}
                            onChange={(e) => updateDowngradeConfig(originalIndex, { defaultValue: e.target.value })}
                            disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                            className="mt-1 min-h-[60px]"
                          />
                        </div>
                      )}

                      {dgConfig.behavior === 'user_input' && (
                        <div>
                          <Label className="text-xs">用户提示</Label>
                          <Textarea
                            placeholder="输入给用户的提示信息"
                            value={dgConfig.userPrompt || ''}
                            onChange={(e) => updateDowngradeConfig(originalIndex, { userPrompt: e.target.value })}
                            disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                            className="mt-1 min-h-[60px]"
                          />
                        </div>
                      )}

                      {dgConfig.behavior === 'graceful_error' && (
                        <div>
                          <Label className="text-xs">错误消息</Label>
                          <Textarea
                            placeholder="输入自定义错误消息"
                            value={dgConfig.errorMessage || ''}
                            onChange={(e) => updateDowngradeConfig(originalIndex, { errorMessage: e.target.value })}
                            disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                            className="mt-1 min-h-[60px]"
                          />
                        </div>
                      )}

                      {/* 优先级配置 */}
                      <div>
                        <Label className="text-xs">优先级（数字越小越优先）</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={dgConfig.priority}
                          onChange={(e) => updateDowngradeConfig(originalIndex, { priority: parseInt(e.target.value) || 1 })}
                          disabled={readOnly || !localConfig.globalEnabled || !dgConfig.enabled}
                          className="h-8 mt-1 w-24"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
      </div>

      {/* 操作按钮 */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            重置默认
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-1"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            <Save className="h-4 w-4" />
            保存配置
          </Button>
        </div>
      )}
    </div>
  )
}

// 创建默认降级策略配置
export function createDefaultToolDowngradePolicy(
  toolId: string,
  toolName: string
): ToolDowngradePolicyConfig {
  return {
    id: `downgrade-${toolId}`,
    name: `${toolName} 降级策略`,
    toolId,
    toolName,
    globalEnabled: true,
    defaultBehavior: 'graceful_error',
    downgradeConfigs: createDefaultDowngradeConfigs(),
    notifyUser: true,
    logDowngrade: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
