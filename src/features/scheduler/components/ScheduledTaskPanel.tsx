/**
 * ScheduledTaskPanel - 定时任务管理面板
 * Story 4.5 - 定时任务功能
 * Story 4.6 - 任务失败自动重试
 * 
 * 提供定时任务的创建、查看、管理界面
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，使用 Zustand 状态管理
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  Clock, Plus, Pause, Trash2, Calendar, 
  CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp, RefreshCw, AlertCircle
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { cn } from '@/lib/utils'
import { 
  useSchedulerStore, 
  usePendingTasks, 
  useUpcomingTasks,
  useFailedTasks,
  type ScheduledTask,
  type RecurrenceType,
  type TaskStatus 
} from '../hooks/useSchedulerStore'

// ==================== Types ====================

interface ScheduledTaskPanelProps {
  className?: string
}

// ==================== Status Badge ====================

function StatusBadge({ status, retryCount, maxRetries }: { 
  status: TaskStatus
  retryCount?: number
  maxRetries?: number 
}) {
  const config: Record<TaskStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: '待执行', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    running: { label: '执行中', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-700', icon: Pause },
    retrying: { label: '重试中', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
  }
  
  const { label, color, icon: Icon } = config[status]
  const showRetryInfo = status === 'retrying' || status === 'failed'
  
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', color)}>
      <Icon size={12} className={status === 'running' || status === 'retrying' ? 'animate-spin' : undefined} />
      {label}
      {showRetryInfo && retryCount !== undefined && (
        <span className="ml-1 opacity-75">
          ({retryCount}/{maxRetries ?? 3})
        </span>
      )}
    </span>
  )
}

// ==================== Recurrence Badge ====================

function RecurrenceBadge({ recurrence }: { recurrence: RecurrenceType }) {
  const labels: Record<RecurrenceType, string> = {
    once: '单次',
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    custom: '自定义',
  }
  
  return (
    <span className="text-xs text-slate-500">
      {labels[recurrence]}
    </span>
  )
}

// ==================== Task Item ====================

interface TaskItemProps {
  task: ScheduledTask
  onCancel: () => void
  onDelete: () => void
  onRetry?: () => void
}

function TaskItem({ task, onCancel, onDelete, onRetry }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  const getNextRunLabel = () => {
    const nextTime = task.nextRunAt || task.nextRetryAt
    if (!nextTime) return null
    const diff = nextTime - Date.now()
    
    if (diff < 0) return '已到期'
    if (diff < 60 * 1000) return '即将执行'
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟后`
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时后`
    return formatTime(nextTime)
  }
  
  const formatBackoff = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}秒`
    return `${Math.round(ms / 60000)}分钟`
  }
  
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <StatusBadge 
              status={task.status} 
              retryCount={task.retryCount}
              maxRetries={task.maxRetries}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{task.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <RecurrenceBadge recurrence={task.recurrence} />
              {(task.nextRunAt || task.nextRetryAt) && (task.status === 'pending' || task.status === 'retrying') && (
                <span className="text-xs text-primary" style={{ color: '#1E3A5F' }}>
                  {getNextRunLabel()}
                </span>
              )}
              {task.status === 'failed' && task.lastError && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} />
                  执行失败
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {task.status === 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel() }}
              className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
              title="取消任务"
            >
              <Pause size={14} />
            </button>
          )}
          {task.status === 'failed' && onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry() }}
              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
              title="重试任务"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="删除任务"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-sm">
          {task.description && (
            <p className="text-slate-600 mb-2">{task.description}</p>
          )}
          
          {/* Error Message */}
          {task.status === 'failed' && task.lastError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
              <p className="font-medium">错误信息:</p>
              <p className="mt-1">{task.lastError}</p>
            </div>
          )}
          
          {/* Retry History */}
          {task.retryHistory && task.retryHistory.length > 0 && (
            <div className="mb-2 p-2 bg-slate-100 rounded text-xs">
              <p className="font-medium text-slate-600 mb-1">重试历史:</p>
              {task.retryHistory.map((attempt, index) => (
                <div key={index} className="flex justify-between text-slate-500 py-0.5">
                  <span>第 {attempt.attemptNumber} 次</span>
                  <span>退避: {formatBackoff(attempt.backoffMs)}</span>
                  <span>{formatTime(attempt.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-1 text-xs text-slate-500">
            <p><span className="font-medium">提示词:</span> {task.prompt}</p>
            <p><span className="font-medium">创建时间:</span> {formatTime(task.createdAt)}</p>
            {task.lastRunAt && (
              <p><span className="font-medium">上次执行:</span> {formatTime(task.lastRunAt)}</p>
            )}
            <p><span className="font-medium">执行次数:</span> {task.runCount}</p>
            {task.maxRuns && (
              <p><span className="font-medium">最大执行:</span> {task.maxRuns} 次</p>
            )}
            <p><span className="font-medium">重试次数:</span> {task.retryCount}/{task.maxRetries ?? 3}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Create Task Form ====================

interface CreateTaskFormProps {
  onClose: () => void
  initialPrompt?: string
}

function CreateTaskForm({ onClose, initialPrompt = '' }: CreateTaskFormProps) {
  const { createTask } = useSchedulerStore()
  
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState(initialPrompt)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = useCallback(() => {
    if (!name.trim() || !prompt.trim() || !scheduledDate || !scheduledTime) {
      return
    }
    
    setIsSubmitting(true)
    
    const scheduledTimeMs = new Date(`${scheduledDate}T${scheduledTime}`).getTime()
    
    createTask({
      name: name.trim(),
      prompt: prompt.trim(),
      scheduledTime: scheduledTimeMs,
      recurrence,
    })
    
    setIsSubmitting(false)
    onClose()
  }, [name, prompt, scheduledDate, scheduledTime, recurrence, createTask, onClose])
  
  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="task-name">任务名称</Label>
        <input
          id="task-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如: 每日晨报生成"
          className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      
      <div>
        <Label htmlFor="task-prompt">执行提示词</Label>
        <textarea
          id="task-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述要让 AI 执行的任务..."
          rows={3}
          className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="scheduled-date">执行日期</Label>
          <input
            id="scheduled-date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={today}
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="scheduled-time">执行时间</Label>
          <input
            id="scheduled-time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="recurrence">重复方式</Label>
        <select
          id="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
          className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="once">单次执行</option>
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="custom">自定义间隔</option>
        </select>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || !prompt.trim() || !scheduledDate || !scheduledTime}
        >
          {isSubmitting ? '创建中...' : '创建任务'}
        </Button>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function ScheduledTaskPanel({ className }: ScheduledTaskPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const pendingTasks = usePendingTasks()
  const upcomingTasks = useUpcomingTasks()
  const failedTasks = useFailedTasks()
  const { tasks, cancelTask, deleteTask, retryTask } = useSchedulerStore()
  
  const allTasks = useMemo(() => {
    return Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt)
  }, [tasks])
  
  const handleCancelTask = useCallback((taskId: string) => {
    if (window.confirm('确定要取消这个任务吗？')) {
      cancelTask(taskId)
    }
  }, [cancelTask])
  
  const handleDeleteTask = useCallback((taskId: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      deleteTask(taskId)
    }
  }, [deleteTask])
  
  const handleRetryTask = useCallback((taskId: string) => {
    if (window.confirm('确定要重试这个任务吗？')) {
      retryTask(taskId)
    }
  }, [retryTask])
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" style={{ color: '#1E3A5F' }} />
          <h3 className="font-semibold text-slate-800">定时任务</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          className="gap-1"
        >
          <Plus size={14} />
          新建
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {showCreateForm ? (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-800 mb-3">创建定时任务</h4>
            <CreateTaskForm onClose={() => setShowCreateForm(false)} />
          </div>
        ) : (
          <>
            {/* Failed Tasks */}
            {failedTasks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  失败任务 ({failedTasks.length})
                </h4>
                <div className="space-y-2">
                  {failedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onCancel={() => handleCancelTask(task.id)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onRetry={() => handleRetryTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  即将执行
                </h4>
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onCancel={() => handleCancelTask(task.id)}
                      onDelete={() => handleDeleteTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* All Tasks */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                全部任务 ({allTasks.length})
              </h4>
              {allTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无定时任务</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-2 text-sm text-primary hover:underline"
                    style={{ color: '#1E3A5F' }}
                  >
                    创建第一个任务
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {allTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onCancel={() => handleCancelTask(task.id)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onRetry={task.status === 'failed' ? () => handleRetryTask(task.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-200 text-xs text-slate-400 flex justify-between">
        <span>待执行: {pendingTasks.length}</span>
        {failedTasks.length > 0 && (
          <span className="text-red-500">失败: {failedTasks.length}</span>
        )}
        <span>共 {allTasks.length} 个任务</span>
      </div>
    </div>
  )
}

export default ScheduledTaskPanel
