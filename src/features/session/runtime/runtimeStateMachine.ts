/**
 * Runtime State Machine - Agent Runtime State Transitions
 * Task 64: Story 44.1 - Agent Runtime State Machine
 * 
 * This module defines the runtime state machine for agent execution:
 * - Planning, Running, Confirmation, Completion, Failure states
 * - Valid state transitions
 * - State change events integration
 * - Step and task status persistence
 */

import type { RuntimeEventEmitter } from '../../streaming/runtime/runtimeEvents'

// ==================== Runtime States ====================

/**
 * Agent runtime states
 * The main states of agent execution lifecycle
 */
export type RuntimeState =
  | 'idle'           // No active execution
  | 'planning'       // Planning phase - analyzing request
  | 'running'        // Executing steps
  | 'confirming'     // Waiting for user confirmation
  | 'paused'         // Execution paused
  | 'completing'     // Finishing up execution
  | 'completed'      // Execution finished successfully
  | 'failed'         // Execution failed
  | 'cancelled'      // Execution cancelled by user
  | 'timeout'        // Execution timed out

/**
 * Runtime state transitions
 */
export type RuntimeTransition =
  | 'start'          // idle -> planning
  | 'plan'           // planning -> running
  | 'request_confirm'// running -> confirming
  | 'confirm'        // confirming -> running
  | 'reject'         // confirming -> failed
  | 'pause'          // running -> paused
  | 'resume'         // paused -> running
  | 'complete'       // running -> completing -> completed
  | 'finish'         // completing -> completed
  | 'fail'           // running/confirming -> failed
  | 'cancel'         // any active -> cancelled
  | 'timeout'        // any active -> timeout
  | 'retry'          // failed -> planning
  | 'reset'          // completed/failed/cancelled/timeout -> idle

/**
 * Valid runtime state transitions
 */
export const VALID_RUNTIME_TRANSITIONS: Record<RuntimeState, RuntimeTransition[]> = {
  idle: ['start'],
  planning: ['plan', 'fail', 'cancel', 'timeout'],
  running: ['request_confirm', 'pause', 'complete', 'fail', 'cancel', 'timeout'],
  confirming: ['confirm', 'reject', 'cancel', 'timeout'],
  paused: ['resume', 'cancel', 'timeout'],
  completing: ['finish', 'fail', 'cancel'],
  completed: ['reset'],
  failed: ['retry', 'reset'],
  cancelled: ['reset'],
  timeout: ['reset'],
}

/**
 * Runtime transition targets
 */
export const RUNTIME_TRANSITION_TARGETS: Record<RuntimeTransition, RuntimeState> = {
  start: 'planning',
  plan: 'running',
  request_confirm: 'confirming',
  confirm: 'running',
  reject: 'failed',
  pause: 'paused',
  resume: 'running',
  complete: 'completing',
  finish: 'completed',
  fail: 'failed',
  cancel: 'cancelled',
  timeout: 'timeout',
  retry: 'planning',
  reset: 'idle',
}

// ==================== Step and Task States ====================

/**
 * Step execution state
 */
export type StepStatus =
  | 'pending'        // Step not yet started
  | 'running'        // Step currently executing
  | 'waiting'        // Step waiting for external input
  | 'completed'      // Step finished successfully
  | 'failed'         // Step failed
  | 'skipped'        // Step was skipped
  | 'cancelled'      // Step was cancelled

/**
 * Task execution state
 */
export type TaskStatus =
  | 'pending'        // Task not yet started
  | 'queued'         // Task queued for execution
  | 'running'        // Task currently executing
  | 'paused'         // Task paused
  | 'completed'      // Task finished successfully
  | 'partial'        // Task partially completed
  | 'failed'         // Task failed
  | 'cancelled'      // Task was cancelled
  | 'timeout'        // Task timed out

/**
 * Step record
 */
export interface StepRecord {
  id: string
  taskId: string
  name: string
  type: 'planning' | 'execution' | 'tool_call' | 'confirmation' | 'completion'
  status: StepStatus
  order: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  startedAt?: number
  completedAt?: number
  duration?: number
  metadata?: Record<string, unknown>
}

/**
 * Task record
 */
export interface TaskRecord {
  id: string
  sessionId: string
  name: string
  description?: string
  status: TaskStatus
  priority: 'low' | 'normal' | 'high' | 'critical'
  steps: StepRecord[]
  currentStepId?: string
  progress: number  // 0-100
  result?: unknown
  error?: string
  startedAt?: number
  completedAt?: number
  duration?: number
  metadata?: Record<string, unknown>
}

// ==================== Runtime State Context ====================

/**
 * Runtime state context
 */
export interface RuntimeStateContext {
  state: RuntimeState
  previousState?: RuntimeState
  sessionId: string
  currentTask?: TaskRecord
  currentStep?: StepRecord
  tasks: TaskRecord[]
  startedAt?: number
  lastStateChangeAt: number
  stateChangeCount: number
  error?: {
    code: string
    message: string
    timestamp: number
  }
  confirmation?: {
    id: string
    type: 'user' | 'permission' | 'approval'
    message: string
    options?: string[]
    requestedAt: number
    timeout?: number
  }
  metadata?: Record<string, unknown>
}

/**
 * Runtime state change event
 */
export interface RuntimeStateChangeEvent {
  sessionId: string
  previousState: RuntimeState
  newState: RuntimeState
  transition: RuntimeTransition
  timestamp: number
  reason?: string
  task?: TaskRecord
  step?: StepRecord
}

// ==================== State Machine ====================

/**
 * Runtime state machine configuration
 */
export interface RuntimeStateMachineConfig {
  sessionId: string
  eventEmitter?: RuntimeEventEmitter
  onStateChange?: (event: RuntimeStateChangeEvent) => void
  onStepChange?: (step: StepRecord, previousStatus: StepStatus) => void
  onTaskChange?: (task: TaskRecord, previousStatus: TaskStatus) => void
  persistState?: boolean
  stateTimeout?: number
}

/**
 * Runtime state machine
 * 
 * Manages runtime state transitions and step/task status.
 */
export class RuntimeStateMachine {
  private sessionId: string
  private eventEmitter?: RuntimeEventEmitter
  private onStateChange?: (event: RuntimeStateChangeEvent) => void
  private onStepChange?: (step: StepRecord, previousStatus: StepStatus) => void
  private onTaskChange?: (task: TaskRecord, previousStatus: TaskStatus) => void
  private persistState: boolean

  private context: RuntimeStateContext
  private stateListeners: Set<(event: RuntimeStateChangeEvent) => void> = new Set()
  private stepListeners: Set<(step: StepRecord, previousStatus: StepStatus) => void> = new Set()
  private taskListeners: Set<(task: TaskRecord, previousStatus: TaskStatus) => void> = new Set()

  constructor(config: RuntimeStateMachineConfig) {
    this.sessionId = config.sessionId
    this.eventEmitter = config.eventEmitter
    this.onStateChange = config.onStateChange
    this.onStepChange = config.onStepChange
    this.onTaskChange = config.onTaskChange
    this.persistState = config.persistState ?? true

    this.context = {
      state: 'idle',
      sessionId: config.sessionId,
      tasks: [],
      lastStateChangeAt: Date.now(),
      stateChangeCount: 0,
    }
  }

  // ==================== State Transitions ====================

  /**
   * Check if a transition is valid from current state
   */
  isValidTransition(transition: RuntimeTransition): boolean {
    const currentTransitions = VALID_RUNTIME_TRANSITIONS[this.context.state]
    return currentTransitions.includes(transition)
  }

  /**
   * Get the target state for a transition
   */
  getTransitionTarget(transition: RuntimeTransition): RuntimeState {
    return RUNTIME_TRANSITION_TARGETS[transition]
  }

  /**
   * Attempt a state transition
   */
  transition(
    transition: RuntimeTransition,
    reason?: string,
    metadata?: Record<string, unknown>
  ): boolean {
    if (!this.isValidTransition(transition)) {
      return false
    }

    const previousState = this.context.state
    const newState = this.getTransitionTarget(transition)

    // Create event
    const event: RuntimeStateChangeEvent = {
      sessionId: this.sessionId,
      previousState,
      newState,
      transition,
      timestamp: Date.now(),
      reason,
      task: this.context.currentTask,
      step: this.context.currentStep,
    }

    // Update context
    this.context.previousState = previousState
    this.context.state = newState
    this.context.lastStateChangeAt = event.timestamp
    this.context.stateChangeCount++

    if (metadata) {
      this.context.metadata = { ...this.context.metadata, ...metadata }
    }

    // Handle special transitions
    this.handleTransition(transition, event)

    // Notify listeners
    this.notifyStateListeners(event)
    this.onStateChange?.(event)

    // Emit to event emitter if available
    if (this.eventEmitter) {
      this.emitRuntimeStateEvent(event)
    }

    // Persist if enabled
    if (this.persistState) {
      this.persistCurrentState()
    }

    return true
  }

  /**
   * Handle special transition logic
   */
  private handleTransition(transition: RuntimeTransition, event: RuntimeStateChangeEvent): void {
    switch (transition) {
      case 'start':
        this.context.startedAt = event.timestamp
        this.context.error = undefined
        this.context.confirmation = undefined
        break

      case 'complete':
        // Update task progress to 100%
        if (this.context.currentTask) {
          this.updateTaskProgress(this.context.currentTask.id, 100)
        }
        break

      case 'finish':
        // Mark current task as completed
        if (this.context.currentTask) {
          this.updateTaskStatus(this.context.currentTask.id, 'completed')
        }
        break

      case 'fail':
        // Mark current step as failed
        if (this.context.currentStep) {
          this.updateStepStatus(this.context.currentStep.id, 'failed', event.reason)
        }
        // Mark current task as failed
        if (this.context.currentTask) {
          this.updateTaskStatus(this.context.currentTask.id, 'failed')
        }
        if (event.reason) {
          this.context.error = {
            code: 'RUNTIME_ERROR',
            message: event.reason,
            timestamp: event.timestamp,
          }
        }
        break

      case 'cancel':
        // Mark current step and task as cancelled
        if (this.context.currentStep) {
          this.updateStepStatus(this.context.currentStep.id, 'cancelled')
        }
        if (this.context.currentTask) {
          this.updateTaskStatus(this.context.currentTask.id, 'cancelled')
        }
        break

      case 'timeout':
        // Mark current step and task as timeout
        if (this.context.currentStep) {
          this.updateStepStatus(this.context.currentStep.id, 'failed', 'Timeout')
        }
        if (this.context.currentTask) {
          this.updateTaskStatus(this.context.currentTask.id, 'timeout')
        }
        this.context.error = {
          code: 'TIMEOUT',
          message: 'Execution timed out',
          timestamp: event.timestamp,
        }
        break

      case 'reset':
        // Clear all state
        this.context.currentTask = undefined
        this.context.currentStep = undefined
        this.context.error = undefined
        this.context.confirmation = undefined
        this.context.startedAt = undefined
        this.context.metadata = undefined
        break
    }
  }

  // ==================== Convenience Methods ====================

  /**
   * Start execution
   */
  start(reason?: string): boolean {
    return this.transition('start', reason)
  }

  /**
   * Begin running after planning
   */
  beginExecution(): boolean {
    return this.transition('plan')
  }

  /**
   * Request user confirmation
   */
  requestConfirmation(
    type: 'user' | 'permission' | 'approval',
    message: string,
    options?: string[],
    timeout?: number
  ): boolean {
    if (!this.transition('request_confirm', message)) {
      return false
    }

    this.context.confirmation = {
      id: this.generateId(),
      type,
      message,
      options,
      requestedAt: Date.now(),
      timeout,
    }

    return true
  }

  /**
   * Confirm and continue
   */
  confirm(): boolean {
    const success = this.transition('confirm', 'User confirmed')
    if (success) {
      this.context.confirmation = undefined
    }
    return success
  }

  /**
   * Reject confirmation
   */
  reject(reason?: string): boolean {
    return this.transition('reject', reason ?? 'User rejected')
  }

  /**
   * Pause execution
   */
  pause(reason?: string): boolean {
    return this.transition('pause', reason)
  }

  /**
   * Resume from pause
   */
  resume(): boolean {
    return this.transition('resume')
  }

  /**
   * Complete execution
   */
  complete(): boolean {
    return this.transition('complete')
  }

  /**
   * Finish completion
   */
  finish(): boolean {
    return this.transition('finish')
  }

  /**
   * Fail execution
   */
  fail(reason: string): boolean {
    return this.transition('fail', reason)
  }

  /**
   * Cancel execution
   */
  cancel(reason?: string): boolean {
    return this.transition('cancel', reason)
  }

  /**
   * Mark as timed out
   */
  markTimeout(): boolean {
    return this.transition('timeout')
  }

  /**
   * Retry from failure
   */
  retry(): boolean {
    return this.transition('retry')
  }

  /**
   * Reset to idle
   */
  reset(): boolean {
    return this.transition('reset')
  }

  // ==================== Task Management ====================

  /**
   * Create a new task
   */
  createTask(
    name: string,
    description?: string,
    priority: TaskRecord['priority'] = 'normal',
    metadata?: Record<string, unknown>
  ): TaskRecord {
    const task: TaskRecord = {
      id: this.generateId(),
      sessionId: this.sessionId,
      name,
      description,
      status: 'pending',
      priority,
      steps: [],
      progress: 0,
      metadata,
    }

    this.context.tasks.push(task)
    return task
  }

  /**
   * Start a task
   */
  startTask(taskId: string): boolean {
    const task = this.getTask(taskId)
    if (!task) return false

    const previousStatus = task.status
    task.status = 'running'
    task.startedAt = Date.now()
    this.context.currentTask = task

    this.notifyTaskListeners(task, previousStatus)
    this.onTaskChange?.(task, previousStatus)

    return true
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskStatus, error?: string): boolean {
    const task = this.getTask(taskId)
    if (!task) return false

    const previousStatus = task.status
    task.status = status
    if (error) task.error = error
    if (status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'timeout') {
      task.completedAt = Date.now()
      if (task.startedAt) {
        task.duration = task.completedAt - task.startedAt
      }
    }

    this.notifyTaskListeners(task, previousStatus)
    this.onTaskChange?.(task, previousStatus)

    return true
  }

  /**
   * Update task progress
   */
  updateTaskProgress(taskId: string, progress: number): boolean {
    const task = this.getTask(taskId)
    if (!task) return false

    task.progress = Math.min(100, Math.max(0, progress))
    return true
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): TaskRecord | undefined {
    return this.context.tasks.find(t => t.id === taskId)
  }

  /**
   * Get all tasks
   */
  getTasks(): TaskRecord[] {
    return [...this.context.tasks]
  }

  /**
   * Get current task
   */
  getCurrentTask(): TaskRecord | undefined {
    return this.context.currentTask
  }

  // ==================== Step Management ====================

  /**
   * Create a new step
   */
  createStep(
    taskId: string,
    name: string,
    type: StepRecord['type'],
    input?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): StepRecord | null {
    const task = this.getTask(taskId)
    if (!task) return null

    const step: StepRecord = {
      id: this.generateId(),
      taskId,
      name,
      type,
      status: 'pending',
      order: task.steps.length,
      input,
      metadata,
    }

    task.steps.push(step)
    return step
  }

  /**
   * Start a step
   */
  startStep(stepId: string): boolean {
    const step = this.getStep(stepId)
    if (!step) return false

    const previousStatus = step.status
    step.status = 'running'
    step.startedAt = Date.now()
    this.context.currentStep = step

    // Update task current step
    const task = this.getTask(step.taskId)
    if (task) {
      task.currentStepId = stepId
    }

    this.notifyStepListeners(step, previousStatus)
    this.onStepChange?.(step, previousStatus)

    return true
  }

  /**
   * Complete a step
   */
  completeStep(stepId: string, output?: Record<string, unknown>): boolean {
    const step = this.getStep(stepId)
    if (!step) return false

    const previousStatus = step.status
    step.status = 'completed'
    step.output = output
    step.completedAt = Date.now()
    if (step.startedAt) {
      step.duration = step.completedAt - step.startedAt
    }

    // Update task progress
    const task = this.getTask(step.taskId)
    if (task) {
      const completedSteps = task.steps.filter(s => s.status === 'completed').length
      task.progress = Math.round((completedSteps / task.steps.length) * 100)
    }

    this.notifyStepListeners(step, previousStatus)
    this.onStepChange?.(step, previousStatus)

    return true
  }

  /**
   * Update step status
   */
  updateStepStatus(stepId: string, status: StepStatus, error?: string): boolean {
    const step = this.getStep(stepId)
    if (!step) return false

    const previousStatus = step.status
    step.status = status
    if (error) step.error = error
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      step.completedAt = Date.now()
      if (step.startedAt) {
        step.duration = step.completedAt - step.startedAt
      }
    }

    this.notifyStepListeners(step, previousStatus)
    this.onStepChange?.(step, previousStatus)

    return true
  }

  /**
   * Get step by ID
   */
  getStep(stepId: string): StepRecord | undefined {
    for (const task of this.context.tasks) {
      const step = task.steps.find(s => s.id === stepId)
      if (step) return step
    }
    return undefined
  }

  /**
   * Get steps for a task
   */
  getTaskSteps(taskId: string): StepRecord[] {
    const task = this.getTask(taskId)
    return task ? [...task.steps] : []
  }

  /**
   * Get current step
   */
  getCurrentStep(): StepRecord | undefined {
    return this.context.currentStep
  }

  // ==================== State Access ====================

  /**
   * Get current state
   */
  getState(): RuntimeState {
    return this.context.state
  }

  /**
   * Get full context
   */
  getContext(): RuntimeStateContext {
    return { ...this.context }
  }

  /**
   * Check if state is active (not idle/completed/failed/cancelled/timeout)
   */
  isActive(): boolean {
    return ['planning', 'running', 'confirming', 'paused', 'completing'].includes(this.context.state)
  }

  /**
   * Check if state is terminal (completed/failed/cancelled/timeout)
   */
  isTerminal(): boolean {
    return ['completed', 'failed', 'cancelled', 'timeout'].includes(this.context.state)
  }

  /**
   * Get current confirmation request
   */
  getConfirmation(): RuntimeStateContext['confirmation'] {
    return this.context.confirmation
  }

  /**
   * Get error info
   */
  getError(): RuntimeStateContext['error'] {
    return this.context.error
  }

  // ==================== Listeners ====================

  /**
   * Add state listener
   */
  addStateListener(listener: (event: RuntimeStateChangeEvent) => void): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  /**
   * Add step listener
   */
  addStepListener(listener: (step: StepRecord, previousStatus: StepStatus) => void): () => void {
    this.stepListeners.add(listener)
    return () => this.stepListeners.delete(listener)
  }

  /**
   * Add task listener
   */
  addTaskListener(listener: (task: TaskRecord, previousStatus: TaskStatus) => void): () => void {
    this.taskListeners.add(listener)
    return () => this.taskListeners.delete(listener)
  }

  /**
   * Notify state listeners
   */
  private notifyStateListeners(event: RuntimeStateChangeEvent): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  /**
   * Notify step listeners
   */
  private notifyStepListeners(step: StepRecord, previousStatus: StepStatus): void {
    this.stepListeners.forEach(listener => {
      try {
        listener(step, previousStatus)
      } catch (error) {
        console.error('Error in step listener:', error)
      }
    })
  }

  /**
   * Notify task listeners
   */
  private notifyTaskListeners(task: TaskRecord, previousStatus: TaskStatus): void {
    this.taskListeners.forEach(listener => {
      try {
        listener(task, previousStatus)
      } catch (error) {
        console.error('Error in task listener:', error)
      }
    })
  }

  // ==================== Persistence ====================

  /**
   * Persist current state to storage
   */
  private persistCurrentState(): void {
    try {
      const key = `runtime_state_${this.sessionId}`
      const data = JSON.stringify(this.context)
      localStorage.setItem(key, data)
    } catch (error) {
      console.warn('Failed to persist runtime state:', error)
    }
  }

  /**
   * Restore state from storage
   */
  restoreState(): boolean {
    try {
      const key = `runtime_state_${this.sessionId}`
      const data = localStorage.getItem(key)
      if (!data) return false

      this.context = JSON.parse(data)
      return true
    } catch (error) {
      console.warn('Failed to restore runtime state:', error)
      return false
    }
  }

  /**
   * Clear persisted state
   */
  clearPersistedState(): void {
    try {
      const key = `runtime_state_${this.sessionId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear persisted state:', error)
    }
  }

  // ==================== Utilities ====================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Emit runtime state event through event emitter
   */
  private emitRuntimeStateEvent(event: RuntimeStateChangeEvent): void {
    if (!this.eventEmitter) return

    this.eventEmitter.emitDebug({
      type: 'runtime_state_change',
      ...event,
    })
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }
}

// ==================== Helper Functions ====================

/**
 * Create a runtime state machine
 */
export function createRuntimeStateMachine(
  sessionId: string,
  options?: Partial<RuntimeStateMachineConfig>
): RuntimeStateMachine {
  return new RuntimeStateMachine({
    sessionId,
    ...options,
  })
}

/**
 * Check if a state is active
 */
export function isRuntimeActive(state: RuntimeState): boolean {
  return ['planning', 'running', 'confirming', 'paused', 'completing'].includes(state)
}

/**
 * Check if a state is terminal
 */
export function isRuntimeTerminal(state: RuntimeState): boolean {
  return ['completed', 'failed', 'cancelled', 'timeout'].includes(state)
}

/**
 * Check if a state requires user interaction
 */
export function isRuntimeWaitingForInput(state: RuntimeState): boolean {
  return state === 'confirming' || state === 'paused'
}

/**
 * Get state display name
 */
export function getRuntimeStateName(state: RuntimeState): string {
  const names: Record<RuntimeState, string> = {
    idle: 'Idle',
    planning: 'Planning',
    running: 'Running',
    confirming: 'Waiting for Confirmation',
    paused: 'Paused',
    completing: 'Completing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    timeout: 'Timeout',
  }
  return names[state] ?? state
}

/**
 * Calculate overall progress from tasks
 */
export function calculateOverallProgress(tasks: TaskRecord[]): number {
  if (tasks.length === 0) return 0

  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0)
  return Math.round(totalProgress / tasks.length)
}

/**
 * Get active task from tasks list
 */
export function getActiveTask(tasks: TaskRecord[]): TaskRecord | undefined {
  return tasks.find(t => t.status === 'running' || t.status === 'paused')
}

/**
 * Get pending tasks count
 */
export function getPendingTasksCount(tasks: TaskRecord[]): number {
  return tasks.filter(t => t.status === 'pending' || t.status === 'queued').length
}

/**
 * Get completed tasks count
 */
export function getCompletedTasksCount(tasks: TaskRecord[]): number {
  return tasks.filter(t => t.status === 'completed').length
}

/**
 * Get failed tasks count
 */
export function getFailedTasksCount(tasks: TaskRecord[]): number {
  return tasks.filter(t => t.status === 'failed' || t.status === 'cancelled' || t.status === 'timeout').length
}
