//! TicketCard 组件 - 工单卡片

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { PriorityTag } from './PriorityTag';
import { Clock, User } from 'lucide-react';
import type { TicketListItem } from '../types/service';

interface TicketCardProps {
  ticket: TicketListItem;
  onClick?: () => void;
}

const typeLabels: Record<string, string> = {
  repair: '维修',
  consultation: '咨询',
  complaint: '投诉',
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const timeAgo = formatRelativeTime(ticket.createdAt);
  
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-1">
            {ticket.title}
          </CardTitle>
          <PriorityTag priority={ticket.priority} size="sm" showLabel={false} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <StatusBadge status={ticket.status} size="sm" />
          </div>
          <span className="px-2 py-0.5 bg-muted rounded text-xs">
            {typeLabels[ticket.ticketType] || ticket.ticketType}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{ticket.customerName}</span>
        </div>
        
        {ticket.assignedName && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="text-xs">处理人:</span>
            <span>{ticket.assignedName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}
