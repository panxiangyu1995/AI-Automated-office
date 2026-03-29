/**
 * YoloModeConfig.tsx
 * Story 21.25 - 路由模式与YOLO Mode
 *
 * 功能：
 * - 路由模式选择器 (Manual/Auto/Yolo/Hybrid)
 * - YOLO模式激活与TTL配置
 * - YOLO模式状态显示
 * - 安全警告与二次确认
 */

import { useState, useEffect } from 'react'
import {
  Zap,
  Clock,
  Shield,
  AlertTriangle,
  Check,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

/** 路由模式类型 */
export type RoutingMode = 'manual' | 'auto' | 'hybrid' | 'yolo'

/** YOLO TTL类型 */
export type YoloTtlType = 'once' | 'one_hour' | 'today' | 'custom'

/** YOLO TTL配置 */
export interface YoloTtlConfig {
  type: YoloTtlType
  customSeconds?: number
}

/** 路由模式配置 */
export interface RoutingModeConfig {
  mode: RoutingMode
  yoloEnabled: boolean
  yoloTtl?: YoloTtlConfig
  yoloActivatedAt?: number
  remainingTtlSeconds?: number
  tenantYoloDisabled?: boolean // 管理员禁用了YOLO模式
}

/** YOLO模式状态 */
export interface YoloModeStatus {
  isActive: boolean
  activatedAt?: number
  ttl?: YoloTtlConfig
  remainingTtlSeconds?: number
}

// ============================================================================
// 常量定义

const ROUTING_MODE_INFO = {
  manual: {
    label: '手动模式',
    description: '所有操作都需要用户手动确认，适合高安全场景',
    icon: Shield,
    color: 'text-red-500',
  },
  auto: {
    label: '自动模式',
    description: '仅高风险操作需要确认，其他自动执行',
    icon: Check,
    color: 'text-green-500',
  },
  hybrid: {
    label: '混合模式',
    description: '根据操作风险级别动态决定是否需要确认',
    icon: Info,
    color: 'text-blue-500',
  },
  yolo: {
    label: 'YOLO模式',
    description: '所有操作自动执行无确认，存在误操作风险',
    icon: Zap,
    color: 'text-amber-500',
  },
} as const

const YOLO_TTL_OPTIONS = [
  { value: 'once', label: '单次', description: '执行一个任务后自动关闭' },
  { value: 'one_hour', label: '1小时', description: '1小时后自动关闭' },
  { value: 'today', label: '本日', description: '今天结束前有效' },
  { value: 'custom', label: '自定义', description: '自定义时长（秒）' },
] as const

// ============================================================================
// YOLO确认对话框组件

interface YoloConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (ttl: YoloTtlConfig) => void
  targetOperation?: string
}

export function YoloConfirmDialog({
  open,
  onClose,
  onConfirm,
  targetOperation = '批量删除文档',
}: YoloConfirmDialogProps) {
  const [selectedTtl, setSelectedTtl] = useState<YoloTtlType>('once')
  const [customSeconds, setCustomSeconds] = useState<string>('3600')
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!confirmed) return
    const ttl: YoloTtlConfig = {
      type: selectedTtl,
      customSeconds: selectedTtl === 'custom' ? parseInt(customSeconds, 10) : undefined,
    }
    onConfirm(ttl)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            YOLO模式激活确认
          </DialogTitle>
          <DialogDescription>
            YOLO模式将跳过所有操作确认，存在误操作风险
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 目标操作 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-sm text-amber-800">
              <strong>即将执行:</strong> {targetOperation}
            </div>
          </div>

          {/* 安全警告 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">安全警告</p>
                <ul className="mt-1 text-xs list-disc list-inside space-y-0.5">
                  <li>所有操作将直接执行，不会弹出确认框</li>
                  <li>误操作可能导致数据丢失或系统变更</li>
                  <li>建议操作完成后立即关闭YOLO模式</li>
                </ul>
              </div>
            </div>
          </div>

          {/* TTL选择 */}
          <div className="space-y-2">
            <Label>有效期选择</Label>
            <RadioGroup value={selectedTtl} onValueChange={(v) => setSelectedTtl(v as YoloTtlType)}>
              {YOLO_TTL_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`ttl-${option.value}`} />
                  <Label htmlFor={`ttl-${option.value}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {option.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedTtl === 'custom' && (
              <div className="pl-6 mt-2">
                <Input
                  type="number"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  placeholder="输入秒数"
                  className="w-32"
                  min={1}
                />
                <span className="text-xs text-muted-foreground ml-2">
                  {parseInt(customSeconds, 10) > 0
                    ? `= ${Math.floor(parseInt(customSeconds, 10) / 60)} 分钟`
                    : '请输入有效秒数'}
                </span>
              </div>
            )}
          </div>

          {/* 二次确认 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="yolo-confirm-check"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            <Label htmlFor="yolo-confirm-check" className="text-sm cursor-pointer">
              我已充分了解风险，确认激活YOLO模式
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!confirmed}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Zap className="h-4 w-4 mr-1" />
            确认激活
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// 路由模式选择器组件

interface RoutingModeSelectorProps {
  value: RoutingMode
  onChange: (mode: RoutingMode) => void
  disabled?: boolean
  className?: string
}

export function RoutingModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: RoutingModeSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>路由模式</Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as RoutingMode)} className="grid grid-cols-2 gap-2">
        {(Object.keys(ROUTING_MODE_INFO) as RoutingMode[]).map((mode) => {
          const info = ROUTING_MODE_INFO[mode]
          const Icon = info.icon
          return (
            <div
              key={mode}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                value === mode
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value={mode} id={`mode-${mode}`} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={`mode-${mode}`} className="flex items-center gap-2 cursor-pointer">
                  <Icon className={cn('h-4 w-4', info.color)} />
                  <span className="font-medium">{info.label}</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
              </div>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

// ============================================================================
// YOLO状态指示器组件

interface YoloStatusIndicatorProps {
  status: YoloModeStatus
  className?: string
}

export function YoloStatusIndicator({ status, className }: YoloStatusIndicatorProps) {
  if (!status.isActive) {
    return (
      <Badge variant="outline" className={cn('gap-1', className)}>
        <Shield className="h-3 w-3" />
        安全模式
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn('gap-1 bg-amber-50 border-amber-200 text-amber-700', className)}>
      <Zap className="h-3 w-3" />
      YOLO模式
      {status.remainingTtlSeconds !== undefined && status.remainingTtlSeconds > 0 && (
        <span className="ml-1">
          ({Math.floor(status.remainingTtlSeconds / 60)}:{String(status.remainingTtlSeconds % 60).padStart(2, '0')})
        </span>
      )}
    </Badge>
  )
}

// ============================================================================
// 主配置组件

interface YoloModeConfigProps {
  className?: string
  initialConfig?: Partial<RoutingModeConfig>
  onConfigChange?: (config: RoutingModeConfig) => void
}

export function YoloModeConfig({
  className,
  initialConfig,
  onConfigChange,
}: YoloModeConfigProps) {
  const [config, setConfig] = useState<RoutingModeConfig>({
    mode: 'auto',
    yoloEnabled: false,
    ...initialConfig,
  })
  const [showYoloDialog, setShowYoloDialog] = useState(false)
  const [yoloStatus, setYoloStatus] = useState<YoloModeStatus>({
    isActive: false,
  })

  const handleModeChange = (mode: RoutingMode) => {
    if (mode === 'yolo') {
      // YOLO模式需要确认
      setShowYoloDialog(true)
      return
    }

    setConfig((prev) => {
      const newConfig = { ...prev, mode }
      onConfigChange?.(newConfig)
      return newConfig
    })
  }

  const handleYoloConfirm = (ttl: YoloTtlConfig) => {
    const now = Date.now()
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        mode: 'yolo' as RoutingMode,
        yoloEnabled: true,
        yoloTtl: ttl,
        yoloActivatedAt: now,
      }
      onConfigChange?.(newConfig)
      return newConfig
    })
    setYoloStatus({
      isActive: true,
      activatedAt: now,
      ttl,
      remainingTtlSeconds: calculateRemainingTtl(ttl, now),
    })
  }

  const handleYoloDeactivate = () => {
    setConfig((prev) => {
      const newConfig: RoutingModeConfig = {
        ...prev,
        mode: 'auto' as RoutingMode,
        yoloEnabled: false,
      }
      onConfigChange?.(newConfig)
      return newConfig
    })
    setYoloStatus({ isActive: false })
    setShowYoloDialog(false)
  }

  // 更新剩余TTL
  useEffect(() => {
    if (!yoloStatus.isActive || !yoloStatus.activatedAt || !yoloStatus.ttl) return

    const interval = setInterval(() => {
      setYoloStatus((prev) => ({
        ...prev,
        remainingTtlSeconds: calculateRemainingTtl(prev.ttl!, prev.activatedAt!),
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [yoloStatus.isActive, yoloStatus.activatedAt, yoloStatus.ttl])

  return (
    <>
      <Card className={cn('', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">路由模式与YOLO配置</CardTitle>
            </div>
            <YoloStatusIndicator status={yoloStatus} />
          </div>
          <CardDescription>
            控制工具执行的审批策略和YOLO模式安全设置
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 路由模式选择 */}
          <RoutingModeSelector
            value={config.mode}
            onChange={handleModeChange}
            disabled={config.tenantYoloDisabled}
          />

          <Separator />

          {/* YOLO模式额外配置 */}
          {config.mode === 'yolo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">YOLO模式已激活</p>
                    {yoloStatus.remainingTtlSeconds !== undefined && yoloStatus.remainingTtlSeconds > 0 && (
                      <p className="text-xs text-amber-600">
                        剩余时间: {Math.floor(yoloStatus.remainingTtlSeconds / 60)}:
                        {String(yoloStatus.remainingTtlSeconds % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleYoloDeactivate}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  立即关闭
                </Button>
              </div>
            </div>
          )}

          {/* 管理员禁用提示 */}
          {config.tenantYoloDisabled && (
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                企业安全策略已禁用YOLO模式，如需启用请联系管理员。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* YOLO确认对话框 */}
      <YoloConfirmDialog
        open={showYoloDialog}
        onClose={() => setShowYoloDialog(false)}
        onConfirm={handleYoloConfirm}
      />
    </>
  )
}

// ============================================================================
// 工具函数

function calculateRemainingTtl(ttl: YoloTtlConfig, activatedAt: number): number | undefined {
  const now = Date.now()
  const elapsed = Math.floor((now - activatedAt) / 1000)

  switch (ttl.type) {
    case 'once':
      // Once是按任务次数，不是按时间
      return undefined
    case 'one_hour':
      return Math.max(0, 3600 - elapsed)
    case 'today': {
      // 今天结束前有效
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      const remaining = Math.floor((endOfDay.getTime() - now) / 1000)
      return Math.max(0, remaining)
    }
    case 'custom':
      return ttl.customSeconds ? Math.max(0, ttl.customSeconds - elapsed) : undefined
    default:
      return undefined
  }
}

export default YoloModeConfig
