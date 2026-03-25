/**
 * LogMetricsCenter - 日志与指标中心组件
 * Story 32.1 - 日志与指标中心
 *
 * 扩展运行时指标为统一的操作日志和指标中心
 * - 聚合 Agent、工具、插件和同步日志
 * - 显示核心运行时指标和健康指标
 * - 支持过滤和导出日志
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
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Info,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Search,
  Server,
  Settings,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'
export type LogSource = 'agent' | 'tool' | 'plugin' | 'sync' | 'system'
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  source: LogSource
  category: string
  message: string
  details?: Record<string, unknown>
  traceId?: string
  spanId?: string
  userId?: string
  sessionId?: string
}

export interface MetricValue {
  value: number
  timestamp: Date
  labels?: Record<string, string>
}

export interface Metric {
  id: string
  name: string
  type: MetricType
  description: string
  value: MetricValue
  previousValue?: MetricValue
  unit: string
  labels?: Record<string, string>
  min?: number
  max?: number
}

export interface HealthIndicator {
  id: string
  name: string
  status: HealthStatus
  value: number
  threshold: number
  unit: string
  message?: string
}

export interface LogMetricsCenterStats {
  totalLogs: number
  logsByLevel: Record<LogLevel, number>
  logsBySource: Record<LogSource, number>
  errorRate: number
  avgResponseTime: number
  activeConnections: number
  uptime: number
}

// ==================== Mock Data ====================

const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 60000),
    level: 'info',
    source: 'agent',
    category: 'session',
    message: 'User session started successfully',
    traceId: 'trace-abc123',
    userId: 'user-001',
    sessionId: 'sess-xyz789',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 120000),
    level: 'warning',
    source: 'tool',
    category: 'http',
    message: 'HTTP request took longer than expected: 2500ms',
    details: { url: 'https://api.example.com/data', duration: 2500 },
    traceId: 'trace-def456',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 180000),
    level: 'error',
    source: 'plugin',
    category: 'hr-assistant',
    message: 'Failed to process employee data: connection timeout',
    details: { plugin: 'hr-assistant', operation: 'getEmployeeList' },
    traceId: 'trace-ghi789',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 240000),
    level: 'critical',
    source: 'system',
    category: 'memory',
    message: 'Memory usage exceeded 90% threshold',
    details: { used: 9216, total: 10240, percentage: 90 },
    traceId: 'trace-jkl012',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 300000),
    level: 'info',
    source: 'sync',
    category: 'data-sync',
    message: 'Incremental sync completed successfully',
    details: { recordsProcessed: 1250, duration: 3500 },
    traceId: 'trace-mno345',
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 360000),
    level: 'debug',
    source: 'tool',
    category: 'shell',
    message: 'Shell command executed: ls -la /tmp',
    details: { command: 'ls -la /tmp', exitCode: 0 },
    traceId: 'trace-pqr678',
  },
  {
    id: 'log-7',
    timestamp: new Date(Date.now() - 420000),
    level: 'warning',
    source: 'agent',
    category: 'context',
    message: 'Context compression triggered due to token limit',
    details: { tokensBefore: 128000, tokensAfter: 64000, compressionRatio: 0.5 },
    traceId: 'trace-stu901',
  },
  {
    id: 'log-8',
    timestamp: new Date(Date.now() - 480000),
    level: 'error',
    source: 'plugin',
    category: 'finance-ocr',
    message: 'OCR processing failed: invalid image format',
    details: { file: 'invoice_2024_001.pdf', error: 'UNSUPPORTED_FORMAT' },
    traceId: 'trace-vwx234',
  },
]

const mockMetrics: Metric[] = [
  {
    id: 'metric-1',
    name: 'agent_requests_total',
    type: 'counter',
    description: 'Total number of Agent requests',
    value: { value: 15847, timestamp: new Date() },
    previousValue: { value: 15234, timestamp: new Date(Date.now() - 60000) },
    unit: 'requests',
  },
  {
    id: 'metric-2',
    name: 'agent_request_duration_seconds',
    type: 'histogram',
    description: 'Agent request duration in seconds',
    value: { value: 1.25, timestamp: new Date() },
    previousValue: { value: 1.18, timestamp: new Date(Date.now() - 60000) },
    unit: 's',
    min: 0,
    max: 10,
  },
  {
    id: 'metric-3',
    name: 'active_sessions',
    type: 'gauge',
    description: 'Number of active user sessions',
    value: { value: 42, timestamp: new Date() },
    previousValue: { value: 38, timestamp: new Date(Date.now() - 60000) },
    unit: 'sessions',
  },
  {
    id: 'metric-4',
    name: 'tool_calls_total',
    type: 'counter',
    description: 'Total number of tool calls',
    value: { value: 89456, timestamp: new Date() },
    previousValue: { value: 87654, timestamp: new Date(Date.now() - 60000) },
    unit: 'calls',
  },
  {
    id: 'metric-5',
    name: 'tool_error_rate',
    type: 'gauge',
    description: 'Tool call error rate',
    value: { value: 2.3, timestamp: new Date() },
    previousValue: { value: 1.8, timestamp: new Date(Date.now() - 60000) },
    unit: '%',
    min: 0,
    max: 100,
  },
  {
    id: 'metric-6',
    name: 'memory_usage_bytes',
    type: 'gauge',
    description: 'Memory usage in bytes',
    value: { value: 64482545664, timestamp: new Date() },
    previousValue: { value: 61847585664, timestamp: new Date(Date.now() - 60000) },
    unit: 'B',
    min: 0,
    max: 128849018880,
  },
  {
    id: 'metric-7',
    name: 'cpu_usage_percent',
    type: 'gauge',
    description: 'CPU usage percentage',
    value: { value: 45.2, timestamp: new Date() },
    previousValue: { value: 38.7, timestamp: new Date(Date.now() - 60000) },
    unit: '%',
    min: 0,
    max: 100,
  },
  {
    id: 'metric-8',
    name: 'sync_latency_ms',
    type: 'histogram',
    description: 'Data sync latency in milliseconds',
    value: { value: 125, timestamp: new Date() },
    previousValue: { value: 98, timestamp: new Date(Date.now() - 60000) },
    unit: 'ms',
    min: 0,
    max: 5000,
  },
]

const mockHealthIndicators: HealthIndicator[] = [
  {
    id: 'health-1',
    name: 'Agent Service',
    status: 'healthy',
    value: 99.8,
    threshold: 95,
    unit: '%',
    message: 'All systems operational',
  },
  {
    id: 'health-2',
    name: 'Tool Execution',
    status: 'degraded',
    value: 97.2,
    threshold: 95,
    unit: '%',
    message: 'Some tools showing elevated latency',
  },
  {
    id: 'health-3',
    name: 'Plugin System',
    status: 'healthy',
    value: 98.5,
    threshold: 95,
    unit: '%',
    message: 'All plugins loaded successfully',
  },
  {
    id: 'health-4',
    name: 'Data Sync',
    status: 'unhealthy',
    value: 89.1,
    threshold: 95,
    unit: '%',
    message: 'Sync delays detected in last 5 minutes',
  },
  {
    id: 'health-5',
    name: 'Memory',
    status: 'degraded',
    value: 82.3,
    threshold: 90,
    unit: '%',
    message: 'Memory usage elevated',
  },
]

// ==================== Utility Functions ====================

function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case 'debug':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    case 'info':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'error':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'critical':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

function getLogLevelIcon(level: LogLevel) {
  switch (level) {
    case 'debug':
      return <Info className="h-3 w-3" />
    case 'info':
      return <Activity className="h-3 w-3" />
    case 'warning':
      return <AlertTriangle className="h-3 w-3" />
    case 'error':
      return <XCircle className="h-3 w-3" />
    case 'critical':
      return <AlertCircle className="h-3 w-3" />
    default:
      return <Info className="h-3 w-3" />
  }
}

function getLogSourceIcon(source: LogSource) {
  switch (source) {
    case 'agent':
      return <MessageSquare className="h-3 w-3" />
    case 'tool':
      return <Wrench className="h-3 w-3" />
    case 'plugin':
      return <Server className="h-3 w-3" />
    case 'sync':
      return <RefreshCw className="h-3 w-3" />
    case 'system':
      return <Settings className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

function getLogSourceLabel(source: LogSource): string {
  switch (source) {
    case 'agent':
      return 'Agent'
    case 'tool':
      return '工具'
    case 'plugin':
      return '插件'
    case 'sync':
      return '同步'
    case 'system':
      return '系统'
    default:
      return source
  }
}

function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500 bg-green-500/10'
    case 'degraded':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'unhealthy':
      return 'text-red-500 bg-red-500/10'
    default:
      return 'text-gray-500 bg-gray-500/10'
  }
}

function formatMetricValue(value: number, unit: string): string {
  if (unit === 'B') {
    const gb = value / 1024 / 1024 / 1024
    return `${gb.toFixed(1)} GB`
  }
  if (unit === 'ms') {
    return `${value.toFixed(0)} ms`
  }
  if (unit === 's') {
    return `${value.toFixed(2)} s`
  }
  if (unit === '%') {
    return `${value.toFixed(1)}%`
  }
  return `${value.toLocaleString()} ${unit}`
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ==================== Log Entry Row ====================

interface LogEntryRowProps {
  log: LogEntry
  onViewDetails?: () => void
}

function LogEntryRow({ log, onViewDetails }: LogEntryRowProps) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer" onClick={onViewDetails}>
      <div className={cn('flex h-6 w-6 items-center justify-center rounded', getLogLevelColor(log.level))}>
        {getLogLevelIcon(log.level)}
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {formatTimestamp(log.timestamp)}
          </span>
          <Badge variant="outline" className="text-xs">
            {getLogSourceIcon(log.source)}
            <span className="ml-1">{getLogSourceLabel(log.source)}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {log.category}
          </Badge>
        </div>
        <p className="text-sm truncate">{log.message}</p>
        {log.traceId && (
          <p className="text-xs text-muted-foreground font-mono">
            Trace: {log.traceId}
          </p>
        )}
      </div>
    </div>
  )
}

// ==================== Metric Card ====================

interface MetricCardProps {
  metric: Metric
}

function MetricCard({ metric }: MetricCardProps) {
  const valueChange = metric.previousValue
    ? ((metric.value.value - metric.previousValue.value) / metric.previousValue.value) * 100
    : 0
  const isPositive = valueChange > 0
  const isNeutral = Math.abs(valueChange) < 0.1

  const normalizedValue = metric.min !== undefined && metric.max !== undefined
    ? ((metric.value.value - metric.min) / (metric.max - metric.min)) * 100
    : undefined

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate">{metric.name}</span>
        {metric.previousValue && (
          <span className={cn(
            'text-xs font-medium',
            isNeutral ? 'text-muted-foreground' : isPositive ? 'text-red-500' : 'text-green-500'
          )}>
            {isNeutral ? '-' : `${isPositive ? '+' : ''}${valueChange.toFixed(1)}%`}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl font-medium">{formatMetricValue(metric.value.value, metric.unit)}</p>
        <Badge variant="outline" className="text-xs">
          {metric.type}
        </Badge>
      </div>
      {normalizedValue !== undefined && (
        <Progress value={normalizedValue} className="h-1" />
      )}
      <p className="text-xs text-muted-foreground">{metric.description}</p>
    </div>
  )
}

// ==================== Health Indicator Row ====================

interface HealthIndicatorRowProps {
  indicator: HealthIndicator
}

function HealthIndicatorRow({ indicator }: HealthIndicatorRowProps) {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', getHealthStatusColor(indicator.status))}>
        {indicator.status === 'healthy' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : indicator.status === 'degraded' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{indicator.name}</span>
          <span className={cn('text-sm font-medium', getHealthStatusColor(indicator.status))}>
            {indicator.value.toFixed(1)}{indicator.unit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{indicator.message}</p>
      </div>
    </div>
  )
}

// ==================== Log Detail Dialog ====================

interface LogDetailDialogProps {
  log: LogEntry | null
  open: boolean
  onClose: () => void
}

function LogDetailDialog({ log, open, onClose }: LogDetailDialogProps) {
  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className={cn('text-xs', getLogLevelColor(log.level))}>
              {getLogLevelIcon(log.level)}
              <span className="ml-1">{log.level.toUpperCase()}</span>
            </Badge>
            <span>日志详情</span>
          </DialogTitle>
          <DialogDescription>
            {log.timestamp.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">来源</p>
              <div className="flex items-center gap-2">
                {getLogSourceIcon(log.source)}
                <span className="text-sm font-medium">{getLogSourceLabel(log.source)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">类别</p>
              <span className="text-sm font-medium">{log.category}</span>
            </div>
          </div>

          {log.traceId && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trace ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{log.traceId}</code>
            </div>
          )}

          {log.spanId && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Span ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{log.spanId}</code>
            </div>
          )}

          {log.userId && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">用户 ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{log.userId}</code>
            </div>
          )}

          {log.sessionId && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">会话 ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{log.sessionId}</code>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">消息</p>
            <p className="text-sm bg-muted p-3 rounded">{log.message}</p>
          </div>

          {log.details && Object.keys(log.details).length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">详细信息</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export interface LogMetricsCenterProps {
  className?: string
  logs?: LogEntry[]
  metrics?: Metric[]
  healthIndicators?: HealthIndicator[]
  onExportLogs?: (filters: LogFilter) => void
  onViewLogDetails?: (log: LogEntry) => void
}

export interface LogFilter {
  levels?: LogLevel[]
  sources?: LogSource[]
  search?: string
  startTime?: Date
  endTime?: Date
}

export function LogMetricsCenter({
  className,
  logs: initialLogs,
  metrics: initialMetrics,
  healthIndicators: initialHealthIndicators,
}: LogMetricsCenterProps) {
  const logs = useMemo(() => initialLogs || mockLogs, [initialLogs])
  const metrics = useMemo(() => initialMetrics || mockMetrics, [initialMetrics])
  const healthIndicators = useMemo(() => initialHealthIndicators || mockHealthIndicators, [initialHealthIndicators])
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<LogSource | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics' | 'health'>('logs')

  // Stats
  const stats: LogMetricsCenterStats = useMemo(() => {
    const logsByLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    }
    const logsBySource: Record<LogSource, number> = {
      agent: 0,
      tool: 0,
      plugin: 0,
      sync: 0,
      system: 0,
    }

    logs.forEach((log) => {
      logsByLevel[log.level]++
      logsBySource[log.source]++
    })

    const errorLogs = logsByLevel.error + logsByLevel.critical
    const totalLogs = logs.length
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0

    return {
      totalLogs: logs.length,
      logsByLevel,
      logsBySource,
      errorRate,
      avgResponseTime: 1.25,
      activeConnections: 42,
      uptime: 99.5,
    }
  }, [logs])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.traceId?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter
      const matchesSource = sourceFilter === 'all' || log.source === sourceFilter
      return matchesSearch && matchesLevel && matchesSource
    })
  }, [logs, searchQuery, levelFilter, sourceFilter])

  // Handlers
  const handleViewLogDetails = (log: LogEntry) => {
    setSelectedLog(log)
    setDetailDialogOpen(true)
  }

  const handleExportLogs = () => {
    const exportData = filteredLogs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" />
          <h2 className="text-lg font-medium">日志与指标中心</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportLogs}>
          <Download className="h-3 w-3 mr-1" />
          导出日志
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-6 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">总日志</p>
            <p className="text-lg font-medium">{stats.totalLogs}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">信息</p>
            <p className="text-lg font-medium text-blue-500">{stats.logsByLevel.info}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">警告</p>
            <p className="text-lg font-medium text-yellow-500">{stats.logsByLevel.warning}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <XCircle className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">错误</p>
            <p className="text-lg font-medium text-orange-500">{stats.logsByLevel.error}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">错误率</p>
            <p className="text-lg font-medium text-red-500">{stats.errorRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Activity className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">运行时间</p>
            <p className="text-lg font-medium text-green-500">{stats.uptime}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            日志
            <Badge variant="secondary" className="ml-1">{filteredLogs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            指标
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            健康
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索日志..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  级别: {levelFilter === 'all' ? '全部' : levelFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLevelFilter('all')}>全部</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLevelFilter('debug')}>Debug</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLevelFilter('info')}>Info</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLevelFilter('warning')}>Warning</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLevelFilter('error')}>Error</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLevelFilter('critical')}>Critical</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  来源: {sourceFilter === 'all' ? '全部' : getLogSourceLabel(sourceFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSourceFilter('all')}>全部</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSourceFilter('agent')}>Agent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('tool')}>工具</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('plugin')}>插件</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('sync')}>同步</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('system')}>系统</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Log List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  没有找到匹配的日志
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <LogEntryRow
                    key={log.id}
                    log={log}
                    onViewDetails={() => handleViewLogDetails(log)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="space-y-2">
            {healthIndicators.map((indicator) => (
              <HealthIndicatorRow key={indicator.id} indicator={indicator} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <LogDetailDialog
        log={selectedLog}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </div>
  )
}
