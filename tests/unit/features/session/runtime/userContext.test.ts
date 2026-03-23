/**
 * Tests for User Tenant and Department Context
 * Task 76: Story 47.1 - User Tenant and Department Context
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  // Types
  type UserContextEnvelope,
  type NormalizedContextPayload,
  type DepartmentInfo,
  type TenantInfo,
  type UserIdentity,
  type UserRoleContext,
  type OrganizationContext,
  
  // Factory functions
  createUserIdentity,
  createUserRoleContext,
  createOrganizationContext,
  generateContextId,
  createUserContextEnvelope,
  
  // Normalization functions
  normalizeContextPayload,
  normalizeForDepartment,
  
  // Validation functions
  isContextExpired,
  isContextValid,
  validateContext,
  
  // Merge functions
  mergePermissions,
  mergeDataScopes,
  
  // Permission model
  PermissionModelIdentifiers,
  isRolePermission,
  isDepartmentPermission,
  isFeaturePermission,
  extractRoleFromPermission,
  extractDepartmentFromPermission,
  createRolePermission,
  createDepartmentPermission,
  createFeaturePermission,
  
  // Injection functions
  injectContextToRuntime,
  safeInjectContext,
  
  // Helper factories
  createDefaultTenantInfo,
  createDefaultDepartmentInfo,
  createMinimalContextEnvelope,
} from '@/features/session/runtime/userContext'
import type { User, PermissionSummary } from '@/features/auth/types/auth.types'

// ==================== Test Fixtures ====================

const mockUser: User = {
  id: 'user-123',
  username: 'johndoe',
  name: 'John Doe',
  email: 'john@example.com',
  department: 'engineering',
  role: 'admin',
  roles: ['admin', 'developer'],
  status: 'active',
}

const mockPermissions: PermissionSummary = {
  roles: ['admin', 'developer'],
  permissions: ['read', 'write', 'delete', 'manage_users'],
  dataScopes: {
    department: 'engineering',
    region: 'us-west',
  },
  department_ids: ['dept-1', 'dept-2'],
}

const mockTenant: TenantInfo = {
  id: 'tenant-123',
  name: 'Acme Corp',
  code: 'ACME',
  tier: 'enterprise',
  status: 'active',
  features: ['advanced_analytics', 'custom_workflows'],
  limits: {
    maxUsers: 1000,
    maxDepartments: 50,
    maxStorageMB: 10240,
    maxSessions: 500,
  },
}

const mockDepartment: DepartmentInfo = {
  id: 'dept-1',
  name: 'Engineering',
  code: 'ENG',
  parentId: 'dept-0',
  path: ['dept-0', 'dept-1'],
  level: 2,
}

const mockDepartments: DepartmentInfo[] = [
  mockDepartment,
  {
    id: 'dept-2',
    name: 'Product',
    code: 'PROD',
    parentId: 'dept-0',
    path: ['dept-0', 'dept-2'],
    level: 2,
  },
]

// ==================== Factory Function Tests ====================

describe('createUserIdentity', () => {
  it('should create user identity from User object', () => {
    const identity = createUserIdentity(mockUser)
    
    expect(identity.userId).toBe('user-123')
    expect(identity.username).toBe('johndoe')
    expect(identity.displayName).toBe('John Doe')
    expect(identity.email).toBe('john@example.com')
    expect(identity.status).toBe('active')
  })

  it('should default status to active if not provided', () => {
    const userWithoutStatus: User = {
      id: 'user-456',
      username: 'janedoe',
      name: 'Jane Doe',
      department: 'sales',
      role: 'user',
    }
    
    const identity = createUserIdentity(userWithoutStatus)
    
    expect(identity.status).toBe('active')
  })
})

describe('createUserRoleContext', () => {
  it('should create role context with permissions', () => {
    const roleContext = createUserRoleContext('admin', mockPermissions)
    
    expect(roleContext.primaryRole).toBe('admin')
    expect(roleContext.roles).toEqual(['admin', 'developer'])
    expect(roleContext.permissions).toEqual(['read', 'write', 'delete', 'manage_users'])
    expect(roleContext.dataScopes).toEqual({ department: 'engineering', region: 'us-west' })
    expect(roleContext.departmentIds).toEqual(['dept-1', 'dept-2'])
  })

  it('should create role context without permissions', () => {
    const roleContext = createUserRoleContext('user')
    
    expect(roleContext.primaryRole).toBe('user')
    expect(roleContext.roles).toEqual(['user'])
    expect(roleContext.permissions).toEqual([])
    expect(roleContext.dataScopes).toEqual({})
    expect(roleContext.departmentIds).toEqual([])
  })
})

describe('createOrganizationContext', () => {
  it('should create organization context with all fields', () => {
    const userPermissions = ['read', 'write']
    const orgContext = createOrganizationContext(
      mockTenant,
      mockDepartment,
      mockDepartments,
      userPermissions
    )
    
    expect(orgContext.tenant).toEqual(mockTenant)
    expect(orgContext.department).toEqual(mockDepartment)
    expect(orgContext.departments).toEqual(mockDepartments)
    expect(orgContext.effectivePermissions).toEqual(userPermissions)
  })

  it('should handle null department', () => {
    const orgContext = createOrganizationContext(
      mockTenant,
      null,
      mockDepartments,
      []
    )
    
    expect(orgContext.department).toBeNull()
  })
})

describe('generateContextId', () => {
  it('should generate unique context IDs', () => {
    const id1 = generateContextId()
    const id2 = generateContextId()
    
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^ctx_[a-z0-9]+_[a-z0-9]+$/)
  })
})

describe('createUserContextEnvelope', () => {
  it('should create complete context envelope', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    expect(envelope.identity.userId).toBe('user-123')
    expect(envelope.roles.primaryRole).toBe('admin')
    expect(envelope.organization.tenant.id).toBe('tenant-123')
    expect(envelope.organization.department?.id).toBe('dept-1')
    expect(envelope.contextId).toMatch(/^ctx_/)
    expect(envelope.source).toBe('session')
    expect(envelope.expiresAt).toBeUndefined()
  })

  it('should create context envelope with expiration', () => {
    const expiresIn = 3600000 // 1 hour
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments,
      { expiresIn, source: 'token' }
    )
    
    expect(envelope.expiresAt).toBeDefined()
    expect(envelope.expiresAt! - envelope.createdAt).toBe(expiresIn)
    expect(envelope.source).toBe('token')
  })

  it('should handle null permissions', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      null,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    expect(envelope.roles.permissions).toEqual([])
    expect(envelope.roles.roles).toEqual(['admin'])
  })
})

// ==================== Normalization Tests ====================

describe('normalizeContextPayload', () => {
  it('should normalize context envelope to payload', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const payload = normalizeContextPayload(envelope)
    
    expect(payload.userId).toBe('user-123')
    expect(payload.username).toBe('johndoe')
    expect(payload.displayName).toBe('John Doe')
    expect(payload.tenantId).toBe('tenant-123')
    expect(payload.tenantName).toBe('Acme Corp')
    expect(payload.departmentId).toBe('dept-1')
    expect(payload.departmentName).toBe('Engineering')
    expect(payload.primaryRole).toBe('admin')
    expect(payload.allRoles).toEqual(['admin', 'developer'])
    expect(payload.enabledFeatures).toEqual(['advanced_analytics', 'custom_workflows'])
  })

  it('should handle null department in envelope', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      null,
      mockDepartments
    )
    
    const payload = normalizeContextPayload(envelope)
    
    expect(payload.departmentId).toBeNull()
    expect(payload.departmentName).toBeNull()
  })
})

describe('normalizeForDepartment', () => {
  it('should normalize for specific department user has access to', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const payload = normalizeForDepartment(envelope, 'dept-2')
    
    expect(payload).not.toBeNull()
    expect(payload!.departmentId).toBe('dept-2')
    expect(payload!.departmentName).toBe('Product')
  })

  it('should return null for department user does not have access to', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const payload = normalizeForDepartment(envelope, 'dept-999')
    
    expect(payload).toBeNull()
  })
})

// ==================== Validation Tests ====================

describe('isContextExpired', () => {
  it('should return false for non-expired context', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments,
      { expiresIn: 3600000 }
    )
    
    expect(isContextExpired(envelope)).toBe(false)
  })

  it('should return true for expired context', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments,
      { expiresIn: -1000 } // Already expired
    )
    
    expect(isContextExpired(envelope)).toBe(true)
  })

  it('should return false for context without expiration', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    expect(isContextExpired(envelope)).toBe(false)
  })
})

describe('isContextValid', () => {
  it('should return true for valid context', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    expect(isContextValid(envelope)).toBe(true)
  })

  it('should return false for expired context', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments,
      { expiresIn: -1000 }
    )
    
    expect(isContextValid(envelope)).toBe(false)
  })
})

describe('validateContext', () => {
  it('should return valid for complete context', () => {
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const result = validateContext(envelope)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for missing required fields', () => {
    const envelope = createMinimalContextEnvelope('', '')
    envelope.organization.tenant = { ...envelope.organization.tenant, id: '' }
    
    const result = validateContext(envelope)
    
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ==================== Merge Functions Tests ====================

describe('mergePermissions', () => {
  it('should merge multiple permission arrays', () => {
    const result = mergePermissions(
      ['read', 'write'],
      ['write', 'delete'],
      ['execute']
    )
    
    expect(result.sort()).toEqual(['delete', 'execute', 'read', 'write'])
  })

  it('should deduplicate permissions', () => {
    const result = mergePermissions(
      ['read', 'write'],
      ['read', 'write', 'delete']
    )
    
    expect(result.sort()).toEqual(['delete', 'read', 'write'])
  })

  it('should handle empty arrays', () => {
    const result = mergePermissions([], ['read'], [])
    
    expect(result).toEqual(['read'])
  })
})

describe('mergeDataScopes', () => {
  it('should merge data scope records', () => {
    const result = mergeDataScopes(
      { department: 'eng', region: 'us' },
      { region: 'eu', country: 'de' }
    )
    
    expect(result).toEqual({
      department: 'eng',
      region: 'eu',
      country: 'de',
    })
  })
})

// ==================== Permission Model Tests ====================

describe('Permission Model Identifiers', () => {
  it('should have correct prefix constants', () => {
    expect(PermissionModelIdentifiers.ROLE_PREFIX).toBe('role:')
    expect(PermissionModelIdentifiers.DEPARTMENT_PREFIX).toBe('dept:')
    expect(PermissionModelIdentifiers.FEATURE_PREFIX).toBe('feature:')
    expect(PermissionModelIdentifiers.WILDCARD).toBe('*')
  })
})

describe('Permission Type Checks', () => {
  it('should identify role permission', () => {
    expect(isRolePermission('role:admin')).toBe(true)
    expect(isRolePermission('dept:123')).toBe(false)
    expect(isRolePermission('feature:analytics')).toBe(false)
  })

  it('should identify department permission', () => {
    expect(isDepartmentPermission('dept:123')).toBe(true)
    expect(isDepartmentPermission('role:admin')).toBe(false)
    expect(isDepartmentPermission('feature:analytics')).toBe(false)
  })

  it('should identify feature permission', () => {
    expect(isFeaturePermission('feature:analytics')).toBe(true)
    expect(isFeaturePermission('role:admin')).toBe(false)
    expect(isFeaturePermission('dept:123')).toBe(false)
  })
})

describe('Permission Extraction', () => {
  it('should extract role from permission', () => {
    expect(extractRoleFromPermission('role:admin')).toBe('admin')
    expect(extractRoleFromPermission('dept:123')).toBeNull()
  })

  it('should extract department from permission', () => {
    expect(extractDepartmentFromPermission('dept:123')).toBe('123')
    expect(extractDepartmentFromPermission('role:admin')).toBeNull()
  })
})

describe('Permission Creation', () => {
  it('should create role permission', () => {
    expect(createRolePermission('admin')).toBe('role:admin')
  })

  it('should create department permission', () => {
    expect(createDepartmentPermission('dept-123')).toBe('dept:dept-123')
  })

  it('should create feature permission', () => {
    expect(createFeaturePermission('analytics')).toBe('feature:analytics')
  })
})

// ==================== Injection Tests ====================

describe('injectContextToRuntime', () => {
  it('should inject context into runtime state', () => {
    const runtimeState = { sessionId: 'session-123', state: 'running' }
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const result = injectContextToRuntime(runtimeState, envelope)
    
    expect(result.sessionId).toBe('session-123')
    expect(result.state).toBe('running')
    expect(result.userContext).toBeDefined()
    expect(result.userContext.userId).toBe('user-123')
  })
})

describe('safeInjectContext', () => {
  it('should safely inject valid context', () => {
    const runtimeState = { sessionId: 'session-123' }
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const result = safeInjectContext(runtimeState, envelope)
    
    expect(result.success).toBe(true)
    expect(result.state).toBeDefined()
    expect(result.state!.userContext).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it('should fail for expired context', () => {
    const runtimeState = { sessionId: 'session-123' }
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments,
      { expiresIn: -1000 }
    )
    
    const result = safeInjectContext(runtimeState, envelope)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should inject context for specific department', () => {
    const runtimeState = { sessionId: 'session-123' }
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const result = safeInjectContext(runtimeState, envelope, {
      normalizeForDepartment: 'dept-2',
    })
    
    expect(result.success).toBe(true)
    expect(result.state!.userContext.departmentId).toBe('dept-2')
  })

  it('should fail for inaccessible department', () => {
    const runtimeState = { sessionId: 'session-123' }
    const envelope = createUserContextEnvelope(
      mockUser,
      mockPermissions,
      mockTenant,
      mockDepartment,
      mockDepartments
    )
    
    const result = safeInjectContext(runtimeState, envelope, {
      normalizeForDepartment: 'dept-999',
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('does not have access')
  })
})

// ==================== Helper Factory Tests ====================

describe('createDefaultTenantInfo', () => {
  it('should create default tenant with default ID', () => {
    const tenant = createDefaultTenantInfo()
    
    expect(tenant.id).toBe('default')
    expect(tenant.name).toBe('Default Tenant')
    expect(tenant.tier).toBe('basic')
    expect(tenant.limits).toBeDefined()
  })

  it('should create default tenant with custom ID', () => {
    const tenant = createDefaultTenantInfo('custom-123')
    
    expect(tenant.id).toBe('custom-123')
  })
})

describe('createDefaultDepartmentInfo', () => {
  it('should create default department', () => {
    const dept = createDefaultDepartmentInfo('dept-123', 'Sales')
    
    expect(dept.id).toBe('dept-123')
    expect(dept.name).toBe('Sales')
    expect(dept.level).toBe(1)
    expect(dept.path).toEqual(['dept-123'])
  })
})

describe('createMinimalContextEnvelope', () => {
  it('should create minimal valid context', () => {
    const envelope = createMinimalContextEnvelope('user-123', 'testuser')
    
    expect(envelope.identity.userId).toBe('user-123')
    expect(envelope.identity.username).toBe('testuser')
    expect(envelope.organization.tenant.id).toBe('default')
    expect(envelope.roles.primaryRole).toBe('user')
    expect(envelope.source).toBe('cache')
  })

  it('should create minimal context with custom tenant', () => {
    const envelope = createMinimalContextEnvelope('user-123', 'testuser', 'tenant-456')
    
    expect(envelope.organization.tenant.id).toBe('tenant-456')
  })
})
