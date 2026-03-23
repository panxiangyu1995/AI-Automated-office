/**
 * ToolCallDetailDialog - 工具调用详情对话框组件
 * Story 5.3 - 工具调用详情查看
 *
 * 提供工具调用的详细参数和结果检查
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用消息模型和工具执行器
 * - Brand Color: #1E3A5F
 */

import { useState, useMemo, useCallback } from 'react'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  AlertCircle,
  XCircle,
  Zap,
  Terminal,
  FileJson,
  Clock3,
  Hash,
  ArrowRightLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  ToolCallPart,
  ToolResultPart,
} from '../../message/runtime/messageModel'
import type {
  ToolCallLifecycleEvent,
} from '../tools/toolExecutor'
import type { ToolDescriptor } from '../tools/toolDescriptor'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

const STATUS_CONFIG: Record<ToolCallPart['status'], {
  icon: React.ElementType
  label: string
  color: string
}> = {
  pending: {
    icon: Clock,
    label: '等待中',
    color: 'text-yellow-600',
  },
  running: {
    icon: Loader2,
    label: '执行中',
    color: 'text-blue-600',
  },
  completed: {
    icon: CheckCircle,
    label: '已完成',
    color: 'text-green-600',
  },
  failed: {
    icon: XCircle,
    label: '失败',
    color: 'text-red-600',
  },
  cancelled: {
    icon: AlertCircle,
    label: '已取消',
    color: 'text-gray-600',
  },
}

// ==================== Types ====================

export interface ToolCallDetailDialogProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void
  /** 工具调用部分 */
  toolCall: ToolCallPart | null
  /** 工具结果 */
  result?: ToolResultPart
  /** 工具描述符 */
  descriptor?: ToolDescriptor
  /** 生命周期事件 */
  events?: ToolCallLifecycleEvent[]
  /** 追踪导航回调 */
  onTraceNavigate?: (executionId: string) => void
  /** 查看原始输出回调 */
  onViewRawOutput?: (reference: string) => void
}

// ==================== Helper Functions ====================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatValue(value: unknown, indent: number = 0): string {
  const spaces = '  '.repeat(indent)
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => formatValue(item, indent + 1))
    return `[\n${spaces}  ${items.join(',\n' + spaces + '  ')}\n${spaces}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const props = entries.map(
      ([key, val]) => `${spaces}  "${key}": ${formatValue(val, indent + 1)}`
    )
    return `{\n${props.join(',\n')}\n${spaces}}`
  }
  return String(value)
}

// ==================== Components ====================

/**
 * 参数表格组件
 */
function ParameterTable({
  parameters,
}: {
  parameters: ToolCallPart['parameters']
}): React.ReactNode {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <div className="space-y-2">
      {parameters.map((param) => {
        const isExpanded = expanded[param.name] ?? false
        const isComplex = typeof param.value === 'object' && param.value !== null

        return (
          <div
            key={param.name}
            className="border rounded-md overflow-hidden"
          >
            <button
              onClick={() => isComplex && toggleExpand(param.name)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-left',
                'bg-slate-50 hover:bg-slate-100 transition-colors',
                isComplex ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-slate-700">
                  {param.name}
                </span>
                {param.type && (
                  <Badge variant="outline" className="text-xs">
                    {param.type}
                  </Badge>
                )}
              </div>
              {isComplex && (
                isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )
              )}
            </button>
            <div className="px-3 py-2 bg-white border-t">
              <pre className="text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                <code>
                  {isExpanded || !isComplex
                    ? formatValue(param.value)
                    : typeof param.value === 'object'
                    ? '{...}'
                    : String(param.value)}
                </code>
              </pre>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 结果展示组件
 */
function ResultDisplay({
  result,
  onCopy,
}: {
  result: unknown
  onCopy: () => void
}): React.ReactNode {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured')

  const handleCopy = useCallback(() => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [onCopy])

  const formattedResult = useMemo(() => {
    return formatValue(result)
  }, [result])

  return (
    <div className="space-y-3">
      {/* 视图切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
          <button
            onClick={() => setViewMode('structured')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              viewMode === 'structured'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            结构化
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              viewMode === 'raw'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            原始
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7"
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          {copied ? '已复制' : '复制'}
        </Button>
      </div>

      {/* 结果内容 */}
      <ScrollArea className="h-[300px] border rounded-md">
        <div className="p-3">
          {viewMode === 'structured' ? (
            <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
              <code>{formattedResult}</code>
            </pre>
          ) : (
            <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
              <code>{JSON.stringify(result, null, 2)}</code>
            </pre>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * 事件时间线组件
 */
function EventTimeline({
  events,
}: {
  events: ToolCallLifecycleEvent[]
}): React.ReactNode {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-slate-400 text-sm">
        暂无事件记录
      </div>
    )
  }

  const eventLabels: Record<string, string> = {
    tool_call_start: '开始执行',
    tool_call_validation: '参数验证',
    tool_call_context_inject: '上下文注入',
    tool_call_execute: '执行工具',
    tool_call_success: '执行成功',
    tool_call_error: '执行失败',
    tool_call_complete: '执行完成',
  }

  return (
    <div className="relative">
      {/* 时间线 */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const isError = event.type === 'tool_call_error'
          const isSuccess = event.type === 'tool_call_success'

          return (
            <div key={index} className="relative flex gap-3 pl-8">
              {/* 时间点 */}
              <div
                className={cn(
                  'absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2',
                  isError
                    ? 'bg-red-500 border-red-200'
                    : isSuccess
                    ? 'bg-green-500 border-green-200'
                    : 'bg-blue-500 border-blue-200'
                )}
              />

              {/* 事件内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {eventLabels[event.type] || event.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                {event.data && (
                  <pre className="mt-1 text-xs text-slate-500 overflow-x-auto whitespace-pre-wrap">
                    <code>{JSON.stringify(event.data, null, 2)}</code>
                  </pre>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 工具调用详情对话框
 */
export function ToolCallDetailDialog({
  open,
  onOpenChange,
  toolCall,
  result,
  descriptor,
  events = [],
  onTraceNavigate,
  onViewRawOutput,
}: ToolCallDetailDialogProps): React.ReactNode {
  const [activeTab, setActiveTab] = useState('input')

  // 计算执行时间
  const duration = useMemo(() => {
    if (toolCall?.startedAt && toolCall?.completedAt) {
      return toolCall.completedAt - toolCall.startedAt
    }
    if (result?.duration) {
      return result.duration
    }
    return null
  }, [toolCall, result])

  // 复制结果
  const handleCopyResult = useCallback(() => {
    if (result?.result) {
      navigator.clipboard.writeText(JSON.stringify(result.result, null, 2))
    }
  }, [result])

  // 追踪导航
  const handleTraceNavigate = useCallback(() => {
    if (events.length > 0 && onTraceNavigate) {
      onTraceNavigate(events[0].executionId)
    }
  }, [events, onTraceNavigate])

  // 查看原始输出
  const handleViewRawOutput = useCallback(() => {
    if (result?.result && onViewRawOutput) {
      onViewRawOutput(`result-${toolCall?.id}`)
    }
  }, [result, toolCall, onViewRawOutput])

  if (!toolCall) {
    return null
  }

  const statusConfig = STATUS_CONFIG[toolCall.status]
  const StatusIcon = statusConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" style={{ color: BRAND_COLOR }} />
            <span>工具调用详情</span>
          </DialogTitle>
          <DialogDescription>
            查看工具调用的详细参数、结果和执行过程
          </DialogDescription>
        </DialogHeader>

        {/* 概览信息 */}
        <div className="flex items-center gap-4 py-3 px-1">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={cn(
                'h-5 w-5',
                statusConfig.color,
                toolCall.status === 'running' ? 'animate-spin' : ''
              )}
            />
            <Badge variant="secondary">{statusConfig.label}</Badge>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Hash className="h-4 w-4" />
            <span className="font-mono">{toolCall.toolName}</span>
          </div>
          {duration && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock3 className="h-4 w-4" />
                <span>{formatDuration(duration)}</span>
              </div>
            </>
          )}
        </div>

        {/* 标签页 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="input">输入参数</TabsTrigger>
            <TabsTrigger value="output">输出结果</TabsTrigger>
            <TabsTrigger value="timeline">执行时间线</TabsTrigger>
            <TabsTrigger value="metadata">元数据</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-3">
            {/* 输入参数 */}
            <TabsContent value="input" className="h-full m-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {/* 摘要 */}
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Zap className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      输入摘要
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">工具ID：</span>
                        <span className="font-mono text-slate-700">{toolCall.toolId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">参数数量：</span>
                        <span className="text-slate-700">{toolCall.parameters.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* 参数表格 */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <FileJson className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      参数详情
                    </div>
                    {toolCall.parameters.length > 0 ? (
                      <ParameterTable parameters={toolCall.parameters} />
                    ) : (
                      <div className="text-sm text-slate-500 text-center py-4">
                        无参数
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 输出结果 */}
            <TabsContent value="output" className="h-full m-0">
              <ScrollArea className="h-full pr-4">
                {result ? (
                  <div className="space-y-4">
                    {/* 结果状态 */}
                    <div
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg',
                        result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      )}
                    >
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                        {result.success ? '执行成功' : '执行失败'}
                      </span>
                      {result.duration && (
                        <Badge variant="outline" className="ml-auto">
                          {formatDuration(result.duration)}
                        </Badge>
                      )}
                    </div>

                    {/* 错误信息 */}
                    {result.errorMessage && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-1">
                          <AlertCircle className="h-4 w-4" />
                          错误信息
                        </div>
                        <p className="text-sm text-red-600">{result.errorMessage}</p>
                      </div>
                    )}

                    {/* 结果内容 */}
                    {result.result !== undefined && result.result !== null && (
                      <ResultDisplay result={result.result} onCopy={handleCopyResult} />
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 pt-2">
                      {onViewRawOutput && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewRawOutput}
                        >
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          查看原始输出
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Info className="h-12 w-12 mb-2" />
                    <p>暂无结果</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* 执行时间线 */}
            <TabsContent value="timeline" className="h-full m-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <ArrowRightLeft className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      执行事件
                    </div>
                    {onTraceNavigate && events.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTraceNavigate}
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        追踪导航
                      </Button>
                    )}
                  </div>
                  <EventTimeline events={events} />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 元数据 */}
            <TabsContent value="metadata" className="h-full m-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {/* 工具信息 */}
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Terminal className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      工具信息
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 min-w-[80px]">ID：</span>
                        <span className="font-mono text-slate-700">{toolCall.id}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 min-w-[80px]">工具ID：</span>
                        <span className="font-mono text-slate-700">{toolCall.toolId}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 min-w-[80px]">名称：</span>
                        <span className="text-slate-700">{toolCall.toolName}</span>
                      </div>
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Clock className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                      时间信息
                    </div>
                    <div className="space-y-2 text-sm">
                      {toolCall.startedAt && (
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[80px]">开始时间：</span>
                          <span className="text-slate-700">{formatTimestamp(toolCall.startedAt)}</span>
                        </div>
                      )}
                      {toolCall.completedAt && (
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[80px]">完成时间：</span>
                          <span className="text-slate-700">{formatTimestamp(toolCall.completedAt)}</span>
                        </div>
                      )}
                      {duration && (
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[80px]">执行时长：</span>
                          <span className="text-slate-700">{formatDuration(duration)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 工具描述符 */}
                  {descriptor && (
                    <div className="p-3 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Info className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                        工具描述
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-500">描述：</span>
                          <span className="text-slate-700">{descriptor.description}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">版本：</span>
                          <span className="font-mono text-slate-700">{descriptor.metadata.version}</span>
                        </div>
                        {descriptor.metadata.tags.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 min-w-[80px]">标签：</span>
                            <div className="flex flex-wrap gap-1">
                              {descriptor.metadata.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default ToolCallDetailDialog
