/**
 * TaskTraceAnalysis - 任务链路追踪组件
 * Story 32.2 - 任务链路追踪
 *
 * 添加任务、步骤和工具的追踪级执行检查
 * - 将任务、步骤和工具调用链接到共同的追踪
 * - 显示延迟分布和瓶颈
 * - 支持从产品事件向下钻取到运行时详情
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-02, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Filter,
  GitBranch,
  Hash,
  Link2,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Timer,
  TrendingDown,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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

// Types and mock data from sub-module
export type {
  TraceStatus,
  StepStatus,
  ToolCallStatus,
  TraceSpan,
  TraceEvent,
  Trace,
  LatencyBucket,
  TraceStats,
  TaskTraceAnalysisProps,
} from './TaskTraceAnalysisData'
export { mockTraces } from './TaskTraceAnalysisData'

// Import for internal use
import type {
  TraceStatus,
  StepStatus,
  TraceSpan,
  Trace,
  LatencyBucket,
  TraceStats,
  TaskTraceAnalysisProps,
} from './TaskTraceAnalysisData'
import { mockTraces } from './TaskTraceAnalysisData'

// ==================== Utility Functions ====================

function getStatusColor(status: TraceStatus | StepStatus): string {
  switch (status) {
    case 'running':
      return 'text-blue-500 bg-blue-500/10'
    case 'completed':
      return 'text-green-500 bg-green-500/10'
    case 'failed':
      return 'text-red-500 bg-red-500/10'
    case 'cancelled':
    case 'skipped':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'pending':
      return 'text-gray-500 bg-gray-500/10'
    default:
      return 'text-gray-500 bg-gray-500/10'
  }
}

function getStatusIcon(status: TraceStatus | StepStatus) {
  switch (status) {
    case 'running':
      return <RefreshCw className="h-3 w-3 animate-spin" />
    case 'completed':
      return <CheckCircle2 className="h-3 w-3" />
    case 'failed':
      return <XCircle className="h-3 w-3" />
    case 'cancelled':
    case 'skipped':
      return <AlertTriangle className="h-3 w-3" />
    case 'pending':
      return <Clock className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

function getStepTypeIcon(type: string) {
  switch (type) {
    case 'task':
      return <Activity className="h-4 w-4" />
    case 'step':
      return <GitBranch className="h-4 w-4" />
    case 'tool':
      return <Wrench className="h-4 w-4" />
    case 'agent':
      return <MessageSquare className="h-4 w-4" />
    case 'system':
      return <Settings className="h-4 w-4" />
    default:
      return <Hash className="h-4 w-4" />
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

// ==================== Span Tree Node ====================

interface SpanTreeNodeProps {
  span: TraceSpan
  level: number
  onSelectSpan?: (span: TraceSpan) => void
  selectedSpanId?: string
}

function SpanTreeNode({ span, level, onSelectSpan, selectedSpanId }: SpanTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 2)
  const hasChildren = span.children && span.children.length > 0

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors',
          selectedSpanId === span.id && 'bg-muted'
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelectSpan?.(span)}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <div className={cn('flex h-6 w-6 items-center justify-center rounded', getStatusColor(span.status))}>
          {getStatusIcon(span.status)}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground">{getStepTypeIcon(span.type)}</span>
          <span className="text-sm font-medium truncate">{span.name}</span>
          {span.errorMessage && (
            <Badge variant="destructive" className="text-xs">错误</Badge>
          )}
        </div>
        {span.duration && (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDuration(span.duration)}
          </span>
        )}
        {span.latency && (
          <span className={cn(
            'text-xs font-mono',
            span.latency > 1000 ? 'text-red-500' : span.latency > 500 ? 'text-yellow-500' : 'text-green-500'
          )}>
            {span.latency}ms
          </span>
        )}
      </div>
      {hasChildren && isOpen && span.children?.map((child) => (
        <SpanTreeNode
          key={child.id}
          span={child}
          level={level + 1}
          onSelectSpan={onSelectSpan}
          selectedSpanId={selectedSpanId}
        />
      ))}
    </>
  )
}

// ==================== Trace Card ====================

interface TraceCardProps {
  trace: Trace
  onViewDetails?: () => void
}

function TraceCard({ trace, onViewDetails }: TraceCardProps) {
  const progressPercentage = trace.totalSteps > 0
    ? ((trace.completedSteps / trace.totalSteps) * 100)
    : 0

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50',
      trace.status === 'failed' && 'border-red-500/20',
      trace.status === 'running' && 'border-blue-500/20',
      trace.status === 'completed' && 'border-green-500/20'
    )} onClick={onViewDetails}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', getStatusColor(trace.status))}>
            {getStatusIcon(trace.status)}
            <span className="ml-1">{trace.status === 'running' ? '运行中' : trace.status === 'completed' ? '完成' : trace.status === 'failed' ? '失败' : '取消'}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {trace.taskType}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {trace.traceId}
        </span>
      </div>

      {/* Task Name */}
      <h3 className="font-medium mb-2">{trace.taskName}</h3>

      {/* Progress */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span>进度</span>
          <span>{trace.completedSteps}/{trace.totalSteps} 步骤</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span>{trace.totalToolCalls} 调用</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3 w-3" />
          <span>{trace.duration ? formatDuration(trace.duration) : '-'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingDown className="h-3 w-3" />
          <span>{trace.avgLatency}ms</span>
        </div>
      </div>

      {/* Error Summary */}
      {trace.failedToolCalls > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 text-xs">
          <XCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-500">{trace.failedToolCalls} 个工具调用失败</span>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
        <span>开始: {formatTimestamp(trace.startTime)}</span>
        {trace.endTime && <span>结束: {formatTimestamp(trace.endTime)}</span>}
      </div>
    </div>
  )
}

// ==================== Latency Distribution ====================

interface LatencyDistributionProps {
  traces: Trace[]
}

function LatencyDistribution({ traces }: LatencyDistributionProps) {
  const buckets = useMemo<LatencyBucket[]>(() => {
    const latencyRanges = [
      { range: '0-100ms', min: 0, max: 100, count: 0 },
      { range: '100-300ms', min: 100, max: 300, count: 0 },
      { range: '300-500ms', min: 300, max: 500, count: 0 },
      { range: '500-1s', min: 500, max: 1000, count: 0 },
      { range: '1-3s', min: 1000, max: 3000, count: 0 },
      { range: '>3s', min: 3000, max: Infinity, count: 0 },
    ]

    traces.forEach((trace) => {
      const latency = trace.avgLatency
      const bucket = latencyRanges.find((r) => latency >= r.min && latency < r.max)
      if (bucket) bucket.count++
    })

    const total = traces.length || 1
    return latencyRanges.map((r) => ({
      range: r.range,
      count: r.count,
      percentage: (r.count / total) * 100,
    }))
  }, [traces])

  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">延迟分布</h4>
      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div key={bucket.range} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{bucket.range}</span>
              <span className="text-muted-foreground">{bucket.count} ({bucket.percentage.toFixed(1)}%)</span>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== Trace Detail Dialog ====================

interface TraceDetailDialogProps {
  trace: Trace | null
  open: boolean
  onClose: () => void
}

function TraceDetailDialog({ trace, open, onClose }: TraceDetailDialogProps) {
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null)
  const [activeTab, setActiveTab] = useState<'trace' | 'timeline' | 'events'>('trace')

  if (!trace) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', getStatusColor(trace.status))}>
              {getStatusIcon(trace.status)}
            </div>
            <div>
              <DialogTitle>{trace.taskName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <code className="text-xs">{trace.traceId}</code>
                <Badge variant="outline" className="text-xs">{trace.taskType}</Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">状态</p>
            <p className="text-sm font-medium">{trace.status === 'running' ? '运行中' : trace.status === 'completed' ? '完成' : trace.status === 'failed' ? '失败' : '取消'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">总步骤</p>
            <p className="text-sm font-medium">{trace.totalSteps}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">工具调用</p>
            <p className="text-sm font-medium">{trace.totalToolCalls}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">总延迟</p>
            <p className="text-sm font-medium">{trace.totalLatency}ms</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">输入 Token</p>
            <p className="text-sm font-medium">{trace.inputTokens}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">输出 Token</p>
            <p className="text-sm font-medium">{trace.outputTokens}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trace">追踪树</TabsTrigger>
            <TabsTrigger value="timeline">时间线</TabsTrigger>
            <TabsTrigger value="events">事件</TabsTrigger>
          </TabsList>

          <TabsContent value="trace" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <SpanTreeNode
                span={trace.rootSpan}
                level={0}
                onSelectSpan={setSelectedSpan}
                selectedSpanId={selectedSpan?.id}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="timeline">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-2">
                {trace.events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      {event.type === 'start' && <Clock className="h-3 w-3" />}
                      {event.type === 'end' && <CheckCircle2 className="h-3 w-3" />}
                      {event.type === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                      {event.type === 'retry' && <RefreshCw className="h-3 w-3" />}
                      {event.type === 'skip' && <AlertTriangle className="h-3 w-3" />}
                      {event.type === 'manual' && <Wrench className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{event.message}</p>
                      <p className="text-xs text-muted-foreground font-mono">{event.spanId}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-2">
                {trace.events.map((event) => (
                  <div key={event.id} className="space-y-1 p-3 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{event.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <p className="text-sm">{event.message}</p>
                    {event.details && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Selected Span Details */}
        {selectedSpan && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">选中跨度详情</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">名称: </span>
                <span>{selectedSpan.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">类型: </span>
                <span>{selectedSpan.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">状态: </span>
                <Badge variant="outline" className="text-xs">{selectedSpan.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">延迟: </span>
                <span>{selectedSpan.latency ? `${selectedSpan.latency}ms` : '-'}</span>
              </div>
              {selectedSpan.inputTokens && (
                <div>
                  <span className="text-muted-foreground">输入 Token: </span>
                  <span>{selectedSpan.inputTokens}</span>
                </div>
              )}
              {selectedSpan.outputTokens && (
                <div>
                  <span className="text-muted-foreground">输出 Token: </span>
                  <span>{selectedSpan.outputTokens}</span>
                </div>
              )}
            </div>
            {selectedSpan.errorMessage && (
              <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-500">
                {selectedSpan.errorMessage}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" className="flex-1">
            <Download className="h-3 w-3 mr-1" />
            导出追踪
          </Button>
          <Button variant="outline" className="flex-1">
            <ExternalLink className="h-3 w-3 mr-1" />
            查看完整报告
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function TaskTraceAnalysis({
  className,
  traces: initialTraces,
}: TaskTraceAnalysisProps) {
  const traces = initialTraces || mockTraces
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TraceStatus | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'traces' | 'analysis'>('traces')

  // Stats
  const stats: TraceStats = useMemo(() => {
    return {
      totalTraces: traces.length,
      activeTraces: traces.filter((t) => t.status === 'running').length,
      completedTraces: traces.filter((t) => t.status === 'completed').length,
      failedTraces: traces.filter((t) => t.status === 'failed').length,
      avgDuration: traces.reduce((acc, t) => acc + (t.duration || 0), 0) / (traces.length || 1),
      avgStepsPerTrace: traces.reduce((acc, t) => acc + t.totalSteps, 0) / (traces.length || 1),
      totalToolCalls: traces.reduce((acc, t) => acc + t.totalToolCalls, 0),
      successfulToolCalls: traces.reduce((acc, t) => acc + t.successfulToolCalls, 0),
      failedToolCalls: traces.reduce((acc, t) => acc + t.failedToolCalls, 0),
    }
  }, [traces])

  // Filter traces
  const filteredTraces = useMemo(() => {
    return traces.filter((trace) => {
      const matchesSearch = searchQuery === '' ||
        trace.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.traceId.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || trace.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [traces, searchQuery, statusFilter])

  // Handlers
  const handleViewDetails = (trace: Trace) => {
    setSelectedTrace(trace)
    setDetailDialogOpen(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          <h2 className="text-lg font-medium">任务链路追踪</h2>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3 w-3 mr-1" />
          导出追踪
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">运行中</p>
            <p className="text-lg font-medium text-blue-500">{stats.activeTraces}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">已完成</p>
            <p className="text-lg font-medium text-green-500">{stats.completedTraces}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">失败</p>
            <p className="text-lg font-medium text-red-500">{stats.failedTraces}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">平均时长</p>
            <p className="text-lg font-medium">{formatDuration(stats.avgDuration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">工具调用</p>
            <p className="text-lg font-medium">{stats.totalToolCalls}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traces" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            追踪列表
            <Badge variant="secondary" className="ml-1">{filteredTraces.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traces" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索追踪..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  状态: {statusFilter === 'all' ? '全部' : statusFilter === 'running' ? '运行中' : statusFilter === 'completed' ? '完成' : statusFilter === 'failed' ? '失败' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>全部</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('running')}>运行中</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>完成</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('failed')}>失败</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Trace Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTraces.map((trace) => (
              <TraceCard
                key={trace.id}
                trace={trace}
                onViewDetails={() => handleViewDetails(trace)}
              />
            ))}
          </div>

          {filteredTraces.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到匹配的追踪
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Latency Distribution */}
            <div className="rounded-lg border p-4">
              <LatencyDistribution traces={filteredTraces} />
            </div>

            {/* Error Analysis */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium">错误分析</h4>
              {stats.failedTraces === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>没有失败的追踪</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>失败追踪</span>
                    <span className="text-red-500 font-medium">{stats.failedTraces}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>失败工具调用</span>
                    <span className="text-red-500 font-medium">{stats.failedToolCalls}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>成功率</span>
                    <span className={cn(
                      'font-medium',
                      (stats.successfulToolCalls / (stats.totalToolCalls || 1)) > 0.9 ? 'text-green-500' :
                      (stats.successfulToolCalls / (stats.totalToolCalls || 1)) > 0.7 ? 'text-yellow-500' : 'text-red-500'
                    )}>
                      {((stats.successfulToolCalls / (stats.totalToolCalls || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Summary */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium">性能摘要</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>平均步骤数/追踪</span>
                  <span className="font-medium">{stats.avgStepsPerTrace.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>平均延迟</span>
                  <span className="font-medium">
                    {Math.round(traces.reduce((acc, t) => acc + t.avgLatency, 0) / (traces.length || 1))}ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>总输入 Token</span>
                  <span className="font-medium">{traces.reduce((acc, t) => acc + t.inputTokens, 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>总输出 Token</span>
                  <span className="font-medium">{traces.reduce((acc, t) => acc + t.outputTokens, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bottlenecks */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium">潜在瓶颈</h4>
              <div className="space-y-2">
                {filteredTraces
                  .filter((t) => t.avgLatency > 500)
                  .sort((a, b) => b.avgLatency - a.avgLatency)
                  .slice(0, 3)
                  .map((trace) => (
                    <div key={trace.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <span className="truncate">{trace.taskName}</span>
                      <Badge variant="outline" className="text-xs text-yellow-500">
                        {trace.avgLatency}ms
                      </Badge>
                    </div>
                  ))}
                {filteredTraces.filter((t) => t.avgLatency > 500).length === 0 && (
                  <p className="text-sm text-muted-foreground">没有检测到明显瓶颈</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <TraceDetailDialog
        trace={selectedTrace}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </div>
  )
}
