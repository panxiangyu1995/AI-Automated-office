/**
 * CompressionHistory Component
 * 压缩历史记录查看组件
 */

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Zap,
  Shield,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { CompressionLayer, TriggerType } from '@/features/agent/services/compact'

interface CompressionRecord {
  id: string
  timestamp: Date
  layer: CompressionLayer
  triggerType: TriggerType
  beforeTokens: number
  afterTokens: number
  compressionRatio: number
  duration: number
  success: boolean
  error?: string
}

interface CompressionHistoryProps {
  records: CompressionRecord[]
  maxDisplay?: number
  className?: string
  onRecover?: (recordId: string) => void
  onClear?: () => void
}

const LAYER_LABELS: Record<CompressionLayer, string> = {
  business_memory: '业务记忆',
  micro: '微压缩',
  business_full: '全量压缩',
  reactive: '响应式',
}

const LAYER_ICONS: Record<CompressionLayer, React.ReactNode> = {
  business_memory: <Layers className="h-3 w-3" />,
  micro: <Zap className="h-3 w-3" />,
  business_full: <Shield className="h-3 w-3" />,
  reactive: <Zap className="h-3 w-3" />,
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  threshold: '阈值触发',
  department_change: '部门切换',
  approval_change: '审批变更',
  time_inactive: '超时触发',
  manual: '手动触发',
  error_recovery: '错误恢复',
}

export function CompressionHistory({
  records,
  maxDisplay = 10,
  className,
  onRecover,
  onClear,
}: CompressionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const displayedRecords = isExpanded ? records : records.slice(0, maxDisplay)
  const hasMore = records.length > maxDisplay

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getCompressionRatioColor = (ratio: number) => {
    if (ratio >= 70) return 'text-green-500'
    if (ratio >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (records.length === 0) {
    return (
      <div className={cn('text-center py-6 text-muted-foreground', className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无压缩记录</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">压缩历史</span>
          <Badge variant="secondary" className="text-xs">
            {records.length} 次
          </Badge>
        </div>
        
        {onClear && records.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-auto py-0.5 px-1 text-xs"
          >
            清空
          </Button>
        )}
      </div>

      {/* 记录列表 */}
      <ScrollArea className="h-auto max-h-64">
        <div className="space-y-2 pr-2">
          {displayedRecords.map((record) => (
            <div
              key={record.id}
              className={cn(
                'flex items-start gap-2 p-2 rounded-md border text-sm',
                record.success 
                  ? 'bg-card border-border' 
                  : 'bg-destructive/5 border-destructive/20'
              )}
            >
              {/* 层类型图标 */}
              <div className={cn(
                'flex-shrink-0 p-1 rounded',
                record.layer === 'business_full' ? 'bg-blue-500/10 text-blue-500' :
                record.layer === 'business_memory' ? 'bg-purple-500/10 text-purple-500' :
                'bg-yellow-500/10 text-yellow-500'
              )}>
                {LAYER_ICONS[record.layer]}
              </div>
              
              {/* 信息 */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {LAYER_LABELS[record.layer]}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {TRIGGER_LABELS[record.triggerType]}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatTime(record.timestamp)}</span>
                  {record.success ? (
                    <>
                      <span>{record.beforeTokens.toLocaleString()} → {record.afterTokens.toLocaleString()}</span>
                      <span className={getCompressionRatioColor(record.compressionRatio)}>
                        -{record.compressionRatio.toFixed(0)}%
                      </span>
                      <span>{formatDuration(record.duration)}</span>
                    </>
                  ) : (
                    <span className="text-destructive">{record.error || '失败'}</span>
                  )}
                </div>
              </div>

              {/* 恢复按钮 */}
              {onRecover && record.success && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRecover(record.id)}
                  className="h-auto py-0.5 px-1 text-xs flex-shrink-0"
                  title="查看详情"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 展开/收起按钮 */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 w-full h-auto py-1 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              查看更多 ({records.length - maxDisplay} 条)
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default CompressionHistory
