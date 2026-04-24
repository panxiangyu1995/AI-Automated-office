/**
 * ActivityList - Recent Activity List Component
 * 
 * Features:
 * - Display list of recent activities (last 20 by default)
 * - Status-based icons: checkmark, X, clock, skip
 * - Scrollable list with max-height
 * - Auto-updates when new activities come in
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { CheckCircle2, XCircle, Clock, SkipForward, ScrollText } from 'lucide-react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export interface ActivityEntry {
  activity_name: string
  description: string
  duration_ms: number
  timestamp: string
  status: 'success' | 'failed' | 'in_progress' | 'skipped'
}

interface ActivityListProps {
  activities?: ActivityEntry[]
  maxItems?: number
  className?: string
}

export type { ActivityListProps }

// ==================== Types for Event ====================

interface ActivityEvent {
  activity: ActivityEntry
  task_id?: string
}

// ==================== Helper Functions ====================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '--:--:--'
  }
}

function getStatusIcon(
  status: ActivityEntry['status']
): { Icon: typeof CheckCircle2; color: string } {
  switch (status) {
    case 'success':
      return { Icon: CheckCircle2, color: 'text-green-500' }
    case 'failed':
      return { Icon: XCircle, color: 'text-red-500' }
    case 'in_progress':
      return { Icon: Clock, color: 'text-blue-500' }
    case 'skipped':
      return { Icon: SkipForward, color: 'text-slate-400' }
    default:
      return { Icon: Clock, color: 'text-slate-400' }
  }
}

// ==================== Component ====================

export function ActivityList({
  activities: initialActivities,
  maxItems = 20,
  className,
}: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>(
    initialActivities ?? []
  )
  const listRef = useRef<HTMLDivElement>(null)
  const unlistenRef = useRef<UnlistenFn | null>(null)

  // Listen for new activity events
  const handleNewActivity = useCallback((event: { payload: ActivityEvent }) => {
    const { activity } = event.payload
    
    setActivities((prev) => {
      const updated = [activity, ...prev]
      return updated.slice(0, maxItems)
    })
  }, [maxItems])

  // Setup event listener
  useEffect(() => {
    const setupListener = async () => {
      try {
        unlistenRef.current = await listen<ActivityEvent>(
          'agent-activity',
          (event) => {
            handleNewActivity({ payload: event.payload })
          }
        )
      } catch (err) {
        console.error('[ActivityList] Failed to setup listener:', err)
      }
    }

    void setupListener()

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
        unlistenRef.current = null
      }
    }
  }, [handleNewActivity])

  // Auto-scroll to top when new activity arrives
  useEffect(() => {
    if (listRef.current && activities.length > 0) {
      listRef.current.scrollTop = 0
    }
  }, [activities.length])

  // Empty state
  if (activities.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <ScrollText className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">暂无活动记录</p>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className={cn(
        'overflow-y-auto',
        className
      )}
      style={{ maxHeight: '320px' }}
    >
      <div className="space-y-1 p-1">
        {activities.map((activity, index) => {
          const { Icon, color } = getStatusIcon(activity.status)
          const isFirst = index === 0

          return (
            <div
              key={`${activity.timestamp}-${index}`}
              className={cn(
                'flex items-start gap-2 p-2 rounded-lg transition-colors',
                isFirst && activity.status === 'in_progress'
                  ? 'bg-blue-50'
                  : 'hover:bg-slate-50'
              )}
            >
              {/* Status icon */}
              <div className={cn('mt-0.5 flex-shrink-0', color)}>
                <Icon
                  className={cn(
                    'w-4 h-4',
                    activity.status === 'in_progress' && 'animate-pulse'
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {activity.activity_name}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatDuration(activity.duration_ms)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {activity.description}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActivityList
