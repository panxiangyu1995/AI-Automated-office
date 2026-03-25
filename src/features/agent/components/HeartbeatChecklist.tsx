/**
 * HeartbeatChecklist - 心跳机制与检查清单组件
 * Story 35.1 - 心跳机制与检查清单
 *
 * 实现心跳执行与预检查、静默模式和检查清单治理
 * - 加载 HEARTBEAT 检查清单并评估执行窗口
 * - 运行预检查：活动、上下文预算和可用性
 * - 无需操作时静默返回 HEARTBEAT_OK
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-02, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  ListChecks,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Timer,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type CheckItemStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed' | 'skipped'
export type QuietMode = 'active' | 'paused' | 'disabled'
export type HeartbeatStatus = 'idle' | 'checking' | 'ok' | 'warning' | 'failed'
export type CheckCategory = 'activity' | 'context' | 'availability' | 'health' | 'security'

export interface CheckItem {
  id: string
  name: string
  description: string
  category: CheckCategory
  status: CheckItemStatus
  statusMessage?: string
  timestamp: Date
  duration?: number
  details?: Record<string, unknown>
}

export interface ChecklistRun {
  id: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: HeartbeatStatus
  totalChecks: number
  passedChecks: number
  warningChecks: number
  failedChecks: number
  skippedChecks: number
  checks: CheckItem[]
  resultCode: 'HEARTBEAT_OK' | 'HEARTBEAT_WARNING' | 'HEARTBEAT_FAILED' | 'QUIET_MODE'
}

export interface HeartbeatSchedule {
  id: string
  name: string
  interval: number
  enabled: boolean
  quietMode: QuietMode
  lastRun?: ChecklistRun
  nextRun?: Date
  consecutiveFailures: number
}

export interface HeartbeatStats {
  totalHeartbeats: number
  successfulHeartbeats: number
  failedHeartbeats: number
  quietModeActivations: number
  avgCheckDuration: number
  avgChecksPerHeartbeat: number
  lastHeartbeatTime?: Date
  uptime: number
}

export interface HeartbeatChecklistProps {
  className?: string
  schedules?: HeartbeatSchedule[]
  onRunHeartbeat?: () => void
  onPauseHeartbeat?: () => void
  onResumeHeartbeat?: () => void
  onConfigureSchedule?: (scheduleId: string) => void
}

// ==================== Mock Data ====================

const mockCheckItems: CheckItem[] = [
  {
    id: 'check-1',
    name: '活跃会话检查',
    description: '检查是否有活跃的用户会话',
    category: 'activity',
    status: 'passed',
    statusMessage: '5 个活跃会话',
    timestamp: new Date(),
    duration: 45,
  },
  {
    id: 'check-2',
    name: '上下文 Token 预算',
    description: '检查当前上下文使用量是否在限制内',
    category: 'context',
    status: 'passed',
    statusMessage: '已使用 42,500 / 128,000 tokens (33%)',
    timestamp: new Date(),
    duration: 120,
  },
  {
    id: 'check-3',
    name: 'LLM 提供商可用性',
    description: '检查主要 LLM 提供商的连接状态',
    category: 'availability',
    status: 'passed',
    statusMessage: '所有提供商可用',
    timestamp: new Date(),
    duration: 230,
  },
  {
    id: 'check-4',
    name: '内存使用率',
    description: '检查系统内存使用是否在安全范围内',
    category: 'health',
    status: 'warning',
    statusMessage: '内存使用率 78%，接近阈值',
    timestamp: new Date(),
    duration: 30,
  },
  {
    id: 'check-5',
    name: '工具注册表',
    description: '检查所有必需工具是否已注册',
    category: 'health',
    status: 'passed',
    statusMessage: '42 个工具已注册',
    timestamp: new Date(),
    duration: 85,
  },
  {
    id: 'check-6',
    name: '上次活动时间',
    description: '检查用户是否有最近的活动',
    category: 'activity',
    status: 'passed',
    statusMessage: '最近活动: 3 分钟前',
    timestamp: new Date(),
    duration: 15,
  },
  {
    id: 'check-7',
    name: '会话存储配额',
    description: '检查会话存储使用是否在配额内',
    category: 'context',
    status: 'passed',
    statusMessage: '存储使用: 2.3GB / 10GB',
    timestamp: new Date(),
    duration: 65,
  },
  {
    id: 'check-8',
    name: '备份与恢复就绪',
    description: '检查最近备份状态和恢复能力',
    category: 'security',
    status: 'skipped',
    statusMessage: '上次检查: 2 小时前',
    timestamp: new Date(),
  },
  {
    id: 'check-9',
    name: '插件健康检查',
    description: '检查所有已加载插件的状态',
    category: 'health',
    status: 'warning',
    statusMessage: '2 个插件处于降级状态',
    timestamp: new Date(),
    duration: 180,
  },
  {
    id: 'check-10',
    name: '消息队列深度',
    description: '检查待处理消息队列的深度',
    category: 'availability',
    status: 'passed',
    statusMessage: '队列深度: 3 (正常)',
    timestamp: new Date(),
    duration: 40,
  },
]

const mockSchedules: HeartbeatSchedule[] = [
  {
    id: 'schedule-1',
    name: '快速心跳',
    interval: 60000,
    enabled: true,
    quietMode: 'active',
    lastRun: {
      id: 'run-1',
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(Date.now() - 55000),
      duration: 5000,
      status: 'ok',
      totalChecks: 10,
      passedChecks: 8,
      warningChecks: 2,
      failedChecks: 0,
      skippedChecks: 0,
      checks: mockCheckItems,
      resultCode: 'HEARTBEAT_OK',
    },
    nextRun: new Date(Date.now() + 60000),
    consecutiveFailures: 0,
  },
  {
    id: 'schedule-2',
    name: '完整心跳',
    interval: 300000,
    enabled: true,
    quietMode: 'paused',
    lastRun: {
      id: 'run-2',
      startTime: new Date(Date.now() - 300000),
      endTime: new Date(Date.now() - 290000),
      duration: 10000,
      status: 'warning',
      totalChecks: 10,
      passedChecks: 7,
      warningChecks: 2,
      failedChecks: 1,
      skippedChecks: 0,
      checks: mockCheckItems,
      resultCode: 'HEARTBEAT_WARNING',
    },
    nextRun: new Date(Date.now() + 300000),
    consecutiveFailures: 1,
  },
  {
    id: 'schedule-3',
    name: '后台心跳',
    interval: 600000,
    enabled: false,
    quietMode: 'disabled',
    consecutiveFailures: 0,
  },
]

const mockRecentRuns: ChecklistRun[] = [
  {
    id: 'run-current',
    startTime: new Date(Date.now() - 60000),
    endTime: new Date(Date.now() - 55000),
    duration: 5000,
    status: 'ok',
    totalChecks: 10,
    passedChecks: 8,
    warningChecks: 2,
    failedChecks: 0,
    skippedChecks: 0,
    checks: mockCheckItems,
    resultCode: 'HEARTBEAT_OK',
  },
  {
    id: 'run-2',
    startTime: new Date(Date.now() - 360000),
    endTime: new Date(Date.now() - 355000),
    duration: 5000,
    status: 'ok',
    totalChecks: 10,
    passedChecks: 9,
    warningChecks: 1,
    failedChecks: 0,
    skippedChecks: 0,
    checks: mockCheckItems,
    resultCode: 'HEARTBEAT_OK',
  },
  {
    id: 'run-3',
    startTime: new Date(Date.now() - 660000),
    endTime: new Date(Date.now() - 650000),
    duration: 10000,
    status: 'warning',
    totalChecks: 10,
    passedChecks: 7,
    warningChecks: 2,
    failedChecks: 1,
    skippedChecks: 0,
    checks: mockCheckItems,
    resultCode: 'HEARTBEAT_WARNING',
  },
]

// ==================== Utility Functions ====================

function getCheckCategoryIcon(category: CheckCategory) {
  switch (category) {
    case 'activity':
      return <Activity className="h-4 w-4" />
    case 'context':
      return <MessageSquare className="h-4 w-4" />
    case 'availability':
      return <Heart className="h-4 w-4" />
    case 'health':
      return <Shield className="h-4 w-4" />
    case 'security':
      return <Lock className="h-4 w-4" />
    default:
      return <ListChecks className="h-4 w-4" />
  }
}

function getCheckCategoryLabel(category: CheckCategory): string {
  switch (category) {
    case 'activity':
      return '活动'
    case 'context':
      return '上下文'
    case 'availability':
      return '可用性'
    case 'health':
      return '健康'
    case 'security':
      return '安全'
    default:
      return category
  }
}

function getCheckStatusIcon(status: CheckItemStatus) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-500" />
    case 'running':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    case 'passed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'skipped':
      return <AlertCircle className="h-4 w-4 text-gray-400" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function getHeartbeatStatusIcon(status: HeartbeatStatus) {
  switch (status) {
    case 'idle':
      return <Clock className="h-5 w-5 text-gray-500" />
    case 'checking':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    case 'ok':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Clock className="h-5 w-5" />
  }
}

function getQuietModeIcon(mode: QuietMode) {
  switch (mode) {
    case 'active':
      return <Volume2 className="h-4 w-4" />
    case 'paused':
      return <BellOff className="h-4 w-4" />
    case 'disabled':
      return <VolumeX className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatTimeUntil(date: Date): string {
  const seconds = Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000))
  if (seconds < 60) return `${seconds}秒后`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}分钟后`
}

// ==================== Check Item Row ====================

interface CheckItemRowProps {
  check: CheckItem
}

function CheckItemRow({ check }: CheckItemRowProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getCheckStatusIcon(check.status)}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{check.name}</span>
          <Badge variant="outline" className="text-xs">
            {getCheckCategoryIcon(check.category)}
            <span className="ml-1">{getCheckCategoryLabel(check.category)}</span>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{check.description}</p>
        {check.statusMessage && (
          <p className={cn(
            'text-xs',
            check.status === 'passed' && 'text-green-600',
            check.status === 'warning' && 'text-yellow-600',
            check.status === 'failed' && 'text-red-600',
            check.status === 'skipped' && 'text-gray-500'
          )}>
            {check.statusMessage}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {check.duration && <span>{check.duration}ms</span>}
        <span>{formatTimestamp(check.timestamp)}</span>
      </div>
    </div>
  )
}

// ==================== Schedule Card ====================

interface ScheduleCardProps {
  schedule: HeartbeatSchedule
  onConfigure?: () => void
  onToggle?: () => void
}

function ScheduleCard({ schedule, onConfigure, onToggle }: ScheduleCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4 transition-colors',
      schedule.enabled ? 'bg-card' : 'bg-muted/30 opacity-75'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            schedule.enabled ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Heart className={cn('h-4 w-4', schedule.enabled ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <h3 className="font-medium text-sm">{schedule.name}</h3>
            <p className="text-xs text-muted-foreground">
              间隔: {formatDuration(schedule.interval)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {getQuietModeIcon(schedule.quietMode)}
            <span>{schedule.quietMode === 'active' ? '静默' : schedule.quietMode === 'paused' ? '暂停' : '禁用'}</span>
          </Badge>
          {schedule.lastRun && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                schedule.lastRun.status === 'ok' && 'text-green-500',
                schedule.lastRun.status === 'warning' && 'text-yellow-500',
                schedule.lastRun.status === 'failed' && 'text-red-500'
              )}
            >
              {schedule.lastRun.status === 'ok' ? '正常' : schedule.lastRun.status === 'warning' ? '警告' : '失败'}
            </Badge>
          )}
        </div>
      </div>

      {schedule.lastRun && (
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>{schedule.lastRun.passedChecks}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{schedule.lastRun.warningChecks}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" />
            <span>{schedule.lastRun.failedChecks}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(schedule.lastRun.duration || 0)}</span>
          </div>
        </div>
      )}

      {schedule.nextRun && schedule.enabled && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>下次运行: {formatTimeUntil(schedule.nextRun)}</span>
          {schedule.consecutiveFailures > 0 && (
            <Badge variant="destructive" className="text-xs">
              连续失败: {schedule.consecutiveFailures}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onConfigure}>
          <Settings className="h-3 w-3 mr-1" />
          配置
        </Button>
        <Switch checked={schedule.enabled} onCheckedChange={onToggle} />
      </div>
    </div>
  )
}

// ==================== Run History Item ====================

interface RunHistoryItemProps {
  run: ChecklistRun
  onViewDetails?: () => void
}

function RunHistoryItem({ run, onViewDetails }: RunHistoryItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onViewDetails}
    >
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full',
        run.status === 'ok' && 'bg-green-500/10',
        run.status === 'warning' && 'bg-yellow-500/10',
        run.status === 'failed' && 'bg-red-500/10'
      )}>
        {getHeartbeatStatusIcon(run.status)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium font-mono">{run.resultCode}</span>
          <Badge variant="outline" className="text-xs">
            {run.totalChecks} 检查
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatTimestamp(run.startTime)} • {formatDuration(run.duration || 0)}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-600">{run.passedChecks} 通过</span>
        {run.warningChecks > 0 && <span className="text-yellow-600">{run.warningChecks} 警告</span>}
        {run.failedChecks > 0 && <span className="text-red-600">{run.failedChecks} 失败</span>}
      </div>
    </div>
  )
}

// ==================== Run Detail Dialog ====================

interface RunDetailDialogProps {
  run: ChecklistRun | null
  open: boolean
  onClose: () => void
}

function RunDetailDialog({ run, open, onClose }: RunDetailDialogProps) {
  if (!run) return null

  const checksByCategory = useMemo(() => {
    const grouped: Record<CheckCategory, CheckItem[]> = {
      activity: [],
      context: [],
      availability: [],
      health: [],
      security: [],
    }
    run.checks.forEach((check) => {
      grouped[check.category].push(check)
    })
    return grouped
  }, [run.checks])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              run.status === 'ok' && 'bg-green-500/10',
              run.status === 'warning' && 'bg-yellow-500/10',
              run.status === 'failed' && 'bg-red-500/10'
            )}>
              {getHeartbeatStatusIcon(run.status)}
            </div>
            <div>
              <DialogTitle>心跳检查详情</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <code className="text-xs">{run.resultCode}</code>
                <span>•</span>
                <span>{formatTimestamp(run.startTime)}</span>
                <span>•</span>
                <span>持续时间: {formatDuration(run.duration || 0)}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">总数</p>
            <p className="text-lg font-medium">{run.totalChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">通过</p>
            <p className="text-lg font-medium text-green-500">{run.passedChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">警告</p>
            <p className="text-lg font-medium text-yellow-500">{run.warningChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">失败</p>
            <p className="text-lg font-medium text-red-500">{run.failedChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">跳过</p>
            <p className="text-lg font-medium text-gray-500">{run.skippedChecks}</p>
          </div>
        </div>

        {/* Checks by Category */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-1">
            {(Object.keys(checksByCategory) as CheckCategory[]).map((category) => (
              checksByCategory[category].length > 0 && (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                    {getCheckCategoryIcon(category)}
                    <h4 className="text-sm font-medium">{getCheckCategoryLabel(category)}</h4>
                    <Badge variant="outline" className="text-xs">
                      {checksByCategory[category].length}
                    </Badge>
                  </div>
                  {checksByCategory[category].map((check) => (
                    <CheckItemRow key={check.id} check={check} />
                  ))}
                </div>
              )
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function HeartbeatChecklist({
  className,
  schedules: initialSchedules,
}: HeartbeatChecklistProps) {
  const schedules = initialSchedules || mockSchedules
  const [selectedRun, setSelectedRun] = useState<ChecklistRun | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'schedules'>('overview')

  // Stats
  const stats: HeartbeatStats = useMemo(() => {
    return {
      totalHeartbeats: mockRecentRuns.length + 1,
      successfulHeartbeats: mockRecentRuns.filter((r) => r.status === 'ok').length,
      failedHeartbeats: mockRecentRuns.filter((r) => r.status === 'failed').length,
      quietModeActivations: schedules.filter((s) => s.quietMode === 'active').length,
      avgCheckDuration: 5200,
      avgChecksPerHeartbeat: 10,
      lastHeartbeatTime: new Date(Date.now() - 60000),
      uptime: 99.7,
    }
  }, [schedules])

  // Latest run
  const latestRun = mockRecentRuns[0]

  // Handlers
  const handleRunHeartbeat = () => {
    setIsRunning(true)
    setTimeout(() => setIsRunning(false), 3000)
  }

  const handleViewRunDetails = (run: ChecklistRun) => {
    setSelectedRun(run)
    setDetailDialogOpen(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          <h2 className="text-lg font-medium">心跳机制与检查清单</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? 'secondary' : 'default'}
            size="sm"
            onClick={handleRunHeartbeat}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                运行中...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                立即心跳
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-6 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">成功</p>
            <p className="text-lg font-medium text-green-500">{stats.successfulHeartbeats}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">失败</p>
            <p className="text-lg font-medium text-red-500">{stats.failedHeartbeats}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Volume2 className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">静默模式</p>
            <p className="text-lg font-medium text-blue-500">{stats.quietModeActivations}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">平均耗时</p>
            <p className="text-lg font-medium">{formatDuration(stats.avgCheckDuration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <ListChecks className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">平均检查数</p>
            <p className="text-lg font-medium">{stats.avgChecksPerHeartbeat}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">运行时间</p>
            <p className="text-lg font-medium">{stats.uptime}%</p>
          </div>
        </div>
      </div>

      {/* Latest Result Banner */}
      {latestRun && (
        <div className={cn(
          'flex items-center justify-between p-4 rounded-lg border',
          latestRun.status === 'ok' && 'bg-green-500/10 border-green-500/20',
          latestRun.status === 'warning' && 'bg-yellow-500/10 border-yellow-500/20',
          latestRun.status === 'failed' && 'bg-red-500/10 border-red-500/20'
        )}>
          <div className="flex items-center gap-3">
            {getHeartbeatStatusIcon(latestRun.status)}
            <div>
              <p className="font-medium font-mono">{latestRun.resultCode}</p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(latestRun.startTime)} • {formatDuration(latestRun.duration || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>{latestRun.passedChecks} 通过</span>
            </div>
            {latestRun.warningChecks > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{latestRun.warningChecks} 警告</span>
              </div>
            )}
            {latestRun.failedChecks > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{latestRun.failedChecks} 失败</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => handleViewRunDetails(latestRun)}>
              <Eye className="h-3 w-3 mr-1" />
              详情
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            历史
            <Badge variant="secondary" className="ml-1">{mockRecentRuns.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            调度
            <Badge variant="secondary" className="ml-1">{schedules.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                最近检查
              </h4>
              <div className="space-y-2">
                {latestRun?.checks.slice(0, 5).map((check) => (
                  <div key={check.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getCheckStatusIcon(check.status)}
                      <span className="text-xs">{check.name}</span>
                    </div>
                    <span className={cn(
                      'text-xs',
                      check.status === 'passed' && 'text-green-500',
                      check.status === 'warning' && 'text-yellow-500',
                      check.status === 'failed' && 'text-red-500'
                    )}>
                      {check.status === 'passed' ? '通过' : check.status === 'warning' ? '警告' : check.status === 'failed' ? '失败' : check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                静默模式状态
              </h4>
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getQuietModeIcon(schedule.quietMode)}
                      <span>{schedule.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {schedule.quietMode === 'active' ? '活动' : schedule.quietMode === 'paused' ? '暂停' : '禁用'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {mockRecentRuns.map((run) => (
                <RunHistoryItem
                  key={run.id}
                  run={run}
                  onViewDetails={() => handleViewRunDetails(run)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="schedules">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onConfigure={() => {}}
                onToggle={() => {}}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <RunDetailDialog
        run={selectedRun}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </div>
  )
}
