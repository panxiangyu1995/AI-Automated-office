/**
 * Structured Planner Tests
 * Task 65: Story 44.2 - Structured Planner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  StructuredPlanner,
  InMemoryPlanStorage,
  createStructuredPlanner,
  generatePlanId,
  generateStepId,
  generatePlanName,
  parseGoalIntoSteps,
  createStepFromGoalPart,
  detectStepType,
  generateStepName,
  extractToolInfo,
  calculatePlanProgress,
  getPlanSummary,
  isPlanTerminal,
  getPendingSteps,
  getFailedSteps,
  type Plan,
  type PlanStep,
  type PlanStepStatus,
} from '../../../../../src/features/session/planner'

// ==================== Helper Functions Tests ====================

describe('generatePlanId', () => {
  it('should generate unique IDs', () => {
    const id1 = generatePlanId()
    const id2 = generatePlanId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^plan_[a-f0-9]{32}$/)
  })
})

describe('generateStepId', () => {
  it('should generate unique step IDs', () => {
    const id1 = generateStepId()
    const id2 = generateStepId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^step_[a-f0-9]{16}$/)
  })
})

describe('generatePlanName', () => {
  it('should generate name from first sentence', () => {
    const goal = 'Create a report. Then send it to the team.'
    expect(generatePlanName(goal)).toBe('Create a report')
  })

  it('should truncate long sentences', () => {
    const goal = 'This is a very long sentence that exceeds the maximum length limit for plan names'
    expect(generatePlanName(goal).length).toBeLessThanOrEqual(50)
  })

  it('should handle short goals', () => {
    const goal = 'Short goal'
    expect(generatePlanName(goal)).toBe('Short goal')
  })
})

describe('parseGoalIntoSteps', () => {
  it('should parse numbered list', () => {
    const goal = `
      1. First step
      2. Second step
      3. Third step
    `
    const steps = parseGoalIntoSteps(goal)
    expect(steps).toHaveLength(3)
    expect(steps[0]).toBe('First step')
    expect(steps[1]).toBe('Second step')
    expect(steps[2]).toBe('Third step')
  })

  it('should parse bullet list', () => {
    const goal = `
      - First step
      - Second step
      * Third step
    `
    const steps = parseGoalIntoSteps(goal)
    expect(steps).toHaveLength(3)
  })

  it('should return single step for plain text', () => {
    const goal = 'Simple goal without list'
    const steps = parseGoalIntoSteps(goal)
    expect(steps).toHaveLength(1)
    expect(steps[0]).toBe('Simple goal without list')
  })
})

describe('detectStepType', () => {
  it('should detect tool_call type', () => {
    expect(detectStepType('Call the api tool')).toBe('tool_call')
    expect(detectStepType('Execute the function')).toBe('tool_call')
    expect(detectStepType('Use tool: database')).toBe('tool_call')
  })

  it('should detect confirmation type', () => {
    expect(detectStepType('Confirm the action')).toBe('confirmation')
    expect(detectStepType('Get approval from manager')).toBe('confirmation')
    expect(detectStepType('Request permission')).toBe('confirmation')
  })

  it('should detect wait type', () => {
    expect(detectStepType('Wait for response')).toBe('wait')
    expect(detectStepType('Wait until complete')).toBe('wait')
  })

  it('should detect decision type', () => {
    expect(detectStepType('If condition is met')).toBe('decision')
    expect(detectStepType('When the process completes')).toBe('decision')
  })

  it('should return action for regular steps', () => {
    expect(detectStepType('Create a report')).toBe('action')
    expect(detectStepType('Send an email')).toBe('action')
  })
})

describe('generateStepName', () => {
  it('should truncate long content', () => {
    const content = 'This is a very long step description that needs to be truncated'
    expect(generateStepName(content).length).toBeLessThanOrEqual(30)
  })

  it('should stop at first period', () => {
    const content = 'First part. Second part. Third part.'
    expect(generateStepName(content)).toBe('First part')
  })
})

describe('extractToolInfo', () => {
  it('should extract tool from tool: pattern', () => {
    const info = extractToolInfo('Use tool: database to query')
    expect(info).not.toBeNull()
    expect(info?.toolId).toBe('database')
  })

  it('should extract tool from call pattern', () => {
    const info = extractToolInfo('Call the api tool')
    expect(info).not.toBeNull()
    expect(info?.toolId).toBe('api')
  })

  it('should return null for no tool', () => {
    const info = extractToolInfo('Create a report')
    expect(info).toBeNull()
  })
})

// ==================== InMemoryPlanStorage Tests ====================

describe('InMemoryPlanStorage', () => {
  let storage: InMemoryPlanStorage

  beforeEach(() => {
    storage = new InMemoryPlanStorage()
  })

  it('should save and load plan', async () => {
    const plan = createTestPlan()
    await storage.save(plan)
    const loaded = await storage.load(plan.id)
    expect(loaded).not.toBeNull()
    expect(loaded?.id).toBe(plan.id)
  })

  it('should return null for non-existent plan', async () => {
    const loaded = await storage.load('non-existent')
    expect(loaded).toBeNull()
  })

  it('should delete plan', async () => {
    const plan = createTestPlan()
    await storage.save(plan)
    await storage.delete(plan.id)
    const loaded = await storage.load(plan.id)
    expect(loaded).toBeNull()
  })

  it('should list plans', async () => {
    const plan1 = createTestPlan('plan1')
    const plan2 = createTestPlan('plan2')
    await storage.save(plan1)
    await storage.save(plan2)
    const plans = await storage.list()
    expect(plans).toHaveLength(2)
  })

  it('should filter plans by status', async () => {
    const plan1 = createTestPlan('plan1', 'completed')
    const plan2 = createTestPlan('plan2', 'running')
    await storage.save(plan1)
    await storage.save(plan2)
    const plans = await storage.list({ status: ['completed'] })
    expect(plans).toHaveLength(1)
    expect(plans[0].status).toBe('completed')
  })
})

// ==================== StructuredPlanner Tests ====================

describe('StructuredPlanner', () => {
  let planner: StructuredPlanner

  beforeEach(() => {
    planner = createStructuredPlanner()
  })

  describe('generatePlan', () => {
    it('should generate a plan from a goal', () => {
      const result = planner.generatePlan({ goal: 'Create a report' })
      expect(result.success).toBe(true)
      expect(result.plan).toBeDefined()
      expect(result.plan.goal).toBe('Create a report')
    })

    it('should fail without a goal', () => {
      const result = planner.generatePlan({ goal: '' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Goal is required')
    })

    it('should generate steps from goal', () => {
      const result = planner.generatePlan({
        goal: `
          1. First step
          2. Second step
          3. Third step
        `,
      })
      expect(result.success).toBe(true)
      expect(result.plan.steps.length).toBeGreaterThan(0)
    })

    it('should respect maxSteps constraint', () => {
      const result = planner.generatePlan({
        goal: 'Step 1\nStep 2\nStep 3\nStep 4\nStep 5',
        constraints: { maxSteps: 2 },
      })
      expect(result.success).toBe(true)
      expect(result.plan.steps.length).toBe(2)
      expect(result.warnings).toBeDefined()
    })

    it('should mark blocked tools', () => {
      const result = planner.generatePlan({
        goal: 'Use tool: database',
        constraints: { blockedTools: ['database'] },
      })
      expect(result.success).toBe(true)
      const dbStep = result.plan.steps.find(s => s.toolRequirement?.toolId === 'database')
      expect(dbStep?.status).toBe('skipped')
    })

    it('should add confirmation requirements', () => {
      const result = planner.generatePlan({
        goal: 'Use tool: file to delete data',
        constraints: { requireConfirmationFor: ['tool'] },
      })
      expect(result.success).toBe(true)
      const step = result.plan.steps.find(s => s.type === 'tool_call')
      expect(step?.confirmationRequirement).toBeDefined()
    })
  })

  describe('setCurrentPlan', () => {
    it('should set current plan', () => {
      const result = planner.generatePlan({ goal: 'Test goal' })
      planner.setCurrentPlan(result.plan)
      expect(planner.getCurrentPlan()).not.toBeNull()
      expect(planner.getCurrentPlan()?.id).toBe(result.plan.id)
    })
  })

  describe('savePlan/loadPlan', () => {
    it('should save and load plan', async () => {
      const result = planner.generatePlan({ goal: 'Test goal' })
      await planner.savePlan(result.plan)
      const loaded = await planner.loadPlan(result.plan.id)
      expect(loaded).not.toBeNull()
      expect(loaded?.id).toBe(result.plan.id)
    })
  })

  describe('step management', () => {
    beforeEach(() => {
      const result = planner.generatePlan({ goal: 'Step 1\nStep 2\nStep 3' })
      planner.setCurrentPlan(result.plan)
    })

    it('should get current step', () => {
      const step = planner.getCurrentStep()
      expect(step).not.toBeNull()
      expect(step?.order).toBe(0)
    })

    it('should update step status', () => {
      const step = planner.getCurrentStep()
      expect(step).not.toBeNull()
      const success = planner.updateStepStatus(step!.id, 'running')
      expect(success).toBe(true)
      const updated = planner.getStep(step!.id)
      expect(updated?.status).toBe('running')
    })

    it('should advance to next step', () => {
      const firstStep = planner.getCurrentStep()
      expect(firstStep).not.toBeNull()
      planner.updateStepStatus(firstStep!.id, 'completed')
      const nextStep = planner.advanceToNextStep()
      expect(nextStep).not.toBeNull()
      expect(nextStep?.order).toBe(1)
    })

    it('should check dependencies', () => {
      const steps = planner.getCurrentPlan()?.steps ?? []
      if (steps.length > 1) {
        const secondStep = steps[1]
        expect(secondStep.dependencies).toBeDefined()
      }
    })
  })

  describe('plan execution', () => {
    beforeEach(() => {
      const result = planner.generatePlan({ goal: 'Step 1\nStep 2' })
      planner.setCurrentPlan(result.plan)
    })

    it('should start plan', () => {
      const success = planner.startPlan()
      expect(success).toBe(true)
      expect(planner.getCurrentPlan()?.status).toBe('running')
    })

    it('should not start non-ready plan', () => {
      planner.startPlan()
      const success = planner.startPlan()
      expect(success).toBe(false)
    })

    it('should pause plan', () => {
      planner.startPlan()
      const success = planner.pausePlan()
      expect(success).toBe(true)
      expect(planner.getCurrentPlan()?.status).toBe('paused')
    })

    it('should resume plan', () => {
      planner.startPlan()
      planner.pausePlan()
      const success = planner.resumePlan()
      expect(success).toBe(true)
      expect(planner.getCurrentPlan()?.status).toBe('running')
    })

    it('should complete plan', () => {
      planner.startPlan()
      const success = planner.completePlan()
      expect(success).toBe(true)
      expect(planner.getCurrentPlan()?.status).toBe('completed')
    })

    it('should fail plan', () => {
      planner.startPlan()
      const success = planner.failPlan('Test error')
      expect(success).toBe(true)
      expect(planner.getCurrentPlan()?.status).toBe('failed')
    })

    it('should cancel plan', () => {
      planner.startPlan()
      const success = planner.cancelPlan('User cancelled')
      expect(success).toBe(true)
      expect(planner.getCurrentPlan()?.status).toBe('cancelled')
    })
  })

  describe('listeners', () => {
    it('should notify plan listeners', () => {
      const listener = vi.fn()
      planner.addPlanListener(listener)
      planner.generatePlan({ goal: 'Test' })
      const result = planner.generatePlan({ goal: 'Test goal' })
      planner.setCurrentPlan(result.plan)
      expect(listener).toHaveBeenCalled()
    })

    it('should notify step listeners', () => {
      const listener = vi.fn()
      const result = planner.generatePlan({ goal: 'Test goal' })
      planner.setCurrentPlan(result.plan)
      planner.addStepListener(listener)
      const step = planner.getCurrentStep()
      expect(step).not.toBeNull()
      planner.updateStepStatus(step!.id, 'running')
      expect(listener).toHaveBeenCalled()
    })

    it('should remove listener on unsubscribe', () => {
      const listener = vi.fn()
      const unsubscribe = planner.addPlanListener(listener)
      unsubscribe()
      const result = planner.generatePlan({ goal: 'Test goal' })
      planner.setCurrentPlan(result.plan)
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('persistence', () => {
    it('should persist and restore plan', () => {
      const result = planner.generatePlan({ goal: 'Test goal' })
      planner.setCurrentPlan(result.plan)
      planner.persistToStorage()
      const restored = planner.restoreFromStorage(result.plan.id)
      expect(restored).not.toBeNull()
      expect(restored?.id).toBe(result.plan.id)
    })

    it('should clear persisted plan', () => {
      const result = planner.generatePlan({ goal: 'Test goal' })
      planner.setCurrentPlan(result.plan)
      planner.persistToStorage()
      planner.clearPersistedPlan(result.plan.id)
      const restored = planner.restoreFromStorage(result.plan.id)
      expect(restored).toBeNull()
    })
  })
})

// ==================== Utility Functions Tests ====================

describe('calculatePlanProgress', () => {
  it('should return 0 for empty plan', () => {
    const plan = createTestPlan('test', 'running', [])
    expect(calculatePlanProgress(plan)).toBe(0)
  })

  it('should calculate progress correctly', () => {
    const steps: PlanStep[] = [
      createTestStep('s1', 'completed'),
      createTestStep('s2', 'completed'),
      createTestStep('s3', 'pending'),
      createTestStep('s4', 'pending'),
    ]
    const plan = createTestPlan('test', 'running', steps)
    expect(calculatePlanProgress(plan)).toBe(0.5)
  })

  it('should include skipped steps', () => {
    const steps: PlanStep[] = [
      createTestStep('s1', 'completed'),
      createTestStep('s2', 'skipped'),
      createTestStep('s3', 'pending'),
    ]
    const plan = createTestPlan('test', 'running', steps)
    expect(calculatePlanProgress(plan)).toBeCloseTo(0.67, 1)
  })
})

describe('getPlanSummary', () => {
  it('should generate correct summary', () => {
    const steps: PlanStep[] = [
      createTestStep('s1', 'completed'),
      createTestStep('s2', 'completed'),
      createTestStep('s3', 'pending'),
    ]
    const plan = createTestPlan('test', 'running', steps)
    plan.name = 'Test Plan'
    const summary = getPlanSummary(plan)
    expect(summary).toContain('Test Plan')
    expect(summary).toContain('2/3')
    expect(summary).toContain('67%')
    expect(summary).toContain('running')
  })
})

describe('isPlanTerminal', () => {
  it('should return true for terminal states', () => {
    expect(isPlanTerminal(createTestPlan('test', 'completed'))).toBe(true)
    expect(isPlanTerminal(createTestPlan('test', 'failed'))).toBe(true)
    expect(isPlanTerminal(createTestPlan('test', 'cancelled'))).toBe(true)
  })

  it('should return false for non-terminal states', () => {
    expect(isPlanTerminal(createTestPlan('test', 'running'))).toBe(false)
    expect(isPlanTerminal(createTestPlan('test', 'paused'))).toBe(false)
    expect(isPlanTerminal(createTestPlan('test', 'ready'))).toBe(false)
  })
})

describe('getPendingSteps', () => {
  it('should return pending and ready steps', () => {
    const steps: PlanStep[] = [
      createTestStep('s1', 'completed'),
      createTestStep('s2', 'pending'),
      createTestStep('s3', 'ready'),
      createTestStep('s4', 'running'),
    ]
    const plan = createTestPlan('test', 'running', steps)
    const pending = getPendingSteps(plan)
    expect(pending).toHaveLength(2)
  })
})

describe('getFailedSteps', () => {
  it('should return failed steps', () => {
    const steps: PlanStep[] = [
      createTestStep('s1', 'completed'),
      createTestStep('s2', 'failed'),
      createTestStep('s3', 'failed'),
    ]
    const plan = createTestPlan('test', 'running', steps)
    const failed = getFailedSteps(plan)
    expect(failed).toHaveLength(2)
  })
})

// ==================== Test Helpers ====================

function createTestPlan(
  id: string = 'test-plan',
  status: Plan['status'] = 'ready',
  steps: PlanStep[] = []
): Plan {
  return {
    id,
    name: 'Test Plan',
    description: 'Test plan description',
    status,
    priority: 'normal',
    steps,
    currentStepIndex: 0,
    goal: 'Test goal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'user',
    version: 1,
  }
}

function createTestStep(id: string, status: PlanStepStatus): PlanStep {
  return {
    id,
    name: `Step ${id}`,
    type: 'action',
    status,
    order: 0,
  }
}
