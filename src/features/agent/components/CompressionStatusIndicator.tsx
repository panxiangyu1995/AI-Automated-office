/**
 * CompressionStatusIndicator - 压缩状态指示器组件
 * Story 4.12 - 上下文自动压缩
 *
 * 显示 token 使用情况和压缩状态
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构
 */

import { useMemo } from 'react'
import { AlertCircle, Archive, CheckCircle2, Loader2, Minus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useCompressionConfig,
  useThresholdStatus,
  useCompressionStatus,
  useSessionCompressionState,
  useCompressionHistory,
  type CompressionRecord,
} from '../hooks/useContextCompression'
import type { Message } from '../../message/runtime/messageModel'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export interface CompressionStatusIndicatorProps {
  sessionId: string
  messages: Message[]
  onCompress?: () => void
  compact?: boolean
  showDetails?: boolean
}

// ==================== Helper Functions ====================

function getStatusColor(
  status: 'normal' | 'warning' | 'critical' | 'exceeded'
): string {
  switch (status) {
    case 'exceeded':
      return 'text-red-500'
    case 'critical':
      return 'text-orange-500'
    case 'warning':
      return 'text-yellow-500'
    default:
      return 'text-green-500'
  }
}

function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

// ==================== Components ====================

/**
 * 压缩状态指示器
 */
export function CompressionStatusIndicator({
  sessionId,
  messages,
  onCompress,
  compact = false,
  showDetails = true,
}: CompressionStatusIndicatorProps) {
  const config = useCompressionConfig()
  const thresholdStatus = useThresholdStatus(sessionId)
  const { isCompressing, currentSessionId } = useCompressionStatus()
  const sessionState = useSessionCompressionState(sessionId)

  // 计算 token 统计
  const tokenStats = useMemo(() => {
    let userTokens = 0
    let assistantTokens = 0
    let systemTokens = 0

    for (const message of messages) {
      const text = message.parts
        .filter(p => p.type === 'text')
        .map(p => (p as { content: string }).content)
        .join('\n')
      
      const tokens = Math.ceil(text.length / 4)
      
      switch (message.role) {
        case 'user':
          userTokens += tokens
          break
        case 'assistant':
          assistantTokens += tokens
          break
        case 'system':
          systemTokens += tokens
          break
      }
    }

    return {
      total: userTokens + assistantTokens + systemTokens,
      user: userTokens,
      assistant: assistantTokens,
      system: systemTokens,
    }
  }, [messages])

  const percentage = thresholdStatus?.percentage ?? tokenStats.total / config.tokenThreshold
  const status = thresholdStatus?.status ?? 'normal'
  const isActiveSession = currentSessionId === sessionId && isCompressing

  // 状态图标
  const StatusIcon = useMemo(() => {
    if (isActiveSession) return Loader2
    switch (status) {
      case 'exceeded':
        return AlertCircle
      case 'critical':
        return AlertTriangle
      case 'warning':
        return Minus
      default:
        return CheckCircle2
    }
  }, [status, isActiveSession])

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50',
              isActiveSession && 'animate-pulse'
            )}>
              <StatusIcon
                className={cn(
                  'h-3.5 w-3.5',
                  getStatusColor(status),
                  isActiveSession && 'animate-spin'
                )}
              />
              <span className="text-xs font-medium">
                {formatTokenCount(thresholdStatus?.currentTokens ?? tokenStats.total)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs space-y-1">
              <div>Token 使用: {thresholdStatus?.currentTokens ?? tokenStats.total} / {config.tokenThreshold}</div>
              <div>占比: {(percentage * 100).toFixed(1)}%</div>
              {sessionState?.compressionCount ? (
                <div>已压缩: {sessionState.compressionCount} 次</div>
              ) : null}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-3">
      {/* 主要状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              'h-4 w-4',
              getStatusColor(status),
              isActiveSession && 'animate-spin'
            )}
          />
          <span className="text-sm font-medium">Token 使用</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatTokenCount(thresholdStatus?.currentTokens ?? tokenStats.total)} / {formatTokenCount(config.tokenThreshold)}
          </span>
          {status === 'exceeded' && onCompress && !isCompressing && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCompress}
              className="h-7 text-xs"
            >
              <Archive className="h-3 w-3 mr-1" />
              压缩
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="space-y-1.5">
        <Progress
          value={Math.min(percentage * 100, 100)}
          className={cn('h-2', percentage >= 1 && '[&>div]:bg-red-500')}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span
            className={cn(
              percentage >= config.warningThreshold && 'text-yellow-500',
              percentage >= config.criticalThreshold && 'text-orange-500',
              percentage >= 1 && 'text-red-500'
            )}
          >
            {(percentage * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">用户</span>
            <span className="font-medium">{formatTokenCount(tokenStats.user)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">助手</span>
            <span className="font-medium">{formatTokenCount(tokenStats.assistant)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">系统</span>
            <span className="font-medium">{formatTokenCount(tokenStats.system)}</span>
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {status !== 'normal' && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-xs',
          status === 'exceeded' && 'bg-red-500/10 text-red-600',
          status === 'critical' && 'bg-orange-500/10 text-orange-600',
          status === 'warning' && 'bg-yellow-500/10 text-yellow-600',
        )}>
          <AlertCircle className="h-3.5 w-3.5" />
          {status === 'exceeded' && 'Token 阈值已超限，建议压缩上下文'}
          {status === 'critical' && '接近 Token 阈值，请考虑压缩'}
          {status === 'warning' && 'Token 使用量较高'}
        </div>
      )}
    </div>
  )
}

// ==================== CompressionHistoryItem ====================

export interface CompressionHistoryItemProps {
  record: CompressionRecord
}

export function CompressionHistoryItem({ record }: CompressionHistoryItemProps) {
  const statusColor = useMemo(() => {
    switch (record.status) {
      case 'completed':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      case 'compressing':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }, [record.status])

  const compressionRatio = record.beforeTokenCount > 0
    ? ((1 - record.afterTokenCount / record.beforeTokenCount) * 100).toFixed(1)
    : '0'

  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
      <Archive className={cn('h-4 w-4 mt-0.5', statusColor)} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {record.trigger === 'manual' ? '手动压缩' : record.trigger === 'scheduled' ? '定时压缩' : '自动压缩'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(record.timestamp).toLocaleString('zh-CN')}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {record.beforeMessageCount} → {record.afterMessageCount} 消息
          </span>
          <span>
            {formatTokenCount(record.beforeTokenCount)} → {formatTokenCount(record.afterTokenCount)} tokens
          </span>
          <span className="text-green-600">
            -{compressionRatio}%
          </span>
        </div>

        {record.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {record.summary}
          </p>
        )}

        {record.status === 'failed' && record.error && (
          <p className="text-xs text-red-500">
            错误: {record.error}
          </p>
        )}
      </div>
    </div>
  )
}

// ==================== CompressionHistoryList ====================

export interface CompressionHistoryListProps {
  sessionId?: string
  maxItems?: number
}

export function CompressionHistoryList({
  sessionId,
  maxItems = 10,
}: CompressionHistoryListProps) {
  const history = useCompressionHistory(sessionId).slice(-maxItems).reverse()

  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        暂无压缩历史
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map((record) => (
        <CompressionHistoryItem key={record.id} record={record} />
      ))}
    </div>
  )
}

// ==================== Export ====================

export default CompressionStatusIndicator
