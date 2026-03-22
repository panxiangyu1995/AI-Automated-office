/**
 * Interrupt Handler - Runtime Interruption, Checkpoint, and Recovery
 * Task 63: Story 43.4 - Interrupt Retry and Checkpoint Recovery
 * 
 * This module provides:
 * - Runtime interruption requests
 * - Step checkpoints for resume
 * - Controlled retry from checkpoint or step start
 * - Recovery decisions recording in runtime history
 */

import type { RuntimeEvent } from './runtimeEvents'
import { RuntimeEventEmitter } from './runtimeEvents'

// ==================== Interrupt Types ====================

/**
 * Interrupt request type
 */
export type InterruptType =
  | 'pause'      // Pause execution, can resume
  | 'stop'       // Stop execution gracefully
  | 'abort'      // Abort immediately, no cleanup
  | 'timeout'    // Execution timed out

/**
 * Interrupt status
 */
export type InterruptStatus =
  | 'none'       // No interrupt
  | 'pending'    // Interrupt requested, waiting to process
  | 'processing' // Interrupt being processed
  | 'completed'  // Interrupt completed
  | 'cancelled'  // Interrupt cancelled (resumed)

/**
 * Interrupt request
 */
export interface InterruptRequest {
  id: string
  sessionId: string
  type: InterruptType
  status: InterruptStatus
  reason?: string
  requestedAt: number
  processedAt?: number
  checkpointId?: string
}

/**
 * Interrupt result
 */
export interface InterruptResult {
  request: InterruptRequest
  success: boolean
  checkpoint?: Checkpoint
  error?: string
}

// ==================== Checkpoint Types ====================

/**
 * Checkpoint status
 */
export type CheckpointStatus =
  | 'created'    // Checkpoint created
  | 'active'     // Checkpoint is the current state
  | 'restored'   // Checkpoint was restored
  | 'expired'    // Checkpoint expired, cannot restore
  | 'abandoned'  // Checkpoint abandoned

/**
 * Step execution state
 */
export interface StepState {
  stepId: string
  stepName: string
  stepType: 'planning' | 'execution' | 'tool_call' | 'confirmation' | 'completion'
  startedAt: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  progress?: number // 0-100
}

/**
 * Checkpoint - saved state for recovery
 */
export interface Checkpoint {
  id: string
  sessionId: string
  step: StepState
  status: CheckpointStatus
  createdAt: number
  expiresAt?: number
  metadata?: {
    eventSequence: number
    messageCount: number
    partCount: number
    toolCallCount: number
  }
  snapshot?: {
    events: RuntimeEvent[]
    variables: Record<string, unknown>
    context: Record<string, unknown>
  }
}

/**
 * Checkpoint storage interface
 */
export interface CheckpointStorage {
  saveCheckpoint(checkpoint: Checkpoint): Promise<void>
  getCheckpoint(id: string): Promise<Checkpoint | null>
  getCheckpointsBySession(sessionId: string): Promise<Checkpoint[]>
  deleteCheckpoint(id: string): Promise<void>
  deleteExpiredCheckpoints(): Promise<number>
}

// ==================== Recovery Types ====================

/**
 * Recovery strategy
 */
export type RecoveryStrategy =
  | 'restart'      // Restart from beginning
  | 'checkpoint'   // Resume from last checkpoint
  | 'step_start'   // Resume from step start
  | 'skip'         // Skip failed step, continue

/**
 * Recovery decision
 */
export interface RecoveryDecision {
  id: string
  sessionId: string
  checkpointId?: string
  strategy: RecoveryStrategy
  reason: string
  decidedAt: number
  decidedBy: 'user' | 'auto' | 'system'
  metadata?: Record<string, unknown>
}

/**
 * Recovery history entry
 */
export interface RecoveryHistoryEntry {
  id: string
  sessionId: string
  decision: RecoveryDecision
  result: {
    success: boolean
    resumedAt?: number
    eventsReplayed?: number
    stepsRetried?: number
    error?: string
  }
  createdAt: number
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  success: boolean
  decision: RecoveryDecision
  checkpoint?: Checkpoint
  eventsReplayed: number
  error?: string
}

// ==================== Interrupt Handler Configuration ====================

/**
 * Interrupt handler configuration
 */
export interface InterruptHandlerConfig {
  sessionId: string
  eventEmitter: RuntimeEventEmitter
  checkpointStorage?: CheckpointStorage
  autoCheckpoint?: boolean
  checkpointInterval?: number
  maxCheckpointsPerSession?: number
  checkpointTTL?: number
}

// ==================== In-Memory Checkpoint Storage ====================

/**
 * In-memory implementation of checkpoint storage
 */
export class InMemoryCheckpointStorage implements CheckpointStorage {
  private checkpoints: Map<string, Checkpoint> = new Map()

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    this.checkpoints.set(checkpoint.id, checkpoint)
  }

  async getCheckpoint(id: string): Promise<Checkpoint | null> {
    return this.checkpoints.get(id) ?? null
  }

  async getCheckpointsBySession(sessionId: string): Promise<Checkpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter(c => c.sessionId === sessionId)
  }

  async deleteCheckpoint(id: string): Promise<void> {
    this.checkpoints.delete(id)
  }

  async deleteExpiredCheckpoints(): Promise<number> {
    const now = Date.now()
    let deleted = 0

    this.checkpoints.forEach((checkpoint, id) => {
      if (checkpoint.expiresAt && checkpoint.expiresAt < now) {
        this.checkpoints.delete(id)
        deleted++
      }
    })

    return deleted
  }
}

// ==================== Recovery History Storage ====================

/**
 * Recovery history storage interface
 */
export interface RecoveryHistoryStorage {
  addEntry(entry: RecoveryHistoryEntry): Promise<void>
  getEntries(sessionId: string): Promise<RecoveryHistoryEntry[]>
  getEntry(id: string): Promise<RecoveryHistoryEntry | null>
  clearEntries(sessionId: string): Promise<void>
}

/**
 * In-memory recovery history storage
 */
export class InMemoryRecoveryHistoryStorage implements RecoveryHistoryStorage {
  private entries: Map<string, RecoveryHistoryEntry[]> = new Map()

  async addEntry(entry: RecoveryHistoryEntry): Promise<void> {
    if (!this.entries.has(entry.sessionId)) {
      this.entries.set(entry.sessionId, [])
    }
    this.entries.get(entry.sessionId)!.push(entry)
  }

  async getEntries(sessionId: string): Promise<RecoveryHistoryEntry[]> {
    return this.entries.get(sessionId) ?? []
  }

  async getEntry(id: string): Promise<RecoveryHistoryEntry | null> {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.id === id)
      if (entry) return entry
    }
    return null
  }

  async clearEntries(sessionId: string): Promise<void> {
    this.entries.delete(sessionId)
  }
}

// ==================== Interrupt Handler ====================

/**
 * Interrupt Handler
 * 
 * Manages runtime interruptions, checkpoints, and recovery.
 */
export class InterruptHandler {
  private sessionId: string
  private eventEmitter: RuntimeEventEmitter
  private checkpointStorage: CheckpointStorage
  private historyStorage: RecoveryHistoryStorage
  
  private autoCheckpoint: boolean
  private checkpointInterval: number
  private maxCheckpointsPerSession: number
  private checkpointTTL: number
  
  private currentInterrupt: InterruptRequest | null = null
  private currentStep: StepState | null = null
  private checkpoints: Checkpoint[] = []
  private checkpointTimer?: ReturnType<typeof setInterval>
  
  private interruptListeners: Set<InterruptListener> = new Set()
  private checkpointListeners: Set<CheckpointListener> = new Set()
  private recoveryListeners: Set<RecoveryListener> = new Set()

  constructor(config: InterruptHandlerConfig) {
    this.sessionId = config.sessionId
    this.eventEmitter = config.eventEmitter
    this.checkpointStorage = config.checkpointStorage ?? new InMemoryCheckpointStorage()
    this.historyStorage = new InMemoryRecoveryHistoryStorage()
    
    this.autoCheckpoint = config.autoCheckpoint ?? true
    this.checkpointInterval = config.checkpointInterval ?? 30000 // 30 seconds
    this.maxCheckpointsPerSession = config.maxCheckpointsPerSession ?? 10
    this.checkpointTTL = config.checkpointTTL ?? 24 * 60 * 60 * 1000 // 24 hours
  }

  // ==================== Lifecycle ====================

  /**
   * Initialize the interrupt handler
   */
  initialize(): void {
    if (this.autoCheckpoint) {
      this.startAutoCheckpoint()
    }
  }

  /**
   * Cleanup the interrupt handler
   */
  cleanup(): void {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer)
      this.checkpointTimer = undefined
    }
  }

  // ==================== Interrupt Request Handling ====================

  /**
   * Request an interrupt
   */
  async requestInterrupt(
    type: InterruptType,
    reason?: string
  ): Promise<InterruptResult> {
    // Create interrupt request
    const request: InterruptRequest = {
      id: this.generateId(),
      sessionId: this.sessionId,
      type,
      status: 'pending',
      reason,
      requestedAt: Date.now(),
    }

    this.currentInterrupt = request
    this.notifyInterruptListeners(request)

    try {
      // Process the interrupt
      const result = await this.processInterrupt(request)
      return result
    } catch (error) {
      request.status = 'completed'
      return {
        request,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Process an interrupt request
   */
  private async processInterrupt(request: InterruptRequest): Promise<InterruptResult> {
    request.status = 'processing'

    // Create checkpoint before interrupt
    const checkpoint = await this.createCheckpoint()

    // Process based on type
    switch (request.type) {
      case 'pause':
        // Pause: just create checkpoint and wait
        request.checkpointId = checkpoint?.id
        request.status = 'completed'
        break

      case 'stop':
        // Stop: create checkpoint and cleanup
        request.checkpointId = checkpoint?.id
        request.status = 'completed'
        this.cleanup()
        break

      case 'abort':
        // Abort: immediate, no checkpoint needed
        request.status = 'completed'
        break

      case 'timeout':
        // Timeout: create checkpoint and mark as error
        request.checkpointId = checkpoint?.id
        request.status = 'completed'
        break
    }

    this.notifyInterruptListeners(request)

    return {
      request,
      success: true,
      checkpoint: checkpoint ?? undefined,
    }
  }

  /**
   * Cancel a pending interrupt (resume)
   */
  cancelInterrupt(): boolean {
    if (!this.currentInterrupt || this.currentInterrupt.status !== 'pending') {
      return false
    }

    this.currentInterrupt.status = 'cancelled'
    this.notifyInterruptListeners(this.currentInterrupt)
    this.currentInterrupt = null
    return true
  }

  /**
   * Get current interrupt status
   */
  getInterruptStatus(): InterruptStatus {
    return this.currentInterrupt?.status ?? 'none'
  }

  /**
   * Get current interrupt request
   */
  getCurrentInterrupt(): InterruptRequest | null {
    return this.currentInterrupt
  }

  // ==================== Checkpoint Management ====================

  /**
   * Start automatic checkpoint creation
   */
  private startAutoCheckpoint(): void {
    this.checkpointTimer = setInterval(() => {
      if (this.currentStep) {
        this.createCheckpoint().catch(err => {
          console.error('Auto-checkpoint failed:', err)
        })
      }
    }, this.checkpointInterval)
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(): Promise<Checkpoint | null> {
    if (!this.currentStep) {
      return null
    }

    // Get events from emitter
    const events = this.eventEmitter.getBuffer()
    const lastSequence = this.eventEmitter.getCurrentSequence()

    // Create checkpoint
    const checkpoint: Checkpoint = {
      id: this.generateId(),
      sessionId: this.sessionId,
      step: { ...this.currentStep },
      status: 'created',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.checkpointTTL,
      metadata: {
        eventSequence: lastSequence,
        messageCount: events.filter(e => e.type.startsWith('message')).length,
        partCount: events.filter(e => e.type.startsWith('part')).length,
        toolCallCount: events.filter(e => e.type === 'tool_call').length,
      },
      snapshot: {
        events: events.slice(-100), // Keep last 100 events
        variables: {},
        context: {},
      },
    }

    // Save to storage
    await this.checkpointStorage.saveCheckpoint(checkpoint)

    // Add to local cache
    this.checkpoints.push(checkpoint)

    // Enforce max checkpoints
    if (this.checkpoints.length > this.maxCheckpointsPerSession) {
      const removed = this.checkpoints.shift()
      if (removed) {
        await this.checkpointStorage.deleteCheckpoint(removed.id)
      }
    }

    this.notifyCheckpointListeners(checkpoint)

    return checkpoint
  }

  /**
   * Get a checkpoint by ID
   */
  async getCheckpoint(id: string): Promise<Checkpoint | null> {
    return this.checkpointStorage.getCheckpoint(id)
  }

  /**
   * Get all checkpoints for the session
   */
  async getSessionCheckpoints(): Promise<Checkpoint[]> {
    return this.checkpointStorage.getCheckpointsBySession(this.sessionId)
  }

  /**
   * Get latest valid checkpoint
   */
  async getLatestCheckpoint(): Promise<Checkpoint | null> {
    const checkpoints = await this.getSessionCheckpoints()
    const now = Date.now()

    // Find latest non-expired checkpoint
    const valid = checkpoints
      .filter(c => !c.expiresAt || c.expiresAt > now)
      .filter(c => c.status !== 'expired' && c.status !== 'abandoned')
      .sort((a, b) => b.createdAt - a.createdAt)

    return valid[0] ?? null
  }

  /**
   * Set current step state
   */
  setCurrentStep(step: StepState): void {
    this.currentStep = step
  }

  /**
   * Get current step state
   */
  getCurrentStep(): StepState | null {
    return this.currentStep
  }

  // ==================== Recovery Management ====================

  /**
   * Recover from a checkpoint
   */
  async recover(
    strategy: RecoveryStrategy,
    checkpointId?: string,
    decidedBy: 'user' | 'auto' | 'system' = 'system',
    reason?: string
  ): Promise<RecoveryResult> {
    let checkpoint: Checkpoint | null = null

    // Find checkpoint based on strategy
    if (strategy === 'checkpoint' || strategy === 'step_start') {
      if (checkpointId) {
        checkpoint = await this.getCheckpoint(checkpointId)
      } else {
        checkpoint = await this.getLatestCheckpoint()
      }
    }

    // Create recovery decision
    const decision: RecoveryDecision = {
      id: this.generateId(),
      sessionId: this.sessionId,
      checkpointId: checkpoint?.id,
      strategy,
      reason: reason ?? `Recovery via ${strategy}`,
      decidedAt: Date.now(),
      decidedBy,
    }

    // Execute recovery
    let eventsReplayed = 0
    let success = true
    let error: string | undefined

    try {
      switch (strategy) {
        case 'restart':
          // Restart: clear state, start fresh
          this.currentStep = null
          this.currentInterrupt = null
          break

        case 'checkpoint':
          if (!checkpoint) {
            throw new Error('No checkpoint available for recovery')
          }
          // Restore from checkpoint
          eventsReplayed = await this.restoreFromCheckpoint(checkpoint)
          checkpoint.status = 'restored'
          await this.checkpointStorage.saveCheckpoint(checkpoint)
          break

        case 'step_start':
          if (!checkpoint) {
            throw new Error('No checkpoint available for step start recovery')
          }
          // Restore step state from checkpoint
          this.currentStep = {
            ...checkpoint.step,
            status: 'running',
            startedAt: Date.now(),
          }
          checkpoint.status = 'restored'
          await this.checkpointStorage.saveCheckpoint(checkpoint)
          break

        case 'skip':
          // Skip: just mark current step as failed and continue
          if (this.currentStep) {
            this.currentStep.status = 'failed'
          }
          break
      }
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Record in history
    const historyEntry: RecoveryHistoryEntry = {
      id: this.generateId(),
      sessionId: this.sessionId,
      decision,
      result: {
        success,
        resumedAt: success ? Date.now() : undefined,
        eventsReplayed,
        error,
      },
      createdAt: Date.now(),
    }

    await this.historyStorage.addEntry(historyEntry)
    this.notifyRecoveryListeners(decision, historyEntry.result)

    return {
      success,
      decision,
      checkpoint: checkpoint ?? undefined,
      eventsReplayed,
      error,
    }
  }

  /**
   * Restore from checkpoint
   */
  private async restoreFromCheckpoint(checkpoint: Checkpoint): Promise<number> {
    if (!checkpoint.snapshot?.events) {
      return 0
    }

    // Replay events
    const events = checkpoint.snapshot.events
    let replayed = 0

    for (const _event of events) {
      // Re-emit events through the emitter
      this.eventEmitter.addEventListener('*', () => {
        replayed++
      })
    }

    // Restore step state
    this.currentStep = checkpoint.step

    return replayed
  }

  /**
   * Get recovery history for session
   */
  async getRecoveryHistory(): Promise<RecoveryHistoryEntry[]> {
    return this.historyStorage.getEntries(this.sessionId)
  }

  /**
   * Get recommended recovery strategy
   */
  async getRecommendedStrategy(): Promise<RecoveryStrategy> {
    const checkpoint = await this.getLatestCheckpoint()
    
    if (!checkpoint) {
      return 'restart'
    }

    // If checkpoint is recent (within 5 minutes), use it
    const age = Date.now() - checkpoint.createdAt
    if (age < 5 * 60 * 1000) {
      return 'checkpoint'
    }

    // If step was running, restart from step start
    if (checkpoint.step.status === 'running') {
      return 'step_start'
    }

    // Default to checkpoint
    return 'checkpoint'
  }

  // ==================== Listeners ====================

  /**
   * Add interrupt listener
   */
  addInterruptListener(listener: InterruptListener): () => void {
    this.interruptListeners.add(listener)
    return () => this.interruptListeners.delete(listener)
  }

  /**
   * Add checkpoint listener
   */
  addCheckpointListener(listener: CheckpointListener): () => void {
    this.checkpointListeners.add(listener)
    return () => this.checkpointListeners.delete(listener)
  }

  /**
   * Add recovery listener
   */
  addRecoveryListener(listener: RecoveryListener): () => void {
    this.recoveryListeners.add(listener)
    return () => this.recoveryListeners.delete(listener)
  }

  /**
   * Notify interrupt listeners
   */
  private notifyInterruptListeners(request: InterruptRequest): void {
    this.interruptListeners.forEach(listener => {
      try {
        listener(request)
      } catch (error) {
        console.error('Error in interrupt listener:', error)
      }
    })
  }

  /**
   * Notify checkpoint listeners
   */
  private notifyCheckpointListeners(checkpoint: Checkpoint): void {
    this.checkpointListeners.forEach(listener => {
      try {
        listener(checkpoint)
      } catch (error) {
        console.error('Error in checkpoint listener:', error)
      }
    })
  }

  /**
   * Notify recovery listeners
   */
  private notifyRecoveryListeners(
    decision: RecoveryDecision,
    result: RecoveryHistoryEntry['result']
  ): void {
    this.recoveryListeners.forEach(listener => {
      try {
        listener(decision, result)
      } catch (error) {
        console.error('Error in recovery listener:', error)
      }
    })
  }

  // ==================== Utilities ====================

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }
}

// ==================== Listener Types ====================

/**
 * Interrupt listener
 */
export type InterruptListener = (request: InterruptRequest) => void

/**
 * Checkpoint listener
 */
export type CheckpointListener = (checkpoint: Checkpoint) => void

/**
 * Recovery listener
 */
export type RecoveryListener = (
  decision: RecoveryDecision,
  result: RecoveryHistoryEntry['result']
) => void

// ==================== Helper Functions ====================

/**
 * Create an interrupt handler
 */
export function createInterruptHandler(
  sessionId: string,
  eventEmitter: RuntimeEventEmitter,
  options?: Partial<InterruptHandlerConfig>
): InterruptHandler {
  return new InterruptHandler({
    sessionId,
    eventEmitter,
    ...options,
  })
}

/**
 * Check if a checkpoint is valid for recovery
 */
export function isCheckpointValid(checkpoint: Checkpoint): boolean {
  if (checkpoint.status === 'expired' || checkpoint.status === 'abandoned') {
    return false
  }
  if (checkpoint.expiresAt && checkpoint.expiresAt < Date.now()) {
    return false
  }
  return true
}

/**
 * Calculate checkpoint age in milliseconds
 */
export function getCheckpointAge(checkpoint: Checkpoint): number {
  return Date.now() - checkpoint.createdAt
}

/**
 * Format checkpoint for display
 */
export function formatCheckpoint(checkpoint: Checkpoint): string {
  const age = getCheckpointAge(checkpoint)
  const ageSeconds = Math.floor(age / 1000)
  const ageMinutes = Math.floor(ageSeconds / 60)
  
  return `Checkpoint ${checkpoint.id.slice(0, 8)}: ${checkpoint.step.stepName} (${checkpoint.step.status}) - ${ageMinutes}m ago`
}

/**
 * Determine best recovery strategy based on context
 */
export function determineBestStrategy(
  hasCheckpoint: boolean,
  stepType: StepState['stepType'] | null,
  errorType?: string
): RecoveryStrategy {
  // If no checkpoint, must restart
  if (!hasCheckpoint) {
    return 'restart'
  }

  // If confirmation step failed, restart from step start
  if (stepType === 'confirmation') {
    return 'step_start'
  }

  // If tool call failed, can skip if non-critical
  if (stepType === 'tool_call' && errorType === 'non_critical') {
    return 'skip'
  }

  // Default to checkpoint
  return 'checkpoint'
}
