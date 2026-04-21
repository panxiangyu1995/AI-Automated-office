/**
 * 消息列表组件
 */

import { useEffect, useState, useCallback } from 'react'
import { Search, MessageSquare, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMessages, useMessageFilter, useMarkAsRead } from '../hooks/useMessage'
import type { MessageFilter, MessageStatus } from '../types/message.types'

export interface MessageListItemProps {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  recipientId: string
  recipientName: string
  content: string
  type: 'text' | 'image' | 'file'
  status: 'sent' | 'delivered' | 'read'
  createdAt: string
}

interface MessageListProps {
  filter?: {
    recipientId?: string
    status?: MessageStatus
    keyword?: string
    msgType?: string
  }
  pageSize?: number
  onMessageClick?: (message: MessageListItemProps) => void
  className?: string
}

function formatTime(dateStr: string | number) {
  const date = new Date(typeof dateStr === 'string' ? dateStr : dateStr * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const dayMs = 24 * 60 * 60 * 1000

  if (diff < dayMs) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 7 * dayMs) {
    return date.toLocaleDateString('zh-CN', { weekday: 'short' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function MessageListItemComponent({
  message,
  onClick,
  onMarkRead,
}: {
  message: MessageListItemProps
  onClick?: () => void
  onMarkRead?: (id: string) => void
}) {
  const getStatusBadge = (status: MessageListItemProps['status']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-xs">已发送</Badge>
      case 'delivered':
        return <Badge variant="secondary" className="text-xs">已送达</Badge>
      case 'read':
        return <Badge variant="default" className="text-xs">已读</Badge>
    }
  }

  return (
    <Card
      className="cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{message.senderName}</span>
              <span className="text-xs text-slate-500">{formatTime(message.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-600 truncate mt-1">{message.content}</p>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(message.status)}
              {message.type !== 'text' && (
                <Badge variant="outline" className="text-xs">
                  {message.type === 'image' ? '图片' : '文件'}
                </Badge>
              )}
            </div>
          </div>
          {onMarkRead && message.status !== 'read' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onMarkRead(message.id)
              }}
              className="text-xs"
            >
              标记已读
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function MessageList({
  filter,
  pageSize: _pageSize = 20,
  onMessageClick,
  className,
}: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilter, setLocalFilter] = useState<MessageFilter>({
    pinnedOnly: false,
    searchKeyword: filter?.keyword,
    status: filter?.status,
  })

  const { messages, isLoading, refetch } = useMessages()
  const { filter: doFilter, messages: filteredMessages } = useMessageFilter()
  const { markRead } = useMarkAsRead()

  useEffect(() => {
    if (filter?.keyword) {
      setLocalFilter((prev) => ({ ...prev, searchKeyword: filter.keyword }))
    }
    if (filter?.status) {
      setLocalFilter((prev) => ({ ...prev, status: filter.status }))
    }
  }, [filter])

  const handleSearch = useCallback(async () => {
    if (searchQuery) {
      await doFilter({ ...localFilter, searchKeyword: searchQuery })
    } else {
      await refetch()
    }
  }, [searchQuery, localFilter, doFilter, refetch])

  const displayMessages = localFilter.searchKeyword ? filteredMessages : messages

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索消息..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton rows={3} />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无消息</p>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <MessageListItemComponent
              key={msg.id}
              message={{
                id: msg.id,
                senderId: '',
                senderName: msg.senderName,
                recipientId: '',
                recipientName: '我',
                content: msg.title,
                type: 'text',
                status: msg.status === 'unread' ? 'delivered' : 'read',
                createdAt: String(msg.createdAt),
              }}
              onClick={() => onMessageClick?.({
                id: msg.id,
                senderId: '',
                senderName: msg.senderName,
                recipientId: '',
                recipientName: '我',
                content: msg.title,
                type: 'text',
                status: msg.status === 'unread' ? 'delivered' : 'read',
                createdAt: String(msg.createdAt),
              })}
              onMarkRead={markRead}
            />
          ))
        )}
      </div>
    </div>
  )
}
