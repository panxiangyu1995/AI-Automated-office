/**
 * User Tenant and Department Context
 * Task 76: Story 47.1 - User Tenant and Department Context
 * 
 * Provides context envelope for user, tenant, and department data
 * to be injected into runtime execution context.
 */

import type { User, PermissionSummary } from '@/features/auth/types/auth.types'

// ==================== Context Types ====================

/**
 * Department information
 */
export interface DepartmentInfo {
  id: string
  name: string
  code?: string
  parentId?: string
  path?: string[]           // Path from root to this department
  level?: number
}

/**
 * Tenant information
 */
export interface TenantInfo {
  id: string
  name: string
  code?: string
  tier?: 'free' | 'basic' | 'professional' | 'enterprise'
  status?: 'active' | 'suspended' | 'trial'
  features?: string[]       // Enabled features for this tenant
  limits?: TenantLimits
}

/**
 * Tenant limits and quotas
 */
export interface TenantLimits {
  maxUsers?: number
  maxDepartments?: number
  maxStorageMB?: number
  maxApiCalls?: number
  maxSessions?: number
}

/**
 * User identity context
 */
export interface UserIdentity {
  userId: string
  username: string
  displayName: string
  email?: string
  avatarUrl?: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt?: number
  lastLoginAt?: number
}

/**
 * User role context
 */
export interface UserRoleContext {
  primaryRole: string
  roles: string[]
  permissions: string[]
  dataScopes: Record<string, string>
  departmentIds: string[]
}

/**
 * Organization context
 */
export interface OrganizationContext {
  tenant: TenantInfo
  department: DepartmentInfo | null
  departments: DepartmentInfo[]     // All accessible departments
  effectivePermissions: string[]    // Merged permissions
}

/**
 * Runtime context envelope
 * Contains all identity and organizational data needed for runtime execution
 */
export interface UserContextEnvelope {
  // Identity
  identity: UserIdentity
  
  // Roles and permissions
  roles: UserRoleContext
  
  // Organization
  organization: OrganizationContext
  
  // Metadata
  contextId: string
  createdAt: number
  expiresAt?: number
  
  // Source tracking
  source: 'session' | 'token' | 'cache'
}

/**
 * Normalized context payload
 * Standard format for department-specific operations
 */
export interface NormalizedContextPayload {
  // User identification
  userId: string
  username: string
  displayName: string
  
  // Tenant identification
  tenantId: string
  tenantName: string
  
  // Department identification
  departmentId: string | null
  departmentName: string | null
  
  // Role and permission summary
  primaryRole: string
  allRoles: string[]
  allPermissions: string[]
  
  // Data scope
  dataScopes: Record<string, string>
  departmentIds: string[]
  
  // Feature flags
  enabledFeatures: string[]
  
  // Timestamps
  contextCreatedAt: number
  contextExpiresAt?: number
}

// ==================== Context Factory ====================

/**
 * Create user identity from User type
 */
export function createUserIdentity(user: User): UserIdentity {
  return {
    userId: user.id,
    username: user.username,
    displayName: user.name,
    email: user.email,
    status: user.status ?? 'active',
  }
}

/**
 * Create user role context from permission summary
 */
export function createUserRoleContext(
  primaryRole: string,
  permissions?: PermissionSummary
): UserRoleContext {
  return {
    primaryRole,
    roles: permissions?.roles ?? [primaryRole],
    permissions: permissions?.permissions ?? [],
    dataScopes: permissions?.dataScopes ?? {},
    departmentIds: permissions?.department_ids ?? [],
  }
}

/**
 * Create organization context
 */
export function createOrganizationContext(
  tenant: TenantInfo,
  department: DepartmentInfo | null,
  departments: DepartmentInfo[],
  userPermissions: string[]
): OrganizationContext {
  return {
    tenant,
    department,
    departments,
    effectivePermissions: userPermissions,
  }
}

/**
 * Generate unique context ID
 */
export function generateContextId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `ctx_${timestamp}_${random}`
}

/**
 * Create user context envelope
 */
export function createUserContextEnvelope(
  user: User,
  permissions: PermissionSummary | null,
  tenant: TenantInfo,
  department: DepartmentInfo | null,
  departments: DepartmentInfo[],
  options: {
    expiresIn?: number
    source?: 'session' | 'token' | 'cache'
  } = {}
): UserContextEnvelope {
  const now = Date.now()
  const contextId = generateContextId()
  
  const identity = createUserIdentity(user)
  const roles = createUserRoleContext(user.role, permissions ?? undefined)
  const organization = createOrganizationContext(
    tenant,
    department,
    departments,
    roles.permissions
  )
  
  return {
    identity,
    roles,
    organization,
    contextId,
    createdAt: now,
    expiresAt: options.expiresIn ? now + options.expiresIn : undefined,
    source: options.source ?? 'session',
  }
}

// ==================== Context Normalization ====================

/**
 * Normalize context payload for department-specific operations
 */
export function normalizeContextPayload(
  envelope: UserContextEnvelope
): NormalizedContextPayload {
  return {
    // User identification
    userId: envelope.identity.userId,
    username: envelope.identity.username,
    displayName: envelope.identity.displayName,
    
    // Tenant identification
    tenantId: envelope.organization.tenant.id,
    tenantName: envelope.organization.tenant.name,
    
    // Department identification
    departmentId: envelope.organization.department?.id ?? null,
    departmentName: envelope.organization.department?.name ?? null,
    
    // Role and permission summary
    primaryRole: envelope.roles.primaryRole,
    allRoles: envelope.roles.roles,
    allPermissions: envelope.organization.effectivePermissions,
    
    // Data scope
    dataScopes: envelope.roles.dataScopes,
    departmentIds: envelope.roles.departmentIds,
    
    // Feature flags
    enabledFeatures: envelope.organization.tenant.features ?? [],
    
    // Timestamps
    contextCreatedAt: envelope.createdAt,
    contextExpiresAt: envelope.expiresAt,
  }
}

/**
 * Normalize context for a specific department
 */
export function normalizeForDepartment(
  envelope: UserContextEnvelope,
  departmentId: string
): NormalizedContextPayload | null {
  // Check if user has access to this department
  const hasAccess = envelope.roles.departmentIds.includes(departmentId) ||
    envelope.organization.departments.some(d => d.id === departmentId)
  
  if (!hasAccess) {
    return null
  }
  
  const department = envelope.organization.departments.find(d => d.id === departmentId)
  
  return {
    userId: envelope.identity.userId,
    username: envelope.identity.username,
    displayName: envelope.identity.displayName,
    tenantId: envelope.organization.tenant.id,
    tenantName: envelope.organization.tenant.name,
    departmentId,
    departmentName: department?.name ?? null,
    primaryRole: envelope.roles.primaryRole,
    allRoles: envelope.roles.roles,
    allPermissions: envelope.organization.effectivePermissions,
    dataScopes: envelope.roles.dataScopes,
    departmentIds: [departmentId],
    enabledFeatures: envelope.organization.tenant.features ?? [],
    contextCreatedAt: envelope.createdAt,
    contextExpiresAt: envelope.expiresAt,
  }
}

// ==================== Context Validation ====================

/**
 * Check if context envelope is expired
 */
export function isContextExpired(envelope: UserContextEnvelope): boolean {
  if (!envelope.expiresAt) return false
  return Date.now() > envelope.expiresAt
}

/**
 * Check if context envelope is valid
 */
export function isContextValid(envelope: UserContextEnvelope): boolean {
  // Check expiration
  if (isContextExpired(envelope)) return false
  
  // Check required fields
  if (!envelope.identity.userId) return false
  if (!envelope.organization.tenant.id) return false
  
  return true
}

/**
 * Validate context envelope and return validation result
 */
export function validateContext(envelope: UserContextEnvelope): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check required identity fields
  if (!envelope.identity.userId) {
    errors.push('Missing userId in identity')
  }
  if (!envelope.identity.username) {
    errors.push('Missing username in identity')
  }
  
  // Check required organization fields
  if (!envelope.organization.tenant.id) {
    errors.push('Missing tenant id in organization')
  }
  if (!envelope.organization.tenant.name) {
    errors.push('Missing tenant name in organization')
  }
  
  // Check expiration
  if (isContextExpired(envelope)) {
    errors.push('Context envelope has expired')
  }
  
  // Check role information
  if (!envelope.roles.primaryRole) {
    errors.push('Missing primary role')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// ==================== Context Merger ====================

/**
 * Merge multiple permission arrays
 */
export function mergePermissions(...permissionArrays: string[][]): string[] {
  const permissionSet = new Set<string>()
  
  for (const permissions of permissionArrays) {
    for (const permission of permissions) {
      permissionSet.add(permission)
    }
  }
  
  return Array.from(permissionSet)
}

/**
 * Merge data scopes
 */
export function mergeDataScopes(...scopeRecords: Record<string, string>[]): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const scopes of scopeRecords) {
    Object.assign(result, scopes)
  }
  
  return result
}

// ==================== Permission Model Integration ====================

/**
 * Permission model identifiers
 * Reuses existing permission model from auth types
 */
export const PermissionModelIdentifiers = {
  // Role-based permissions
  ROLE_PREFIX: 'role:',
  
  // Department-based permissions
  DEPARTMENT_PREFIX: 'dept:',
  
  // Feature-based permissions
  FEATURE_PREFIX: 'feature:',
  
  // Data scope permissions
  DATA_SCOPE_PREFIX: 'scope:',
  
  // Wildcard for full access
  WILDCARD: '*',
} as const

/**
 * Check if permission is role-based
 */
export function isRolePermission(permission: string): boolean {
  return permission.startsWith(PermissionModelIdentifiers.ROLE_PREFIX)
}

/**
 * Check if permission is department-based
 */
export function isDepartmentPermission(permission: string): boolean {
  return permission.startsWith(PermissionModelIdentifiers.DEPARTMENT_PREFIX)
}

/**
 * Check if permission is feature-based
 */
export function isFeaturePermission(permission: string): boolean {
  return permission.startsWith(PermissionModelIdentifiers.FEATURE_PREFIX)
}

/**
 * Extract role from permission
 */
export function extractRoleFromPermission(permission: string): string | null {
  if (!isRolePermission(permission)) return null
  return permission.slice(PermissionModelIdentifiers.ROLE_PREFIX.length)
}

/**
 * Extract department from permission
 */
export function extractDepartmentFromPermission(permission: string): string | null {
  if (!isDepartmentPermission(permission)) return null
  return permission.slice(PermissionModelIdentifiers.DEPARTMENT_PREFIX.length)
}

/**
 * Create role permission identifier
 */
export function createRolePermission(role: string): string {
  return `${PermissionModelIdentifiers.ROLE_PREFIX}${role}`
}

/**
 * Create department permission identifier
 */
export function createDepartmentPermission(departmentId: string): string {
  return `${PermissionModelIdentifiers.DEPARTMENT_PREFIX}${departmentId}`
}

/**
 * Create feature permission identifier
 */
export function createFeaturePermission(feature: string): string {
  return `${PermissionModelIdentifiers.FEATURE_PREFIX}${feature}`
}

// ==================== Context Injection ====================

/**
 * Inject context into runtime state
 */
export function injectContextToRuntime<T extends Record<string, unknown>>(
  runtimeState: T,
  context: UserContextEnvelope
): T & { userContext: NormalizedContextPayload } {
  return {
    ...runtimeState,
    userContext: normalizeContextPayload(context),
  }
}

/**
 * Context injection options
 */
export interface ContextInjectionOptions {
  includeExpired?: boolean
  normalizeForDepartment?: string
}

/**
 * Safe context injection with validation
 */
export function safeInjectContext<T extends Record<string, unknown>>(
  runtimeState: T,
  context: UserContextEnvelope,
  options: ContextInjectionOptions = {}
): {
  success: boolean
  state?: T & { userContext: NormalizedContextPayload }
  error?: string
} {
  // Validate context
  const validation = validateContext(context)
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('; '),
    }
  }
  
  // Check expiration unless explicitly allowed
  if (!options.includeExpired && isContextExpired(context)) {
    return {
      success: false,
      error: 'Context envelope has expired',
    }
  }
  
  // Normalize for specific department if requested
  let normalizedPayload: NormalizedContextPayload
  
  if (options.normalizeForDepartment) {
    const departmentPayload = normalizeForDepartment(context, options.normalizeForDepartment)
    
    if (!departmentPayload) {
      return {
        success: false,
        error: `User does not have access to department: ${options.normalizeForDepartment}`,
      }
    }
    
    normalizedPayload = departmentPayload
  } else {
    normalizedPayload = normalizeContextPayload(context)
  }
  
  return {
    success: true,
    state: {
      ...runtimeState,
      userContext: normalizedPayload,
    },
  }
}

// ==================== Context Factory Helpers ====================

/**
 * Create default tenant info
 */
export function createDefaultTenantInfo(tenantId: string = 'default'): TenantInfo {
  return {
    id: tenantId,
    name: 'Default Tenant',
    tier: 'basic',
    status: 'active',
    features: [],
    limits: {
      maxUsers: 100,
      maxDepartments: 20,
      maxStorageMB: 1024,
      maxSessions: 50,
    },
  }
}

/**
 * Create default department info
 */
export function createDefaultDepartmentInfo(departmentId: string, name: string): DepartmentInfo {
  return {
    id: departmentId,
    name,
    level: 1,
    path: [departmentId],
  }
}

/**
 * Create minimal context envelope for testing or fallback
 */
export function createMinimalContextEnvelope(
  userId: string,
  username: string,
  tenantId: string = 'default'
): UserContextEnvelope {
  const now = Date.now()
  
  return {
    identity: {
      userId,
      username,
      displayName: username,
      status: 'active',
    },
    roles: {
      primaryRole: 'user',
      roles: ['user'],
      permissions: [],
      dataScopes: {},
      departmentIds: [],
    },
    organization: {
      tenant: createDefaultTenantInfo(tenantId),
      department: null,
      departments: [],
      effectivePermissions: [],
    },
    contextId: generateContextId(),
    createdAt: now,
    source: 'cache',
  }
}
