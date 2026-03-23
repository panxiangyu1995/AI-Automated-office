/**
 * Tests for Field Action and Datasource Authorization (Story 46.4)
 * Task 75: Extend authorization checks to fields, actions, and data sources.
 */

import { describe, it, expect } from 'vitest'
import {
  // Types
  type FieldAuthReference,
  type ActionAuthReference,
  type DatasourceAuthReference,
  type AuthorizationContext,
  type AuthorizationDecision,
  type FieldAuthRule,
  type ActionAuthRule,
  type DatasourceAuthRule,
  type AuthorizationAuditEntry,
  type AuthorizationStore,
  
  // Constants
  DECISION_ID_PREFIX,
  RULE_ID_PREFIX,
  AUDIT_ENTRY_ID_PREFIX,
  AUTHORIZATION_OUTCOMES,
  AUTHORIZATION_SCOPES,
  PERMISSION_LEVELS,
  ACTION_TYPES,
  DATASOURCE_TYPES,
  PERMISSION_HIERARCHY,
  
  // ID Generation
  generateDecisionId,
  generateRuleId,
  generateAuditEntryId,
  isValidDecisionId,
  isValidRuleId,
  
  // Factory Functions
  createFieldAuthReference,
  createActionAuthReference,
  createDatasourceAuthReference,
  createAuthorizationContext,
  createAuthorizationDecision,
  createFieldAuthRule,
  createActionAuthRule,
  createDatasourceAuthRule,
  createAuthorizationAuditEntry,
  createAuthorizationStore,
  
  // Permission Utilities
  comparePermissions,
  permissionSatisfies,
  getHighestPermission,
  hasRequiredRole,
  
  // Field Authorization
  getFieldRule,
  checkFieldAccess,
  
  // Action Authorization
  getActionRule,
  checkActionAuthorization,
  
  // Datasource Authorization
  getDatasourceRule,
  checkDatasourceAuthorization,
  
  // Store Operations
  registerFieldRule,
  registerActionRule,
  registerDatasourceRule,
  recordDecision,
  addAuditEntry,
  getDecision,
  getAuditEntriesByUser,
  getAuditEntriesBySession,
  getAuditEntriesByOutcome,
  
  // Serialization
  serializeAuthContext,
  deserializeAuthContext,
  serializeAuthDecision,
  deserializeAuthDecision,
  serializeAuthStore,
  deserializeAuthStore,
  
  // Debug Formatting
  formatAuthOutcome,
  formatPermissionLevel,
  formatAuthDecision,
  formatAuditEntry,
} from '@/features/session/runtime/fieldActionAuthorization'

describe('Field Action and Datasource Authorization', () => {
  describe('generateDecisionId', () => {
    it('should generate a valid decision ID', () => {
      const id = generateDecisionId()
      expect(id).toMatch(new RegExp(`^${DECISION_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateDecisionId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('generateRuleId', () => {
    it('should generate a valid rule ID', () => {
      const id = generateRuleId()
      expect(id).toMatch(new RegExp(`^${RULE_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })
  })

  describe('generateAuditEntryId', () => {
    it('should generate a valid audit entry ID', () => {
      const id = generateAuditEntryId()
      expect(id).toMatch(new RegExp(`^${AUDIT_ENTRY_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })
  })

  describe('isValidDecisionId', () => {
    it('should validate correct decision IDs', () => {
      expect(isValidDecisionId(generateDecisionId())).toBe(true)
      expect(isValidDecisionId(`${DECISION_ID_PREFIX}_123_abc`)).toBe(true)
    })

    it('should reject invalid decision IDs', () => {
      expect(isValidDecisionId('invalid')).toBe(false)
      expect(isValidDecisionId(`${RULE_ID_PREFIX}_123`)).toBe(false)
    })
  })

  describe('isValidRuleId', () => {
    it('should validate correct rule IDs', () => {
      expect(isValidRuleId(generateRuleId())).toBe(true)
      expect(isValidRuleId(`${RULE_ID_PREFIX}_123_abc`)).toBe(true)
    })

    it('should reject invalid rule IDs', () => {
      expect(isValidRuleId('invalid')).toBe(false)
      expect(isValidRuleId(`${DECISION_ID_PREFIX}_123`)).toBe(false)
    })
  })

  describe('createFieldAuthReference', () => {
    it('should create a field auth reference', () => {
      const ref = createFieldAuthReference('field1', 'entity1')
      
      expect(ref.fieldId).toBe('field1')
      expect(ref.entityId).toBe('entity1')
      expect(ref.fieldName).toBeUndefined()
    })

    it('should create a field auth reference with options', () => {
      const ref = createFieldAuthReference('field1', 'entity1', {
        fieldName: 'name',
        dataType: 'string'
      })
      
      expect(ref.fieldName).toBe('name')
      expect(ref.dataType).toBe('string')
    })
  })

  describe('createActionAuthReference', () => {
    it('should create an action auth reference', () => {
      const ref = createActionAuthReference('action1', 'create')
      
      expect(ref.actionId).toBe('action1')
      expect(ref.actionType).toBe('create')
    })

    it('should create an action auth reference with options', () => {
      const ref = createActionAuthReference('action1', 'create', {
        targetEntity: 'User',
        actionName: 'createUser'
      })
      
      expect(ref.targetEntity).toBe('User')
      expect(ref.actionName).toBe('createUser')
    })
  })

  describe('createDatasourceAuthReference', () => {
    it('should create a datasource auth reference', () => {
      const ref = createDatasourceAuthReference('ds1', 'database')
      
      expect(ref.datasourceId).toBe('ds1')
      expect(ref.datasourceType).toBe('database')
    })

    it('should create a datasource auth reference with options', () => {
      const ref = createDatasourceAuthReference('ds1', 'api', {
        datasourceName: 'External API',
        endpoint: 'https://api.example.com'
      })
      
      expect(ref.datasourceName).toBe('External API')
      expect(ref.endpoint).toBe('https://api.example.com')
    })
  })

  describe('createAuthorizationContext', () => {
    it('should create an authorization context', () => {
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      expect(ctx.userId).toBe('user1')
      expect(ctx.tenantId).toBe('tenant1')
      expect(ctx.roleIds).toEqual(['role1'])
      expect(ctx.permissionGrants.size).toBe(0)
    })

    it('should create an authorization context with permissions', () => {
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('entity1:field1', 'write')
      
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'], permissions, 'dept1')
      
      expect(ctx.permissionGrants.size).toBe(1)
      expect(ctx.departmentId).toBe('dept1')
    })
  })

  describe('createAuthorizationDecision', () => {
    it('should create an authorization decision', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision = createAuthorizationDecision('allowed', 'field', field, ctx)
      
      expect(decision.outcome).toBe('allowed')
      expect(decision.scope).toBe('field')
      expect(decision.grantedPermissions).toEqual([])
      expect(isValidDecisionId(decision.decisionId)).toBe(true)
    })

    it('should create an authorization decision with options', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision = createAuthorizationDecision('denied', 'field', field, ctx, {
        grantedPermissions: ['read'],
        deniedPermissions: ['write'],
        denialReasons: ['Insufficient permission']
      })
      
      expect(decision.grantedPermissions).toEqual(['read'])
      expect(decision.deniedPermissions).toEqual(['write'])
      expect(decision.denialReasons).toEqual(['Insufficient permission'])
    })
  })

  describe('createFieldAuthRule', () => {
    it('should create a field auth rule', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'write')
      
      expect(rule.field).toBe(field)
      expect(rule.requiredPermission).toBe('write')
      expect(rule.allowedRoles).toEqual([])
      expect(rule.enabled).toBe(true)
    })

    it('should create a field auth rule with options', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'admin', {
        allowedRoles: ['admin'],
        allowedDepartments: ['dept1'],
        priority: 10
      })
      
      expect(rule.allowedRoles).toEqual(['admin'])
      expect(rule.allowedDepartments).toEqual(['dept1'])
      expect(rule.priority).toBe(10)
    })
  })

  describe('createActionAuthRule', () => {
    it('should create an action auth rule', () => {
      const action = createActionAuthReference('action1', 'delete')
      const rule = createActionAuthRule(action, 'delete')
      
      expect(rule.action).toBe(action)
      expect(rule.requiredPermission).toBe('delete')
      expect(rule.requiresApproval).toBe(false)
      expect(rule.riskLevel).toBe('medium')
    })

    it('should create an action auth rule with approval', () => {
      const action = createActionAuthReference('action1', 'delete')
      const rule = createActionAuthRule(action, 'delete', {
        requiresApproval: true,
        approvalWorkflowId: 'workflow1',
        riskLevel: 'critical'
      })
      
      expect(rule.requiresApproval).toBe(true)
      expect(rule.approvalWorkflowId).toBe('workflow1')
      expect(rule.riskLevel).toBe('critical')
    })
  })

  describe('createDatasourceAuthRule', () => {
    it('should create a datasource auth rule', () => {
      const ds = createDatasourceAuthReference('ds1', 'database')
      const rule = createDatasourceAuthRule(ds, 'read')
      
      expect(rule.datasource).toBe(ds)
      expect(rule.requiredPermission).toBe('read')
    })

    it('should create a datasource auth rule with options', () => {
      const ds = createDatasourceAuthReference('ds1', 'api')
      const rule = createDatasourceAuthRule(ds, 'write', {
        allowedRoles: ['admin'],
        allowedIpRanges: ['192.168.1.0/24'],
        rateLimit: 100
      })
      
      expect(rule.allowedRoles).toEqual(['admin'])
      expect(rule.allowedIpRanges).toEqual(['192.168.1.0/24'])
      expect(rule.rateLimit).toBe(100)
    })
  })

  describe('createAuthorizationAuditEntry', () => {
    it('should create an audit entry for field decision', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('allowed', 'field', field, ctx)
      
      const entry = createAuthorizationAuditEntry(decision, 'session1', 'trace1')
      
      expect(entry.decisionId).toBe(decision.decisionId)
      expect(entry.sessionId).toBe('session1')
      expect(entry.traceId).toBe('trace1')
      expect(entry.scope).toBe('field')
      expect(entry.targetDescription).toContain('field1')
    })

    it('should create an audit entry for action decision', () => {
      const action = createActionAuthReference('action1', 'delete')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('denied', 'action', action, ctx)
      
      const entry = createAuthorizationAuditEntry(decision, 'session1', 'trace1')
      
      expect(entry.scope).toBe('action')
      expect(entry.targetDescription).toContain('action1')
      expect(entry.targetDescription).toContain('delete')
    })

    it('should create an audit entry for datasource decision', () => {
      const ds = createDatasourceAuthReference('ds1', 'database')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('restricted', 'datasource', ds, ctx)
      
      const entry = createAuthorizationAuditEntry(decision, 'session1', 'trace1')
      
      expect(entry.scope).toBe('datasource')
      expect(entry.targetDescription).toContain('ds1')
    })
  })

  describe('createAuthorizationStore', () => {
    it('should create an empty store', () => {
      const store = createAuthorizationStore()
      
      expect(store.fieldRules.size).toBe(0)
      expect(store.actionRules.size).toBe(0)
      expect(store.datasourceRules.size).toBe(0)
      expect(store.decisions.size).toBe(0)
      expect(store.auditLog).toEqual([])
    })
  })

  describe('comparePermissions', () => {
    it('should compare permission levels correctly', () => {
      expect(comparePermissions('admin', 'read')).toBeGreaterThan(0)
      expect(comparePermissions('read', 'admin')).toBeLessThan(0)
      expect(comparePermissions('write', 'write')).toBe(0)
    })
  })

  describe('permissionSatisfies', () => {
    it('should return true when permission satisfies requirement', () => {
      expect(permissionSatisfies('admin', 'read')).toBe(true)
      expect(permissionSatisfies('admin', 'write')).toBe(true)
      expect(permissionSatisfies('write', 'read')).toBe(true)
    })

    it('should return false when permission does not satisfy requirement', () => {
      expect(permissionSatisfies('read', 'write')).toBe(false)
      expect(permissionSatisfies('none', 'read')).toBe(false)
    })
  })

  describe('getHighestPermission', () => {
    it('should return none for empty list', () => {
      expect(getHighestPermission([])).toBe('none')
    })

    it('should return highest permission', () => {
      expect(getHighestPermission(['read', 'write'])).toBe('write')
      expect(getHighestPermission(['admin', 'read', 'delete'])).toBe('admin')
    })
  })

  describe('hasRequiredRole', () => {
    it('should return true when user has required role', () => {
      expect(hasRequiredRole(['admin', 'user'], ['admin'])).toBe(true)
      expect(hasRequiredRole(['admin'], ['admin', 'superuser'])).toBe(true)
    })

    it('should return true when no roles required', () => {
      expect(hasRequiredRole(['user'], [])).toBe(true)
    })

    it('should return false when user does not have required role', () => {
      expect(hasRequiredRole(['user'], ['admin'])).toBe(false)
    })
  })

  describe('Field Authorization', () => {
    it('should deny access when no rule found', () => {
      const store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision = checkFieldAccess(store, field, ctx, 'read')
      
      expect(decision.outcome).toBe('denied')
      expect(decision.denialReasons).toContain('No authorization rule found')
    })

    it('should deny access when role not allowed', () => {
      let store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'read', { allowedRoles: ['admin'] })
      store = registerFieldRule(store, rule)
      
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'])
      const decision = checkFieldAccess(store, field, ctx, 'read')
      
      expect(decision.outcome).toBe('denied')
      expect(decision.denialReasons).toContain('User does not have required role')
    })

    it('should allow access when all conditions met', () => {
      let store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'read', { allowedRoles: ['user'] })
      store = registerFieldRule(store, rule)
      
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('entity1:field1', 'read')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'], permissions)
      
      const decision = checkFieldAccess(store, field, ctx, 'read')
      
      expect(decision.outcome).toBe('allowed')
      expect(decision.grantedPermissions).toContain('read')
    })

    it('should restrict access when permission insufficient', () => {
      let store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'read', { allowedRoles: ['user'] })
      store = registerFieldRule(store, rule)
      
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('entity1:field1', 'read')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'], permissions)
      
      const decision = checkFieldAccess(store, field, ctx, 'write')
      
      expect(decision.outcome).toBe('restricted')
      expect(decision.grantedPermissions).toContain('read')
      expect(decision.deniedPermissions).toContain('write')
    })

    it('should deny access when department not allowed', () => {
      let store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'read', {
        allowedRoles: ['user'],
        allowedDepartments: ['dept1']
      })
      store = registerFieldRule(store, rule)
      
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'], undefined, 'dept2')
      const decision = checkFieldAccess(store, field, ctx, 'read')
      
      expect(decision.outcome).toBe('denied')
      expect(decision.denialReasons).toContain('User department not authorized')
    })
  })

  describe('Action Authorization', () => {
    it('should deny action when no rule found', () => {
      const store = createAuthorizationStore()
      const action = createActionAuthReference('action1', 'delete')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision = checkActionAuthorization(store, action, ctx, 'delete')
      
      expect(decision.outcome).toBe('denied')
    })

    it('should require approval when configured', () => {
      let store = createAuthorizationStore()
      const action = createActionAuthReference('action1', 'delete')
      const rule = createActionAuthRule(action, 'delete', {
        allowedRoles: ['admin'],
        requiresApproval: true,
        riskLevel: 'critical'
      })
      store = registerActionRule(store, rule)
      
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('delete:action1', 'delete')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['admin'], permissions)
      
      const decision = checkActionAuthorization(store, action, ctx, 'delete')
      
      expect(decision.outcome).toBe('requires-approval')
      expect(decision.metadata?.riskLevel).toBe('critical')
    })

    it('should allow action when all conditions met', () => {
      let store = createAuthorizationStore()
      const action = createActionAuthReference('action1', 'create')
      const rule = createActionAuthRule(action, 'write', { allowedRoles: ['user'] })
      store = registerActionRule(store, rule)
      
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('create:action1', 'write')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'], permissions)
      
      const decision = checkActionAuthorization(store, action, ctx, 'write')
      
      expect(decision.outcome).toBe('allowed')
    })
  })

  describe('Datasource Authorization', () => {
    it('should deny datasource when no rule found', () => {
      const store = createAuthorizationStore()
      const ds = createDatasourceAuthReference('ds1', 'database')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision = checkDatasourceAuthorization(store, ds, ctx, 'read')
      
      expect(decision.outcome).toBe('denied')
    })

    it('should allow datasource when all conditions met', () => {
      let store = createAuthorizationStore()
      const ds = createDatasourceAuthReference('ds1', 'database')
      const rule = createDatasourceAuthRule(ds, 'read', { allowedRoles: ['user'] })
      store = registerDatasourceRule(store, rule)
      
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('database:ds1', 'read')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'], permissions)
      
      const decision = checkDatasourceAuthorization(store, ds, ctx, 'read')
      
      expect(decision.outcome).toBe('allowed')
      expect(decision.metadata?.rateLimit).toBeUndefined()
    })

    it('should include rate limit in metadata', () => {
      let store = createAuthorizationStore()
      const ds = createDatasourceAuthReference('ds1', 'api')
      const rule = createDatasourceAuthRule(ds, 'read', {
        allowedRoles: ['user'],
        rateLimit: 100
      })
      store = registerDatasourceRule(store, rule)
      
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('api:ds1', 'read')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['user'], permissions)
      
      const decision = checkDatasourceAuthorization(store, ds, ctx, 'read')
      
      expect(decision.metadata?.rateLimit).toBe(100)
    })
  })

  describe('Store Operations', () => {
    it('should register field rule', () => {
      const store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const rule = createFieldAuthRule(field, 'read')
      
      const newStore = registerFieldRule(store, rule)
      
      expect(newStore.fieldRules.size).toBe(1)
      expect(getFieldRule(newStore, field)).toBe(rule)
      // Original store unchanged
      expect(store.fieldRules.size).toBe(0)
    })

    it('should register action rule', () => {
      const store = createAuthorizationStore()
      const action = createActionAuthReference('action1', 'create')
      const rule = createActionAuthRule(action, 'write')
      
      const newStore = registerActionRule(store, rule)
      
      expect(newStore.actionRules.size).toBe(1)
    })

    it('should register datasource rule', () => {
      const store = createAuthorizationStore()
      const ds = createDatasourceAuthReference('ds1', 'database')
      const rule = createDatasourceAuthRule(ds, 'read')
      
      const newStore = registerDatasourceRule(store, rule)
      
      expect(newStore.datasourceRules.size).toBe(1)
    })

    it('should record decision', () => {
      const store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('allowed', 'field', field, ctx)
      
      const newStore = recordDecision(store, decision)
      
      expect(newStore.decisions.size).toBe(1)
      expect(getDecision(newStore, decision.decisionId)).toBe(decision)
    })

    it('should add audit entry', () => {
      const store = createAuthorizationStore()
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('allowed', 'field', field, ctx)
      const entry = createAuthorizationAuditEntry(decision, 'session1', 'trace1')
      
      const newStore = addAuditEntry(store, entry)
      
      expect(newStore.auditLog).toHaveLength(1)
    })

    it('should get audit entries by user', () => {
      let store = createAuthorizationStore()
      
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx1 = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const ctx2 = createAuthorizationContext('user2', 'tenant1', ['role1'])
      
      const decision1 = createAuthorizationDecision('allowed', 'field', field, ctx1)
      const decision2 = createAuthorizationDecision('denied', 'field', field, ctx2)
      
      const entry1 = createAuthorizationAuditEntry(decision1, 'session1', 'trace1')
      const entry2 = createAuthorizationAuditEntry(decision2, 'session1', 'trace2')
      
      store = addAuditEntry(store, entry1)
      store = addAuditEntry(store, entry2)
      
      const user1Entries = getAuditEntriesByUser(store, 'user1')
      expect(user1Entries).toHaveLength(1)
    })

    it('should get audit entries by session', () => {
      let store = createAuthorizationStore()
      
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision1 = createAuthorizationDecision('allowed', 'field', field, ctx)
      const decision2 = createAuthorizationDecision('denied', 'field', field, ctx)
      
      const entry1 = createAuthorizationAuditEntry(decision1, 'session1', 'trace1')
      const entry2 = createAuthorizationAuditEntry(decision2, 'session2', 'trace2')
      
      store = addAuditEntry(store, entry1)
      store = addAuditEntry(store, entry2)
      
      const session1Entries = getAuditEntriesBySession(store, 'session1')
      expect(session1Entries).toHaveLength(1)
    })

    it('should get audit entries by outcome', () => {
      let store = createAuthorizationStore()
      
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      
      const decision1 = createAuthorizationDecision('allowed', 'field', field, ctx)
      const decision2 = createAuthorizationDecision('denied', 'field', field, ctx)
      
      const entry1 = createAuthorizationAuditEntry(decision1, 'session1', 'trace1')
      const entry2 = createAuthorizationAuditEntry(decision2, 'session1', 'trace2')
      
      store = addAuditEntry(store, entry1)
      store = addAuditEntry(store, entry2)
      
      const deniedEntries = getAuditEntriesByOutcome(store, 'denied')
      expect(deniedEntries).toHaveLength(1)
    })
  })

  describe('Serialization', () => {
    it('should serialize and deserialize authorization context', () => {
      const permissions = new Map<string, 'read' | 'write' | 'delete' | 'admin' | 'none'>()
      permissions.set('entity1:field1', 'write')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'], permissions, 'dept1')
      
      const serialized = serializeAuthContext(ctx)
      const deserialized = deserializeAuthContext(serialized)
      
      expect(deserialized.userId).toBe(ctx.userId)
      expect(deserialized.tenantId).toBe(ctx.tenantId)
      expect(deserialized.departmentId).toBe(ctx.departmentId)
      expect(deserialized.permissionGrants.size).toBe(1)
    })

    it('should serialize and deserialize authorization decision', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('allowed', 'field', field, ctx, {
        grantedPermissions: ['read', 'write']
      })
      
      const serialized = serializeAuthDecision(decision)
      const deserialized = deserializeAuthDecision(serialized)
      
      expect(deserialized.decisionId).toBe(decision.decisionId)
      expect(deserialized.outcome).toBe(decision.outcome)
      expect(deserialized.grantedPermissions).toEqual(['read', 'write'])
    })

    it('should serialize and deserialize authorization store', () => {
      let store = createAuthorizationStore()
      
      const field = createFieldAuthReference('field1', 'entity1')
      const fieldRule = createFieldAuthRule(field, 'read')
      store = registerFieldRule(store, fieldRule)
      
      const action = createActionAuthReference('action1', 'create')
      const actionRule = createActionAuthRule(action, 'write')
      store = registerActionRule(store, actionRule)
      
      const ds = createDatasourceAuthReference('ds1', 'database')
      const dsRule = createDatasourceAuthRule(ds, 'read')
      store = registerDatasourceRule(store, dsRule)
      
      const serialized = serializeAuthStore(store)
      const deserialized = deserializeAuthStore(serialized)
      
      expect(deserialized.fieldRules.size).toBe(1)
      expect(deserialized.actionRules.size).toBe(1)
      expect(deserialized.datasourceRules.size).toBe(1)
    })
  })

  describe('Debug Formatting', () => {
    it('should format authorization outcome', () => {
      expect(formatAuthOutcome('allowed')).toContain('allowed')
      expect(formatAuthOutcome('denied')).toContain('denied')
      expect(formatAuthOutcome('restricted')).toContain('restricted')
      expect(formatAuthOutcome('requires-approval')).toContain('requires-approval')
    })

    it('should format permission level', () => {
      expect(formatPermissionLevel('none')).toBe('—')
      expect(formatPermissionLevel('read')).toBe('R')
      expect(formatPermissionLevel('write')).toBe('RW')
      expect(formatPermissionLevel('delete')).toBe('RWD')
      expect(formatPermissionLevel('admin')).toBe('RWDA')
    })

    it('should format authorization decision', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('denied', 'field', field, ctx, {
        denialReasons: ['Test reason']
      })
      
      const formatted = formatAuthDecision(decision)
      
      expect(formatted).toContain(decision.decisionId)
      expect(formatted).toContain('denied')
      expect(formatted).toContain('field1')
      expect(formatted).toContain('Test reason')
    })

    it('should format audit entry', () => {
      const field = createFieldAuthReference('field1', 'entity1')
      const ctx = createAuthorizationContext('user1', 'tenant1', ['role1'])
      const decision = createAuthorizationDecision('allowed', 'field', field, ctx)
      const entry = createAuthorizationAuditEntry(decision, 'session1', 'trace1')
      
      const formatted = formatAuditEntry(entry)
      
      expect(formatted).toContain('allowed')
      expect(formatted).toContain('field1')
      expect(formatted).toContain('user1')
    })
  })
})
