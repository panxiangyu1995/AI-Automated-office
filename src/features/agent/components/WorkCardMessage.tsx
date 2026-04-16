/**
 * WorkCardMessage - 工作卡片消息组件
 * Story 11.9 - 工作卡片消息
 *
 * 支持在消息中渲染结构化的工作卡片，以及卡片操作和结果反馈
 * - 在聊天中渲染结构化工作卡片
 * - 支持卡片操作及结果反馈
 * - 允许Agent生成的工作卡片投递
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-04: 品牌色 var(--ao-button.background)
 */

import { useState } from 'react'
import {
  Bot,
  User,
  Check,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Paperclip,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  ExternalLink,
  RefreshCw,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type CardStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
export type CardPriority = 'low' | 'normal' | 'high' | 'urgent'
export type CardActionType = 'approve' | 'reject' | 'edit' | 'delete' | 'confirm' | 'cancel' | 'custom'
export type CardActionStatus = 'idle' | 'loading' | 'success' | 'error'
export type ResultType = 'success' | 'warning' | 'error' | 'info'

export interface CardField {
  label: string
  value: string
  type: 'text' | 'number' | 'date' | 'status' | 'link' | 'user' | 'currency'
  editable?: boolean
}

export interface CardAction {
  id: string
  label: string
  type: CardActionType
  icon?: string
  variant?: 'default' | 'outline' | 'destructive' | 'secondary'
  disabled?: boolean
  loading?: boolean
  result?: {
    type: ResultType
    message: string
  }
}

export interface WorkCard {
  id: string
  title: string
  description?: string
  type: 'task' | 'approval' | 'alert' | 'report' | 'summary' | 'custom'
  status: CardStatus
  priority: CardPriority
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole?: string
  recipientId?: string
  fields: CardField[]
  actions: CardAction[]
  createdAt: Date
  updatedAt?: Date
  expiresAt?: Date
  attachmentCount: number
  threadId?: string
  relatedCardIds?: string[]
  auditTrail?: {
    action: string
    actor: string
    timestamp: Date
    details?: string
  }[]
}

export interface WorkCardMessageProps {
  card: WorkCard
  onAction?: (cardId: string, actionId: string) => void
  onDismiss?: (cardId: string) => void
  onReply?: (cardId: string) => void
  compact?: boolean
  showAvatar?: boolean
  className?: string
}

export interface WorkCardFeedProps {
  cards: WorkCard[]
  className?: string
  onCardAction?: (cardId: string, actionId: string) => void
  onLoadMore?: () => void
  loading?: boolean
}

// ==================== Helper Functions ====================

function getCardStatusConfig(status: CardStatus): { label: string; color: string; icon: React.ReactNode } {
  switch (status) {
    case 'pending':
      return { label: '待处理', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950', icon: <Clock className="h-3 w-3" /> }
    case 'in_progress':
      return { label: '进行中', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950', icon: <RefreshCw className="h-3 w-3" /> }
    case 'completed':
      return { label: '已完成', color: 'text-green-600 bg-green-50 dark:bg-green-950', icon: <CheckCircle2 className="h-3 w-3" /> }
    case 'failed':
      return { label: '失败', color: 'text-red-600 bg-red-50 dark:bg-red-950', icon: <XCircle className="h-3 w-3" /> }
    case 'cancelled':
      return { label: '已取消', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900', icon: <X className="h-3 w-3" /> }
    default:
      return { label: status, color: '', icon: null }
  }
}

function getCardPriorityConfig(priority: CardPriority): { label: string; color: string } {
  switch (priority) {
    case 'urgent':
      return { label: '紧急', color: 'text-red-600 bg-red-50 border-red-200' }
    case 'high':
      return { label: '重要', color: 'text-orange-600 bg-orange-50 border-orange-200' }
    case 'normal':
      return { label: '普通', color: 'text-blue-600 bg-blue-50 border-blue-200' }
    case 'low':
      return { label: '低', color: 'text-gray-600 bg-gray-50 border-gray-200' }
    default:
      return { label: priority, color: '' }
  }
}

function getCardTypeConfig(type: WorkCard['type']): { label: string; color: string; icon: React.ReactNode } {
  switch (type) {
    case 'task':
      return { label: '任务', color: 'bg-blue-100 text-blue-700', icon: <FileText className="h-4 w-4" /> }
    case 'approval':
      return { label: '审批', color: 'bg-purple-100 text-purple-700', icon: <CheckCircle2 className="h-4 w-4" /> }
    case 'alert':
      return { label: '告警', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-4 w-4" /> }
    case 'report':
      return { label: '报告', color: 'bg-green-100 text-green-700', icon: <FileText className="h-4 w-4" /> }
    case 'summary':
      return { label: '摘要', color: 'bg-yellow-100 text-yellow-700', icon: <MessageSquare className="h-4 w-4" /> }
    case 'custom':
      return { label: '自定义', color: 'bg-gray-100 text-gray-700', icon: <Settings className="h-4 w-4" /> }
    default:
      return { label: type, color: '', icon: <FileText className="h-4 w-4" /> }
  }
}

function getResultIcon(type: ResultType) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'info':
      return <AlertCircle className="h-4 w-4 text-blue-600" />
    default:
      return null
  }
}

function formatFieldValue(field: CardField): React.ReactNode {
  switch (field.type) {
    case 'date':
      return new Date(field.value).toLocaleDateString('zh-CN')
    case 'currency':
      return `¥${parseFloat(field.value).toLocaleString()}`
    case 'link':
      return (
        <a
          href={field.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {field.value}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    case 'user':
      return (
        <span className="flex items-center gap-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          {field.value}
        </span>
      )
    case 'status':
      return <Badge variant="outline">{field.value}</Badge>
    default:
      return field.value
  }
}

// ==================== Sub-Components ====================

interface CardActionButtonProps {
  action: CardAction
  onClick: () => void
  disabled?: boolean
}

function CardActionButton({ action, onClick, disabled }: CardActionButtonProps) {
  const variant = action.variant || 'secondary'

  return (
    <Button
      variant={variant as 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'}
      size="sm"
      onClick={onClick}
      disabled={disabled || action.loading}
      className={cn(
        action.type === 'approve' && 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
        action.type === 'reject' && 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
        action.type === 'delete' && 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
      )}
    >
      {action.loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <>
          {action.type === 'approve' && <Check className="h-4 w-4 mr-1" />}
          {action.type === 'reject' && <X className="h-4 w-4 mr-1" />}
          {action.type === 'confirm' && <Check className="h-4 w-4 mr-1" />}
          {action.type === 'cancel' && <X className="h-4 w-4 mr-1" />}
          {action.type === 'edit' && <Edit className="h-4 w-4 mr-1" />}
          {action.type === 'delete' && <Trash2 className="h-4 w-4 mr-1" />}
        </>
      )}
      {action.label}
    </Button>
  )
}

interface WorkCardDetailDialogProps {
  card: WorkCard | null
  open: boolean
  onClose: () => void
  onAction: (actionId: string) => void
}

function WorkCardDetailDialog({ card, open, onClose, onAction }: WorkCardDetailDialogProps) {
  if (!card) return null

  const statusConfig = getCardStatusConfig(card.status)
  const priorityConfig = getCardPriorityConfig(card.priority)
  const typeConfig = getCardTypeConfig(card.type)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', typeConfig.color)}>
              {typeConfig.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">{card.title}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                <span>{card.senderName}</span>
                {card.senderRole && <span>• {card.senderRole}</span>}
                <span>• {card.createdAt.toLocaleString('zh-CN')}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Status & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs', statusConfig.color)}>
              {statusConfig.icon}
              <span className="ml-1">{statusConfig.label}</span>
            </Badge>
            <Badge variant="outline" className={cn('text-xs', priorityConfig.color)}>
              {priorityConfig.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              类型: {typeConfig.label}
            </Badge>
          </div>

          {/* Description */}
          {card.description && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm whitespace-pre-wrap">{card.description}</p>
            </div>
          )}

          {/* Fields */}
          <div className="rounded-lg border">
            <div className="grid grid-cols-2 gap-4 p-4">
              {card.fields.map((field, index) => (
                <div key={index}>
                  <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                  <p className="text-sm font-medium">
                    {formatFieldValue(field)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions with Results */}
          {card.actions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">操作</p>
              <div className="flex flex-wrap gap-2">
                {card.actions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2">
                    <CardActionButton
                      action={action}
                      onClick={() => onAction(action.id)}
                    />
                    {action.result && (
                      <div className={cn(
                        'flex items-center gap-1 text-xs px-2 py-1 rounded',
                        action.result.type === 'success' && 'bg-green-50 text-green-600',
                        action.result.type === 'warning' && 'bg-yellow-50 text-yellow-600',
                        action.result.type === 'error' && 'bg-red-50 text-red-600',
                        action.result.type === 'info' && 'bg-blue-50 text-blue-600'
                      )}>
                        {getResultIcon(action.result.type)}
                        {action.result.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {card.auditTrail && card.auditTrail.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">审计记录</p>
              <div className="rounded-lg border p-3 space-y-2">
                {card.auditTrail.map((entry, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Clock className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {entry.timestamp.toLocaleString('zh-CN')}
                    </span>
                    <span className="font-medium">{entry.actor}</span>
                    <span>{entry.action}</span>
                    {entry.details && <span className="text-muted-foreground">- {entry.details}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function WorkCardMessage({
  card,
  onAction,
  onDismiss,
  onReply,
  compact = false,
  showAvatar = true,
  className,
}: WorkCardMessageProps) {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const statusConfig = getCardStatusConfig(card.status)
  const priorityConfig = getCardPriorityConfig(card.priority)
  const typeConfig = getCardTypeConfig(card.type)

  const handleAction = async (actionId: string) => {
    setActionLoading(actionId)
    try {
      await onAction?.(card.id, actionId)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <div className={cn(
        'group rounded-lg border p-4 transition-all hover:shadow-md',
        card.priority === 'urgent' && 'border-red-200 bg-red-50/50 dark:bg-red-950/20',
        card.priority === 'high' && 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20',
        !compact && className
      )}>
        {/* Header */}
        <div className="flex items-start gap-3">
          {showAvatar && (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Badge */}
              <Badge className={cn('text-xs', typeConfig.color)}>
                {typeConfig.icon}
                <span className="ml-1">{typeConfig.label}</span>
              </Badge>

              {/* Status & Priority */}
              <Badge className={cn('text-xs', statusConfig.color)}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>

              {card.priority !== 'normal' && (
                <Badge variant="outline" className={cn('text-xs', priorityConfig.color)}>
                  {priorityConfig.label}
                </Badge>
              )}

              {/* Title */}
              <h4 className="font-semibold text-sm">{card.title}</h4>
            </div>

            {/* Sender & Time */}
            <p className="text-xs text-muted-foreground mt-1">
              {card.senderName}
              {card.senderRole && ` • ${card.senderRole}`}
              {' • '}
              {card.createdAt.toLocaleString('zh-CN')}
            </p>
          </div>

          {/* Actions Dropdown */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDetailDialogOpen(true)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>卡片操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDetailDialogOpen(true)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  查看详情
                </DropdownMenuItem>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(card.id)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    回复
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDismiss && (
                  <DropdownMenuItem onClick={() => onDismiss(card.id)} className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    忽略
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content - Compact View */}
        {compact && (
          <div className="mt-3 pl-11">
            {card.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {card.description}
              </p>
            )}

            {/* Quick Fields */}
            <div className="flex flex-wrap gap-4 mt-2">
              {card.fields.slice(0, 3).map((field, index) => (
                <div key={index} className="text-xs">
                  <span className="text-muted-foreground">{field.label}: </span>
                  <span className="font-medium">{field.value}</span>
                </div>
              ))}
              {card.fields.length > 3 && (
                <span className="text-xs text-muted-foreground">+{card.fields.length - 3} 更多</span>
              )}
            </div>
          </div>
        )}

        {/* Non-Compact View */}
        {!compact && (
          <div className="mt-3 pl-11 space-y-3">
            {card.description && (
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            )}

            {/* Fields Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {card.fields.map((field, index) => (
                <div key={index} className="text-sm">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="font-medium mt-0.5">{formatFieldValue(field)}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            {card.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {card.actions.map((action) => (
                  <CardActionButton
                    key={action.id}
                    action={{ ...action, loading: actionLoading === action.id }}
                    onClick={() => handleAction(action.id)}
                  />
                ))}
              </div>
            )}

            {/* Action Results */}
            {card.actions.some((a) => a.result) && (
              <div className="space-y-2">
                {card.actions.filter((a) => a.result).map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      'flex items-center gap-2 text-xs p-2 rounded',
                      action.result?.type === 'success' && 'bg-green-50 text-green-700',
                      action.result?.type === 'warning' && 'bg-yellow-50 text-yellow-700',
                      action.result?.type === 'error' && 'bg-red-50 text-red-700',
                      action.result?.type === 'info' && 'bg-blue-50 text-blue-700'
                    )}
                  >
                    {getResultIcon(action.result!.type)}
                    <span className="font-medium">{action.label}: </span>
                    <span>{action.result?.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
              {card.attachmentCount > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {card.attachmentCount} 个附件
                </span>
              )}
              {card.expiresAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  有效期至 {card.expiresAt.toLocaleDateString('zh-CN')}
                </span>
              )}
              {card.relatedCardIds && card.relatedCardIds.length > 0 && (
                <span className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  {card.relatedCardIds.length} 个相关卡片
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <WorkCardDetailDialog
        card={card}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onAction={(actionId) => handleAction(actionId)}
      />
    </>
  )
}

// ==================== Work Card Feed ====================

export function WorkCardFeed({
  cards,
  className,
  onCardAction,
  onLoadMore,
  loading = false,
}: WorkCardFeedProps) {
  const handleAction = (cardId: string, actionId: string) => {
    onCardAction?.(cardId, actionId)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">暂无工作卡片</p>
            </div>
          ) : (
            cards.map((card) => (
              <WorkCardMessage
                key={card.id}
                card={card}
                onAction={handleAction}
              />
            ))
          )}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {cards.length > 0 && onLoadMore && !loading && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={onLoadMore}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
