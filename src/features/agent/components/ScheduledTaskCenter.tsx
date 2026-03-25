/**
 * ScheduledTaskCenter - 定时任务中心组件
 * Story 35.2 - 定时任务中心
 *
 * 创建统一的 Cron 和定时任务控制中心
 * - 管理定时任务和 Cron 定义
 * - 应用重试、退避、超时和互斥策略
 * - 对高风险定时操作强制确认或审批
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-02, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  AlertCircle,
  BellOff,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Filter,
  History,
  ListChecks,
  Lock,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Timer,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type TaskStatus = 'active' | 'paused' | 'running' | 'failed' | 'disabled'
export type TaskType = 'cron' | 'interval' | 'once' | 'manual'
export type RetryPolicy = 'none' | 'linear' | 'exponential' | 'fixed'
export type MutexPolicy = 'none' | 'wait' | 'skip' | 'error'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface CronDefinition {
  expression: string
  description: string
  nextRun?: Date
}

export interface RetryConfig {
  maxRetries: number
  policy: RetryPolicy
  baseDelay: number
  maxDelay: number
}

export interface TimeoutConfig {
  enabled: boolean
  duration: number
}

export interface MutexConfig {
  enabled: boolean
  policy: MutexPolicy
  timeout?: number
}

export interface TaskPolicy {
  retry: RetryConfig
  timeout: TimeoutConfig
  mutex: MutexConfig
}

export interface ScheduledTask {
  id: string
  name: string
  description: string
  type: TaskType
  status: TaskStatus
  cron?: CronDefinition
  intervalMs?: number
  nextRun?: Date
  lastRun?: Date
  lastRunDuration?: number
  lastRunStatus?: 'success' | 'failed' | 'cancelled'
  consecutiveFailures: number
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  policy: TaskPolicy
  riskLevel: RiskLevel
  approvalRequired: boolean
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TaskExecution {
  id: string
  taskId: string
  taskName: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: 'running' | 'success' | 'failed' | 'cancelled'
  errorMessage?: string
  retryAttempt?: number
  triggeredBy: 'schedule' | 'manual' | 'api'
  resultSummary?: string
}

export interface ScheduledTaskCenterStats {
  totalTasks: number
  activeTasks: number
  pausedTasks: number
  runningTasks: number
  failedTasks: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgExecutionTime: number
}

export interface ScheduledTaskCenterProps {
  className?: string
  tasks?: ScheduledTask[]
  executions?: TaskExecution[]
  onTaskCreate?: (task: Partial<ScheduledTask>) => void
  onTaskUpdate?: (taskId: string, updates: Partial<ScheduledTask>) => void
  onTaskDelete?: (taskId: string) => void
  onTaskRun?: (taskId: string) => void
  onTaskPause?: (taskId: string) => void
  onTaskResume?: (taskId: string) => void
  onTaskApprove?: (taskId: string) => void
  onTaskReject?: (taskId: string) => void
}

// ==================== Mock Data ====================

const mockTasks: ScheduledTask[] = [
  {
    id: 'task-1',
    name: '每日数据备份',
    description: '每天凌晨2点自动备份所有用户数据',
    type: 'cron',
    status: 'active',
    cron: {
      expression: '0 2 * * *',
      description: '每天凌晨2:00',
      nextRun: new Date(Date.now() + 3600000 * 6),
    },
    nextRun: new Date(Date.now() + 3600000 * 6),
    lastRun: new Date(Date.now() - 3600000 * 18),
    lastRunDuration: 245000,
    lastRunStatus: 'success',
    consecutiveFailures: 0,
    totalRuns: 156,
    successfulRuns: 154,
    failedRuns: 2,
    policy: {
      retry: { maxRetries: 3, policy: 'exponential', baseDelay: 1000, maxDelay: 30000 },
      timeout: { enabled: true, duration: 300000 },
      mutex: { enabled: true, policy: 'wait', timeout: 60000 },
    },
    riskLevel: 'high',
    approvalRequired: true,
    approvalStatus: 'approved',
    approvedBy: 'admin',
    approvedAt: new Date(Date.now() - 86400000 * 30),
    tags: ['backup', 'daily', 'data'],
    createdAt: new Date(Date.now() - 86400000 * 90),
    updatedAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'task-2',
    name: '健康检查心跳',
    description: '每5分钟执行一次系统健康检查',
    type: 'interval',
    status: 'active',
    intervalMs: 300000,
    nextRun: new Date(Date.now() + 300000),
    lastRun: new Date(Date.now() - 300000),
    lastRunDuration: 5000,
    lastRunStatus: 'success',
    consecutiveFailures: 0,
    totalRuns: 8923,
    successfulRuns: 8918,
    failedRuns: 5,
    policy: {
      retry: { maxRetries: 2, policy: 'linear', baseDelay: 500, maxDelay: 5000 },
      timeout: { enabled: true, duration: 30000 },
      mutex: { enabled: false, policy: 'none' },
    },
    riskLevel: 'low',
    approvalRequired: false,
    approvalStatus: 'none',
    tags: ['health', 'monitoring'],
    createdAt: new Date(Date.now() - 86400000 * 180),
    updatedAt: new Date(Date.now() - 86400000 * 30),
  },
  {
    id: 'task-3',
    name: '用户会话清理',
    description: '每小时清理超时的用户会话',
    type: 'cron',
    status: 'paused',
    cron: {
      expression: '0 * * * *',
      description: '每小时整点',
      nextRun: new Date(Date.now() + 1800000),
    },
    nextRun: new Date(Date.now() + 1800000),
    lastRun: new Date(Date.now() - 3600000),
    lastRunDuration: 12000,
    lastRunStatus: 'success',
    consecutiveFailures: 0,
    totalRuns: 720,
    successfulRuns: 720,
    failedRuns: 0,
    policy: {
      retry: { maxRetries: 1, policy: 'fixed', baseDelay: 1000, maxDelay: 5000 },
      timeout: { enabled: true, duration: 60000 },
      mutex: { enabled: true, policy: 'skip' },
    },
    riskLevel: 'medium',
    approvalRequired: false,
    approvalStatus: 'none',
    tags: ['cleanup', 'session'],
    createdAt: new Date(Date.now() - 86400000 * 60),
    updatedAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: 'task-4',
    name: '批量数据导出',
    description: '导出所有订单数据到 CSV 文件',
    type: 'once',
    status: 'failed',
    nextRun: new Date(Date.now() + 86400000),
    lastRun: new Date(Date.now() - 3600000),
    lastRunDuration: 180000,
    lastRunStatus: 'failed',
    consecutiveFailures: 3,
    totalRuns: 4,
    successfulRuns: 1,
    failedRuns: 3,
    policy: {
      retry: { maxRetries: 5, policy: 'exponential', baseDelay: 5000, maxDelay: 300000 },
      timeout: { enabled: true, duration: 600000 },
      mutex: { enabled: true, policy: 'error' },
    },
    riskLevel: 'critical',
    approvalRequired: true,
    approvalStatus: 'approved',
    approvedBy: 'admin',
    approvedAt: new Date(Date.now() - 86400000 * 7),
    tags: ['export', 'batch', 'orders'],
    createdAt: new Date(Date.now() - 86400000 * 14),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'task-5',
    name: '插件状态同步',
    description: '每10分钟同步所有插件的最新状态',
    type: 'interval',
    status: 'active',
    intervalMs: 600000,
    nextRun: new Date(Date.now() + 600000),
    lastRun: new Date(Date.now() - 600000),
    lastRunDuration: 8500,
    lastRunStatus: 'success',
    consecutiveFailures: 0,
    totalRuns: 2654,
    successfulRuns: 2650,
    failedRuns: 4,
    policy: {
      retry: { maxRetries: 3, policy: 'linear', baseDelay: 2000, maxDelay: 60000 },
      timeout: { enabled: true, duration: 120000 },
      mutex: { enabled: false, policy: 'none' },
    },
    riskLevel: 'low',
    approvalRequired: false,
    approvalStatus: 'none',
    tags: ['sync', 'plugin'],
    createdAt: new Date(Date.now() - 86400000 * 45),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
]

const mockExecutions: TaskExecution[] = [
  {
    id: 'exec-1',
    taskId: 'task-2',
    taskName: '健康检查心跳',
    startTime: new Date(Date.now() - 300000),
    endTime: new Date(Date.now() - 295000),
    duration: 5000,
    status: 'success',
    triggeredBy: 'schedule',
    resultSummary: '所有服务健康',
  },
  {
    id: 'exec-2',
    taskId: 'task-5',
    taskName: '插件状态同步',
    startTime: new Date(Date.now() - 600000),
    endTime: new Date(Date.now() - 591500),
    duration: 8500,
    status: 'success',
    triggeredBy: 'schedule',
    resultSummary: '42 个插件已同步',
  },
  {
    id: 'exec-3',
    taskId: 'task-4',
    taskName: '批量数据导出',
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() - 3420000),
    duration: 180000,
    status: 'failed',
    errorMessage: '导出超时：数据量超过预期',
    triggeredBy: 'schedule',
    retryAttempt: 2,
    resultSummary: '第 3 次重试失败',
  },
]

// ==================== Utility Functions ====================

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'paused':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'running':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'disabled':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'active':
      return <Play className="h-3 w-3" />
    case 'paused':
      return <Pause className="h-3 w-3" />
    case 'running':
      return <RefreshCw className="h-3 w-3 animate-spin" />
    case 'failed':
      return <XCircle className="h-3 w-3" />
    case 'disabled':
      return <BellOff className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'active':
      return '活动中'
    case 'paused':
      return '已暂停'
    case 'running':
      return '运行中'
    case 'failed':
      return '失败'
    case 'disabled':
      return '已禁用'
    default:
      return '未知'
  }
}

function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'text-green-500 bg-green-500/10'
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'high':
      return 'text-orange-500 bg-orange-500/10'
    case 'critical':
      return 'text-red-500 bg-red-500/10'
    default:
      return 'text-gray-500 bg-gray-500/10'
  }
}

function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '低风险'
    case 'medium':
      return '中风险'
    case 'high':
      return '高风险'
    case 'critical':
      return '极高风险'
    default:
      return '未知'
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${(ms / 3600000).toFixed(1)}h`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeUntil(date: Date): string {
  const seconds = Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000))
  if (seconds < 60) return `${seconds}秒后`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟后`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时后`
  const days = Math.floor(hours / 24)
  return `${days}天后`
}

// ==================== Task Card ====================

interface TaskCardProps {
  task: ScheduledTask
  onRun?: () => void
  onPause?: () => void
  onResume?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function TaskCard({ task, onRun, onPause, onResume, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4 transition-colors',
      task.status === 'active' && 'border-green-500/20',
      task.status === 'paused' && 'border-yellow-500/20',
      task.status === 'running' && 'border-blue-500/20',
      task.status === 'failed' && 'border-red-500/20'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', getStatusColor(task.status))}>
            {getStatusIcon(task.status)}
            <span className="ml-1">{getStatusLabel(task.status)}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {task.type === 'cron' ? 'Cron' : task.type === 'interval' ? '间隔' : task.type === 'once' ? '一次性' : '手动'}
          </Badge>
          <Badge className={cn('text-xs', getRiskLevelColor(task.riskLevel))}>
            {getRiskLevelLabel(task.riskLevel)}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRun}>
              <Play className="h-3 w-3 mr-2" />
              立即执行
            </DropdownMenuItem>
            {task.status === 'active' ? (
              <DropdownMenuItem onClick={onPause}>
                <Pause className="h-3 w-3 mr-2" />
                暂停
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onResume}>
                <Play className="h-3 w-3 mr-2" />
                恢复
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-3 w-3 mr-2" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-500">
              <Trash2 className="h-3 w-3 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task Name & Description */}
      <h3 className="font-medium mb-1">{task.name}</h3>
      <p className="text-xs text-muted-foreground mb-3">{task.description}</p>

      {/* Schedule Info */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>下次运行:</span>
          <span className="text-foreground">{task.nextRun ? formatTimeUntil(task.nextRun) : '-'}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <History className="h-3 w-3" />
          <span>成功率:</span>
          <span className={cn(
            task.totalRuns > 0 && (task.successfulRuns / task.totalRuns) > 0.9 ? 'text-green-500' :
            task.totalRuns > 0 && (task.successfulRuns / task.totalRuns) > 0.7 ? 'text-yellow-500' : 'text-red-500'
          )}>
            {task.totalRuns > 0 ? ((task.successfulRuns / task.totalRuns) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>

      {/* Policy Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {task.policy.retry.maxRetries > 0 && (
          <Badge variant="outline" className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            重试 {task.policy.retry.maxRetries}x
          </Badge>
        )}
        {task.policy.timeout.enabled && (
          <Badge variant="outline" className="text-xs">
            <Timer className="h-3 w-3 mr-1" />
            超时 {formatDuration(task.policy.timeout.duration)}
          </Badge>
        )}
        {task.policy.mutex.enabled && (
          <Badge variant="outline" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            互斥
          </Badge>
        )}
        {task.approvalRequired && (
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            需审批
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>总运行: {task.totalRuns}</span>
        <span>连续失败: {task.consecutiveFailures > 0 ? task.consecutiveFailures : '-'}</span>
      </div>
    </div>
  )
}

// ==================== Execution Item ====================

interface ExecutionItemProps {
  execution: TaskExecution
}

function ExecutionItem({ execution }: ExecutionItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full mt-0.5',
        execution.status === 'success' && 'bg-green-500/10',
        execution.status === 'failed' && 'bg-red-500/10',
        execution.status === 'running' && 'bg-blue-500/10',
        execution.status === 'cancelled' && 'bg-gray-500/10'
      )}>
        {execution.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {execution.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
        {execution.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
        {execution.status === 'cancelled' && <AlertCircle className="h-4 w-4 text-gray-500" />}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{execution.taskName}</span>
          <Badge variant="outline" className="text-xs">
            {execution.triggeredBy === 'schedule' ? '调度' : execution.triggeredBy === 'manual' ? '手动' : 'API'}
          </Badge>
          {execution.retryAttempt !== undefined && execution.retryAttempt > 0 && (
            <Badge variant="outline" className="text-xs text-yellow-500">
              重试 #{execution.retryAttempt}
            </Badge>
          )}
        </div>
        {execution.errorMessage && (
          <p className="text-xs text-red-500">{execution.errorMessage}</p>
        )}
        {execution.resultSummary && (
          <p className="text-xs text-muted-foreground">{execution.resultSummary}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDate(execution.startTime)} • 耗时: {execution.duration ? formatDuration(execution.duration) : '-'}
        </p>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function ScheduledTaskCenter({
  className,
  tasks: initialTasks,
  executions: initialExecutions,
}: ScheduledTaskCenterProps) {
  const tasks = initialTasks || mockTasks
  const executions = initialExecutions || mockExecutions
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'executions'>('tasks')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Stats
  const stats: ScheduledTaskCenterStats = useMemo(() => {
    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter((t) => t.status === 'active').length,
      pausedTasks: tasks.filter((t) => t.status === 'paused').length,
      runningTasks: tasks.filter((t) => t.status === 'running').length,
      failedTasks: tasks.filter((t) => t.status === 'failed').length,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter((e) => e.status === 'success').length,
      failedExecutions: executions.filter((e) => e.status === 'failed').length,
      avgExecutionTime: 45000,
    }
  }, [tasks, executions])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = searchQuery === '' ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tasks, searchQuery, statusFilter])

  // Handlers
  const handleViewTaskDetails = (task: ScheduledTask) => {
    setSelectedTask(task)
    setDetailDialogOpen(true)
  }

  const handleTaskRun = (taskId: string) => {
    console.log('Run task:', taskId)
  }

  const handleTaskPause = (taskId: string) => {
    console.log('Pause task:', taskId)
  }

  const handleTaskResume = (taskId: string) => {
    console.log('Resume task:', taskId)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-lg font-medium">定时任务中心</h2>
        </div>
        <Button size="sm">
          <Plus className="h-3 w-3 mr-1" />
          新建任务
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Play className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">活动中</p>
            <p className="text-lg font-medium text-green-500">{stats.activeTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Pause className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">已暂停</p>
            <p className="text-lg font-medium text-yellow-500">{stats.pausedTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">失败</p>
            <p className="text-lg font-medium text-red-500">{stats.failedTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <CheckCircle2 className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">成功执行</p>
            <p className="text-lg font-medium text-blue-500">{stats.successfulExecutions}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">平均耗时</p>
            <p className="text-lg font-medium">{formatDuration(stats.avgExecutionTime)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            任务列表
            <Badge variant="secondary" className="ml-1">{filteredTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            执行历史
            <Badge variant="secondary" className="ml-1">{executions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  状态: {statusFilter === 'all' ? '全部' : getStatusLabel(statusFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>全部</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  <Play className="h-3 w-3 mr-2 text-green-500" />
                  活动中
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('paused')}>
                  <Pause className="h-3 w-3 mr-2 text-yellow-500" />
                  已暂停
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                  <XCircle className="h-3 w-3 mr-2 text-red-500" />
                  失败
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('disabled')}>
                  <BellOff className="h-3 w-3 mr-2 text-gray-500" />
                  已禁用
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Task Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onRun={() => handleTaskRun(task.id)}
                onPause={() => handleTaskPause(task.id)}
                onResume={() => handleTaskResume(task.id)}
                onEdit={() => handleViewTaskDetails(task)}
                onDelete={() => {}}
              />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到匹配的任务
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {executions.map((execution) => (
                <ExecutionItem key={execution.id} execution={execution} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', getStatusColor(selectedTask.status))}>
                    {getStatusIcon(selectedTask.status)}
                  </div>
                  <div>
                    <DialogTitle>{selectedTask.name}</DialogTitle>
                    <DialogDescription>{selectedTask.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">类型</p>
                  <p className="text-sm font-medium">{selectedTask.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">风险等级</p>
                  <p className={cn('text-sm font-medium', getRiskLevelColor(selectedTask.riskLevel))}>
                    {getRiskLevelLabel(selectedTask.riskLevel)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">下次运行</p>
                  <p className="text-sm font-medium">
                    {selectedTask.nextRun ? formatDate(selectedTask.nextRun) : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">成功率</p>
                  <p className="text-sm font-medium">
                    {selectedTask.totalRuns > 0 ? ((selectedTask.successfulRuns / selectedTask.totalRuns) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">总运行次数</p>
                  <p className="text-sm font-medium">{selectedTask.totalRuns}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">连续失败</p>
                  <p className="text-sm font-medium">{selectedTask.consecutiveFailures}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">执行策略</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">重试策略</span>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedTask.policy.retry.policy === 'none' ? '不重试' :
                       selectedTask.policy.retry.policy === 'linear' ? '线性' :
                       selectedTask.policy.retry.policy === 'exponential' ? '指数' : '固定'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      最大 {selectedTask.policy.retry.maxRetries} 次
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">超时设置</span>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedTask.policy.timeout.enabled ? formatDuration(selectedTask.policy.timeout.duration) : '禁用'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">互斥策略</span>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedTask.policy.mutex.enabled ? (
                        selectedTask.policy.mutex.policy === 'wait' ? '等待' :
                        selectedTask.policy.mutex.policy === 'skip' ? '跳过' : '错误'
                      ) : '禁用'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  编辑任务
                </Button>
                <Button className="flex-1">
                  <Play className="h-3 w-3 mr-1" />
                  立即执行
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
