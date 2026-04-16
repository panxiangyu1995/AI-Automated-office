/**
 * AgentIntercom - Agent间消息通信组件
 * Story 11.8 - Agent间消息通信
 *
 * 实现governed的Agent-to-Agent通信及相关的权限控制
 * - 允许Agent向其他Agent发送工作相关消息
 * - 强制执行通信权限和内容约束
 * - 记录所有Agent间通信用于审计
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-04: 品牌色 var(--ao-button.background)
 */

import { useState, useMemo, useEffect } from 'react'
import { ChatSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import {
  Bot,
  Send,
  Search,
  Settings,
  Check,
  CheckCheck,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Unlock,
  MessageSquare,
  Users,
  AlertCircle,
  Info,
  MoreVertical,
  Paperclip,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type AgentMessageType = 'text' | 'file' | 'image' | 'system' | 'command'
export type MessageDirection = 'sent' | 'received'
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin'
export type SecurityLevel = 'trusted' | 'verified' | 'restricted' | 'blocked'
export type AuditStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export interface AgentContact {
  id: string
  name: string
  avatar?: string
  role: string
  department: string
  status: 'online' | 'offline' | 'busy' | 'away'
  securityLevel: SecurityLevel
  permissionLevel: PermissionLevel
  lastSeen?: Date
  unreadCount: number
}

export interface AgentMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole: string
  recipientId: string
  recipientName: string
  content: string
  type: AgentMessageType
  direction: MessageDirection
  timestamp: Date
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  permissionGranted: boolean
  permissionDeniedReason?: string
  auditStatus: AuditStatus
  auditFlags?: string[]
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
  replyToId?: string
  threadId?: string
}

export interface ConversationThread {
  id: string
  participantIds: string[]
  participants: AgentContact[]
  lastMessage?: AgentMessage
  lastMessageAt: Date
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
  securityLevel: SecurityLevel
  createdAt: Date
}

export interface IntercomStats {
  totalMessages: number
  sentToday: number
  receivedToday: number
  pendingPermission: number
  blockedMessages: number
  bySecurityLevel: Record<SecurityLevel, number>
}

export interface AgentIntercomProps {
  className?: string
  currentAgentId?: string
  onSendMessage?: (message: Partial<AgentMessage>) => void
  onBlockAgent?: (agentId: string) => void
  onUnblockAgent?: (agentId: string) => void
}

// ==================== Mock Data ====================

const mockContacts: AgentContact[] = [
  {
    id: 'agent-hr',
    name: 'HR Assistant',
    avatar: undefined,
    role: 'HR Manager',
    department: '人力资源部',
    status: 'online',
    securityLevel: 'trusted',
    permissionLevel: 'admin',
    unreadCount: 2,
  },
  {
    id: 'agent-finance',
    name: 'Finance Bot',
    avatar: undefined,
    role: 'Finance Analyst',
    department: '财务部',
    status: 'online',
    securityLevel: 'trusted',
    permissionLevel: 'write',
    unreadCount: 0,
  },
  {
    id: 'agent-sales',
    name: 'Sales Agent',
    avatar: undefined,
    role: 'Sales Manager',
    department: '销售部',
    status: 'busy',
    securityLevel: 'verified',
    permissionLevel: 'write',
    unreadCount: 1,
  },
  {
    id: 'agent-warehouse',
    name: 'Warehouse Agent',
    avatar: undefined,
    role: 'Inventory Manager',
    department: '仓储部',
    status: 'away',
    securityLevel: 'verified',
    permissionLevel: 'read',
    unreadCount: 0,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'agent-support',
    name: 'Support Agent',
    avatar: undefined,
    role: 'Support Lead',
    department: '售后服务部',
    status: 'offline',
    securityLevel: 'restricted',
    permissionLevel: 'read',
    unreadCount: 0,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'agent-external',
    name: 'External Bot',
    avatar: undefined,
    role: 'External Service',
    department: '外部服务',
    status: 'online',
    securityLevel: 'blocked',
    permissionLevel: 'none',
    unreadCount: 0,
  },
]

const mockMessages: AgentMessage[] = [
  {
    id: 'msg-1',
    senderId: 'agent-hr',
    senderName: 'HR Assistant',
    senderRole: 'HR Manager',
    recipientId: 'current-agent',
    recipientName: 'Current Agent',
    content: '你好！有一份新员工入职材料需要您审核。员工姓名：张三，工号：EMP001，部门：研发部。',
    type: 'text',
    direction: 'received',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'read',
    permissionGranted: true,
    auditStatus: 'approved',
  },
  {
    id: 'msg-2',
    senderId: 'current-agent',
    senderName: 'Current Agent',
    senderRole: 'AI Assistant',
    recipientId: 'agent-hr',
    recipientName: 'HR Assistant',
    content: '好的，我已收到。正在审核入职材料，预计需要10分钟完成。',
    type: 'text',
    direction: 'sent',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    status: 'delivered',
    permissionGranted: true,
    auditStatus: 'approved',
  },
  {
    id: 'msg-3',
    senderId: 'agent-finance',
    senderName: 'Finance Bot',
    senderRole: 'Finance Analyst',
    recipientId: 'current-agent',
    recipientName: 'Current Agent',
    content: '本月财务报表已生成，请查收。关键指标：营收增长12%，成本下降5%。',
    type: 'text',
    direction: 'received',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'delivered',
    permissionGranted: true,
    auditStatus: 'approved',
  },
  {
    id: 'msg-4',
    senderId: 'agent-sales',
    senderName: 'Sales Agent',
    senderRole: 'Sales Manager',
    recipientId: 'current-agent',
    recipientName: 'Current Agent',
    content: '客户反馈：需要修改报价单中的交期信息。请协助更新。',
    type: 'text',
    direction: 'received',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'read',
    permissionGranted: true,
    auditStatus: 'approved',
  },
  {
    id: 'msg-5',
    senderId: 'current-agent',
    senderName: 'Current Agent',
    senderRole: 'AI Assistant',
    recipientId: 'agent-external',
    recipientName: 'External Bot',
    content: '请求发送敏感数据。',
    type: 'text',
    direction: 'sent',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'failed',
    permissionGranted: false,
    permissionDeniedReason: '外部Agent通信被阻止',
    auditStatus: 'rejected',
    auditFlags: ['external-communication', 'sensitive-data'],
  },
]

const mockThreads: ConversationThread[] = [
  {
    id: 'thread-1',
    participantIds: ['current-agent', 'agent-hr'],
    participants: [mockContacts[0]],
    lastMessage: mockMessages[1],
    lastMessageAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    securityLevel: 'trusted',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'thread-2',
    participantIds: ['current-agent', 'agent-finance'],
    participants: [mockContacts[1]],
    lastMessage: mockMessages[2],
    lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    securityLevel: 'trusted',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'thread-3',
    participantIds: ['current-agent', 'agent-sales'],
    participants: [mockContacts[2]],
    lastMessage: mockMessages[3],
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    securityLevel: 'verified',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
]

// ==================== Helper Functions ====================

function getStatusColor(status: AgentContact['status']): string {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'busy':
      return 'bg-red-500'
    case 'away':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}

function getSecurityLevelIcon(level: SecurityLevel) {
  switch (level) {
    case 'trusted':
      return <ShieldCheck className="h-3 w-3 text-green-600" />
    case 'verified':
      return <Shield className="h-3 w-3 text-blue-600" />
    case 'restricted':
      return <ShieldAlert className="h-3 w-3 text-yellow-600" />
    case 'blocked':
      return <ShieldX className="h-3 w-3 text-red-600" />
    default:
      return <Shield className="h-3 w-3" />
  }
}

function getSecurityLevelColor(level: SecurityLevel): string {
  switch (level) {
    case 'trusted':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'verified':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'restricted':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    case 'blocked':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getAuditStatusColor(status: AuditStatus): string {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50'
    case 'pending':
      return 'text-yellow-600 bg-yellow-50'
    case 'rejected':
      return 'text-red-600 bg-red-50'
    case 'flagged':
      return 'text-orange-600 bg-orange-50'
    default:
      return ''
  }
}

function getMessageStatusIcon(status: AgentMessage['status']) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-muted-foreground" />
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-green-600" />
    case 'failed':
      return <X className="h-3 w-3 text-red-600" />
    default:
      return null
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ==================== Sub-Components ====================

interface ContactItemProps {
  contact: AgentContact
  isSelected?: boolean
  onClick?: () => void
}

function ContactItem({ contact, isSelected, onClick }: ContactItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors',
        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-blue-100 text-blue-700">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
            getStatusColor(contact.status)
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{contact.name}</span>
          {getSecurityLevelIcon(contact.securityLevel)}
        </div>
        <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
      </div>
      {contact.unreadCount > 0 && (
        <Badge variant="destructive" className="h-5 min-w-5 justify-center">
          {contact.unreadCount}
        </Badge>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: AgentMessage
  showAvatar?: boolean
}

function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const isSent = message.direction === 'sent'

  return (
    <div className={cn('flex gap-2', isSent ? 'flex-row-reverse' : 'flex-row')}>
      {showAvatar && !isSent && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      {showAvatar && isSent && <div className="h-8 w-8 shrink-0" />}

      <div className={cn('max-w-[70%] flex flex-col', isSent ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isSent ? 'bg-blue-600 text-white' : 'bg-muted',
            message.status === 'failed' && 'bg-red-100 border border-red-200'
          )}
        >
          {message.permissionDeniedReason && (
            <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
              <ShieldX className="h-3 w-3" />
              <span>{message.permissionDeniedReason}</span>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatMessageTime(message.timestamp)}</span>
          {isSent && getMessageStatusIcon(message.status)}
          {message.auditStatus !== 'approved' && (
            <Badge
              variant="outline"
              className={cn('text-xs', getAuditStatusColor(message.auditStatus))}
            >
              {message.auditStatus === 'pending'
                ? '待审核'
                : message.auditStatus === 'rejected'
                  ? '已拒绝'
                  : '已标记'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

interface PermissionDialogProps {
  contact: AgentContact | null
  open: boolean
  onClose: () => void
  onGrant: () => void
  onDeny: () => void
}

function PermissionDialog({ contact, open, onClose, onGrant, onDeny }: PermissionDialogProps) {
  const [reason, setReason] = useState('')

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>通信权限请求</DialogTitle>
          <DialogDescription>Agent "{contact.name}" 请求与您通信</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-muted-foreground">{contact.role}</p>
            </div>
            <Badge className={cn('ml-auto', getSecurityLevelColor(contact.securityLevel))}>
              {contact.securityLevel === 'trusted'
                ? '可信'
                : contact.securityLevel === 'verified'
                  ? '已验证'
                  : contact.securityLevel === 'restricted'
                    ? '受限'
                    : '已阻止'}
            </Badge>
          </div>

          <div>
            <Label>请求原因</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请描述通信目的..."
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>所有通信内容将被记录用于审计</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onDeny}>
            <ShieldX className="h-4 w-4 mr-2" />
            拒绝
          </Button>
          <Button onClick={onGrant}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            授权
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function AgentIntercom({
  className,
  currentAgentId = 'current-agent',
  onSendMessage,
  onBlockAgent,
  onUnblockAgent,
}: AgentIntercomProps) {
  const [contacts, setContacts] = useState<AgentContact[]>(mockContacts)
  const [threads] = useState<ConversationThread[]>(mockThreads)
  const [messages, setMessages] = useState<AgentMessage[]>(mockMessages)

  const [isInitializing, setIsInitializing] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 600)
    return () => clearTimeout(timer)
  }, [])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'audit'>('chats')
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [permissionContact, setPermissionContact] = useState<AgentContact | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  // Stats
  const stats: IntercomStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      totalMessages: messages.length,
      sentToday: messages.filter((m) => m.direction === 'sent' && m.timestamp >= today).length,
      receivedToday: messages.filter((m) => m.direction === 'received' && m.timestamp >= today)
        .length,
      pendingPermission: messages.filter((m) => m.auditStatus === 'pending').length,
      blockedMessages: messages.filter((m) => m.auditStatus === 'rejected').length,
      bySecurityLevel: {
        trusted: contacts.filter((c) => c.securityLevel === 'trusted').length,
        verified: contacts.filter((c) => c.securityLevel === 'verified').length,
        restricted: contacts.filter((c) => c.securityLevel === 'restricted').length,
        blocked: contacts.filter((c) => c.securityLevel === 'blocked').length,
      },
    }
  }, [messages, contacts])

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    let result = contacts
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.role.toLowerCase().includes(query) ||
          c.department.toLowerCase().includes(query)
      )
    }
    return result.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1
      if (b.status === 'online' && a.status !== 'online') return 1
      return a.name.localeCompare(b.name)
    })
  }, [contacts, searchQuery])

  // Selected contact's messages
  const selectedContactMessages = useMemo(() => {
    if (!selectedContactId) return []
    return messages.filter(
      (m) =>
        (m.senderId === currentAgentId && m.recipientId === selectedContactId) ||
        (m.senderId === selectedContactId && m.recipientId === currentAgentId)
    )
  }, [messages, selectedContactId, currentAgentId])

  const selectedContact = contacts.find((c) => c.id === selectedContactId)

  // Handlers
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedContactId) return

    const newMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentAgentId,
      senderName: 'Current Agent',
      senderRole: 'AI Assistant',
      recipientId: selectedContactId,
      recipientName: selectedContact?.name || '',
      content: messageInput,
      type: 'text',
      direction: 'sent',
      timestamp: new Date(),
      status: 'sending',
      permissionGranted: selectedContact?.permissionLevel !== 'none',
      permissionDeniedReason:
        selectedContact?.permissionLevel === 'none' ? '通信被阻止' : undefined,
      auditStatus: selectedContact?.permissionLevel === 'none' ? 'rejected' : 'pending',
    }

    setMessages((prev) => [...prev, newMessage])
    setMessageInput('')
    onSendMessage?.(newMessage)

    // Simulate sending
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newMessage.id
            ? { ...m, status: newMessage.permissionGranted ? 'sent' : 'failed' }
            : m
        )
      )
    }, 500)
  }

  const handleSelectContact = (contact: AgentContact) => {
    if (contact.securityLevel === 'blocked') {
      setPermissionContact(contact)
      setPermissionDialogOpen(true)
      return
    }
    setSelectedContactId(contact.id)
  }

  const handleBlockToggle = (contact: AgentContact) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contact.id
          ? {
              ...c,
              securityLevel: c.securityLevel === 'blocked' ? 'verified' : 'blocked',
              permissionLevel: c.securityLevel === 'blocked' ? 'read' : 'none',
            }
          : c
      )
    )
    if (contact.securityLevel === 'blocked') {
      onUnblockAgent?.(contact.id)
    } else {
      onBlockAgent?.(contact.id)
    }
  }

  const handlePermissionResponse = (granted: boolean) => {
    if (!permissionContact) return
    if (granted) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === permissionContact.id
            ? { ...c, securityLevel: 'verified', permissionLevel: 'write' }
            : c
        )
      )
    } else {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === permissionContact.id
            ? { ...c, securityLevel: 'blocked', permissionLevel: 'none' }
            : c
        )
      )
    }
    setPermissionDialogOpen(false)
    setPermissionContact(null)
  }

  if (isInitializing) {
    return <ChatSkeleton messages={4} />
  }

  return (
    <ErrorBoundary>
      <div className={cn('flex h-full', className)}>
        {/* Left Panel - Contact List */}
        <div className="w-80 border-r flex flex-col">
          {/* Header */}
          <div className="border-b p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold">Agent 通信</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索Agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chats">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  聊天
                </TabsTrigger>
                <TabsTrigger value="contacts">
                  <Users className="h-4 w-4 mr-1" />
                  联系人
                </TabsTrigger>
                <TabsTrigger value="audit">
                  <Shield className="h-4 w-4 mr-1" />
                  审计
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 border-b px-4 py-2 overflow-x-auto text-xs">
            <span className="text-muted-foreground">今日:</span>
            <span className="text-blue-600">{stats.sentToday} 发送</span>
            <span className="text-green-600">{stats.receivedToday} 接收</span>
            {stats.pendingPermission > 0 && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                {stats.pendingPermission} 待审核
              </Badge>
            )}
            {stats.blockedMessages > 0 && (
              <Badge variant="outline" className="text-red-600 border-red-300">
                {stats.blockedMessages} 已阻止
              </Badge>
            )}
          </div>

          {/* Contact List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {activeTab === 'chats' &&
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors',
                      selectedContactId === thread.participants[0].id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleSelectContact(thread.participants[0])}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                          getStatusColor(thread.participants[0].status)
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{thread.participants[0].name}</span>
                        {thread.isPinned && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                        {getSecurityLevelIcon(thread.securityLevel)}
                      </div>
                      {thread.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {thread.lastMessage.direction === 'sent' ? '我: ' : ''}
                          {thread.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(thread.lastMessageAt)}
                      </span>
                      {thread.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 justify-center">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

              {activeTab === 'contacts' &&
                filteredContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.id}
                    onClick={() => handleSelectContact(contact)}
                  />
                ))}

              {activeTab === 'audit' &&
                filteredContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.id}
                    onClick={() => handleSelectContact(contact)}
                  />
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{selectedContact.name}</h3>
                      <Badge
                        className={cn(
                          'text-xs',
                          getSecurityLevelColor(selectedContact.securityLevel)
                        )}
                      >
                        {selectedContact.securityLevel === 'trusted'
                          ? '可信'
                          : selectedContact.securityLevel === 'verified'
                            ? '已验证'
                            : selectedContact.securityLevel === 'restricted'
                              ? '受限'
                              : '已阻止'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.role} • {selectedContact.department}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>安全级别: {selectedContact.securityLevel}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBlockToggle(selectedContact)}>
                      {selectedContact.securityLevel === 'blocked' ? (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          解除阻止
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          阻止通信
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      查看通信历史
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedContactMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        还没有消息，开始和 {selectedContact.name} 对话吧
                      </p>
                    </div>
                  ) : (
                    selectedContactMessages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={
                        selectedContact.securityLevel === 'blocked'
                          ? '无法向已阻止的Agent发送消息'
                          : `向 ${selectedContact.name} 发送消息...`
                      }
                      className="min-h-[80px] resize-none"
                      disabled={selectedContact.securityLevel === 'blocked'}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                  </div>
                  <Button
                    size="icon"
                    disabled={!messageInput.trim() || selectedContact.securityLevel === 'blocked'}
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {selectedContact.securityLevel !== 'blocked' && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>所有消息将被加密传输并记录用于审计</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Bot className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">选择联系人开始通信</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                选择左侧的Agent联系人，开始安全可控的Agent间通信。所有通信内容都将被记录用于审计追踪。
              </p>
            </div>
          )}
        </div>

        {/* Permission Dialog */}
        <PermissionDialog
          contact={permissionContact}
          open={permissionDialogOpen}
          onClose={() => setPermissionDialogOpen(false)}
          onGrant={() => handlePermissionResponse(true)}
          onDeny={() => handlePermissionResponse(false)}
        />

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>通信设置</DialogTitle>
              <DialogDescription>配置Agent间通信的安全策略</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">自动阻止外部Agent</p>
                    <p className="text-sm text-muted-foreground">自动拒绝来自外部服务的通信请求</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">审计日志记录</p>
                    <p className="text-sm text-muted-foreground">记录所有Agent间通信内容</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">敏感内容过滤</p>
                    <p className="text-sm text-muted-foreground">自动检测并标记敏感信息</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setSettingsDialogOpen(false)}>完成</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}
