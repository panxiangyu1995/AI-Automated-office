/**
 * Unit tests for Tool Audit Log module (Story 48.2)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type AuditStatus,
  type PermissionOutcome,
  type ConfirmationOutcome,
  type ToolInputSummary,
  type ToolResultSummary,
  type ToolAuditEntry,
  type AuditLogStore,
  type AuditQueryOptions,
  type AuditStatistics,
  type SerializableAuditLogStore,
  
  // ID Generation
  generateToolAuditId,
  isValidAuditId,
  
  // Input/Output Summary
  isSensitiveParameter,
  createInputSummary,
  createResultSummary,
  
  // Permission and Confirmation
  createPermissionOutcome,
  createConfirmationOutcome,
  
  // Audit Entry Functions
  createToolAuditEntry,
  markExecuting,
  markSuccess,
  markFailure,
  markPermissionDenied,
  markConfirmationRejected,
  markTimeout,
  markCancelled,
  
  // Audit Store Functions
  createAuditLogStore,
  addAuditEntry,
  updateAuditEntry,
  
  // Query Functions
  getAuditEntry,
  getSessionAuditEntries,
  getTraceAuditEntries,
  getToolAuditEntries,
  queryAuditEntries,
  getEntriesByStatus,
  
  // Statistics
  calculateAuditStatistics,
  
  // Governance
  getGovernanceTaggedEntries,
  getEntriesByRetentionCategory,
  
  // Serialization
  serializeAuditEntry,
  deserializeAuditEntry,
  serializeAuditLogStore,
  deserializeAuditLogStore,
  
  // Debug
  formatAuditEntry,
  formatAuditStatistics,
} from '@/features/session/runtime/toolAuditLog'

describe('Tool Audit Log', () => {
  describe('generateToolAuditId', () => {
    it('should generate a valid audit ID', () => {
      const auditId = generateToolAuditId()
      expect(auditId).toMatch(/^audit_\d+_[a-f0-9]{16}$/)
    })
    
    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateToolAuditId())
      }
      expect(ids.size).toBe(100)
    })
  })
  
  describe('isValidAuditId', () => {
    it('should validate correct audit IDs', () => {
      const auditId = generateToolAuditId()
      expect(isValidAuditId(auditId)).toBe(true)
    })
    
    it('should reject invalid audit IDs', () => {
      expect(isValidAuditId('invalid')).toBe(false)
      expect(isValidAuditId('audit_invalid')).toBe(false)
      expect(isValidAuditId('')).toBe(false)
    })
  })
  
  describe('isSensitiveParameter', () => {
    it('should detect sensitive parameter names', () => {
      expect(isSensitiveParameter('password')).toBe(true)
      expect(isSensitiveParameter('secret')).toBe(true)
      expect(isSensitiveParameter('token')).toBe(true)
      expect(isSensitiveParameter('apiKey')).toBe(true)
      expect(isSensitiveParameter('credential')).toBe(true)
      expect(isSensitiveParameter('auth')).toBe(true)
    })
    
    it('should not flag non-sensitive parameter names', () => {
      expect(isSensitiveParameter('name')).toBe(false)
      expect(isSensitiveParameter('email')).toBe(false)
      expect(isSensitiveParameter('count')).toBe(false)
      expect(isSensitiveParameter('data')).toBe(false)
    })
    
    it('should be case-insensitive', () => {
      expect(isSensitiveParameter('PASSWORD')).toBe(true)
      expect(isSensitiveParameter('Secret')).toBe(true)
      expect(isSensitiveParameter('AUTH_TOKEN')).toBe(true)
    })
  })
  
  describe('createInputSummary', () => {
    it('should create an input summary', () => {
      const summary = createInputSummary('testTool', 'tool-123', { count: 5 })
      
      expect(summary.toolName).toBe('testTool')
      expect(summary.toolId).toBe('tool-123')
      expect(summary.parameterCount).toBe(1)
      expect(summary.hasSensitiveData).toBe(false)
    })
    
    it('should detect sensitive parameters', () => {
      const summary = createInputSummary('testTool', 'tool-123', {
        name: 'test',
        password: 'secret123'
      })
      
      expect(summary.hasSensitiveData).toBe(true)
      expect(summary.parameters).toBeUndefined()
    })
    
    it('should truncate long parameters', () => {
      const longValue = 'x'.repeat(500)
      const summary = createInputSummary('testTool', 'tool-123', { data: longValue })
      
      expect(summary.truncatedParameters).toBeDefined()
      expect(summary.truncatedParameters!.length).toBeLessThan(300)
    })
  })
  
  describe('createResultSummary', () => {
    it('should create a success result summary', () => {
      const summary = createResultSummary({ data: 'test' })
      
      expect(summary.success).toBe(true)
      expect(summary.resultType).toBe('data')
      expect(summary.resultSize).toBeDefined()
    })
    
    it('should create an error result summary', () => {
      const summary = createResultSummary(undefined, {
        code: 'ERR001',
        message: 'Test error'
      })
      
      expect(summary.success).toBe(false)
      expect(summary.resultType).toBe('error')
      expect(summary.error).toBeDefined()
      expect(summary.error!.code).toBe('ERR001')
    })
    
    it('should create an empty result summary', () => {
      const summary = createResultSummary(null)
      
      expect(summary.success).toBe(true)
      expect(summary.resultType).toBe('empty')
    })
    
    it('should include duration', () => {
      const summary = createResultSummary({ data: 'test' }, undefined, 150)
      
      expect(summary.duration).toBe(150)
    })
  })
  
  describe('createPermissionOutcome', () => {
    it('should create a granted permission outcome', () => {
      const outcome = createPermissionOutcome(true, 'perm-123')
      
      expect(outcome.granted).toBe(true)
      expect(outcome.permissionId).toBe('perm-123')
      expect(outcome.requestedAt).toBeDefined()
      expect(outcome.resolvedAt).toBeDefined()
    })
    
    it('should create a denied permission outcome with reason', () => {
      const outcome = createPermissionOutcome(false, 'perm-123', 'Insufficient privileges')
      
      expect(outcome.granted).toBe(false)
      expect(outcome.reason).toBe('Insufficient privileges')
    })
  })
  
  describe('createConfirmationOutcome', () => {
    it('should create a confirmed outcome', () => {
      const outcome = createConfirmationOutcome(true, 'conf-123', 'yes')
      
      expect(outcome.confirmed).toBe(true)
      expect(outcome.confirmationId).toBe('conf-123')
      expect(outcome.userResponse).toBe('yes')
    })
    
    it('should create a rejected outcome with reason', () => {
      const outcome = createConfirmationOutcome(false, 'conf-123', undefined, 'User cancelled')
      
      expect(outcome.confirmed).toBe(false)
      expect(outcome.reason).toBe('User cancelled')
    })
  })
  
  describe('createToolAuditEntry', () => {
    it('should create a tool audit entry', () => {
      const entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'core',
        { sessionId: 'session-123' }
      )
      
      expect(entry.traceId).toBe('trace-123')
      expect(entry.sessionId).toBe('session-123')
      expect(entry.toolName).toBe('testTool')
      expect(entry.toolId).toBe('tool-123')
      expect(entry.toolType).toBe('core')
      expect(entry.status).toBe('pending')
      expect(entry.auditId).toBeDefined()
      expect(entry.createdAt).toBeLessThanOrEqual(Date.now())
    })
    
    it('should accept optional fields', () => {
      const entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'plugin',
        { sessionId: 'session-123', userId: 'user-1', tenantId: 'tenant-1' },
        {
          stepId: 'step-1',
          taskId: 'task-1',
          parameters: { count: 5 },
          metadata: { key: 'value' },
          governanceTags: ['sensitive'],
          retentionCategory: 'critical'
        }
      )
      
      expect(entry.stepId).toBe('step-1')
      expect(entry.taskId).toBe('task-1')
      expect(entry.input.parameterCount).toBe(1)
      expect(entry.metadata).toEqual({ key: 'value' })
      expect(entry.governanceTags).toContain('sensitive')
      expect(entry.retentionCategory).toBe('critical')
      expect(entry.actor.userId).toBe('user-1')
      expect(entry.actor.tenantId).toBe('tenant-1')
    })
  })
  
  describe('audit entry status transitions', () => {
    let entry: ToolAuditEntry
    
    beforeEach(() => {
      entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'core',
        { sessionId: 'session-123' }
      )
    })
    
    it('should mark as executing', () => {
      const executing = markExecuting(entry)
      expect(executing.status).toBe('executing')
      expect(executing.startedAt).toBeDefined()
    })
    
    it('should mark as success', () => {
      const executing = markExecuting(entry)
      const success = markSuccess(executing, { result: 'done' })
      
      expect(success.status).toBe('success')
      expect(success.completedAt).toBeDefined()
      expect(success.duration).toBeDefined()
      expect(success.result?.success).toBe(true)
    })
    
    it('should mark as failure', () => {
      const executing = markExecuting(entry)
      const failed = markFailure(executing, {
        code: 'ERR001',
        message: 'Test error'
      })
      
      expect(failed.status).toBe('failure')
      expect(failed.completedAt).toBeDefined()
      expect(failed.result?.error).toBeDefined()
    })
    
    it('should mark as permission denied', () => {
      const permissionOutcome = createPermissionOutcome(false, 'perm-123', 'Denied')
      const denied = markPermissionDenied(entry, permissionOutcome)
      
      expect(denied.status).toBe('permission_denied')
      expect(denied.permissionOutcome).toBeDefined()
      expect(denied.permissionOutcome!.granted).toBe(false)
    })
    
    it('should mark as confirmation rejected', () => {
      const confirmationOutcome = createConfirmationOutcome(false, 'conf-123', undefined, 'Rejected')
      const rejected = markConfirmationRejected(entry, confirmationOutcome)
      
      expect(rejected.status).toBe('confirmation_rejected')
      expect(rejected.confirmationOutcome).toBeDefined()
      expect(rejected.confirmationOutcome!.confirmed).toBe(false)
    })
    
    it('should mark as timeout', () => {
      const executing = markExecuting(entry)
      const timedOut = markTimeout(executing)
      
      expect(timedOut.status).toBe('timeout')
      expect(timedOut.completedAt).toBeDefined()
    })
    
    it('should mark as cancelled', () => {
      const cancelled = markCancelled(entry, 'User cancelled')
      
      expect(cancelled.status).toBe('cancelled')
      expect(cancelled.completedAt).toBeDefined()
      expect(cancelled.metadata?.cancelReason).toBe('User cancelled')
    })
  })
  
  describe('createAuditLogStore', () => {
    it('should create an empty audit log store', () => {
      const store = createAuditLogStore()
      
      expect(store.entries.size).toBe(0)
      expect(store.sessionIndex.size).toBe(0)
      expect(store.toolIndex.size).toBe(0)
      expect(store.traceIndex.size).toBe(0)
    })
  })
  
  describe('addAuditEntry', () => {
    it('should add an audit entry', () => {
      const store = createAuditLogStore()
      const entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'core',
        { sessionId: 'session-123' }
      )
      const newStore = addAuditEntry(store, entry)
      
      expect(newStore.entries.has(entry.auditId)).toBe(true)
      expect(newStore.sessionIndex.has('session-123')).toBe(true)
      expect(newStore.toolIndex.has('tool-123')).toBe(true)
      expect(newStore.traceIndex.has('trace-123')).toBe(true)
    })
    
    it('should not mutate original store', () => {
      const store = createAuditLogStore()
      const entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'core',
        { sessionId: 'session-123' }
      )
      const newStore = addAuditEntry(store, entry)
      
      expect(store.entries.size).toBe(0)
      expect(newStore.entries.size).toBe(1)
    })
  })
  
  describe('updateAuditEntry', () => {
    it('should update an audit entry', () => {
      const store = createAuditLogStore()
      const entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'core',
        { sessionId: 'session-123' }
      )
      const store2 = addAuditEntry(store, entry)
      
      const store3 = updateAuditEntry(store2, entry.auditId, e => markSuccess(e, { result: 'done' }))
      
      const updated = getAuditEntry(store3!, entry.auditId)
      expect(updated?.status).toBe('success')
    })
    
    it('should return null for unknown audit ID', () => {
      const store = createAuditLogStore()
      const result = updateAuditEntry(store, 'unknown', e => e)
      expect(result).toBeNull()
    })
  })
  
  describe('query functions', () => {
    let store: AuditLogStore
    let entry1: ToolAuditEntry
    let entry2: ToolAuditEntry
    
    beforeEach(() => {
      store = createAuditLogStore()
      
      entry1 = createToolAuditEntry(
        'trace-123',
        'session-123',
        'tool1',
        'tool-1',
        'core',
        { sessionId: 'session-123', userId: 'user-1', tenantId: 'tenant-1' }
      )
      store = addAuditEntry(store, entry1)
      store = updateAuditEntry(store, entry1.auditId, e => markSuccess(e, { result: 'done' }))!
      
      entry2 = createToolAuditEntry(
        'trace-456',
        'session-123',
        'tool2',
        'tool-2',
        'plugin',
        { sessionId: 'session-123', userId: 'user-2' }
      )
      store = addAuditEntry(store, entry2)
    })
    
    describe('getAuditEntry', () => {
      it('should get an audit entry by ID', () => {
        const result = getAuditEntry(store, entry1.auditId)
        expect(result).toEqual(expect.objectContaining({ auditId: entry1.auditId }))
      })
      
      it('should return undefined for unknown ID', () => {
        const result = getAuditEntry(store, 'unknown')
        expect(result).toBeUndefined()
      })
    })
    
    describe('getSessionAuditEntries', () => {
      it('should get all entries for a session', () => {
        const entries = getSessionAuditEntries(store, 'session-123')
        expect(entries).toHaveLength(2)
      })
      
      it('should return empty array for unknown session', () => {
        const entries = getSessionAuditEntries(store, 'unknown')
        expect(entries).toHaveLength(0)
      })
    })
    
    describe('getTraceAuditEntries', () => {
      it('should get all entries for a trace', () => {
        const entries = getTraceAuditEntries(store, 'trace-123')
        expect(entries).toHaveLength(1)
        expect(entries[0].traceId).toBe('trace-123')
      })
    })
    
    describe('getToolAuditEntries', () => {
      it('should get all entries for a tool', () => {
        const entries = getToolAuditEntries(store, 'tool-1')
        expect(entries).toHaveLength(1)
        expect(entries[0].toolId).toBe('tool-1')
      })
    })
    
    describe('queryAuditEntries', () => {
      it('should filter by status', () => {
        const entries = queryAuditEntries(store, { status: 'success' })
        expect(entries).toHaveLength(1)
        expect(entries[0].status).toBe('success')
      })
      
      it('should filter by tool name', () => {
        const entries = queryAuditEntries(store, { toolName: 'tool1' })
        expect(entries).toHaveLength(1)
        expect(entries[0].toolName).toBe('tool1')
      })
      
      it('should filter by user', () => {
        const entries = queryAuditEntries(store, { userId: 'user-1' })
        expect(entries).toHaveLength(1)
        expect(entries[0].actor.userId).toBe('user-1')
      })
      
      it('should filter by tenant', () => {
        const entries = queryAuditEntries(store, { tenantId: 'tenant-1' })
        expect(entries).toHaveLength(1)
      })
      
      it('should support pagination', () => {
        const page1 = queryAuditEntries(store, { limit: 1 })
        const page2 = queryAuditEntries(store, { limit: 1, offset: 1 })
        
        expect(page1).toHaveLength(1)
        expect(page2).toHaveLength(1)
        expect(page1[0].auditId).not.toBe(page2[0].auditId)
      })
    })
    
    describe('getEntriesByStatus', () => {
      it('should filter entries by status', () => {
        const success = getEntriesByStatus(store, 'success')
        expect(success).toHaveLength(1)
        
        const pending = getEntriesByStatus(store, 'pending')
        expect(pending).toHaveLength(1)
      })
    })
  })
  
  describe('calculateAuditStatistics', () => {
    it('should calculate audit statistics', () => {
      let store = createAuditLogStore()
      
      // Add successful entry
      const entry1 = createToolAuditEntry(
        'trace-1',
        'session-1',
        'tool1',
        'tool-1',
        'core',
        { sessionId: 'session-1' }
      )
      store = addAuditEntry(store, entry1)
      store = updateAuditEntry(store, entry1.auditId, e => markSuccess(e, {}, 100))!
      
      // Add failed entry
      const entry2 = createToolAuditEntry(
        'trace-2',
        'session-1',
        'tool2',
        'tool-2',
        'plugin',
        { sessionId: 'session-1' }
      )
      store = addAuditEntry(store, entry2)
      store = updateAuditEntry(store, entry2.auditId, e => markFailure(e, { code: 'ERR', message: 'Error' }, 50))!
      
      // Add permission denied
      const entry3 = createToolAuditEntry(
        'trace-3',
        'session-1',
        'tool1',
        'tool-1',
        'core',
        { sessionId: 'session-1' }
      )
      store = addAuditEntry(store, entry3)
      store = updateAuditEntry(store, entry3.auditId, e => 
        markPermissionDenied(e, createPermissionOutcome(false, 'perm-1'))
      )!
      
      const stats = calculateAuditStatistics(store)
      
      expect(stats.totalEntries).toBe(3)
      expect(stats.successCount).toBe(1)
      expect(stats.failureCount).toBe(1)
      expect(stats.permissionDeniedCount).toBe(1)
      expect(stats.averageDuration).toBe(75) // (100 + 50) / 2
      expect(stats.toolUsageCounts['tool1']).toBe(2)
      expect(stats.toolUsageCounts['tool2']).toBe(1)
    })
  })
  
  describe('governance functions', () => {
    it('should get entries by governance tag', () => {
      let store = createAuditLogStore()
      
      const entry = createToolAuditEntry(
        'trace-1',
        'session-1',
        'tool1',
        'tool-1',
        'core',
        { sessionId: 'session-1' },
        { governanceTags: ['sensitive', 'audit'] }
      )
      store = addAuditEntry(store, entry)
      
      const sensitive = getGovernanceTaggedEntries(store, 'sensitive')
      expect(sensitive).toHaveLength(1)
      
      const audit = getGovernanceTaggedEntries(store, 'audit')
      expect(audit).toHaveLength(1)
      
      const unknown = getGovernanceTaggedEntries(store, 'unknown')
      expect(unknown).toHaveLength(0)
    })
    
    it('should get entries by retention category', () => {
      let store = createAuditLogStore()
      
      const entry1 = createToolAuditEntry(
        'trace-1',
        'session-1',
        'tool1',
        'tool-1',
        'core',
        { sessionId: 'session-1' },
        { retentionCategory: 'critical' }
      )
      store = addAuditEntry(store, entry1)
      
      const entry2 = createToolAuditEntry(
        'trace-2',
        'session-1',
        'tool2',
        'tool-2',
        'plugin',
        { sessionId: 'session-1' },
        { retentionCategory: 'standard' }
      )
      store = addAuditEntry(store, entry2)
      
      const critical = getEntriesByRetentionCategory(store, 'critical')
      expect(critical).toHaveLength(1)
      
      const standard = getEntriesByRetentionCategory(store, 'standard')
      expect(standard).toHaveLength(1)
    })
  })
  
  describe('serialization', () => {
    describe('serializeAuditEntry / deserializeAuditEntry', () => {
      it('should serialize and deserialize an audit entry', () => {
        const entry = createToolAuditEntry(
          'trace-123',
          'session-123',
          'testTool',
          'tool-123',
          'core',
          { sessionId: 'session-123' }
        )
        
        const serialized = serializeAuditEntry(entry)
        const deserialized = deserializeAuditEntry(serialized)
        
        expect(deserialized).toEqual(entry)
      })
    })
    
    describe('serializeAuditLogStore / deserializeAuditLogStore', () => {
      it('should serialize and deserialize an audit log store', () => {
        let store = createAuditLogStore()
        
        const entry = createToolAuditEntry(
          'trace-123',
          'session-123',
          'testTool',
          'tool-123',
          'core',
          { sessionId: 'session-123' }
        )
        store = addAuditEntry(store, entry)
        
        const serialized = serializeAuditLogStore(store)
        const deserialized = deserializeAuditLogStore(serialized)
        
        expect(deserialized.entries.size).toBe(1)
        expect(deserialized.sessionIndex.size).toBe(1)
        expect(deserialized.toolIndex.size).toBe(1)
        expect(deserialized.traceIndex.size).toBe(1)
        
        const restoredEntry = getAuditEntry(deserialized, entry.auditId)
        expect(restoredEntry?.toolName).toBe('testTool')
      })
    })
  })
  
  describe('debug formatters', () => {
    it('should format an audit entry', () => {
      const entry = createToolAuditEntry(
        'trace-123',
        'session-123',
        'testTool',
        'tool-123',
        'core',
        { sessionId: 'session-123' }
      )
      const formatted = formatAuditEntry(entry)
      
      expect(formatted).toContain('ToolAuditEntry')
      expect(formatted).toContain('testTool')
      expect(formatted).toContain('pending')
    })
    
    it('should format audit statistics', () => {
      const stats: AuditStatistics = {
        totalEntries: 10,
        successCount: 7,
        failureCount: 2,
        permissionDeniedCount: 1,
        confirmationRejectedCount: 0,
        timeoutCount: 0,
        cancelledCount: 0,
        averageDuration: 150.5,
        toolUsageCounts: { tool1: 5, tool2: 5 },
        statusCounts: {
          pending: 0,
          executing: 0,
          success: 7,
          failure: 2,
          permission_denied: 1,
          confirmation_rejected: 0,
          timeout: 0,
          cancelled: 0
        }
      }
      
      const formatted = formatAuditStatistics(stats)
      
      expect(formatted).toContain('AuditStatistics')
      expect(formatted).toContain('total: 10')
      expect(formatted).toContain('success: 7')
    })
  })
})
