/**
 * Planner Context - React Integration for Structured Planner
 * Task 65: Story 44.2 - Structured Planner
 * 
 * This module provides React context and hooks for plan management.
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
  StructuredPlanner,
  createStructuredPlanner,
  type Plan,
  type PlanStep,
  type PlanStepStatus,
  type PlanStatus,
  type PlanGenerationRequest,
  type PlanGenerationResult,
  type PlanStorage,
  calculatePlanProgress,
  getPlanSummary,
  isPlanTerminal,
  getPendingSteps,
  getFailedSteps,
} from './structuredPlanner'

// ==================== Context Types ====================

/**
 * Planner context value
 */
export interface PlannerContextValue {
  // Plan state
  plan: Plan | null
  steps: PlanStep[]
  currentStep: PlanStep | null
  progress: number
  status: PlanStatus | null

  // Plan generation
  generatePlan: (request: PlanGenerationRequest) => PlanGenerationResult
  generatePlanFromGoal: (goal: string, context?: Record<string, unknown>) => PlanGenerationResult

  // Plan management
  loadPlan: (planId: string) => Promise<void>
  savePlan: () => Promise<void>
  deletePlan: () => Promise<void>
  listPlans: () => Promise<Plan[]>

  // Plan execution
  startPlan: () => boolean
  pausePlan: () => boolean
  resumePlan: () => boolean
  completePlan: () => boolean
  failPlan: (reason: string) => boolean
  cancelPlan: (reason?: string) => boolean

  // Step management
  updateStepStatus: (stepId: string, status: PlanStepStatus, error?: string) => boolean
  advanceToNextStep: () => PlanStep | null
  getStep: (stepId: string) => PlanStep | null
  areDependenciesSatisfied: (stepId: string) => boolean

  // Helpers
  getPlanSummary: () => string | null
  getPendingSteps: () => PlanStep[]
  getFailedSteps: () => PlanStep[]
  isTerminal: () => boolean

  // Listeners
  addPlanListener: (listener: (plan: Plan) => void) => () => void
  addStepListener: (listener: (step: PlanStep, previousStatus: PlanStepStatus) => void) => () => void
}

/**
 * Planner provider props
 */
export interface PlannerProviderProps {
  children: ReactNode
  storage?: PlanStorage
  autoPersist?: boolean
  onPlanChange?: (plan: Plan) => void
  onStepChange?: (step: PlanStep, previousStatus: PlanStepStatus) => void
}

// ==================== Context ====================

const PlannerContext = createContext<PlannerContextValue | null>(null)

/**
 * Planner Provider Component
 */
export function PlannerProvider({
  children,
  storage,
  autoPersist = true,
  onPlanChange,
  onStepChange,
}: PlannerProviderProps) {
  const plannerRef = useRef<StructuredPlanner | null>(null)

  // State
  const [plan, setPlan] = useState<Plan | null>(null)
  const [steps, setSteps] = useState<PlanStep[]>([])
  const [currentStep, setCurrentStep] = useState<PlanStep | null>(null)
  const [progress, setProgress] = useState(0)

  // Initialize planner
  useEffect(() => {
    plannerRef.current = createStructuredPlanner({
      storage,
      onPlanChange: (newPlan) => {
        setPlan(newPlan)
        setSteps(newPlan.steps)
        setCurrentStep(newPlan.steps[newPlan.currentStepIndex] ?? null)
        setProgress(calculatePlanProgress(newPlan))
        onPlanChange?.(newPlan)

        if (autoPersist) {
          plannerRef.current?.persistToStorage()
        }
      },
      onStepChange: (step, previousStatus) => {
        setSteps([...(plannerRef.current?.getCurrentPlan()?.steps ?? [])])
        setCurrentStep(plannerRef.current?.getCurrentStep() ?? null)
        setProgress(calculatePlanProgress(plannerRef.current?.getCurrentPlan() as Plan))
        onStepChange?.(step, previousStatus)
      },
    })

    return () => {
      plannerRef.current = null
    }
  }, [storage, autoPersist, onPlanChange, onStepChange])

  // Plan generation
  const generatePlan = useCallback((request: PlanGenerationRequest): PlanGenerationResult => {
    if (!plannerRef.current) {
      return {
        plan: null as unknown as Plan,
        success: false,
        error: 'Planner not initialized',
      }
    }

    const result = plannerRef.current.generatePlan(request)
    if (result.success) {
      plannerRef.current.setCurrentPlan(result.plan)
    }
    return result
  }, [])

  const generatePlanFromGoal = useCallback(
    (goal: string, context?: Record<string, unknown>): PlanGenerationResult => {
      return generatePlan({ goal, context })
    },
    [generatePlan]
  )

  // Plan management
  const loadPlan = useCallback(async (planId: string) => {
    if (!plannerRef.current) return
    const loadedPlan = await plannerRef.current.loadPlan(planId)
    if (loadedPlan) {
      setPlan(loadedPlan)
      setSteps(loadedPlan.steps)
      setCurrentStep(loadedPlan.steps[loadedPlan.currentStepIndex] ?? null)
      setProgress(calculatePlanProgress(loadedPlan))
    }
  }, [])

  const savePlan = useCallback(async () => {
    if (!plannerRef.current || !plan) return
    await plannerRef.current.savePlan(plan)
  }, [plan])

  const deletePlan = useCallback(async () => {
    if (!plannerRef.current || !plan) return
    await plannerRef.current.deletePlan(plan.id)
    setPlan(null)
    setSteps([])
    setCurrentStep(null)
    setProgress(0)
  }, [plan])

  const listPlans = useCallback(async () => {
    if (!plannerRef.current) return []
    return plannerRef.current.listPlans()
  }, [])

  // Plan execution
  const startPlan = useCallback(() => {
    return plannerRef.current?.startPlan() ?? false
  }, [])

  const pausePlan = useCallback(() => {
    return plannerRef.current?.pausePlan() ?? false
  }, [])

  const resumePlan = useCallback(() => {
    return plannerRef.current?.resumePlan() ?? false
  }, [])

  const completePlan = useCallback(() => {
    return plannerRef.current?.completePlan() ?? false
  }, [])

  const failPlan = useCallback((reason: string) => {
    return plannerRef.current?.failPlan(reason) ?? false
  }, [])

  const cancelPlan = useCallback((reason?: string) => {
    return plannerRef.current?.cancelPlan(reason) ?? false
  }, [])

  // Step management
  const updateStepStatus = useCallback((stepId: string, status: PlanStepStatus, error?: string) => {
    return plannerRef.current?.updateStepStatus(stepId, status, error) ?? false
  }, [])

  const advanceToNextStep = useCallback(() => {
    return plannerRef.current?.advanceToNextStep() ?? null
  }, [])

  const getStep = useCallback((stepId: string) => {
    return plannerRef.current?.getStep(stepId) ?? null
  }, [])

  const areDependenciesSatisfied = useCallback((stepId: string) => {
    return plannerRef.current?.areDependenciesSatisfied(stepId) ?? false
  }, [])

  // Helpers
  const getPlanSummaryCallback = useCallback(() => {
    return plan ? getPlanSummary(plan) : null
  }, [plan])

  const getPendingStepsCallback = useCallback(() => {
    return plan ? getPendingSteps(plan) : []
  }, [plan])

  const getFailedStepsCallback = useCallback(() => {
    return plan ? getFailedSteps(plan) : []
  }, [plan])

  const isTerminalCallback = useCallback(() => {
    return plan ? isPlanTerminal(plan) : false
  }, [plan])

  // Listeners
  const addPlanListener = useCallback((listener: (plan: Plan) => void) => {
    return plannerRef.current?.addPlanListener(listener) ?? (() => {})
  }, [])

  const addStepListener = useCallback(
    (listener: (step: PlanStep, previousStatus: PlanStepStatus) => void) => {
      return plannerRef.current?.addStepListener(listener) ?? (() => {})
    },
    []
  )

  const value: PlannerContextValue = {
    plan,
    steps,
    currentStep,
    progress,
    status: plan?.status ?? null,

    generatePlan,
    generatePlanFromGoal,

    loadPlan,
    savePlan,
    deletePlan,
    listPlans,

    startPlan,
    pausePlan,
    resumePlan,
    completePlan,
    failPlan,
    cancelPlan,

    updateStepStatus,
    advanceToNextStep,
    getStep,
    areDependenciesSatisfied,

    getPlanSummary: getPlanSummaryCallback,
    getPendingSteps: getPendingStepsCallback,
    getFailedSteps: getFailedStepsCallback,
    isTerminal: isTerminalCallback,

    addPlanListener,
    addStepListener,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

// ==================== Hooks ====================

/**
 * Get planner context
 */
export function usePlannerContext(): PlannerContextValue {
  const context = useContext(PlannerContext)
  if (!context) {
    throw new Error('usePlannerContext must be used within a PlannerProvider')
  }
  return context
}

/**
 * Get current plan state
 */
export function usePlan(): {
  plan: Plan | null
  steps: PlanStep[]
  currentStep: PlanStep | null
  progress: number
  status: PlanStatus | null
} {
  const { plan, steps, currentStep, progress, status } = usePlannerContext()
  return { plan, steps, currentStep, progress, status }
}

/**
 * Get plan generation functions
 */
export function usePlanGeneration(): {
  generatePlan: (request: PlanGenerationRequest) => PlanGenerationResult
  generatePlanFromGoal: (goal: string, context?: Record<string, unknown>) => PlanGenerationResult
} {
  const { generatePlan, generatePlanFromGoal } = usePlannerContext()
  return { generatePlan, generatePlanFromGoal }
}

/**
 * Get plan execution functions
 */
export function usePlanExecution(): {
  startPlan: () => boolean
  pausePlan: () => boolean
  resumePlan: () => boolean
  completePlan: () => boolean
  failPlan: (reason: string) => boolean
  cancelPlan: (reason?: string) => boolean
} {
  const { startPlan, pausePlan, resumePlan, completePlan, failPlan, cancelPlan } =
    usePlannerContext()
  return { startPlan, pausePlan, resumePlan, completePlan, failPlan, cancelPlan }
}

/**
 * Get step management functions
 */
export function useStepManagement(): {
  updateStepStatus: (stepId: string, status: PlanStepStatus, error?: string) => boolean
  advanceToNextStep: () => PlanStep | null
  getStep: (stepId: string) => PlanStep | null
  areDependenciesSatisfied: (stepId: string) => boolean
} {
  const { updateStepStatus, advanceToNextStep, getStep, areDependenciesSatisfied } =
    usePlannerContext()
  return { updateStepStatus, advanceToNextStep, getStep, areDependenciesSatisfied }
}

/**
 * Get plan helpers
 */
export function usePlanHelpers(): {
  getPlanSummary: () => string | null
  getPendingSteps: () => PlanStep[]
  getFailedSteps: () => PlanStep[]
  isTerminal: () => boolean
} {
  const { getPlanSummary, getPendingSteps, getFailedSteps, isTerminal } = usePlannerContext()
  return { getPlanSummary, getPendingSteps, getFailedSteps, isTerminal }
}

// ==================== Factory Functions ====================

/**
 * Create planner context value for workbench
 */
export function createWorkbenchPlannerContext(
  storage?: PlanStorage
): Omit<PlannerProviderProps, 'children'> {
  return {
    storage,
    autoPersist: true,
  }
}

/**
 * Create planner context value for dashboard
 */
export function createDashboardPlannerContext(
  storage?: PlanStorage
): Omit<PlannerProviderProps, 'children'> {
  return {
    storage,
    autoPersist: true,
  }
}
