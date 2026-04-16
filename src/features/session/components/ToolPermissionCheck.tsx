/**
 * ToolPermissionCheck - 工具调用权限检查组件
 * Story 5.11 - 工具调用权限检查
 */
import { useState, useCallback } from 'react'
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Info,
  Key,
  Lock,
  Unlock,
  Clock,
  History,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const BRAND_COLOR = 'var(--ao-button.background)'

// 权限状态
export type PermissionStatus = 'granted' | 'denied' | 'partial' | 'unknown'

// 权限类型
export type PermissionType =
  | 'execute'      // 执行权限
  | 'read'         // 读取权限
  | 'write'        // 写入权限
  | 'delete'       // 删除权限
  | 'admin'        // 管理权限
  | 'sensitive'    // 敏感操作权限

// 权限要求
export interface PermissionRequirement {
  type: PermissionType
  resource?: string
  description: string
  required: boolean
}

// 权限检查结果
export interface PermissionCheckResult {
  id: string
  toolId: string
  toolName: string
  timestamp: number
  overallStatus: PermissionStatus
  requirements: PermissionCheckItem[]
  missingPermissions: PermissionRequirement[]
  grantedBy?: {
    type: 'role' | 'explicit' | 'inherit'
    source: string
  }
  expiresAt?: number
  auditId: string
}

// 权限检查项
export interface PermissionCheckItem {
  requirement: PermissionRequirement
  status: PermissionStatus
  reason?: string
  grantedBy?: string
}

// 权限历史记录
export interface PermissionHistoryRecord {
  id: string
  toolId: string
  toolName: string
  timestamp: number
  status: PermissionStatus
  actor: string
  duration: number
  details: string
}

// 权限状态配置
const STATUS_CONFIG: Record<PermissionStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  granted: {
    label: '已授权',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: <Check className="h-4 w-4" />,
  },
  denied: {
    label: '已拒绝',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: <X className="h-4 w-4" />,
  },
  partial: {
    label: '部分授权',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  unknown: {
    label: '未知',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Info className="h-4 w-4" />,
  },
}

// 权限类型配置
const PERMISSION_TYPE_CONFIG: Record<PermissionType, { label: string; icon: React.ReactNode }> = {
  execute: { label: '执行', icon: <Key className="h-3 w-3" /> },
  read: { label: '读取', icon: <Lock className="h-3 w-3" /> },
  write: { label: '写入', icon: <Unlock className="h-3 w-3" /> },
  delete: { label: '删除', icon: <X className="h-3 w-3" /> },
  admin: { label: '管理', icon: <Shield className="h-3 w-3" /> },
  sensitive: { label: '敏感操作', icon: <AlertTriangle className="h-3 w-3" /> },
}

export interface ToolPermissionCheckProps {
  result: PermissionCheckResult
  history?: PermissionHistoryRecord[]
  onRequestPermission?: (missingPermissions: PermissionRequirement[]) => void
  onRefresh?: () => void
  showHistory?: boolean
  readOnly?: boolean
}

export function ToolPermissionCheck({
  result,
  history = [],
  onRequestPermission,
  onRefresh,
  showHistory = true,
  readOnly = false,
}: ToolPermissionCheckProps): React.ReactNode {
  const [expandedDetails, setExpandedDetails] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState(false)

  const statusConfig = STATUS_CONFIG[result.overallStatus]

  const handleRequestPermission = useCallback(() => {
    if (result.missingPermissions.length > 0) {
      onRequestPermission?.(result.missingPermissions)
    }
  }, [result.missingPermissions, onRequestPermission])

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-4">
      {/* 权限检查结果卡片 */}
      <Card className={cn('border-2', statusConfig.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', statusConfig.bgColor)}>
                {statusConfig.icon}
              </div>
              <div>
                <CardTitle className={cn('text-lg flex items-center gap-2', statusConfig.color)}>
                  <Shield className="h-5 w-5" />
                  权限检查结果
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {result.toolName} - {statusConfig.label}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {result.overallStatus === 'granted' && (
                <Badge className="bg-green-500 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  可以执行
                </Badge>
              )}
              {result.overallStatus === 'denied' && (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  无法执行
                </Badge>
              )}
              {result.overallStatus === 'partial' && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  需要补充权限
                </Badge>
              )}
              {onRefresh && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onRefresh}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">重新检查权限</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">工具 ID</div>
              <div className="font-mono text-xs mt-1">{result.toolId}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">检查时间</div>
              <div className="mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(result.timestamp)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">审计 ID</div>
              <div className="font-mono text-xs mt-1">{result.auditId.slice(0, 8)}...</div>
            </div>
          </div>

          {/* 权限详情 */}
          <Collapsible open={expandedDetails} onOpenChange={setExpandedDetails}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium cursor-pointer">
              <span>权限检查详情 ({result.requirements.length} 项)</span>
              <span className="text-xs text-muted-foreground">
                {expandedDetails ? '收起' : '展开'}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {result.requirements.map((item, index) => {
                const typeConfig = PERMISSION_TYPE_CONFIG[item.requirement.type]
                const itemStatus = STATUS_CONFIG[item.status]

                return (
                  <div
                    key={index}
                    className={cn('flex items-center justify-between p-2 rounded border', itemStatus.bgColor)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={itemStatus.color}>{itemStatus.icon}</div>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          {typeConfig.icon}
                          <span>{typeConfig.label}</span>
                          {item.requirement.resource && (
                            <span className="text-xs text-muted-foreground">
                              : {item.requirement.resource}
                            </span>
                          )}
                          {item.requirement.required && (
                            <Badge variant="outline" className="text-xs h-4">
                              必需
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.requirement.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn('text-xs', itemStatus.color)}>
                        {itemStatus.label}
                      </Badge>
                      {item.reason && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* 缺失权限 */}
          {result.missingPermissions.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                缺失权限 ({result.missingPermissions.length} 项)
              </div>
              <ul className="space-y-1 text-sm">
                {result.missingPermissions.map((perm, index) => {
                  const typeConfig = PERMISSION_TYPE_CONFIG[perm.type]
                  return (
                    <li key={index} className="flex items-start gap-2">
                      {typeConfig.icon}
                      <div>
                        <span>{typeConfig.label}</span>
                        {perm.resource && <span className="text-muted-foreground">: {perm.resource}</span>}
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {!readOnly && (
                <Button
                  size="sm"
                  onClick={handleRequestPermission}
                  className="mt-3"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  申请权限
                </Button>
              )}
            </div>
          )}

          {/* 授权来源 */}
          {result.grantedBy && result.overallStatus === 'granted' && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span>
                  授权来源: {result.grantedBy.type === 'role' ? '角色继承' :
                           result.grantedBy.type === 'explicit' ? '显式授权' : '继承'}
                  {result.grantedBy.source && ` - ${result.grantedBy.source}`}
                </span>
              </div>
              {result.expiresAt && (
                <div className="text-xs text-green-600 mt-1">
                  有效期至: {formatDate(result.expiresAt)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 权限历史记录 */}
      {showHistory && history.length > 0 && (
        <Card>
          <Collapsible open={expandedHistory} onOpenChange={setExpandedHistory}>
            <CardHeader className="pb-3 cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  权限检查历史
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {history.length} 条记录
                </Badge>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {history.slice(0, 5).map((record) => {
                    const recordStatus = STATUS_CONFIG[record.status]
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-2 rounded border text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={recordStatus.color}>
                            {recordStatus.icon}
                          </div>
                          <div>
                            <div className="font-medium">{record.toolName}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(record.timestamp)} · {record.actor}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={cn('text-xs', recordStatus.color)}>
                            {recordStatus.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            耗时 {formatDuration(record.duration)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  )
}

// 创建示例权限检查结果
export function createExamplePermissionCheckResult(): PermissionCheckResult {
  return {
    id: 'check-1',
    toolId: 'file-manager',
    toolName: '文件管理器',
    timestamp: Date.now(),
    overallStatus: 'partial',
    requirements: [
      {
        requirement: { type: 'execute', description: '执行文件管理操作', required: true },
        status: 'granted',
        grantedBy: '管理员角色',
      },
      {
        requirement: { type: 'read', description: '读取文件内容', required: true },
        status: 'granted',
        grantedBy: '管理员角色',
      },
      {
        requirement: { type: 'write', description: '修改文件内容', required: true },
        status: 'denied',
        reason: '需要写入权限',
      },
      {
        requirement: { type: 'delete', resource: '/data/important', description: '删除重要文件', required: false },
        status: 'denied',
        reason: '受保护目录',
      },
    ],
    missingPermissions: [
      { type: 'write', description: '修改文件内容', required: true },
    ],
    grantedBy: { type: 'role', source: '管理员' },
    auditId: 'audit-123456',
  }
}

// 创建示例历史记录
export function createExamplePermissionHistory(): PermissionHistoryRecord[] {
  return [
    {
      id: 'hist-1',
      toolId: 'file-manager',
      toolName: '文件管理器',
      timestamp: Date.now() - 3600000,
      status: 'granted',
      actor: '张三',
      duration: 45,
      details: '所有权限检查通过',
    },
    {
      id: 'hist-2',
      toolId: 'database-tool',
      toolName: '数据库工具',
      timestamp: Date.now() - 7200000,
      status: 'denied',
      actor: '张三',
      duration: 23,
      details: '缺少数据库访问权限',
    },
  ]
}
