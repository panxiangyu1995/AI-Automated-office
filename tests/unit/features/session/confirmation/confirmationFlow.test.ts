/**
 * Confirmation Flow Tests
 * Task 74: Story 46.3 - Confirmation Flow
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  ConfirmationFlowManager,
  createConfirmationFlowManager,
  createConfirmationOptions,
  isPositiveOutcome,
  isNegativeOutcome,
  type ConfirmationContext,
  type RiskAssessment,
  type PlanStep,
} from '../../../../../src/features/session/confirmation'

// ==================== Test Fixtures ====================

function createTestStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    id: 'step-1',
    name: 'Test Step',
    type: 'action',
    status: 'pending',
    order: 0,
    ...overrides,
  }
}

function createTestRiskAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    actionId: 'action-1',
    stepId: 'step-1',
    overallRisk: 'medium',
    sensitiveActions: [],
    requiresConfirmation: true,
    requiresApproval: false,
    blocked: false,
    recommendations: [],
    ...overrides,
  }
}

function createTestContext(): ConfirmationContext {
  return {
    sessionId: 'session-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
  }
}

// ==================== ConfirmationFlowManager Tests ====================

describe('ConfirmationFlowManager', () => {
  let manager: ConfirmationFlowManager

  beforeEach(() => {
    manager = createConfirmationFlowManager({
      defaultTimeout: 1000, // Short timeout for tests
    })
  })

  afterEach(() => {
    manager.clearAll()
  })

  describe('createRequest', () => {
    it('should create a confirmation request', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)

      expect(request.id).toBeDefined()
      expect(request.stepId).toBe('step-1')
      expect(request.sessionId).toBe('session-1')
      expect(request.message).toBeDefined()
      expect(request.options.length).toBeGreaterThan(0)
    })

    it('should create request with appropriate options for critical risk', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment({ overallRisk: 'critical' })
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)

      // Critical risk should have escalate option
      expect(request.options.some(o => o.id === 'escalate')).toBe(true)
    })

    it('should create request with appropriate options for high risk', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment({ overallRisk: 'high' })
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)

      // High risk options should require reason
      expect(request.options.some(o => o.requiresReason)).toBe(true)
    })

    it('should store pending request', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)

      expect(manager.getPendingRequest(request.id)).toBeDefined()
    })

    it('should call onConfirmationRequired callback', () => {
      const callback = vi.fn()
      const customManager = createConfirmationFlowManager({
        onConfirmationRequired: callback,
      })

      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      customManager.createRequest(step, assessment, context)

      expect(callback).toHaveBeenCalled()
    })

    it('should set expiresAt based on timeout', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)

      expect(request.expiresAt).toBeDefined()
      expect(request.expiresAt! - request.createdAt).toBe(1000)
    })
  })

  describe('submitDecision', () => {
    it('should submit approved decision', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      const result = manager.submitDecision(request.id, 'approved')

      expect(result.status).toBe('approved')
      expect(result.resumedExecution).toBe(true)
      expect(result.executionOutcome).toBe('continued')
    })

    it('should submit rejected decision', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      const result = manager.submitDecision(request.id, 'rejected', {
        reason: 'Not authorized',
      })

      expect(result.status).toBe('rejected')
      expect(result.resumedExecution).toBe(false)
      expect(result.executionOutcome).toBe('terminated')
      expect(result.decision?.reason).toBe('Not authorized')
    })

    it('should submit cancelled decision', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      const result = manager.submitDecision(request.id, 'cancelled')

      expect(result.status).toBe('cancelled')
      expect(result.resumedExecution).toBe(false)
      expect(result.executionOutcome).toBe('terminated')
    })

    it('should remove request from pending after decision', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      manager.submitDecision(request.id, 'approved')

      expect(manager.getPendingRequest(request.id)).toBeUndefined()
    })

    it('should call onConfirmationDecided callback', () => {
      const callback = vi.fn()
      const customManager = createConfirmationFlowManager({
        defaultTimeout: 1000,
        onConfirmationDecided: callback,
      })

      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = customManager.createRequest(step, assessment, context)
      customManager.submitDecision(request.id, 'approved')

      expect(callback).toHaveBeenCalled()
    })

    it('should return error result for unknown request', () => {
      const result = manager.submitDecision('unknown-id', 'approved')

      expect(result.status).toBe('error')
      expect(result.error).toBe('Request not found')
    })
  })

  describe('cancelRequest', () => {
    it('should cancel a pending request', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      const result = manager.cancelRequest(request.id, 'User cancelled')

      expect(result?.status).toBe('cancelled')
      expect(result?.decision?.reason).toBe('User cancelled')
    })

    it('should return null for unknown request', () => {
      const result = manager.cancelRequest('unknown-id')
      
      expect(result).toBeNull()
    })
  })

  describe('shouldAutoApprove', () => {
    it('should return false when disabled', () => {
      const disabledManager = createConfirmationFlowManager({
        enabled: false,
        autoApproveLowRisk: true,
      })

      const assessment = createTestRiskAssessment({ overallRisk: 'low' })
      
      expect(disabledManager.shouldAutoApprove(assessment)).toBe(false)
    })

    it('should return false when autoApproveLowRisk is false', () => {
      const noAutoManager = createConfirmationFlowManager({
        autoApproveLowRisk: false,
      })

      const assessment = createTestRiskAssessment({ overallRisk: 'low' })
      
      expect(noAutoManager.shouldAutoApprove(assessment)).toBe(false)
    })

    it('should return true for low risk when autoApproveLowRisk is true', () => {
      const autoManager = createConfirmationFlowManager({
        autoApproveLowRisk: true,
      })

      const assessment = createTestRiskAssessment({ overallRisk: 'low' })
      
      expect(autoManager.shouldAutoApprove(assessment)).toBe(true)
    })

    it('should return false for medium risk even with autoApproveLowRisk', () => {
      const autoManager = createConfirmationFlowManager({
        autoApproveLowRisk: true,
      })

      const assessment = createTestRiskAssessment({ overallRisk: 'medium' })
      
      expect(autoManager.shouldAutoApprove(assessment)).toBe(false)
    })

    it('should return false when requiresApproval is true', () => {
      const autoManager = createConfirmationFlowManager({
        autoApproveLowRisk: true,
      })

      const assessment = createTestRiskAssessment({
        overallRisk: 'low',
        requiresApproval: true,
      })
      
      expect(autoManager.shouldAutoApprove(assessment)).toBe(false)
    })
  })

  describe('query methods', () => {
    it('should get all pending requests', () => {
      const step1 = createTestStep({ id: 'step-1' })
      const step2 = createTestStep({ id: 'step-2' })
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      manager.createRequest(step1, assessment, context)
      manager.createRequest(step2, assessment, context)

      const pending = manager.getAllPendingRequests()
      
      expect(pending.length).toBe(2)
    })

    it('should get pending requests by session', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context1 = createTestContext()
      const context2 = { ...createTestContext(), sessionId: 'session-2' }

      manager.createRequest(step, assessment, context1)
      manager.createRequest(step, assessment, context2)

      const session1Requests = manager.getPendingRequestsBySession('session-1')
      
      expect(session1Requests.length).toBe(1)
      expect(session1Requests[0].sessionId).toBe('session-1')
    })

    it('should check if step has pending request', () => {
      const step = createTestStep({ id: 'step-1' })
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      manager.createRequest(step, assessment, context)

      expect(manager.hasPendingRequestForStep('step-1')).toBe(true)
      expect(manager.hasPendingRequestForStep('step-2')).toBe(false)
    })

    it('should get decision by request ID', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      manager.submitDecision(request.id, 'approved')

      const decision = manager.getDecision(request.id)
      
      expect(decision?.outcome).toBe('approved')
    })

    it('should get all results', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = manager.createRequest(step, assessment, context)
      manager.submitDecision(request.id, 'approved')

      const results = manager.getResults()
      
      expect(results.length).toBe(1)
      expect(results[0].status).toBe('approved')
    })
  })

  describe('timeout handling', () => {
    it('should timeout pending request', async () => {
      vi.useFakeTimers()
      
      const callback = vi.fn()
      const timeoutManager = createConfirmationFlowManager({
        defaultTimeout: 100,
        onTimeout: callback,
      })

      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request = timeoutManager.createRequest(step, assessment, context)
      
      // Advance time past timeout
      vi.advanceTimersByTime(150)
      
      expect(callback).toHaveBeenCalled()
      
      vi.useRealTimers()
    })
  })

  describe('statistics', () => {
    it('should return correct statistics', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      const request1 = manager.createRequest(step, assessment, context)
      const request2 = manager.createRequest(step, assessment, context)

      manager.submitDecision(request1.id, 'approved')
      manager.submitDecision(request2.id, 'rejected')

      const stats = manager.getStatistics()

      expect(stats.totalRequests).toBe(2)
      expect(stats.approvedCount).toBe(1)
      expect(stats.rejectedCount).toBe(1)
      expect(stats.pendingCount).toBe(0)
    })
  })

  describe('clearAll', () => {
    it('should clear all pending requests', () => {
      const step = createTestStep()
      const assessment = createTestRiskAssessment()
      const context = createTestContext()

      manager.createRequest(step, assessment, context)
      manager.createRequest(step, assessment, context)

      manager.clearAll()

      expect(manager.getAllPendingRequests()).toHaveLength(0)
    })
  })
})

// ==================== Helper Functions Tests ====================

describe('Helper Functions', () => {
  describe('createConfirmationOptions', () => {
    it('should create default options', () => {
      const options = createConfirmationOptions()
      
      expect(options.length).toBeGreaterThan(0)
      expect(options.some(o => o.id === 'approve')).toBe(true)
      expect(options.some(o => o.id === 'reject')).toBe(true)
      expect(options.some(o => o.id === 'cancel')).toBe(true)
    })

    it('should require reason for all options when includeReason is true', () => {
      const options = createConfirmationOptions(true)
      
      expect(options.every(o => o.requiresReason)).toBe(true)
    })
  })

  describe('isPositiveOutcome', () => {
    it('should return true for approved', () => {
      expect(isPositiveOutcome('approved')).toBe(true)
    })

    it('should return false for rejected', () => {
      expect(isPositiveOutcome('rejected')).toBe(false)
    })

    it('should return false for cancelled', () => {
      expect(isPositiveOutcome('cancelled')).toBe(false)
    })

    it('should return false for timeout', () => {
      expect(isPositiveOutcome('timeout')).toBe(false)
    })
  })

  describe('isNegativeOutcome', () => {
    it('should return false for approved', () => {
      expect(isNegativeOutcome('approved')).toBe(false)
    })

    it('should return true for rejected', () => {
      expect(isNegativeOutcome('rejected')).toBe(true)
    })

    it('should return true for cancelled', () => {
      expect(isNegativeOutcome('cancelled')).toBe(true)
    })

    it('should return true for timeout', () => {
      expect(isNegativeOutcome('timeout')).toBe(true)
    })
  })
})
