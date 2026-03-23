/**
 * ToolCallStatusDisplay - 工具调用状态展示组件
 * Story 5.2 - 工具调用状态展示
 *
 * 显示工具调用的实时状态卡片，在 Agent 对话流中渲染
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 message model 和 tool executor
 * - Brand Color: #1E3A5F
 */

import { useState, useMemo, useCallback } from 'react'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Loader2,
  Play,
  AlertCircle,
  XCircle,
  Zap,
  Terminal,
  MoreHorizontal,
  RotateCcw,
  ExternalLink,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type {
  ToolCallPart,
  ToolResultPart,
} from '../../message/runtime/messageModel'
import type {
  ToolCallLifecycleEvent,
  ToolCallEventType,
} from '../tools/toolExecutor'
import type { ToolDescriptor } from '../tools/toolDescriptor'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

const STATUS_CONFIG: Record<ToolCallPart['status'], {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  pending: {
    icon: Clock,
    label: '等待中',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  running: {
    icon: Loader2,
    label: '执行中',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  completed: {
    icon: CheckCircle,
    label: '已完成',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  failed: {
    icon: XCircle,
    label: '失败',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  cancelled: {
    icon: AlertCircle,
    label: '已取消',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
}

const EVENT_TYPE_LABELS: Record<ToolCallEventType, string> = {
  tool_call_start: '开始',
  tool_call_validation: '验证中',
  tool_call_context_inject: '注入上下文',
  tool_call_execute: '执行中',
  tool_call_success: '成功',
  tool_call_error: '错误',
  tool_call_complete: '完成',
}

// ==================== Types ====================

export interface ToolCallStatusDisplayProps {
  /** 工具调用部分 */
  toolCall: ToolCallPart
  /** 工具结果（如果已完成） */
  result?: ToolResultPart
  /** 工具描述符 */
  descriptor?: ToolDescriptor
  /** 生命周期事件 */
  events?: ToolCallLifecycleEvent[]
  /** 是否默认展开 */
  defaultExpanded?: boolean
  /** 是否显示时间戳 */
  showTimestamp?: boolean
  /** 是否显示执行时间 */
  showDuration?: boolean
  /** 是否紧凑模式 */
  compact?: boolean
  /** 重试回调 */
  onRetry?: (toolCall: ToolCallPart) => void
  /** 取消回调 */
  onCancel?: (toolCall: ToolCallPart) => void
  /** 查看详情回调 */
  onViewDetails?: (toolCall: ToolCallPart) => void
  /** 复制结果回调 */
  onCopyResult?: (result: unknown) => void
}

export interface ToolCallStatusStreamProps {
  /** 活跃的工具调用列表 */
  toolCalls: ToolCallPart[]
  /** 结果映射 */
  results: Record<string, ToolResultPart>
  /** 事件流 */
  events: ToolCallLifecycleEvent[]
  /** 工具描述符映射 */
  descriptors: Record<string, ToolDescriptor>
  /** 最大显示数量 */
  maxVisible?: number
  /** 重试回调 */
  onRetry?: (toolCall: ToolCallPart) => void
  /** 取消回调 */
  onCancel?: (toolCall: ToolCallPart) => void
  /** 查看详情回调 */
  onViewDetails?: (toolCall: ToolCallPart) => void
}

// ==================== Helper Functions ====================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatParameterValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value.length > 50 ? value.slice(0, 50) + '...' : value
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value, null, 2)
      return str.length > 200 ? str.slice(0, 200) + '...' : str
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

function isAnimatedStatus(status: ToolCallPart['status']): boolean {
  return status === 'running' || status === 'pending'
}

// ==================== Sub Components ====================

interface ExecutionProgressProps {
  events: ToolCallLifecycleEvent[]
}

function ExecutionProgress({ events }: ExecutionProgressProps): React.ReactNode {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
        <Play className="h-3.5 w-3.5" />
        <span>执行进度</span>
      </div>
      <div className="space-y-1.5">
        {events.slice(-3).map((event, index) => (
          <div
            key={`${event.type}-${index}`}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                event.type === 'tool_call_error' ? 'bg-red-400' : 'bg-blue-400'
              )}
            />
            <span className="text-slate-600">
              {EVENT_TYPE_LABELS[event.type] || event.type}
            </span>
            <span className="text-slate-400">
              {formatTimestamp(event.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ExecutionResultProps {
  result: unknown
  onCopy: () => void
  copied: boolean
}

function ExecutionResult({ result, onCopy, copied }: ExecutionResultProps): React.ReactNode {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span>结果</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3 mr-1" />
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <ScrollArea className="max-h-[200px]">
        <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
          <code>{formatParameterValue(result)}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

// ==================== Components ====================

/**
 * 工具调用状态显示组件
 */
export function ToolCallStatusDisplay({
  toolCall,
  result,
  descriptor,
  events = [],
  defaultExpanded = false,
  showTimestamp = true,
  showDuration = true,
  compact = false,
  onRetry,
  onCancel,
  onViewDetails,
  onCopyResult,
}: ToolCallStatusDisplayProps): React.ReactNode {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)

  const statusConfig = STATUS_CONFIG[toolCall.status]
  const StatusIcon = statusConfig.icon
  const isAnimated = isAnimatedStatus(toolCall.status)

  // 计算执行时间
  const duration = useMemo(() => {
    if (toolCall.startedAt && toolCall.completedAt) {
      return toolCall.completedAt - toolCall.startedAt
    }
    if (toolCall.startedAt && toolCall.status === 'running') {
      return Date.now() - toolCall.startedAt
    }
    if (result?.duration) {
      return result.duration
    }
    return null
  }, [toolCall, result])

  // 复制结果
  const handleCopyResult = useCallback(() => {
    if (result?.result && onCopyResult) {
      onCopyResult(result.result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else if (result?.result) {
      navigator.clipboard.writeText(JSON.stringify(result.result, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [result, onCopyResult])

  // 重试
  const handleRetry = useCallback(() => {
    onRetry?.(toolCall)
  }, [toolCall, onRetry])

  // 取消
  const handleCancel = useCallback(() => {
    onCancel?.(toolCall)
  }, [toolCall, onCancel])

  // 查看详情
  const handleViewDetails = useCallback(() => {
    onViewDetails?.(toolCall)
  }, [toolCall, onViewDetails])

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-all',
        statusConfig.borderColor,
        compact ? 'text-sm' : ''
      )}
      style={{ borderLeftWidth: '3px', borderLeftColor: BRAND_COLOR }}
    >
      {/* Header */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2',
            statusConfig.bgColor
          )}
        >
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 text-left">
              <div className="flex items-center gap-2">
                <StatusIcon
                  className={cn(
                    'h-4 w-4',
                    statusConfig.color,
                    isAnimated ? 'animate-spin' : ''
                  )}
                />
                <span className={cn('font-medium', statusConfig.color)}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {toolCall.toolName}
                </span>
                {descriptor?.metadata?.tags?.includes('sensitive') && (
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                    敏感
                  </Badge>
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            {/* 时间信息 */}
            {showTimestamp && toolCall.startedAt && (
              <span className="text-xs text-slate-400">
                {formatTimestamp(toolCall.startedAt)}
              </span>
            )}
            {showDuration && duration && (
              <Badge variant="secondary" className="text-xs">
                {formatDuration(duration)}
              </Badge>
            )}

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {toolCall.status === 'failed' && onRetry && (
                  <DropdownMenuItem onClick={handleRetry}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重试
                  </DropdownMenuItem>
                )}
                {(toolCall.status === 'pending' || toolCall.status === 'running') && onCancel && (
                  <DropdownMenuItem onClick={handleCancel}>
                    <XCircle className="h-4 w-4 mr-2" />
                    取消
                  </DropdownMenuItem>
                )}
                {result?.result !== undefined && result.result !== null && (
                  <DropdownMenuItem onClick={handleCopyResult}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? '已复制' : '复制结果'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleViewDetails}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  查看详情
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-3 space-y-3 bg-white">
            {/* 参数 */}
            {toolCall.parameters.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>参数</span>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1.5">
                    {toolCall.parameters.map((param, index) => (
                      <div
                        key={param.name || index}
                        className="flex items-start gap-2 p-2 rounded bg-slate-50"
                      >
                        <span className="font-mono text-xs font-medium text-slate-600 min-w-[80px]">
                          {param.name}:
                        </span>
                        <pre className="text-xs text-slate-500 flex-1 overflow-x-auto">
                          <code>{formatParameterValue(param.value)}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* 执行进度（运行中） */}
            {toolCall.status === 'running' && events.length > 0 ? (
              <ExecutionProgress events={events} />
            ) : null}

            {/* 错误信息 */}
            {toolCall.status === 'failed' && result?.errorMessage ? (
              <div className="p-2 rounded bg-red-50 border border-red-200">
                <div className="flex items-center gap-1.5 text-xs text-red-600 mb-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">错误</span>
                </div>
                <p className="text-xs text-red-600">{result.errorMessage}</p>
              </div>
            ) : null}

            {/* 执行结果 */}
            {result?.result !== undefined && result.result !== null && toolCall.status === 'completed' ? (
              <ExecutionResult result={result.result} onCopy={handleCopyResult} copied={copied} />
            ) : null}

            {/* 工具描述 */}
            {descriptor && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t">
                <Info className="h-3.5 w-3.5" />
                <span>{descriptor.description}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * 工具调用状态流组件
 * 显示多个工具调用的实时状态
 */
export function ToolCallStatusStream({
  toolCalls,
  results,
  events,
  descriptors,
  maxVisible = 5,
  onRetry,
  onCancel,
  onViewDetails,
}: ToolCallStatusStreamProps): React.ReactNode {
  // 按状态排序：运行中 > 等待中 > 失败 > 已完成
  const sortedToolCalls = useMemo(() => {
    const order: Record<ToolCallPart['status'], number> = {
      running: 0,
      pending: 1,
      failed: 2,
      completed: 3,
      cancelled: 4,
    }
    return [...toolCalls].sort((a, b) => order[a.status] - order[b.status])
  }, [toolCalls])

  // 过滤相关事件
  const getEventsForToolCall = useCallback(
    (executionId: string): ToolCallLifecycleEvent[] => {
      return events.filter((e) => e.executionId === executionId)
    },
    [events]
  )

  // 限制显示数量
  const visibleToolCalls = sortedToolCalls.slice(0, maxVisible)
  const hiddenCount = sortedToolCalls.length - maxVisible

  if (toolCalls.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {visibleToolCalls.map((toolCall) => (
        <ToolCallStatusDisplay
          key={toolCall.id}
          toolCall={toolCall}
          result={results[toolCall.id]}
          descriptor={descriptors[toolCall.toolId]}
          events={getEventsForToolCall(toolCall.id)}
          onRetry={onRetry}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
        />
      ))}
      {hiddenCount > 0 && (
        <div className="text-xs text-center text-slate-500 py-1">
          还有 {hiddenCount} 个工具调用...
        </div>
      )}
    </div>
  )
}

/**
 * 简化的工具调用卡片（用于消息流中）
 */
export function ToolCallCard({
  toolCall,
  result,
  defaultExpanded = false,
}: {
  toolCall: ToolCallPart
  result?: ToolResultPart
  defaultExpanded?: boolean
}): React.ReactNode {
  return (
    <ToolCallStatusDisplay
      toolCall={toolCall}
      result={result}
      defaultExpanded={defaultExpanded}
      compact
      showTimestamp={false}
      showDuration
    />
  )
}

export default ToolCallStatusDisplay
