/**
 * Sensitive Action Detection - High-Risk Action Detection for Runtime Control
 * Task 73: Story 46.2 - Sensitive Action Detection
 * 
 * This module detects high-risk actions that require additional runtime control.
 */

import type { PlanStep } from '../planner/structuredPlanner'

// ==================== Sensitive Action Types ====================

/**
 * Risk level for actions
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Action sensitivity category
 */
export type SensitivityCategory =
  | 'data_deletion'      // Delete operations
  | 'data_modification'  // Modify existing data
  | 'data_export'        // Export sensitive data
  | 'permission_change'  // Change permissions
  | 'system_config'      // System configuration
  | 'financial'          // Financial operations
  | 'authentication'     // Auth-related operations
  | 'integration'        // External integrations
  | 'bulk_operation'     // Bulk/batch operations
  | 'pii_access'         // Access to PII data

/**
 * Sensitive action rule
 */
export interface SensitiveActionRule {
  id: string
  name: string
  description: string
  category: SensitivityCategory
  riskLevel: RiskLevel
  conditions: RuleCondition[]
  requiresConfirmation: boolean
  requiresApproval: boolean
  approvalWorkflow?: string
  auditLevel: 'standard' | 'enhanced' | 'full'
}

/**
 * Rule condition
 */
export interface RuleCondition {
  type: 'tool_id' | 'tool_category' | 'field_name' | 'resource_type' | 'action_type' | 'custom'
  operator: 'equals' | 'contains' | 'matches' | 'in' | 'not_in'
  value: string | string[] | RegExp
}

/**
 * Detected sensitive action
 */
export interface DetectedSensitiveAction {
  id: string
  stepId: string
  ruleId: string
  category: SensitivityCategory
  riskLevel: RiskLevel
  requiresConfirmation: boolean
  requiresApproval: boolean
  approvalWorkflow?: string
  matchedConditions: RuleCondition[]
  metadata: Record<string, unknown>
  timestamp: number
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  actionId: string
  stepId: string
  overallRisk: RiskLevel
  sensitiveActions: DetectedSensitiveAction[]
  requiresConfirmation: boolean
  requiresApproval: boolean
  blocked: boolean
  blockReason?: string
  recommendations: string[]
}

/**
 * Sensitive action detection config
 */
export interface SensitiveActionConfig {
  enabled: boolean
  blockCritical: boolean
  autoConfirmLow: boolean
  auditAll: boolean
  customRules: SensitiveActionRule[]
  onDetection?: (action: DetectedSensitiveAction) => void
  onBlock?: (assessment: RiskAssessment) => void
}

// ==================== Default Rules ====================

/**
 * Default sensitive action rules
 */
const DEFAULT_RULES: SensitiveActionRule[] = [
  {
    id: 'rule-delete-data',
    name: 'Data Deletion',
    description: 'Any operation that deletes data',
    category: 'data_deletion',
    riskLevel: 'high',
    conditions: [
      { type: 'action_type', operator: 'contains', value: 'delete' },
      { type: 'action_type', operator: 'contains', value: 'remove' },
      { type: 'tool_id', operator: 'contains', value: '_delete' },
    ],
    requiresConfirmation: true,
    requiresApproval: false,
    auditLevel: 'enhanced',
  },
  {
    id: 'rule-bulk-operation',
    name: 'Bulk Operation',
    description: 'Operations affecting multiple records',
    category: 'bulk_operation',
    riskLevel: 'medium',
    conditions: [
      { type: 'field_name', operator: 'in', value: ['batch', 'bulk', 'ids', 'all'] },
    ],
    requiresConfirmation: true,
    requiresApproval: false,
    auditLevel: 'enhanced',
  },
  {
    id: 'rule-permission-change',
    name: 'Permission Change',
    description: 'Operations that modify permissions',
    category: 'permission_change',
    riskLevel: 'critical',
    conditions: [
      { type: 'resource_type', operator: 'in', value: ['permission', 'role', 'access'] },
      { type: 'action_type', operator: 'in', value: ['assign', 'revoke', 'grant'] },
    ],
    requiresConfirmation: true,
    requiresApproval: true,
    approvalWorkflow: 'permission_change',
    auditLevel: 'full',
  },
  {
    id: 'rule-financial',
    name: 'Financial Operation',
    description: 'Financial transactions and reports',
    category: 'financial',
    riskLevel: 'high',
    conditions: [
      { type: 'tool_category', operator: 'in', value: ['finance', 'billing', 'payment'] },
      { type: 'resource_type', operator: 'in', value: ['invoice', 'payment', 'transaction'] },
    ],
    requiresConfirmation: true,
    requiresApproval: true,
    approvalWorkflow: 'financial',
    auditLevel: 'full',
  },
  {
    id: 'rule-auth-operation',
    name: 'Authentication Operation',
    description: 'Authentication related operations',
    category: 'authentication',
    riskLevel: 'critical',
    conditions: [
      { type: 'tool_id', operator: 'contains', value: 'auth_' },
      { type: 'action_type', operator: 'in', value: ['login', 'logout', 'reset_password', 'mfa'] },
    ],
    requiresConfirmation: true,
    requiresApproval: false,
    auditLevel: 'full',
  },
  {
    id: 'rule-system-config',
    name: 'System Configuration',
    description: 'System-level configuration changes',
    category: 'system_config',
    riskLevel: 'high',
    conditions: [
      { type: 'resource_type', operator: 'in', value: ['config', 'setting', 'system'] },
    ],
    requiresConfirmation: true,
    requiresApproval: true,
    approvalWorkflow: 'admin_approval',
    auditLevel: 'full',
  },
  {
    id: 'rule-pii-access',
    name: 'PII Access',
    description: 'Access to personally identifiable information',
    category: 'pii_access',
    riskLevel: 'high',
    conditions: [
      { type: 'field_name', operator: 'in', value: ['ssn', 'id_card', 'passport', 'bank_account', 'credit_card'] },
      { type: 'resource_type', operator: 'in', value: ['employee', 'user', 'customer'] },
    ],
    requiresConfirmation: false,
    requiresApproval: false,
    auditLevel: 'full',
  },
  {
    id: 'rule-data-export',
    name: 'Data Export',
    description: 'Export of data to external systems',
    category: 'data_export',
    riskLevel: 'medium',
    conditions: [
      { type: 'action_type', operator: 'in', value: ['export', 'download', 'extract'] },
    ],
    requiresConfirmation: true,
    requiresApproval: false,
    auditLevel: 'enhanced',
  },
]

// ==================== Sensitive Action Detector ====================

/**
 * Sensitive Action Detector
 * 
 * Detects high-risk actions that require additional runtime control.
 */
export class SensitiveActionDetector {
  private config: SensitiveActionConfig
  private rules: SensitiveActionRule[]
  private detections: DetectedSensitiveAction[] = []

  constructor(config: Partial<SensitiveActionConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      blockCritical: config.blockCritical ?? true,
      autoConfirmLow: config.autoConfirmLow ?? false,
      auditAll: config.auditAll ?? true,
      customRules: config.customRules ?? [],
      onDetection: config.onDetection,
      onBlock: config.onBlock,
    }

    // Merge default rules with custom rules
    this.rules = [...DEFAULT_RULES, ...this.config.customRules]
  }

  // ==================== Detection ====================

  /**
   * Analyze a step for sensitive actions
   */
  analyzeStep(step: PlanStep, context?: Record<string, unknown>): DetectedSensitiveAction[] {
    if (!this.config.enabled) {
      return []
    }

    const detections: DetectedSensitiveAction[] = []

    for (const rule of this.rules) {
      const matchedConditions = this.matchConditions(rule, step, context)
      
      if (matchedConditions.length > 0) {
        const detection: DetectedSensitiveAction = {
          id: this.generateDetectionId(),
          stepId: step.id,
          ruleId: rule.id,
          category: rule.category,
          riskLevel: rule.riskLevel,
          requiresConfirmation: rule.requiresConfirmation,
          requiresApproval: rule.requiresApproval,
          approvalWorkflow: rule.approvalWorkflow,
          matchedConditions,
          metadata: context ?? {},
          timestamp: Date.now(),
        }

        detections.push(detection)
        this.detections.push(detection)

        // Notify callback
        this.config.onDetection?.(detection)
      }
    }

    return detections
  }

  /**
   * Assess risk for a step
   */
  assessRisk(step: PlanStep, context?: Record<string, unknown>): RiskAssessment {
    const detections = this.analyzeStep(step, context)
    
    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(detections)
    
    // Determine if confirmation or approval required
    const requiresConfirmation = detections.some(d => d.requiresConfirmation)
    const requiresApproval = detections.some(d => d.requiresApproval)
    
    // Determine if blocked
    let blocked = false
    let blockReason: string | undefined
    
    if (this.config.blockCritical && overallRisk === 'critical') {
      blocked = true
      blockReason = 'Critical risk action requires approval workflow'
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(detections)

    const assessment: RiskAssessment = {
      actionId: this.generateDetectionId(),
      stepId: step.id,
      overallRisk,
      sensitiveActions: detections,
      requiresConfirmation,
      requiresApproval,
      blocked,
      blockReason,
      recommendations,
    }

    // Notify block callback if blocked
    if (blocked) {
      this.config.onBlock?.(assessment)
    }

    return assessment
  }

  /**
   * Match rule conditions against step
   */
  private matchConditions(
    rule: SensitiveActionRule,
    step: PlanStep,
    context?: Record<string, unknown>
  ): RuleCondition[] {
    const matched: RuleCondition[] = []

    for (const condition of rule.conditions) {
      if (this.evaluateCondition(condition, step, context)) {
        matched.push(condition)
      }
    }

    return matched
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: RuleCondition,
    step: PlanStep,
    context?: Record<string, unknown>
  ): boolean {
    let value: string | string[] | undefined

    // Get value based on condition type
    switch (condition.type) {
      case 'tool_id':
        value = step.toolRequirement?.toolId
        break
      case 'tool_category':
        value = (context?.toolCategory as string) ?? step.toolRequirement?.category
        break
      case 'field_name':
        value = Object.keys(step.toolRequirement?.parameters ?? {})
        break
      case 'resource_type':
        value = (context?.resourceType as string) ?? (step as unknown as { resourceType?: string }).resourceType
        break
      case 'action_type':
        value = step.type
        break
      case 'custom':
        value = (context?.[condition.value as string] as string) ?? ''
        break
    }

    if (!value) return false

    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
        return Array.isArray(value)
          ? value.some(v => v === condition.value)
          : value === condition.value
        
      case 'contains':
        const searchValue = Array.isArray(condition.value) ? condition.value[0] : condition.value
        return Array.isArray(value)
          ? value.some(v => v.includes(searchValue as string))
          : value.includes(searchValue as string)
        
      case 'matches':
        const pattern = condition.value instanceof RegExp
          ? condition.value
          : new RegExp(condition.value as string)
        return Array.isArray(value)
          ? value.some(v => pattern.test(v))
          : pattern.test(value)
        
      case 'in':
        const values = Array.isArray(condition.value) ? condition.value : [condition.value]
        return Array.isArray(value)
          ? value.some(v => values.includes(v))
          : values.includes(value)
        
      case 'not_in':
        const notValues = Array.isArray(condition.value) ? condition.value : [condition.value]
        return Array.isArray(value)
          ? !value.some(v => notValues.includes(v))
          : !notValues.includes(value)
        
      default:
        return false
    }
  }

  // ==================== Risk Calculation ====================

  /**
   * Calculate overall risk from detections
   */
  private calculateOverallRisk(detections: DetectedSensitiveAction[]): RiskLevel {
    if (detections.length === 0) return 'low'

    const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical']
    let maxRiskIndex = 0

    for (const detection of detections) {
      const index = riskLevels.indexOf(detection.riskLevel)
      if (index > maxRiskIndex) {
        maxRiskIndex = index
      }
    }

    return riskLevels[maxRiskIndex]
  }

  /**
   * Generate recommendations based on detections
   */
  private generateRecommendations(detections: DetectedSensitiveAction[]): string[] {
    const recommendations: string[] = []

    for (const detection of detections) {
      switch (detection.category) {
        case 'data_deletion':
          recommendations.push('Consider backing up data before deletion')
          break
        case 'bulk_operation':
          recommendations.push('Review the list of affected items before proceeding')
          break
        case 'permission_change':
          recommendations.push('Verify the permission change with the affected user')
          break
        case 'financial':
          recommendations.push('Ensure proper authorization for financial operations')
          break
        case 'pii_access':
          recommendations.push('Ensure compliance with data privacy regulations')
          break
        case 'system_config':
          recommendations.push('Document configuration changes for audit trail')
          break
      }
    }

    return [...new Set(recommendations)]
  }

  // ==================== ID Generation ====================

  /**
   * Generate unique detection ID
   */
  private generateDetectionId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return `sensitive_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
  }

  // ==================== Getters ====================

  /**
   * Get all detections
   */
  getDetections(): DetectedSensitiveAction[] {
    return [...this.detections]
  }

  /**
   * Get detections by category
   */
  getDetectionsByCategory(category: SensitivityCategory): DetectedSensitiveAction[] {
    return this.detections.filter(d => d.category === category)
  }

  /**
   * Get detections by risk level
   */
  getDetectionsByRiskLevel(level: RiskLevel): DetectedSensitiveAction[] {
    return this.detections.filter(d => d.riskLevel === level)
  }

  /**
   * Get all rules
   */
  getRules(): SensitiveActionRule[] {
    return [...this.rules]
  }

  /**
   * Add custom rule
   */
  addRule(rule: SensitiveActionRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index >= 0) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Clear all detections
   */
  clearDetections(): void {
    this.detections = []
  }

  /**
   * Check if detector is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Enable/disable detector
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }
}

// ==================== Factory Function ====================

/**
 * Create a sensitive action detector
 */
export function createSensitiveActionDetector(
  config?: Partial<SensitiveActionConfig>
): SensitiveActionDetector {
  return new SensitiveActionDetector(config)
}

// ==================== Helper Functions ====================

/**
 * Check if action is sensitive
 */
export function isSensitiveAction(step: PlanStep): boolean {
  const detector = new SensitiveActionDetector()
  const detections = detector.analyzeStep(step)
  return detections.length > 0
}

/**
 * Get risk level for action
 */
export function getActionRiskLevel(step: PlanStep): RiskLevel {
  const detector = new SensitiveActionDetector()
  const assessment = detector.assessRisk(step)
  return assessment.overallRisk
}

/**
 * Check if action requires confirmation
 */
export function requiresConfirmation(step: PlanStep): boolean {
  const detector = new SensitiveActionDetector()
  const assessment = detector.assessRisk(step)
  return assessment.requiresConfirmation
}

/**
 * Check if action requires approval
 */
export function requiresApproval(step: PlanStep): boolean {
  const detector = new SensitiveActionDetector()
  const assessment = detector.assessRisk(step)
  return assessment.requiresApproval
}
