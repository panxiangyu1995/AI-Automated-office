/**
 * Announcement List Component
 * 公告列表组件
 */

import { Bell, Pin, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  priority: string
  targetType: string
  publishedAt: number
  expiresAt?: number
  isRead: boolean
}

interface AnnouncementListProps {
  announcements?: Announcement[]
  isLoading?: boolean
  onSelect?: (id: string) => void
  className?: string
}

export function AnnouncementList({
  announcements = [],
  isLoading = false,
  onSelect,
  className,
}: AnnouncementListProps) {
  const formatTime = (ts: number) => {
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { label: '紧急', variant: 'destructive' as const }
      case 'high':
        return { label: '重要', variant: 'default' as const }
      case 'normal':
        return { label: '普通', variant: 'secondary' as const }
      case 'low':
        return { label: '低', variant: 'outline' as const }
      default:
        return { label: '普通', variant: 'secondary' as const }
    }
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>暂无公告</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {announcements.map((ann) => {
        const priority = getPriorityLabel(ann.priority)
        return (
          <Card
            key={ann.id}
            className={cn(
              'cursor-pointer hover:bg-slate-50 transition-colors',
              !ann.isRead && 'border-l-4 border-l-blue-500'
            )}
            onClick={() => onSelect?.(ann.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!ann.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    {ann.isRead && (
                      <Pin className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Badge variant={priority.variant} className="text-xs">
                      {priority.label}
                    </Badge>
                  </div>
                  <h3 className={cn('font-medium truncate', !ann.isRead && 'font-semibold')}>
                    {ann.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {ann.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{ann.authorName}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(ann.publishedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
