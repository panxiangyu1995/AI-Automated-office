/**
 * Replan Strategy - Bounded Replanning and Failure Handling
 * Task 67: Story 44.4 - Replan and Failure Strategy
 * 
 * This module provides bounded replanning and standardized failure handling
 * for the Agent runtime.
 */

import type { Plan, PlanStep } from '../planner/structuredPlanner'
import type { StepExecutionResult } from '../executor/stepExecutor'

// ==================== Replan Types ====================

/**
 * Replan trigger reason
 */
export type ReplanTrigger =
  | 'tool_failure'      // Tool execution failed
  | 'permission_denied' // Permission request denied
  | 'step_timeout'      // Step execution timeout
  | 'user_cancelled'    // User cancelled operation
  | 'resource_error'    // Resource not available
  | 'unexpected_state'  // Unexpected runtime state
  | 'constraint_violation' // Plan constraint violated
  | 'dependency_failed' // Dependency step failed

/**
 * Replan action type
 */
export type ReplanAction =
  | 'retry_step'        // Retry current step
  | 'skip_step'         // Skip and continue
  | 'restart_plan'      // Restart entire plan
  | 'partial_replan'    // Replan from current step
  | 'abort'             // Abort execution
  | 'escalate'          // Escalate to user/human
  | 'fallback'          // Use fallback strategy

/**
 * Replan decision
 */
export interface ReplanDecision {
  action: ReplanAction
  reason: ReplanTrigger
  maxAttempts: number
  currentAttempt: number
  delay?: number
  modifiedPlan?: Plan
  skipToStepId?: string
  fallbackStrategy?: string
  message: string
}

/**
 * Replan strategy configuration
 */
export interface ReplanStrategyConfig {
  maxReplanAttempts: number
  maxRetryAttempts: number
  retryDelay: number
  backoffMultiplier: number
  maxDelay: number
  allowedActions: ReplanAction[]
  onReplanDecision?: (decision: ReplanDecision) => void
  onFailure?: (trigger: ReplanTrigger, context: ReplanContext) => void
}

/**
 * Replan context
 */
export interface ReplanContext {
  plan: Plan
  currentStepId: string | null
  failedSteps: string[]
  successfulSteps: string[]
  executionHistory: StepExecutionResult[]
  totalAttempts: number
  lastTrigger: ReplanTrigger | null
}

/**
 * Replan history entry
 */
export interface ReplanHistoryEntry {
  timestamp: number
  trigger: ReplanTrigger
  decision: ReplanDecision
  outcome: 'success' | 'failed' | 'pending'
  stepId: string
  attempt: number
}

/**
 * Failure severity
 */
export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Failure record
 */
export interface FailureRecord {
  id: string
  timestamp: number
  trigger: ReplanTrigger
  severity: FailureSeverity
  stepId: string
  message: string
  details?: Record<string, unknown>
  recoverable: boolean
  recoveryAction?: ReplanAction
}

// ==================== Replan Strategy ====================

/**
 * Replan Strategy
 * 
 * Handles bounded replanning decisions and failure recovery.
 */
export class ReplanStrategy {
  private config: ReplanStrategyConfig
  private replanAttempts: Map<string, number> = new Map()
  private retryAttempts: Map<string, number> = new Map()
  private history: ReplanHistoryEntry[] = []
  private failures: FailureRecord[] = []

  constructor(config: Partial<ReplanStrategyConfig> = {}) {
    this.config = {
      maxReplanAttempts: config.maxReplanAttempts ?? 3,
      maxRetryAttempts: config.maxRetryAttempts ?? 2,
      retryDelay: config.retryDelay ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxDelay: config.maxDelay ?? 30000,
      allowedActions: config.allowedActions ?? [
        'retry_step',
        'skip_step',
        'partial_replan',
        'abort',
        'escalate',
        'fallback',
      ],
      onReplanDecision: config.onReplanDecision,
      onFailure: config.onFailure,
    }
  }

  // ==================== Decision Making ====================

  /**
   * Analyze failure and decide on replan action
   */
  analyzeFailure(
    trigger: ReplanTrigger,
    context: ReplanContext,
    error?: Error
  ): ReplanDecision {
    const stepId = context.currentStepId
    const attempt = this.getAttemptCount(stepId)

    // Determine severity and recoverability
    const severity = this.assessSeverity(trigger, error)
    const recoverable = this.isRecoverable(trigger, severity)

    // Record failure
    this.recordFailure({
      id: this.generateFailureId(),
      timestamp: Date.now(),
      trigger,
      severity,
      stepId: stepId ?? 'unknown',
      message: error?.message ?? `Failure: ${trigger}`,
      recoverable,
    })

    // Make decision based on trigger and context
    const decision = this.makeDecision(trigger, context, attempt, severity)

    // Notify callback
    this.config.onReplanDecision?.(decision)

    // Record in history
    this.recordHistory(trigger, decision, stepId ?? 'unknown')

    return decision
  }

  /**
   * Make replan decision based on trigger and context
   */
  private makeDecision(
    trigger: ReplanTrigger,
    context: ReplanContext,
    attempt: number,
    severity: FailureSeverity
  ): ReplanDecision {
    // Check if we've exceeded max attempts
    if (attempt >= this.config.maxReplanAttempts) {
      return {
        action: 'abort',
        reason: trigger,
        maxAttempts: this.config.maxReplanAttempts,
        currentAttempt: attempt,
        message: `Exceeded maximum replan attempts (${this.config.maxReplanAttempts})`,
      }
    }

    // Decision based on trigger type
    switch (trigger) {
      case 'tool_failure':
        return this.decideToolFailure(trigger, context, attempt, severity)

      case 'permission_denied':
        return this.decidePermissionDenied(trigger, context, attempt)

      case 'step_timeout':
        return this.decideTimeout(trigger, context, attempt)

      case 'user_cancelled':
        return {
          action: 'abort',
          reason: trigger,
          maxAttempts: this.config.maxReplanAttempts,
          currentAttempt: attempt,
          message: 'User cancelled the operation',
        }

      case 'resource_error':
        return this.decideResourceError(trigger, context, attempt)

      case 'dependency_failed':
        return {
          action: 'partial_replan',
          reason: trigger,
          maxAttempts: this.config.maxReplanAttempts,
          currentAttempt: attempt,
          message: 'Dependency step failed, need to replan',
        }

      case 'constraint_violation':
        return {
          action: 'partial_replan',
          reason: trigger,
          maxAttempts: this.config.maxReplanAttempts,
          currentAttempt: attempt,
          message: 'Plan constraint violated, replanning needed',
        }

      case 'unexpected_state':
      default:
        return {
          action: 'escalate',
          reason: trigger,
          maxAttempts: this.config.maxReplanAttempts,
          currentAttempt: attempt,
          message: 'Unexpected state encountered, escalation required',
        }
    }
  }

  /**
   * Decide action for tool failure
   */
  private decideToolFailure(
    trigger: ReplanTrigger,
    context: ReplanContext,
    attempt: number,
    severity: FailureSeverity
  ): ReplanDecision {
    const retryCount = this.getRetryCount(context.currentStepId)

    // Try retry if within limits
    if (retryCount < this.config.maxRetryAttempts && severity !== 'critical') {
      const delay = this.calculateDelay(retryCount)
      return {
        action: 'retry_step',
        reason: trigger,
        maxAttempts: this.config.maxRetryAttempts,
        currentAttempt: retryCount + 1,
        delay,
        message: `Retrying tool execution (attempt ${retryCount + 1}/${this.config.maxRetryAttempts})`,
      }
    }

    // Try fallback if available
    if (severity === 'medium') {
      return {
        action: 'fallback',
        reason: trigger,
        maxAttempts: this.config.maxReplanAttempts,
        currentAttempt: attempt,
        fallbackStrategy: 'alternative_tool',
        message: 'Using fallback strategy for tool execution',
      }
    }

    // Skip if non-critical step
    if (severity === 'low') {
      return {
        action: 'skip_step',
        reason: trigger,
        maxAttempts: this.config.maxReplanAttempts,
        currentAttempt: attempt,
        message: 'Skipping non-critical failed step',
      }
    }

    // Otherwise escalate
    return {
      action: 'escalate',
      reason: trigger,
      maxAttempts: this.config.maxReplanAttempts,
      currentAttempt: attempt,
      message: 'Tool failure requires escalation',
    }
  }

  /**
   * Decide action for permission denied
   */
  private decidePermissionDenied(
    trigger: ReplanTrigger,
    _context: ReplanContext,
    attempt: number
  ): ReplanDecision {
    // Permission denied is usually non-recoverable without user intervention
    if (attempt < 1) {
      return {
        action: 'escalate',
        reason: trigger,
        maxAttempts: this.config.maxReplanAttempts,
        currentAttempt: attempt,
        message: 'Permission denied, requesting user intervention',
      }
    }

    // Skip step if possible
    return {
      action: 'skip_step',
      reason: trigger,
      maxAttempts: this.config.maxReplanAttempts,
      currentAttempt: attempt,
      message: 'Skipping step due to permission denial',
    }
  }

  /**
   * Decide action for timeout
   */
  private decideTimeout(
    trigger: ReplanTrigger,
    context: ReplanContext,
    attempt: number
  ): ReplanDecision {
    const retryCount = this.getRetryCount(context.currentStepId)

    if (retryCount < this.config.maxRetryAttempts) {
      return {
        action: 'retry_step',
        reason: trigger,
        maxAttempts: this.config.maxRetryAttempts,
        currentAttempt: retryCount + 1,
        delay: this.config.retryDelay,
        message: `Retrying timed out step (attempt ${retryCount + 1})`,
      }
    }

    return {
      action: 'skip_step',
      reason: trigger,
      maxAttempts: this.config.maxReplanAttempts,
      currentAttempt: attempt,
      message: 'Skipping step after timeout retries exhausted',
    }
  }

  /**
   * Decide action for resource error
   */
  private decideResourceError(
    trigger: ReplanTrigger,
    _context: ReplanContext,
    attempt: number
  ): ReplanDecision {
    // Resource errors might be transient
    if (attempt < 2) {
      const delay = this.calculateDelay(attempt)
      return {
        action: 'retry_step',
        reason: trigger,
        maxAttempts: this.config.maxReplanAttempts,
        currentAttempt: attempt + 1,
        delay,
        message: 'Retrying due to resource error',
      }
    }

    return {
      action: 'partial_replan',
      reason: trigger,
      maxAttempts: this.config.maxReplanAttempts,
      currentAttempt: attempt,
      message: 'Resource unavailable, replanning required',
    }
  }

  // ==================== Severity Assessment ====================

  /**
   * Assess failure severity
   */
  private assessSeverity(trigger: ReplanTrigger, error?: Error): FailureSeverity {
    // Critical triggers
    if (trigger === 'user_cancelled' || trigger === 'permission_denied') {
      return 'critical'
    }

    // Check error message for severity indicators
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('critical') || msg.includes('fatal')) {
        return 'critical'
      }
      if (msg.includes('warning') || msg.includes('minor')) {
        return 'low'
      }
    }

    // Default severity by trigger type
    switch (trigger) {
      case 'unexpected_state':
        return 'high'
      case 'dependency_failed':
      case 'constraint_violation':
        return 'medium'
      case 'step_timeout':
      case 'resource_error':
        return 'medium'
      case 'tool_failure':
        return 'medium'
      default:
        return 'medium'
    }
  }

  /**
   * Check if failure is recoverable
   */
  private isRecoverable(trigger: ReplanTrigger, severity: FailureSeverity): boolean {
    if (severity === 'critical') {
      return false
    }

    const recoverableTriggers: ReplanTrigger[] = [
      'tool_failure',
      'step_timeout',
      'resource_error',
    ]

    return recoverableTriggers.includes(trigger)
  }

  // ================= Attempt Tracking ====================

  /**
   * Get attempt count for a step
   */
  private getAttemptCount(stepId: string | null): number {
    if (!stepId) return 0
    return this.replanAttempts.get(stepId) ?? 0
  }

  /**
   * Get retry count for a step
   */
  private getRetryCount(stepId: string | null): number {
    if (!stepId) return 0
    return this.retryAttempts.get(stepId) ?? 0
  }

  /**
   * Increment attempt count
   */
  incrementAttempt(stepId: string): void {
    const current = this.replanAttempts.get(stepId) ?? 0
    this.replanAttempts.set(stepId, current + 1)
  }

  /**
   * Increment retry count
   */
  incrementRetry(stepId: string): void {
    const current = this.retryAttempts.get(stepId) ?? 0
    this.retryAttempts.set(stepId, current + 1)
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempt)
    return Math.min(delay, this.config.maxDelay)
  }

  // ==================== Recording ====================

  /**
   * Record failure
   */
  private recordFailure(failure: FailureRecord): void {
    this.failures.push(failure)
    this.config.onFailure?.(failure.trigger, {
      plan: {} as Plan,
      currentStepId: failure.stepId,
      failedSteps: [failure.stepId],
      successfulSteps: [],
      executionHistory: [],
      totalAttempts: this.failures.length,
      lastTrigger: failure.trigger,
    })
  }

  /**
   * Record history entry
   */
  private recordHistory(
    trigger: ReplanTrigger,
    decision: ReplanDecision,
    stepId: string
  ): void {
    this.history.push({
      timestamp: Date.now(),
      trigger,
      decision,
      outcome: 'pending',
      stepId,
      attempt: decision.currentAttempt,
    })
  }

  /**
   * Update history entry outcome
   */
  updateHistoryOutcome(timestamp: number, outcome: 'success' | 'failed'): void {
    const entry = this.history.find(h => h.timestamp === timestamp)
    if (entry) {
      entry.outcome = outcome
    }
  }

  /**
   * Generate failure ID
   */
  private generateFailureId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return `failure_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
  }

  // ==================== Getters ====================

  /**
   * Get replan history
   */
  getHistory(): ReplanHistoryEntry[] {
    return [...this.history]
  }

  /**
   * Get failure records
   */
  getFailures(): FailureRecord[] {
    return [...this.failures]
  }

  /**
   * Get total attempt count
   */
  getTotalAttempts(): number {
    return this.failures.length
  }

  /**
   * Check if action is allowed
   */
  isActionAllowed(action: ReplanAction): boolean {
    return this.config.allowedActions.includes(action)
  }

  /**
   * Reset attempt counters
   */
  reset(): void {
    this.replanAttempts.clear()
    this.retryAttempts.clear()
    this.history = []
    this.failures = []
  }
}

// ==================== Factory Function ====================

/**
 * Create a replan strategy
 */
export function createReplanStrategy(
  config?: Partial<ReplanStrategyConfig>
): ReplanStrategy {
  return new ReplanStrategy(config)
}

// ==================== Helper Functions ====================

/**
 * Check if step can be skipped
 */
export function canSkipStep(step: PlanStep, plan: Plan): boolean {
  // Check if step has dependents that require it
  const dependents = plan.steps.filter(s =>
    s.dependencies?.some(d => d.stepId === step.id && d.condition === 'success')
  )

  return dependents.length === 0
}

/**
 * Get steps to replan after failure
 */
export function getStepsToReplan(
  failedStepId: string,
  plan: Plan
): PlanStep[] {
  const failedIndex = plan.steps.findIndex(s => s.id === failedStepId)
  if (failedIndex < 0) return []

  // Return all steps from failed step onwards
  return plan.steps.slice(failedIndex)
}

/**
 * Calculate failure impact scope
 */
export function calculateFailureImpact(
  failedStepId: string,
  plan: Plan
): {
  directDependencies: string[]
  transitiveDependencies: string[]
  affectedSteps: string[]
} {
  const directDependencies: string[] = []
  const transitiveDependencies: string[] = []
  const affectedSteps: string[] = [failedStepId]

  // Find all steps that depend on the failed step
  for (const step of plan.steps) {
    if (step.dependencies?.some(d => d.stepId === failedStepId)) {
      directDependencies.push(step.id)
      affectedSteps.push(step.id)

      // Find transitive dependencies
      const transitive = findTransitiveDependencies(step.id, plan)
      transitiveDependencies.push(...transitive)
      affectedSteps.push(...transitive)
    }
  }

  return {
    directDependencies,
    transitiveDependencies: [...new Set(transitiveDependencies)],
    affectedSteps: [...new Set(affectedSteps)],
  }
}

/**
 * Find transitive dependencies
 */
function findTransitiveDependencies(stepId: string, plan: Plan): string[] {
  const result: string[] = []

  for (const step of plan.steps) {
    if (step.dependencies?.some(d => d.stepId === stepId)) {
      result.push(step.id)
      result.push(...findTransitiveDependencies(step.id, plan))
    }
  }

  return result
}
