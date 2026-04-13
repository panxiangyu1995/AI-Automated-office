//! TicketTimeline 组件 - 工单处理时间线

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ProcessingRecord } from '../types/service';

interface TicketTimelineProps {
  records: ProcessingRecord[];
  loading?: boolean;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  created: { label: '创建工单', color: 'bg-blue-100 text-blue-800' },
  assigned: { label: '已分配', color: 'bg-purple-100 text-purple-800' },
  processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
  pending_confirm: { label: '待确认', color: 'bg-orange-100 text-orange-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
  note: { label: '备注', color: 'bg-slate-100 text-slate-800' },
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function TicketTimeline({ records, loading }: TicketTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">处理记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">处理记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            暂无处理记录
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">处理记录</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* 时间线 */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-4">
            {records.map((record) => {
              const config = actionLabels[record.action] || actionLabels.note;
              
              return (
                <div key={record.id} className="relative flex gap-4 pl-10">
                  {/* 时间线节点 */}
                  <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-background border-2 border-primary z-10" />
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={config.color}>{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(record.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">{record.content}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {getInitials(record.operatorName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {record.operatorName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
