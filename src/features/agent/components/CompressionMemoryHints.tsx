/**
 * CompressionMemoryHints - 压缩通知与记忆提示组件
 * Story 4.14 - 压缩通知与记忆提示
 *
 * 显示压缩通知和记忆的关键事实
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 compression hook
 * - Brand Color: #1E3A5F
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Archive,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Info,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  useCompressionHistory,
  useCompressionConfig,
  type CompressionRecord,
} from '../hooks/useContextCompression'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

// ==================== Types ====================

export interface CompressionNotificationProps {
  sessionId: string
  onDismiss?: () => void
  onRestore?: () => void
}

export interface MemoryHint {
  id: string
  type: 'fact' | 'preference' | 'context' | 'action'
  content: string
  importance: 'high' | 'medium' | 'low'
  source: 'user' | 'assistant' | 'system'
  timestamp: number
}

export interface MemoryHintsProps {
  sessionId: string
  hints?: MemoryHint[]
  maxVisible?: number
  showControls?: boolean
  onRefresh?: () => void
  onHide?: () => void
}

export interface CompressionSummaryProps {
  record: CompressionRecord
  expanded?: boolean
  onToggle?: () => void
}

// ==================== Helper Functions ====================

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

function getImportanceColor(importance: MemoryHint['importance']): string {
  switch (importance) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    default:
      return 'text-green-500'
  }
}

function getImportanceBgColor(importance: MemoryHint['importance']): string {
  switch (importance) {
    case 'high':
      return 'bg-red-500/10 border-red-500/20'
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/20'
    default:
      return 'bg-green-500/10 border-green-500/20'
  }
}

function getHintTypeIcon(type: MemoryHint['type']): React.ElementType {
  switch (type) {
    case 'fact':
      return Info
    case 'preference':
      return Lightbulb
    case 'context':
      return MessageSquare
    case 'action':
      return Sparkles
    default:
      return Info
  }
}

function getHintTypeLabel(type: MemoryHint['type']): string {
  switch (type) {
    case 'fact':
      return '事实'
    case 'preference':
      return '偏好'
    case 'context':
      return '上下文'
    case 'action':
      return '操作'
    default:
      return '其他'
  }
}

// ==================== Compression Notification ====================

/**
 * 压缩通知组件
 * 在会话流中显示压缩通知
 */
export function CompressionNotification({
  sessionId,
  onDismiss,
}: CompressionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const history = useCompressionHistory(sessionId)
  const config = useCompressionConfig()

  // 获取最近的压缩记录
  const latestCompression = useMemo(() => {
    if (history.length === 0) return null
    return history[history.length - 1]
  }, [history])

  // 检查是否是最近的压缩（5分钟内）
  const isRecent = useMemo(() => {
    if (!latestCompression) return false
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return latestCompression.timestamp > fiveMinutesAgo
  }, [latestCompression])

  // 自动隐藏非最近的压缩
  useEffect(() => {
    if (!isRecent && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 30000) // 30秒后自动隐藏
      return () => clearTimeout(timer)
    }
  }, [isRecent, isVisible])

  if (!latestCompression || !isVisible) return null

  const compressionRatio = latestCompression.beforeTokenCount > 0
    ? ((1 - latestCompression.afterTokenCount / latestCompression.beforeTokenCount) * 100).toFixed(1)
    : '0'

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    onDismiss?.()
  }, [onDismiss])

  return (
    <div
      className={cn(
        'rounded-lg border bg-muted/50 p-3 transition-all duration-300',
        isRecent && 'border-primary/20 bg-primary/5'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Archive className="h-4 w-4" style={{ color: BRAND_COLOR }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">上下文已压缩</span>
                {isRecent && (
                  <Badge variant="secondary" className="text-xs">
                    新
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatTimeAgo(latestCompression.timestamp)}</span>
                <span className="text-green-600">
                  减少 {compressionRatio}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="mt-3 space-y-3 text-sm">
            {/* 压缩统计 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">消息数</div>
                  <div className="font-medium">
                    {latestCompression.beforeMessageCount} → {latestCompression.afterMessageCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <Archive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Token数</div>
                  <div className="font-medium">
                    {latestCompression.beforeTokenCount} → {latestCompression.afterTokenCount}
                  </div>
                </div>
              </div>
            </div>

            {/* 保留的关键内容 */}
            {latestCompression.retainedFacts && latestCompression.retainedFacts.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Brain className="h-3.5 w-3.5" />
                  <span>保留的关键信息</span>
                </div>
                <ScrollArea className="max-h-[120px]">
                  <div className="space-y-1">
                    {latestCompression.retainedFacts.map((fact, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-md bg-background/50"
                      >
                        <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-yellow-500" />
                        <span className="text-xs">{fact}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* 压缩摘要 */}
            {latestCompression.summary && (
              <div className="p-2 rounded-md bg-background/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Info className="h-3.5 w-3.5" />
                  <span>压缩摘要</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestCompression.summary}
                </p>
              </div>
            )}

            {/* 配置信息 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>压缩策略: {config.compressionStrategy}</span>
              <span>保留最近 {config.recentMessagesToKeep} 条消息</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// ==================== Memory Hints ====================

/**
 * 记忆提示组件
 * 在输入区域附近显示记忆的关键事实
 */
export function MemoryHints({
  sessionId,
  hints: externalHints,
  maxVisible = 5,
  showControls = true,
  onRefresh,
  onHide,
}: MemoryHintsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const history = useCompressionHistory(sessionId)

  // 从压缩历史中提取记忆提示
  const extractedHints = useMemo((): MemoryHint[] => {
    if (externalHints) return externalHints

    const hints: MemoryHint[] = []
    
    // 从最近的压缩记录中提取保留的事实
    for (const record of history) {
      if (record.retainedFacts) {
        for (const fact of record.retainedFacts) {
          hints.push({
            id: `hint-${record.id}-${hints.length}`,
            type: 'fact',
            content: fact,
            importance: 'medium',
            source: 'system',
            timestamp: record.timestamp,
          })
        }
      }
    }

    return hints.slice(-maxVisible)
  }, [externalHints, history, maxVisible])

  // 按重要性排序
  const sortedHints = useMemo(() => {
    return [...extractedHints].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.importance] - order[b.importance]
    })
  }, [extractedHints])

  // 显示的数量
  const visibleHints = isExpanded ? sortedHints : sortedHints.slice(0, 3)
  const hiddenCount = sortedHints.length - visibleHints.length

  const handleHide = useCallback(() => {
    setIsVisible(false)
    onHide?.()
  }, [onHide])

  if (!isVisible || sortedHints.length === 0) return null

  return (
    <div className="rounded-lg border bg-muted/30 p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <span className="text-xs font-medium">记忆提示</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {sortedHints.length}
          </Badge>
        </div>
        {showControls && (
          <div className="flex items-center gap-1">
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    刷新记忆
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleHide}
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className={cn('max-h-[150px]', isExpanded && 'max-h-[300px]')}>
        <div className="space-y-1.5">
          {visibleHints.map((hint) => {
            const Icon = getHintTypeIcon(hint.type)
            return (
              <div
                key={hint.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-md border',
                  getImportanceBgColor(hint.importance)
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 mt-0.5', getImportanceColor(hint.importance))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {getHintTypeLabel(hint.type)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(hint.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2">{hint.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* 展开更多 */}
      {hiddenCount > 0 && !isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1.5 h-7 text-xs"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronDown className="h-3 w-3 mr-1" />
          显示更多 ({hiddenCount})
        </Button>
      )}

      {isExpanded && sortedHints.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1.5 h-7 text-xs"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronUp className="h-3 w-3 mr-1" />
          收起
        </Button>
      )}
    </div>
  )
}

// ==================== Compression Summary ====================

/**
 * 压缩摘要组件
 * 显示压缩的详细摘要
 */
export function CompressionSummary({
  record,
  expanded = false,
}: CompressionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  const compressionRatio = record.beforeTokenCount > 0
    ? ((1 - record.afterTokenCount / record.beforeTokenCount) * 100).toFixed(1)
    : '0'

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Archive className="h-5 w-5" style={{ color: BRAND_COLOR }} />
          </div>
          <div>
            <div className="font-medium">压缩摘要</div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(record.timestamp)}
              </span>
              <span className="text-green-600 font-medium">
                -{compressionRatio}%
              </span>
            </div>
          </div>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="mt-2 p-3 rounded-lg bg-muted/20 space-y-3">
          {/* 统计数据 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-md bg-background/50">
              <div className="text-lg font-bold" style={{ color: BRAND_COLOR }}>
                {record.beforeMessageCount}
              </div>
              <div className="text-xs text-muted-foreground">压缩前消息</div>
            </div>
            <div className="p-2 rounded-md bg-background/50">
              <div className="text-lg font-bold" style={{ color: BRAND_COLOR }}>
                {record.afterMessageCount}
              </div>
              <div className="text-xs text-muted-foreground">压缩后消息</div>
            </div>
            <div className="p-2 rounded-md bg-background/50">
              <div className="text-lg font-bold text-red-500">
                {record.beforeTokenCount}
              </div>
              <div className="text-xs text-muted-foreground">压缩前 Token</div>
            </div>
            <div className="p-2 rounded-md bg-background/50">
              <div className="text-lg font-bold text-green-500">
                {record.afterTokenCount}
              </div>
              <div className="text-xs text-muted-foreground">压缩后 Token</div>
            </div>
          </div>

          {/* 保留的事实 */}
          {record.retainedFacts && record.retainedFacts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Brain className="h-4 w-4" style={{ color: BRAND_COLOR }} />
                保留的关键信息
              </div>
              <div className="space-y-1">
                {record.retainedFacts.map((fact, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-md bg-background/50"
                  >
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm">{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 摘要 */}
          {record.summary && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                压缩摘要
              </div>
              <p className="text-sm text-muted-foreground p-2 rounded-md bg-background/50">
                {record.summary}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ==================== Export ====================

export default CompressionNotification
