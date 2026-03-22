/**
 * Step Executor - Runtime Step Execution
 * Task 66: Story 44.3 - Step Executor
 * 
 * This module executes plan steps through the runtime:
 * - Maps plan steps to runtime actions
 * - Invokes tools through executor contracts
 * - Handles synchronous and streaming results
 * - Updates state and message parts after each step
 */

import type { RuntimeStateMachine, StepRecord } from '../runtime/runtimeStateMachine'
import type { RuntimeEventEmitter } from '../../streaming/runtime/runtimeEvents'
import type { StructuredPlanner, Plan, PlanStep, PlanStepStatus } from '../planner/structuredPlanner'

// ==================== Step Execution Types ====================

/**
 * Execution result status
 */
export type ExecutionStatus =
  | 'success'      // Step completed successfully
  | 'failed'       // Step failed with error
  | 'cancelled'    // Step was cancelled
  | 'skipped'      // Step was skipped
  | 'pending'      // Step is pending input
  | 'waiting'      // Step is waiting for confirmation

/**
 * Step execution input
 */
export interface StepExecutionInput {
  stepId: string
  step: PlanStep
  context?: Record<string, unknown>
  previousOutput?: Record<string, unknown>
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  stepId: string
  status: ExecutionStatus
  output?: Record<string, unknown>
  error?: string
  message?: string
  requiresConfirmation?: boolean
  confirmationMessage?: string
  confirmationOptions?: string[]
  timestamp: number
  duration: number
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  toolId: string
  toolName: string
  parameters: Record<string, unknown>
  sessionId: string
  stepId: string
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  streaming?: boolean
  chunks?: unknown[]
}

/**
 * Tool executor interface
 */
export interface ToolExecutor {
  execute(context: ToolExecutionContext): Promise<ToolExecutionResult>
  canExecute(toolId: string): boolean
}

/**
 * Step executor configuration
 */
export interface StepExecutorConfig {
  runtimeStateMachine: RuntimeStateMachine
  planner: StructuredPlanner
  eventEmitter?: RuntimeEventEmitter
  toolExecutors?: Map<string, ToolExecutor>
  defaultTimeout?: number
  maxRetries?: number
  onStepStart?: (step: PlanStep) => void
  onStepComplete?: (result: StepExecutionResult) => void
  onStepError?: (step: PlanStep, error: string) => void
}

/**
 * Executor state
 */
export type ExecutorState =
  | 'idle'         // No execution in progress
  | 'running'      // Executing a step
  | 'waiting'      // Waiting for confirmation
  | 'paused'       // Execution paused
  | 'completed'    // All steps completed
  | 'failed'       // Execution failed

/**
 * Executor context
 */
export interface ExecutorContext {
  state: ExecutorState
  currentStepId: string | null
  currentTaskId: string | null
  executionHistory: StepExecutionResult[]
  lastError: string | null
  startedAt: number | null
  completedAt: number | null
}

// ==================== Step Executor ====================

/**
 * Step Executor
 * Executes plan steps through the runtime
 */
export class StepExecutor {
  private runtimeStateMachine: RuntimeStateMachine
  private _planner: StructuredPlanner
  private eventEmitter?: RuntimeEventEmitter
  private toolExecutors: Map<string, ToolExecutor>
  private defaultTimeout: number
  private maxRetries: number

  private onStepStart?: (step: PlanStep) => void
  private onStepComplete?: (result: StepExecutionResult) => void
  private onStepError?: (step: PlanStep, error: string) => void

  private context: ExecutorContext
  private listeners: Set<(context: ExecutorContext) => void> = new Set()

  constructor(config: StepExecutorConfig) {
    this.runtimeStateMachine = config.runtimeStateMachine
    this._planner = config.planner
    this.eventEmitter = config.eventEmitter
    this.toolExecutors = config.toolExecutors ?? new Map()
    this.defaultTimeout = config.defaultTimeout ?? 60000
    this.maxRetries = config.maxRetries ?? 3

    this.onStepStart = config.onStepStart
    this.onStepComplete = config.onStepComplete
    this.onStepError = config.onStepError

    this.context = {
      state: 'idle',
      currentStepId: null,
      currentTaskId: null,
      executionHistory: [],
      lastError: null,
      startedAt: null,
      completedAt: null,
    }
  }

  // ==================== Step Mapping ====================

  /**
   * Map a plan step to a runtime action
   */
  mapStepToAction(step: PlanStep): RuntimeAction {
    const action: RuntimeAction = {
      type: this.getActionType(step),
      stepId: step.id,
      name: step.name,
      input: step.input,
      requiresConfirmation: !!step.confirmationRequirement,
      confirmationConfig: step.confirmationRequirement,
      toolConfig: step.toolRequirement,
    }

    return action
  }

  /**
   * Get action type from step type
   */
  private getActionType(step: PlanStep): RuntimeActionType {
    switch (step.type) {
      case 'tool_call':
        return 'tool'
      case 'confirmation':
        return 'confirm'
      case 'wait':
        return 'wait'
      case 'decision':
        return 'branch'
      case 'parallel':
        return 'parallel'
      case 'subtask':
        return 'subtask'
      default:
        return 'action'
    }
  }

  // ==================== Step Execution ====================

  /**
   * Execute a single step
   */
  async executeStep(stepInput: StepExecutionInput): Promise<StepExecutionResult> {
    const startTime = Date.now()
    const { stepId, step, context, previousOutput } = stepInput

    // Update context
    this.context.state = 'running'
    this.context.currentStepId = stepId
    this.notifyContextChange()

    // Emit step start event as debug event
    this.eventEmitter?.emitDebug({ stepId, stepName: step.name, phase: 'start' })

    // Notify step start
    this.onStepStart?.(step)

    try {
      // Check if step needs confirmation
      if (step.confirmationRequirement) {
        return this.handleConfirmation(step, startTime)
      }

      // Execute based on step type
      let result: StepExecutionResult

      switch (step.type) {
        case 'tool_call':
          result = await this.executeToolStep(step, context, previousOutput)
          break
        case 'wait':
          result = await this.executeWaitStep(step)
          break
        case 'action':
        default:
          result = await this.executeActionStep(step, context, previousOutput)
          break
      }

      // Calculate duration
      result.duration = Date.now() - startTime
      result.timestamp = Date.now()

      // Emit step complete event as debug event
      this.eventEmitter?.emitDebug({ stepId, status: result.status, duration: result.duration, phase: 'complete' })

      // Add to history
      this.context.executionHistory.push(result)

      // Notify step complete
      this.onStepComplete?.(result)

      // Update context based on result
      this.context.state = result.status === 'success' ? 'idle' : 'failed'
      this.notifyContextChange()

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      const result: StepExecutionResult = {
        stepId,
        status: 'failed',
        error: errorMessage,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      }

      // Emit error event
      this.eventEmitter?.emitError('TOOL_ERROR', errorMessage, true)

      // Add to history
      this.context.executionHistory.push(result)
      this.context.lastError = errorMessage
      this.context.state = 'failed'

      // Notify error
      this.onStepError?.(step, errorMessage)
      this.notifyContextChange()

      return result
    }
  }

  /**
   * Execute a tool step
   */
  private async executeToolStep(
    step: PlanStep,
    context?: Record<string, unknown>,
    _previousOutput?: Record<string, unknown>
  ): Promise<StepExecutionResult> {
    const startTime = Date.now()

    if (!step.toolRequirement) {
      return {
        stepId: step.id,
        status: 'failed',
        error: 'Tool requirement not specified',
        timestamp: Date.now(),
        duration: 0,
      }
    }

    const { toolId, toolName, parameters } = step.toolRequirement

    // Find tool executor
    const executor = this.toolExecutors.get(toolId)
    if (!executor) {
      // Try to find by name
      for (const [, exec] of this.toolExecutors) {
        if (exec.canExecute(toolId)) {
          return this.runToolExecutor(exec, {
            toolId,
            toolName,
            parameters: { ...parameters, ...context },
            sessionId: this.runtimeStateMachine.getContext().sessionId,
            stepId: step.id,
          }, startTime)
        }
      }

      return {
        stepId: step.id,
        status: 'failed',
        error: `No executor found for tool: ${toolId}`,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      }
    }

    return this.runToolExecutor(executor, {
      toolId,
      toolName,
      parameters: { ...parameters, ...context },
      sessionId: this.runtimeStateMachine.getContext().sessionId,
      stepId: step.id,
    }, startTime)
  }

  /**
   * Run a tool executor with retry logic
   */
  private async runToolExecutor(
    executor: ToolExecutor,
    context: ToolExecutionContext,
    startTime: number
  ): Promise<StepExecutionResult> {
    let lastError: string | undefined
    let retries = 0

    while (retries < this.maxRetries) {
      try {
        const result = await executor.execute(context)

        if (result.success) {
          return {
            stepId: context.stepId,
            status: 'success',
            output: result.output,
            message: result.streaming
              ? 'Streaming completed'
              : 'Tool executed successfully',
            timestamp: Date.now(),
            duration: Date.now() - startTime,
          }
        }

        lastError = result.error

        // Don't retry if not streaming or explicit failure
        if (!result.streaming || !result.error) {
          break
        }

        retries++
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        retries++
      }
    }

    return {
      stepId: context.stepId,
      status: 'failed',
      error: lastError ?? 'Tool execution failed',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    }
  }

  /**
   * Execute a wait step
   */
  private async executeWaitStep(step: PlanStep): Promise<StepExecutionResult> {
    const startTime = Date.now()
    const waitDuration = step.estimatedDuration ?? 1000

    // Wait for specified duration
    await new Promise(resolve => setTimeout(resolve, Math.min(waitDuration, this.defaultTimeout)))

    return {
      stepId: step.id,
      status: 'success',
      message: `Waited for ${waitDuration}ms`,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    }
  }

  /**
   * Execute a generic action step
   */
  private async executeActionStep(
    step: PlanStep,
    context?: Record<string, unknown>,
    _previousOutput?: Record<string, unknown>
  ): Promise<StepExecutionResult> {
    const startTime = Date.now()

    // For action steps, we simulate execution
    // In a real implementation, this would call the appropriate handler
    const output = {
      action: step.name,
      description: step.description,
      context,
      completed: true,
    }

    return {
      stepId: step.id,
      status: 'success',
      output,
      message: `Action '${step.name}' completed`,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    }
  }

  /**
   * Handle confirmation step
   */
  private handleConfirmation(step: PlanStep, startTime: number): StepExecutionResult {
    this.context.state = 'waiting'
    this.notifyContextChange()

    return {
      stepId: step.id,
      status: 'pending',
      requiresConfirmation: true,
      confirmationMessage: step.confirmationRequirement?.message ?? 'Confirm to continue',
      confirmationOptions: step.confirmationRequirement?.options,
      message: 'Waiting for confirmation',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    }
  }

  // ==================== Plan Execution ====================

  /**
   * Check if step dependencies are satisfied within a plan
   */
  private checkDependenciesSatisfied(step: PlanStep, plan: Plan): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true
    }

    return step.dependencies.every(dep => {
      const depStep = plan.steps.find(s => s.id === dep.stepId)
      if (!depStep) return false

      switch (dep.condition) {
        case 'success':
        case 'on_success':
          return depStep.status === 'completed'
        case 'failure':
        case 'on_failure':
          return depStep.status === 'failed'
        case 'always':
          return true
        default:
          return depStep.status === 'completed'
      }
    })
  }

  /**
   * Execute all steps in a plan
   */
  async executePlan(plan: Plan): Promise<StepExecutionResult[]> {
    const results: StepExecutionResult[] = []
    let previousOutput: Record<string, unknown> | undefined

    // Update context
    this.context.state = 'running'
    this.context.startedAt = Date.now()
    this.context.executionHistory = []
    this.notifyContextChange()

    // Start runtime state machine
    this.runtimeStateMachine.start('Plan execution started')

    for (const step of plan.steps) {
      // Check if step should be skipped
      if (step.status === 'skipped') {
        results.push({
          stepId: step.id,
          status: 'skipped',
          message: 'Step was skipped',
          timestamp: Date.now(),
          duration: 0,
        })
        continue
      }

      // Check dependencies locally
      if (!this.checkDependenciesSatisfied(step, plan)) {
        results.push({
          stepId: step.id,
          status: 'skipped',
          message: 'Dependencies not satisfied',
          timestamp: Date.now(),
          duration: 0,
        })
        continue
      }

      // Execute step
      const result = await this.executeStep({
        stepId: step.id,
        step,
        context: plan.context,
        previousOutput,
      })

      results.push(result)

      // Update previous output for next step
      if (result.output) {
        previousOutput = result.output
      }

      // Handle failure
      if (result.status === 'failed') {
        // Could implement retry logic here
        break
      }

      // Handle confirmation wait
      if (result.status === 'pending' && result.requiresConfirmation) {
        break
      }
    }

    // Update context
    this.context.completedAt = Date.now()
    this.context.state = this.context.lastError ? 'failed' : 'completed'
    this.notifyContextChange()

    return results
  }

  /**
   * Continue execution after confirmation
   */
  async continueAfterConfirmation(
    plan: Plan,
    confirmed: boolean,
    fromStepId?: string
  ): Promise<StepExecutionResult[]> {
    const results: StepExecutionResult[] = []
    const startIndex = fromStepId
      ? plan.steps.findIndex(s => s.id === fromStepId)
      : this.context.currentStepId
        ? plan.steps.findIndex(s => s.id === this.context.currentStepId)
        : 0

    if (startIndex < 0) {
      return results
    }

    // Handle the confirmation result
    const currentStep = plan.steps[startIndex]
    if (currentStep && currentStep.confirmationRequirement) {
      if (!confirmed) {
        results.push({
          stepId: currentStep.id,
          status: 'cancelled',
          message: 'User rejected confirmation',
          timestamp: Date.now(),
          duration: 0,
        })
        this.context.state = 'failed'
        this.notifyContextChange()
        return results
      }

      // Mark step as confirmed and update its status
      currentStep.status = 'completed'
      results.push({
        stepId: currentStep.id,
        status: 'success',
        message: 'Confirmed by user',
        timestamp: Date.now(),
        duration: 0,
      })
    }

    // Continue with remaining steps
    this.context.state = 'running'
    this.notifyContextChange()

    for (let i = startIndex + 1; i < plan.steps.length; i++) {
      const step = plan.steps[i]

      // Check dependencies locally
      if (!this.checkDependenciesSatisfied(step, plan)) {
        results.push({
          stepId: step.id,
          status: 'skipped',
          message: 'Dependencies not satisfied',
          timestamp: Date.now(),
          duration: 0,
        })
        continue
      }

      const result = await this.executeStep({
        stepId: step.id,
        step,
        context: plan.context,
      })
      results.push(result)

      if (result.status === 'failed' || (result.status === 'pending' && result.requiresConfirmation)) {
        break
      }
    }

    return results
  }

  // ==================== State Management ====================

  /**
   * Get current context
   */
  getContext(): ExecutorContext {
    return { ...this.context }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): StepExecutionResult[] {
    return [...this.context.executionHistory]
  }

  /**
   * Get current state
   */
  getState(): ExecutorState {
    return this.context.state
  }

  /**
   * Check if executor is busy
   */
  isBusy(): boolean {
    return this.context.state === 'running' || this.context.state === 'waiting'
  }

  /**
   * Reset executor state
   */
  reset(): void {
    this.context = {
      state: 'idle',
      currentStepId: null,
      currentTaskId: null,
      executionHistory: [],
      lastError: null,
      startedAt: null,
      completedAt: null,
    }
    this.notifyContextChange()
  }

  /**
   * Get the associated planner
   */
  getPlanner(): StructuredPlanner {
    return this._planner
  }

  // ==================== Tool Registration ====================

  /**
   * Register a tool executor
   */
  registerToolExecutor(toolId: string, executor: ToolExecutor): void {
    this.toolExecutors.set(toolId, executor)
  }

  /**
   * Unregister a tool executor
   */
  unregisterToolExecutor(toolId: string): void {
    this.toolExecutors.delete(toolId)
  }

  /**
   * Check if a tool executor exists
   */
  hasToolExecutor(toolId: string): boolean {
    return this.toolExecutors.has(toolId)
  }

  // ==================== Listeners ====================

  /**
   * Add context change listener
   */
  addContextListener(listener: (context: ExecutorContext) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify context change
   */
  private notifyContextChange(): void {
    const context = this.getContext()
    this.listeners.forEach(listener => listener(context))
  }
}

// ==================== Runtime Action Types ====================

/**
 * Runtime action type
 */
export type RuntimeActionType =
  | 'action'     // Generic action
  | 'tool'       // Tool execution
  | 'confirm'    // User confirmation
  | 'wait'       // Wait action
  | 'branch'     // Conditional branch
  | 'parallel'   // Parallel execution
  | 'subtask'    // Subtask execution

/**
 * Runtime action
 */
export interface RuntimeAction {
  type: RuntimeActionType
  stepId: string
  name: string
  input?: Record<string, unknown>
  requiresConfirmation?: boolean
  confirmationConfig?: PlanStep['confirmationRequirement']
  toolConfig?: PlanStep['toolRequirement']
}

// ==================== Utility Functions ====================

/**
 * Create step executor
 */
export function createStepExecutor(config: StepExecutorConfig): StepExecutor {
  return new StepExecutor(config)
}

/**
 * Convert plan step status to runtime step status
 */
export function planStepToRuntimeStatus(status: PlanStepStatus): StepRecord['status'] {
  const mapping: Record<PlanStepStatus, StepRecord['status']> = {
    pending: 'pending',
    ready: 'pending',
    running: 'running',
    waiting: 'waiting',
    completed: 'completed',
    failed: 'failed',
    skipped: 'skipped',
    cancelled: 'cancelled',
  }
  return mapping[status]
}

/**
 * Convert runtime step status to plan step status
 */
export function runtimeStatusToPlanStep(status: StepRecord['status']): PlanStepStatus {
  const mapping: Record<StepRecord['status'], PlanStepStatus> = {
    pending: 'pending',
    running: 'running',
    completed: 'completed',
    failed: 'failed',
    skipped: 'skipped',
    waiting: 'waiting',
    cancelled: 'cancelled',
  }
  return mapping[status]
}

/**
 * Calculate total execution time
 */
export function calculateTotalExecutionTime(history: StepExecutionResult[]): number {
  return history.reduce((total, result) => total + result.duration, 0)
}

/**
 * Get successful step count
 */
export function getSuccessfulStepCount(history: StepExecutionResult[]): number {
  return history.filter(r => r.status === 'success').length
}

/**
 * Get failed step count
 */
export function getFailedStepCount(history: StepExecutionResult[]): number {
  return history.filter(r => r.status === 'failed').length
}
