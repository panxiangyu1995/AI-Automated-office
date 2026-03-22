/**
 * Tool Permission Precheck
 * Task 72: Story 46.1 - Tool Permission Precheck
 * 
 * This module provides permission checking before any runtime tool call is executed.
 * It resolves required permissions from tool descriptors and validates against
 * user, department, and tenant permissions.
 */

import type {
  ToolDescriptor,
  ToolPermissionRequirement,
} from './toolDescriptor'
import type { ToolRegistry } from './toolRegistry'
import type { ToolRuntimeContext } from './toolExecutor'

// ==================== Types ====================

/**
 * Permission types supported by the system
 */
export type PermissionType =
  | 'execute'      // Permission to execute a tool
  | 'read'         // Permission to read data
  | 'write'        // Permission to write/modify data
  | 'delete'       // Permission to delete data
  | 'admin'        // Administrative permissions
  | 'sensitive'    // Access to sensitive operations
  | 'external'     // External API calls
  | 'file'         // File system operations
  | 'network'      // Network operations
  | 'system'       // System-level operations

/**
 * Permission resource types
 */
export type PermissionResource =
  | string  // Flexible resource identifier (e.g., 'tool:test_tool', 'data:users')

/**
 * Permission scope levels
 */
export type PermissionScope =
  | 'global'       // Global permission across all tenants
  | 'tenant'       // Tenant-level permission
  | 'department'   // Department-level permission
  | 'user'         // User-level permission

/**
 * Structured permission
 */
export interface Permission {
  type: PermissionType
  resource: PermissionResource
  scope: PermissionScope
  granted: boolean
  source?: string // Where the permission was granted from
  expiresAt?: number // Unix timestamp for temporary permissions
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions: Permission[]
  missingPermissions: Permission[]
  grantedPermissions: Permission[]
  decisionTime: number
  auditId: string
}

/**
 * Permission decision event for runtime stream
 */
export interface PermissionDecisionEvent {
  type: 'permission_decision'
  timestamp: number
  auditId: string
  toolId: string
  userId: string
  tenantId: string
  departmentId?: string
  result: PermissionCheckResult
  context: {
    source: 'precheck' | 'runtime' | 'override'
    correlationId: string
  }
}

/**
 * Permission resolver configuration
 */
export interface PermissionResolverConfig {
  enableCache: boolean
  cacheTTL: number // milliseconds
  enableAudit: boolean
  enableStrictMode: boolean // Fail closed if permissions can't be determined
  allowImplicitGrants: boolean // Allow implicit permissions (e.g., owner has all permissions)
}

/**
 * Permission cache entry
 */
interface PermissionCacheEntry {
  permissions: Permission[]
  resolvedAt: number
  expiresAt: number
}

/**
 * Permission stream listener
 */
export type PermissionStreamListener = (event: PermissionDecisionEvent) => void

// ==================== Default Configuration ====================

const DEFAULT_CONFIG: PermissionResolverConfig = {
  enableCache: true,
  cacheTTL: 60000, // 1 minute
  enableAudit: true,
  enableStrictMode: true,
  allowImplicitGrants: true,
}

// ==================== Permission Precheck Class ====================

/**
 * Permission Precheck
 * 
 * Provides pre-execution permission checking for tools.
 * Resolves required permissions from descriptors and validates
 * against user, department, and tenant permission stores.
 */
export class PermissionPrecheck {
  private registry: ToolRegistry
  private config: PermissionResolverConfig
  private permissionCache: Map<string, PermissionCacheEntry> = new Map()
  private streamListeners: Set<PermissionStreamListener> = new Set()
  private auditCounter: number = 0

  constructor(registry: ToolRegistry, config: Partial<PermissionResolverConfig> = {}) {
    this.registry = registry
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check permissions for a tool before execution
   */
  checkPermissions(
    toolId: string,
    context: ToolRuntimeContext,
    options: { correlationId?: string } = {}
  ): PermissionCheckResult {
    const startTime = Date.now()
    const auditId = this.generateAuditId()

    // Get tool descriptor
    const descriptor = this.registry.get(toolId)
    if (!descriptor) {
      const result = this.createDeniedResult(
        'Tool not found',
        auditId,
        startTime
      )
      this.emitDecision(result, toolId, context, auditId, options.correlationId)
      return result
    }

    // Resolve required permissions from descriptor
    const requiredPermissions = this.resolveRequiredPermissions(descriptor, context)

    // Get user's permissions
    const userPermissions = this.getUserPermissions(context)

    // Check each required permission
    const { granted, missing } = this.evaluatePermissions(requiredPermissions, userPermissions)

    const decisionTime = Date.now() - startTime

    const result: PermissionCheckResult = {
      allowed: granted,
      reason: granted ? undefined : `Missing required permissions: ${missing.map(p => this.formatPermission(p)).join(', ')}`,
      requiredPermissions,
      missingPermissions: missing,
      grantedPermissions: requiredPermissions.filter(p => !missing.includes(p)),
      decisionTime,
      auditId,
    }

    // Emit decision to runtime stream
    this.emitDecision(result, toolId, context, auditId, options.correlationId)

    return result
  }

  /**
   * Quick check if a tool can be executed
   */
  canExecute(toolId: string, context: ToolRuntimeContext): boolean {
    const result = this.checkPermissions(toolId, context)
    return result.allowed
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(context: ToolRuntimeContext): Permission[] {
    const cacheKey = `${context.tenantId}:${context.userId}`
    
    // Check cache
    if (this.config.enableCache) {
      const cached = this.permissionCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.permissions
      }
    }

    // Resolve permissions
    const permissions = this.resolveUserPermissions(context)

    // Cache results
    if (this.config.enableCache) {
      this.permissionCache.set(cacheKey, {
        permissions,
        resolvedAt: Date.now(),
        expiresAt: Date.now() + this.config.cacheTTL,
      })
    }

    return permissions
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(userId: string, tenantId: string): void {
    const cacheKey = `${tenantId}:${userId}`
    this.permissionCache.delete(cacheKey)
  }

  /**
   * Clear all permission cache
   */
  clearAllCache(): void {
    this.permissionCache.clear()
  }

  /**
   * Add a permission stream listener
   */
  addStreamListener(listener: PermissionStreamListener): () => void {
    this.streamListeners.add(listener)
    return () => this.streamListeners.delete(listener)
  }

  /**
   * Get permission statistics
   */
  getStatistics(): {
    cacheSize: number
    listenerCount: number
    auditCount: number
  } {
    return {
      cacheSize: this.permissionCache.size,
      listenerCount: this.streamListeners.size,
      auditCount: this.auditCounter,
    }
  }

  // ==================== Private Methods ====================

  private generateAuditId(): string {
    this.auditCounter++
    return `perm_audit_${Date.now()}_${this.auditCounter}`
  }

  private resolveRequiredPermissions(
    descriptor: ToolDescriptor,
    _context: ToolRuntimeContext
  ): Permission[] {
    const permissions: Permission[] = []

    // Add explicit permissions from descriptor
    if (descriptor.permissions) {
      for (const perm of descriptor.permissions) {
        permissions.push({
          type: perm.type as PermissionType,
          resource: perm.resource,
          scope: 'tenant', // Default scope
          granted: false,
        })
      }
    }

    // Only add implicit execute permission if tool has explicit permissions
    // Tools with no permissions defined are accessible to all
    if (permissions.length > 0) {
      const hasExecutePermission = permissions.some(p => p.type === 'execute')
      if (!hasExecutePermission) {
        permissions.push({
          type: 'execute',
          resource: `tool:${descriptor.id}`,
          scope: 'tenant',
          granted: false,
        })
      }
    }

    // Add capability-based permissions
    if (descriptor.capabilities) {
      if (descriptor.capabilities.hasSideEffects) {
        permissions.push({
          type: 'write',
          resource: 'system:actions',
          scope: 'tenant',
          granted: false,
        })
      }

      if (descriptor.capabilities.requiresConfirmation) {
        permissions.push({
          type: 'sensitive',
          resource: `tool:${descriptor.id}`,
          scope: 'tenant',
          granted: false,
        })
      }
    }

    return permissions
  }

  private resolveUserPermissions(context: ToolRuntimeContext): Permission[] {
    const permissions: Permission[] = []

    // Parse permission strings from context
    for (const permStr of context.permissions) {
      const parsed = this.parsePermissionString(permStr)
      if (parsed) {
        permissions.push({
          ...parsed,
          scope: 'tenant',
          granted: true,
          source: 'context',
        })
      }
    }

    // Add implicit permissions if enabled
    if (this.config.allowImplicitGrants) {
      // Users have read access to their own department's data
      if (context.departmentId) {
        permissions.push({
          type: 'read',
          resource: `department:${context.departmentId}`,
          scope: 'department',
          granted: true,
          source: 'implicit',
        })
      }

      // Admin users get admin permissions
      if (context.permissions.includes('admin')) {
        permissions.push({
          type: 'admin',
          resource: '*',
          scope: 'tenant',
          granted: true,
          source: 'implicit',
        })
      }
    }

    return permissions
  }

  private parsePermissionString(permStr: string): { type: PermissionType; resource: PermissionResource } | null {
    // Format: "type:resource" or "type:resource:scope"
    const parts = permStr.split(':')
    if (parts.length < 2) return null

    const type = parts[0] as PermissionType
    const resource = parts.slice(1).join(':')

    // Validate permission type
    const validTypes: PermissionType[] = [
      'execute', 'read', 'write', 'delete', 'admin',
      'sensitive', 'external', 'file', 'network', 'system'
    ]

    if (!validTypes.includes(type)) {
      return null
    }

    return { type, resource }
  }

  private evaluatePermissions(
    required: Permission[],
    userPerms: Permission[]
  ): { granted: boolean; missing: Permission[] } {
    const missing: Permission[] = []

    for (const req of required) {
      const hasPermission = this.hasPermission(req, userPerms)
      if (!hasPermission) {
        missing.push(req)
      }
    }

    return {
      granted: missing.length === 0,
      missing,
    }
  }

  private hasPermission(required: Permission, userPerms: Permission[]): boolean {
    for (const userPerm of userPerms) {
      if (this.permissionsMatch(required, userPerm)) {
        return true
      }
    }
    return false
  }

  private permissionsMatch(required: Permission, userPerm: Permission): boolean {
    // Check type match (or wildcard)
    if (userPerm.type !== required.type && userPerm.type !== 'admin') {
      return false
    }

    // Check resource match (or wildcard)
    if (userPerm.resource !== required.resource && userPerm.resource !== '*') {
      // Check prefix match (e.g., "tool:*" matches "tool:my_tool")
      if (!userPerm.resource.endsWith('*')) {
        return false
      }
      const prefix = userPerm.resource.slice(0, -1)
      if (!required.resource.startsWith(prefix)) {
        return false
      }
    }

    // Check if permission is expired
    if (userPerm.expiresAt && userPerm.expiresAt < Date.now()) {
      return false
    }

    return true
  }

  private formatPermission(perm: Permission): string {
    return `${perm.type}:${perm.resource}`
  }

  private createDeniedResult(
    reason: string,
    auditId: string,
    startTime: number
  ): PermissionCheckResult {
    return {
      allowed: false,
      reason,
      requiredPermissions: [],
      missingPermissions: [],
      grantedPermissions: [],
      decisionTime: Date.now() - startTime,
      auditId,
    }
  }

  private emitDecision(
    result: PermissionCheckResult,
    toolId: string,
    context: ToolRuntimeContext,
    auditId: string,
    correlationId?: string
  ): void {
    if (!this.config.enableAudit) return

    const event: PermissionDecisionEvent = {
      type: 'permission_decision',
      timestamp: Date.now(),
      auditId,
      toolId,
      userId: context.userId,
      tenantId: context.tenantId,
      departmentId: context.departmentId,
      result,
      context: {
        source: 'precheck',
        correlationId: correlationId || auditId,
      },
    }

    for (const listener of this.streamListeners) {
      try {
        listener(event)
      } catch {
        // Ignore listener errors
      }
    }
  }
}

// ==================== Helper Functions ====================

/**
 * Create a permission precheck instance
 */
export function createPermissionPrecheck(
  registry: ToolRegistry,
  config: Partial<PermissionResolverConfig> = {}
): PermissionPrecheck {
  return new PermissionPrecheck(registry, config)
}

/**
 * Quick permission check helper
 */
export function checkToolPermission(
  registry: ToolRegistry,
  toolId: string,
  context: ToolRuntimeContext
): boolean {
  const precheck = new PermissionPrecheck(registry)
  return precheck.canExecute(toolId, context)
}

/**
 * Format permission check result for display
 */
export function formatPermissionResult(result: PermissionCheckResult): string {
  if (result.allowed) {
    return `Permission granted for tool execution`
  }

  const missing = result.missingPermissions
    .map(p => `${p.type}:${p.resource}`)
    .join(', ')

  return `Permission denied: ${result.reason || 'missing: ' + missing}`
}

/**
 * Check if a permission decision event indicates a denial
 */
export function isPermissionDenied(event: PermissionDecisionEvent): boolean {
  return !event.result.allowed
}

/**
 * Extract permission requirements from a tool descriptor
 */
export function extractPermissionRequirements(
  descriptor: ToolDescriptor
): ToolPermissionRequirement[] {
  const requirements: ToolPermissionRequirement[] = []

  // Add explicit requirements
  if (descriptor.permissions) {
    requirements.push(...descriptor.permissions)
  }

  // Add implicit requirements based on capabilities
  if (descriptor.capabilities) {
    if (descriptor.capabilities.hasSideEffects) {
      requirements.push({
        type: 'write',
        resource: 'system:actions',
        description: 'Tool has side effects',
      })
    }

    if (descriptor.capabilities.requiresConfirmation) {
      requirements.push({
        type: 'sensitive',
        resource: `tool:${descriptor.id}`,
        description: 'Tool requires confirmation',
      })
    }
  }

  return requirements
}
