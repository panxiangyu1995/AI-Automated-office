/**
 * Group Chat - Story 11.4
 * 群组创建与管理 - 群组聊天基础功能
 *
 * 功能：
 * - 创建群组会话和管理成员
 * - 持久化群组级权限和角色
 * - 支持群组消息历史和未读状态
 *
 * 铁律合规：
 * - FR613, FR614, FR615, FR616, FR617, FR618, FR619
 * - NFR1
 * - ADR-037
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  Send,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  File,
  X,
  Trash2,
  Users,
  Plus,
  Settings,
  UserPlus,
  UserMinus,
  Shield,
  ShieldCheck,
  Crown,
  VolumeX,
  BellOff,
  Search as SearchIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Types
export type GroupRole = 'owner' | 'admin' | 'member'

export type GroupMemberStatus = 'active' | 'muted' | 'left'

export interface GroupMember {
  id: string
  userId: string
  name: string
  avatar?: string
  role: GroupRole
  status: GroupMemberStatus
  joinedAt: string
  isCurrentUser?: boolean
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessageType = 'text' | 'image' | 'file' | 'system'

export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole: GroupRole
  content: string
  type: MessageType
  status: MessageStatus
  timestamp: string
  attachments?: GroupAttachment[]
  replyTo?: string
  isSystem?: boolean
}

export interface GroupAttachment {
  id: string
  type: 'image' | 'file'
  name: string
  size: number
  url?: string
  thumbnail?: string
}

export interface Group {
  id: string
  name: string
  avatar?: string
  description?: string
  ownerId: string
  memberCount: number
  members: GroupMember[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  messages: GroupMessage[]
  createdAt: string
  isJoined: boolean
}

export interface GroupChatStats {
  totalGroups: number
  totalMessages: number
  unreadMessages: number
  joinedGroups: number
}

export interface GroupChatProps {
  currentUserId: string
  groups: Group[]
  onSendMessage: (groupId: string, content: string, type?: MessageType) => void
  onDeleteMessage?: (messageId: string) => void
  onCreateGroup?: (name: string, description?: string, memberIds?: string[]) => void
  onJoinGroup?: (groupId: string) => void
  onLeaveGroup?: (groupId: string) => void
  onAddMember?: (groupId: string, userId: string) => void
  onRemoveMember?: (groupId: string, userId: string) => void
  onChangeMemberRole?: (groupId: string, userId: string, role: GroupRole) => void
  onMuteMember?: (groupId: string, userId: string) => void
  onMarkAsRead?: (groupId: string) => void
  onSearchMessages?: (query: string) => GroupMessage[]
}

// Mock current user
const CURRENT_USER_ID = 'current-user'

// Mock data
const MOCK_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: '技术部交流群',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=tech',
    description: '技术部内部交流群',
    ownerId: 'emp-1',
    memberCount: 12,
    createdAt: '2026-01-15',
    lastMessage: '有新任务了，大家看看',
    lastMessageTime: '10:35',
    unreadCount: 5,
    isJoined: true,
    members: [
      {
        id: 'gm-1',
        userId: 'emp-1',
        name: '张小明',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-01-15',
        isCurrentUser: false,
      },
      {
        id: 'gm-2',
        userId: CURRENT_USER_ID,
        name: '当前用户',
        role: 'admin',
        status: 'active',
        joinedAt: '2026-01-15',
        isCurrentUser: true,
      },
      {
        id: 'gm-3',
        userId: 'emp-2',
        name: '李婷婷',
        role: 'member',
        status: 'active',
        joinedAt: '2026-01-16',
      },
      {
        id: 'gm-4',
        userId: 'emp-3',
        name: '王建国',
        role: 'member',
        status: 'muted',
        joinedAt: '2026-01-17',
      },
    ],
    messages: [
      {
        id: 'gmsg-1-1',
        groupId: 'group-1',
        senderId: 'emp-1',
        senderName: '张小明',
        senderRole: 'owner',
        content: '大家好，有新任务了',
        type: 'text',
        status: 'read',
        timestamp: '10:30',
      },
      {
        id: 'gmsg-1-2',
        groupId: 'group-1',
        senderId: CURRENT_USER_ID,
        senderName: '当前用户',
        senderRole: 'admin',
        content: '收到，马上看看',
        type: 'text',
        status: 'read',
        timestamp: '10:32',
      },
      {
        id: 'gmsg-1-3',
        groupId: 'group-1',
        senderId: 'emp-1',
        senderName: '张小明',
        senderRole: 'owner',
        content: '有新任务了，大家看看',
        type: 'text',
        status: 'read',
        timestamp: '10:35',
      },
    ],
  },
  {
    id: 'group-2',
    name: '产品讨论组',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=product',
    description: '产品需求讨论',
    ownerId: 'emp-3',
    memberCount: 8,
    createdAt: '2026-02-01',
    lastMessage: '需求评审会议定在周三',
    lastMessageTime: '昨天',
    unreadCount: 0,
    isJoined: true,
    members: [
      {
        id: 'gm-5',
        userId: 'emp-3',
        name: '王建国',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-02-01',
      },
      {
        id: 'gm-6',
        userId: CURRENT_USER_ID,
        name: '当前用户',
        role: 'member',
        status: 'active',
        joinedAt: '2026-02-02',
        isCurrentUser: true,
      },
    ],
    messages: [
      {
        id: 'gmsg-2-1',
        groupId: 'group-2',
        senderId: 'emp-3',
        senderName: '王建国',
        senderRole: 'owner',
        content: '需求评审会议定在周三',
        type: 'text',
        status: 'read',
        timestamp: '昨天 14:00',
      },
    ],
  },
  {
    id: 'group-3',
    name: '新人欢迎群',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=welcome',
    description: '欢迎新同事加入',
    ownerId: 'emp-6',
    memberCount: 45,
    createdAt: '2025-06-01',
    lastMessage: '欢迎新同事！',
    lastMessageTime: '3天前',
    unreadCount: 0,
    isJoined: false,
    members: [],
    messages: [],
  },
]

// Calculate stats
function calculateStats(groups: Group[]): GroupChatStats {
  const totalMessages = groups.reduce((sum, g) => sum + g.messages.length, 0)
  const unreadMessages = groups.reduce((sum, g) => sum + g.unreadCount, 0)
  const joinedGroups = groups.filter((g) => g.isJoined).length

  return {
    totalGroups: groups.length,
    totalMessages,
    unreadMessages,
    joinedGroups,
  }
}

// Get role badge color
function getRoleBadgeColor(role: GroupRole): string {
  switch (role) {
    case 'owner':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'admin':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'member':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

// Get role text
function getRoleText(role: GroupRole): string {
  switch (role) {
    case 'owner':
      return '群主'
    case 'admin':
      return '管理员'
    case 'member':
      return '成员'
    default:
      return '成员'
  }
}

// Get role icon
function getRoleIcon(role: GroupRole) {
  switch (role) {
    case 'owner':
      return <Crown className="h-3 w-3" />
    case 'admin':
      return <ShieldCheck className="h-3 w-3" />
    default:
      return <Shield className="h-3 w-3" />
  }
}

// Get message status icon
function getStatusIcon(status: MessageStatus) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-slate-400" />
    case 'sent':
      return <Check className="h-3 w-3 text-slate-400" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-slate-400" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    case 'failed':
      return <X className="h-3 w-3 text-red-500" />
    default:
      return null
  }
}

// Message bubble component
interface MessageBubbleProps {
  message: GroupMessage
  isOwn: boolean
  onDelete?: (messageId: string) => void
  onReply?: (messageId: string) => void
}

function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isOwn && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>{message.senderName.slice(0, 2)}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 ${
          isOwn ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-800'
        }`}
      >
        {!isOwn && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium">{message.senderName}</span>
            <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(message.senderRole)}`}>
              {getRoleIcon(message.senderRole)}
              <span className="ml-1">{getRoleText(message.senderRole)}</span>
            </Badge>
          </div>
        )}
        {message.type === 'text' && <p className="text-sm">{message.content}</p>}

        {message.type === 'file' && message.attachments && (
          <div className={`flex items-center gap-2 p-2 rounded ${isOwn ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <File className="h-4 w-4" />
            <span className="text-xs truncate">{message.attachments[0].name}</span>
          </div>
        )}

        {message.type === 'system' && (
          <p className="text-xs text-slate-500 italic text-center">{message.content}</p>
        )}

        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
            {message.timestamp}
          </span>
          {isOwn && getStatusIcon(message.status)}
        </div>

        {/* Context menu */}
        {isOwn && message.status !== 'failed' && (
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete?.(message.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

// Member list item
interface MemberItemProps {
  member: GroupMember
  currentUserRole: GroupRole
  onRemove?: (userId: string) => void
  onChangeRole?: (userId: string, role: GroupRole) => void
  onMute?: (userId: string) => void
}

function MemberItem({ member, currentUserRole, onRemove, onChangeRole, onMute }: MemberItemProps) {
  const canManage = currentUserRole === 'owner' || (currentUserRole === 'admin' && member.role !== 'owner')

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar} />
          <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        {member.status === 'muted' && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <BellOff className="h-2 w-2 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">
            {member.name}
            {member.isCurrentUser && <span className="text-slate-400 ml-1">(我)</span>}
          </span>
          <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(member.role)}`}>
            {getRoleIcon(member.role)}
            <span className="ml-1">{getRoleText(member.role)}</span>
          </Badge>
        </div>
        <p className="text-xs text-slate-500">加入于 {member.joinedAt}</p>
      </div>
      {canManage && !member.isCurrentUser && member.role !== 'owner' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentUserRole === 'owner' && (
              <DropdownMenuItem onClick={() => onChangeRole?.(member.userId, 'admin')}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                设为管理员
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onMute?.(member.userId)}>
              <VolumeX className="h-4 w-4 mr-2" />
              {member.status === 'muted' ? '取消禁言' : '禁言'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onRemove?.(member.userId)}>
              <UserMinus className="h-4 w-4 mr-2" />
              移出群聊
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

/**
 * Group Chat Component
 */
export function GroupChat({
  currentUserId = CURRENT_USER_ID,
  groups: initialGroups,
  onSendMessage,
  onDeleteMessage,
  onCreateGroup,
  onJoinGroup: _onJoinGroup,
  onLeaveGroup,
  onAddMember: _onAddMember,
  onRemoveMember,
  onChangeMemberRole,
  onMuteMember,
  onMarkAsRead,
  onSearchMessages,
}: GroupChatProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups || MOCK_GROUPS)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    MOCK_GROUPS[0]?.id || null
  )
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [searchResults, setSearchResults] = useState<GroupMessage[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get selected group
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  )

  // Get current user role in selected group
  const currentUserRole = useMemo(() => {
    if (!selectedGroup) return 'member'
    const member = selectedGroup.members.find((m) => m.userId === currentUserId)
    return member?.role || 'member'
  }, [selectedGroup, currentUserId])

  // Stats
  const stats = useMemo(() => calculateStats(groups), [groups])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedGroup?.messages])

  // Mark as read when selecting group
  useEffect(() => {
    if (selectedGroupId && (selectedGroup?.unreadCount ?? 0) > 0) {
      onMarkAsRead?.(selectedGroupId)
      setGroups((prev) =>
        prev.map((g) => (g.id === selectedGroupId ? { ...g, unreadCount: 0 } : g))
      )
    }
  }, [selectedGroupId])

  // Handle send message
  const handleSend = () => {
    if (!messageInput.trim() || !selectedGroupId) return

    onSendMessage(selectedGroupId, messageInput.trim(), 'text')
    setMessageInput('')
  }

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return

    const results = onSearchMessages?.(searchQuery) || []
    setSearchResults(results)
    setShowSearchDialog(true)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle create group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    onCreateGroup?.(newGroupName.trim(), newGroupDesc.trim())
    setNewGroupName('')
    setNewGroupDesc('')
    setShowCreateDialog(false)
  }

  // Sort groups by last message time
  const sortedGroups = useMemo(
    () =>
      [...groups].sort((a, b) => {
        const timeA = a.lastMessageTime || ''
        const timeB = b.lastMessageTime || ''
        return timeB.localeCompare(timeA)
      }),
    [groups]
  )

  return (
    <div className="flex h-full bg-slate-50">
      {/* Group List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              群组聊天
            </h2>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              创建
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{stats.joinedGroups}</div>
              <div className="text-xs text-slate-500">已加入</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{stats.unreadMessages}</div>
              <div className="text-xs text-slate-500">未读</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-600">{stats.totalMessages}</div>
              <div className="text-xs text-slate-500">消息</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索群组..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Group List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-slate-100">
            {sortedGroups
              .filter((g) => g.isJoined)
              .map((group) => (
                <div
                  key={group.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${
                    selectedGroupId === group.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={group.avatar} />
                    <AvatarFallback>{group.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate">{group.name}</span>
                      <span className="text-xs text-slate-400">{group.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{group.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {group.memberCount}
                      </Badge>
                      {group.unreadCount > 0 && (
                        <Badge variant="default" className="bg-blue-500">
                          {group.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {sortedGroups.filter((g) => g.isJoined).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>暂无已加入的群组</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedGroup.avatar} />
                  <AvatarFallback>{selectedGroup.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-slate-800">{selectedGroup.name}</div>
                  <div className="text-xs text-slate-500">
                    {selectedGroup.memberCount} 位成员
                    {currentUserRole === 'owner' && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        群主
                      </Badge>
                    )}
                    {currentUserRole === 'admin' && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        管理员
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setShowMembersDialog(true)}>
                  <Users className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentUserRole === 'owner' && (
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        群设置
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onLeaveGroup?.(selectedGroup.id)}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      退出群聊
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {selectedGroup.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === currentUserId}
                    onDelete={onDeleteMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入群消息..."
                    className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <File className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSend} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p>选择一个群组开始聊天</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建群组</DialogTitle>
            <DialogDescription>创建一个新的群组聊天</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">群组名称</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="输入群组名称..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">群组描述（可选）</label>
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="输入群组描述..."
                className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>群成员</DialogTitle>
            <DialogDescription>
              共 {selectedGroup?.members.length || 0} 位成员
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-80">
            <div className="space-y-1 py-4">
              {selectedGroup?.members.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  currentUserRole={currentUserRole}
                  onRemove={(userId) => onRemoveMember?.(selectedGroup.id, userId)}
                  onChangeRole={(userId, role) => onChangeMemberRole?.(selectedGroup.id, userId, role)}
                  onMute={(userId) => onMuteMember?.(selectedGroup.id, userId)}
                />
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembersDialog(false)}>
              关闭
            </Button>
            {currentUserRole === 'owner' || currentUserRole === 'admin' ? (
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                添加成员
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>搜索消息</DialogTitle>
            <DialogDescription>在群组消息中搜索</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="输入搜索关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>搜索</Button>
            </div>
            <ScrollArea className="h-80">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((msg) => {
                    const group = groups.find((g) => g.id === msg.groupId)
                    return (
                      <div
                        key={msg.id}
                        className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        onClick={() => {
                          setSelectedGroupId(msg.groupId)
                          setShowSearchDialog(false)
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{group?.name}</span>
                          <span className="text-xs text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-600">{msg.content}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <SearchIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>输入关键词搜索消息</p>
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSearchDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
