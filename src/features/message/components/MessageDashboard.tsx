/**
 * Message Dashboard Component
 * 消息仪表盘
 */

import { MessageSquare, Bell, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { cn } from '@/lib/utils'
import { useMessageDashboard, useUnreadCount } from '../hooks/useMessage'

interface MessageDashboardComponentProps {
  className?: string
}

export function MessageDashboardComponent({ className }: MessageDashboardComponentProps) {
  const { dashboard, isLoading } = useMessageDashboard()
  const { unreadCount } = useUnreadCount()

  const stats = [
    {
      label: '总消息数',
      value: dashboard?.totalMessages || 0,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      label: '未读消息',
      value: unreadCount?.total || dashboard?.unreadCount || 0,
      icon: Bell,
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      label: '今日消息',
      value: getTodayCount(dashboard?.byType),
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      label: '本周增长',
      value: '+12%',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
  ]

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded mb-2" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-12 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">消息类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboard?.byType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn('w-3 h-3 rounded-full', getTypeColor(type))}
                    />
                    <span className="text-sm">{getTypeLabel(type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', getTypeColor(type))}
                        style={{
                          width: `${((count as number) / (dashboard?.totalMessages || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(dashboard?.byType || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无数据
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近消息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard?.recentMessages?.slice(0, 5).map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-2',
                      msg.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{msg.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {msg.senderName} · {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {(!dashboard?.recentMessages || dashboard.recentMessages.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无消息
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getTodayCount(byType?: Record<string, number>): number {
  if (!byType) return 0
  return Object.values(byType).reduce((sum, count) => sum + (count as number), 0)
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    system: 'bg-gray-500',
    approval: 'bg-yellow-500',
    task: 'bg-green-500',
    mention: 'bg-purple-500',
    chat: 'bg-blue-500',
  }
  return colors[type] || 'bg-gray-500'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    system: '系统',
    approval: '审批',
    task: '任务',
    mention: '提及',
    chat: '聊天',
  }
  return labels[type] || type
}

function formatTime(ts: number): string {
  const date = new Date(ts * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const dayMs = 24 * 60 * 60 * 1000

  if (diff < dayMs) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 7 * dayMs) {
    return `${Math.floor(diff / dayMs)}天前`
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
