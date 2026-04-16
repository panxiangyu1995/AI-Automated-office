/**
 * TaskNotifications - 任务通知推送组件
 * Story 11.7 - 任务通知推送
 *
 * 发送governed的任务和状态通知，通过统一消息系统推送
 * - 推送任务完成和待处理通知
 * - 遵守用户偏好和勿扰设置
 * - 跟踪投递和提醒状态
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-04: 品牌色 var(--ao-button.background)
 */

import { useState, useMemo } from 'react'
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Filter,
  Search,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  User,
  Users,
  Zap,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type NotificationType = 'task_assigned' | 'task_completed' | 'task_overdue' | 'task_reminder' | 'approval_needed' | 'system_alert'
export type NotificationStatus = 'pending' | 'delivered' | 'read' | 'acknowledged' | 'failed'
export type DeliveryChannel = 'in_app' | 'email' | 'sms' | 'push'
export type ReminderStatus = 'none' | 'scheduled' | 'sent' | 'snoozed'

export interface NotificationPreference {
  type: NotificationType
  enabled: boolean
  channels: DeliveryChannel[]
  doNotDisturb: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

export interface TaskNotification {
  id: string
  type: NotificationType
  title: string
  content: string
  status: NotificationStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  taskId?: string
  taskTitle?: string
  assigneeId?: string
  assigneeName?: string
  assigneeAvatar?: string
  senderId?: string
  senderName?: string
  createdAt: Date
  deliveredAt?: Date
  readAt?: Date
  acknowledgedAt?: Date
  deliveryChannel: DeliveryChannel
  reminderStatus: ReminderStatus
  reminderAt?: Date
  doNotDisturbRespected: boolean
  retryCount: number
  maxRetries: number
  failureReason?: string
}

export interface NotificationStats {
  total: number
  unread: number
  pending: number
  byType: Record<NotificationType, number>
  byStatus: Record<NotificationStatus, number>
  deliveryRate: number
}

export interface TaskNotificationsProps {
  className?: string
  onNotificationClick?: (notification: TaskNotification) => void
  onMarkAsRead?: (notificationId: string) => void
  onAcknowledge?: (notificationId: string) => void
  onRetry?: (notificationId: string) => void
  onSnooze?: (notificationId: string, duration: number) => void
  onPreferenceChange?: (preference: NotificationPreference) => void
}

// ==================== Mock Data ====================

const mockNotifications: TaskNotification[] = [
  {
    id: 'notif-1',
    type: 'task_assigned',
    title: '新任务分配',
    content: '您被分配了新任务"完成Q1季度报告"，请尽快处理。',
    status: 'delivered',
    priority: 'high',
    taskId: 'task-101',
    taskTitle: '完成Q1季度报告',
    assigneeId: 'user-1',
    assigneeName: '张三',
    senderId: 'user-manager',
    senderName: '项目经理',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 29 * 60 * 1000),
    deliveryChannel: 'in_app',
    reminderStatus: 'none',
    doNotDisturbRespected: false,
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'notif-2',
    type: 'task_completed',
    title: '任务已完成',
    content: '任务"修复登录bug"已被标记为完成，等待您的确认。',
    status: 'read',
    priority: 'normal',
    taskId: 'task-102',
    taskTitle: '修复登录bug',
    assigneeId: 'user-2',
    assigneeName: '李四',
    senderId: 'user-2',
    senderName: '李四',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    deliveryChannel: 'in_app',
    reminderStatus: 'none',
    doNotDisturbRespected: false,
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'notif-3',
    type: 'task_overdue',
    title: '任务逾期提醒',
    content: '任务"提交预算方案"已逾期2天，请立即处理。',
    status: 'delivered',
    priority: 'urgent',
    taskId: 'task-103',
    taskTitle: '提交预算方案',
    assigneeId: 'user-1',
    assigneeName: '张三',
    senderId: 'system',
    senderName: '系统',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    deliveryChannel: 'push',
    reminderStatus: 'sent',
    reminderAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    doNotDisturbRespected: false,
    retryCount: 1,
    maxRetries: 3,
    failureReason: '设备离线',
  },
  {
    id: 'notif-4',
    type: 'approval_needed',
    title: '审批待处理',
    content: '员工王五提交了请假申请，请及时审批。',
    status: 'pending',
    priority: 'high',
    taskId: 'approval-201',
    senderId: 'user-5',
    senderName: '王五',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    deliveryChannel: 'in_app',
    reminderStatus: 'scheduled',
    reminderAt: new Date(Date.now() + 30 * 60 * 1000),
    doNotDisturbRespected: false,
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'notif-5',
    type: 'task_reminder',
    title: '任务提醒',
    content: '任务"客户会议准备"将于明天到期，请及时完成。',
    status: 'delivered',
    priority: 'normal',
    taskId: 'task-104',
    taskTitle: '客户会议准备',
    assigneeId: 'user-1',
    assigneeName: '张三',
    senderId: 'system',
    senderName: '系统',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    deliveryChannel: 'in_app',
    reminderStatus: 'none',
    doNotDisturbRespected: false,
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'notif-6',
    type: 'system_alert',
    title: '系统告警',
    content: '服务器内存使用率超过80%，建议检查。',
    status: 'read',
    priority: 'high',
    senderId: 'system',
    senderName: '系统监控',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    deliveryChannel: 'push',
    reminderStatus: 'none',
    doNotDisturbRespected: false,
    retryCount: 2,
    maxRetries: 3,
    failureReason: '推送服务暂时不可用',
  },
]

// ==================== Helper Functions ====================

function getNotificationTypeIcon(type: NotificationType) {
  switch (type) {
    case 'task_assigned':
      return <User className="h-4 w-4" />
    case 'task_completed':
      return <CheckCircle2 className="h-4 w-4" />
    case 'task_overdue':
      return <AlertCircle className="h-4 w-4" />
    case 'task_reminder':
      return <Timer className="h-4 w-4" />
    case 'approval_needed':
      return <Users className="h-4 w-4" />
    case 'system_alert':
      return <Zap className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getNotificationTypeColor(type: NotificationType): string {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'task_completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'task_overdue':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    case 'task_reminder':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    case 'approval_needed':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    case 'system_alert':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getStatusColor(status: NotificationStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    case 'delivered':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
    case 'read':
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900'
    case 'acknowledged':
      return 'text-green-600 bg-green-50 dark:bg-green-950'
    case 'failed':
      return 'text-red-600 bg-red-50 dark:bg-red-950'
    default:
      return ''
  }
}

function getStatusLabel(status: NotificationStatus): string {
  switch (status) {
    case 'pending':
      return '待发送'
    case 'delivered':
      return '已送达'
    case 'read':
      return '已读'
    case 'acknowledged':
      return '已确认'
    case 'failed':
      return '失败'
    default:
      return status
  }
}

function getTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'task_assigned':
      return '任务分配'
    case 'task_completed':
      return '任务完成'
    case 'task_overdue':
      return '任务逾期'
    case 'task_reminder':
      return '任务提醒'
    case 'approval_needed':
      return '待审批'
    case 'system_alert':
      return '系统告警'
    default:
      return type
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  return '刚刚'
}

// ==================== Sub-Components ====================

interface NotificationCardProps {
  notification: TaskNotification
  onClick?: () => void
  onMarkAsRead?: () => void
  onAcknowledge?: () => void
  onRetry?: () => void
  onSnooze?: () => void
}

function NotificationCard({
  notification,
  onClick,
  onMarkAsRead,
  onAcknowledge,
  onRetry,
  onSnooze,
}: NotificationCardProps) {
  const isFailed = notification.status === 'failed'
  const isPending = notification.status === 'pending'
  const isOverdue = notification.type === 'task_overdue'

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all',
        notification.status === 'read'
          ? 'bg-background hover:bg-muted/50'
          : isFailed
          ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30'
          : isOverdue
          ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30'
          : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30'
      )}
    >
      {/* Status indicator */}
      {notification.status === 'pending' && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-yellow-500" />
      )}
      {isFailed && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-red-500" />
      )}
      {notification.status === 'delivered' && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
      )}

      <div className="flex items-start gap-3" onClick={onClick}>
        {/* Type Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            getNotificationTypeColor(notification.type)
          )}
        >
          {getNotificationTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn(
              'font-medium',
              notification.status === 'read' ? 'text-foreground' : 'text-foreground font-semibold'
            )}>
              {notification.title}
            </h4>
            {notification.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs">紧急</Badge>
            )}
            {notification.priority === 'high' && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">重要</Badge>
            )}
            <Badge
              variant="outline"
              className={cn('text-xs', getStatusColor(notification.status))}
            >
              {getStatusLabel(notification.status)}
            </Badge>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {notification.content}
          </p>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(notification.createdAt)}
            </span>
            {notification.senderName && <span>{notification.senderName}</span>}
            {notification.taskTitle && (
              <span className="truncate max-w-[150px]">任务: {notification.taskTitle}</span>
            )}
            {isFailed && notification.retryCount > 0 && (
              <span className="text-red-600">
                重试 {notification.retryCount}/{notification.maxRetries}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {notification.status === 'delivered' && onMarkAsRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead()
              }}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          {notification.status === 'read' && onAcknowledge && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onAcknowledge()
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {isFailed && onRetry && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onRetry()
              }}
            >
              <BellRing className="h-4 w-4" />
            </Button>
          )}
          {(isPending || notification.reminderStatus === 'scheduled') && onSnooze && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onSnooze()
              }}
            >
              <Timer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface NotificationDetailDialogProps {
  notification: TaskNotification | null
  open: boolean
  onClose: () => void
  onMarkAsRead?: () => void
  onAcknowledge?: () => void
  onRetry?: () => void
  onSnooze?: () => void
}

function NotificationDetailDialog({
  notification,
  open,
  onClose,
  onMarkAsRead,
  onAcknowledge,
  onRetry,
  onSnooze,
}: NotificationDetailDialogProps) {
  if (!notification) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                getNotificationTypeColor(notification.type)
              )}
            >
              {getNotificationTypeIcon(notification.type)}
            </div>
            <div>
              <DialogTitle className="text-lg">{notification.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{notification.senderName || '系统'}</span>
                <span>•</span>
                <span>{notification.createdAt.toLocaleString('zh-CN')}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Status & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                notification.priority === 'urgent' && 'border-red-500 text-red-600',
                notification.priority === 'high' && 'border-orange-500 text-orange-600',
                notification.priority === 'normal' && 'border-blue-500 text-blue-600',
                notification.priority === 'low' && 'border-gray-400 text-gray-500'
              )}
            >
              优先级: {notification.priority === 'urgent' ? '紧急' : notification.priority === 'high' ? '重要' : notification.priority === 'normal' ? '普通' : '低'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              类型: {getTypeLabel(notification.type)}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs', getStatusColor(notification.status))}
            >
              状态: {getStatusLabel(notification.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              渠道: {notification.deliveryChannel === 'in_app' ? '应用内' : notification.deliveryChannel === 'email' ? '邮件' : notification.deliveryChannel === 'sms' ? '短信' : '推送'}
            </Badge>
          </div>

          {/* DND Status */}
          {notification.doNotDisturbRespected && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
              <Moon className="h-4 w-4" />
              <span>已遵守勿扰模式</span>
            </div>
          )}

          {/* Content */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{notification.content}</p>
          </div>

          {/* Task Info */}
          {notification.taskTitle && (
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">关联任务</p>
              <p className="font-medium mt-1">{notification.taskTitle}</p>
            </div>
          )}

          {/* Delivery Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">创建时间</p>
              <p>{notification.createdAt.toLocaleString('zh-CN')}</p>
            </div>
            {notification.deliveredAt && (
              <div>
                <p className="text-muted-foreground">送达时间</p>
                <p>{notification.deliveredAt.toLocaleString('zh-CN')}</p>
              </div>
            )}
            {notification.readAt && (
              <div>
                <p className="text-muted-foreground">阅读时间</p>
                <p>{notification.readAt.toLocaleString('zh-CN')}</p>
              </div>
            )}
            {notification.acknowledgedAt && (
              <div>
                <p className="text-muted-foreground">确认时间</p>
                <p>{notification.acknowledgedAt.toLocaleString('zh-CN')}</p>
              </div>
            )}
          </div>

          {/* Reminder Info */}
          {notification.reminderStatus !== 'none' && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  提醒{notification.reminderStatus === 'scheduled' ? '计划' : notification.reminderStatus === 'sent' ? '已发送' : '已延迟'}:
                  {notification.reminderAt?.toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          )}

          {/* Failure Info */}
          {notification.status === 'failed' && notification.failureReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/20 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">发送失败</span>
              </div>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                {notification.failureReason} (已重试 {notification.retryCount}/{notification.maxRetries} 次)
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            {notification.status === 'delivered' && onMarkAsRead && (
              <Button variant="outline" size="sm" onClick={onMarkAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                标记已读
              </Button>
            )}
            {notification.status === 'read' && onAcknowledge && (
              <Button variant="outline" size="sm" onClick={onAcknowledge}>
                <Check className="h-4 w-4 mr-2" />
                确认
              </Button>
            )}
            {notification.status === 'failed' && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <BellRing className="h-4 w-4 mr-2" />
                重试
              </Button>
            )}
            {(notification.status === 'pending' || notification.reminderStatus === 'scheduled') && onSnooze && (
              <Button variant="outline" size="sm" onClick={onSnooze}>
                <Timer className="h-4 w-4 mr-2" />
                延迟提醒
              </Button>
            )}
          </div>
          <Button variant="default" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PreferencesDialogProps {
  open: boolean
  onClose: () => void
  preferences: NotificationPreference[]
  onPreferenceChange: (preference: NotificationPreference) => void
}

function PreferencesDialog({
  open,
  onClose,
  preferences,
  onPreferenceChange,
}: PreferencesDialogProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences)
  const [globalDND, setGlobalDND] = useState(
    preferences.some((p) => p.doNotDisturb)
  )

  const handleToggle = (type: NotificationType, field: 'enabled' | 'doNotDisturb') => {
    const updated = localPrefs.map((p) =>
      p.type === type ? { ...p, [field]: !p[field] } : p
    )
    setLocalPrefs(updated)
    const changed = updated.find((p) => p.type === type)
    if (changed) onPreferenceChange(changed)
  }

  const handleChannelChange = (type: NotificationType, channel: DeliveryChannel, enabled: boolean) => {
    const updated = localPrefs.map((p) => {
      if (p.type === type) {
        const channels = enabled
          ? [...p.channels, channel]
          : p.channels.filter((c) => c !== channel)
        return { ...p, channels }
      }
      return p
    })
    setLocalPrefs(updated)
    const changed = updated.find((p) => p.type === type)
    if (changed) onPreferenceChange(changed)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>通知偏好设置</DialogTitle>
          <DialogDescription>
            配置您希望接收的通知类型和渠道
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Global DND */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">勿扰模式</p>
                <p className="text-sm text-muted-foreground">暂停所有通知</p>
              </div>
            </div>
            <Switch
              checked={globalDND}
              onCheckedChange={(checked) => {
                setGlobalDND(checked)
                localPrefs.forEach((p) => {
                  onPreferenceChange({ ...p, doNotDisturb: checked })
                })
              }}
            />
          </div>

          {/* Per-type preferences */}
          {localPrefs.map((pref) => (
            <div key={pref.type} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      getNotificationTypeColor(pref.type)
                    )}
                  >
                    {getNotificationTypeIcon(pref.type)}
                  </div>
                  <span className="font-medium">{getTypeLabel(pref.type)}</span>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={() => handleToggle(pref.type, 'enabled')}
                  disabled={globalDND}
                />
              </div>

              {/* Channels */}
              <div className="flex items-center gap-4 ml-10">
                {(['in_app', 'email', 'sms', 'push'] as DeliveryChannel[]).map((channel) => (
                  <Label
                    key={channel}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={pref.channels.includes(channel)}
                      onChange={(e) => handleChannelChange(pref.type, channel, e.target.checked)}
                      disabled={globalDND || !pref.enabled}
                      className="rounded border-gray-300"
                    />
                    {channel === 'in_app' ? '应用' : channel === 'email' ? '邮件' : channel === 'sms' ? '短信' : '推送'}
                  </Label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="default" onClick={onClose}>
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function TaskNotifications({
  className,
  onNotificationClick,
  onMarkAsRead,
  onAcknowledge,
  onRetry,
  onSnooze,
  onPreferenceChange,
}: TaskNotificationsProps) {
  const [notifications, setNotifications] = useState<TaskNotification[]>(mockNotifications)
  const [selectedNotification, setSelectedNotification] = useState<TaskNotification | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'pending' | 'failed'>('all')
  const [typeFilters, setTypeFilters] = useState<Record<NotificationType, boolean>>({
    task_assigned: true,
    task_completed: true,
    task_overdue: true,
    task_reminder: true,
    approval_needed: true,
    system_alert: true,
  })

  // Default preferences
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    { type: 'task_assigned', enabled: true, channels: ['in_app'], doNotDisturb: false },
    { type: 'task_completed', enabled: true, channels: ['in_app'], doNotDisturb: false },
    { type: 'task_overdue', enabled: true, channels: ['in_app', 'push'], doNotDisturb: false },
    { type: 'task_reminder', enabled: true, channels: ['in_app'], doNotDisturb: false },
    { type: 'approval_needed', enabled: true, channels: ['in_app', 'push'], doNotDisturb: false },
    { type: 'system_alert', enabled: true, channels: ['push'], doNotDisturb: false },
  ])

  // Stats
  const stats: NotificationStats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter((n) => n.status !== 'read' && n.status !== 'acknowledged').length
    const pending = notifications.filter((n) => n.status === 'pending').length
    const delivered = notifications.filter((n) => n.status === 'delivered' || n.status === 'read' || n.status === 'acknowledged').length
    const deliveryRate = total > 0 ? Math.round((delivered / (total - pending)) * 100) : 100

    return {
      total,
      unread,
      pending,
      byType: {
        task_assigned: notifications.filter((n) => n.type === 'task_assigned').length,
        task_completed: notifications.filter((n) => n.type === 'task_completed').length,
        task_overdue: notifications.filter((n) => n.type === 'task_overdue').length,
        task_reminder: notifications.filter((n) => n.type === 'task_reminder').length,
        approval_needed: notifications.filter((n) => n.type === 'approval_needed').length,
        system_alert: notifications.filter((n) => n.type === 'system_alert').length,
      },
      byStatus: {
        pending: notifications.filter((n) => n.status === 'pending').length,
        delivered: notifications.filter((n) => n.status === 'delivered').length,
        read: notifications.filter((n) => n.status === 'read').length,
        acknowledged: notifications.filter((n) => n.status === 'acknowledged').length,
        failed: notifications.filter((n) => n.status === 'failed').length,
      },
      deliveryRate,
    }
  }, [notifications])

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications

    // Tab filter
    switch (activeTab) {
      case 'unread':
        result = result.filter((n) => n.status !== 'read' && n.status !== 'acknowledged')
        break
      case 'pending':
        result = result.filter((n) => n.status === 'pending')
        break
      case 'failed':
        result = result.filter((n) => n.status === 'failed')
        break
      default:
        break
    }

    // Type filter
    result = result.filter((n) => typeFilters[n.type])

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.senderName?.toLowerCase().includes(query) ||
          n.taskTitle?.toLowerCase().includes(query)
      )
    }

    // Sort: unread first, then by createdAt
    return result.sort((a, b) => {
      const aUnread = a.status !== 'read' && a.status !== 'acknowledged'
      const bUnread = b.status !== 'read' && b.status !== 'acknowledged'
      if (aUnread !== bUnread) return aUnread ? -1 : 1
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [notifications, activeTab, typeFilters, searchQuery])

  // Handlers
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, status: 'read' as NotificationStatus, readAt: new Date() } : n
      )
    )
    onMarkAsRead?.(notificationId)
  }

  const handleAcknowledge = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, status: 'acknowledged' as NotificationStatus, acknowledgedAt: new Date() } : n
      )
    )
    onAcknowledge?.(notificationId)
  }

  const handleRetry = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, status: 'pending' as NotificationStatus, retryCount: 0, failureReason: undefined }
          : n
      )
    )
    onRetry?.(notificationId)
  }

  const handleSnooze = (notificationId: string) => {
    // Snooze for 30 minutes
    const snoozeUntil = new Date(Date.now() + 30 * 60 * 1000)
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, reminderStatus: 'snoozed' as ReminderStatus, reminderAt: snoozeUntil }
          : n
      )
    )
    onSnooze?.(notificationId, 30)
  }

  const handleNotificationClick = (notification: TaskNotification) => {
    setSelectedNotification(notification)
    setDetailDialogOpen(true)
    if (notification.status === 'delivered') {
      handleMarkAsRead(notification.id)
    }
    onNotificationClick?.(notification)
  }

  const handlePreferenceChange = (preference: NotificationPreference) => {
    setPreferences((prev) =>
      prev.map((p) => (p.type === preference.type ? preference : p))
    )
    onPreferenceChange?.(preference)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">任务通知</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreferencesDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            偏好设置
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索通知..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs & Filter */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                全部 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                未读 <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{stats.unread}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                待发 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="failed">
                失败 <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{stats.byStatus.failed}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>类型筛选</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(typeFilters) as NotificationType[]).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilters[type]}
                  onCheckedChange={(checked) =>
                    setTypeFilters((prev) => ({ ...prev, [type]: checked }))
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', getNotificationTypeColor(type).split(' ')[0])} />
                    {getTypeLabel(type)}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 border-b px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">送达率</span>
          <span className="font-medium">{stats.deliveryRate}%</span>
        </div>
        {stats.byType.task_assigned > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">任务分配</span>
            <span className="font-medium">{stats.byType.task_assigned}</span>
          </div>
        )}
        {stats.byType.task_completed > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">任务完成</span>
            <span className="font-medium">{stats.byType.task_completed}</span>
          </div>
        )}
        {stats.byType.task_overdue > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-600 font-medium">逾期 {stats.byType.task_overdue}</span>
          </div>
        )}
        {stats.byType.approval_needed > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">待审批</span>
            <span className="font-medium">{stats.byType.approval_needed}</span>
          </div>
        )}
        {stats.byType.system_alert > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">系统告警</span>
            <span className="font-medium">{stats.byType.system_alert}</span>
          </div>
        )}
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">暂无通知</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onAcknowledge={() => handleAcknowledge(notification.id)}
                onRetry={() => handleRetry(notification.id)}
                onSnooze={() => handleSnooze(notification.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Detail Dialog */}
      <NotificationDetailDialog
        notification={selectedNotification}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onMarkAsRead={selectedNotification ? () => handleMarkAsRead(selectedNotification.id) : undefined}
        onAcknowledge={selectedNotification ? () => handleAcknowledge(selectedNotification.id) : undefined}
        onRetry={selectedNotification ? () => handleRetry(selectedNotification.id) : undefined}
        onSnooze={selectedNotification ? () => handleSnooze(selectedNotification.id) : undefined}
      />

      {/* Preferences Dialog */}
      <PreferencesDialog
        open={preferencesDialogOpen}
        onClose={() => setPreferencesDialogOpen(false)}
        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
      />
    </div>
  )
}
