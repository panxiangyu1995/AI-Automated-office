/**
 * useSchedulerStore - 定时任务调度管理 Hook
 * Story 4.5 - 定时任务功能
 * Story 4.6 - 任务失败自动重试
 * 
 * 管理定时任务的创建、执行、状态、重试
 * 
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - ARCH-048: 定时任务调度
 * - NFR-22: 任务可靠性
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== Types ====================

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying'

export interface RetryAttempt {
  attemptNumber: number
  timestamp: number
  error?: string
  backoffMs: number
}

export interface ScheduledTask {
  id: string
  name: string
  description?: string
  prompt: string              // 要执行的 AI 提示词
  scheduledTime: number       // 计划执行时间戳
  recurrence: RecurrenceType
  recurrenceConfig?: {
    interval?: number         // 自定义间隔（分钟）
    daysOfWeek?: number[]     // 周几执行 (0-6, 0=周日)
    dayOfMonth?: number       // 每月的第几天
    endDate?: number          // 结束日期
  }
  status: TaskStatus
  createdAt: number
  lastRunAt?: number
  nextRunAt?: number
  runCount: number
  maxRuns?: number            // 最大执行次数
  sessionId?: string          // 关联的会话 ID
  metadata?: Record<string, unknown>
  // Retry fields (Story 4.6)
  retryCount: number          // 当前重试次数
  maxRetries?: number         // 最大重试次数 (default: 3)
  retryHistory: RetryAttempt[] // 重试历史
  lastError?: string          // 最后一次错误信息
  nextRetryAt?: number        // 下次重试时间
}

export interface SchedulerState {
  tasks: Record<string, ScheduledTask>
  
  // Actions
  createTask: (task: Omit<ScheduledTask, 'id' | 'createdAt' | 'status' | 'runCount' | 'retryCount' | 'retryHistory'>) => string
  updateTask: (taskId: string, updates: Partial<ScheduledTask>) => void
  deleteTask: (taskId: string) => void
  cancelTask: (taskId: string) => void
  markTaskRunning: (taskId: string) => void
  markTaskCompleted: (taskId: string) => void
  markTaskFailed: (taskId: string, error?: string) => void
  retryTask: (taskId: string) => void
  scheduleRetry: (taskId: string) => void
  
  // Queries
  getPendingTasks: () => ScheduledTask[]
  getUpcomingTasks: (limit?: number) => ScheduledTask[]
  getTasksByStatus: (status: TaskStatus) => ScheduledTask[]
  getFailedTasks: () => ScheduledTask[]
  getRetryableTasks: () => ScheduledTask[]
}

// ==================== Helper Functions ====================

function generateId(): string {
  return crypto.randomUUID()
}

/**
 * 计算重试退避时间（指数退避）
 */
function calculateBackoff(attemptNumber: number, baseDelayMs: number = 1000): number {
  // Exponential backoff with jitter: baseDelay * 2^(attempt-1) + random jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attemptNumber - 1)
  const jitter = Math.random() * 0.1 * exponentialDelay // 10% jitter
  return Math.min(exponentialDelay + jitter, 60000) // Max 60 seconds
}

/**
 * 计算下次执行时间
 */
function calculateNextRun(task: ScheduledTask): number | undefined {
  const now = Date.now()
  const scheduled = task.scheduledTime
  
  if (task.recurrence === 'once') {
    return scheduled > now ? scheduled : undefined
  }
  
  // For recurring tasks, calculate based on recurrence config
  let nextRun = scheduled
  const config = task.recurrenceConfig
  
  while (nextRun <= now) {
    switch (task.recurrence) {
      case 'daily':
        nextRun += 24 * 60 * 60 * 1000
        break
      case 'weekly':
        nextRun += 7 * 24 * 60 * 60 * 1000
        break
      case 'monthly': {
        // Approximate month
        const date = new Date(nextRun)
        date.setMonth(date.getMonth() + 1)
        nextRun = date.getTime()
        break
      }
      case 'custom':
        if (config?.interval) {
          nextRun += config.interval * 60 * 1000
        } else {
          return undefined
        }
        break
      default:
        return undefined
    }
    
    // Check if past end date
    if (config?.endDate && nextRun > config.endDate) {
      return undefined
    }
    
    // Check if max runs reached
    if (task.maxRuns && task.runCount >= task.maxRuns) {
      return undefined
    }
  }
  
  return nextRun
}

// ==================== Store ====================

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      tasks: {},
      
      createTask: (taskData) => {
        const taskId = generateId()
        const now = Date.now()
        
        const task: ScheduledTask = {
          ...taskData,
          id: taskId,
          createdAt: now,
          status: 'pending',
          runCount: 0,
          retryCount: 0,
          retryHistory: [],
          maxRetries: taskData.maxRetries ?? 3,
          nextRunAt: taskData.scheduledTime,
        }
        
        set((state) => ({
          tasks: {
            ...state.tasks,
            [taskId]: task,
          },
        }))
        
        return taskId
      },
      
      updateTask: (taskId, updates) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task) return state
          
          const updatedTask = { ...task, ...updates }
          
          // Recalculate next run if scheduled time or recurrence changed
          if (updates.scheduledTime || updates.recurrence || updates.recurrenceConfig) {
            updatedTask.nextRunAt = calculateNextRun(updatedTask)
          }
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: updatedTask,
            },
          }
        })
      },
      
      deleteTask: (taskId) => {
        set((state) => {
          const { [taskId]: _deleted, ...remaining } = state.tasks
          return { tasks: remaining }
        })
      },
      
      cancelTask: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task) return state
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { ...task, status: 'cancelled' },
            },
          }
        })
      },
      
      markTaskRunning: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task) return state
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...task, 
                status: 'running',
                lastRunAt: Date.now(),
              },
            },
          }
        })
      },
      
      markTaskCompleted: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task) return state
          
          const newRunCount = task.runCount + 1
          let newStatus: TaskStatus = 'completed'
          let nextRun: number | undefined
          
          // For recurring tasks, calculate next run
          if (task.recurrence !== 'once') {
            nextRun = calculateNextRun({ ...task, runCount: newRunCount })
            if (nextRun) {
              newStatus = 'pending'
            }
          }
          
          // Check if max runs reached
          if (task.maxRuns && newRunCount >= task.maxRuns) {
            newStatus = 'completed'
            nextRun = undefined
          }
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...task, 
                status: newStatus,
                runCount: newRunCount,
                nextRunAt: nextRun,
              },
            },
          }
        })
      },
      
      markTaskFailed: (taskId, error) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task) return state
          
          const newRetryCount = task.retryCount + 1
          const maxRetries = task.maxRetries ?? 3
          const canRetry = newRetryCount < maxRetries
          
          // Record retry attempt
          const backoffMs = calculateBackoff(newRetryCount)
          const retryAttempt: RetryAttempt = {
            attemptNumber: newRetryCount,
            timestamp: Date.now(),
            error,
            backoffMs,
          }
          
          // Schedule retry if allowed
          const nextRetryTime = canRetry ? Date.now() + backoffMs : undefined
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...task, 
                status: canRetry ? 'retrying' : 'failed',
                retryCount: newRetryCount,
                lastError: error,
                retryHistory: [...task.retryHistory, retryAttempt],
                nextRetryAt: nextRetryTime,
              },
            },
          }
        })
      },
      
      retryTask: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task || task.status !== 'failed') return state
          
          // Reset retry count for manual retry
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...task, 
                status: 'pending',
                retryCount: 0,
                nextRetryAt: undefined,
              },
            },
          }
        })
      },
      
      scheduleRetry: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId]
          if (!task || task.status !== 'retrying') return state
          
          // Move to running state for scheduled retry
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...task, 
                status: 'running',
                lastRunAt: Date.now(),
              },
            },
          }
        })
      },
      
      getPendingTasks: () => {
        const { tasks } = get()
        return Object.values(tasks).filter(
          (task) => task.status === 'pending' && (!task.nextRunAt || task.nextRunAt <= Date.now())
        )
      },
      
      getUpcomingTasks: (limit = 10) => {
        const { tasks } = get()
        return Object.values(tasks)
          .filter((task) => (task.status === 'pending' || task.status === 'retrying') && (task.nextRunAt || task.nextRetryAt))
          .sort((a, b) => (a.nextRunAt ?? a.nextRetryAt ?? 0) - (b.nextRunAt ?? b.nextRetryAt ?? 0))
          .slice(0, limit)
      },
      
      getTasksByStatus: (status) => {
        const { tasks } = get()
        return Object.values(tasks).filter((task) => task.status === status)
      },
      
      getFailedTasks: () => {
        const { tasks } = get()
        return Object.values(tasks).filter((task) => task.status === 'failed')
      },
      
      getRetryableTasks: () => {
        const { tasks } = get()
        return Object.values(tasks).filter(
          (task) => task.status === 'failed' && (task.retryCount ?? 0) < (task.maxRetries ?? 3)
        )
      },
    }),
    {
      name: 'scheduler-storage',
    }
  )
)

// ==================== Selector Hooks ====================

/**
 * 获取所有待执行任务
 */
export function usePendingTasks(): ScheduledTask[] {
  return useSchedulerStore((state) => 
    Object.values(state.tasks).filter(
      (task) => task.status === 'pending'
    )
  )
}

/**
 * 获取即将执行的任务
 */
export function useUpcomingTasks(limit = 5): ScheduledTask[] {
  return useSchedulerStore((state) => 
    Object.values(state.tasks)
      .filter((task) => (task.status === 'pending' || task.status === 'retrying') && (task.nextRunAt || task.nextRetryAt))
      .sort((a, b) => (a.nextRunAt ?? a.nextRetryAt ?? 0) - (b.nextRunAt ?? b.nextRetryAt ?? 0))
      .slice(0, limit)
  )
}

/**
 * 获取单个任务
 */
export function useTask(taskId: string | null): ScheduledTask | null {
  return useSchedulerStore((state) => 
    taskId ? state.tasks[taskId] ?? null : null
  )
}

/**
 * 获取失败的任务
 */
export function useFailedTasks(): ScheduledTask[] {
  return useSchedulerStore((state) => 
    Object.values(state.tasks).filter((task) => task.status === 'failed')
  )
}

/**
 * 获取可重试的任务
 */
export function useRetryableTasks(): ScheduledTask[] {
  return useSchedulerStore((state) => 
    Object.values(state.tasks).filter(
      (task) => task.status === 'failed' && (task.retryCount ?? 0) < (task.maxRetries ?? 3)
    )
  )
}

// ==================== Export ====================

export default useSchedulerStore
