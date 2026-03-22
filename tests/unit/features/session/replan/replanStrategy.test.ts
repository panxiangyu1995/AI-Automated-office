/**
 * Replan Strategy Tests
 * Task 67: Story 44.4 - Replan and Failure Strategy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ReplanStrategy,
  createReplanStrategy,
  canSkipStep,
  getStepsToReplan,
  calculateFailureImpact,
  type ReplanContext,
  type Plan,
  type PlanStep,
} from '../../../../../src/features/session/replan'

// ==================== Test Fixtures ====================

function createTestPlan(): Plan {
  return {
    id: 'test-plan',
    name: 'Test Plan',
    description: 'Test plan for replan strategy',
    status: 'running',
    priority: 'normal',
    steps: [
      createTestStep('step-1', 0),
      createTestStep('step-2', 1, [{ stepId: 'step-1', condition: 'success' }]),
      createTestStep('step-3', 2, [{ stepId: 'step-2', condition: 'success' }]),
    ],
    currentStepIndex: 0,
    goal: 'Test goal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'user',
    version: 1,
  }
}

function createTestStep(
  id: string,
  order: number,
  dependencies?: PlanStep['dependencies']
): PlanStep {
  return {
    id,
    name: `Step ${id}`,
    type: 'action',
    status: 'pending',
    order,
    dependencies,
  }
}

function createTestContext(overrides: Partial<ReplanContext> = {}): ReplanContext {
  return {
    plan: createTestPlan(),
    currentStepId: 'step-1',
    failedSteps: [],
    successfulSteps: [],
    executionHistory: [],
    totalAttempts: 0,
    lastTrigger: null,
    ...overrides,
  }
}

// ==================== ReplanStrategy Tests ====================

describe('ReplanStrategy', () => {
  let strategy: ReplanStrategy

  beforeEach(() => {
    strategy = createReplanStrategy({
      maxReplanAttempts: 3,
      maxRetryAttempts: 2,
      retryDelay: 100,
    })
  })

  describe('analyzeFailure', () => {
    it('should analyze tool failure and return retry decision', () => {
      const context = createTestContext()
      const decision = strategy.analyzeFailure('tool_failure', context)

      expect(decision.action).toBe('retry_step')
      expect(decision.reason).toBe('tool_failure')
      expect(decision.currentAttempt).toBe(1)
    })

    it('should analyze permission denied and return escalate decision', () => {
      const context = createTestContext()
      const decision = strategy.analyzeFailure('permission_denied', context)

      expect(decision.action).toBe('escalate')
      expect(decision.reason).toBe('permission_denied')
    })

    it('should analyze user cancelled and return abort decision', () => {
      const context = createTestContext()
      const decision = strategy.analyzeFailure('user_cancelled', context)

      expect(decision.action).toBe('abort')
      expect(decision.reason).toBe('user_cancelled')
    })

    it('should analyze step timeout and return retry decision', () => {
      const context = createTestContext()
      const decision = strategy.analyzeFailure('step_timeout', context)

      expect(decision.action).toBe('retry_step')
      expect(decision.reason).toBe('step_timeout')
    })

    it('should analyze dependency failed and return partial_replan decision', () => {
      const context = createTestContext()
      const decision = strategy.analyzeFailure('dependency_failed', context)

      expect(decision.action).toBe('partial_replan')
      expect(decision.reason).toBe('dependency_failed')
    })

    it('should analyze unexpected state and return escalate decision', () => {
      const context = createTestContext()
      const decision = strategy.analyzeFailure('unexpected_state', context)

      expect(decision.action).toBe('escalate')
      expect(decision.reason).toBe('unexpected_state')
    })

    it('should return abort when max attempts exceeded', () => {
      const context = createTestContext()
      const stepId = 'step-1'

      // Increment attempts to max
      for (let i = 0; i < 4; i++) {
        strategy.incrementAttempt(stepId)
      }

      const decision = strategy.analyzeFailure('tool_failure', context)

      expect(decision.action).toBe('abort')
    })
  })

  describe('attempt tracking', () => {
    it('should track replan attempts', () => {
      strategy.incrementAttempt('step-1')
      strategy.incrementAttempt('step-1')

      expect(strategy.getTotalAttempts()).toBe(0) // Failures not recorded yet
    })

    it('should increment retry attempts', () => {
      // incrementRetry should not throw
      expect(() => {
        strategy.incrementRetry('step-1')
        strategy.incrementRetry('step-1')
      }).not.toThrow()
    })

    it('should reset all counters', () => {
      strategy.incrementAttempt('step-1')
      strategy.incrementRetry('step-1')

      strategy.reset()

      expect(strategy.getHistory()).toHaveLength(0)
      expect(strategy.getFailures()).toHaveLength(0)
    })
  })

  describe('history recording', () => {
    it('should record failure history', () => {
      const context = createTestContext()
      strategy.analyzeFailure('tool_failure', context)

      const history = strategy.getHistory()
      expect(history.length).toBe(1)
      expect(history[0].trigger).toBe('tool_failure')
    })

    it('should update history outcome', () => {
      const context = createTestContext()
      strategy.analyzeFailure('tool_failure', context)

      const history = strategy.getHistory()
      expect(history[0].outcome).toBe('pending')

      strategy.updateHistoryOutcome(history[0].timestamp, 'success')
      expect(strategy.getHistory()[0].outcome).toBe('success')
    })
  })

  describe('failure records', () => {
    it('should record failures', () => {
      const context = createTestContext()
      strategy.analyzeFailure('tool_failure', context)

      const failures = strategy.getFailures()
      expect(failures.length).toBe(1)
      expect(failures[0].trigger).toBe('tool_failure')
      expect(failures[0].stepId).toBe('step-1')
    })

    it('should assess severity correctly', () => {
      const context = createTestContext()
      strategy.analyzeFailure('user_cancelled', context)

      const failures = strategy.getFailures()
      expect(failures[0].severity).toBe('critical')
    })
  })

  describe('configuration', () => {
    it('should use custom max attempts', () => {
      const customStrategy = createReplanStrategy({ maxReplanAttempts: 1 })
      const context = createTestContext()

      // First attempt
      customStrategy.analyzeFailure('tool_failure', context)
      // Increment to max
      customStrategy.incrementAttempt('step-1')

      const decision = customStrategy.analyzeFailure('tool_failure', context)
      expect(decision.action).toBe('abort')
    })

    it('should call onReplanDecision callback', () => {
      const callback = vi.fn()
      const customStrategy = createReplanStrategy({ onReplanDecision: callback })
      const context = createTestContext()

      customStrategy.analyzeFailure('tool_failure', context)

      expect(callback).toHaveBeenCalled()
    })

    it('should call onFailure callback', () => {
      const callback = vi.fn()
      const customStrategy = createReplanStrategy({ onFailure: callback })
      const context = createTestContext()

      customStrategy.analyzeFailure('tool_failure', context)

      expect(callback).toHaveBeenCalled()
    })
  })

  describe('isActionAllowed', () => {
    it('should return true for allowed actions', () => {
      expect(strategy.isActionAllowed('retry_step')).toBe(true)
      expect(strategy.isActionAllowed('abort')).toBe(true)
    })

    it('should return false for restricted actions', () => {
      const restrictedStrategy = createReplanStrategy({
        allowedActions: ['abort'],
      })

      expect(restrictedStrategy.isActionAllowed('retry_step')).toBe(false)
      expect(restrictedStrategy.isActionAllowed('abort')).toBe(true)
    })
  })
})

// ==================== Helper Functions Tests ====================

describe('canSkipStep', () => {
  it('should return true for steps with no dependents', () => {
    const plan = createTestPlan()
    const lastStep = plan.steps[2] // step-3 has no dependents

    expect(canSkipStep(lastStep, plan)).toBe(true)
  })

  it('should return false for steps with dependents', () => {
    const plan = createTestPlan()
    const firstStep = plan.steps[0] // step-1 is required by step-2

    expect(canSkipStep(firstStep, plan)).toBe(false)
  })
})

describe('getStepsToReplan', () => {
  it('should return steps from failed step onwards', () => {
    const plan = createTestPlan()
    const steps = getStepsToReplan('step-2', plan)

    expect(steps.length).toBe(2)
    expect(steps[0].id).toBe('step-2')
    expect(steps[1].id).toBe('step-3')
  })

  it('should return empty array for unknown step', () => {
    const plan = createTestPlan()
    const steps = getStepsToReplan('unknown-step', plan)

    expect(steps).toHaveLength(0)
  })
})

describe('calculateFailureImpact', () => {
  it('should calculate direct and transitive dependencies', () => {
    const plan = createTestPlan()
    const impact = calculateFailureImpact('step-1', plan)

    expect(impact.directDependencies).toContain('step-2')
    expect(impact.transitiveDependencies).toContain('step-3')
    expect(impact.affectedSteps).toContain('step-1')
    expect(impact.affectedSteps).toContain('step-2')
    expect(impact.affectedSteps).toContain('step-3')
  })

  it('should return only the failed step if no dependents', () => {
    const plan = createTestPlan()
    const impact = calculateFailureImpact('step-3', plan)

    expect(impact.directDependencies).toHaveLength(0)
    expect(impact.transitiveDependencies).toHaveLength(0)
    expect(impact.affectedSteps).toHaveLength(1)
    expect(impact.affectedSteps).toContain('step-3')
  })
})
