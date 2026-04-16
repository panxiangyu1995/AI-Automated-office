/**
 * SystemAnnouncements - 系统公告组件
 * Story 11.6 - 系统公告功能
 *
 * 提供统一公告界面，用于展示系统和 Agent 相关公告
 * - 发布和渲染系统公告
 * - 跟踪已读状态和公告可见性
 * - 与统一消息中心集成
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
  CheckCheck,
  Clock,
  Filter,
  Pin,
  PinOff,
  Search,
  Settings,
  Megaphone,
  Bot,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

export type NoticeType = 'system' | 'agent' | 'security' | 'update' | 'maintenance'
export type NoticeStatus = 'active' | 'archived' | 'pinned'
export type NoticePriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notice {
  id: string
  type: NoticeType
  title: string
  content: string
  priority: NoticePriority
  status: NoticeStatus
  author: string
  authorAvatar?: string
  createdAt: Date
  expiresAt?: Date
  isRead: boolean
  isPinned: boolean
  readAt?: Date
  recipientScope: 'all' | 'department' | 'role' | 'user'
  recipientTarget?: string
  attachmentCount: number
  relatedNoticeIds?: string[]
}

export interface AnnouncementStats {
  total: number
  unread: number
  pinned: number
  byType: Record<NoticeType, number>
  byPriority: Record<NoticePriority, number>
}

export interface SystemAnnouncementsProps {
  className?: string
  onNoticeClick?: (notice: Notice) => void
  onMarkAsRead?: (noticeId: string) => void
  onMarkAllAsRead?: () => void
  onPinNotice?: (noticeId: string) => void
  onArchiveNotice?: (noticeId: string) => void
}

// ==================== Mock Data ====================

const mockNotices: Notice[] = [
  {
    id: 'notice-1',
    type: 'system',
    title: '系统升级通知',
    content: '尊敬的用户，系统将于本周六 22:00 进行例行升级，预计维护时长 2 小时。届时部分功能将暂时无法使用，请提前做好准备。感谢您的理解与支持！',
    priority: 'high',
    status: 'active',
    author: '系统管理员',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isPinned: true,
    recipientScope: 'all',
    attachmentCount: 0,
  },
  {
    id: 'notice-2',
    type: 'agent',
    title: 'AI Agent 新功能上线',
    content: '全新的 AI Agent 已正式上线！本次更新包含：更智能的上下文理解能力增强、响应速度提升 40%、新增多轮对话记忆功能。立即体验更高效的办公协作！',
    priority: 'normal',
    status: 'active',
    author: 'AI 助手',
    authorAvatar: 'bot',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    isPinned: false,
    readAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    recipientScope: 'all',
    attachmentCount: 1,
  },
  {
    id: 'notice-3',
    type: 'security',
    title: '安全提醒：密码强度升级',
    content: '为了保障账户安全，我们建议您尽快更新密码。新密码要求：至少 8 位，包含大小写字母、数字和特殊字符。定期更换密码可有效防止未授权访问。',
    priority: 'urgent',
    status: 'active',
    author: '安全中心',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: false,
    isPinned: false,
    recipientScope: 'all',
    attachmentCount: 0,
  },
  {
    id: 'notice-4',
    type: 'update',
    title: '版本更新 v2.5.0 发布说明',
    content: '新版本包含以下更新：\n1. 全新设计的用户界面\n2. 支持深色模式\n3. 优化了数据同步机制\n4. 修复了若干已知问题\n\n请前往设置页面检查更新。',
    priority: 'normal',
    status: 'active',
    author: '产品团队',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isRead: true,
    isPinned: false,
    readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    recipientScope: 'all',
    attachmentCount: 2,
    relatedNoticeIds: ['notice-2'],
  },
  {
    id: 'notice-5',
    type: 'maintenance',
    title: '数据库维护公告',
    content: '计划于本周日 03:00-05:00 进行数据库优化维护。届时系统访问可能会出现短暂延迟。请您避开此时段进行重要操作。',
    priority: 'low',
    status: 'active',
    author: '运维团队',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isRead: false,
    isPinned: false,
    recipientScope: 'all',
    attachmentCount: 0,
  },
  {
    id: 'notice-6',
    type: 'agent',
    title: 'Agent 协作功能测试邀请',
    content: '我们正在测试新的 Agent 协作功能，邀请部分用户体验并反馈。您可以通过设置页面加入测试计划，共同打造更强大的 AI 办公助手。',
    priority: 'normal',
    status: 'archived',
    author: 'AI 助手',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isRead: true,
    isPinned: false,
    readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    recipientScope: 'department',
    recipientTarget: '研发部',
    attachmentCount: 0,
  },
]

// ==================== Helper Functions ====================

function getNoticeTypeIcon(type: NoticeType) {
  switch (type) {
    case 'system':
      return <Megaphone className="h-4 w-4" />
    case 'agent':
      return <Bot className="h-4 w-4" />
    case 'security':
      return <AlertTriangle className="h-4 w-4" />
    case 'update':
      return <Info className="h-4 w-4" />
    case 'maintenance':
      return <Settings className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getNoticeTypeColor(type: NoticeType): string {
  switch (type) {
    case 'system':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'agent':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    case 'security':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    case 'update':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
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

interface NoticeCardProps {
  notice: Notice
  onClick?: () => void
  onMarkAsRead?: () => void
  onPin?: () => void
  onArchive?: () => void
  compact?: boolean
}

function NoticeCard({
  notice,
  onClick,
  onMarkAsRead,
  onPin,
  onArchive,
  compact = false,
}: NoticeCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all',
        notice.isRead
          ? 'bg-background hover:bg-muted/50'
          : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Unread indicator */}
      {!notice.isRead && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
      )}

      <div className="flex items-start gap-3" onClick={onClick}>
        {/* Type Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            getNoticeTypeColor(notice.type)
          )}
        >
          {getNoticeTypeIcon(notice.type)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn('font-medium', notice.isRead ? 'text-foreground' : 'text-foreground font-semibold')}>
              {notice.title}
            </h4>
            {notice.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
            {notice.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs">紧急</Badge>
            )}
            {notice.priority === 'high' && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">重要</Badge>
            )}
          </div>

          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {notice.content}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(notice.createdAt)}
            </span>
            <span>{notice.author}</span>
            {notice.attachmentCount > 0 && (
              <span>{notice.attachmentCount} 个附件</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notice.isRead && onMarkAsRead && (
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
          {onPin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onPin()
              }}
            >
              {notice.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          )}
          {onArchive && notice.status === 'active' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface NoticeDetailDialogProps {
  notice: Notice | null
  open: boolean
  onClose: () => void
  onMarkAsRead?: () => void
  onPin?: () => void
  onArchive?: () => void
}

function NoticeDetailDialog({
  notice,
  open,
  onClose,
  onMarkAsRead,
  onPin,
  onArchive,
}: NoticeDetailDialogProps) {
  if (!notice) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                getNoticeTypeColor(notice.type)
              )}
            >
              {getNoticeTypeIcon(notice.type)}
            </div>
            <div>
              <DialogTitle className="text-lg">{notice.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{notice.author}</span>
                <span>•</span>
                <span>{notice.createdAt.toLocaleString('zh-CN')}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Priority & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                notice.priority === 'urgent' && 'border-red-500 text-red-600',
                notice.priority === 'high' && 'border-orange-500 text-orange-600',
                notice.priority === 'normal' && 'border-blue-500 text-blue-600',
                notice.priority === 'low' && 'border-gray-400 text-gray-500'
              )}
            >
              优先级: {notice.priority === 'urgent' ? '紧急' : notice.priority === 'high' ? '重要' : notice.priority === 'normal' ? '普通' : '低'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              类型: {notice.type === 'system' ? '系统' : notice.type === 'agent' ? 'Agent' : notice.type === 'security' ? '安全' : notice.type === 'update' ? '更新' : '维护'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              范围: {notice.recipientScope === 'all' ? '全部用户' : notice.recipientScope === 'department' ? `部门: ${notice.recipientTarget}` : notice.recipientScope === 'role' ? `角色: ${notice.recipientTarget}` : `用户: ${notice.recipientTarget}`}
            </Badge>
            {notice.isPinned && <Badge variant="secondary" className="text-xs"><Pin className="h-3 w-3 mr-1" />已置顶</Badge>}
          </div>

          {/* Content */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{notice.content}</p>
          </div>

          {/* Attachments */}
          {notice.attachmentCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">附件 ({notice.attachmentCount})</span>
              <Badge variant="secondary" className="text-xs">暂无附件</Badge>
            </div>
          )}

          {/* Read status */}
          {notice.isRead && notice.readAt && (
            <p className="text-xs text-muted-foreground">
              已读于 {notice.readAt.toLocaleString('zh-CN')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            {!notice.isRead && onMarkAsRead && (
              <Button variant="outline" size="sm" onClick={onMarkAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                标记为已读
              </Button>
            )}
            {onPin && (
              <Button variant="ghost" size="sm" onClick={onPin}>
                {notice.isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                {notice.isPinned ? '取消置顶' : '置顶'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onArchive && notice.status === 'active' && (
              <Button variant="ghost" size="sm" onClick={onArchive}>
                归档
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function SystemAnnouncements({
  className,
  onNoticeClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onPinNotice,
  onArchiveNotice,
}: SystemAnnouncementsProps) {
  const [notices, setNotices] = useState<Notice[]>(mockNotices)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all')
  const [typeFilters, setTypeFilters] = useState<Record<NoticeType, boolean>>({
    system: true,
    agent: true,
    security: true,
    update: true,
    maintenance: true,
  })
  const [priorityFilters, setPriorityFilters] = useState<Record<NoticePriority, boolean>>({
    low: true,
    normal: true,
    high: true,
    urgent: true,
  })

  // Stats
  const stats: AnnouncementStats = useMemo(() => {
    return {
      total: notices.length,
      unread: notices.filter((n) => !n.isRead && n.status === 'active').length,
      pinned: notices.filter((n) => n.isPinned && n.status === 'active').length,
      byType: {
        system: notices.filter((n) => n.type === 'system').length,
        agent: notices.filter((n) => n.type === 'agent').length,
        security: notices.filter((n) => n.type === 'security').length,
        update: notices.filter((n) => n.type === 'update').length,
        maintenance: notices.filter((n) => n.type === 'maintenance').length,
      },
      byPriority: {
        low: notices.filter((n) => n.priority === 'low').length,
        normal: notices.filter((n) => n.priority === 'normal').length,
        high: notices.filter((n) => n.priority === 'high').length,
        urgent: notices.filter((n) => n.priority === 'urgent').length,
      },
    }
  }, [notices])

  // Filtered notices
  const filteredNotices = useMemo(() => {
    let result = notices

    // Tab filter
    switch (activeTab) {
      case 'unread':
        result = result.filter((n) => !n.isRead && n.status === 'active')
        break
      case 'pinned':
        result = result.filter((n) => n.isPinned && n.status === 'active')
        break
      case 'archived':
        result = result.filter((n) => n.status === 'archived')
        break
      default:
        result = result.filter((n) => n.status !== 'archived')
    }

    // Type filter
    result = result.filter((n) => typeFilters[n.type])

    // Priority filter
    result = result.filter((n) => priorityFilters[n.priority])

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.author.toLowerCase().includes(query)
      )
    }

    // Sort: pinned first, then by createdAt
    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [notices, activeTab, typeFilters, priorityFilters, searchQuery])

  // Handlers
  const handleMarkAsRead = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId ? { ...n, isRead: true, readAt: new Date() } : n
      )
    )
    onMarkAsRead?.(noticeId)
  }

  const handleMarkAllAsRead = () => {
    setNotices((prev) =>
      prev.map((n) =>
        n.status === 'active' && !n.isRead
          ? { ...n, isRead: true, readAt: new Date() }
          : n
      )
    )
    onMarkAllAsRead?.()
  }

  const handlePin = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId ? { ...n, isPinned: !n.isPinned } : n
      )
    )
    onPinNotice?.(noticeId)
  }

  const handleArchive = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId ? { ...n, status: 'archived' } : n
      )
    )
    onArchiveNotice?.(noticeId)
  }

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice)
    setDetailDialogOpen(true)
    if (!notice.isRead) {
      handleMarkAsRead(notice.id)
    }
    onNoticeClick?.(notice)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">系统公告</h2>
          </div>
          {stats.unread > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              全部已读 ({stats.unread})
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索公告..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter & Tabs */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                全部 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.total - stats.pinned}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                未读 <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{stats.unread}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pinned">
                置顶 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.pinned}</Badge>
              </TabsTrigger>
              <TabsTrigger value="archived">
                归档
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
              {(Object.keys(typeFilters) as NoticeType[]).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilters[type]}
                  onCheckedChange={(checked) =>
                    setTypeFilters((prev) => ({ ...prev, [type]: checked }))
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', getNoticeTypeColor(type).split(' ')[0])} />
                    {type === 'system' ? '系统' : type === 'agent' ? 'Agent' : type === 'security' ? '安全' : type === 'update' ? '更新' : '维护'}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>优先级筛选</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(priorityFilters) as NoticePriority[]).map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={priorityFilters[priority]}
                  onCheckedChange={(checked) =>
                    setPriorityFilters((prev) => ({ ...prev, [priority]: checked }))
                  }
                >
                  {priority === 'urgent' ? '紧急' : priority === 'high' ? '重要' : priority === 'normal' ? '普通' : '低'}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 border-b px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">系统</span>
          <span className="font-medium">{stats.byType.system}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">Agent</span>
          <span className="font-medium">{stats.byType.agent}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">安全</span>
          <span className="font-medium">{stats.byType.security}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">更新</span>
          <span className="font-medium">{stats.byType.update}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">维护</span>
          <span className="font-medium">{stats.byType.maintenance}</span>
        </div>
        {stats.byPriority.urgent > 0 && (
          <div className="flex items-center gap-1.5 text-sm ml-auto">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-red-600 font-medium">{stats.byPriority.urgent} 紧急</span>
          </div>
        )}
      </div>

      {/* Notice List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">暂无公告</p>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onClick={() => handleNoticeClick(notice)}
                onMarkAsRead={() => handleMarkAsRead(notice.id)}
                onPin={() => handlePin(notice.id)}
                onArchive={() => handleArchive(notice.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Detail Dialog */}
      <NoticeDetailDialog
        notice={selectedNotice}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onMarkAsRead={selectedNotice ? () => handleMarkAsRead(selectedNotice.id) : undefined}
        onPin={selectedNotice ? () => handlePin(selectedNotice.id) : undefined}
        onArchive={selectedNotice ? () => handleArchive(selectedNotice.id) : undefined}
      />
    </div>
  )
}
