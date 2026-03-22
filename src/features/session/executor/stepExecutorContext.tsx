/**
 * Step Executor Context - React Integration
 * Task 66: Story 44.3 - Step Executor
 * 
 * This module provides React context and hooks for step execution.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  StepExecutor,
  createStepExecutor,
  type StepExecutionInput,
  type StepExecutionResult,
  type ToolExecutor,
  type ExecutorState,
  type ExecutorContext,
  calculateTotalExecutionTime,
  getSuccessfulStepCount,
  getFailedStepCount,
} from './stepExecutor'
import type { RuntimeStateMachine } from '../runtime/runtimeStateMachine'
import type { RuntimeEventEmitter } from '../../streaming/runtime/runtimeEvents'
import type { StructuredPlanner, Plan, PlanStep } from '../planner/structuredPlanner'

// ==================== Context Types ====================

/**
 * Step executor context value
 */
export interface StepExecutorContextValue {
  // State
  state: ExecutorState
  context: ExecutorContext
  isBusy: boolean
  currentStepId: string | null
  lastError: string | null
  executionHistory: StepExecutionResult[]

  // Execution
  executeStep: (input: StepExecutionInput) => Promise<StepExecutionResult>
  executePlan: (plan: Plan) => Promise<StepExecutionResult[]>
  continueAfterConfirmation: (plan: Plan, confirmed: boolean, fromStepId?: string) => Promise<StepExecutionResult[]>

  // State management
  reset: () => void
  getContext: () => ExecutorContext

  // Tool registration
  registerToolExecutor: (toolId: string, executor: ToolExecutor) => void
  unregisterToolExecutor: (toolId: string) => void
  hasToolExecutor: (toolId: string) => boolean

  // Helpers
  getTotalExecutionTime: () => number
  getSuccessfulCount: () => number
  getFailedCount: () => number

  // Listeners
  addContextListener: (listener: (context: ExecutorContext) => void) => () => void
}

/**
 * Step executor provider props
 */
export interface StepExecutorProviderProps {
  children: ReactNode
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

// ==================== Context ====================

const StepExecutorContext = createContext<StepExecutorContextValue | null>(null)

/**
 * Step Executor Provider Component
 */
export function StepExecutorProvider({
  children,
  runtimeStateMachine,
  planner,
  eventEmitter,
  toolExecutors,
  defaultTimeout,
  maxRetries,
  onStepStart,
  onStepComplete,
  onStepError,
}: StepExecutorProviderProps) {
  const executorRef = useRef<StepExecutor | null>(null)

  // State
  const [state, setState] = useState<ExecutorState>('idle')
  const [context, setContext] = useState<ExecutorContext>({
    state: 'idle',
    currentStepId: null,
    currentTaskId: null,
    executionHistory: [],
    lastError: null,
    startedAt: null,
    completedAt: null,
  })

  // Initialize executor
  useEffect(() => {
    executorRef.current = createStepExecutor({
      runtimeStateMachine,
      planner,
      eventEmitter,
      toolExecutors,
      defaultTimeout,
      maxRetries,
      onStepStart,
      onStepComplete,
      onStepError,
    })

    // Subscribe to context changes
    const unsubscribe = executorRef.current.addContextListener(newContext => {
      setContext(newContext)
      setState(newContext.state)
    })

    return () => {
      unsubscribe()
      executorRef.current = null
    }
  }, [runtimeStateMachine, planner, eventEmitter, toolExecutors, defaultTimeout, maxRetries, onStepStart, onStepComplete, onStepError])

  // Execution functions
  const executeStep = useCallback(async (input: StepExecutionInput): Promise<StepExecutionResult> => {
    if (!executorRef.current) {
      return {
        stepId: input.stepId,
        status: 'failed',
        error: 'Executor not initialized',
        timestamp: Date.now(),
        duration: 0,
      }
    }
    return executorRef.current.executeStep(input)
  }, [])

  const executePlan = useCallback(async (plan: Plan): Promise<StepExecutionResult[]> => {
    if (!executorRef.current) {
      return []
    }
    return executorRef.current.executePlan(plan)
  }, [])

  const continueAfterConfirmation = useCallback(
    async (plan: Plan, confirmed: boolean, fromStepId?: string): Promise<StepExecutionResult[]> => {
      if (!executorRef.current) {
        return []
      }
      return executorRef.current.continueAfterConfirmation(plan, confirmed, fromStepId)
    },
    []
  )

  // State management
  const reset = useCallback(() => {
    executorRef.current?.reset()
  }, [])

  const getContext = useCallback(() => {
    return executorRef.current?.getContext() ?? context
  }, [context])

  // Tool registration
  const registerToolExecutor = useCallback((toolId: string, executor: ToolExecutor) => {
    executorRef.current?.registerToolExecutor(toolId, executor)
  }, [])

  const unregisterToolExecutor = useCallback((toolId: string) => {
    executorRef.current?.unregisterToolExecutor(toolId)
  }, [])

  const hasToolExecutor = useCallback((toolId: string) => {
    return executorRef.current?.hasToolExecutor(toolId) ?? false
  }, [])

  // Helpers
  const getTotalExecutionTime = useCallback(() => {
    return calculateTotalExecutionTime(context.executionHistory)
  }, [context.executionHistory])

  const getSuccessfulCount = useCallback(() => {
    return getSuccessfulStepCount(context.executionHistory)
  }, [context.executionHistory])

  const getFailedCount = useCallback(() => {
    return getFailedStepCount(context.executionHistory)
  }, [context.executionHistory])

  // Listeners
  const addContextListener = useCallback((listener: (context: ExecutorContext) => void) => {
    return executorRef.current?.addContextListener(listener) ?? (() => {})
  }, [])

  const value: StepExecutorContextValue = {
    state,
    context,
    isBusy: state === 'running' || state === 'waiting',
    currentStepId: context.currentStepId,
    lastError: context.lastError,
    executionHistory: context.executionHistory,

    executeStep,
    executePlan,
    continueAfterConfirmation,

    reset,
    getContext,

    registerToolExecutor,
    unregisterToolExecutor,
    hasToolExecutor,

    getTotalExecutionTime,
    getSuccessfulCount,
    getFailedCount,

    addContextListener,
  }

  return <StepExecutorContext.Provider value={value}>{children}</StepExecutorContext.Provider>
}

// ==================== Hooks ====================

/**
 * Get step executor context
 */
export function useStepExecutorContext(): StepExecutorContextValue {
  const context = useContext(StepExecutorContext)
  if (!context) {
    throw new Error('useStepExecutorContext must be used within a StepExecutorProvider')
  }
  return context
}

/**
 * Get executor state
 */
export function useExecutorState(): {
  state: ExecutorState
  isBusy: boolean
  lastError: string | null
} {
  const { state, isBusy, lastError } = useStepExecutorContext()
  return { state, isBusy, lastError }
}

/**
 * Get execution functions
 */
export function useStepExecution(): {
  executeStep: (input: StepExecutionInput) => Promise<StepExecutionResult>
  executePlan: (plan: Plan) => Promise<StepExecutionResult[]>
  continueAfterConfirmation: (plan: Plan, confirmed: boolean, fromStepId?: string) => Promise<StepExecutionResult[]>
} {
  const { executeStep, executePlan, continueAfterConfirmation } = useStepExecutorContext()
  return { executeStep, executePlan, continueAfterConfirmation }
}

/**
 * Get execution history
 */
export function useExecutionHistory(): {
  executionHistory: StepExecutionResult[]
  getTotalExecutionTime: () => number
  getSuccessfulCount: () => number
  getFailedCount: () => number
} {
  const { executionHistory, getTotalExecutionTime, getSuccessfulCount, getFailedCount } =
    useStepExecutorContext()
  return { executionHistory, getTotalExecutionTime, getSuccessfulCount, getFailedCount }
}

/**
 * Get tool registration functions
 */
export function useToolRegistration(): {
  registerToolExecutor: (toolId: string, executor: ToolExecutor) => void
  unregisterToolExecutor: (toolId: string) => void
  hasToolExecutor: (toolId: string) => boolean
} {
  const { registerToolExecutor, unregisterToolExecutor, hasToolExecutor } =
    useStepExecutorContext()
  return { registerToolExecutor, unregisterToolExecutor, hasToolExecutor }
}

// ==================== Factory Functions ====================

/**
 * Create step executor provider props for workbench
 */
export function createWorkbenchStepExecutorProps(
  runtimeStateMachine: RuntimeStateMachine,
  planner: StructuredPlanner,
  eventEmitter?: RuntimeEventEmitter
): Omit<StepExecutorProviderProps, 'children'> {
  return {
    runtimeStateMachine,
    planner,
    eventEmitter,
    defaultTimeout: 60000,
    maxRetries: 3,
  }
}
