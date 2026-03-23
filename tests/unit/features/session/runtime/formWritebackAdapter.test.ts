/**
 * Tests for Form Writeback Adapter (Story 49.1)
 * Task 84: Write normalized Agent results into approved dynamic form targets.
 */

import { describe, it, expect } from 'vitest'
import {
  // Types
  type FieldReference,
  type FieldUpdate,
  type WritebackAction,
  type WritebackContract,
  type NormalizedResult,
  type ResultToFieldMapping,
  type WritebackAdapterStore,
  type WritebackOptions,
  type WritebackResult,
  type FieldPermissionResult,
  type FieldValidationRule,
  
  // Constants
  UPDATE_ID_PREFIX,
  ACTION_ID_PREFIX,
  MAPPING_ID_PREFIX,
  TRACE_ENTRY_ID_PREFIX,
  CONTRACT_ID_PREFIX,
  FIELD_DATA_TYPES,
  WRITEBACK_PERMISSIONS,
  FIELD_UPDATE_STATUSES,
  WRITEBACK_STATUSES,
  
  // ID Generation
  generateUpdateId,
  generateActionId,
  generateMappingId,
  generateTraceEntryId,
  generateContractId,
  isValidUpdateId,
  isValidActionId,
  isValidMappingId,
  isValidTraceEntryId,
  
  // Factory Functions
  createFieldReference,
  createFieldPermissionResult,
  createFieldUpdate,
  createWritebackAction,
  createWritebackContract,
  createValidationRule,
  createResultToFieldMapping,
  createWritebackTraceEntry,
  createWritebackAdapterStore,
  
  // Permission Checking
  isFieldAllowed,
  getFieldPermission,
  canWriteField,
  checkFieldPermissions,
  
  // Validation
  validateValueAgainstRule,
  validateFieldUpdate,
  validateFieldUpdates,
  
  // Result Mapping
  extractValueByPath,
  mapResultToUpdates,
  
  // Writeback Execution
  updateFieldStatus,
  updateWritebackStatus,
  executeWriteback,
  
  // Store Operations
  registerContract,
  addAction,
  addTraceEntries,
  getContract,
  getAction,
  getTraceEntries,
  getActionsByForm,
  getActionsBySession,
  getActionsByStatus,
  
  // Serialization
  serializeContract,
  deserializeContract,
  serializeAction,
  deserializeAction,
  serializeWritebackStore,
  deserializeWritebackStore,
  
  // Debug Formatting
  formatFieldReference,
  formatFieldUpdate,
  formatWritebackAction,
  formatWritebackResult,
  formatTraceEntry,
} from '@/features/session/runtime/formWritebackAdapter'

describe('Form Writeback Adapter', () => {
  describe('generateUpdateId', () => {
    it('should generate a valid update ID', () => {
      const id = generateUpdateId()
      expect(id).toMatch(new RegExp(`^${UPDATE_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateUpdateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('generateActionId', () => {
    it('should generate a valid action ID', () => {
      const id = generateActionId()
      expect(id).toMatch(new RegExp(`^${ACTION_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateActionId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('generateMappingId', () => {
    it('should generate a valid mapping ID', () => {
      const id = generateMappingId()
      expect(id).toMatch(new RegExp(`^${MAPPING_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })
  })

  describe('generateTraceEntryId', () => {
    it('should generate a valid trace entry ID', () => {
      const id = generateTraceEntryId()
      expect(id).toMatch(new RegExp(`^${TRACE_ENTRY_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })
  })

  describe('generateContractId', () => {
    it('should generate a valid contract ID', () => {
      const id = generateContractId()
      expect(id).toMatch(new RegExp(`^${CONTRACT_ID_PREFIX}_\\d+_[a-f0-9]{16}$`))
    })
  })

  describe('isValidUpdateId', () => {
    it('should validate correct update IDs', () => {
      expect(isValidUpdateId(generateUpdateId())).toBe(true)
      expect(isValidUpdateId(`${UPDATE_ID_PREFIX}_123_abc`)).toBe(true)
    })

    it('should reject invalid update IDs', () => {
      expect(isValidUpdateId('invalid')).toBe(false)
      expect(isValidUpdateId(`${ACTION_ID_PREFIX}_123`)).toBe(false)
    })
  })

  describe('isValidActionId', () => {
    it('should validate correct action IDs', () => {
      expect(isValidActionId(generateActionId())).toBe(true)
      expect(isValidActionId(`${ACTION_ID_PREFIX}_123_abc`)).toBe(true)
    })

    it('should reject invalid action IDs', () => {
      expect(isValidActionId('invalid')).toBe(false)
      expect(isValidActionId(`${UPDATE_ID_PREFIX}_123`)).toBe(false)
    })
  })

  describe('createFieldReference', () => {
    it('should create a field reference with required fields', () => {
      const ref = createFieldReference('form1', 'field1', 'string')
      
      expect(ref.formId).toBe('form1')
      expect(ref.fieldId).toBe('field1')
      expect(ref.dataType).toBe('string')
      expect(ref.fieldPath).toBeUndefined()
    })

    it('should create a field reference with path', () => {
      const ref = createFieldReference('form1', 'field1', 'string', { fieldPath: 'user.name' })
      
      expect(ref.fieldPath).toBe('user.name')
    })
  })

  describe('createFieldPermissionResult', () => {
    it('should create a permission result for allowed field', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const result = createFieldPermissionResult(field, true, 'edit')
      
      expect(result.field).toBe(field)
      expect(result.allowed).toBe(true)
      expect(result.permissionLevel).toBe('edit')
      expect(result.reason).toBeUndefined()
      expect(result.checkedAt).toBeGreaterThan(0)
    })

    it('should create a permission result for denied field', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const result = createFieldPermissionResult(field, false, 'read-only', 'Field is read-only')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Field is read-only')
    })
  })

  describe('createFieldUpdate', () => {
    it('should create a field update', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'new value', 'old value')
      
      expect(update.field).toBe(field)
      expect(update.newValue).toBe('new value')
      expect(update.originalValue).toBe('old value')
      expect(update.status).toBe('pending')
      expect(isValidUpdateId(update.updateId)).toBe(true)
    })

    it('should create a field update without original value', () => {
      const field = createFieldReference('form1', 'field1', 'number')
      const update = createFieldUpdate(field, 42)
      
      expect(update.originalValue).toBeUndefined()
    })
  })

  describe('createWritebackAction', () => {
    it('should create a writeback action', () => {
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool-executor')
      
      expect(action.sessionId).toBe('session1')
      expect(action.traceId).toBe('trace1')
      expect(action.formId).toBe('form1')
      expect(action.source).toBe('tool-executor')
      expect(action.status).toBe('pending')
      expect(action.updates).toEqual([])
      expect(isValidActionId(action.actionId)).toBe(true)
    })

    it('should create a writeback action with updates', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'agent', [update])
      
      expect(action.updates).toHaveLength(1)
    })
  })

  describe('createWritebackContract', () => {
    it('should create a writeback contract', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      
      expect(contract.formId).toBe('form1')
      expect(contract.allowedFields).toHaveLength(1)
      expect(contract.requiresApproval).toBe(false)
      expect(contract.fieldPermissions.size).toBe(0)
      expect(contract.validationRules.size).toBe(0)
    })

    it('should create a contract with permissions', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      
      expect(contract.fieldPermissions.size).toBe(1)
    })
  })

  describe('createValidationRule', () => {
    it('should create a required rule', () => {
      const rule = createValidationRule('required', 'Field is required')
      
      expect(rule.type).toBe('required')
      expect(rule.errorMessage).toBe('Field is required')
    })

    it('should create a format rule with params', () => {
      const rule = createValidationRule('format', 'Invalid email', { pattern: '^[^@]+@[^@]+$' })
      
      expect(rule.type).toBe('format')
      expect(rule.params?.pattern).toBe('^[^@]+@[^@]+$')
    })
  })

  describe('createResultToFieldMapping', () => {
    it('should create a mapping', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const mapping = createResultToFieldMapping('output.value', field)
      
      expect(mapping.resultPath).toBe('output.value')
      expect(mapping.targetField).toBe(field)
      expect(mapping.required).toBe(false)
      expect(isValidMappingId(mapping.mappingId)).toBe(true)
    })

    it('should create a required mapping', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const mapping = createResultToFieldMapping('output.value', field, { required: true })
      
      expect(mapping.required).toBe(true)
    })
  })

  describe('createWritebackTraceEntry', () => {
    it('should create a trace entry', () => {
      const entry = createWritebackTraceEntry('action1', 'update', 'Field updated')
      
      expect(entry.actionId).toBe('action1')
      expect(entry.type).toBe('update')
      expect(entry.message).toBe('Field updated')
      expect(entry.timestamp).toBeGreaterThan(0)
    })

    it('should create a trace entry with field', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const entry = createWritebackTraceEntry('action1', 'permission-check', 'Checked', { field })
      
      expect(entry.field).toBe(field)
    })
  })

  describe('createWritebackAdapterStore', () => {
    it('should create an empty store', () => {
      const store = createWritebackAdapterStore()
      
      expect(store.contracts.size).toBe(0)
      expect(store.actions.size).toBe(0)
      expect(store.mappings.size).toBe(0)
      expect(store.traces.size).toBe(0)
    })
  })

  describe('isFieldAllowed', () => {
    it('should return true for allowed field', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      
      expect(isFieldAllowed(contract, field)).toBe(true)
    })

    it('should return false for non-allowed field', () => {
      const field1 = createFieldReference('form1', 'field1', 'string')
      const field2 = createFieldReference('form1', 'field2', 'string')
      const contract = createWritebackContract('form1', [field1])
      
      expect(isFieldAllowed(contract, field2)).toBe(false)
    })
  })

  describe('getFieldPermission', () => {
    it('should return the configured permission', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      
      expect(getFieldPermission(contract, field)).toBe('edit')
    })

    it('should return read-only as default', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      
      expect(getFieldPermission(contract, field)).toBe('read-only')
    })
  })

  describe('canWriteField', () => {
    it('should allow write for edit permission', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      const result = canWriteField(contract, field)
      
      expect(result.allowed).toBe(true)
      expect(result.permissionLevel).toBe('edit')
    })

    it('should deny write for read-only permission', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      const result = canWriteField(contract, field)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Field is read-only')
    })

    it('should deny write for non-allowed field', () => {
      const field1 = createFieldReference('form1', 'field1', 'string')
      const field2 = createFieldReference('form1', 'field2', 'string')
      const contract = createWritebackContract('form1', [field1])
      const result = canWriteField(contract, field2)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Field is not in the allowed list')
    })
  })

  describe('checkFieldPermissions', () => {
    it('should check permissions for multiple fields', () => {
      const field1 = createFieldReference('form1', 'field1', 'string')
      const field2 = createFieldReference('form1', 'field2', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      
      const contract = createWritebackContract('form1', [field1, field2], { fieldPermissions: permissions })
      const results = checkFieldPermissions(contract, [field1, field2])
      
      expect(results).toHaveLength(2)
      expect(results[0].allowed).toBe(true)
      expect(results[1].allowed).toBe(false)
    })
  })

  describe('validateValueAgainstRule', () => {
    it('should pass required rule for non-empty value', () => {
      const rule = createValidationRule('required', 'Field is required')
      const result = validateValueAgainstRule('value', rule)
      
      expect(result.valid).toBe(true)
    })

    it('should fail required rule for empty value', () => {
      const rule = createValidationRule('required', 'Field is required')
      const result = validateValueAgainstRule('', rule)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Field is required')
    })

    it('should fail required rule for null', () => {
      const rule = createValidationRule('required', 'Field is required')
      const result = validateValueAgainstRule(null, rule)
      
      expect(result.valid).toBe(false)
    })

    it('should pass type-check rule', () => {
      const rule = createValidationRule('type-check', 'Must be number', { type: 'number' })
      const result = validateValueAgainstRule(42, rule)
      
      expect(result.valid).toBe(true)
    })

    it('should fail type-check rule', () => {
      const rule = createValidationRule('type-check', 'Must be number', { type: 'number' })
      const result = validateValueAgainstRule('string', rule)
      
      expect(result.valid).toBe(false)
    })

    it('should pass format rule', () => {
      const rule = createValidationRule('format', 'Invalid format', { pattern: '^[a-z]+$' })
      const result = validateValueAgainstRule('abc', rule)
      
      expect(result.valid).toBe(true)
    })

    it('should fail format rule', () => {
      const rule = createValidationRule('format', 'Invalid format', { pattern: '^[a-z]+$' })
      const result = validateValueAgainstRule('ABC', rule)
      
      expect(result.valid).toBe(false)
    })

    it('should pass range rule', () => {
      const rule = createValidationRule('range', 'Out of range', { min: 0, max: 100 })
      const result = validateValueAgainstRule(50, rule)
      
      expect(result.valid).toBe(true)
    })

    it('should fail range rule for value below min', () => {
      const rule = createValidationRule('range', 'Out of range', { min: 0, max: 100 })
      const result = validateValueAgainstRule(-1, rule)
      
      expect(result.valid).toBe(false)
    })

    it('should fail range rule for value above max', () => {
      const rule = createValidationRule('range', 'Out of range', { min: 0, max: 100 })
      const result = validateValueAgainstRule(101, rule)
      
      expect(result.valid).toBe(false)
    })
  })

  describe('validateFieldUpdate', () => {
    it('should pass validation with no rules', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'value')
      const result = validateFieldUpdate(update, [])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation with failing rule', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, '')
      const rules = [createValidationRule('required', 'Field is required')]
      const result = validateFieldUpdate(update, rules)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Field is required')
    })
  })

  describe('extractValueByPath', () => {
    it('should extract root value', () => {
      const result: NormalizedResult = {
        resultId: 'result1',
        outputType: 'value',
        value: 'test',
        sourceTool: 'test-tool',
        timestamp: Date.now()
      }
      
      expect(extractValueByPath(result, '')).toBe('test')
      expect(extractValueByPath(result, '.')).toBe('test')
      expect(extractValueByPath(result, '$')).toBe('test')
    })

    it('should extract nested value', () => {
      const result: NormalizedResult = {
        resultId: 'result1',
        outputType: 'object',
        value: { user: { name: 'John', age: 30 } },
        sourceTool: 'test-tool',
        timestamp: Date.now()
      }
      
      expect(extractValueByPath(result, 'user.name')).toBe('John')
      expect(extractValueByPath(result, 'user.age')).toBe(30)
    })

    it('should return undefined for missing path', () => {
      const result: NormalizedResult = {
        resultId: 'result1',
        outputType: 'object',
        value: { user: { name: 'John' } },
        sourceTool: 'test-tool',
        timestamp: Date.now()
      }
      
      expect(extractValueByPath(result, 'user.missing')).toBeUndefined()
    })
  })

  describe('mapResultToUpdates', () => {
    it('should map result to updates', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const mapping = createResultToFieldMapping('user.name', field, { required: true })
      
      const result: NormalizedResult = {
        resultId: 'result1',
        outputType: 'object',
        value: { user: { name: 'John' } },
        sourceTool: 'test-tool',
        timestamp: Date.now()
      }
      
      const updates = mapResultToUpdates(result, [mapping])
      
      expect(updates).toHaveLength(1)
      expect(updates[0].newValue).toBe('John')
    })

    it('should skip non-required missing values', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const mapping = createResultToFieldMapping('missing', field, { required: false })
      
      const result: NormalizedResult = {
        resultId: 'result1',
        outputType: 'object',
        value: {},
        sourceTool: 'test-tool',
        timestamp: Date.now()
      }
      
      const updates = mapResultToUpdates(result, [mapping])
      
      expect(updates).toHaveLength(0)
    })

    it('should include undefined for required missing values', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const mapping = createResultToFieldMapping('missing', field, { required: true })
      
      const result: NormalizedResult = {
        resultId: 'result1',
        outputType: 'object',
        value: {},
        sourceTool: 'test-tool',
        timestamp: Date.now()
      }
      
      const updates = mapResultToUpdates(result, [mapping])
      
      expect(updates).toHaveLength(1)
      expect(updates[0].newValue).toBeUndefined()
    })
  })

  describe('updateFieldStatus', () => {
    it('should update field status', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'value')
      const updated = updateFieldStatus(update, 'applied')
      
      expect(updated.status).toBe('applied')
      expect(updated.updatedAt).toBeGreaterThanOrEqual(update.updatedAt)
    })

    it('should update field status with errors', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'value')
      const updated = updateFieldStatus(update, 'rejected', ['Error 1', 'Error 2'])
      
      expect(updated.status).toBe('rejected')
      expect(updated.validationErrors).toEqual(['Error 1', 'Error 2'])
    })
  })

  describe('updateWritebackStatus', () => {
    it('should update writeback status', () => {
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const updated = updateWritebackStatus(action, 'in-progress')
      
      expect(updated.status).toBe('in-progress')
      expect(updated.updatedAt).toBeGreaterThanOrEqual(action.updatedAt)
    })

    it('should set completedAt for terminal status', () => {
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const updated = updateWritebackStatus(action, 'completed')
      
      expect(updated.completedAt).toBeGreaterThan(0)
    })

    it('should not set completedAt for non-terminal status', () => {
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const updated = updateWritebackStatus(action, 'in-progress')
      
      expect(updated.completedAt).toBeUndefined()
    })
  })

  describe('executeWriteback', () => {
    it('should fail without contract', () => {
      const store = createWritebackAdapterStore()
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      
      const result = executeWriteback(store, action)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No writeback contract found')
    })

    it('should fail if requires approval', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field], { requiresApproval: true })
      const registeredStore = registerContract(store, contract)
      
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      
      const result = executeWriteback(registeredStore, action)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Writeback requires approval')
    })

    it('should reject updates without permission', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, 'value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action)
      
      expect(result.success).toBe(false)
      expect(result.rejectedUpdates).toHaveLength(1)
    })

    it('should apply updates with permission', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, 'new value', 'old value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action)
      
      expect(result.success).toBe(true)
      expect(result.appliedUpdates).toHaveLength(1)
    })

    it('should skip unchanged values', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, 'same value', 'same value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action)
      
      expect(result.appliedUpdates).toHaveLength(0)
    })

    it('should force update unchanged values', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, 'same value', 'same value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action, { forceUpdate: true })
      
      expect(result.appliedUpdates).toHaveLength(1)
    })

    it('should skip permission check', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, 'new value', 'old value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action, { skipPermissionCheck: true })
      
      expect(result.appliedUpdates).toHaveLength(1)
    })

    it('should validate with rules', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      const rules = new Map<string, FieldValidationRule[]>()
      rules.set('form1:field1', [createValidationRule('required', 'Required')])
      
      const contract = createWritebackContract('form1', [field], {
        fieldPermissions: permissions,
        validationRules: rules
      })
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, '', 'old value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action)
      
      expect(result.rejectedUpdates).toHaveLength(1)
    })

    it('should skip validation', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      const rules = new Map<string, FieldValidationRule[]>()
      rules.set('form1:field1', [createValidationRule('required', 'Required')])
      
      const contract = createWritebackContract('form1', [field], {
        fieldPermissions: permissions,
        validationRules: rules
      })
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, '', 'old value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action, { skipValidation: true })
      
      expect(result.appliedUpdates).toHaveLength(1)
    })

    it('should do dry run', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      const registeredStore = registerContract(store, contract)
      
      const update = createFieldUpdate(field, 'new value', 'old value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const result = executeWriteback(registeredStore, action, { dryRun: true })
      
      expect(result.success).toBe(true)
      expect(result.trace.some(e => e.message.includes('[DRY RUN]'))).toBe(true)
    })
  })

  describe('Store Operations', () => {
    it('should register a contract', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      
      const newStore = registerContract(store, contract)
      
      expect(newStore.contracts.size).toBe(1)
      expect(getContract(newStore, 'form1')).toBe(contract)
      // Original store unchanged
      expect(store.contracts.size).toBe(0)
    })

    it('should add an action', () => {
      const store = createWritebackAdapterStore()
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      
      const newStore = addAction(store, action)
      
      expect(newStore.actions.size).toBe(1)
      expect(getAction(newStore, action.actionId)).toBe(action)
    })

    it('should add trace entries', () => {
      const store = createWritebackAdapterStore()
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const storeWithAction = addAction(store, action)
      
      const entry = createWritebackTraceEntry(action.actionId, 'update', 'Test')
      const newStore = addTraceEntries(storeWithAction, action.actionId, [entry])
      
      const traces = getTraceEntries(newStore, action.actionId)
      expect(traces).toHaveLength(1)
    })

    it('should get actions by form', () => {
      const store = createWritebackAdapterStore()
      const action1 = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const action2 = createWritebackAction('session1', 'trace2', 'form2', 'tool')
      
      let newStore = addAction(store, action1)
      newStore = addAction(newStore, action2)
      
      const form1Actions = getActionsByForm(newStore, 'form1')
      expect(form1Actions).toHaveLength(1)
    })

    it('should get actions by session', () => {
      const store = createWritebackAdapterStore()
      const action1 = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const action2 = createWritebackAction('session2', 'trace2', 'form1', 'tool')
      
      let newStore = addAction(store, action1)
      newStore = addAction(newStore, action2)
      
      const session1Actions = getActionsBySession(newStore, 'session1')
      expect(session1Actions).toHaveLength(1)
    })

    it('should get actions by status', () => {
      const store = createWritebackAdapterStore()
      const action1 = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      let action2 = createWritebackAction('session1', 'trace2', 'form1', 'tool')
      action2 = updateWritebackStatus(action2, 'completed')
      
      let newStore = addAction(store, action1)
      newStore = addAction(newStore, action2)
      
      const pendingActions = getActionsByStatus(newStore, 'pending')
      expect(pendingActions).toHaveLength(1)
      
      const completedActions = getActionsByStatus(newStore, 'completed')
      expect(completedActions).toHaveLength(1)
    })
  })

  describe('Serialization', () => {
    it('should serialize and deserialize contract', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const permissions = new Map<string, 'edit' | 'admin' | 'read-only'>()
      permissions.set('form1:field1', 'edit')
      
      const contract = createWritebackContract('form1', [field], { fieldPermissions: permissions })
      
      const serialized = serializeContract(contract)
      const deserialized = deserializeContract(serialized)
      
      expect(deserialized.formId).toBe(contract.formId)
      expect(deserialized.allowedFields).toEqual(contract.allowedFields)
      expect(deserialized.fieldPermissions.size).toBe(1)
    })

    it('should serialize and deserialize action', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'value')
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool', [update])
      
      const serialized = serializeAction(action)
      const deserialized = deserializeAction(serialized)
      
      expect(deserialized.actionId).toBe(action.actionId)
      expect(deserialized.updates).toHaveLength(1)
    })

    it('should serialize and deserialize store', () => {
      const store = createWritebackAdapterStore()
      const field = createFieldReference('form1', 'field1', 'string')
      const contract = createWritebackContract('form1', [field])
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      
      let newStore = registerContract(store, contract)
      newStore = addAction(newStore, action)
      
      const serialized = serializeWritebackStore(newStore)
      const deserialized = deserializeWritebackStore(serialized)
      
      expect(deserialized.contracts.size).toBe(1)
      expect(deserialized.actions.size).toBe(1)
    })
  })

  describe('Debug Formatting', () => {
    it('should format field reference', () => {
      const field = createFieldReference('form1', 'field1', 'string', { fieldPath: 'user.name' })
      const formatted = formatFieldReference(field)
      
      expect(formatted).toContain('form1')
      expect(formatted).toContain('field1')
      expect(formatted).toContain('string')
      expect(formatted).toContain('user.name')
    })

    it('should format field update', () => {
      const field = createFieldReference('form1', 'field1', 'string')
      const update = createFieldUpdate(field, 'new', 'old')
      const formatted = formatFieldUpdate(update)
      
      expect(formatted).toContain(update.updateId)
      expect(formatted).toContain('pending')
    })

    it('should format writeback action', () => {
      const action = createWritebackAction('session1', 'trace1', 'form1', 'tool')
      const formatted = formatWritebackAction(action)
      
      expect(formatted).toContain(action.actionId)
      expect(formatted).toContain('form1')
      expect(formatted).toContain('session1')
    })

    it('should format writeback result', () => {
      const result: WritebackResult = {
        success: true,
        actionId: 'action1',
        appliedUpdates: [],
        rejectedUpdates: [],
        failedUpdates: [],
        trace: []
      }
      
      const formatted = formatWritebackResult(result)
      
      expect(formatted).toContain('Success: true')
      expect(formatted).toContain('action1')
    })

    it('should format trace entry', () => {
      const entry = createWritebackTraceEntry('action1', 'update', 'Field updated')
      const formatted = formatTraceEntry(entry)
      
      expect(formatted).toContain('update')
      expect(formatted).toContain('Field updated')
    })
  })
})
