/**
 * Structured Planner - Plan Generation for Agent Runtime
 * Task 65: Story 44.2 - Structured Planner
 * 
 * This module defines structured plans for agent execution:
 * - Plan output schema
 * - Linear multi-step plan generation
 * - Tool and confirmation step marking
 * - Plan persistence for audit and replay
 */

// ==================== Plan Types ====================

/**
 * Step type enumeration
 */
export type PlanStepType =
  | 'action'       // Regular action step
  | 'tool_call'    // Step that requires tool execution
  | 'confirmation' // Step that requires user confirmation
  | 'permission'   // Step that requires permission check
  | 'decision'     // Conditional branching point
  | 'parallel'     // Parallel execution group
  | 'wait'         // Wait for external event
  | 'subtask'      // Nested subtask

/**
 * Step status enumeration
 */
export type PlanStepStatus =
  | 'pending'      // Not yet started
  | 'ready'        // Ready to execute
  | 'running'      // Currently executing
  | 'waiting'      // Waiting for input/confirmation
  | 'completed'    // Successfully completed
  | 'failed'       // Failed with error
  | 'skipped'      // Skipped (conditional)
  | 'cancelled'    // Cancelled by user or system

/**
 * Confirmation type
 */
export type ConfirmationType =
  | 'user'         // User confirmation required
  | 'permission'   // Permission approval required
  | 'approval'     // Admin/manager approval required
  | 'review'       // Review before proceeding

/**
 * Tool requirement
 */
export interface ToolRequirement {
  toolId: string
  toolName: string
  category?: string
  parameters?: Record<string, unknown>
  expectedOutput?: string
  timeout?: number
  retryable?: boolean
  maxRetries?: number
}

/**
 * Confirmation requirement
 */
export interface ConfirmationRequirement {
  type: ConfirmationType
  message: string
  options?: string[]
  defaultOption?: string
  timeout?: number
  autoApprove?: boolean
  permissionScope?: string[]
}

/**
 * Step dependency
 */
export interface StepDependency {
  stepId: string
  condition?: 'success' | 'failure' | 'always' | 'on_success' | 'on_failure'
}

/**
 * Plan step definition
 */
export interface PlanStep {
  id: string
  name: string
  description?: string
  type: PlanStepType
  status: PlanStepStatus
  order: number
  
  // Requirements
  toolRequirement?: ToolRequirement
  confirmationRequirement?: ConfirmationRequirement
  
  // Dependencies
  dependencies?: StepDependency[]
  
  // Execution
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  
  // Timing
  estimatedDuration?: number  // in milliseconds
  startedAt?: number
  completedAt?: number
  
  // Metadata
  metadata?: Record<string, unknown>
  tags?: string[]
}

/**
 * Plan status enumeration
 */
export type PlanStatus =
  | 'draft'        // Plan is being created
  | 'ready'        // Plan is ready for execution
  | 'running'      // Plan is being executed
  | 'paused'       // Plan execution is paused
  | 'completed'    // All steps completed successfully
  | 'failed'       // Plan failed
  | 'cancelled'    // Plan was cancelled

/**
 * Plan priority
 */
export type PlanPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Plan definition
 */
export interface Plan {
  id: string
  name: string
  description?: string
  status: PlanStatus
  priority: PlanPriority
  
  // Steps
  steps: PlanStep[]
  currentStepIndex: number
  
  // Goal and context
  goal: string
  context?: Record<string, unknown>
  
  // Timing
  createdAt: number
  updatedAt: number
  startedAt?: number
  completedAt?: number
  estimatedDuration?: number
  
  // Metadata
  metadata?: Record<string, unknown>
  tags?: string[]
  
  // Source
  source: 'user' | 'system' | 'agent'
  sourceId?: string
  
  // Audit
  version: number
  parentPlanId?: string
}

/**
 * Plan generation request
 */
export interface PlanGenerationRequest {
  goal: string
  context?: Record<string, unknown>
  availableTools?: string[]
  constraints?: PlanConstraints
  preferences?: PlanPreferences
}

/**
 * Plan constraints
 */
export interface PlanConstraints {
  maxSteps?: number
  maxDuration?: number
  requireConfirmationFor?: ('tool' | 'file' | 'network' | 'system')[]
  allowedTools?: string[]
  blockedTools?: string[]
}

/**
 * Plan preferences
 */
export interface PlanPreferences {
  preferParallel?: boolean
  preferConfirmation?: boolean
  verboseSteps?: boolean
  includeEstimates?: boolean
}

/**
 * Plan generation result
 */
export interface PlanGenerationResult {
  plan: Plan
  success: boolean
  error?: string
  warnings?: string[]
}

// ==================== Plan Storage ====================

/**
 * Plan storage interface
 */
export interface PlanStorage {
  save(plan: Plan): Promise<void>
  load(planId: string): Promise<Plan | null>
  delete(planId: string): Promise<void>
  list(filter?: PlanFilter): Promise<Plan[]>
}

/**
 * Plan filter
 */
export interface PlanFilter {
  status?: PlanStatus[]
  source?: ('user' | 'system' | 'agent')[]
  tags?: string[]
  createdAfter?: number
  createdBefore?: number
}

/**
 * In-memory plan storage
 */
export class InMemoryPlanStorage implements PlanStorage {
  private plans: Map<string, Plan> = new Map()

  async save(plan: Plan): Promise<void> {
    this.plans.set(plan.id, { ...plan })
  }

  async load(planId: string): Promise<Plan | null> {
    return this.plans.get(planId) ?? null
  }

  async delete(planId: string): Promise<void> {
    this.plans.delete(planId)
  }

  async list(filter?: PlanFilter): Promise<Plan[]> {
    let plans = Array.from(this.plans.values())

    if (filter) {
      if (filter.status?.length) {
        plans = plans.filter(p => filter.status!.includes(p.status))
      }
      if (filter.source?.length) {
        plans = plans.filter(p => filter.source!.includes(p.source))
      }
      if (filter.tags?.length) {
        plans = plans.filter(p => 
          p.tags?.some(t => filter.tags!.includes(t))
        )
      }
      if (filter.createdAfter) {
        plans = plans.filter(p => p.createdAt >= filter.createdAfter!)
      }
      if (filter.createdBefore) {
        plans = plans.filter(p => p.createdAt <= filter.createdBefore!)
      }
    }

    return plans.sort((a, b) => b.createdAt - a.createdAt)
  }

  clear(): void {
    this.plans.clear()
  }
}

// ==================== Structured Planner ====================

/**
 * Planner configuration
 */
export interface StructuredPlannerConfig {
  storage?: PlanStorage
  maxSteps?: number
  defaultTimeout?: number
  onPlanChange?: (plan: Plan) => void
  onStepChange?: (step: PlanStep, previousStatus: PlanStepStatus) => void
}

/**
 * Structured Planner
 * Generates and manages execution plans
 */
export class StructuredPlanner {
  private storage: PlanStorage
  private _maxSteps: number
  private defaultTimeout: number
  private onPlanChange?: (plan: Plan) => void
  private onStepChange?: (step: PlanStep, previousStatus: PlanStepStatus) => void

  private currentPlan: Plan | null = null
  private planListeners: Set<(plan: Plan) => void> = new Set()
  private stepListeners: Set<(step: PlanStep, previousStatus: PlanStepStatus) => void> = new Set()

  constructor(config: StructuredPlannerConfig = {}) {
    this.storage = config.storage ?? new InMemoryPlanStorage()
    this._maxSteps = config.maxSteps ?? 50
    this.defaultTimeout = config.defaultTimeout ?? 60000
    this.onPlanChange = config.onPlanChange
    this.onStepChange = config.onStepChange
  }

  // ==================== Plan Generation ====================

  /**
   * Generate a plan from a goal
   */
  generatePlan(request: PlanGenerationRequest): PlanGenerationResult {
    const warnings: string[] = []

    // Validate goal
    if (!request.goal || request.goal.trim().length === 0) {
      return {
        plan: null as unknown as Plan,
        success: false,
        error: 'Goal is required',
      }
    }

    // Create plan
    const planId = generatePlanId()
    const now = Date.now()

    const plan: Plan = {
      id: planId,
      name: generatePlanName(request.goal),
      description: request.goal,
      status: 'draft',
      priority: 'normal',
      steps: [],
      currentStepIndex: 0,
      goal: request.goal,
      context: request.context,
      createdAt: now,
      updatedAt: now,
      source: 'user',
      version: 1,
    }

    // Generate steps from goal
    const steps = this.generateStepsFromGoal(request)
    
    // Apply constraints (use instance maxSteps as fallback)
    const maxSteps = request.constraints?.maxSteps ?? this._maxSteps
    if (steps.length > maxSteps) {
      warnings.push(`Plan truncated to ${maxSteps} steps`)
      steps.length = maxSteps
    }

    // Mark tools and confirmations
    this.markStepsWithRequirements(steps, request)

    // Add steps to plan
    plan.steps = steps
    plan.estimatedDuration = this.calculateEstimatedDuration(steps)

    // Update status
    plan.status = 'ready'

    return {
      plan,
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Generate steps from a goal
   */
  private generateStepsFromGoal(request: PlanGenerationRequest): PlanStep[] {
    const steps: PlanStep[] = []
    
    // Parse goal into logical steps
    const goalParts = parseGoalIntoSteps(request.goal)
    
    goalParts.forEach((part, index) => {
      const step = createStepFromGoalPart(part, index)
      
      // Add dependencies
      if (index > 0) {
        step.dependencies = [{ stepId: steps[index - 1].id }]
      }
      
      steps.push(step)
    })

    return steps
  }

  /**
   * Mark steps with tool and confirmation requirements
   */
  private markStepsWithRequirements(
    steps: PlanStep[],
    request: PlanGenerationRequest
  ): void {
    const constraints = request.constraints
    const availableTools = request.availableTools ?? []

    steps.forEach(step => {
      // Check if step requires tool
      if (step.type === 'tool_call' && step.toolRequirement) {
        const toolId = step.toolRequirement.toolId
        
        // Check if tool is allowed
        if (constraints?.allowedTools?.length && 
            !constraints.allowedTools.includes(toolId)) {
          step.status = 'skipped'
          step.error = `Tool ${toolId} is not allowed`
          return
        }

        // Check if tool is blocked
        if (constraints?.blockedTools?.includes(toolId)) {
          step.status = 'skipped'
          step.error = `Tool ${toolId} is blocked`
          return
        }

        // Check if tool is available
        if (availableTools.length > 0 && !availableTools.includes(toolId)) {
          step.toolRequirement.retryable = false
        }
      }

      // Check if step requires confirmation
      if (constraints?.requireConfirmationFor) {
        const needConfirmation = this.needsConfirmation(step, constraints.requireConfirmationFor)
        if (needConfirmation && !step.confirmationRequirement) {
          step.confirmationRequirement = {
            type: 'user',
            message: `Confirm action: ${step.name}`,
          }
        }
      }
    })
  }

  /**
   * Check if a step needs confirmation
   */
  private needsConfirmation(
    step: PlanStep,
    confirmationTypes: ('tool' | 'file' | 'network' | 'system')[]
  ): boolean {
    if (step.type === 'tool_call' && confirmationTypes.includes('tool')) {
      return true
    }
    
    // Check tool category
    if (step.toolRequirement?.category) {
      const category = step.toolRequirement.category
      if (category === 'file' && confirmationTypes.includes('file')) return true
      if (category === 'network' && confirmationTypes.includes('network')) return true
      if (category === 'system' && confirmationTypes.includes('system')) return true
    }
    
    return false
  }

  /**
   * Calculate estimated duration for a plan
   */
  private calculateEstimatedDuration(steps: PlanStep[]): number {
    return steps.reduce((total, step) => {
      return total + (step.estimatedDuration ?? this.defaultTimeout)
    }, 0)
  }

  // ==================== Plan Management ====================

  /**
   * Set current plan
   */
  setCurrentPlan(plan: Plan): void {
    this.currentPlan = plan
    this.notifyPlanChange(plan)
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): Plan | null {
    return this.currentPlan
  }

  /**
   * Save plan to storage
   */
  async savePlan(plan: Plan): Promise<void> {
    plan.updatedAt = Date.now()
    await this.storage.save(plan)
    if (this.currentPlan?.id === plan.id) {
      this.currentPlan = plan
      this.notifyPlanChange(plan)
    }
  }

  /**
   * Load plan from storage
   */
  async loadPlan(planId: string): Promise<Plan | null> {
    const plan = await this.storage.load(planId)
    if (plan) {
      this.currentPlan = plan
      this.notifyPlanChange(plan)
    }
    return plan
  }

  /**
   * Delete plan from storage
   */
  async deletePlan(planId: string): Promise<void> {
    await this.storage.delete(planId)
    if (this.currentPlan?.id === planId) {
      this.currentPlan = null
    }
  }

  /**
   * List plans from storage
   */
  async listPlans(filter?: PlanFilter): Promise<Plan[]> {
    return this.storage.list(filter)
  }

  // ==================== Step Management ====================

  /**
   * Get current step
   */
  getCurrentStep(): PlanStep | null {
    if (!this.currentPlan) return null
    return this.currentPlan.steps[this.currentPlan.currentStepIndex] ?? null
  }

  /**
   * Get step by ID
   */
  getStep(stepId: string): PlanStep | null {
    if (!this.currentPlan) return null
    return this.currentPlan.steps.find(s => s.id === stepId) ?? null
  }

  /**
   * Update step status
   */
  updateStepStatus(stepId: string, status: PlanStepStatus, error?: string): boolean {
    if (!this.currentPlan) return false

    const step = this.currentPlan.steps.find(s => s.id === stepId)
    if (!step) return false

    const previousStatus = step.status
    step.status = status
    step.error = error

    // Update timestamps
    if (status === 'running' && !step.startedAt) {
      step.startedAt = Date.now()
    }
    if (status === 'completed' || status === 'failed') {
      step.completedAt = Date.now()
    }

    this.currentPlan.updatedAt = Date.now()
    this.notifyStepChange(step, previousStatus)
    return true
  }

  /**
   * Advance to next step
   */
  advanceToNextStep(): PlanStep | null {
    if (!this.currentPlan) return null

    const nextIndex = this.currentPlan.currentStepIndex + 1
    if (nextIndex >= this.currentPlan.steps.length) {
      return null
    }

    this.currentPlan.currentStepIndex = nextIndex
    this.currentPlan.updatedAt = Date.now()
    
    const nextStep = this.currentPlan.steps[nextIndex]
    this.notifyStepChange(nextStep, 'pending')
    
    return nextStep
  }

  /**
   * Get step dependencies
   */
  getStepDependencies(stepId: string): PlanStep[] {
    if (!this.currentPlan) return []

    const step = this.getStep(stepId)
    if (!step?.dependencies) return []

    return step.dependencies
      .map(dep => this.getStep(dep.stepId))
      .filter((s): s is PlanStep => s !== null)
  }

  /**
   * Check if step dependencies are satisfied
   */
  areDependenciesSatisfied(stepId: string): boolean {
    if (!this.currentPlan) return false

    const step = this.getStep(stepId)
    if (!step?.dependencies) return true

    return step.dependencies.every(dep => {
      const depStep = this.getStep(dep.stepId)
      if (!depStep) return false

      switch (dep.condition) {
        case 'success':
        case 'on_success':
          return depStep.status === 'completed'
        case 'failure':
        case 'on_failure':
          return depStep.status === 'failed'
        case 'always':
          return true
        default:
          return depStep.status === 'completed'
      }
    })
  }

  // ==================== Plan Execution ====================

  /**
   * Start plan execution
   */
  startPlan(): boolean {
    if (!this.currentPlan || this.currentPlan.status !== 'ready') {
      return false
    }

    this.currentPlan.status = 'running'
    this.currentPlan.startedAt = Date.now()
    this.currentPlan.updatedAt = Date.now()

    // Mark first step as ready
    const firstStep = this.currentPlan.steps[0]
    if (firstStep) {
      this.updateStepStatus(firstStep.id, 'ready')
    }

    this.notifyPlanChange(this.currentPlan)
    return true
  }

  /**
   * Pause plan execution
   */
  pausePlan(): boolean {
    if (!this.currentPlan || this.currentPlan.status !== 'running') {
      return false
    }

    this.currentPlan.status = 'paused'
    this.currentPlan.updatedAt = Date.now()
    this.notifyPlanChange(this.currentPlan)
    return true
  }

  /**
   * Resume plan execution
   */
  resumePlan(): boolean {
    if (!this.currentPlan || this.currentPlan.status !== 'paused') {
      return false
    }

    this.currentPlan.status = 'running'
    this.currentPlan.updatedAt = Date.now()
    this.notifyPlanChange(this.currentPlan)
    return true
  }

  /**
   * Complete plan
   */
  completePlan(): boolean {
    if (!this.currentPlan) return false

    this.currentPlan.status = 'completed'
    this.currentPlan.completedAt = Date.now()
    this.currentPlan.updatedAt = Date.now()
    this.notifyPlanChange(this.currentPlan)
    return true
  }

  /**
   * Fail plan
   */
  failPlan(_reason: string): boolean {
    if (!this.currentPlan) return false

    this.currentPlan.status = 'failed'
    this.currentPlan.completedAt = Date.now()
    this.currentPlan.updatedAt = Date.now()
    this.notifyPlanChange(this.currentPlan)
    return true
  }

  /**
   * Cancel plan
   */
  cancelPlan(reason?: string): boolean {
    if (!this.currentPlan) return false

    this.currentPlan.status = 'cancelled'
    this.currentPlan.completedAt = Date.now()
    this.currentPlan.updatedAt = Date.now()

    // Cancel all pending steps
    this.currentPlan.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'ready') {
        this.updateStepStatus(step.id, 'cancelled', reason)
      }
    })

    this.notifyPlanChange(this.currentPlan)
    return true
  }

  // ==================== Listeners ====================

  /**
   * Add plan change listener
   */
  addPlanListener(listener: (plan: Plan) => void): () => void {
    this.planListeners.add(listener)
    return () => this.planListeners.delete(listener)
  }

  /**
   * Add step change listener
   */
  addStepListener(listener: (step: PlanStep, previousStatus: PlanStepStatus) => void): () => void {
    this.stepListeners.add(listener)
    return () => this.stepListeners.delete(listener)
  }

  /**
   * Notify plan change
   */
  private notifyPlanChange(plan: Plan): void {
    this.onPlanChange?.(plan)
    this.planListeners.forEach(listener => listener(plan))
  }

  /**
   * Notify step change
   */
  private notifyStepChange(step: PlanStep, previousStatus: PlanStepStatus): void {
    this.onStepChange?.(step, previousStatus)
    this.stepListeners.forEach(listener => listener(step, previousStatus))
  }

  // ==================== Persistence ====================

  /**
   * Persist current plan to localStorage
   */
  persistToStorage(): void {
    if (!this.currentPlan) return

    try {
      const key = `plan_${this.currentPlan.id}`
      localStorage.setItem(key, JSON.stringify(this.currentPlan))
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Restore plan from localStorage
   */
  restoreFromStorage(planId: string): Plan | null {
    try {
      const key = `plan_${planId}`
      const data = localStorage.getItem(key)
      if (data) {
        const plan = JSON.parse(data) as Plan
        this.currentPlan = plan
        this.notifyPlanChange(plan)
        return plan
      }
    } catch {
      // Ignore storage errors
    }
    return null
  }

  /**
   * Clear persisted plan from localStorage
   */
  clearPersistedPlan(planId: string): void {
    try {
      const key = `plan_${planId}`
      localStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
  }
}

// ==================== Helper Functions ====================

/**
 * Generate unique plan ID
 */
export function generatePlanId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `plan_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate step ID
 */
export function generateStepId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return `step_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Generate plan name from goal
 */
export function generatePlanName(goal: string): string {
  // Take first 50 characters or until first period
  const trimmed = goal.trim()
  const firstSentence = trimmed.split(/[.!?]/, 2)[0]
  
  if (firstSentence.length <= 50) {
    return firstSentence
  }
  
  return firstSentence.substring(0, 47) + '...'
}

/**
 * Parse goal into step parts
 */
export function parseGoalIntoSteps(goal: string): string[] {
  // Simple parsing: split by numbered lists or line breaks
  const lines = goal.split(/\n+/)
  const steps: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip empty lines
    if (!trimmed) continue
    
    // Check for numbered steps
    const numberedMatch = trimmed.match(/^\d+[.)]\s*(.+)$/)
    if (numberedMatch) {
      steps.push(numberedMatch[1])
      continue
    }
    
    // Check for bullet points
    const bulletMatch = trimmed.match(/^[-*]\s*(.+)$/)
    if (bulletMatch) {
      steps.push(bulletMatch[1])
      continue
    }
    
    // Add as-is if not a list item
    steps.push(trimmed)
  }

  // If no steps found, treat goal as single step
  if (steps.length === 0) {
    steps.push(goal)
  }

  return steps
}

/**
 * Create step from goal part
 */
export function createStepFromGoalPart(part: string, index: number): PlanStep {
  const stepId = generateStepId()
  
  // Detect step type from content
  const type = detectStepType(part)
  
  // Create base step
  const step: PlanStep = {
    id: stepId,
    name: generateStepName(part),
    description: part,
    type,
    status: 'pending',
    order: index,
    estimatedDuration: 30000, // Default 30 seconds
  }

  // Add tool requirement if detected
  if (type === 'tool_call') {
    const toolInfo = extractToolInfo(part)
    if (toolInfo) {
      step.toolRequirement = toolInfo
    }
  }

  // Add confirmation requirement if detected
  if (type === 'confirmation' || part.toLowerCase().includes('confirm')) {
    step.confirmationRequirement = {
      type: 'user',
      message: `Confirm: ${step.name}`,
    }
  }

  return step
}

/**
 * Detect step type from content
 */
export function detectStepType(content: string): PlanStepType {
  const lower = content.toLowerCase()
  
  if (lower.includes('tool:') || lower.includes('call ') || lower.includes('execute ')) {
    return 'tool_call'
  }
  
  if (lower.includes('confirm') || lower.includes('approv') || lower.includes('permission')) {
    return 'confirmation'
  }
  
  if (lower.includes('wait for') || lower.includes('wait until')) {
    return 'wait'
  }
  
  if (lower.includes('if ') || lower.includes('when ') || lower.includes('condition')) {
    return 'decision'
  }
  
  if (lower.includes('parallel') || lower.includes('simultaneously')) {
    return 'parallel'
  }
  
  if (lower.includes('subtask') || lower.includes('sub-task')) {
    return 'subtask'
  }
  
  return 'action'
}

/**
 * Generate step name from content
 */
export function generateStepName(content: string): string {
  // Take first 30 characters or until first period/comma
  const trimmed = content.trim()
  const firstPart = trimmed.split(/[.,;]/, 2)[0]
  
  if (firstPart.length <= 30) {
    return firstPart
  }
  
  return firstPart.substring(0, 27) + '...'
}

/**
 * Extract tool info from content
 */
export function extractToolInfo(content: string): ToolRequirement | null {
  // Look for tool:pattern
  const toolMatch = content.match(/tool:\s*(\w+)/i)
  if (toolMatch) {
    return {
      toolId: toolMatch[1],
      toolName: toolMatch[1],
    }
  }
  
  // Look for call pattern
  const callMatch = content.match(/call\s+(?:the\s+)?(\w+)\s+(?:tool|function|api)/i)
  if (callMatch) {
    return {
      toolId: callMatch[1],
      toolName: callMatch[1],
    }
  }
  
  return null
}

// ==================== Utility Functions ====================

/**
 * Calculate plan progress
 */
export function calculatePlanProgress(plan: Plan): number {
  if (plan.steps.length === 0) return 0
  
  const completedSteps = plan.steps.filter(s => 
    s.status === 'completed' || s.status === 'skipped'
  ).length
  
  return completedSteps / plan.steps.length
}

/**
 * Get plan summary
 */
export function getPlanSummary(plan: Plan): string {
  const progress = Math.round(calculatePlanProgress(plan) * 100)
  const totalSteps = plan.steps.length
  const completedSteps = plan.steps.filter(s => s.status === 'completed').length
  
  return `${plan.name}: ${completedSteps}/${totalSteps} steps (${progress}%) - ${plan.status}`
}

/**
 * Check if plan is terminal
 */
export function isPlanTerminal(plan: Plan): boolean {
  return ['completed', 'failed', 'cancelled'].includes(plan.status)
}

/**
 * Get pending steps
 */
export function getPendingSteps(plan: Plan): PlanStep[] {
  return plan.steps.filter(s => s.status === 'pending' || s.status === 'ready')
}

/**
 * Get failed steps
 */
export function getFailedSteps(plan: Plan): PlanStep[] {
  return plan.steps.filter(s => s.status === 'failed')
}

/**
 * Create planner instance
 */
export function createStructuredPlanner(config?: StructuredPlannerConfig): StructuredPlanner {
  return new StructuredPlanner(config)
}
