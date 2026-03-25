/**
 * MessageSearchManager - 消息搜索与管理组件
 * Story 11.10 - 消息搜索与管理
 *
 * 为统一消息中心添加搜索、筛选、置顶、收藏、导出和历史管理功能
 * - 搜索和筛选历史消息
 * - 支持置顶、收藏和导出
 * - 一致地跟踪投递、已读和提醒状态
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-04: 品牌色 #1E3A5F
 */

import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Pin,
  PinOff,
  Star,
  StarOff,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Users,
  Bot,
  FileText,
  Image,
  Paperclip,
  MoreVertical,
  X,
  ArrowUpDown,
  RefreshCw,
  Archive,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type MessageType = 'text' | 'file' | 'image' | 'card' | 'system'
export type MessageDirection = 'sent' | 'received'
export type SortOrder = 'asc' | 'desc'
export type SortField = 'timestamp' | 'sender' | 'recipient'

export interface SearchFilter {
  query: string
  type: MessageType[]
  direction: MessageDirection[]
  senderIds: string[]
  recipientIds: string[]
  dateRange: {
    start?: Date
    end?: Date
  }
  isPinned?: boolean
  isFavorite?: boolean
  hasAttachment?: boolean
  isRead?: boolean
  status: ('read' | 'unread' | 'delivered' | 'failed')[]
}

export interface MessageItem {
  id: string
  type: MessageType
  content: string
  direction: MessageDirection
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole?: string
  recipientId: string
  recipientName: string
  timestamp: Date
  readAt?: Date
  deliveredAt?: Date
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  isPinned: boolean
  isFavorite: boolean
  attachmentCount: number
  attachmentNames?: string[]
  relatedMessageId?: string
  threadId?: string
  tags: string[]
  auditInfo?: {
    createdAt: Date
    modifiedAt?: Date
    modifiedBy?: string
  }
}

export interface SearchStats {
  total: number
  unread: number
  pinned: number
  favorites: number
  withAttachments: number
  byType: Record<MessageType, number>
}

export interface MessageSearchManagerProps {
  className?: string
  messages: MessageItem[]
  onMessageClick?: (message: MessageItem) => void
  onMessagesExport?: (messages: MessageItem[]) => void
  onMessageDelete?: (messageId: string) => void
  onMessagePin?: (messageId: string) => void
  onMessageFavorite?: (messageId: string) => void
  onMessagesBulkDelete?: (messageIds: string[]) => void
  onFilterChange?: (filter: SearchFilter) => void
  onSearch?: (query: string) => void
}

// ==================== Mock Data ====================

const mockMessages: MessageItem[] = [
  {
    id: 'msg-1',
    type: 'text',
    content: '你好！关于上周会议的纪要已经整理完成，请查收。',
    direction: 'received',
    senderId: 'user-1',
    senderName: '张三',
    senderRole: '项目经理',
    recipientId: 'current-user',
    recipientName: '我',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'read',
    isPinned: true,
    isFavorite: true,
    attachmentCount: 1,
    attachmentNames: ['会议纪要_2024.pdf'],
    tags: ['会议', '重要'],
  },
  {
    id: 'msg-2',
    type: 'text',
    content: '收到，感谢！我会尽快处理这份文档。',
    direction: 'sent',
    senderId: 'current-user',
    senderName: '我',
    recipientId: 'user-1',
    recipientName: '张三',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    status: 'delivered',
    isPinned: false,
    isFavorite: false,
    attachmentCount: 0,
    tags: [],
  },
  {
    id: 'msg-3',
    type: 'file',
    content: '收到新文件：项目计划_v2.docx',
    direction: 'received',
    senderId: 'agent-1',
    senderName: 'AI助手',
    senderRole: '智能助理',
    recipientId: 'current-user',
    recipientName: '我',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'read',
    isPinned: false,
    isFavorite: true,
    attachmentCount: 1,
    attachmentNames: ['项目计划_v2.docx'],
    tags: ['项目', '计划'],
  },
  {
    id: 'msg-4',
    type: 'text',
    content: '系统通知：明天上午10点有全员会议，请准时参加。',
    direction: 'received',
    senderId: 'system',
    senderName: '系统',
    recipientId: 'current-user',
    recipientName: '我',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'delivered',
    isPinned: false,
    isFavorite: false,
    attachmentCount: 0,
    tags: ['系统', '会议'],
  },
  {
    id: 'msg-5',
    type: 'image',
    content: '截图分享：数据看板预览',
    direction: 'sent',
    senderId: 'current-user',
    senderName: '我',
    recipientId: 'user-2',
    recipientName: '李四',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'read',
    isPinned: false,
    isFavorite: false,
    attachmentCount: 1,
    attachmentNames: ['数据看板.png'],
    tags: ['截图'],
  },
  {
    id: 'msg-6',
    type: 'card',
    content: '任务卡片：完成Q1季度报告 - 待审核',
    direction: 'received',
    senderId: 'agent-2',
    senderName: '任务助手',
    senderRole: '任务管理',
    recipientId: 'current-user',
    recipientName: '我',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'read',
    isPinned: true,
    isFavorite: false,
    attachmentCount: 0,
    tags: ['任务', 'Q1'],
  },
  {
    id: 'msg-7',
    type: 'text',
    content: '抱歉，这条消息发送失败了，请重试。',
    direction: 'sent',
    senderId: 'current-user',
    senderName: '我',
    recipientId: 'user-3',
    recipientName: '王五',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'failed',
    isPinned: false,
    isFavorite: false,
    attachmentCount: 0,
    tags: [],
  },
]

// ==================== Helper Functions ====================

function getMessageTypeIcon(type: MessageType) {
  switch (type) {
    case 'text':
      return <MessageSquare className="h-4 w-4" />
    case 'file':
      return <FileText className="h-4 w-4" />
    case 'image':
      return <Image className="h-4 w-4" />
    case 'card':
      return <Tag className="h-4 w-4" />
    case 'system':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}

function getMessageTypeColor(type: MessageType): string {
  switch (type) {
    case 'text':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'file':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    case 'image':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'card':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    case 'system':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function getStatusConfig(status: MessageItem['status']): { label: string; icon: React.ReactNode; color: string } {
  switch (status) {
    case 'sending':
      return { label: '发送中', icon: <RefreshCw className="h-3 w-3 animate-spin" />, color: 'text-muted-foreground' }
    case 'sent':
      return { label: '已发送', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-muted-foreground' }
    case 'delivered':
      return { label: '已送达', icon: <CheckCircle2 className="h-3 w-3 text-blue-500" />, color: 'text-blue-500' }
    case 'read':
      return { label: '已读', icon: <CheckCircle2 className="h-3 w-3 text-green-500" />, color: 'text-green-500' }
    case 'failed':
      return { label: '失败', icon: <XCircle className="h-3 w-3 text-red-500" />, color: 'text-red-500' }
    default:
      return { label: status, icon: null, color: '' }
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return date.toLocaleDateString('zh-CN')
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// ==================== Sub-Components ====================

interface MessageRowProps {
  message: MessageItem
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onClick?: () => void
  onPin?: () => void
  onFavorite?: () => void
  onDelete?: () => void
}

function MessageRow({
  message,
  isSelected,
  onSelect,
  onClick,
  onPin,
  onFavorite,
  onDelete,
}: MessageRowProps) {
  const statusConfig = getStatusConfig(message.status)

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50',
        isSelected && 'bg-muted',
        message.isPinned && 'border-l-2 border-l-blue-500',
        message.status === 'failed' && 'border-red-200 bg-red-50/50'
      )}
    >
      {/* Selection Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="mt-1"
      />

      {/* Direction Indicator */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          message.direction === 'sent'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        )}
      >
        {message.direction === 'sent' ? (
          <ArrowUpDown className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </div>

      {/* Type Icon */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          getMessageTypeColor(message.type)
        )}
      >
        {getMessageTypeIcon(message.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{message.senderName}</span>
          {message.senderRole && (
            <span className="text-xs text-muted-foreground">({message.senderRole})</span>
          )}
          {message.isPinned && <Pin className="h-3 w-3 text-blue-500" />}
          {message.isFavorite && <Star className="h-3 w-3 text-yellow-500" />}
          <Badge variant="outline" className="text-xs">
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {message.content}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(message.timestamp)}
          </span>
          {message.attachmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {message.attachmentCount}
            </span>
          )}
          {message.tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {message.tags.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onPin?.()
          }}
        >
          {message.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onFavorite?.()
          }}
        >
          {message.isFavorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>消息操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.()}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Archive className="h-4 w-4 mr-2" />
              归档
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface FilterPanelProps {
  filter: SearchFilter
  onFilterChange: (filter: SearchFilter) => void
}

function FilterPanel({ filter, onFilterChange }: FilterPanelProps) {
  const messageTypes: MessageType[] = ['text', 'file', 'image', 'card', 'system']
  const statuses = ['read', 'unread', 'delivered', 'failed'] as const

  const toggleType = (type: MessageType) => {
    const types = filter.type.includes(type)
      ? filter.type.filter((t) => t !== type)
      : [...filter.type, type]
    onFilterChange({ ...filter, type: types })
  }

  const toggleStatus = (status: typeof statuses[number]) => {
    const statusList = filter.status.includes(status)
      ? filter.status.filter((s) => s !== status)
      : [...filter.status, status]
    onFilterChange({ ...filter, status: statusList })
  }

  return (
    <div className="space-y-4 p-4 border-b">
      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter.isPinned ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filter, isPinned: filter.isPinned ? undefined : true })}
        >
          <Pin className="h-4 w-4 mr-1" />
          置顶
        </Button>
        <Button
          variant={filter.isFavorite ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filter, isFavorite: filter.isFavorite ? undefined : true })}
        >
          <Star className="h-4 w-4 mr-1" />
          收藏
        </Button>
        <Button
          variant={filter.hasAttachment ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filter, hasAttachment: filter.hasAttachment ? undefined : true })}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          有附件
        </Button>
        <Button
          variant={filter.isRead === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filter, isRead: filter.isRead === false ? undefined : false })}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          未读
        </Button>
      </div>

      {/* Type Filter */}
      <div>
        <p className="text-sm font-medium mb-2">消息类型</p>
        <div className="flex items-center gap-2 flex-wrap">
          {messageTypes.map((type) => (
            <Badge
              key={type}
              variant={filter.type.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleType(type)}
            >
              {getMessageTypeIcon(type)}
              <span className="ml-1">
                {type === 'text' ? '文本' : type === 'file' ? '文件' : type === 'image' ? '图片' : type === 'card' ? '卡片' : '系统'}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <p className="text-sm font-medium mb-2">状态</p>
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map((status) => (
            <Badge
              key={status}
              variant={filter.status.includes(status) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleStatus(status)}
            >
              {status === 'read' ? '已读' : status === 'unread' ? '未读' : status === 'delivered' ? '已送达' : '失败'}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function MessageSearchManager({
  className,
  messages: messagesProp,
  onMessageClick,
  onMessagesExport,
  onMessageDelete,
  onMessagePin,
  onMessageFavorite,
  onMessagesBulkDelete,
  onFilterChange,
}: MessageSearchManagerProps) {
  const [messages, setMessages] = useState<MessageItem[]>(messagesProp || mockMessages)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<SearchFilter>({
    query: '',
    type: [],
    direction: [],
    senderIds: [],
    recipientIds: [],
    dateRange: {},
    status: [],
  })
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'favorites'>('all')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Stats
  const stats: SearchStats = useMemo(() => {
    return {
      total: messages.length,
      unread: messages.filter((m) => m.status !== 'read' && m.direction === 'received').length,
      pinned: messages.filter((m) => m.isPinned).length,
      favorites: messages.filter((m) => m.isFavorite).length,
      withAttachments: messages.filter((m) => m.attachmentCount > 0).length,
      byType: {
        text: messages.filter((m) => m.type === 'text').length,
        file: messages.filter((m) => m.type === 'file').length,
        image: messages.filter((m) => m.type === 'image').length,
        card: messages.filter((m) => m.type === 'card').length,
        system: messages.filter((m) => m.type === 'system').length,
      },
    }
  }, [messages])

  // Filtered & Sorted messages
  const filteredMessages = useMemo(() => {
    let result = [...messages]

    // Tab filter
    switch (activeTab) {
      case 'pinned':
        result = result.filter((m) => m.isPinned)
        break
      case 'favorites':
        result = result.filter((m) => m.isFavorite)
        break
    }

    // Query filter
    if (filter.query.trim()) {
      const query = filter.query.toLowerCase()
      result = result.filter(
        (m) =>
          m.content.toLowerCase().includes(query) ||
          m.senderName.toLowerCase().includes(query) ||
          m.recipientName.toLowerCase().includes(query) ||
          m.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // Type filter
    if (filter.type.length > 0) {
      result = result.filter((m) => filter.type.includes(m.type))
    }

    // Direction filter
    if (filter.direction.length > 0) {
      result = result.filter((m) => filter.direction.includes(m.direction))
    }

    // Status filter
    if (filter.status.length > 0) {
      result = result.filter((m) => {
        if (filter.status.includes('unread') && m.status !== 'read') return true
        return filter.status.includes(m.status as 'read' | 'delivered' | 'failed')
      })
    }

    // Pinned filter
    if (filter.isPinned !== undefined) {
      result = result.filter((m) => m.isPinned === filter.isPinned)
    }

    // Favorite filter
    if (filter.isFavorite !== undefined) {
      result = result.filter((m) => m.isFavorite === filter.isFavorite)
    }

    // Attachment filter
    if (filter.hasAttachment !== undefined) {
      result = result.filter((m) =>
        filter.hasAttachment ? m.attachmentCount > 0 : m.attachmentCount === 0
      )
    }

    // Date range filter
    if (filter.dateRange.start) {
      result = result.filter((m) => m.timestamp >= filter.dateRange.start!)
    }
    if (filter.dateRange.end) {
      result = result.filter((m) => m.timestamp <= filter.dateRange.end!)
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime()
          break
        case 'sender':
          comparison = a.senderName.localeCompare(b.senderName)
          break
        case 'recipient':
          comparison = a.recipientName.localeCompare(b.recipientName)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [messages, activeTab, filter, sortField, sortOrder])

  // Handlers
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredMessages.map((m) => m.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (messageId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds)
    if (selected) {
      newSelected.add(messageId)
    } else {
      newSelected.delete(messageId)
    }
    setSelectedIds(newSelected)
  }

  const handlePin = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      )
    )
    onMessagePin?.(messageId)
  }

  const handleFavorite = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isFavorite: !m.isFavorite } : m
      )
    )
    onMessageFavorite?.(messageId)
  }

  const handleDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    onMessageDelete?.(messageId)
  }

  const handleBulkDelete = () => {
    setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)))
    onMessagesBulkDelete?.(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    onMessagesExport?.(filteredMessages.filter((m) => selectedIds.has(m.id)))
  }

  const handleFilterChange = (newFilter: SearchFilter) => {
    setFilter(newFilter)
    onFilterChange?.(newFilter)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">消息搜索与管理</h2>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedIds.size} 条
              </span>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索消息内容、发送者、标签..."
              value={filter.query}
              onChange={(e) => handleFilterChange({ ...filter, query: e.target.value })}
              className="pl-9"
            />
            {filter.query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => handleFilterChange({ ...filter, query: '' })}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant={showFilterPanel ? 'default' : 'outline'}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="h-4 w-4 mr-2" />
            筛选
            {(filter.type.length > 0 || filter.status.length > 0 || filter.isPinned || filter.isFavorite) && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filter.type.length + filter.status.length + (filter.isPinned ? 1 : 0) + (filter.isFavorite ? 1 : 0)}
              </Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                排序
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>排序方式</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortField('timestamp'); setSortOrder('desc'); }}>
                <Clock className="h-4 w-4 mr-2" />
                时间 {sortField === 'timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('sender'); setSortOrder('asc'); }}>
                <Users className="h-4 w-4 mr-2" />
                发送者 {sortField === 'sender' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('recipient'); setSortOrder('asc'); }}>
                <Bot className="h-4 w-4 mr-2" />
                接收者 {sortField === 'recipient' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">
              全部 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pinned">
              <Pin className="h-4 w-4 mr-1" />
              置顶 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.pinned}</Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-1" />
              收藏 <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.favorites}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <FilterPanel filter={filter} onFilterChange={handleFilterChange} />
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-4 border-b px-4 py-2 overflow-x-auto text-xs">
        <span className="text-muted-foreground">统计:</span>
        <span className="text-blue-600">{stats.unread} 未读</span>
        <span className="text-green-600">{stats.withAttachments} 有附件</span>
        <span>{stats.byType.text} 文本</span>
        <span>{stats.byType.file} 文件</span>
        <span>{stats.byType.image} 图片</span>
        <span>{stats.byType.card} 卡片</span>
        <span>{stats.byType.system} 系统</span>
      </div>

      {/* Message List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 p-2">
            <Checkbox
              checked={selectedIds.size === filteredMessages.length && filteredMessages.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              全选 ({filteredMessages.length} 条消息)
            </span>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">未找到匹配的消息</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                isSelected={selectedIds.has(message.id)}
                onSelect={(selected) => handleSelect(message.id, selected)}
                onClick={() => onMessageClick?.(message)}
                onPin={() => handlePin(message.id)}
                onFavorite={() => handleFavorite(message.id)}
                onDelete={() => handleDelete(message.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
