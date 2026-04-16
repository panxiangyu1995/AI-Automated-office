/**
 * SensitiveOperationConfirmation - 敏感操作确认机制组件
 * Story 5.9 - 敏感操作确认机制
 */
import { useState, useCallback } from 'react'
import {
  AlertTriangle,
  Shield,
  Check,
  X,
  Edit,
  Clock,
  User,
  Info,
  FileText,
  Database,
  Settings,
  Trash2,
  Send,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const BRAND_COLOR = 'var(--ao-button.background)'

// 风险级别
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// 操作类型
export type SensitiveOperationType =
  | 'file_delete'        // 文件删除
  | 'data_modify'        // 数据修改
  | 'system_config'      // 系统配置
  | 'permission_change'  // 权限变更
  | 'external_send'      // 外部发送
  | 'credential_access'  // 凭证访问
  | 'bulk_operation'     // 批量操作
  | 'irreversible'       // 不可逆操作

// 确认结果
export type ConfirmationResult = 'approved' | 'modified' | 'cancelled' | 'timeout'

// 敏感操作定义
export interface SensitiveOperation {
  id: string
  type: SensitiveOperationType
  name: string
  description: string
  riskLevel: RiskLevel
  toolId: string
  toolName: string
  params: Record<string, unknown>
  timestamp: number
  requester: {
    id: string
    name: string
    role: string
  }
  auditContext?: {
    sessionId?: string
    conversationId?: string
    parentOperationId?: string
  }
}

// 风险详情
export interface RiskDetail {
  level: RiskLevel
  score: number           // 0-100
  factors: string[]       // 风险因素
  impacts: string[]       // 潜在影响
  mitigations: string[]   // 缓解措施
}

// 确认配置
export interface ConfirmationConfig {
  operation: SensitiveOperation
  riskDetail: RiskDetail
  timeoutSeconds: number
  requireReason: boolean
  allowedModifications: string[]
}

// 风险级别配置
const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  low: {
    label: '低风险',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: <Info className="h-4 w-4" />,
  },
  medium: {
    label: '中等风险',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  high: {
    label: '高风险',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  critical: {
    label: '极高风险',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: <Shield className="h-4 w-4" />,
  },
}

// 操作类型配置
const OPERATION_TYPE_CONFIG: Record<SensitiveOperationType, { label: string; icon: React.ReactNode }> = {
  file_delete: {
    label: '文件删除',
    icon: <Trash2 className="h-4 w-4" />,
  },
  data_modify: {
    label: '数据修改',
    icon: <Database className="h-4 w-4" />,
  },
  system_config: {
    label: '系统配置',
    icon: <Settings className="h-4 w-4" />,
  },
  permission_change: {
    label: '权限变更',
    icon: <Key className="h-4 w-4" />,
  },
  external_send: {
    label: '外部发送',
    icon: <Send className="h-4 w-4" />,
  },
  credential_access: {
    label: '凭证访问',
    icon: <Key className="h-4 w-4" />,
  },
  bulk_operation: {
    label: '批量操作',
    icon: <FileText className="h-4 w-4" />,
  },
  irreversible: {
    label: '不可逆操作',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
}

export interface SensitiveOperationConfirmationProps {
  config: ConfirmationConfig
  onApprove?: (operation: SensitiveOperation, reason?: string) => void
  onModify?: (operation: SensitiveOperation, modifications: Record<string, unknown>, reason?: string) => void
  onCancel?: (operation: SensitiveOperation, reason?: string) => void
  onTimeout?: (operation: SensitiveOperation) => void
}

export function SensitiveOperationConfirmation({
  config,
  onApprove,
  onModify,
  onCancel,
  onTimeout,
}: SensitiveOperationConfirmationProps): React.ReactNode {
  const [state, setState] = useState<'pending' | 'approving' | 'modifying' | 'cancelled' | 'timeout'>('pending')
  const [reason, setReason] = useState('')
  const [modifications, setModifications] = useState<Record<string, unknown>>({})
  const [showModifyDialog, setShowModifyDialog] = useState(false)
  const [remainingTime, setRemainingTime] = useState(config.timeoutSeconds)

  const { operation, riskDetail } = config
  const riskConfig = RISK_CONFIG[riskDetail.level]
  const opTypeConfig = OPERATION_TYPE_CONFIG[operation.type]

  // 倒计时逻辑
  useState(() => {
    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (state === 'pending') {
      setState('timeout')
      onTimeout?.(operation)
    }
  })

  const handleApprove = useCallback(() => {
    setState('approving')
    onApprove?.(operation, reason)
  }, [operation, reason, onApprove])

  const handleModify = useCallback(() => {
    setShowModifyDialog(true)
  }, [])

  const handleModifySubmit = useCallback(() => {
    setState('modifying')
    setShowModifyDialog(false)
    onModify?.(operation, modifications, reason)
  }, [operation, modifications, reason, onModify])

  const handleCancel = useCallback(() => {
    setState('cancelled')
    onCancel?.(operation, reason)
  }, [operation, reason, onCancel])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getParamDisplay = (params: Record<string, unknown>): React.ReactNode => {
    return (
      <div className="space-y-1 text-sm">
        {Object.entries(params).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="text-muted-foreground">{key}:</span>
            <span className="font-mono text-xs bg-muted px-1 rounded">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (state === 'timeout') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-red-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">确认已超时</span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            该操作因未在规定时间内确认而自动取消
          </p>
        </CardContent>
      </Card>
    )
  }

  if (state === 'cancelled') {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-gray-600">
            <X className="h-5 w-5" />
            <span className="font-medium">操作已取消</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn('border-2', riskConfig.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', riskConfig.bgColor)}>
                {riskConfig.icon}
              </div>
              <div>
                <CardTitle className={cn('text-lg flex items-center gap-2', riskConfig.color)}>
                  {opTypeConfig.icon}
                  {operation.name}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {operation.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', riskConfig.color)}>
                {riskConfig.label}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className={cn(remainingTime < 30 && 'text-red-500 font-bold')}>
                  {formatTime(remainingTime)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 操作信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <User className="h-3 w-3" />
                <span>操作发起者</span>
              </div>
              <div className="font-medium">{operation.requester.name}</div>
              <div className="text-xs text-muted-foreground">{operation.requester.role}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Info className="h-3 w-3" />
                <span>工具</span>
              </div>
              <div className="font-medium">{operation.toolName}</div>
            </div>
          </div>

          {/* 参数详情 */}
          <div>
            <Label className="text-xs text-muted-foreground">操作参数</Label>
            <div className="mt-1 p-2 bg-white/50 rounded border text-sm">
              {getParamDisplay(operation.params)}
            </div>
          </div>

          {/* 风险详情 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">风险评分</Label>
              <Badge variant="outline" className="text-xs">
                {riskDetail.score}/100
              </Badge>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  riskDetail.score < 30 ? 'bg-green-500' :
                  riskDetail.score < 60 ? 'bg-yellow-500' :
                  riskDetail.score < 80 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${riskDetail.score}%` }}
              />
            </div>

            {/* 风险因素 */}
            {riskDetail.factors.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">风险因素</Label>
                <ul className="mt-1 space-y-1">
                  {riskDetail.factors.map((factor, i) => (
                    <li key={i} className="text-sm flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-1 text-orange-500 shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 潜在影响 */}
            {riskDetail.impacts.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">潜在影响</Label>
                <ul className="mt-1 space-y-1">
                  {riskDetail.impacts.map((impact, i) => (
                    <li key={i} className="text-sm flex items-start gap-1">
                      <Info className="h-3 w-3 mt-1 text-blue-500 shrink-0" />
                      {impact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 缓解措施 */}
            {riskDetail.mitigations.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">缓解措施</Label>
                <ul className="mt-1 space-y-1">
                  {riskDetail.mitigations.map((mitigation, i) => (
                    <li key={i} className="text-sm flex items-start gap-1">
                      <Check className="h-3 w-3 mt-1 text-green-500 shrink-0" />
                      {mitigation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 确认原因 */}
          {config.requireReason && (
            <div>
              <Label className="text-xs">确认原因（必填）</Label>
              <Textarea
                placeholder="请说明确认该操作的原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 min-h-[60px]"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2 pt-2 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  取消
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">取消该操作</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {config.allowedModifications.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleModify}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    修改
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">修改操作参数后确认</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={config.requireReason && !reason.trim()}
                  className="flex items-center gap-1"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  <Check className="h-4 w-4" />
                  确认执行
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">确认执行该敏感操作</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* 修改对话框 */}
      <AlertDialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              修改操作参数
            </AlertDialogTitle>
            <AlertDialogDescription>
              请修改以下参数后确认执行
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {config.allowedModifications.map((key) => (
              <div key={key}>
                <Label className="text-sm">{key}</Label>
                <Input
                  value={String(modifications[key] ?? operation.params[key] ?? '')}
                  onChange={(e) => setModifications(prev => ({ ...prev, [key]: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ))}
            <div>
              <Label className="text-sm">修改原因</Label>
              <Textarea
                placeholder="请说明修改原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleModifySubmit}>
              确认修改并执行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// 创建示例敏感操作
export function createExampleSensitiveOperation(): SensitiveOperation {
  return {
    id: 'op-example-1',
    type: 'file_delete',
    name: '删除重要文件',
    description: '将删除 /data/important/config.json 文件',
    riskLevel: 'high',
    toolId: 'file_delete',
    toolName: '文件删除工具',
    params: {
      path: '/data/important/config.json',
      recursive: false,
    },
    timestamp: Date.now(),
    requester: {
      id: 'user-1',
      name: '张三',
      role: '管理员',
    },
  }
}

// 创建示例风险详情
export function createExampleRiskDetail(): RiskDetail {
  return {
    level: 'high',
    score: 75,
    factors: [
      '操作将删除系统配置文件',
      '该文件包含关键业务配置',
      '文件删除后可能影响系统稳定性',
    ],
    impacts: [
      '相关服务可能无法启动',
      '需要从备份恢复配置',
      '可能影响其他依赖该配置的功能',
    ],
    mitigations: [
      '建议先创建文件备份',
      '确认有可用的恢复方案',
      '在非业务高峰期执行',
    ],
  }
}
