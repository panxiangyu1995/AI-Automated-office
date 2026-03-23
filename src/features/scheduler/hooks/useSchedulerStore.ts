/**
 * useSchedulerStore - 定时任务调度管理 Hook
 * Story 4.5 - 定时任务功能
 * 
 * 管理定时任务的创建、执行、状态
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

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

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
}

export interface SchedulerState {
  tasks: Record<string, ScheduledTask>
  
  // Actions
  createTask: (task: Omit<ScheduledTask, 'id' | 'createdAt' | 'status' | 'runCount'>) => string
  updateTask: (taskId: string, updates: Partial<ScheduledTask>) => void
  deleteTask: (taskId: string) => void
  cancelTask: (taskId: string) => void
  markTaskRunning: (taskId: string) => void
  markTaskCompleted: (taskId: string) => void
  markTaskFailed: (taskId: string, error?: string) => void
  
  // Queries
  getPendingTasks: () => ScheduledTask[]
  getUpcomingTasks: (limit?: number) => ScheduledTask[]
  getTasksByStatus: (status: TaskStatus) => ScheduledTask[]
}

// ==================== Helper Functions ====================

function generateId(): string {
  return crypto.randomUUID()
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...task, 
                status: 'failed',
                metadata: { ...task.metadata, lastError: error },
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
          .filter((task) => task.status === 'pending' && task.nextRunAt)
          .sort((a, b) => (a.nextRunAt ?? 0) - (b.nextRunAt ?? 0))
          .slice(0, limit)
      },
      
      getTasksByStatus: (status) => {
        const { tasks } = get()
        return Object.values(tasks).filter((task) => task.status === status)
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
      .filter((task) => task.status === 'pending' && task.nextRunAt)
      .sort((a, b) => (a.nextRunAt ?? 0) - (b.nextRunAt ?? 0))
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

// ==================== Export ====================

export default useSchedulerStore
