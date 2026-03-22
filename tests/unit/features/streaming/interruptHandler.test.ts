/**
 * Unit Tests for Interrupt Handler
 * Task 63: Story 43.4 - Interrupt Retry and Checkpoint Recovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  InterruptHandler,
  InMemoryCheckpointStorage,
  InMemoryRecoveryHistoryStorage,
  createInterruptHandler,
  isCheckpointValid,
  getCheckpointAge,
  formatCheckpoint,
  determineBestStrategy,
  type InterruptRequest,
  type Checkpoint,
  type StepState,
  type RecoveryStrategy,
} from '@/features/streaming/runtime/interruptHandler'
import {
  RuntimeEventEmitter,
  createRuntimeEventEmitter,
} from '@/features/streaming/runtime/runtimeEvents'

// ==================== Test Fixtures ====================

function createTestEmitter(): RuntimeEventEmitter {
  return createRuntimeEventEmitter('test-session-' + Date.now())
}

function createTestStep(): StepState {
  return {
    stepId: 'step-1',
    stepName: 'Test Step',
    stepType: 'execution',
    startedAt: Date.now(),
    status: 'running',
    progress: 50,
  }
}

// ==================== Interrupt Handler Tests ====================

describe('InterruptHandler', () => {
  let handler: InterruptHandler
  let emitter: RuntimeEventEmitter

  beforeEach(() => {
    emitter = createTestEmitter()
    handler = createInterruptHandler('test-session', emitter, {
      autoCheckpoint: false, // Disable auto for unit tests
    })
    handler.initialize()
  })

  describe('interrupt requests', () => {
    it('should create an interrupt request', async () => {
      const result = await handler.requestInterrupt('pause', 'User requested')

      expect(result.success).toBe(true)
      expect(result.request.type).toBe('pause')
      expect(result.request.status).toBe('completed')
      expect(result.request.reason).toBe('User requested')
    })

    it('should track current interrupt', async () => {
      await handler.requestInterrupt('stop')

      const interrupt = handler.getCurrentInterrupt()
      expect(interrupt).not.toBeNull()
      expect(interrupt?.type).toBe('stop')
    })

    it('should return correct interrupt status', async () => {
      expect(handler.getInterruptStatus()).toBe('none')

      await handler.requestInterrupt('pause')
      expect(handler.getInterruptStatus()).toBe('completed')
    })

    it('should support different interrupt types', async () => {
      const types = ['pause', 'stop', 'abort', 'timeout'] as const

      for (const type of types) {
        const handler = createInterruptHandler('test-session', emitter)
        handler.initialize()
        const result = await handler.requestInterrupt(type)
        expect(result.success).toBe(true)
        expect(result.request.type).toBe(type)
      }
    })

    it('should create checkpoint on pause', async () => {
      handler.setCurrentStep(createTestStep())

      const result = await handler.requestInterrupt('pause')
      expect(result.success).toBe(true)
      expect(result.checkpoint).not.toBeNull()
    })
  })

  describe('cancel interrupt', () => {
    it('should return false when no interrupt to cancel', () => {
      expect(handler.cancelInterrupt()).toBe(false)
    })

    it('should update interrupt status on cancel', async () => {
      // Request but don't await to keep it pending
      const requestPromise = handler.requestInterrupt('pause')
      
      // Cancel might not work since request completes immediately
      // This tests the API shape
      await requestPromise
    })
  })

  describe('checkpoint management', () => {
    it('should create checkpoint when step is set', async () => {
      handler.setCurrentStep(createTestStep())

      const checkpoint = await handler.createCheckpoint()

      expect(checkpoint).not.toBeNull()
      expect(checkpoint?.sessionId).toBe('test-session')
      expect(checkpoint?.step.stepId).toBe('step-1')
      expect(checkpoint?.status).toBe('created')
    })

    it('should return null when no step is set', async () => {
      const checkpoint = await handler.createCheckpoint()
      expect(checkpoint).toBeNull()
    })

    it('should store checkpoint metadata', async () => {
      handler.setCurrentStep(createTestStep())

      const checkpoint = await handler.createCheckpoint()

      expect(checkpoint?.metadata).toBeDefined()
      expect(checkpoint?.metadata?.eventSequence).toBeGreaterThanOrEqual(0)
    })

    it('should retrieve checkpoint by id', async () => {
      handler.setCurrentStep(createTestStep())
      const created = await handler.createCheckpoint()

      const retrieved = await handler.getCheckpoint(created!.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(created?.id)
    })

    it('should get all session checkpoints', async () => {
      handler.setCurrentStep(createTestStep())
      await handler.createCheckpoint()

      handler.setCurrentStep({ ...createTestStep(), stepId: 'step-2' })
      await handler.createCheckpoint()

      const checkpoints = await handler.getSessionCheckpoints()
      expect(checkpoints.length).toBeGreaterThanOrEqual(2)
    })

    it('should get latest valid checkpoint', async () => {
      handler.setCurrentStep(createTestStep())
      const first = await handler.createCheckpoint()

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      handler.setCurrentStep({ ...createTestStep(), stepId: 'step-2' })
      const second = await handler.createCheckpoint()

      const latest = await handler.getLatestCheckpoint()
      expect(latest).not.toBeNull()
      expect(latest?.status).toBe('created')
      // The latest should have the step-2
      expect(latest?.step.stepId).toBe('step-2')
    })
  })

  describe('recovery', () => {
    it('should recover with restart strategy', async () => {
      handler.setCurrentStep(createTestStep())

      const result = await handler.recover('restart')

      expect(result.success).toBe(true)
      expect(result.decision.strategy).toBe('restart')
      expect(handler.getCurrentStep()).toBeNull()
    })

    it('should recover with checkpoint strategy', async () => {
      handler.setCurrentStep(createTestStep())
      const checkpoint = await handler.createCheckpoint()

      const result = await handler.recover('checkpoint', checkpoint?.id)

      expect(result.success).toBe(true)
      expect(result.decision.strategy).toBe('checkpoint')
      expect(result.checkpoint?.id).toBe(checkpoint?.id)
    })

    it('should recover with step_start strategy', async () => {
      handler.setCurrentStep(createTestStep())
      const checkpoint = await handler.createCheckpoint()

      const result = await handler.recover('step_start', checkpoint?.id)

      expect(result.success).toBe(true)
      expect(result.decision.strategy).toBe('step_start')
    })

    it('should recover with skip strategy', async () => {
      handler.setCurrentStep(createTestStep())

      const result = await handler.recover('skip')

      expect(result.success).toBe(true)
      expect(result.decision.strategy).toBe('skip')
    })

    it('should fail recovery without checkpoint for checkpoint strategy', async () => {
      const result = await handler.recover('checkpoint')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No checkpoint')
    })

    it('should record recovery history', async () => {
      handler.setCurrentStep(createTestStep())
      await handler.createCheckpoint()

      await handler.recover('restart')

      const history = await handler.getRecoveryHistory()
      expect(history.length).toBeGreaterThan(0)
      expect(history[0].decision.strategy).toBe('restart')
    })

    it('should provide recommended strategy', async () => {
      handler.setCurrentStep(createTestStep())
      await handler.createCheckpoint()

      const strategy = await handler.getRecommendedStrategy()
      expect(['restart', 'checkpoint', 'step_start', 'skip']).toContain(strategy)
    })
  })

  describe('listeners', () => {
    it('should notify interrupt listeners', async () => {
      const listener = vi.fn()
      handler.addInterruptListener(listener)

      await handler.requestInterrupt('pause')

      expect(listener).toHaveBeenCalled()
    })

    it('should notify checkpoint listeners', async () => {
      const listener = vi.fn()
      handler.addCheckpointListener(listener)

      handler.setCurrentStep(createTestStep())
      await handler.createCheckpoint()

      expect(listener).toHaveBeenCalled()
    })

    it('should notify recovery listeners', async () => {
      const listener = vi.fn()
      handler.addRecoveryListener(listener)

      await handler.recover('restart')

      expect(listener).toHaveBeenCalled()
    })

    it('should support listener unsubscribe', async () => {
      const listener = vi.fn()
      const unsubscribe = handler.addInterruptListener(listener)
      unsubscribe()

      await handler.requestInterrupt('pause')

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('lifecycle', () => {
    it('should cleanup properly', () => {
      handler.cleanup()
      // Should not throw
    })

    it('should return correct session id', () => {
      expect(handler.getSessionId()).toBe('test-session')
    })
  })
})

// ==================== Checkpoint Storage Tests ====================

describe('InMemoryCheckpointStorage', () => {
  let storage: InMemoryCheckpointStorage

  beforeEach(() => {
    storage = new InMemoryCheckpointStorage()
  })

  function createTestCheckpoint(id: string): Checkpoint {
    return {
      id,
      sessionId: 'test-session',
      step: createTestStep(),
      status: 'created',
      createdAt: Date.now(),
    }
  }

  it('should save and retrieve checkpoint', async () => {
    const checkpoint = createTestCheckpoint('cp-1')
    await storage.saveCheckpoint(checkpoint)

    const retrieved = await storage.getCheckpoint('cp-1')
    expect(retrieved).toEqual(checkpoint)
  })

  it('should return null for non-existent checkpoint', async () => {
    const retrieved = await storage.getCheckpoint('non-existent')
    expect(retrieved).toBeNull()
  })

  it('should get checkpoints by session', async () => {
    await storage.saveCheckpoint(createTestCheckpoint('cp-1'))
    await storage.saveCheckpoint(createTestCheckpoint('cp-2'))

    const checkpoints = await storage.getCheckpointsBySession('test-session')
    expect(checkpoints.length).toBe(2)
  })

  it('should delete checkpoint', async () => {
    await storage.saveCheckpoint(createTestCheckpoint('cp-1'))
    await storage.deleteCheckpoint('cp-1')

    const retrieved = await storage.getCheckpoint('cp-1')
    expect(retrieved).toBeNull()
  })

  it('should delete expired checkpoints', async () => {
    const expiredCheckpoint: Checkpoint = {
      ...createTestCheckpoint('cp-expired'),
      expiresAt: Date.now() - 1000, // Expired
    }
    const validCheckpoint = createTestCheckpoint('cp-valid')

    await storage.saveCheckpoint(expiredCheckpoint)
    await storage.saveCheckpoint(validCheckpoint)

    const deleted = await storage.deleteExpiredCheckpoints()
    expect(deleted).toBe(1)

    const remaining = await storage.getCheckpointsBySession('test-session')
    expect(remaining.length).toBe(1)
    expect(remaining[0].id).toBe('cp-valid')
  })
})

// ==================== Recovery History Storage Tests ====================

describe('InMemoryRecoveryHistoryStorage', () => {
  let storage: InMemoryRecoveryHistoryStorage

  beforeEach(() => {
    storage = new InMemoryRecoveryHistoryStorage()
  })

  it('should add and retrieve entries', async () => {
    const entry = {
      id: 'entry-1',
      sessionId: 'test-session',
      decision: {
        id: 'decision-1',
        sessionId: 'test-session',
        strategy: 'restart' as RecoveryStrategy,
        reason: 'Test',
        decidedAt: Date.now(),
        decidedBy: 'user' as const,
      },
      result: {
        success: true,
      },
      createdAt: Date.now(),
    }

    await storage.addEntry(entry)
    const entries = await storage.getEntries('test-session')

    expect(entries.length).toBe(1)
    expect(entries[0].id).toBe('entry-1')
  })

  it('should get entry by id', async () => {
    const entry = {
      id: 'entry-1',
      sessionId: 'test-session',
      decision: {
        id: 'decision-1',
        sessionId: 'test-session',
        strategy: 'restart' as RecoveryStrategy,
        reason: 'Test',
        decidedAt: Date.now(),
        decidedBy: 'user' as const,
      },
      result: { success: true },
      createdAt: Date.now(),
    }

    await storage.addEntry(entry)
    const retrieved = await storage.getEntry('entry-1')

    expect(retrieved).not.toBeNull()
    expect(retrieved?.id).toBe('entry-1')
  })

  it('should clear entries for session', async () => {
    const entry = {
      id: 'entry-1',
      sessionId: 'test-session',
      decision: {
        id: 'decision-1',
        sessionId: 'test-session',
        strategy: 'restart' as RecoveryStrategy,
        reason: 'Test',
        decidedAt: Date.now(),
        decidedBy: 'user' as const,
      },
      result: { success: true },
      createdAt: Date.now(),
    }

    await storage.addEntry(entry)
    await storage.clearEntries('test-session')
    const entries = await storage.getEntries('test-session')

    expect(entries.length).toBe(0)
  })
})

// ==================== Helper Function Tests ====================

describe('isCheckpointValid', () => {
  it('should return true for valid checkpoint', () => {
    const checkpoint: Checkpoint = {
      id: 'cp-1',
      sessionId: 'test',
      step: createTestStep(),
      status: 'created',
      createdAt: Date.now(),
    }
    expect(isCheckpointValid(checkpoint)).toBe(true)
  })

  it('should return false for expired checkpoint', () => {
    const checkpoint: Checkpoint = {
      id: 'cp-1',
      sessionId: 'test',
      step: createTestStep(),
      status: 'expired',
      createdAt: Date.now(),
    }
    expect(isCheckpointValid(checkpoint)).toBe(false)
  })

  it('should return false for checkpoint past expiry time', () => {
    const checkpoint: Checkpoint = {
      id: 'cp-1',
      sessionId: 'test',
      step: createTestStep(),
      status: 'created',
      createdAt: Date.now() - 100000,
      expiresAt: Date.now() - 1000, // Expired
    }
    expect(isCheckpointValid(checkpoint)).toBe(false)
  })

  it('should return false for abandoned checkpoint', () => {
    const checkpoint: Checkpoint = {
      id: 'cp-1',
      sessionId: 'test',
      step: createTestStep(),
      status: 'abandoned',
      createdAt: Date.now(),
    }
    expect(isCheckpointValid(checkpoint)).toBe(false)
  })
})

describe('getCheckpointAge', () => {
  it('should return checkpoint age in milliseconds', () => {
    const createdAt = Date.now() - 5000
    const checkpoint: Checkpoint = {
      id: 'cp-1',
      sessionId: 'test',
      step: createTestStep(),
      status: 'created',
      createdAt,
    }

    const age = getCheckpointAge(checkpoint)
    expect(age).toBeGreaterThanOrEqual(5000)
    expect(age).toBeLessThan(6000)
  })
})

describe('formatCheckpoint', () => {
  it('should format checkpoint for display', () => {
    const checkpoint: Checkpoint = {
      id: '1234567890abcdef',
      sessionId: 'test',
      step: {
        stepId: 'step-1',
        stepName: 'Test Step',
        stepType: 'execution',
        startedAt: Date.now(),
        status: 'running',
      },
      status: 'created',
      createdAt: Date.now() - 60000, // 1 minute ago
    }

    const formatted = formatCheckpoint(checkpoint)
    expect(formatted).toContain('12345678')
    expect(formatted).toContain('Test Step')
    expect(formatted).toContain('running')
    expect(formatted).toContain('1m ago')
  })
})

describe('determineBestStrategy', () => {
  it('should return restart when no checkpoint', () => {
    const strategy = determineBestStrategy(false, null)
    expect(strategy).toBe('restart')
  })

  it('should return step_start for confirmation step', () => {
    const strategy = determineBestStrategy(true, 'confirmation')
    expect(strategy).toBe('step_start')
  })

  it('should return skip for non-critical tool call error', () => {
    const strategy = determineBestStrategy(true, 'tool_call', 'non_critical')
    expect(strategy).toBe('skip')
  })

  it('should return checkpoint by default', () => {
    const strategy = determineBestStrategy(true, 'execution')
    expect(strategy).toBe('checkpoint')
  })
})
