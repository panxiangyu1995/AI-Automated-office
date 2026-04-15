/**
 * Private Chat - Story 11.3
 * 私聊消息功能 - 用户间直接消息和消息历史管理
 *
 * 功能：
 * - 创建私聊 UI 和消息发送流程
 * - 持久化投递和已读状态
 * - 支持历史搜索和筛选
 *
 * 铁律合规：
 * - FR92, FR93, FR611, FR612, FR622
 * - NFR1
 * - ADR-037
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  File,
  X,
  Trash2,
  MessageSquare,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
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
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessageType = 'text' | 'image' | 'file'

export interface PrivateMessage {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  type: MessageType
  status: MessageStatus
  timestamp: string
  attachments?: MessageAttachment[]
  replyTo?: string
  isSystem?: boolean
}

export interface MessageAttachment {
  id: string
  type: 'image' | 'file'
  name: string
  size: number
  url?: string
  thumbnail?: string
}

export interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isOnline: boolean
  messages: PrivateMessage[]
}

export interface ChatStats {
  totalConversations: number
  totalMessages: number
  unreadMessages: number
  onlineContacts: number
}

export interface PrivateChatProps {
  currentUserId: string
  conversations: Conversation[]
  onSendMessage: (conversationId: string, content: string, type?: MessageType) => void
  onDeleteMessage?: (messageId: string) => void
  onMarkAsRead?: (conversationId: string) => void
  onStartCall?: (participantId: string, type: 'audio' | 'video') => void
  onSearchMessages?: (query: string) => PrivateMessage[]
}

// Mock current user
const CURRENT_USER_ID = 'current-user'

// Mock data
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participantId: 'emp-1',
    participantName: '张小明',
    participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    lastMessage: '好的，我马上处理这个问题',
    lastMessageTime: '10:35',
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: 'msg-1-1',
        conversationId: 'conv-1',
        senderId: 'emp-1',
        receiverId: CURRENT_USER_ID,
        content: '你好，请问项目的进度怎么样了？',
        type: 'text',
        status: 'read',
        timestamp: '10:30',
      },
      {
        id: 'msg-1-2',
        conversationId: 'conv-1',
        senderId: CURRENT_USER_ID,
        receiverId: 'emp-1',
        content: '还在进行中，预计今天下午可以完成。',
        type: 'text',
        status: 'read',
        timestamp: '10:32',
      },
      {
        id: 'msg-1-3',
        conversationId: 'conv-1',
        senderId: 'emp-1',
        receiverId: CURRENT_USER_ID,
        content: '好的，我马上处理这个问题',
        type: 'text',
        status: 'read',
        timestamp: '10:35',
      },
    ],
  },
  {
    id: 'conv-2',
    participantId: 'emp-2',
    participantName: '李婷婷',
    participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    lastMessage: '文件已经发给你了',
    lastMessageTime: '09:20',
    unreadCount: 0,
    isOnline: true,
    messages: [
      {
        id: 'msg-2-1',
        conversationId: 'conv-2',
        senderId: 'emp-2',
        receiverId: CURRENT_USER_ID,
        content: '文件已经发给你了',
        type: 'file',
        status: 'delivered',
        timestamp: '09:20',
        attachments: [
          {
            id: 'att-1',
            type: 'file',
            name: '项目文档.pdf',
            size: 1024000,
          },
        ],
      },
    ],
  },
  {
    id: 'conv-3',
    participantId: 'emp-3',
    participantName: '王建国',
    participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    lastMessage: '会议改到下午3点了',
    lastMessageTime: '昨天',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: 'msg-3-1',
        conversationId: 'conv-3',
        senderId: 'emp-3',
        receiverId: CURRENT_USER_ID,
        content: '会议改到下午3点了',
        type: 'text',
        status: 'read',
        timestamp: '昨天 14:00',
      },
    ],
  },
]

// Calculate stats
function calculateStats(conversations: Conversation[]): ChatStats {
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0)
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
  const onlineContacts = conversations.filter((c) => c.isOnline).length

  return {
    totalConversations: conversations.length,
    totalMessages,
    unreadMessages,
    onlineContacts,
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
  message: PrivateMessage
  isOwn: boolean
  onDelete?: (messageId: string) => void
}

function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 ${
          isOwn ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-800'
        }`}
      >
        {message.type === 'text' && <p className="text-sm">{message.content}</p>}

        {message.type === 'file' && message.attachments && (
          <div
            className={`flex items-center gap-2 p-2 rounded ${isOwn ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <File className="h-4 w-4" />
            <span className="text-xs truncate">{message.attachments[0].name}</span>
          </div>
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

/**
 * Private Chat Component
 */
export function PrivateChat({
  currentUserId = CURRENT_USER_ID,
  conversations: initialConversations,
  onSendMessage,
  onDeleteMessage,
  onMarkAsRead,
  onStartCall,
  onSearchMessages,
}: PrivateChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations || MOCK_CONVERSATIONS
  )
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    MOCK_CONVERSATIONS[0]?.id || null
  )
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [searchResults, setSearchResults] = useState<PrivateMessage[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get selected conversation
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  )

  // Stats
  const stats = useMemo(() => calculateStats(conversations), [conversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversationId && (selectedConversation?.unreadCount ?? 0) > 0) {
      onMarkAsRead?.(selectedConversationId)
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c))
      )
    }
    // Intentionally omit onMarkAsRead and selectedConversation from deps to avoid unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId])

  // Handle send message
  const handleSend = () => {
    if (!messageInput.trim() || !selectedConversationId) return

    onSendMessage(selectedConversationId, messageInput.trim(), 'text')
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

  // Sort conversations by last message time
  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const timeA = a.lastMessageTime || ''
        const timeB = b.lastMessageTime || ''
        return timeB.localeCompare(timeA)
      }),
    [conversations]
  )

  return (
    <div className="flex h-full bg-slate-50">
      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5" />
            私聊消息
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{stats.totalMessages}</div>
              <div className="text-xs text-slate-500">消息</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{stats.unreadMessages}</div>
              <div className="text-xs text-slate-500">未读</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{stats.onlineContacts}</div>
              <div className="text-xs text-slate-500">在线</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索消息..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-slate-100">
            {sortedConversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${
                  selectedConversationId === conv.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.participantAvatar} />
                    <AvatarFallback>{conv.participantName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {conv.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 truncate">
                      {conv.participantName}
                    </span>
                    <span className="text-xs text-slate-400">{conv.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge variant="default" className="bg-blue-500">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            ))}

            {sortedConversations.length === 0 && (
              <EmptyState
                title="暂无会话"
                description="开始新的对话后将在此处显示"
                icon={MessageSquare}
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.participantAvatar} />
                  <AvatarFallback>
                    {selectedConversation.participantName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-slate-800">
                    {selectedConversation.participantName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedConversation.isOnline ? '在线' : '离线'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartCall?.(selectedConversation.participantId, 'audio')}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartCall?.(selectedConversation.participantId, 'video')}
                >
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <User className="h-4 w-4 mr-2" />
                      查看资料
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除会话
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {selectedConversation.messages.map((msg) => (
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
                    placeholder="输入消息..."
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
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p>选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>搜索消息</DialogTitle>
            <DialogDescription>在所有会话中搜索消息</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex gap-2 mb-4">
              <Input
                ref={searchInputRef}
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
                    const conv = conversations.find((c) => c.id === msg.conversationId)
                    return (
                      <div
                        key={msg.id}
                        className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        onClick={() => {
                          setSelectedConversationId(msg.conversationId)
                          setShowSearchDialog(false)
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{conv?.participantName}</span>
                          <span className="text-xs text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-600">{msg.content}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
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
