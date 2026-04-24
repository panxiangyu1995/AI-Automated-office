/**
 * ProgressDisplay - Agent Execution Progress Display Component
 * 
 * Features:
 * - Subscribe to Tauri event `agent-progress` for real-time updates
 * - Display progress bar, turn count, tool calls, token usage
 * - Compact layout suitable for embedding in chat panel
 * - Auto-cleanup on unmount
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Zap, Hash, Coins, Activity } from 'lucide-react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface ProgressDisplayProps {
  taskId?: string
  className?: string
}

export interface TokenUsage {
  input: number
  output: number
  total: number
}

export interface ProgressUpdate {
  task_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  tool_use_count: number
  token_count: TokenUsage
  last_activity: string
  progress_percent: number | null
  started_at: string
  updated_at: string
  recent_activities: ActivityEntry[]
  error_message: string | null
  current_turn: number
  max_turns: number
}

export interface ActivityEntry {
  activity_name: string
  description: string
  duration_ms: number
  timestamp: string
  status: 'success' | 'failed' | 'in_progress' | 'skipped'
}

export type { ProgressDisplayProps }

// ==================== Default State ====================

const DEFAULT_PROGRESS: ProgressUpdate = {
  task_id: '',
  status: 'pending',
  tool_use_count: 0,
  token_count: { input: 0, output: 0, total: 0 },
  last_activity: '等待开始...',
  progress_percent: null,
  started_at: '',
  updated_at: '',
  recent_activities: [],
  error_message: null,
  current_turn: 0,
  max_turns: 20,
}

// ==================== Component ====================

export function ProgressDisplay({ taskId, className }: ProgressDisplayProps) {
  const [progress, setProgress] = useState<ProgressUpdate>(DEFAULT_PROGRESS)
  const [error, setError] = useState<string | null>(null)

  // Handle progress event
  const handleProgressEvent = useCallback(
    (data: ProgressUpdate) => {
      if (taskId && data.task_id !== taskId) return
      setProgress(data)
      setError(null)
    },
    [taskId]
  )

  // Setup event listener
  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    const setupListener = async () => {
      try {
        unlisten = await listen<ProgressUpdate>(
          'agent-progress',
          (event) => {
            handleProgressEvent(event.payload)
          }
        )
      } catch (err) {
        console.error('[ProgressDisplay] Failed to setup listener:', err)
        setError('无法订阅进度事件')
      }
    }

    void setupListener()

    return () => {
      if (unlisten) {
        unlisten()
        unlisten = null
      }
    }
  }, [handleProgressEvent])

  // Calculate progress percentage
  const progressPercent =
    progress.progress_percent ??
    (progress.max_turns > 0
      ? Math.round((progress.current_turn / progress.max_turns) * 100)
      : 0)

  // Loading state
  if (progress.status === 'pending') {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        <span className="text-sm text-slate-500">等待任务开始...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    )
  }

  // Running state
  const isRunning = progress.status === 'running'

  return (
    <div
      className={cn(
        'bg-slate-50 rounded-lg p-3 space-y-3',
        className
      )}
    >
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">执行进度</span>
          <span className="text-slate-500">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isRunning
                ? 'bg-[var(--ao-button-background,#1E3A5F)] animate-pulse'
                : progress.status === 'completed'
                ? 'bg-green-500'
                : 'bg-red-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Turn count */}
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">
            轮次: <span className="font-medium">{progress.current_turn}</span>
            <span className="text-slate-400">/{progress.max_turns}</span>
          </span>
        </div>

        {/* Tool call count */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">
            工具: <span className="font-medium">{progress.tool_use_count}</span>
          </span>
        </div>

        {/* Token usage */}
        <div className="flex items-center gap-1.5 col-span-2">
          <Coins className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">
            Token: 
            <span className="font-medium text-blue-600">{progress.token_count.input}</span>
            <span className="text-slate-400"> / </span>
            <span className="font-medium text-green-600">{progress.token_count.output}</span>
            <span className="text-slate-400"> = </span>
            <span className="font-medium">{progress.token_count.total}</span>
          </span>
        </div>
      </div>

      {/* Last activity */}
      <div className="flex items-start gap-1.5 pt-1 border-t border-slate-200">
        <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <span className="text-xs text-slate-500 line-clamp-1">
          {progress.last_activity || '处理中...'}
        </span>
      </div>

      {/* Status indicator */}
      {progress.status === 'completed' && (
        <div className="text-xs text-green-600 font-medium text-center">
          执行完成
        </div>
      )}
      {progress.status === 'failed' && (
        <div className="text-xs text-red-600 font-medium text-center">
          {progress.error_message || '执行失败'}
        </div>
      )}
      {progress.status === 'cancelled' && (
        <div className="text-xs text-slate-600 font-medium text-center">
          任务已取消
        </div>
      )}
    </div>
  )
}

export default ProgressDisplay
