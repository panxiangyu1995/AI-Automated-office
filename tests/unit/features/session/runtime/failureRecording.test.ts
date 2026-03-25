/**
 * Unit tests for Failure and Result Recording Module (Story 48.3)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type ResultStatus,
  type FailureCategory,
  type RetryOutcomeStatus,
  type ReplanOutcomeStatus,
  type ImpactedStep,
  type FailureReason,
  type ResultSummary,
  type RetryOutcome,
  type ReplanOutcome,
  type TaskExecutionRecord,
  type ExecutionRecordStore,
  type ExecutionQueryOptions,
  type ExecutionStatistics,

  // Constants
  RECORD_ID_PREFIX,
  OUTCOME_ID_PREFIX,
  FAILURE_CATEGORIES,
  RESULT_STATUSES,
  RECOVERABLE_FAILURES,

  // ID Generation
  generateRecordId,
  generateOutcomeId,
  isValidRecordId,
  isValidOutcomeId,

  // Factory Functions
  createImpactedStep,
  createFailureReason,
  createExecutionResultSummary,
  createRetryOutcome,
  createReplanOutcome,
  createTaskExecutionRecord,

  // Status Update Functions
  markExecutionSuccess,
  markExecutionPartialSuccess,
  markExecutionFailure,
  markExecutionCancelled,
  markExecutionTimeout,
  markReplanTriggered,
  
  // Impacted Steps Management
  addImpactedStep,
  addImpactedSteps,
  
  // Retry Management
  addRetryOutcome,
  updateRetryOutcome,
  markRetrySucceeded,
  markRetryFailed,
  markRetryExhausted,
  
  // Replan Management
  addReplanOutcome,
  updateReplanOutcome,
  markReplanSucceeded,
  markReplanFailed,
  markReplanExhausted,
  
  // Store Functions
  createExecutionRecordStore,
  addExecutionRecord,
  updateExecutionRecord,
  getExecutionRecord,
  getSessionRecords,
  getTraceRecords,
  getTaskRecords,
  queryExecutionRecords,
  getRecordsByStatus,
  getFailedRecords,
  getRecoverableFailures,
  
  // Statistics
  calculateExecutionStatistics,
  
  // Serialization
  serializeExecutionRecord,
  deserializeExecutionRecord,
  serializeExecutionStore,
  deserializeExecutionStore,
  
  // Debug Formatting
  formatExecutionRecord,
  formatExecutionStatistics
} from '@/features/session/runtime/failureRecording'

describe('Failure and Result Recording', () => {
  // ============================================================================
  // ID Generation
  // ============================================================================
  
  describe('generateRecordId', () => {
    it('should generate a valid record ID', () => {
      const recordId = generateRecordId()
      expect(recordId).toMatch(/^exec_\d+_[a-f0-9]{16}$/)
    })
    
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateRecordId())
      }
      expect(ids.size).toBe(100)
    })
  })
  
  describe('generateOutcomeId', () => {
    it('should generate a valid outcome ID', () => {
      const outcomeId = generateOutcomeId()
      expect(outcomeId).toMatch(/^outcome_\d+_[a-f0-9]{8}$/)
    })
    
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateOutcomeId())
      }
      expect(ids.size).toBe(100)
    })
  })
  
  describe('isValidRecordId', () => {
    it('should validate correct record IDs', () => {
      const recordId = generateRecordId()
      expect(isValidRecordId(recordId)).toBe(true)
    })
    
    it('should reject invalid record IDs', () => {
      expect(isValidRecordId('invalid')).toBe(false)
      expect(isValidRecordId('exec_invalid')).toBe(false)
      expect(isValidRecordId('')).toBe(false)
    })
  })
  
  describe('isValidOutcomeId', () => {
    it('should validate correct outcome IDs', () => {
      const outcomeId = generateOutcomeId()
      expect(isValidOutcomeId(outcomeId)).toBe(true)
    })
    
    it('should reject invalid outcome IDs', () => {
      expect(isValidOutcomeId('invalid')).toBe(false)
      expect(isValidOutcomeId('outcome_invalid')).toBe(false)
      expect(isValidOutcomeId('')).toBe(false)
    })
  })
  
  // ============================================================================
  // Factory Functions
  // ============================================================================
  
  describe('createImpactedStep', () => {
    it('should create an impacted step with error', () => {
      const step = createImpactedStep('step-1', 'tool_call', 'Network error')
      expect(step.stepId).toBe('step-1')
      expect(step.stepType).toBe('tool_call')
      expect(step.error).toBe('Network error')
      expect(step.timestamp).toBeGreaterThan(0)
    })
    
    it('should create an impacted step without error', () => {
      const step = createImpactedStep('step-2', 'validation')
      expect(step.stepId).toBe('step-2')
      expect(step.stepType).toBe('validation')
      expect(step.error).toBeUndefined()
    })
  })
  
  describe('createFailureReason', () => {
    it('should create a failure reason with all options', () => {
      const reason = createFailureReason('tool_failure', 'Tool execution failed', {
        code: 'TOOL_ERROR',
        details: { toolName: 'testTool' },
        recoverable: true,
        suggestedAction: 'Retry the operation'
      })
      
      expect(reason.category).toBe('tool_failure')
      expect(reason.message).toBe('Tool execution failed')
      expect(reason.code).toBe('TOOL_ERROR')
      expect(reason.details).toEqual({ toolName: 'testTool' })
      expect(reason.recoverable).toBe(true)
      expect(reason.suggestedAction).toBe('Retry the operation')
    })
    
    it('should default recoverable based on category', () => {
      const recoverableReason = createFailureReason('tool_failure', 'Error')
      expect(recoverableReason.recoverable).toBe(true)
      
      const nonRecoverableReason = createFailureReason('permission_denied', 'Error')
      expect(nonRecoverableReason.recoverable).toBe(false)
    })
  })
  
  describe('createExecutionResultSummary', () => {
    it('should create a text result summary', () => {
      const result = createExecutionResultSummary('text', {
        outputValue: 'Task completed successfully',
        confidence: 0.95
      })
      
      expect(result.outputType).toBe('text')
      expect(result.outputValue).toBe('Task completed successfully')
      expect(result.confidence).toBe(0.95)
    })
    
    it('should create a structured result summary', () => {
      const result = createExecutionResultSummary('structured', {
        outputValue: { count: 10, items: ['a', 'b'] }
      })
      
      expect(result.outputType).toBe('structured')
      expect(result.outputValue).toEqual({ count: 10, items: ['a', 'b'] })
    })
    
    it('should create a none result summary', () => {
      const result = createExecutionResultSummary('none')
      expect(result.outputType).toBe('none')
      expect(result.outputValue).toBeUndefined()
    })
  })
  
  describe('createRetryOutcome', () => {
    it('should create a retry outcome with default status', () => {
      const outcome = createRetryOutcome(1)
      expect(outcome.attemptNumber).toBe(1)
      expect(outcome.status).toBe('pending')
      expect(isValidOutcomeId(outcome.outcomeId)).toBe(true)
      expect(outcome.startTime).toBeGreaterThan(0)
    })
    
    it('should create a retry outcome with specified status', () => {
      const outcome = createRetryOutcome(2, 'in_progress')
      expect(outcome.attemptNumber).toBe(2)
      expect(outcome.status).toBe('in_progress')
    })
  })
  
  describe('createReplanOutcome', () => {
    it('should create a replan outcome with default status', () => {
      const outcome = createReplanOutcome(1)
      expect(outcome.attemptNumber).toBe(1)
      expect(outcome.status).toBe('pending')
      expect(isValidOutcomeId(outcome.outcomeId)).toBe(true)
    })
    
    it('should create a replan outcome with specified status', () => {
      const outcome = createReplanOutcome(2, 'in_progress')
      expect(outcome.attemptNumber).toBe(2)
      expect(outcome.status).toBe('in_progress')
    })
  })
  
  describe('createTaskExecutionRecord', () => {
    it('should create a task execution record', () => {
      const record = createTaskExecutionRecord(
        'session-1',
        'trace-1',
        'task-1',
        'Test Task'
      )
      
      expect(isValidRecordId(record.recordId)).toBe(true)
      expect(record.sessionId).toBe('session-1')
      expect(record.traceId).toBe('trace-1')
      expect(record.taskId).toBe('task-1')
      expect(record.taskName).toBe('Test Task')
      expect(record.status).toBe('success')
      expect(record.impactedSteps).toEqual([])
      expect(record.retryOutcomes).toEqual([])
      expect(record.replanOutcomes).toEqual([])
    })
    
    it('should create a record with options', () => {
      const record = createTaskExecutionRecord(
        'session-1',
        'trace-1',
        'task-1',
        'Test Task',
        {
          taskDescription: 'A test task description',
          metadata: { priority: 'high' }
        }
      )
      
      expect(record.taskDescription).toBe('A test task description')
      expect(record.metadata).toEqual({ priority: 'high' })
    })
  })
  
  // ============================================================================
  // Status Update Functions
  // ============================================================================
  
  describe('markExecutionSuccess', () => {
    it('should mark a record as successful', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const result = createExecutionResultSummary('text', { outputValue: 'Done' })

      const updated = markExecutionSuccess(record, result)
      
      expect(updated.status).toBe('success')
      expect(updated.endTime).toBeGreaterThan(0)
      expect(updated.result).toEqual(result)
      expect(updated.updatedAt).toBeGreaterThanOrEqual(record.createdAt)
    })
    
    it('should mark a record as successful without result', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const updated = markExecutionSuccess(record)
      
      expect(updated.status).toBe('success')
      expect(updated.endTime).toBeGreaterThan(0)
      expect(updated.result).toBeUndefined()
    })
  })
  
  describe('markExecutionPartialSuccess', () => {
    it('should mark a record as partial success', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const result = createExecutionResultSummary('text', { outputValue: 'Partial' })
      const failure = createFailureReason('tool_failure', 'One step failed')
      
      const updated = markExecutionPartialSuccess(record, result, failure)
      
      expect(updated.status).toBe('partial_success')
      expect(updated.result).toEqual(result)
      expect(updated.failureReason).toEqual(failure)
    })
  })
  
  describe('markExecutionFailure', () => {
    it('should mark a record as failed', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const failure = createFailureReason('tool_failure', 'Tool crashed')
      const steps = [createImpactedStep('step-1', 'tool_call', 'Error')]

      const updated = markExecutionFailure(record, failure, steps)
      
      expect(updated.status).toBe('failure')
      expect(updated.failureReason).toEqual(failure)
      expect(updated.impactedSteps).toEqual(steps)
      expect(updated.endTime).toBeGreaterThan(0)
    })
    
    it('should use existing impacted steps if not provided', () => {
      const step = createImpactedStep('step-1', 'tool_call', 'Error')
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      record = addImpactedStep(record, step)

      const failure = createFailureReason('tool_failure', 'Tool crashed')
      const updated = markExecutionFailure(record, failure)
      
      expect(updated.impactedSteps).toHaveLength(1)
      expect(updated.impactedSteps[0]).toEqual(step)
    })
  })
  
  describe('markExecutionCancelled', () => {
    it('should mark a record as cancelled with reason', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const updated = markExecutionCancelled(record, 'User requested cancellation')
      
      expect(updated.status).toBe('cancelled')
      expect(updated.failureReason?.category).toBe('user_cancelled')
      expect(updated.failureReason?.message).toBe('User requested cancellation')
      expect(updated.failureReason?.recoverable).toBe(false)
    })
    
    it('should mark a record as cancelled without reason', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const updated = markExecutionCancelled(record)
      
      expect(updated.status).toBe('cancelled')
      expect(updated.failureReason).toBeUndefined()
    })
  })
  
  describe('markExecutionTimeout', () => {
    it('should mark a record as timed out', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const updated = markExecutionTimeout(record, 30000)
      
      expect(updated.status).toBe('timeout')
      expect(updated.failureReason?.category).toBe('timeout')
      expect(updated.failureReason?.message).toContain('30000ms')
      expect(updated.failureReason?.recoverable).toBe(true)
      expect(updated.failureReason?.suggestedAction).toBeDefined()
    })
  })
  
  describe('markReplanTriggered', () => {
    it('should mark a record as replan triggered', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const updated = markReplanTriggered(record, 'Tool failed, replanning')
      
      expect(updated.status).toBe('replan_triggered')
      expect(updated.failureReason?.message).toBe('Tool failed, replanning')
      expect(updated.failureReason?.recoverable).toBe(true)
    })
  })
  
  // ============================================================================
  // Impacted Steps Management
  // ============================================================================
  
  describe('addImpactedStep', () => {
    it('should add an impacted step', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const step = createImpactedStep('step-1', 'tool_call', 'Error')
      
      const updated = addImpactedStep(record, step)
      
      expect(updated.impactedSteps).toHaveLength(1)
      expect(updated.impactedSteps[0]).toEqual(step)
      expect(record.impactedSteps).toHaveLength(0) // Original unchanged
    })
  })
  
  describe('addImpactedSteps', () => {
    it('should add multiple impacted steps', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const steps = [
        createImpactedStep('step-1', 'tool_call', 'Error 1'),
        createImpactedStep('step-2', 'validation', 'Error 2')
      ]
      
      const updated = addImpactedSteps(record, steps)
      
      expect(updated.impactedSteps).toHaveLength(2)
    })
  })
  
  // ============================================================================
  // Retry Management
  // ============================================================================
  
  describe('addRetryOutcome', () => {
    it('should add a retry outcome', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createRetryOutcome(1)
      
      const updated = addRetryOutcome(record, outcome)
      
      expect(updated.retryOutcomes).toHaveLength(1)
      expect(updated.retryOutcomes[0]).toEqual(outcome)
    })
  })
  
  describe('updateRetryOutcome', () => {
    it('should update a retry outcome', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createRetryOutcome(1)
      record = addRetryOutcome(record, outcome)
      
      const updated = updateRetryOutcome(record, outcome.outcomeId, {
        status: 'in_progress'
      })
      
      expect(updated.retryOutcomes[0].status).toBe('in_progress')
    })
    
    it('should not modify record if outcome not found', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createRetryOutcome(1)
      record = addRetryOutcome(record, outcome)
      
      const updated = updateRetryOutcome(record, 'non-existent', {
        status: 'succeeded'
      })
      
      expect(updated.retryOutcomes[0].status).toBe('pending')
    })
  })
  
  describe('markRetrySucceeded', () => {
    it('should mark retry as succeeded', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createRetryOutcome(1)
      record = addRetryOutcome(record, outcome)
      const result = createExecutionResultSummary('text', { outputValue: 'Success' })
      
      const updated = markRetrySucceeded(record, outcome.outcomeId, result)
      
      expect(updated.retryOutcomes[0].status).toBe('succeeded')
      expect(updated.retryOutcomes[0].result).toEqual(result)
      expect(updated.retryOutcomes[0].endTime).toBeGreaterThan(0)
    })
  })
  
  describe('markRetryFailed', () => {
    it('should mark retry as failed', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createRetryOutcome(1)
      record = addRetryOutcome(record, outcome)
      const failure = createFailureReason('tool_failure', 'Still failing')
      
      const updated = markRetryFailed(record, outcome.outcomeId, failure)
      
      expect(updated.retryOutcomes[0].status).toBe('failed')
      expect(updated.retryOutcomes[0].failureReason).toEqual(failure)
    })
  })
  
  describe('markRetryExhausted', () => {
    it('should mark retry as exhausted', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createRetryOutcome(3)
      record = addRetryOutcome(record, outcome)
      
      const updated = markRetryExhausted(record, outcome.outcomeId)
      
      expect(updated.retryOutcomes[0].status).toBe('exhausted')
      expect(updated.retryOutcomes[0].endTime).toBeGreaterThan(0)
    })
  })
  
  // ============================================================================
  // Replan Management
  // ============================================================================
  
  describe('addReplanOutcome', () => {
    it('should add a replan outcome', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createReplanOutcome(1)
      
      const updated = addReplanOutcome(record, outcome)
      
      expect(updated.replanOutcomes).toHaveLength(1)
    })
  })
  
  describe('updateReplanOutcome', () => {
    it('should update a replan outcome', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createReplanOutcome(1)
      record = addReplanOutcome(record, outcome)
      
      const updated = updateReplanOutcome(record, outcome.outcomeId, {
        status: 'in_progress',
        revisedPlan: 'New plan'
      })
      
      expect(updated.replanOutcomes[0].status).toBe('in_progress')
      expect(updated.replanOutcomes[0].revisedPlan).toBe('New plan')
    })
  })
  
  describe('markReplanSucceeded', () => {
    it('should mark replan as succeeded', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createReplanOutcome(1)
      record = addReplanOutcome(record, outcome)
      const result = createExecutionResultSummary('text', { outputValue: 'Success' })
      
      const updated = markReplanSucceeded(record, outcome.outcomeId, 'Revised plan', result)
      
      expect(updated.replanOutcomes[0].status).toBe('succeeded')
      expect(updated.replanOutcomes[0].revisedPlan).toBe('Revised plan')
      expect(updated.replanOutcomes[0].result).toEqual(result)
    })
  })
  
  describe('markReplanFailed', () => {
    it('should mark replan as failed', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createReplanOutcome(1)
      record = addReplanOutcome(record, outcome)
      const failure = createFailureReason('internal_error', 'Replan failed')
      
      const updated = markReplanFailed(record, outcome.outcomeId, failure)
      
      expect(updated.replanOutcomes[0].status).toBe('failed')
      expect(updated.replanOutcomes[0].failureReason).toEqual(failure)
    })
  })
  
  describe('markReplanExhausted', () => {
    it('should mark replan as exhausted', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const outcome = createReplanOutcome(2)
      record = addReplanOutcome(record, outcome)
      
      const updated = markReplanExhausted(record, outcome.outcomeId)
      
      expect(updated.replanOutcomes[0].status).toBe('exhausted')
    })
  })
  
  // ============================================================================
  // Store Functions
  // ============================================================================
  
  describe('createExecutionRecordStore', () => {
    it('should create an empty store', () => {
      const store = createExecutionRecordStore()
      
      expect(store.records.size).toBe(0)
      expect(store.sessionIndex.size).toBe(0)
      expect(store.traceIndex.size).toBe(0)
    })
  })
  
  describe('addExecutionRecord', () => {
    it('should add a record to the store', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      
      const newStore = addExecutionRecord(store, record)
      
      expect(newStore.records.size).toBe(1)
      expect(newStore.records.get(record.recordId)).toEqual(record)
      expect(newStore.sessionIndex.get('s1')?.has(record.recordId)).toBe(true)
      expect(newStore.traceIndex.get('t1')?.has(record.recordId)).toBe(true)
    })
    
    it('should not modify original store', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      
      addExecutionRecord(store, record)
      
      expect(store.records.size).toBe(0) // Original unchanged
    })
  })
  
  describe('updateExecutionRecord', () => {
    it('should update an existing record', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      let currentStore = addExecutionRecord(store, record)
      
      const updatedRecord = markExecutionSuccess(record)
      currentStore = updateExecutionRecord(currentStore, updatedRecord)
      
      expect(currentStore.records.get(record.recordId)?.status).toBe('success')
    })
    
    it('should not add a record if it does not exist', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      
      const newStore = updateExecutionRecord(store, record)
      
      expect(newStore.records.size).toBe(0)
    })
  })
  
  describe('getExecutionRecord', () => {
    it('should get a record by ID', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const currentStore = addExecutionRecord(store, record)
      
      const retrieved = getExecutionRecord(currentStore, record.recordId)
      
      expect(retrieved).toEqual(record)
    })
    
    it('should return undefined for non-existent record', () => {
      const store = createExecutionRecordStore()
      
      const retrieved = getExecutionRecord(store, 'non-existent')
      
      expect(retrieved).toBeUndefined()
    })
  })
  
  describe('getSessionRecords', () => {
    it('should get records by session ID', () => {
      const store = createExecutionRecordStore()
      const record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      const record2 = createTaskExecutionRecord('s1', 't2', 'task-2', 'Task 2')
      const record3 = createTaskExecutionRecord('s2', 't3', 'task-3', 'Task 3')
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      currentStore = addExecutionRecord(currentStore, record3)
      
      const records = getSessionRecords(currentStore, 's1')
      
      expect(records).toHaveLength(2)
      expect(records.map(r => r.taskId)).toEqual(expect.arrayContaining(['task-1', 'task-2']))
    })
    
    it('should return empty array for non-existent session', () => {
      const store = createExecutionRecordStore()
      
      const records = getSessionRecords(store, 'non-existent')
      
      expect(records).toEqual([])
    })
  })
  
  describe('getTraceRecords', () => {
    it('should get records by trace ID', () => {
      const store = createExecutionRecordStore()
      const record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      const record2 = createTaskExecutionRecord('s2', 't1', 'task-2', 'Task 2')
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      
      const records = getTraceRecords(currentStore, 't1')
      
      expect(records).toHaveLength(2)
    })
  })
  
  describe('getTaskRecords', () => {
    it('should get records by task ID', () => {
      const store = createExecutionRecordStore()
      const record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      const record2 = createTaskExecutionRecord('s2', 't2', 'task-1', 'Task 1')
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      
      const records = getTaskRecords(currentStore, 'task-1')
      
      expect(records).toHaveLength(2)
    })
  })
  
  describe('queryExecutionRecords', () => {
    let store: ExecutionRecordStore
    let record1: TaskExecutionRecord
    let record2: TaskExecutionRecord
    let record3: TaskExecutionRecord
    
    beforeEach(() => {
      store = createExecutionRecordStore()
      record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      record1 = markExecutionSuccess(record1)
      
      record2 = createTaskExecutionRecord('s1', 't2', 'task-2', 'Task 2')
      record2 = markExecutionFailure(record2, createFailureReason('tool_failure', 'Failed'))
      
      record3 = createTaskExecutionRecord('s2', 't3', 'task-3', 'Task 3')
      record3 = markExecutionTimeout(record3, 30000)
      
      store = addExecutionRecord(store, record1)
      store = addExecutionRecord(store, record2)
      store = addExecutionRecord(store, record3)
    })
    
    it('should filter by session ID', () => {
      const records = queryExecutionRecords(store, { sessionId: 's1' })
      expect(records).toHaveLength(2)
    })
    
    it('should filter by trace ID', () => {
      const records = queryExecutionRecords(store, { traceId: 't1' })
      expect(records).toHaveLength(1)
      expect(records[0].taskId).toBe('task-1')
    })
    
    it('should filter by task ID', () => {
      const records = queryExecutionRecords(store, { taskId: 'task-2' })
      expect(records).toHaveLength(1)
    })
    
    it('should filter by status', () => {
      const records = queryExecutionRecords(store, { status: 'failure' })
      expect(records).toHaveLength(1)
      expect(records[0].taskId).toBe('task-2')
    })
    
    it('should filter by multiple statuses', () => {
      const records = queryExecutionRecords(store, { 
        status: ['failure', 'timeout'] 
      })
      expect(records).toHaveLength(2)
    })
    
    it('should filter by failure category', () => {
      const records = queryExecutionRecords(store, { 
        failureCategory: 'tool_failure' 
      })
      expect(records).toHaveLength(1)
      expect(records[0].taskId).toBe('task-2')
    })
    
    it('should apply pagination', () => {
      const records = queryExecutionRecords(store, { limit: 2 })
      expect(records).toHaveLength(2)
      
      const records2 = queryExecutionRecords(store, { limit: 2, offset: 2 })
      expect(records2).toHaveLength(1)
    })
  })
  
  describe('getRecordsByStatus', () => {
    it('should get records by status', () => {
      const store = createExecutionRecordStore()
      let record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      record1 = markExecutionSuccess(record1)
      
      let record2 = createTaskExecutionRecord('s2', 't2', 'task-2', 'Task 2')
      record2 = markExecutionFailure(record2, createFailureReason('tool_failure', 'Failed'))
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      
      const successRecords = getRecordsByStatus(currentStore, 'success')
      expect(successRecords).toHaveLength(1)
      
      const failureRecords = getRecordsByStatus(currentStore, 'failure')
      expect(failureRecords).toHaveLength(1)
    })
  })
  
  describe('getFailedRecords', () => {
    it('should get failed and timed out records', () => {
      const store = createExecutionRecordStore()
      let record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      record1 = markExecutionSuccess(record1)
      
      let record2 = createTaskExecutionRecord('s2', 't2', 'task-2', 'Task 2')
      record2 = markExecutionFailure(record2, createFailureReason('tool_failure', 'Failed'))
      
      let record3 = createTaskExecutionRecord('s3', 't3', 'task-3', 'Task 3')
      record3 = markExecutionTimeout(record3, 30000)
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      currentStore = addExecutionRecord(currentStore, record3)
      
      const failedRecords = getFailedRecords(currentStore)
      expect(failedRecords).toHaveLength(2)
    })
  })
  
  describe('getRecoverableFailures', () => {
    it('should get recoverable failure records', () => {
      const store = createExecutionRecordStore()
      
      let record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      record1 = markExecutionFailure(record1, createFailureReason('tool_failure', 'Recoverable'))
      
      let record2 = createTaskExecutionRecord('s2', 't2', 'task-2', 'Task 2')
      record2 = markExecutionFailure(record2, createFailureReason('permission_denied', 'Not recoverable'))
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      
      const recoverable = getRecoverableFailures(currentStore)
      expect(recoverable).toHaveLength(1)
      expect(recoverable[0].taskId).toBe('task-1')
    })
  })
  
  // ============================================================================
  // Statistics
  // ============================================================================
  
  describe('calculateExecutionStatistics', () => {
    it('should calculate statistics for empty store', () => {
      const store = createExecutionRecordStore()
      const stats = calculateExecutionStatistics(store)
      
      expect(stats.totalRecords).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.failureRate).toBe(0)
    })
    
    it('should calculate statistics for records', () => {
      const store = createExecutionRecordStore()
      
      // Success
      let record1 = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task 1')
      record1 = markExecutionSuccess(record1)
      
      // Failure
      let record2 = createTaskExecutionRecord('s2', 't2', 'task-2', 'Task 2')
      record2 = markExecutionFailure(record2, createFailureReason('tool_failure', 'Failed'))
      
      // Timeout
      let record3 = createTaskExecutionRecord('s3', 't3', 'task-3', 'Task 3')
      record3 = markExecutionTimeout(record3, 30000)
      
      let currentStore = addExecutionRecord(store, record1)
      currentStore = addExecutionRecord(currentStore, record2)
      currentStore = addExecutionRecord(currentStore, record3)
      
      const stats = calculateExecutionStatistics(currentStore)
      
      expect(stats.totalRecords).toBe(3)
      expect(stats.byStatus.success).toBe(1)
      expect(stats.byStatus.failure).toBe(1)
      expect(stats.byStatus.timeout).toBe(1)
      expect(stats.byFailureCategory.tool_failure).toBe(1)
      expect(stats.byFailureCategory.timeout).toBe(1)
      expect(stats.successRate).toBeCloseTo(1/3)
      expect(stats.failureRate).toBeCloseTo(2/3)
    })
    
    it('should calculate retry and replan success rates', () => {
      const store = createExecutionRecordStore()
      
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      
      // Add retry outcome
      const retry = createRetryOutcome(1)
      record = addRetryOutcome(record, retry)
      record = markRetrySucceeded(record, retry.outcomeId)
      
      // Add replan outcome
      const replan = createReplanOutcome(1)
      record = addReplanOutcome(record, replan)
      record = markReplanFailed(record, replan.outcomeId)
      
      record = markExecutionSuccess(record)
      
      const currentStore = addExecutionRecord(store, record)
      const stats = calculateExecutionStatistics(currentStore)
      
      expect(stats.retrySuccessRate).toBe(1)
      expect(stats.replanSuccessRate).toBe(0)
    })
  })
  
  // ============================================================================
  // Serialization
  // ============================================================================
  
  describe('serializeExecutionRecord', () => {
    it('should serialize a record to JSON', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const serialized = serializeExecutionRecord(record)
      
      const parsed = JSON.parse(serialized)
      expect(parsed.recordId).toBe(record.recordId)
      expect(parsed.sessionId).toBe('s1')
    })
  })
  
  describe('deserializeExecutionRecord', () => {
    it('should deserialize a record from JSON', () => {
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const serialized = serializeExecutionRecord(record)
      const deserialized = deserializeExecutionRecord(serialized)
      
      expect(deserialized.recordId).toBe(record.recordId)
      expect(deserialized.sessionId).toBe('s1')
      expect(deserialized.traceId).toBe('t1')
    })
  })
  
  describe('serializeExecutionStore', () => {
    it('should serialize a store to JSON', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const currentStore = addExecutionRecord(store, record)
      
      const serialized = serializeExecutionStore(currentStore)
      const parsed = JSON.parse(serialized)
      
      expect(parsed.records).toHaveLength(1)
    })
  })
  
  describe('deserializeExecutionStore', () => {
    it('should deserialize a store from JSON', () => {
      const store = createExecutionRecordStore()
      const record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      const currentStore = addExecutionRecord(store, record)
      
      const serialized = serializeExecutionStore(currentStore)
      const deserialized = deserializeExecutionStore(serialized)
      
      expect(deserialized.records.size).toBe(1)
      expect(deserialized.sessionIndex.size).toBe(1)
      expect(deserialized.traceIndex.size).toBe(1)
    })
  })
  
  // ============================================================================
  // Debug Formatting
  // ============================================================================
  
  describe('formatExecutionRecord', () => {
    it('should format a record for debugging', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Test Task')
      record = markExecutionSuccess(record, createExecutionResultSummary('text', { outputValue: 'Done' }))
      
      const formatted = formatExecutionRecord(record)
      
      expect(formatted).toContain('Execution Record:')
      expect(formatted).toContain('Test Task')
      expect(formatted).toContain('Status: success')
      expect(formatted).toContain('Result Type: text')
    })
    
    it('should include failure information', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      record = markExecutionFailure(record, createFailureReason('tool_failure', 'Tool crashed'))
      
      const formatted = formatExecutionRecord(record)
      
      expect(formatted).toContain('Failure: [tool_failure]')
      expect(formatted).toContain('Tool crashed')
    })
    
    it('should include impacted steps', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      record = addImpactedStep(record, createImpactedStep('step-1', 'tool_call', 'Error'))
      record = markExecutionFailure(record, createFailureReason('tool_failure', 'Failed'))
      
      const formatted = formatExecutionRecord(record)
      
      expect(formatted).toContain('Impacted Steps: 1')
      expect(formatted).toContain('step-1')
    })
    
    it('should include retry and replan information', () => {
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      record = addRetryOutcome(record, createRetryOutcome(1))
      record = addReplanOutcome(record, createReplanOutcome(1))
      
      const formatted = formatExecutionRecord(record)
      
      expect(formatted).toContain('Retries: 1')
      expect(formatted).toContain('Replans: 1')
    })
  })
  
  describe('formatExecutionStatistics', () => {
    it('should format statistics for debugging', () => {
      const store = createExecutionRecordStore()
      let record = createTaskExecutionRecord('s1', 't1', 'task-1', 'Task')
      record = markExecutionSuccess(record)
      const currentStore = addExecutionRecord(store, record)
      
      const stats = calculateExecutionStatistics(currentStore)
      const formatted = formatExecutionStatistics(stats)
      
      expect(formatted).toContain('Execution Statistics:')
      expect(formatted).toContain('Total Records: 1')
      expect(formatted).toContain('Success Rate:')
    })
  })
})
