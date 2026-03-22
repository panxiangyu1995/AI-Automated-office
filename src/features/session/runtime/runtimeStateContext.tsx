/**
 * Runtime State Context - React Integration for Runtime State Machine
 * Task 64: Story 44.1 - Agent Runtime State Machine
 * 
 * This module provides React context and hooks for runtime state management.
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
  RuntimeStateMachine,
  createRuntimeStateMachine,
  type RuntimeState,
  type RuntimeStateChangeEvent,
  type StepRecord,
  type StepStatus,
  type TaskRecord,
  type TaskStatus,
  isRuntimeActive,
  isRuntimeTerminal,
  isRuntimeWaitingForInput,
  getRuntimeStateName,
  calculateOverallProgress,
} from './runtimeStateMachine'
import type { RuntimeEventEmitter } from '../../streaming/runtime/runtimeEvents'

// ==================== Context Types ====================

/**
 * Runtime state context value
 */
export interface RuntimeStateContextValue {
  // State
  state: RuntimeState
  isActive: boolean
  isTerminal: boolean
  isWaitingForInput: boolean
  stateName: string
  context: ReturnType<RuntimeStateMachine['getContext']>

  // Tasks
  tasks: TaskRecord[]
  currentTask: TaskRecord | undefined
  overallProgress: number

  // Steps
  currentStep: StepRecord | undefined

  // Confirmation
  confirmation: ReturnType<RuntimeStateMachine['getConfirmation']>

  // Error
  error: ReturnType<RuntimeStateMachine['getError']>

  // State transitions
  start: (reason?: string) => boolean
  beginExecution: () => boolean
  requestConfirmation: (
    type: 'user' | 'permission' | 'approval',
    message: string,
    options?: string[],
    timeout?: number
  ) => boolean
  confirm: () => boolean
  reject: (reason?: string) => boolean
  pause: (reason?: string) => boolean
  resume: () => boolean
  complete: () => boolean
  finish: () => boolean
  fail: (reason: string) => boolean
  cancel: (reason?: string) => boolean
  markTimeout: () => boolean
  retry: () => boolean
  reset: () => boolean

  // Task management
  createTask: (
    name: string,
    description?: string,
    priority?: TaskRecord['priority']
  ) => TaskRecord | undefined
  startTask: (taskId: string) => boolean
  getTask: (taskId: string) => TaskRecord | undefined

  // Step management
  createStep: (
    taskId: string,
    name: string,
    type: StepRecord['type'],
    input?: Record<string, unknown>
  ) => StepRecord | undefined
  startStep: (stepId: string) => boolean
  completeStep: (stepId: string, output?: Record<string, unknown>) => boolean
  getStep: (stepId: string) => StepRecord | undefined

  // Listeners
  addStateListener: (listener: (event: RuntimeStateChangeEvent) => void) => () => void
  addStepListener: (listener: (step: StepRecord, previousStatus: StepStatus) => void) => () => void
  addTaskListener: (listener: (task: TaskRecord, previousStatus: TaskStatus) => void) => () => void
}

// ==================== Context ====================

const RuntimeStateContext = createContext<RuntimeStateContextValue | null>(null)

// ==================== Provider Props ====================

export interface RuntimeStateProviderProps {
  sessionId: string
  eventEmitter?: RuntimeEventEmitter
  children: ReactNode
  persistState?: boolean
  stateTimeout?: number
  onStateChange?: (event: RuntimeStateChangeEvent) => void
  onStepChange?: (step: StepRecord, previousStatus: StepStatus) => void
  onTaskChange?: (task: TaskRecord, previousStatus: TaskStatus) => void
}

// ==================== Provider Component ====================

/**
 * Runtime State Provider Component
 */
export function RuntimeStateProvider({
  sessionId,
  eventEmitter,
  children,
  persistState = true,
  stateTimeout,
  onStateChange,
  onStepChange,
  onTaskChange,
}: RuntimeStateProviderProps): ReactNode {
  // State
  const [state, setState] = useState<RuntimeState>('idle')
  const [context, setContext] = useState<ReturnType<RuntimeStateMachine['getContext']>>(() => ({
    state: 'idle',
    sessionId,
    tasks: [],
    lastStateChangeAt: Date.now(),
    stateChangeCount: 0,
  }))
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [currentTask, setCurrentTask] = useState<TaskRecord | undefined>()
  const [currentStep, setCurrentStep] = useState<StepRecord | undefined>()
  const [confirmation, setConfirmation] = useState<ReturnType<RuntimeStateMachine['getConfirmation']>>()
  const [error, setError] = useState<ReturnType<RuntimeStateMachine['getError']>>()

  // Machine ref
  const machineRef = useRef<RuntimeStateMachine | null>(null)

  // Initialize machine
  useEffect(() => {
    machineRef.current = createRuntimeStateMachine(sessionId, {
      eventEmitter,
      persistState,
      stateTimeout,
      onStateChange: (event) => {
        setState(event.newState)
        setContext(machineRef.current!.getContext())
        onStateChange?.(event)
      },
      onStepChange: (step, previousStatus) => {
        setCurrentStep(step.status === 'running' ? step : undefined)
        onStepChange?.(step, previousStatus)
      },
      onTaskChange: (task, previousStatus) => {
        setTasks(machineRef.current!.getTasks())
        setCurrentTask(machineRef.current!.getCurrentTask())
        onTaskChange?.(task, previousStatus)
      },
    })

    // Restore state if persisted
    if (persistState) {
      machineRef.current.restoreState()
      setContext(machineRef.current.getContext())
      setTasks(machineRef.current.getTasks())
      setCurrentTask(machineRef.current.getCurrentTask())
      setCurrentStep(machineRef.current.getCurrentStep() ?? undefined)
    }

    return () => {
      machineRef.current?.clearPersistedState()
    }
  }, [sessionId, eventEmitter, persistState, stateTimeout, onStateChange, onStepChange, onTaskChange])

  // Update confirmation and error from context
  useEffect(() => {
    setConfirmation(context.confirmation)
    setError(context.error)
  }, [context])

  // State transitions
  const start = useCallback((reason?: string) => {
    return machineRef.current?.start(reason) ?? false
  }, [])

  const beginExecution = useCallback(() => {
    return machineRef.current?.beginExecution() ?? false
  }, [])

  const requestConfirmation = useCallback(
    (
      type: 'user' | 'permission' | 'approval',
      message: string,
      options?: string[],
      timeout?: number
    ) => {
      return machineRef.current?.requestConfirmation(type, message, options, timeout) ?? false
    },
    []
  )

  const confirm = useCallback(() => {
    return machineRef.current?.confirm() ?? false
  }, [])

  const reject = useCallback((reason?: string) => {
    return machineRef.current?.reject(reason) ?? false
  }, [])

  const pause = useCallback((reason?: string) => {
    return machineRef.current?.pause(reason) ?? false
  }, [])

  const resume = useCallback(() => {
    return machineRef.current?.resume() ?? false
  }, [])

  const complete = useCallback(() => {
    return machineRef.current?.complete() ?? false
  }, [])

  const finish = useCallback(() => {
    return machineRef.current?.finish() ?? false
  }, [])

  const fail = useCallback((reason: string) => {
    return machineRef.current?.fail(reason) ?? false
  }, [])

  const cancel = useCallback((reason?: string) => {
    return machineRef.current?.cancel(reason) ?? false
  }, [])

  const markTimeout = useCallback(() => {
    return machineRef.current?.markTimeout() ?? false
  }, [])

  const retry = useCallback(() => {
    return machineRef.current?.retry() ?? false
  }, [])

  const reset = useCallback(() => {
    return machineRef.current?.reset() ?? false
  }, [])

  // Task management
  const createTask = useCallback(
    (
      name: string,
      description?: string,
      priority: TaskRecord['priority'] = 'normal'
    ): TaskRecord | undefined => {
      const task = machineRef.current?.createTask(name, description, priority)
      if (task) {
        setTasks(machineRef.current!.getTasks())
      }
      return task
    },
    []
  )

  const startTask = useCallback((taskId: string) => {
    const result = machineRef.current?.startTask(taskId) ?? false
    if (result) {
      setTasks(machineRef.current!.getTasks())
      setCurrentTask(machineRef.current!.getCurrentTask())
    }
    return result
  }, [])

  const getTask = useCallback((taskId: string) => {
    return machineRef.current?.getTask(taskId)
  }, [])

  // Step management
  const createStep = useCallback(
    (
      taskId: string,
      name: string,
      type: StepRecord['type'],
      input?: Record<string, unknown>
    ): StepRecord | undefined => {
      const step = machineRef.current?.createStep(taskId, name, type, input)
      if (step) {
        setTasks(machineRef.current!.getTasks())
      }
      return step ?? undefined
    },
    []
  )

  const startStep = useCallback((stepId: string) => {
    const result = machineRef.current?.startStep(stepId) ?? false
    if (result) {
      setTasks(machineRef.current!.getTasks())
      setCurrentStep(machineRef.current!.getCurrentStep() ?? undefined)
    }
    return result
  }, [])

  const completeStep = useCallback((stepId: string, output?: Record<string, unknown>) => {
    const result = machineRef.current?.completeStep(stepId, output) ?? false
    if (result) {
      setTasks(machineRef.current!.getTasks())
      setCurrentStep(machineRef.current!.getCurrentStep() ?? undefined)
    }
    return result
  }, [])

  const getStep = useCallback((stepId: string) => {
    return machineRef.current?.getStep(stepId)
  }, [])

  // Listeners
  const addStateListener = useCallback(
    (listener: (event: RuntimeStateChangeEvent) => void) => {
      return machineRef.current?.addStateListener(listener) ?? (() => {})
    },
    []
  )

  const addStepListener = useCallback(
    (listener: (step: StepRecord, previousStatus: StepStatus) => void) => {
      return machineRef.current?.addStepListener(listener) ?? (() => {})
    },
    []
  )

  const addTaskListener = useCallback(
    (listener: (task: TaskRecord, previousStatus: TaskStatus) => void) => {
      return machineRef.current?.addTaskListener(listener) ?? (() => {})
    },
    []
  )

  // Derived state
  const isActive = isRuntimeActive(state)
  const isTerminal = isRuntimeTerminal(state)
  const isWaitingForInput = isRuntimeWaitingForInput(state)
  const stateName = getRuntimeStateName(state)
  const overallProgress = calculateOverallProgress(tasks)

  // Context value
  const value: RuntimeStateContextValue = {
    state,
    isActive,
    isTerminal,
    isWaitingForInput,
    stateName,
    context,
    tasks,
    currentTask,
    overallProgress,
    currentStep,
    confirmation,
    error,
    start,
    beginExecution,
    requestConfirmation,
    confirm,
    reject,
    pause,
    resume,
    complete,
    finish,
    fail,
    cancel,
    markTimeout,
    retry,
    reset,
    createTask,
    startTask,
    getTask,
    createStep,
    startStep,
    completeStep,
    getStep,
    addStateListener,
    addStepListener,
    addTaskListener,
  }

  return (
    <RuntimeStateContext.Provider value={value}>
      {children}
    </RuntimeStateContext.Provider>
  )
}

// ==================== Hooks ====================

/**
 * Hook to access runtime state context
 */
export function useRuntimeStateContext(): RuntimeStateContextValue {
  const context = useContext(RuntimeStateContext)
  if (!context) {
    throw new Error('useRuntimeStateContext must be used within RuntimeStateProvider')
  }
  return context
}

/**
 * Hook to get runtime state
 */
export function useRuntimeState(): RuntimeState {
  const { state } = useRuntimeStateContext()
  return state
}

/**
 * Hook to check if runtime is active
 */
export function useRuntimeIsActive(): boolean {
  const { isActive } = useRuntimeStateContext()
  return isActive
}

/**
 * Hook to check if runtime is terminal
 */
export function useRuntimeIsTerminal(): boolean {
  const { isTerminal } = useRuntimeStateContext()
  return isTerminal
}

/**
 * Hook to check if waiting for input
 */
export function useRuntimeIsWaitingForInput(): boolean {
  const { isWaitingForInput } = useRuntimeStateContext()
  return isWaitingForInput
}

/**
 * Hook to get state transitions
 */
export function useRuntimeTransitions(): {
  start: (reason?: string) => boolean
  beginExecution: () => boolean
  requestConfirmation: (
    type: 'user' | 'permission' | 'approval',
    message: string,
    options?: string[],
    timeout?: number
  ) => boolean
  confirm: () => boolean
  reject: (reason?: string) => boolean
  pause: (reason?: string) => boolean
  resume: () => boolean
  complete: () => boolean
  finish: () => boolean
  fail: (reason: string) => boolean
  cancel: (reason?: string) => boolean
  markTimeout: () => boolean
  retry: () => boolean
  reset: () => boolean
} {
  const {
    start,
    beginExecution,
    requestConfirmation,
    confirm,
    reject,
    pause,
    resume,
    complete,
    finish,
    fail,
    cancel,
    markTimeout,
    retry,
    reset,
  } = useRuntimeStateContext()
  return {
    start,
    beginExecution,
    requestConfirmation,
    confirm,
    reject,
    pause,
    resume,
    complete,
    finish,
    fail,
    cancel,
    markTimeout,
    retry,
    reset,
  }
}

/**
 * Hook to access tasks
 */
export function useRuntimeTasks(): {
  tasks: TaskRecord[]
  currentTask: TaskRecord | undefined
  overallProgress: number
  createTask: (name: string, description?: string, priority?: TaskRecord['priority']) => TaskRecord | undefined
  startTask: (taskId: string) => boolean
  getTask: (taskId: string) => TaskRecord | undefined
} {
  const { tasks, currentTask, overallProgress, createTask, startTask, getTask } = useRuntimeStateContext()
  return { tasks, currentTask, overallProgress, createTask, startTask, getTask }
}

/**
 * Hook to access steps
 */
export function useRuntimeSteps(): {
  currentStep: StepRecord | undefined
  createStep: (
    taskId: string,
    name: string,
    type: StepRecord['type'],
    input?: Record<string, unknown>
  ) => StepRecord | undefined
  startStep: (stepId: string) => boolean
  completeStep: (stepId: string, output?: Record<string, unknown>) => boolean
  getStep: (stepId: string) => StepRecord | undefined
} {
  const { currentStep, createStep, startStep, completeStep, getStep } = useRuntimeStateContext()
  return { currentStep, createStep, startStep, completeStep, getStep }
}

/**
 * Hook to access confirmation
 */
export function useRuntimeConfirmation(): {
  confirmation: ReturnType<RuntimeStateMachine['getConfirmation']>
  requestConfirmation: (
    type: 'user' | 'permission' | 'approval',
    message: string,
    options?: string[],
    timeout?: number
  ) => boolean
  confirm: () => boolean
  reject: (reason?: string) => boolean
} {
  const { confirmation, requestConfirmation, confirm, reject } = useRuntimeStateContext()
  return { confirmation, requestConfirmation, confirm, reject }
}

/**
 * Hook to access error state
 */
export function useRuntimeError(): ReturnType<RuntimeStateMachine['getError']> {
  const { error } = useRuntimeStateContext()
  return error
}

/**
 * Hook to get state name
 */
export function useRuntimeStateName(): string {
  const { stateName } = useRuntimeStateContext()
  return stateName
}
