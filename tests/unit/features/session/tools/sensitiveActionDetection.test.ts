/**
 * Sensitive Action Detection Tests
 * Task 73: Story 46.2 - Sensitive Action Detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SensitiveActionDetector,
  createSensitiveActionDetector,
  isSensitiveAction,
  getActionRiskLevel,
  requiresConfirmation,
  requiresApproval,
  type SensitiveActionRule,
  type PlanStep,
} from '../../../../../src/features/session/tools/sensitiveActionDetection'

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

// ==================== SensitiveActionDetector Tests ====================

describe('SensitiveActionDetector', () => {
  let detector: SensitiveActionDetector

  beforeEach(() => {
    detector = createSensitiveActionDetector()
  })

  describe('analyzeStep', () => {
    it('should return empty array when disabled', () => {
      const disabledDetector = createSensitiveActionDetector({ enabled: false })
      const step = createTestStep({ type: 'delete' })
      
      const detections = disabledDetector.analyzeStep(step)
      
      expect(detections).toHaveLength(0)
    })

    it('should detect delete operations', () => {
      const step = createTestStep({ type: 'delete' })
      
      const detections = detector.analyzeStep(step)
      
      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0].category).toBe('data_deletion')
    })

    it('should detect tool_id containing _delete', () => {
      const step = createTestStep({ toolId: 'user_delete' })
      
      const detections = detector.analyzeStep(step)
      
      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0].category).toBe('data_deletion')
    })

    it('should detect bulk operations via field names', () => {
      const step = createTestStep({ parameters: { ids: [1, 2, 3] } })
      
      const detections = detector.analyzeStep(step)
      
      expect(detections.some(d => d.category === 'bulk_operation')).toBe(true)
    })

    it('should detect permission changes', () => {
      const step = createTestStep({ 
        type: 'assign',
      })
      const context = { resourceType: 'permission' }
      
      const detections = detector.analyzeStep(step, context)
      
      expect(detections.some(d => d.category === 'permission_change')).toBe(true)
    })

    it('should detect financial operations', () => {
      const step = createTestStep({ toolId: 'process_payment' })
      const context = { toolCategory: 'finance' }
      
      const detections = detector.analyzeStep(step, context)
      
      expect(detections.some(d => d.category === 'financial')).toBe(true)
    })

    it('should detect auth operations', () => {
      const step = createTestStep({ toolId: 'auth_login' })
      
      const detections = detector.analyzeStep(step)
      
      expect(detections.some(d => d.category === 'authentication')).toBe(true)
    })

    it('should detect system config changes', () => {
      const step = createTestStep({ type: 'update' })
      const context = { resourceType: 'config' }
      
      const detections = detector.analyzeStep(step, context)
      
      expect(detections.some(d => d.category === 'system_config')).toBe(true)
    })

    it('should detect data export', () => {
      const step = createTestStep({ type: 'export' })
      
      const detections = detector.analyzeStep(step)
      
      expect(detections.some(d => d.category === 'data_export')).toBe(true)
    })

    it('should call onDetection callback', () => {
      const callback = vi.fn()
      const customDetector = createSensitiveActionDetector({ onDetection: callback })
      const step = createTestStep({ type: 'delete' })
      
      customDetector.analyzeStep(step)
      
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('assessRisk', () => {
    it('should return low risk for non-sensitive step', () => {
      const step = createTestStep({ type: 'read' })
      
      const assessment = detector.assessRisk(step)
      
      expect(assessment.overallRisk).toBe('low')
      expect(assessment.sensitiveActions).toHaveLength(0)
    })

    it('should return high risk for delete operations', () => {
      const step = createTestStep({ type: 'delete' })
      
      const assessment = detector.assessRisk(step)
      
      expect(assessment.overallRisk).toBe('high')
      expect(assessment.requiresConfirmation).toBe(true)
    })

    it('should return critical risk for permission changes', () => {
      const step = createTestStep({ type: 'assign' })
      const context = { resourceType: 'permission' }
      
      const assessment = detector.assessRisk(step, context)
      
      expect(assessment.overallRisk).toBe('critical')
      expect(assessment.requiresApproval).toBe(true)
      expect(assessment.requiresConfirmation).toBe(true)
    })

    it('should block critical actions when blockCritical is enabled', () => {
      const step = createTestStep({ type: 'assign' })
      const context = { resourceType: 'permission' }
      
      const assessment = detector.assessRisk(step, context)
      
      expect(assessment.blocked).toBe(true)
      expect(assessment.blockReason).toBeDefined()
    })

    it('should not block critical actions when blockCritical is disabled', () => {
      const noBlockDetector = createSensitiveActionDetector({ blockCritical: false })
      const step = createTestStep({ type: 'assign' })
      const context = { resourceType: 'permission' }
      
      const assessment = noBlockDetector.assessRisk(step, context)
      
      expect(assessment.blocked).toBe(false)
    })

    it('should generate recommendations', () => {
      const step = createTestStep({ type: 'delete' })
      
      const assessment = detector.assessRisk(step)
      
      expect(assessment.recommendations.length).toBeGreaterThan(0)
    })

    it('should call onBlock callback when action is blocked', () => {
      const callback = vi.fn()
      const blockDetector = createSensitiveActionDetector({ 
        blockCritical: true,
        onBlock: callback 
      })
      const step = createTestStep({ type: 'assign' })
      const context = { resourceType: 'permission' }
      
      blockDetector.assessRisk(step, context)
      
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('rules management', () => {
    it('should return all rules', () => {
      const rules = detector.getRules()
      
      expect(rules.length).toBeGreaterThan(0)
    })

    it('should add custom rule', () => {
      const customRule: SensitiveActionRule = {
        id: 'custom-rule',
        name: 'Custom Rule',
        description: 'A custom rule',
        category: 'data_modification',
        riskLevel: 'medium',
        conditions: [{ type: 'action_type', operator: 'equals', value: 'custom_action' }],
        requiresConfirmation: true,
        requiresApproval: false,
        auditLevel: 'standard',
      }

      detector.addRule(customRule)
      const rules = detector.getRules()

      expect(rules.some(r => r.id === 'custom-rule')).toBe(true)
    })

    it('should remove rule by ID', () => {
      const customRule: SensitiveActionRule = {
        id: 'custom-rule-2',
        name: 'Custom Rule 2',
        description: 'A custom rule',
        category: 'data_modification',
        riskLevel: 'medium',
        conditions: [{ type: 'action_type', operator: 'equals', value: 'custom_action' }],
        requiresConfirmation: true,
        requiresApproval: false,
        auditLevel: 'standard',
      }

      detector.addRule(customRule)
      const removed = detector.removeRule('custom-rule-2')

      expect(removed).toBe(true)
      expect(detector.getRules().some(r => r.id === 'custom-rule-2')).toBe(false)
    })

    it('should return false when removing non-existent rule', () => {
      const removed = detector.removeRule('non-existent-rule')
      
      expect(removed).toBe(false)
    })

    it('should include custom rules from config', () => {
      const customRule: SensitiveActionRule = {
        id: 'config-custom-rule',
        name: 'Config Custom Rule',
        description: 'A custom rule from config',
        category: 'integration',
        riskLevel: 'low',
        conditions: [{ type: 'action_type', operator: 'equals', value: 'integrate' }],
        requiresConfirmation: false,
        requiresApproval: false,
        auditLevel: 'standard',
      }

      const customDetector = createSensitiveActionDetector({ 
        customRules: [customRule] 
      })
      const rules = customDetector.getRules()

      expect(rules.some(r => r.id === 'config-custom-rule')).toBe(true)
    })
  })

  describe('detections management', () => {
    it('should store detections', () => {
      const step = createTestStep({ type: 'delete' })
      detector.analyzeStep(step)
      
      const detections = detector.getDetections()
      
      expect(detections.length).toBeGreaterThan(0)
    })

    it('should get detections by category', () => {
      const step = createTestStep({ type: 'delete' })
      detector.analyzeStep(step)
      
      const deletions = detector.getDetectionsByCategory('data_deletion')
      
      expect(deletions.length).toBeGreaterThan(0)
      expect(deletions.every(d => d.category === 'data_deletion')).toBe(true)
    })

    it('should get detections by risk level', () => {
      const step = createTestStep({ type: 'delete' })
      detector.analyzeStep(step)
      
      const highRisk = detector.getDetectionsByRiskLevel('high')
      
      expect(highRisk.length).toBeGreaterThan(0)
      expect(highRisk.every(d => d.riskLevel === 'high')).toBe(true)
    })

    it('should clear all detections', () => {
      const step = createTestStep({ type: 'delete' })
      detector.analyzeStep(step)
      
      detector.clearDetections()
      
      expect(detector.getDetections()).toHaveLength(0)
    })
  })

  describe('enabled state', () => {
    it('should check if enabled', () => {
      expect(detector.isEnabled()).toBe(true)
    })

    it('should enable/disable detector', () => {
      detector.setEnabled(false)
      expect(detector.isEnabled()).toBe(false)
      
      detector.setEnabled(true)
      expect(detector.isEnabled()).toBe(true)
    })
  })
})

// ==================== Helper Functions Tests ====================

describe('Helper Functions', () => {
  describe('isSensitiveAction', () => {
    it('should return true for sensitive action', () => {
      const step = createTestStep({ type: 'delete' })
      expect(isSensitiveAction(step)).toBe(true)
    })

    it('should return false for non-sensitive action', () => {
      const step = createTestStep({ type: 'read' })
      expect(isSensitiveAction(step)).toBe(false)
    })
  })

  describe('getActionRiskLevel', () => {
    it('should return correct risk level', () => {
      const deleteStep = createTestStep({ type: 'delete' })
      expect(getActionRiskLevel(deleteStep)).toBe('high')
      
      const readStep = createTestStep({ type: 'read' })
      expect(getActionRiskLevel(readStep)).toBe('low')
    })
  })

  describe('requiresConfirmation', () => {
    it('should return true for actions requiring confirmation', () => {
      const step = createTestStep({ type: 'delete' })
      expect(requiresConfirmation(step)).toBe(true)
    })

    it('should return false for actions not requiring confirmation', () => {
      const step = createTestStep({ type: 'read' })
      expect(requiresConfirmation(step)).toBe(false)
    })
  })

  describe('requiresApproval', () => {
    it('should return true for actions requiring approval', () => {
      const step = createTestStep({ type: 'assign' })
      const context = { resourceType: 'permission' }
      expect(requiresApproval(step, context)).toBe(true)
    })

    it('should return false for actions not requiring approval', () => {
      const step = createTestStep({ type: 'read' })
      expect(requiresApproval(step)).toBe(false)
    })
  })
})
