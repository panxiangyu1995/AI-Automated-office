/**
 * 通知铃铛组件
 */

import { useEffect, useState } from 'react'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMessageStore } from '../stores/messageStore'
import { MESSAGE_TYPE_LABELS, MESSAGE_PRIORITY_LABELS, MESSAGE_PRIORITY_COLORS } from '../types/message.types'
import type { MessageStatus, MessagePriority, MessageType } from '../types/message.types'

const STATUS_COLORS: Record<MessageStatus, string> = { unread: 'bg-blue-500', read: 'bg-gray-400', archived: 'bg-gray-300' }

function formatTime(ts: number) {
  const d = new Date(ts * 1000)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString()
}

export function NotificationBell() {
  const { messages, unreadCount, isLoading, fetchMessages, fetchUnreadCount, markRead, readAll, deleteMessage } = useMessageStore()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    const timer = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(timer)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (open) fetchMessages()
  }, [open, fetchMessages])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount.total > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount.total > 99 ? '99+' : unreadCount.total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="font-medium">通知中心</span>
          {unreadCount && unreadCount.total > 0 && (
            <Button variant="ghost" size="sm" onClick={readAll}>
              <Check className="h-3 w-3 mr-1" />全部已读
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin"/></div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-8">
              <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">未读</TabsTrigger>
              <TabsTrigger value="approval" className="text-xs">审批</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">系统</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="max-h-64 overflow-y-auto">
                {messages.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">暂无通知</div> :
                messages.slice(0, 10).map((m) => <MessageItem key={m.id} message={m} onMarkRead={markRead} onDelete={deleteMessage}/>)}
              </div>
            </TabsContent>
            <TabsContent value="unread">
              <div className="max-h-64 overflow-y-auto">
                {messages.filter(m => m.status === 'unread').length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">暂无未读</div> :
                messages.filter(m => m.status === 'unread').slice(0, 10).map((m) => <MessageItem key={m.id} message={m} onMarkRead={markRead} onDelete={deleteMessage}/>)}
              </div>
            </TabsContent>
            <TabsContent value="approval">
              <div className="max-h-64 overflow-y-auto">
                {messages.filter(m => m.msgType === 'approval').length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">暂无审批通知</div> :
                messages.filter(m => m.msgType === 'approval').slice(0, 10).map((m) => <MessageItem key={m.id} message={m} onMarkRead={markRead} onDelete={deleteMessage}/>)}
              </div>
            </TabsContent>
            <TabsContent value="system">
              <div className="max-h-64 overflow-y-auto">
                {messages.filter(m => m.msgType === 'system').length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">暂无系统通知</div> :
                messages.filter(m => m.msgType === 'system').slice(0, 10).map((m) => <MessageItem key={m.id} message={m} onMarkRead={markRead} onDelete={deleteMessage}/>)}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MessageItem({ message, onMarkRead, onDelete }: { message: MessageListItem, onMarkRead: (id: string) => void, onDelete: (id: string) => void }) {
  return (
    <Card className={`m-2 ${message.status === 'unread' ? 'bg-blue-50' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className={`mt-1 h-2 w-2 rounded-full ${STATUS_COLORS[message.status]}`}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{MESSAGE_TYPE_LABELS[message.msgType]}</Badge>
              <span className={`text-xs font-medium ${MESSAGE_PRIORITY_COLORS[message.priority]}`}>{MESSAGE_PRIORITY_LABELS[message.priority]}</span>
            </div>
            <div className="font-medium text-sm truncate mt-1">{message.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{message.senderName} · {formatTime(message.createdAt)}</div>
          </div>
          <div className="flex gap-1">
            {message.status === 'unread' && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMarkRead(message.id)}>
                <Check className="h-3 w-3"/>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(message.id)}>
              <Trash2 className="h-3 w-3"/>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
