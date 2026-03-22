/**
 * Step Executor Tests
 * Task 66: Story 44.3 - Step Executor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  StepExecutor,
  createStepExecutor,
  planStepToRuntimeStatus,
  runtimeStatusToPlanStep,
  calculateTotalExecutionTime,
  getSuccessfulStepCount,
  getFailedStepCount,
  type StepExecutionResult,
  type ToolExecutor,
  type ToolExecutionContext,
  type ToolExecutionResult,
} from '../../../../../src/features/session/executor/stepExecutor'
import {
  RuntimeStateMachine,
  createRuntimeStateMachine,
} from '../../../../../src/features/session/runtime/runtimeStateMachine'
import {
  StructuredPlanner,
  createStructuredPlanner,
} from '../../../../../src/features/session/planner/structuredPlanner'

// ==================== Utility Functions Tests ====================

describe('planStepToRuntimeStatus', () => {
  it('should convert plan step status to runtime status', () => {
    expect(planStepToRuntimeStatus('pending')).toBe('pending')
    expect(planStepToRuntimeStatus('running')).toBe('running')
    expect(planStepToRuntimeStatus('completed')).toBe('completed')
    expect(planStepToRuntimeStatus('failed')).toBe('failed')
    expect(planStepToRuntimeStatus('skipped')).toBe('skipped')
  })
})

describe('runtimeStatusToPlanStep', () => {
  it('should convert runtime status to plan step status', () => {
    expect(runtimeStatusToPlanStep('pending')).toBe('pending')
    expect(runtimeStatusToPlanStep('running')).toBe('running')
    expect(runtimeStatusToPlanStep('completed')).toBe('completed')
    expect(runtimeStatusToPlanStep('failed')).toBe('failed')
    expect(runtimeStatusToPlanStep('skipped')).toBe('skipped')
  })
})

describe('calculateTotalExecutionTime', () => {
  it('should calculate total execution time', () => {
    const history: StepExecutionResult[] = [
      createTestResult('s1', 100),
      createTestResult('s2', 200),
      createTestResult('s3', 300),
    ]
    expect(calculateTotalExecutionTime(history)).toBe(600)
  })

  it('should return 0 for empty history', () => {
    expect(calculateTotalExecutionTime([])).toBe(0)
  })
})

describe('getSuccessfulStepCount', () => {
  it('should count successful steps', () => {
    const history: StepExecutionResult[] = [
      createTestResult('s1', 100, 'success'),
      createTestResult('s2', 100, 'success'),
      createTestResult('s3', 100, 'failed'),
    ]
    expect(getSuccessfulStepCount(history)).toBe(2)
  })
})

describe('getFailedStepCount', () => {
  it('should count failed steps', () => {
    const history: StepExecutionResult[] = [
      createTestResult('s1', 100, 'success'),
      createTestResult('s2', 100, 'failed'),
      createTestResult('s3', 100, 'failed'),
    ]
    expect(getFailedStepCount(history)).toBe(2)
  })
})

// ==================== StepExecutor Tests ====================

describe('StepExecutor', () => {
  let executor: StepExecutor
  let runtimeStateMachine: RuntimeStateMachine
  let planner: StructuredPlanner

  beforeEach(() => {
    runtimeStateMachine = createRuntimeStateMachine({
      sessionId: 'test-session',
    })
    planner = createStructuredPlanner()
    executor = createStepExecutor({
      runtimeStateMachine,
      planner,
    })
  })

  describe('initialization', () => {
    it('should initialize with idle state', () => {
      expect(executor.getState()).toBe('idle')
    })

    it('should have empty execution history', () => {
      expect(executor.getExecutionHistory()).toHaveLength(0)
    })
  })

  describe('getContext', () => {
    it('should return current context', () => {
      const context = executor.getContext()
      expect(context.state).toBe('idle')
      expect(context.currentStepId).toBeNull()
      expect(context.lastError).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset executor state', () => {
      executor.reset()
      expect(executor.getState()).toBe('idle')
      expect(executor.getExecutionHistory()).toHaveLength(0)
    })
  })

  describe('tool registration', () => {
    it('should register and unregister tool executors', () => {
      const toolExecutor = createMockToolExecutor()
      executor.registerToolExecutor('test-tool', toolExecutor)
      expect(executor.hasToolExecutor('test-tool')).toBe(true)
      executor.unregisterToolExecutor('test-tool')
      expect(executor.hasToolExecutor('test-tool')).toBe(false)
    })
  })

  describe('executeStep', () => {
    it('should execute an action step', async () => {
      const step = createTestPlanStep('step-1', 'action')
      const result = await executor.executeStep({
        stepId: 'step-1',
        step,
      })
      expect(result.status).toBe('success')
    })

    it('should handle tool call step with no executor', async () => {
      const step = createTestPlanStep('step-1', 'tool_call')
      step.toolRequirement = {
        toolId: 'non-existent-tool',
        toolName: 'Non Existent Tool',
      }
      const result = await executor.executeStep({
        stepId: 'step-1',
        step,
      })
      expect(result.status).toBe('failed')
      expect(result.error).toContain('No executor found')
    })

    it('should execute tool call step with registered executor', async () => {
      const toolExecutor = createMockToolExecutor({
        success: true,
        output: { result: 'test-output' },
      })
      executor.registerToolExecutor('test-tool', toolExecutor)

      const step = createTestPlanStep('step-1', 'tool_call')
      step.toolRequirement = {
        toolId: 'test-tool',
        toolName: 'Test Tool',
      }
      const result = await executor.executeStep({
        stepId: 'step-1',
        step,
      })
      expect(result.status).toBe('success')
      expect(result.output).toBeDefined()
    })

    it('should handle tool execution failure', async () => {
      const toolExecutor = createMockToolExecutor({
        success: false,
        error: 'Tool execution failed',
      })
      executor.registerToolExecutor('failing-tool', toolExecutor)

      const step = createTestPlanStep('step-1', 'tool_call')
      step.toolRequirement = {
        toolId: 'failing-tool',
        toolName: 'Failing Tool',
      }
      const result = await executor.executeStep({
        stepId: 'step-1',
        step,
      })
      expect(result.status).toBe('failed')
      expect(result.error).toContain('Tool execution failed')
    })

    it('should handle confirmation step', async () => {
      const step = createTestPlanStep('step-1', 'action')
      step.confirmationRequirement = {
        type: 'user',
        message: 'Please confirm',
      }
      const result = await executor.executeStep({
        stepId: 'step-1',
        step,
      })
      expect(result.status).toBe('pending')
      expect(result.requiresConfirmation).toBe(true)
      expect(result.confirmationMessage).toBe('Please confirm')
    })

    it('should execute wait step', async () => {
      const step = createTestPlanStep('step-1', 'wait')
      step.estimatedDuration = 10 // Very short wait for testing
      const result = await executor.executeStep({
        stepId: 'step-1',
        step,
      })
      expect(result.status).toBe('success')
    })
  })

  describe('executePlan', () => {
    it('should execute all steps in a plan', async () => {
      const planResult = planner.generatePlan({
        goal: 'Step 1\nStep 2\nStep 3',
      })
      expect(planResult.success).toBe(true)

      const results = await executor.executePlan(planResult.plan)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should stop on failure', async () => {
      // Register a failing tool
      const failingExecutor = createMockToolExecutor({
        success: false,
        error: 'Intentional failure',
      })
      executor.registerToolExecutor('fail-tool', failingExecutor)

      const planResult = planner.generatePlan({
        goal: 'Step 1\nStep 2\nStep 3',
      })
      expect(planResult.success).toBe(true)
      expect(planResult.plan.steps.length).toBeGreaterThan(0)

      // Modify first step to use the failing tool
      const step = planResult.plan.steps[0]
      step.type = 'tool_call'
      step.toolRequirement = {
        toolId: 'fail-tool',
        toolName: 'Fail Tool',
      }
      step.dependencies = undefined // Ensure no dependencies

      const results = await executor.executePlan(planResult.plan)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].status).toBe('failed')
    })

    it('should skip skipped steps', async () => {
      const planResult = planner.generatePlan({
        goal: 'Step 1\nStep 2\nStep 3',
      })
      expect(planResult.success).toBe(true)

      // Skip the second step
      planResult.plan.steps[1].status = 'skipped'

      const results = await executor.executePlan(planResult.plan)
      expect(results.some(r => r.status === 'skipped')).toBe(true)
    })
  })

  describe('continueAfterConfirmation', () => {
    it('should continue after confirmation', async () => {
      const planResult = planner.generatePlan({
        goal: 'Step 1\nStep 2',
      })
      expect(planResult.success).toBe(true)
      expect(planResult.plan.steps.length).toBeGreaterThan(0)

      // Add confirmation requirement to first step
      const step = planResult.plan.steps[0]
      step.confirmationRequirement = {
        type: 'user',
        message: 'Confirm?',
      }
      step.dependencies = undefined // Ensure no dependencies

      // Execute to get pending state
      const firstResults = await executor.executePlan(planResult.plan)
      expect(firstResults.length).toBeGreaterThan(0)
      expect(firstResults[0].status).toBe('pending')

      // Continue after confirmation
      const continuedResults = await executor.continueAfterConfirmation(
        planResult.plan,
        true,
        planResult.plan.steps[0].id
      )
      expect(continuedResults.length).toBeGreaterThan(0)
    })

    it('should cancel on rejection', async () => {
      const planResult = planner.generatePlan({
        goal: 'Step 1',
      })
      expect(planResult.success).toBe(true)

      // Add confirmation requirement
      planResult.plan.steps[0].confirmationRequirement = {
        type: 'user',
        message: 'Confirm?',
      }

      // Execute to get pending state
      await executor.executePlan(planResult.plan)

      // Reject confirmation
      const continuedResults = await executor.continueAfterConfirmation(
        planResult.plan,
        false,
        planResult.plan.steps[0].id
      )
      expect(continuedResults.some(r => r.status === 'cancelled')).toBe(true)
    })
  })

  describe('listeners', () => {
    it('should notify context listeners', () => {
      const listener = vi.fn()
      executor.addContextListener(listener)
      executor.reset()
      expect(listener).toHaveBeenCalled()
    })
  })
})

// ==================== Test Helpers ====================

function createTestResult(
  stepId: string,
  duration: number,
  status: StepExecutionResult['status'] = 'success'
): StepExecutionResult {
  return {
    stepId,
    status,
    timestamp: Date.now(),
    duration,
  }
}

function createTestPlanStep(
  id: string,
  type: 'action' | 'tool_call' | 'wait' | 'confirmation'
): import('../../../../../src/features/session/planner/structuredPlanner').PlanStep {
  return {
    id,
    name: `Step ${id}`,
    type,
    status: 'pending',
    order: 0,
  }
}

function createMockToolExecutor(result: Partial<ToolExecutionResult> = {}): ToolExecutor {
  return {
    execute: vi.fn().mockResolvedValue({
      success: true,
      output: {},
      ...result,
    }),
    canExecute: vi.fn().mockReturnValue(true),
  }
}
