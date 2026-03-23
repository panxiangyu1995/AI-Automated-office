/**
 * Confirmation Flow - Human Confirmation for High-Risk Operations
 * Task 74: Story 46.3 - Confirmation Flow
 * 
 * This module manages human confirmation flow for high-risk or policy-gated runtime steps.
 */

import type { PlanStep } from '../planner/structuredPlanner'
import type { 
  DetectedSensitiveAction, 
  RiskAssessment, 
  RiskLevel 
} from '../tools/sensitiveActionDetection'

// ==================== Confirmation Types ====================

/**
 * Confirmation decision outcome
 */
export type ConfirmationOutcome = 'approved' | 'rejected' | 'cancelled' | 'timeout'

/**
 * Confirmation status
 */
export type ConfirmationStatus = 
  | 'pending'      // Waiting for user decision
  | 'processing'   // Processing decision
  | 'approved'     // User approved
  | 'rejected'     // User rejected
  | 'cancelled'    // User cancelled
  | 'timeout'      // Timeout expired
  | 'error'        // Error occurred

/**
 * Confirmation request
 */
export interface ConfirmationRequest {
  id: string
  stepId: string
  sessionId: string
  message: string
  details: ConfirmationDetails
  options: ConfirmationOption[]
  riskLevel: RiskLevel
  sensitiveActions: DetectedSensitiveAction[]
  timeout?: number
  createdAt: number
  expiresAt?: number
}

/**
 * Confirmation details
 */
export interface ConfirmationDetails {
  title: string
  description: string
  resourceType?: string
  resourceId?: string
  actionType?: string
  impact?: string
  affectedItems?: number
  additionalInfo?: Record<string, unknown>
}

/**
 * Confirmation option
 */
export interface ConfirmationOption {
  id: string
  label: string
  description?: string
  style: 'primary' | 'secondary' | 'danger' | 'warning'
  outcome: ConfirmationOutcome
  requiresReason?: boolean
}

/**
 * Confirmation decision
 */
export interface ConfirmationDecision {
  requestId: string
  outcome: ConfirmationOutcome
  selectedOption?: string
  reason?: string
  userId?: string
  timestamp: number
}

/**
 * Confirmation result
 */
export interface ConfirmationResult {
  request: ConfirmationRequest
  decision: ConfirmationDecision | null
  status: ConfirmationStatus
  resumedExecution: boolean
  executionOutcome?: 'continued' | 'terminated' | 'replanned'
  error?: string
}

/**
 * Confirmation flow config
 */
export interface ConfirmationFlowConfig {
  enabled: boolean
  defaultTimeout: number // milliseconds
  autoApproveLowRisk: boolean
  collectReasonOnReject: boolean
  auditDecisions: boolean
  onConfirmationRequired?: (request: ConfirmationRequest) => void
  onConfirmationDecided?: (result: ConfirmationResult) => void
  onTimeout?: (request: ConfirmationRequest) => void
}

/**
 * Confirmation context
 */
export interface ConfirmationContext {
  sessionId: string
  userId?: string
  tenantId?: string
  permissions?: string[]
  metadata?: Record<string, unknown>
}

// ==================== Default Options ====================

/**
 * Default confirmation options
 */
const DEFAULT_OPTIONS: ConfirmationOption[] = [
  {
    id: 'approve',
    label: 'Approve',
    description: 'Approve and continue execution',
    style: 'primary',
    outcome: 'approved',
  },
  {
    id: 'reject',
    label: 'Reject',
    description: 'Reject and stop execution',
    style: 'danger',
    outcome: 'rejected',
    requiresReason: true,
  },
  {
    id: 'cancel',
    label: 'Cancel',
    description: 'Cancel the operation',
    style: 'secondary',
    outcome: 'cancelled',
  },
]

/**
 * High risk options (more restrictive)
 */
const HIGH_RISK_OPTIONS: ConfirmationOption[] = [
  {
    id: 'approve',
    label: 'Approve',
    description: 'I understand the risks and want to proceed',
    style: 'warning',
    outcome: 'approved',
    requiresReason: true,
  },
  {
    id: 'reject',
    label: 'Reject',
    description: 'Do not proceed with this action',
    style: 'danger',
    outcome: 'rejected',
    requiresReason: true,
  },
]

/**
 * Critical risk options (most restrictive)
 */
const CRITICAL_RISK_OPTIONS: ConfirmationOption[] = [
  {
    id: 'approve_with_confirmation',
    label: 'Approve',
    description: 'This action requires manager approval',
    style: 'danger',
    outcome: 'approved',
    requiresReason: true,
  },
  {
    id: 'reject',
    label: 'Reject',
    description: 'Reject this action',
    style: 'danger',
    outcome: 'rejected',
    requiresReason: true,
  },
  {
    id: 'escalate',
    label: 'Escalate',
    description: 'Request additional approval',
    style: 'secondary',
    outcome: 'cancelled',
  },
]

// ==================== Confirmation Flow Manager ====================

/**
 * Confirmation Flow Manager
 * 
 * Manages human confirmation flow for high-risk operations.
 */
export class ConfirmationFlowManager {
  private config: ConfirmationFlowConfig
  private pendingRequests: Map<string, ConfirmationRequest> = new Map()
  private decisions: Map<string, ConfirmationDecision> = new Map()
  private results: ConfirmationResult[] = []
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(config: Partial<ConfirmationFlowConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      defaultTimeout: config.defaultTimeout ?? 300000, // 5 minutes
      autoApproveLowRisk: config.autoApproveLowRisk ?? false,
      collectReasonOnReject: config.collectReasonOnReject ?? true,
      auditDecisions: config.auditDecisions ?? true,
      onConfirmationRequired: config.onConfirmationRequired,
      onConfirmationDecided: config.onConfirmationDecided,
      onTimeout: config.onTimeout,
    }
  }

  // ==================== Request Management ====================

  /**
   * Create a confirmation request
   */
  createRequest(
    step: PlanStep,
    riskAssessment: RiskAssessment,
    context: ConfirmationContext
  ): ConfirmationRequest {
    const id = this.generateRequestId()
    const now = Date.now()
    const timeout = this.config.defaultTimeout

    // Determine options based on risk level
    const options = this.getOptionsForRiskLevel(riskAssessment.overallRisk)

    // Build details
    const details = this.buildDetails(step, riskAssessment)

    // Build message
    const message = this.buildMessage(step, riskAssessment)

    const request: ConfirmationRequest = {
      id,
      stepId: step.id,
      sessionId: context.sessionId,
      message,
      details,
      options,
      riskLevel: riskAssessment.overallRisk,
      sensitiveActions: riskAssessment.sensitiveActions,
      timeout,
      createdAt: now,
      expiresAt: timeout ? now + timeout : undefined,
    }

    // Store request
    this.pendingRequests.set(id, request)

    // Set up timeout
    if (timeout) {
      this.setupTimeout(id, timeout)
    }

    // Notify callback
    this.config.onConfirmationRequired?.(request)

    return request
  }

  /**
   * Submit a decision for a pending request
   */
  submitDecision(
    requestId: string,
    outcome: ConfirmationOutcome,
    options?: { selectedOption?: string; reason?: string; userId?: string }
  ): ConfirmationResult {
    const request = this.pendingRequests.get(requestId)
    
    if (!request) {
      return {
        request: null as unknown as ConfirmationRequest,
        decision: null,
        status: 'error',
        resumedExecution: false,
        error: 'Request not found',
      }
    }

    // Clear timeout
    this.clearTimeout(requestId)

    // Create decision
    const decision: ConfirmationDecision = {
      requestId,
      outcome,
      selectedOption: options?.selectedOption,
      reason: options?.reason,
      userId: options?.userId,
      timestamp: Date.now(),
    }

    // Store decision
    this.decisions.set(requestId, decision)

    // Remove from pending
    this.pendingRequests.delete(requestId)

    // Determine status and execution outcome
    const status = this.outcomeToStatus(outcome)
    const executionOutcome = this.determineExecutionOutcome(outcome)

    // Create result
    const result: ConfirmationResult = {
      request,
      decision,
      status,
      resumedExecution: outcome === 'approved',
      executionOutcome,
    }

    // Store result
    this.results.push(result)

    // Notify callback
    this.config.onConfirmationDecided?.(result)

    return result
  }

  /**
   * Cancel a pending request
   */
  cancelRequest(requestId: string, reason?: string): ConfirmationResult | null {
    const request = this.pendingRequests.get(requestId)
    
    if (!request) {
      return null
    }

    return this.submitDecision(requestId, 'cancelled', { reason })
  }

  /**
   * Check if auto-approval is applicable
   */
  shouldAutoApprove(riskAssessment: RiskAssessment): boolean {
    if (!this.config.enabled || !this.config.autoApproveLowRisk) {
      return false
    }

    return riskAssessment.overallRisk === 'low' && 
           !riskAssessment.requiresApproval &&
           !riskAssessment.blocked
  }

  // ==================== Request Query ====================

  /**
   * Get pending request by ID
   */
  getPendingRequest(requestId: string): ConfirmationRequest | undefined {
    return this.pendingRequests.get(requestId)
  }

  /**
   * Get all pending requests
   */
  getAllPendingRequests(): ConfirmationRequest[] {
    return Array.from(this.pendingRequests.values())
  }

  /**
   * Get pending requests by session
   */
  getPendingRequestsBySession(sessionId: string): ConfirmationRequest[] {
    return this.getAllPendingRequests().filter(r => r.sessionId === sessionId)
  }

  /**
   * Get decision by request ID
   */
  getDecision(requestId: string): ConfirmationDecision | undefined {
    return this.decisions.get(requestId)
  }

  /**
   * Get all results
   */
  getResults(): ConfirmationResult[] {
    return [...this.results]
  }

  /**
   * Check if there's a pending request for a step
   */
  hasPendingRequestForStep(stepId: string): boolean {
    return this.getAllPendingRequests().some(r => r.stepId === stepId)
  }

  // ==================== Timeout Management ====================

  /**
   * Set up timeout for a request
   */
  private setupTimeout(requestId: string, timeout: number): void {
    const timer = setTimeout(() => {
      this.handleTimeout(requestId)
    }, timeout)
    
    this.timeoutTimers.set(requestId, timer)
  }

  /**
   * Clear timeout for a request
   */
  private clearTimeout(requestId: string): void {
    const timer = this.timeoutTimers.get(requestId)
    if (timer) {
      clearTimeout(timer)
      this.timeoutTimers.delete(requestId)
    }
  }

  /**
   * Handle timeout
   */
  private handleTimeout(requestId: string): void {
    const request = this.pendingRequests.get(requestId)
    
    if (request) {
      // Notify callback
      this.config.onTimeout?.(request)

      // Submit timeout decision
      this.submitDecision(requestId, 'timeout')
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Get options for risk level
   */
  private getOptionsForRiskLevel(level: RiskLevel): ConfirmationOption[] {
    switch (level) {
      case 'critical':
        return CRITICAL_RISK_OPTIONS
      case 'high':
        return HIGH_RISK_OPTIONS
      default:
        return DEFAULT_OPTIONS
    }
  }

  /**
   * Build confirmation details
   */
  private buildDetails(step: PlanStep, assessment: RiskAssessment): ConfirmationDetails {
    const firstAction = assessment.sensitiveActions[0]
    
    return {
      title: this.getTitleForAction(firstAction),
      description: step.name ?? 'This action requires confirmation',
      actionType: step.type,
      impact: this.getImpactDescription(assessment),
      affectedItems: this.estimateAffectedItems(step),
      additionalInfo: {
        riskLevel: assessment.overallRisk,
        sensitiveCategories: assessment.sensitiveActions.map(a => a.category),
      },
    }
  }

  /**
   * Build confirmation message
   */
  private buildMessage(step: PlanStep, assessment: RiskAssessment): string {
    const riskMessages: Record<RiskLevel, string> = {
      low: 'This action requires your confirmation.',
      medium: 'This action may have significant effects. Please review before proceeding.',
      high: '⚠️ This is a high-risk action. Please review carefully before proceeding.',
      critical: '🚨 This is a critical action that may have irreversible effects.',
    }

    return riskMessages[assessment.overallRisk] ?? riskMessages.medium
  }

  /**
   * Get title for action
   */
  private getTitleForAction(action: DetectedSensitiveAction | undefined): string {
    if (!action) return 'Confirm Action'

    const titles: Record<string, string> = {
      data_deletion: 'Confirm Data Deletion',
      data_modification: 'Confirm Data Modification',
      data_export: 'Confirm Data Export',
      permission_change: 'Confirm Permission Change',
      system_config: 'Confirm System Configuration',
      financial: 'Confirm Financial Operation',
      authentication: 'Confirm Authentication Operation',
      integration: 'Confirm Integration',
      bulk_operation: 'Confirm Bulk Operation',
      pii_access: 'Confirm PII Access',
    }

    return titles[action.category] ?? 'Confirm Action'
  }

  /**
   * Get impact description
   */
  private getImpactDescription(assessment: RiskAssessment): string {
    const impacts: string[] = []

    for (const action of assessment.sensitiveActions) {
      switch (action.category) {
        case 'data_deletion':
          impacts.push('Data will be permanently deleted')
          break
        case 'bulk_operation':
          impacts.push('Multiple items will be affected')
          break
        case 'permission_change':
          impacts.push('User permissions will be modified')
          break
        case 'financial':
          impacts.push('Financial records will be affected')
          break
        case 'system_config':
          impacts.push('System settings will be changed')
          break
        case 'pii_access':
          impacts.push('Personal information will be accessed')
          break
      }
    }

    return [...new Set(impacts)].join('. ') || 'This action may affect your data.'
  }

  /**
   * Estimate affected items
   */
  private estimateAffectedItems(step: PlanStep): number | undefined {
    const params = step.parameters as Record<string, unknown> | undefined
    
    if (params?.ids && Array.isArray(params.ids)) {
      return params.ids.length
    }
    
    if (params?.batch === true || params?.bulk === true) {
      return -1 // Indicates multiple but unknown count
    }
    
    return undefined
  }

  /**
   * Convert outcome to status
   */
  private outcomeToStatus(outcome: ConfirmationOutcome): ConfirmationStatus {
    return outcome // They have the same values
  }

  /**
   * Determine execution outcome
   */
  private determineExecutionOutcome(outcome: ConfirmationOutcome): 'continued' | 'terminated' | 'replanned' {
    switch (outcome) {
      case 'approved':
        return 'continued'
      case 'rejected':
      case 'cancelled':
      case 'timeout':
        return 'terminated'
      default:
        return 'terminated'
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return `confirm_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
  }

  // ==================== Cleanup ====================

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    // Clear all timeouts
    for (const requestId of this.timeoutTimers.keys()) {
      this.clearTimeout(requestId)
    }

    this.pendingRequests.clear()
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRequests: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    cancelledCount: number
    timeoutCount: number
  } {
    const results = this.results
    
    return {
      totalRequests: results.length,
      pendingCount: this.pendingRequests.size,
      approvedCount: results.filter(r => r.status === 'approved').length,
      rejectedCount: results.filter(r => r.status === 'rejected').length,
      cancelledCount: results.filter(r => r.status === 'cancelled').length,
      timeoutCount: results.filter(r => r.status === 'timeout').length,
    }
  }
}

// ==================== Factory Function ====================

/**
 * Create a confirmation flow manager
 */
export function createConfirmationFlowManager(
  config?: Partial<ConfirmationFlowConfig>
): ConfirmationFlowManager {
  return new ConfirmationFlowManager(config)
}

// ==================== Helper Functions ====================

/**
 * Create standard confirmation options
 */
export function createConfirmationOptions(
  includeReason: boolean = false
): ConfirmationOption[] {
  return DEFAULT_OPTIONS.map(opt => ({
    ...opt,
    requiresReason: includeReason ? true : opt.requiresReason,
  }))
}

/**
 * Check if outcome is positive (execution should continue)
 */
export function isPositiveOutcome(outcome: ConfirmationOutcome): boolean {
  return outcome === 'approved'
}

/**
 * Check if outcome is negative (execution should stop)
 */
export function isNegativeOutcome(outcome: ConfirmationOutcome): boolean {
  return outcome === 'rejected' || outcome === 'cancelled' || outcome === 'timeout'
}
