/**
 * Unit tests for Trace and Step Log module (Story 48.1)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type TraceId,
  type TraceStepStatus,
  type StepLogEntry,
  type TraceContext,
  type TraceSummary,
  type TraceStore,
  type SerializableTraceStore,
  
  // ID Generation
  generateTraceId,
  generateStepId,
  isValidTraceId,
  isValidStepId,
  
  // Trace Context
  createTraceContext,
  touchTraceContext,
  
  // Step Log
  createStepLogEntry,
  startStep,
  completeStep,
  failStep,
  skipStep,
  cancelStep,
  
  // Trace Store
  createTraceStore,
  registerTrace,
  addStepLog,
  updateStepLog,
  
  // Lookup
  getTraceContext,
  getSessionTraces,
  getTraceSteps,
  getStepById,
  getStepsByStatus,
  getStepsByType,
  
  // Summary
  generateTraceSummary,
  getTraceChain,
  
  // Serialization
  serializeTraceContext,
  deserializeTraceContext,
  serializeStepLogEntry,
  deserializeStepLogEntry,
  serializeTraceStore,
  deserializeTraceStore,
  
  // Debug
  formatTraceContext,
  formatStepLogEntry,
  formatTraceSummary,
} from '@/features/session/runtime/traceAndStepLog'

describe('Trace and Step Log', () => {
  describe('generateTraceId', () => {
    it('should generate a valid trace ID', () => {
      const traceId = generateTraceId()
      
      expect(traceId.id).toMatch(/^trace_\d+_[a-f0-9]{16}$/)
      expect(traceId.createdAt).toBeLessThanOrEqual(Date.now())
      expect(traceId.source).toBe('runtime')
    })
    
    it('should accept different sources', () => {
      const sources: Array<'runtime' | 'tool' | 'planner' | 'user'> = [
        'runtime', 'tool', 'planner', 'user'
      ]
      
      sources.forEach(source => {
        const traceId = generateTraceId(source)
        expect(traceId.source).toBe(source)
      })
    })
    
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateTraceId().id)
      }
      expect(ids.size).toBe(100)
    })
  })
  
  describe('generateStepId', () => {
    it('should generate a valid step ID', () => {
      const stepId = generateStepId()
      expect(stepId).toMatch(/^step_\d+_[a-f0-9]{12}$/)
    })
    
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateStepId())
      }
      expect(ids.size).toBe(100)
    })
  })
  
  describe('isValidTraceId', () => {
    it('should validate correct trace IDs', () => {
      const traceId = generateTraceId()
      expect(isValidTraceId(traceId.id)).toBe(true)
    })
    
    it('should reject invalid trace IDs', () => {
      expect(isValidTraceId('invalid')).toBe(false)
      expect(isValidTraceId('trace_invalid')).toBe(false)
      expect(isValidTraceId('step_123_abc')).toBe(false)
      expect(isValidTraceId('')).toBe(false)
    })
  })
  
  describe('isValidStepId', () => {
    it('should validate correct step IDs', () => {
      const stepId = generateStepId()
      expect(isValidStepId(stepId)).toBe(true)
    })
    
    it('should reject invalid step IDs', () => {
      expect(isValidStepId('invalid')).toBe(false)
      expect(isValidStepId('step_invalid')).toBe(false)
      expect(isValidStepId('trace_123_abc')).toBe(false)
      expect(isValidStepId('')).toBe(false)
    })
  })
  
  describe('createTraceContext', () => {
    it('should create a root trace context', () => {
      const context = createTraceContext('session-123')
      
      expect(context.sessionId).toBe('session-123')
      expect(context.traceId).toBeDefined()
      expect(context.parentTraceId).toBeUndefined()
      expect(context.rootTraceId).toBe(context.traceId)
      expect(context.depth).toBe(0)
      expect(context.path).toHaveLength(1)
      expect(context.path[0]).toBe(context.traceId)
      expect(context.createdAt).toBeLessThanOrEqual(Date.now())
      expect(context.updatedAt).toBe(context.createdAt)
    })
    
    it('should create a child trace context', () => {
      const parentContext = createTraceContext('session-123')
      const childContext = createTraceContext('session-123', {
        parentTraceId: parentContext.traceId
      })
      
      expect(childContext.parentTraceId).toBe(parentContext.traceId)
      expect(childContext.rootTraceId).toBe(parentContext.traceId)
      expect(childContext.depth).toBe(1)
      expect(childContext.path).toHaveLength(2)
      expect(childContext.path[0]).toBe(parentContext.traceId)
      expect(childContext.path[1]).toBe(childContext.traceId)
    })
    
    it('should accept custom source', () => {
      const context = createTraceContext('session-123', { source: 'tool' })
      expect(isValidTraceId(context.traceId)).toBe(true)
    })
  })
  
  describe('touchTraceContext', () => {
    it('should update the updatedAt timestamp', () => {
      const context = createTraceContext('session-123')
      const originalUpdatedAt = context.updatedAt
      
      // Wait a tiny bit to ensure timestamp difference
      const touched = touchTraceContext(context)
      
      expect(touched.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
      expect(touched.traceId).toBe(context.traceId)
    })
  })
  
  describe('createStepLogEntry', () => {
    it('should create a step log entry with required fields', () => {
      const traceId = generateTraceId()
      const entry = createStepLogEntry(
        traceId.id,
        'session-123',
        'tool',
        'test-step'
      )
      
      expect(entry.traceId).toBe(traceId.id)
      expect(entry.sessionId).toBe('session-123')
      expect(entry.stepType).toBe('tool')
      expect(entry.name).toBe('test-step')
      expect(entry.status).toBe('pending')
      expect(entry.stepId).toBeDefined()
      expect(entry.startedAt).toBeLessThanOrEqual(Date.now())
    })
    
    it('should accept optional fields', () => {
      const traceId = generateTraceId()
      const entry = createStepLogEntry(
        traceId.id,
        'session-123',
        'tool',
        'test-step',
        {
          parentStepId: 'parent-step',
          input: { foo: 'bar' },
          metadata: { key: 'value' }
        }
      )
      
      expect(entry.parentStepId).toBe('parent-step')
      expect(entry.input).toEqual({ foo: 'bar' })
      expect(entry.metadata).toEqual({ key: 'value' })
    })
  })
  
  describe('step status transitions', () => {
    let entry: StepLogEntry
    
    beforeEach(() => {
      const traceId = generateTraceId()
      entry = createStepLogEntry(
        traceId.id,
        'session-123',
        'tool',
        'test-step'
      )
    })
    
    it('should start a step', () => {
      const started = startStep(entry)
      expect(started.status).toBe('running')
      expect(started.startedAt).toBeLessThanOrEqual(Date.now())
    })
    
    it('should complete a step', () => {
      const started = startStep(entry)
      const completed = completeStep(started, { result: 'success' })
      
      expect(completed.status).toBe('completed')
      expect(completed.output).toEqual({ result: 'success' })
      expect(completed.completedAt).toBeDefined()
      expect(completed.duration).toBeDefined()
    })
    
    it('should fail a step', () => {
      const started = startStep(entry)
      const failed = failStep(started, 'Something went wrong')
      
      expect(failed.status).toBe('failed')
      expect(failed.error).toBe('Something went wrong')
      expect(failed.completedAt).toBeDefined()
      expect(failed.duration).toBeDefined()
    })
    
    it('should skip a step', () => {
      const skipped = skipStep(entry, 'Not needed')
      
      expect(skipped.status).toBe('skipped')
      expect(skipped.error).toBe('Not needed')
      expect(skipped.completedAt).toBeDefined()
      expect(skipped.duration).toBeDefined()
    })
    
    it('should cancel a step', () => {
      const started = startStep(entry)
      const cancelled = cancelStep(started, 'User cancelled')
      
      expect(cancelled.status).toBe('cancelled')
      expect(cancelled.error).toBe('User cancelled')
      expect(cancelled.completedAt).toBeDefined()
      expect(cancelled.duration).toBeDefined()
    })
  })
  
  describe('createTraceStore', () => {
    it('should create an empty trace store', () => {
      const store = createTraceStore()
      
      expect(store.traces.size).toBe(0)
      expect(store.steps.size).toBe(0)
      expect(store.traceIndex.size).toBe(0)
      expect(store.stepIndex.size).toBe(0)
    })
  })
  
  describe('registerTrace', () => {
    it('should register a trace context', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      const newStore = registerTrace(store, context)
      
      expect(newStore.traces.has(context.traceId)).toBe(true)
      expect(newStore.steps.has(context.traceId)).toBe(true)
      expect(newStore.traceIndex.has('session-123')).toBe(true)
      expect(newStore.traceIndex.get('session-123')).toContain(context.traceId)
    })
    
    it('should not mutate original store', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      const newStore = registerTrace(store, context)
      
      expect(store.traces.size).toBe(0)
      expect(newStore.traces.size).toBe(1)
    })
    
    it('should handle multiple traces per session', () => {
      const store = createTraceStore()
      const context1 = createTraceContext('session-123')
      const store2 = registerTrace(store, context1)
      const context2 = createTraceContext('session-123')
      const store3 = registerTrace(store2, context2)
      
      expect(store3.traceIndex.get('session-123')).toHaveLength(2)
    })
  })
  
  describe('addStepLog', () => {
    it('should add a step log entry', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      const store2 = registerTrace(store, context)
      
      const entry = createStepLogEntry(
        context.traceId,
        'session-123',
        'tool',
        'test-step'
      )
      const store3 = addStepLog(store2, entry)
      
      expect(store3.steps.get(context.traceId)).toHaveLength(1)
      expect(store3.stepIndex.has(entry.stepId)).toBe(true)
    })
    
    it('should handle multiple steps', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      let currentStore = registerTrace(store, context)
      
      for (let i = 0; i < 5; i++) {
        const entry = createStepLogEntry(
          context.traceId,
          'session-123',
          'tool',
          `step-${i}`
        )
        currentStore = addStepLog(currentStore, entry)
      }
      
      expect(currentStore.steps.get(context.traceId)).toHaveLength(5)
    })
  })
  
  describe('updateStepLog', () => {
    it('should update a step log entry', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      const store2 = registerTrace(store, context)
      
      const entry = createStepLogEntry(
        context.traceId,
        'session-123',
        'tool',
        'test-step'
      )
      const store3 = addStepLog(store2, entry)
      
      const store4 = updateStepLog(store3, entry.stepId, e => completeStep(e))
      
      const updated = getStepById(store4!, entry.stepId)
      expect(updated?.status).toBe('completed')
    })
    
    it('should return null for unknown step ID', () => {
      const store = createTraceStore()
      const result = updateStepLog(store, 'unknown-step', e => e)
      expect(result).toBeNull()
    })
  })
  
  describe('lookup functions', () => {
    let store: TraceStore
    let context: TraceContext
    let entry1: StepLogEntry
    let entry2: StepLogEntry
    
    beforeEach(() => {
      store = createTraceStore()
      context = createTraceContext('session-123')
      store = registerTrace(store, context)
      
      entry1 = createStepLogEntry(
        context.traceId,
        'session-123',
        'tool',
        'step-1'
      )
      store = addStepLog(store, entry1)
      store = updateStepLog(store, entry1.stepId, e => completeStep(e))!
      
      entry2 = createStepLogEntry(
        context.traceId,
        'session-123',
        'planning',
        'step-2'
      )
      store = addStepLog(store, entry2)
    })
    
    describe('getTraceContext', () => {
      it('should get trace context by ID', () => {
        const result = getTraceContext(store, context.traceId)
        expect(result).toEqual(context)
      })
      
      it('should return undefined for unknown trace ID', () => {
        const result = getTraceContext(store, 'unknown')
        expect(result).toBeUndefined()
      })
    })
    
    describe('getSessionTraces', () => {
      it('should get all traces for a session', () => {
        const traces = getSessionTraces(store, 'session-123')
        expect(traces).toHaveLength(1)
        expect(traces[0].traceId).toBe(context.traceId)
      })
      
      it('should return empty array for unknown session', () => {
        const traces = getSessionTraces(store, 'unknown')
        expect(traces).toHaveLength(0)
      })
    })
    
    describe('getTraceSteps', () => {
      it('should get all steps for a trace', () => {
        const steps = getTraceSteps(store, context.traceId)
        expect(steps).toHaveLength(2)
      })
      
      it('should return empty array for unknown trace', () => {
        const steps = getTraceSteps(store, 'unknown')
        expect(steps).toHaveLength(0)
      })
    })
    
    describe('getStepById', () => {
      it('should get a step by ID', () => {
        const result = getStepById(store, entry1.stepId)
        expect(result?.name).toBe('step-1')
      })
      
      it('should return undefined for unknown step ID', () => {
        const result = getStepById(store, 'unknown')
        expect(result).toBeUndefined()
      })
    })
    
    describe('getStepsByStatus', () => {
      it('should filter steps by status', () => {
        const completed = getStepsByStatus(store, context.traceId, 'completed')
        expect(completed).toHaveLength(1)
        expect(completed[0].name).toBe('step-1')
        
        const pending = getStepsByStatus(store, context.traceId, 'pending')
        expect(pending).toHaveLength(1)
        expect(pending[0].name).toBe('step-2')
      })
    })
    
    describe('getStepsByType', () => {
      it('should filter steps by type', () => {
        const tools = getStepsByType(store, context.traceId, 'tool')
        expect(tools).toHaveLength(1)
        expect(tools[0].name).toBe('step-1')
        
        const planning = getStepsByType(store, context.traceId, 'planning')
        expect(planning).toHaveLength(1)
        expect(planning[0].name).toBe('step-2')
      })
    })
  })
  
  describe('generateTraceSummary', () => {
    it('should generate a summary for a trace', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      let currentStore = registerTrace(store, context)
      
      // Add some steps
      const entry1 = createStepLogEntry(context.traceId, 'session-123', 'tool', 'step-1')
      currentStore = addStepLog(currentStore, entry1)
      currentStore = updateStepLog(currentStore, entry1.stepId, e => completeStep(e))!
      
      const entry2 = createStepLogEntry(context.traceId, 'session-123', 'tool', 'step-2')
      currentStore = addStepLog(currentStore, entry2)
      currentStore = updateStepLog(currentStore, entry2.stepId, e => failStep(e, 'Error'))!
      
      const entry3 = createStepLogEntry(context.traceId, 'session-123', 'tool', 'step-3')
      currentStore = addStepLog(currentStore, entry3)
      
      const summary = generateTraceSummary(currentStore, context.traceId)
      
      expect(summary).not.toBeNull()
      expect(summary!.traceId).toBe(context.traceId)
      expect(summary!.sessionId).toBe('session-123')
      expect(summary!.totalSteps).toBe(3)
      expect(summary!.completedSteps).toBe(1)
      expect(summary!.failedSteps).toBe(1)
      expect(summary!.pendingSteps).toBe(1)
      expect(summary!.status).toBe('partial')
    })
    
    it('should return null for unknown trace', () => {
      const store = createTraceStore()
      const summary = generateTraceSummary(store, 'unknown')
      expect(summary).toBeNull()
    })
    
    it('should mark as completed when all steps done', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      let currentStore = registerTrace(store, context)
      
      const entry = createStepLogEntry(context.traceId, 'session-123', 'tool', 'step-1')
      currentStore = addStepLog(currentStore, entry)
      currentStore = updateStepLog(currentStore, entry.stepId, e => completeStep(e))!
      
      const summary = generateTraceSummary(currentStore, context.traceId)
      expect(summary!.status).toBe('completed')
    })
    
    it('should mark as failed when all failed', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      let currentStore = registerTrace(store, context)
      
      const entry = createStepLogEntry(context.traceId, 'session-123', 'tool', 'step-1')
      currentStore = addStepLog(currentStore, entry)
      currentStore = updateStepLog(currentStore, entry.stepId, e => failStep(e, 'Error'))!
      
      const summary = generateTraceSummary(currentStore, context.traceId)
      expect(summary!.status).toBe('failed')
    })
    
    it('should mark as running when pending', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      let currentStore = registerTrace(store, context)
      
      const entry = createStepLogEntry(context.traceId, 'session-123', 'tool', 'step-1')
      currentStore = addStepLog(currentStore, entry)
      
      const summary = generateTraceSummary(currentStore, context.traceId)
      expect(summary!.status).toBe('running')
    })
  })
  
  describe('getTraceChain', () => {
    it('should get trace chain from root to current', () => {
      const store = createTraceStore()
      const rootContext = createTraceContext('session-123')
      let currentStore = registerTrace(store, rootContext)
      
      const childContext = createTraceContext('session-123', {
        parentTraceId: rootContext.traceId
      })
      currentStore = registerTrace(currentStore, childContext)
      
      const chain = getTraceChain(currentStore, childContext.traceId)
      
      expect(chain).toHaveLength(2)
      expect(chain[0].traceId).toBe(rootContext.traceId)
      expect(chain[1].traceId).toBe(childContext.traceId)
    })
    
    it('should return single item for root trace', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      const currentStore = registerTrace(store, context)
      
      const chain = getTraceChain(currentStore, context.traceId)
      expect(chain).toHaveLength(1)
    })
    
    it('should return empty array for unknown trace', () => {
      const store = createTraceStore()
      const chain = getTraceChain(store, 'unknown')
      expect(chain).toHaveLength(0)
    })
  })
  
  describe('serialization', () => {
    describe('serializeTraceContext / deserializeTraceContext', () => {
      it('should serialize and deserialize trace context', () => {
        const context = createTraceContext('session-123')
        const serialized = serializeTraceContext(context)
        const deserialized = deserializeTraceContext(serialized)
        
        expect(deserialized).toEqual(context)
      })
    })
    
    describe('serializeStepLogEntry / deserializeStepLogEntry', () => {
      it('should serialize and deserialize step log entry', () => {
        const traceId = generateTraceId()
        const entry = createStepLogEntry(traceId.id, 'session-123', 'tool', 'test-step')
        const serialized = serializeStepLogEntry(entry)
        const deserialized = deserializeStepLogEntry(serialized)
        
        expect(deserialized).toEqual(entry)
      })
    })
    
    describe('serializeTraceStore / deserializeTraceStore', () => {
      it('should serialize and deserialize trace store', () => {
        let store = createTraceStore()
        const context = createTraceContext('session-123')
        store = registerTrace(store, context)
        
        const entry = createStepLogEntry(context.traceId, 'session-123', 'tool', 'test-step')
        store = addStepLog(store, entry)
        
        const serialized = serializeTraceStore(store)
        const deserialized = deserializeTraceStore(serialized)
        
        expect(deserialized.traces.size).toBe(1)
        expect(deserialized.steps.size).toBe(1)
        expect(deserialized.traceIndex.size).toBe(1)
        expect(deserialized.stepIndex.size).toBe(1)
        
        const restoredContext = getTraceContext(deserialized, context.traceId)
        expect(restoredContext?.sessionId).toBe('session-123')
        
        const restoredSteps = getTraceSteps(deserialized, context.traceId)
        expect(restoredSteps).toHaveLength(1)
      })
    })
  })
  
  describe('debug formatters', () => {
    it('should format trace context', () => {
      const context = createTraceContext('session-123')
      const formatted = formatTraceContext(context)
      
      expect(formatted).toContain('TraceContext')
      expect(formatted).toContain(context.traceId)
      expect(formatted).toContain('session-123')
    })
    
    it('should format step log entry', () => {
      const traceId = generateTraceId()
      const entry = createStepLogEntry(traceId.id, 'session-123', 'tool', 'test-step')
      const formatted = formatStepLogEntry(entry)
      
      expect(formatted).toContain('StepLogEntry')
      expect(formatted).toContain(entry.stepId)
      expect(formatted).toContain('test-step')
    })
    
    it('should format trace summary', () => {
      const store = createTraceStore()
      const context = createTraceContext('session-123')
      const currentStore = registerTrace(store, context)
      
      const summary = generateTraceSummary(currentStore, context.traceId)
      const formatted = formatTraceSummary(summary!)
      
      expect(formatted).toContain('TraceSummary')
      expect(formatted).toContain(context.traceId)
    })
  })
})
