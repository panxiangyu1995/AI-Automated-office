/**
 * 消息列表组件
 */

import { useEffect, useState } from 'react';
import { Search, MessageSquare, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

interface MessageListProps {
  filter?: {
    recipientId?: string;
    status?: Message['status'];
    keyword?: string;
  };
  pageSize?: number;
  onMessageClick?: (message: Message) => void;
  className?: string;
}

function MessageListItem({
  message,
  onClick,
}: {
  message: Message;
  onClick?: () => void;
}) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * dayMs) {
      return date.toLocaleDateString('zh-CN', { weekday: 'short' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-xs">已发送</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="text-xs">已送达</Badge>;
      case 'read':
        return <Badge variant="default" className="text-xs">已读</Badge>;
    }
  };

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
        </div>
      </CardContent>
    </Card>
  );
}

export function MessageList({
  filter,
  pageSize: _pageSize = 20,
  onMessageClick,
  className,
}: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setMessages([
        {
          id: '1',
          senderId: 'user1',
          senderName: '张三',
          recipientId: 'me',
          recipientName: '我',
          content: '今天的会议几点开始？',
          type: 'text',
          status: 'read',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          senderId: 'user2',
          senderName: '李四',
          recipientId: 'me',
          recipientName: '我',
          content: '文件已上传，请查收',
          type: 'file',
          status: 'delivered',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filter]);

  const filteredMessages = messages.filter((msg) => {
    if (searchQuery && !msg.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索消息..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton rows={3} />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无消息</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageListItem
              key={msg.id}
              message={msg}
              onClick={() => onMessageClick?.(msg)}
            />
          ))
        )}
      </div>
    </div>
  );
}
