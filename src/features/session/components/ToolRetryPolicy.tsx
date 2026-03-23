/**
 * ToolRetryPolicy - 工具调用重试策略配置组件
 * Story 5.7 - 工具调用重试策略配置
 */
import { useState, useCallback, useMemo } from 'react'
import {
  RefreshCw,
  Settings,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

const BRAND_COLOR = '#1E3A5F'

export type RetryableErrorType =
  | 'network_error' | 'timeout_error' | 'rate_limit_error' | 'service_unavailable'
  | 'internal_error' | 'validation_error' | 'permission_error' | 'unknown_error'

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential' | 'jittered'

const ERROR_TYPE_CONFIG: Record<RetryableErrorType, { label: string; description: string; color: string }> = {
  network_error: { label: '网络错误', description: '网络连接问题', color: 'text-orange-500' },
  timeout_error: { label: '超时错误', description: '请求超时', color: 'text-yellow-500' },
  rate_limit_error: { label: '速率限制', description: '请求频率超限', color: 'text-purple-500' },
  service_unavailable: { label: '服务不可用', description: '服务暂时不可用', color: 'text-red-500' },
  internal_error: { label: '内部错误', description: '服务器内部错误', color: 'text-red-500' },
  validation_error: { label: '验证错误', description: '参数验证失败', color: 'text-blue-500' },
  permission_error: { label: '权限错误', description: '权限不足', color: 'text-gray-500' },
  unknown_error: { label: '未知错误', description: '其他错误', color: 'text-gray-500' },
}

const BACKOFF_CONFIG: Record<BackoffStrategy, { label: string; description: string }> = {
  fixed: { label: '固定间隔', description: '每次重试使用固定等待时间' },
  linear: { label: '线性递增', description: '每次增加固定时间' },
  exponential: { label: '指数递增', description: '每次等待时间翻倍' },
  jittered: { label: '带抖动指数', description: '指数递增+随机抖动' },
}

export interface ErrorRetryConfig {
  errorType: RetryableErrorType
  enabled: boolean
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffStrategy: BackoffStrategy
  backoffMultiplier: number
}

export interface RetryPolicyConfig {
  id: string
  name: string
  description?: string
  globalEnabled: boolean
  defaultMaxRetries: number
  defaultInitialDelay: number
  defaultMaxDelay: number
  defaultBackoffStrategy: BackoffStrategy
  defaultBackoffMultiplier: number
  errorConfigs: ErrorRetryConfig[]
  createdAt: number
  updatedAt: number
}

export interface ToolRetryPolicyProps {
  config: RetryPolicyConfig
  onSave?: (config: RetryPolicyConfig) => void
  onReset?: () => void
  readOnly?: boolean
}

function ErrorConfigCard({ config, onChange, readOnly }: {
  config: ErrorRetryConfig
  onChange?: (config: ErrorRetryConfig) => void
  readOnly?: boolean
}): React.ReactNode {
  const [expanded, setExpanded] = useState(false)
  const ec = ERROR_TYPE_CONFIG[config.errorType]

  return (
    <Card className="overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-3 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => onChange?.({ ...config, enabled: checked })}
                disabled={readOnly}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <CardTitle className={cn('text-sm', ec.color)}>{ec.label}</CardTitle>
                <CardDescription className="text-xs">{ec.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{config.maxRetries} 次重试</Badge>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">最大重试次数</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={config.maxRetries}
                  onChange={(e) => onChange?.({ ...config, maxRetries: parseInt(e.target.value) || 0 })}
                  disabled={readOnly || !config.enabled}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">初始延迟 (ms)</Label>
                <Input
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={config.initialDelay}
                  onChange={(e) => onChange?.({ ...config, initialDelay: parseInt(e.target.value) || 100 })}
                  disabled={readOnly || !config.enabled}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">最大延迟 (ms)</Label>
                <Input
                  type="number"
                  min={1000}
                  max={300000}
                  step={1000}
                  value={config.maxDelay}
                  onChange={(e) => onChange?.({ ...config, maxDelay: parseInt(e.target.value) || 1000 })}
                  disabled={readOnly || !config.enabled}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">退避倍数</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={config.backoffMultiplier}
                  onChange={(e) => onChange?.({ ...config, backoffMultiplier: parseFloat(e.target.value) || 1 })}
                  disabled={readOnly || !config.enabled}
                  className="h-8 mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">退避策略</Label>
              <Select
                value={config.backoffStrategy}
                onValueChange={(v) => onChange?.({ ...config, backoffStrategy: v as BackoffStrategy })}
                disabled={readOnly || !config.enabled}
              >
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BACKOFF_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function ToolRetryPolicy({ config: initialConfig, onSave, onReset, readOnly = false }: ToolRetryPolicyProps): React.ReactNode {
  const [config, setConfig] = useState(initialConfig)
  const [hasChanges, setHasChanges] = useState(false)

  const updateConfig = useCallback((updates: Partial<RetryPolicyConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates, updatedAt: Date.now() }))
    setHasChanges(true)
  }, [])

  const updateErrorConfig = useCallback((index: number, errorConfig: ErrorRetryConfig) => {
    setConfig((prev) => {
      const newConfigs = [...prev.errorConfigs]
      newConfigs[index] = errorConfig
      return { ...prev, errorConfigs: newConfigs, updatedAt: Date.now() }
    })
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(() => {
    onSave?.(config)
    setHasChanges(false)
  }, [config, onSave])

  const handleReset = useCallback(() => {
    setConfig(initialConfig)
    setHasChanges(false)
    onReset?.()
  }, [initialConfig, onReset])

  const stats = useMemo(() => ({
    enabled: config.errorConfigs.filter((c) => c.enabled).length,
    total: config.errorConfigs.length,
  }), [config.errorConfigs])

  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ borderLeftWidth: '3px', borderLeftColor: BRAND_COLOR }}>
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <span className="font-medium text-slate-700">重试策略配置</span>
          <Badge variant="secondary" className="text-xs">{stats.enabled}/{stats.total} 启用</Badge>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-600">未保存</Badge>}
          {onReset && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges || readOnly}>
              <RotateCcw className="h-4 w-4 mr-1" />重置
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || readOnly} style={{ backgroundColor: BRAND_COLOR }}>
              <Save className="h-4 w-4 mr-1" />保存
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 全局设置 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" style={{ color: BRAND_COLOR }} />全局设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="global-enabled">启用重试</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-slate-400" /></TooltipTrigger>
                    <TooltipContent><div className="text-xs">全局启用或禁用重试功能</div></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch id="global-enabled" checked={config.globalEnabled} onCheckedChange={(checked) => updateConfig({ globalEnabled: checked })} disabled={readOnly} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">默认最大重试次数</Label>
                <Input type="number" min={0} max={10} value={config.defaultMaxRetries} onChange={(e) => updateConfig({ defaultMaxRetries: parseInt(e.target.value) || 0 })} disabled={readOnly} className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">默认初始延迟 (ms)</Label>
                <Input type="number" min={100} max={10000} step={100} value={config.defaultInitialDelay} onChange={(e) => updateConfig({ defaultInitialDelay: parseInt(e.target.value) || 100 })} disabled={readOnly} className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">默认最大延迟 (ms)</Label>
                <Input type="number" min={1000} max={300000} step={1000} value={config.defaultMaxDelay} onChange={(e) => updateConfig({ defaultMaxDelay: parseInt(e.target.value) || 1000 })} disabled={readOnly} className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">默认退避倍数</Label>
                <Input type="number" min={1} max={5} step={0.1} value={config.defaultBackoffMultiplier} onChange={(e) => updateConfig({ defaultBackoffMultiplier: parseFloat(e.target.value) || 1 })} disabled={readOnly} className="h-8 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">默认退避策略</Label>
              <Select value={config.defaultBackoffStrategy} onValueChange={(v) => updateConfig({ defaultBackoffStrategy: v as BackoffStrategy })} disabled={readOnly}>
                <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BACKOFF_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 错误类型配置 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" style={{ color: BRAND_COLOR }} />错误类型配置
            </CardTitle>
            <CardDescription>为不同错误类型配置独立重试策略</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config.errorConfigs.map((ec, i) => (
                <ErrorConfigCard key={ec.errorType} config={ec} onChange={(updated) => updateErrorConfig(i, updated)} readOnly={readOnly} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 说明 */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Info className="h-4 w-4" /><span className="text-sm font-medium">重试策略说明</span>
          </div>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>固定间隔: 每次重试使用相同的等待时间</li>
            <li>线性递增: 等待时间 = 初始延迟 + (重试次数 × 退避倍数 × 初始延迟)</li>
            <li>指数递增: 等待时间 = 初始延迟 × (退避倍数 ^ 重试次数)</li>
            <li>带抖动指数: 在指数递增基础上添加随机抖动</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ToolRetryPolicy