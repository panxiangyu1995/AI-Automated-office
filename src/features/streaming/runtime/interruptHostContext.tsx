/**
 * Interrupt Host Context - React Integration for Interrupt/Checkpoint/Recovery
 * Task 63: Story 43.4 - Interrupt Retry and Checkpoint Recovery
 * 
 * This module provides React context and hooks for interrupt handling.
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
  InterruptHandler,
  type InterruptRequest,
  type InterruptType,
  type InterruptStatus,
  type Checkpoint,
  type StepState,
  type RecoveryStrategy,
  type RecoveryDecision,
  type RecoveryResult,
  type RecoveryHistoryEntry,
  type InterruptListener,
  type CheckpointListener,
  type RecoveryListener,
  createInterruptHandler,
} from './interruptHandler'
import { RuntimeEventEmitter } from './runtimeEvents'

// ==================== Context Types ====================

/**
 * Interrupt context value
 */
export interface InterruptContextValue {
  // State
  sessionId: string
  interruptStatus: InterruptStatus
  currentInterrupt: InterruptRequest | null
  currentStep: StepState | null
  checkpoints: Checkpoint[]
  recoveryHistory: RecoveryHistoryEntry[]
  isLoading: boolean
  error: string | null

  // Interrupt actions
  requestInterrupt: (type: InterruptType, reason?: string) => Promise<void>
  cancelInterrupt: () => boolean

  // Checkpoint actions
  createCheckpoint: () => Promise<Checkpoint | null>
  getLatestCheckpoint: () => Promise<Checkpoint | null>

  // Step management
  setCurrentStep: (step: StepState) => void

  // Recovery actions
  recover: (
    strategy: RecoveryStrategy,
    checkpointId?: string,
    reason?: string
  ) => Promise<RecoveryResult>
  getRecommendedStrategy: () => Promise<RecoveryStrategy>

  // Listeners
  addInterruptListener: (listener: InterruptListener) => () => void
  addCheckpointListener: (listener: CheckpointListener) => () => void
  addRecoveryListener: (listener: RecoveryListener) => () => void
}

// ==================== Context ====================

const InterruptContext = createContext<InterruptContextValue | null>(null)

// ==================== Provider Props ====================

export interface InterruptProviderProps {
  sessionId: string
  eventEmitter: RuntimeEventEmitter
  children: ReactNode
  autoCheckpoint?: boolean
  checkpointInterval?: number
  maxCheckpoints?: number
  onInterrupt?: (request: InterruptRequest) => void
  onCheckpoint?: (checkpoint: Checkpoint) => void
  onRecovery?: (decision: RecoveryDecision, result: RecoveryHistoryEntry['result']) => void
}

// ==================== Provider Component ====================

/**
 * Interrupt Provider Component
 */
export function InterruptProvider({
  sessionId,
  eventEmitter,
  children,
  autoCheckpoint = true,
  checkpointInterval = 30000,
  maxCheckpoints = 10,
  onInterrupt,
  onCheckpoint,
  onRecovery,
}: InterruptProviderProps): ReactNode {
  // State
  const [interruptStatus, setInterruptStatus] = useState<InterruptStatus>('none')
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptRequest | null>(null)
  const [currentStep, setCurrentStep] = useState<StepState | null>(null)
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handler ref
  const handlerRef = useRef<InterruptHandler | null>(null)

  // Initialize handler
  useEffect(() => {
    handlerRef.current = createInterruptHandler(sessionId, eventEmitter, {
      autoCheckpoint,
      checkpointInterval,
      maxCheckpointsPerSession: maxCheckpoints,
    })
    handlerRef.current.initialize()

    return () => {
      handlerRef.current?.cleanup()
    }
  }, [sessionId, eventEmitter, autoCheckpoint, checkpointInterval, maxCheckpoints])

  // Set up listeners
  useEffect(() => {
    const handler = handlerRef.current
    if (!handler) return

    const unsubInterrupt = handler.addInterruptListener((request) => {
      setCurrentInterrupt(request)
      setInterruptStatus(request.status)
      onInterrupt?.(request)
    })

    const unsubCheckpoint = handler.addCheckpointListener((checkpoint) => {
      setCheckpoints(prev => [...prev, checkpoint])
      onCheckpoint?.(checkpoint)
    })

    const unsubRecovery = handler.addRecoveryListener((decision, result) => {
      // Refresh recovery history
      handler.getRecoveryHistory().then(history => {
        setRecoveryHistory(history)
      })
      onRecovery?.(decision, result)
    })

    return () => {
      unsubInterrupt()
      unsubCheckpoint()
      unsubRecovery()
    }
  }, [onInterrupt, onCheckpoint, onRecovery])

  // Load initial data
  useEffect(() => {
    const handler = handlerRef.current
    if (!handler) return

    const loadData = async () => {
      try {
        const [checkpointsData, historyData] = await Promise.all([
          handler.getSessionCheckpoints(),
          handler.getRecoveryHistory(),
        ])
        setCheckpoints(checkpointsData)
        setRecoveryHistory(historyData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    }

    loadData()
  }, [])

  // Interrupt actions
  const requestInterrupt = useCallback(async (type: InterruptType, reason?: string) => {
    const handler = handlerRef.current
    if (!handler) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await handler.requestInterrupt(type, reason)
      if (!result.success) {
        setError(result.error ?? 'Interrupt failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cancelInterrupt = useCallback((): boolean => {
    const handler = handlerRef.current
    if (!handler) return false

    const cancelled = handler.cancelInterrupt()
    if (cancelled) {
      setCurrentInterrupt(null)
      setInterruptStatus('none')
    }
    return cancelled
  }, [])

  // Checkpoint actions
  const createCheckpoint = useCallback(async (): Promise<Checkpoint | null> => {
    const handler = handlerRef.current
    if (!handler) return null

    setIsLoading(true)
    setError(null)

    try {
      const checkpoint = await handler.createCheckpoint()
      return checkpoint
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkpoint')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getLatestCheckpoint = useCallback(async (): Promise<Checkpoint | null> => {
    const handler = handlerRef.current
    if (!handler) return null

    return handler.getLatestCheckpoint()
  }, [])

  // Step management
  const setCurrentStepWrapper = useCallback((step: StepState) => {
    const handler = handlerRef.current
    if (!handler) return

    handler.setCurrentStep(step)
    setCurrentStep(step)
  }, [])

  // Recovery actions
  const recover = useCallback(
    async (
      strategy: RecoveryStrategy,
      checkpointId?: string,
      reason?: string
    ): Promise<RecoveryResult> => {
      const handler = handlerRef.current
      if (!handler) {
        return {
          success: false,
          decision: {
            id: '',
            sessionId,
            strategy,
            reason: reason ?? '',
            decidedAt: Date.now(),
            decidedBy: 'user',
          },
          eventsReplayed: 0,
          error: 'Handler not initialized',
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await handler.recover(strategy, checkpointId, 'user', reason)
        
        if (result.success) {
          // Refresh state
          setCurrentInterrupt(null)
          setInterruptStatus('none')
        } else {
          setError(result.error ?? 'Recovery failed')
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        return {
          success: false,
          decision: {
            id: '',
            sessionId,
            strategy,
            reason: reason ?? '',
            decidedAt: Date.now(),
            decidedBy: 'user',
          },
          eventsReplayed: 0,
          error: errorMessage,
        }
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId]
  )

  const getRecommendedStrategy = useCallback(async (): Promise<RecoveryStrategy> => {
    const handler = handlerRef.current
    if (!handler) return 'restart'

    return handler.getRecommendedStrategy()
  }, [])

  // Listener registration
  const addInterruptListenerWrapper = useCallback((listener: InterruptListener): (() => void) => {
    const handler = handlerRef.current
    if (!handler) return () => {}
    return handler.addInterruptListener(listener)
  }, [])

  const addCheckpointListenerWrapper = useCallback((listener: CheckpointListener): (() => void) => {
    const handler = handlerRef.current
    if (!handler) return () => {}
    return handler.addCheckpointListener(listener)
  }, [])

  const addRecoveryListenerWrapper = useCallback((listener: RecoveryListener): (() => void) => {
    const handler = handlerRef.current
    if (!handler) return () => {}
    return handler.addRecoveryListener(listener)
  }, [])

  // Context value
  const value: InterruptContextValue = {
    sessionId,
    interruptStatus,
    currentInterrupt,
    currentStep,
    checkpoints,
    recoveryHistory,
    isLoading,
    error,
    requestInterrupt,
    cancelInterrupt,
    createCheckpoint,
    getLatestCheckpoint,
    setCurrentStep: setCurrentStepWrapper,
    recover,
    getRecommendedStrategy,
    addInterruptListener: addInterruptListenerWrapper,
    addCheckpointListener: addCheckpointListenerWrapper,
    addRecoveryListener: addRecoveryListenerWrapper,
  }

  return (
    <InterruptContext.Provider value={value}>
      {children}
    </InterruptContext.Provider>
  )
}

// ==================== Hooks ====================

/**
 * Hook to access interrupt context
 */
export function useInterruptContext(): InterruptContextValue {
  const context = useContext(InterruptContext)
  if (!context) {
    throw new Error('useInterruptContext must be used within InterruptProvider')
  }
  return context
}

/**
 * Hook to get interrupt status
 */
export function useInterruptStatus(): InterruptStatus {
  const { interruptStatus } = useInterruptContext()
  return interruptStatus
}

/**
 * Hook to get current interrupt
 */
export function useCurrentInterrupt(): InterruptRequest | null {
  const { currentInterrupt } = useInterruptContext()
  return currentInterrupt
}

/**
 * Hook to request and cancel interrupts
 */
export function useInterruptControl(): {
  requestInterrupt: (type: InterruptType, reason?: string) => Promise<void>
  cancelInterrupt: () => boolean
} {
  const { requestInterrupt, cancelInterrupt } = useInterruptContext()
  return { requestInterrupt, cancelInterrupt }
}

/**
 * Hook to access checkpoints
 */
export function useCheckpoints(): {
  checkpoints: Checkpoint[]
  createCheckpoint: () => Promise<Checkpoint | null>
  getLatestCheckpoint: () => Promise<Checkpoint | null>
} {
  const { checkpoints, createCheckpoint, getLatestCheckpoint } = useInterruptContext()
  return { checkpoints, createCheckpoint, getLatestCheckpoint }
}

/**
 * Hook to access recovery functionality
 */
export function useRecovery(): {
  recover: (
    strategy: RecoveryStrategy,
    checkpointId?: string,
    reason?: string
  ) => Promise<RecoveryResult>
  getRecommendedStrategy: () => Promise<RecoveryStrategy>
  recoveryHistory: RecoveryHistoryEntry[]
} {
  const { recover, getRecommendedStrategy, recoveryHistory } = useInterruptContext()
  return { recover, getRecommendedStrategy, recoveryHistory }
}

/**
 * Hook to manage current step
 */
export function useStepManagement(): {
  currentStep: StepState | null
  setCurrentStep: (step: StepState) => void
} {
  const { currentStep, setCurrentStep } = useInterruptContext()
  return { currentStep, setCurrentStep }
}

/**
 * Hook to check if currently interrupted
 */
export function useIsInterrupted(): boolean {
  const { interruptStatus, currentInterrupt } = useInterruptContext()
  return interruptStatus !== 'none' && currentInterrupt !== null
}

/**
 * Hook to get loading and error states
 */
export function useInterruptState(): {
  isLoading: boolean
  error: string | null
} {
  const { isLoading, error } = useInterruptContext()
  return { isLoading, error }
}

// ==================== Factory Functions ====================

/**
 * Create interrupt context for workbench
 */
export function createWorkbenchInterruptContext(
  sessionId: string,
  eventEmitter: RuntimeEventEmitter
): Omit<InterruptProviderProps, 'children'> {
  return {
    sessionId,
    eventEmitter,
    autoCheckpoint: true,
    checkpointInterval: 30000, // 30 seconds
    maxCheckpoints: 10,
  }
}

/**
 * Create interrupt context for dashboard
 */
export function createDashboardInterruptContext(
  sessionId: string,
  eventEmitter: RuntimeEventEmitter
): Omit<InterruptProviderProps, 'children'> {
  return {
    sessionId,
    eventEmitter,
    autoCheckpoint: true,
    checkpointInterval: 60000, // 1 minute
    maxCheckpoints: 5,
  }
}
