/**
 * TokenUsageIndicator - Token 占用指示器组件
 * Story 4.13 - Token占用指示器
 *
 * 显示会话 Token 使用情况和阈值状态
 * 提供详细的 Token 计数和压缩状态关联
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 compression hook
 * - Brand Color: var(--ao-button.background)
 */

import { useState, useMemo, useCallback } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  CheckCircle2,
  Hash,
  MessageSquare,
  User,
  Bot,
  Settings,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  useCompressionConfig,
  useThresholdStatus,
  type ThresholdStatus,
} from '../hooks/useContextCompression'
import type { Message } from '../../message/runtime/messageModel'
import { cn } from '@/lib/utils'

// ==================== Constants ====================

const BRAND_COLOR = 'var(--ao-button.background)'

// ==================== Types ====================

export interface TokenUsageIndicatorProps {
  sessionId: string
  messages: Message[]
  compact?: boolean
  showPerMessage?: boolean
  showTrend?: boolean
  onOpenSettings?: () => void
}

export interface TokenBreakdown {
  total: number
  user: number
  assistant: number
  system: number
  tools: number
  perMessage: MessageTokenInfo[]
}

export interface MessageTokenInfo {
  messageId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  tokenCount: number
  percentage: number
  timestamp: number
  preview?: string
}

export interface TokenUsageTrend {
  timestamps: number[]
  values: number[]
  current: number
  average: number
  peak: number
}

// ==================== Helper Functions ====================

/**
 * 估算文本的 token 数量
 * 中文约 1.5 字符/token，英文约 4 字符/token
 */
function estimateTokens(text: string): number {
  if (!text) return 0
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
  const chineseTokens = chineseChars.length / 1.5
  const nonChineseTokens = (text.length - chineseChars.length) / 4
  return Math.ceil(chineseTokens + nonChineseTokens)
}

/**
 * 格式化 token 数量
 */
function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: ThresholdStatus): string {
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

/**
 * 获取状态背景色
 */
function getStatusBgColor(status: ThresholdStatus): string {
  switch (status) {
    case 'exceeded':
      return 'bg-red-500/10 border-red-500/20'
    case 'critical':
      return 'bg-orange-500/10 border-orange-500/20'
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20'
    default:
      return 'bg-green-500/10 border-green-500/20'
  }
}

/**
 * 获取进度条颜色类
 */
function getProgressColorClass(status: ThresholdStatus): string {
  switch (status) {
    case 'exceeded':
      return '[&>div]:bg-red-500'
    case 'critical':
      return '[&>div]:bg-orange-500'
    case 'warning':
      return '[&>div]:bg-yellow-500'
    default:
      return '[&>div]:bg-green-500'
  }
}

// ==================== Token Calculation Hook ====================

function useTokenBreakdown(messages: Message[]): TokenBreakdown {
  return useMemo(() => {
    let userTokens = 0
    let assistantTokens = 0
    let systemTokens = 0
    let toolsTokens = 0
    const perMessage: MessageTokenInfo[] = []
    const totalTokens = userTokens + assistantTokens + systemTokens + toolsTokens

    // 计算每条消息的 token
    for (const message of messages) {
      let messageTokens = 0
      let textContent = ''

      for (const part of message.parts) {
        if (part.type === 'text') {
          const text = (part as { content: string }).content
          textContent += text
          messageTokens += estimateTokens(text)
        } else if (part.type === 'tool_call') {
          // 工具调用通常占用额外 token
          const toolPart = part as { name?: string; arguments?: string }
          const toolText = `${toolPart.name || ''} ${toolPart.arguments || ''}`
          messageTokens += estimateTokens(toolText) + 10 // 额外开销
          toolsTokens += estimateTokens(toolText) + 10
        } else if (part.type === 'tool_result') {
          const resultPart = part as { content?: string }
          messageTokens += estimateTokens(resultPart.content || '')
          toolsTokens += estimateTokens(resultPart.content || '')
        }
      }

      switch (message.role) {
        case 'user':
          userTokens += messageTokens
          break
        case 'assistant':
          assistantTokens += messageTokens
          break
        case 'system':
          systemTokens += messageTokens
          break
      }

      perMessage.push({
        messageId: message.id,
        role: message.role,
        tokenCount: messageTokens,
        percentage: totalTokens > 0 ? (messageTokens / totalTokens) * 100 : 0,
        timestamp: message.createdAt,
        preview: textContent.slice(0, 100),
      })
    }

    return {
      total: userTokens + assistantTokens + systemTokens + toolsTokens,
      user: userTokens,
      assistant: assistantTokens,
      system: systemTokens,
      tools: toolsTokens,
      perMessage,
    }
  }, [messages])
}

// ==================== Sub Components ====================

interface StatusBadgeProps {
  status: ThresholdStatus
  isCompact?: boolean
}

function StatusBadgeComponent({ status, isCompact }: StatusBadgeProps) {
  const config = useMemo(() => {
    switch (status) {
      case 'exceeded':
        return {
          icon: AlertCircle,
          label: '超限',
          variant: 'destructive' as const,
        }
      case 'critical':
        return {
          icon: AlertTriangle,
          label: '临界',
          variant: 'secondary' as const,
        }
      case 'warning':
        return {
          icon: Minus,
          label: '警告',
          variant: 'secondary' as const,
        }
      default:
        return {
          icon: CheckCircle2,
          label: '正常',
          variant: 'default' as const,
        }
    }
  }, [status])

  const Icon = config.icon

  if (isCompact) {
    return <Icon className={cn('h-3.5 w-3.5', getStatusColor(status))} />
  }

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

interface TokenStatItemProps {
  icon: React.ElementType
  label: string
  value: number
  total: number
  color?: string
}

function TokenStatItem({ icon: Icon, label, value, total, color }: TokenStatItemProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color || 'text-muted-foreground')} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatTokenCount(value)}</span>
        <span className="text-xs text-muted-foreground">
          ({percentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

interface MessageTokenRowProps {
  info: MessageTokenInfo
  index: number
  total: number
}

function MessageTokenRow({ info, index, total }: MessageTokenRowProps) {
  const roleConfig = useMemo(() => {
    switch (info.role) {
      case 'user':
        return { icon: User, color: 'text-blue-500', label: '用户' }
      case 'assistant':
        return { icon: Bot, color: 'text-purple-500', label: '助手' }
      case 'tool':
        return { icon: Settings, color: 'text-orange-500', label: '工具' }
      default:
        return { icon: MessageSquare, color: 'text-gray-500', label: '系统' }
    }
  }, [info.role])

  const Icon = roleConfig.icon
  const percentage = total > 0 ? (info.tokenCount / total) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 min-w-[60px]">
        <Icon className={cn('h-3.5 w-3.5', roleConfig.color)} />
        <span className="text-xs text-muted-foreground">#{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {info.preview || '(无内容)'}
          </span>
          <div className="flex items-center gap-2">
            <Progress
              value={Math.min(percentage * 5, 100)}
              className="h-1.5 w-16"
            />
            <span className="text-xs font-medium w-12 text-right">
              {formatTokenCount(info.tokenCount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Detail Dialog ====================

interface TokenDetailDialogProps {
  breakdown: TokenBreakdown
  thresholdStatus: {
    status: ThresholdStatus
    currentTokens: number
    threshold: number
    percentage: number
  } | null
  config: ReturnType<typeof useCompressionConfig>
  percentage: number
}

function TokenDetailDialog({
  breakdown,
  thresholdStatus,
  config,
  percentage,
}: TokenDetailDialogProps) {
  const status = thresholdStatus?.status ?? 'normal'

  const handleExport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: breakdown.total,
        threshold: config.tokenThreshold,
        percentage: (percentage * 100).toFixed(2) + '%',
        status,
      },
      breakdown: {
        user: breakdown.user,
        assistant: breakdown.assistant,
        system: breakdown.system,
        tools: breakdown.tools,
      },
      messages: breakdown.perMessage.map((m, i) => ({
        index: i + 1,
        role: m.role,
        tokens: m.tokenCount,
        preview: m.preview,
      })),
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `token-usage-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [breakdown, config.tokenThreshold, percentage, status])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1">
          <BarChart3 className="h-3.5 w-3.5" />
          详情
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" style={{ color: BRAND_COLOR }} />
            Token 使用详情
          </DialogTitle>
          <DialogDescription>
            会话 Token 使用量的详细分析报告
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 总览 */}
          <div className={cn('p-4 rounded-lg border', getStatusBgColor(status))}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">总体使用</span>
              <StatusBadgeComponent status={status} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: BRAND_COLOR }}>
                  {formatTokenCount(breakdown.total)}
                </div>
                <div className="text-xs text-muted-foreground">已使用</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {formatTokenCount(config.tokenThreshold)}
                </div>
                <div className="text-xs text-muted-foreground">阈值</div>
              </div>
              <div>
                <div className={cn('text-2xl font-bold', getStatusColor(status))}>
                  {(percentage * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">占比</div>
              </div>
            </div>
          </div>

          {/* 分类统计 */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium mb-2">分类统计</h4>
            <TokenStatItem
              icon={User}
              label="用户消息"
              value={breakdown.user}
              total={breakdown.total}
              color="text-blue-500"
            />
            <TokenStatItem
              icon={Bot}
              label="助手回复"
              value={breakdown.assistant}
              total={breakdown.total}
              color="text-purple-500"
            />
            <TokenStatItem
              icon={MessageSquare}
              label="系统提示"
              value={breakdown.system}
              total={breakdown.total}
              color="text-gray-500"
            />
            <TokenStatItem
              icon={Settings}
              label="工具调用"
              value={breakdown.tools}
              total={breakdown.total}
              color="text-orange-500"
            />
          </div>

          <Separator />

          {/* 每条消息统计 */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              消息详情 ({breakdown.perMessage.length} 条)
            </h4>
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-2">
                {breakdown.perMessage.map((info, index) => (
                  <MessageTokenRow
                    key={info.messageId}
                    info={info}
                    index={index}
                    total={breakdown.total}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 导出按钮 */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function TokenUsageIndicator({
  sessionId,
  messages,
  compact = false,
  showPerMessage: _showPerMessage = false,
  showTrend: _showTrend = false,
  onOpenSettings,
}: TokenUsageIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = useCompressionConfig()
  const thresholdStatus = useThresholdStatus(sessionId)
  const breakdown = useTokenBreakdown(messages)

  const status = thresholdStatus?.status ?? 'normal'
  const currentTokens = thresholdStatus?.currentTokens ?? breakdown.total
  const percentage = currentTokens / config.tokenThreshold

  // 状态图标
  const StatusIcon = useMemo(() => {
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
  }, [status])

  // 紧凑模式
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 cursor-pointer',
                'hover:bg-muted transition-colors'
              )}
            >
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                {formatTokenCount(currentTokens)}
              </span>
              <StatusBadgeComponent status={status} isCompact />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64">
            <div className="space-y-2">
              <div className="font-medium">Token 使用情况</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>已使用:</span>
                  <span className="font-medium">{currentTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span>阈值:</span>
                  <span>{config.tokenThreshold}</span>
                </div>
                <div className="flex justify-between">
                  <span>占比:</span>
                  <span className={getStatusColor(status)}>
                    {(percentage * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(percentage * 100, 100)}
                className={cn('h-1.5', getProgressColorClass(status))}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-3">
      {/* 主显示区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <span className="text-sm font-medium">Token 使用</span>
          <StatusBadgeComponent status={status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatTokenCount(currentTokens)} / {formatTokenCount(config.tokenThreshold)}
          </span>
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onOpenSettings}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="space-y-1.5">
        <Progress
          value={Math.min(percentage * 100, 100)}
          className={cn('h-2', getProgressColorClass(status))}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span className={getStatusColor(status)}>
            {(percentage * 100).toFixed(1)}%
          </span>
          <span>{formatTokenCount(config.tokenThreshold)}</span>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/30">
          <User className="h-3.5 w-3.5 text-blue-500 mb-1" />
          <span className="text-xs text-muted-foreground">用户</span>
          <span className="text-sm font-medium">
            {formatTokenCount(breakdown.user)}
          </span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/30">
          <Bot className="h-3.5 w-3.5 text-purple-500 mb-1" />
          <span className="text-xs text-muted-foreground">助手</span>
          <span className="text-sm font-medium">
            {formatTokenCount(breakdown.assistant)}
          </span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/30">
          <MessageSquare className="h-3.5 w-3.5 text-gray-500 mb-1" />
          <span className="text-xs text-muted-foreground">系统</span>
          <span className="text-sm font-medium">
            {formatTokenCount(breakdown.system)}
          </span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-muted/30">
          <Settings className="h-3.5 w-3.5 text-orange-500 mb-1" />
          <span className="text-xs text-muted-foreground">工具</span>
          <span className="text-sm font-medium">
            {formatTokenCount(breakdown.tools)}
          </span>
        </div>
      </div>

      {/* 可展开详情 */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              查看详情
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 pt-2">
            {/* 详细统计 */}
            <div className="space-y-1 text-sm">
              <TokenStatItem
                icon={User}
                label="用户消息"
                value={breakdown.user}
                total={breakdown.total}
                color="text-blue-500"
              />
              <TokenStatItem
                icon={Bot}
                label="助手回复"
                value={breakdown.assistant}
                total={breakdown.total}
                color="text-purple-500"
              />
              <TokenStatItem
                icon={MessageSquare}
                label="系统提示"
                value={breakdown.system}
                total={breakdown.total}
                color="text-gray-500"
              />
              <TokenStatItem
                icon={Settings}
                label="工具调用"
                value={breakdown.tools}
                total={breakdown.total}
                color="text-orange-500"
              />
            </div>

            {/* 阈值配置 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>压缩阈值: {config.tokenThreshold}</span>
              <span>警告: {config.warningThreshold * 100}% / 临界: {config.criticalThreshold * 100}%</span>
            </div>

            {/* 详情对话框入口 */}
            <TokenDetailDialog
              breakdown={breakdown}
              thresholdStatus={thresholdStatus}
              config={config}
              percentage={percentage}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 状态警告 */}
      {status !== 'normal' && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-xs border',
            getStatusBgColor(status)
          )}
        >
          <StatusIcon className={cn('h-3.5 w-3.5', getStatusColor(status))} />
          <span className={getStatusColor(status)}>
            {status === 'exceeded' && 'Token 阈值已超限，建议压缩上下文'}
            {status === 'critical' && '接近 Token 阈值，请考虑压缩'}
            {status === 'warning' && 'Token 使用量较高'}
          </span>
        </div>
      )}
    </div>
  )
}

// ==================== Export ====================

export default TokenUsageIndicator
