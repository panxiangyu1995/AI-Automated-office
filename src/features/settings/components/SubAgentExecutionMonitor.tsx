import { useState, useMemo } from 'react'
import {
  Bot,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Square,
  History,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  Timer,
  Cpu,
  Network,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled'
export type SubAgentExecutionRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface ExecutionTrace {
  id: string
  parentSessionId?: string
  parentMessageId?: string
  linkedAt: string
}

export interface ExecutionMetrics {
  duration: number // seconds
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
}

export interface SubAgentExecution {
  id: string
  subAgentId: string
  subAgentName: string
  subAgentTemplate: string
  status: ExecutionStatus
  riskLevel: SubAgentExecutionRiskLevel
  startTime: string
  endTime?: string
  input: string
  output?: string
  error?: string
  trace?: ExecutionTrace
  metrics?: ExecutionMetrics
  steps: ExecutionStep[]
}

export interface ExecutionStep {
  id: string
  name: string
  status: ExecutionStatus
  startTime: string
  endTime?: string
  duration?: number
  details?: string
}

export interface MonitorStats {
  totalExecutions: number
  runningNow: number
  completedToday: number
  failedToday: number
  averageDuration: number
  successRate: number
}

export interface SubAgentExecutionMonitorProps {
  className?: string
}

const createCorrectiveExecutions = (): SubAgentExecution[] => [
  {
    id: 'exec-c1',
    subAgentId: 'subagent-001',
    subAgentName: '文档起草助手',
    subAgentTemplate: 'specialist',
    status: 'running',
    riskLevel: 'low',
    startTime: '2026-03-24T10:35:00Z',
    input: '根据新的投标要求生成一个可审阅的章节草案',
    steps: [
      {
        id: 'step-c1',
        name: '解析需求',
        status: 'completed',
        startTime: '2026-03-24T10:35:00Z',
        endTime: '2026-03-24T10:35:01Z',
        duration: 1,
        details: '识别为文档起草任务',
      },
      {
        id: 'step-c2',
        name: '读取模板与资料',
        status: 'completed',
        startTime: '2026-03-24T10:35:01Z',
        endTime: '2026-03-24T10:35:02Z',
        duration: 1,
        details: '读取云端模板与历史标书摘要',
      },
      { id: 'step-c3', name: '暂存候选改动', status: 'running', startTime: '2026-03-24T10:35:02Z' },
    ],
    trace: {
      id: 'trace-c1',
      parentSessionId: 'session-123',
      parentMessageId: 'msg-456',
      linkedAt: '2026-03-24T10:35:00Z',
    },
  },
  {
    id: 'exec-c2',
    subAgentId: 'subagent-002',
    subAgentName: '资料整理助手',
    subAgentTemplate: 'general',
    status: 'completed',
    riskLevel: 'medium',
    startTime: '2026-03-24T10:30:00Z',
    endTime: '2026-03-24T10:31:15Z',
    input: '整理本地旧标书和云端模板，生成本次项目的资料包',
    output: '已生成资料包：历史标书摘要 3 份、可复用模板 2 份、投标要求提取结果 1 份。',
    metrics: {
      duration: 75,
      inputTokens: 256,
      outputTokens: 512,
      totalTokens: 768,
      latencyMs: 1200,
    },
    steps: [
      {
        id: 'step-c4',
        name: '收集资料',
        status: 'completed',
        startTime: '2026-03-24T10:30:00Z',
        endTime: '2026-03-24T10:30:20Z',
        duration: 20,
      },
      {
        id: 'step-c5',
        name: '抽取结构',
        status: 'completed',
        startTime: '2026-03-24T10:30:20Z',
        endTime: '2026-03-24T10:30:50Z',
        duration: 30,
      },
      {
        id: 'step-c6',
        name: '生成资料摘要',
        status: 'completed',
        startTime: '2026-03-24T10:30:50Z',
        endTime: '2026-03-24T10:31:15Z',
        duration: 25,
      },
    ],
    trace: {
      id: 'trace-c2',
      parentSessionId: 'session-122',
      parentMessageId: 'msg-455',
      linkedAt: '2026-03-24T10:30:00Z',
    },
  },
  {
    id: 'exec-c3',
    subAgentId: 'subagent-003',
    subAgentName: '规则校验助手',
    subAgentTemplate: 'analyst',
    status: 'failed',
    riskLevel: 'high',
    startTime: '2026-03-24T10:25:00Z',
    endTime: '2026-03-24T10:25:30Z',
    input: '检查草案中的敏感条款与制度规则',
    error: '制度规则知识库不可用，无法完成本次校验',
    steps: [
      {
        id: 'step-c7',
        name: '加载校验规则',
        status: 'completed',
        startTime: '2026-03-24T10:25:00Z',
        endTime: '2026-03-24T10:25:05Z',
        duration: 5,
      },
      {
        id: 'step-c8',
        name: '检索制度知识',
        status: 'failed',
        startTime: '2026-03-24T10:25:05Z',
        endTime: '2026-03-24T10:25:30Z',
        duration: 25,
        details: '连接超时',
      },
    ],
    trace: {
      id: 'trace-c3',
      parentSessionId: 'session-121',
      parentMessageId: 'msg-454',
      linkedAt: '2026-03-24T10:25:00Z',
    },
  },
  {
    id: 'exec-c4',
    subAgentId: 'subagent-004',
    subAgentName: '协作协调助手',
    subAgentTemplate: 'coordinator',
    status: 'completed',
    riskLevel: 'low',
    startTime: '2026-03-24T10:20:00Z',
    endTime: '2026-03-24T10:20:45Z',
    input: '向财务和法务发送项目协作摘要，并回收确认结果',
    output: '已发送协作摘要并收到 2 条回执：财务已确认报价口径，法务标记 1 个风险条款。',
    metrics: {
      duration: 45,
      inputTokens: 128,
      outputTokens: 256,
      totalTokens: 384,
      latencyMs: 800,
    },
    steps: [
      {
        id: 'step-c9',
        name: '生成摘要',
        status: 'completed',
        startTime: '2026-03-24T10:20:00Z',
        endTime: '2026-03-24T10:20:25Z',
        duration: 25,
      },
      {
        id: 'step-c10',
        name: '发送消息',
        status: 'completed',
        startTime: '2026-03-24T10:20:25Z',
        endTime: '2026-03-24T10:20:40Z',
        duration: 15,
      },
      {
        id: 'step-c11',
        name: '整理回执',
        status: 'completed',
        startTime: '2026-03-24T10:20:40Z',
        endTime: '2026-03-24T10:20:45Z',
        duration: 5,
      },
    ],
    trace: {
      id: 'trace-c4',
      parentSessionId: 'session-120',
      parentMessageId: 'msg-453',
      linkedAt: '2026-03-24T10:20:00Z',
    },
  },
]

// Status icon mapping
const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'cancelled':
      return <Square className="h-4 w-4 text-gray-500" />
  }
}

// Status badge variant mapping
const getStatusBadge = (status: ExecutionStatus) => {
  switch (status) {
    case 'running':
      return { variant: 'default' as const, label: '运行中', className: 'bg-blue-500' }
    case 'completed':
      return { variant: 'default' as const, label: '已完成', className: 'bg-green-500' }
    case 'failed':
      return { variant: 'destructive' as const, label: '失败' }
    case 'pending':
      return { variant: 'secondary' as const, label: '待处理' }
    case 'cancelled':
      return { variant: 'outline' as const, label: '已取消' }
  }
}

// Risk level badge
const getRiskBadge = (level: SubAgentExecutionRiskLevel) => {
  switch (level) {
    case 'low':
      return { variant: 'secondary' as const, label: '低风险' }
    case 'medium':
      return {
        variant: 'secondary' as const,
        label: '中风险',
        className: 'bg-yellow-100 text-yellow-800',
      }
    case 'high':
      return { variant: 'default' as const, label: '高风险', className: 'bg-orange-500' }
    case 'critical':
      return { variant: 'destructive' as const, label: '极高风险' }
  }
}

export function SubAgentExecutionMonitor({ className = '' }: SubAgentExecutionMonitorProps) {
  const [executions] = useState<SubAgentExecution[]>(createCorrectiveExecutions())
  const [selectedExecution, setSelectedExecution] = useState<SubAgentExecution | null>(null)

  // Stats
  const stats = useMemo((): MonitorStats => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayExecutions = executions.filter((e) => new Date(e.startTime) >= todayStart)
    const completedToday = todayExecutions.filter((e) => e.status === 'completed')
    const failedToday = todayExecutions.filter((e) => e.status === 'failed')
    const durations = completedToday
      .filter((e) => e.metrics?.duration)
      .map((e) => e.metrics!.duration)
    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const successRate =
      todayExecutions.length > 0 ? (completedToday.length / todayExecutions.length) * 100 : 0

    return {
      totalExecutions: executions.length,
      runningNow: executions.filter((e) => e.status === 'running').length,
      completedToday: completedToday.length,
      failedToday: failedToday.length,
      averageDuration: avgDuration,
      successRate: successRate,
    }
  }, [executions])

  // Active executions (running or pending)
  const activeExecutions = executions.filter(
    (e) => e.status === 'running' || e.status === 'pending'
  )

  // Historical executions
  const historicalExecutions = executions.filter(
    (e) => e.status !== 'running' && e.status !== 'pending'
  )

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}秒前`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Sub-Agent 执行监控
          </h2>
          <p className="text-muted-foreground">
            监控当前用户主 Agent 到 Sub-Agent 的执行链路，查看审阅、协作与恢复状态。
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalExecutions}</div>
                <div className="text-xs text-muted-foreground">总执行次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.runningNow}</div>
                <div className="text-xs text-muted-foreground">正在运行</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                <div className="text-xs text-muted-foreground">今日完成</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.failedToday}</div>
                <div className="text-xs text-muted-foreground">今日失败</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(Math.round(stats.averageDuration))}
                </div>
                <div className="text-xs text-muted-foreground">平均耗时</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">成功率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">活跃执行</TabsTrigger>
          <TabsTrigger value="history">执行历史</TabsTrigger>
        </TabsList>

        {/* Active Executions Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <Play className="h-4 w-4" />
                当前活跃执行
              </h3>
              <p className="text-xs text-muted-foreground">正在运行或等待处理的 Sub-Agent 任务</p>
            </div>
            {activeExecutions.length > 0 && (
              <Badge variant="outline">{activeExecutions.length} 个任务</Badge>
            )}
          </div>

          {activeExecutions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <EmptyState
                  title="暂无活跃执行任务"
                  description="子代理执行任务将在此处显示"
                  icon={Activity}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeExecutions.map((execution) => (
                <Card
                  key={execution.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedExecution?.id === execution.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedExecution(execution)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getStatusIcon(execution.status)}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{execution.subAgentName}</span>
                            <Badge {...getStatusBadge(execution.status)}>
                              {getStatusBadge(execution.status).label}
                            </Badge>
                            <Badge {...getRiskBadge(execution.riskLevel)}>
                              {getRiskBadge(execution.riskLevel).label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Clock className="h-3 w-3" />
                            <span>开始于 {formatTimeAgo(execution.startTime)}</span>
                            <span>•</span>
                            <span>输入: {execution.input.substring(0, 30)}...</span>
                          </div>
                          {/* Progress steps for running executions */}
                          {execution.status === 'running' && execution.steps.length > 0 && (
                            <div className="space-y-1 mt-3">
                              {execution.steps.map((step, idx) => (
                                <div key={step.id} className="flex items-center gap-2 text-xs">
                                  {idx > 0 && (
                                    <div
                                      className={`w-4 h-px ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}
                                    />
                                  )}
                                  {getStatusIcon(step.status)}
                                  <span
                                    className={
                                      step.status === 'running' ? 'text-blue-600 font-medium' : ''
                                    }
                                  >
                                    {step.name}
                                  </span>
                                  {step.duration && (
                                    <span className="text-muted-foreground">
                                      ({step.duration}秒)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {execution.trace && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Link2 className="h-3 w-3" />
                          <span>已关联</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <History className="h-4 w-4" />
              执行历史
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              查看所有已完成的 Sub-Agent 执行记录
            </p>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {historicalExecutions.map((execution) => (
                <Card
                  key={execution.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedExecution?.id === execution.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedExecution(execution)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getStatusIcon(execution.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{execution.subAgentName}</span>
                            <Badge {...getStatusBadge(execution.status)}>
                              {getStatusBadge(execution.status).label}
                            </Badge>
                            <Badge {...getRiskBadge(execution.riskLevel)}>
                              {getRiskBadge(execution.riskLevel).label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(execution.startTime)}</span>
                            {execution.endTime && execution.metrics?.duration && (
                              <>
                                <span>•</span>
                                <Timer className="h-3 w-3" />
                                <span>{formatDuration(execution.metrics.duration)}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">输入: </span>
                            <span>{execution.input}</span>
                          </div>
                          {execution.output && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">输出: </span>
                              <span className="line-clamp-2">{execution.output}</span>
                            </div>
                          )}
                          {execution.error && (
                            <div className="text-sm text-red-500">
                              <span className="text-muted-foreground">错误: </span>
                              <span>{execution.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {execution.metrics && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ArrowDownLeft className="h-3 w-3" />
                              <span>{execution.metrics.inputTokens}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              <span>{execution.metrics.outputTokens}</span>
                            </div>
                          </div>
                        )}
                        {execution.trace && (
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            <Link2 className="h-3 w-3" />
                            <span>查看链路</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Detail Panel */}
      {selectedExecution && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                执行详情
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedExecution(null)}>
                关闭
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">基本信息</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sub-Agent</span>
                      <span>{selectedExecution.subAgentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">模板</span>
                      <span>{selectedExecution.subAgentTemplate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">状态</span>
                      <Badge {...getStatusBadge(selectedExecution.status)}>
                        {getStatusBadge(selectedExecution.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">风险等级</span>
                      <Badge {...getRiskBadge(selectedExecution.riskLevel)}>
                        {getRiskBadge(selectedExecution.riskLevel).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">时间信息</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">开始时间</span>
                      <span>{new Date(selectedExecution.startTime).toLocaleString()}</span>
                    </div>
                    {selectedExecution.endTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">结束时间</span>
                        <span>{new Date(selectedExecution.endTime).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedExecution.metrics?.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">总耗时</span>
                        <span>{formatDuration(selectedExecution.metrics.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedExecution.metrics && (
                  <div>
                    <div className="text-sm font-medium mb-1">性能指标</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">输入Token</span>
                        <span>{selectedExecution.metrics.inputTokens}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">输出Token</span>
                        <span>{selectedExecution.metrics.outputTokens}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">总Token</span>
                        <span>{selectedExecution.metrics.totalTokens}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">延迟</span>
                        <span>{selectedExecution.metrics.latencyMs}ms</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedExecution.trace && (
                  <div>
                    <div className="text-sm font-medium mb-1">链路追踪</div>
                    <div className="space-y-1 text-sm p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-blue-500" />
                        <span>会话ID: {selectedExecution.trace.parentSessionId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        <span>消息ID: {selectedExecution.trace.parentMessageId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          关联时间: {new Date(selectedExecution.trace.linkedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Execution steps */}
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">执行步骤</div>
              <div className="space-y-2">
                {selectedExecution.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2 w-32">
                      {getStatusIcon(step.status)}
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            step.status === 'completed'
                              ? 'bg-green-500'
                              : step.status === 'running'
                                ? 'bg-blue-500 animate-pulse'
                                : step.status === 'failed'
                                  ? 'bg-red-500'
                                  : 'bg-gray-300'
                          }`}
                          style={{
                            width:
                              step.status === 'completed'
                                ? '100%'
                                : step.status === 'running'
                                  ? '60%'
                                  : '0%',
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-20 text-right">
                      {step.duration ? `${step.duration}秒` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
