/**
 * Field Action and Datasource Authorization - Constants, ID Generation & Factories
 * Story 46.4
 */

import type {
  AuthorizationOutcome,
  AuthorizationScope,
  PermissionLevel,
  ActionType,
  DatasourceType,
  FieldAuthReference,
  ActionAuthReference,
  DatasourceAuthReference,
  AuthorizationContext,
  AuthorizationDecision,
  FieldAuthRule,
  FieldAuthCondition,
  ActionAuthRule,
  DatasourceAuthRule,
  AuthorizationAuditEntry,
  AuthorizationStore,
} from './fieldAuthTypes'

// ============================================================================
// Constants
// ============================================================================

export const DECISION_ID_PREFIX = 'auth_dec'
export const RULE_ID_PREFIX = 'auth_rule'
export const AUDIT_ENTRY_ID_PREFIX = 'auth_audit'

export const AUTHORIZATION_OUTCOMES: AuthorizationOutcome[] = [
  'allowed',
  'denied',
  'restricted',
  'requires-approval'
]

export const AUTHORIZATION_SCOPES: AuthorizationScope[] = [
  'field',
  'action',
  'datasource',
  'resource'
]

export const PERMISSION_LEVELS: PermissionLevel[] = [
  'none',
  'read',
  'write',
  'delete',
  'admin'
]

export const ACTION_TYPES: ActionType[] = [
  'create',
  'read',
  'update',
  'delete',
  'execute',
  'export',
  'import',
  'approve',
  'delegate'
]

export const DATASOURCE_TYPES: DatasourceType[] = [
  'database',
  'api',
  'file',
  'storage',
  'cache',
  'external'
]

// Permission hierarchy for comparison
export const PERMISSION_HIERARCHY: Map<PermissionLevel, number> = new Map([
  ['none', 0],
  ['read', 1],
  ['write', 2],
  ['delete', 3],
  ['admin', 4]
])

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique decision ID
 */
export function generateDecisionId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${DECISION_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique rule ID
 */
export function generateRuleId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${RULE_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Generate a unique audit entry ID
 */
export function generateAuditEntryId(): string {
  const timestamp = Date.now()
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${AUDIT_ENTRY_ID_PREFIX}_${timestamp}_${random}`
}

/**
 * Check if a string is a valid decision ID
 */
export function isValidDecisionId(id: string): boolean {
  return id.startsWith(`${DECISION_ID_PREFIX}_`)
}

/**
 * Check if a string is a valid rule ID
 */
export function isValidRuleId(id: string): boolean {
  return id.startsWith(`${RULE_ID_PREFIX}_`)
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a field authorization reference
 */
export function createFieldAuthReference(
  fieldId: string,
  entityId: string,
  options?: { fieldName?: string; dataType?: string }
): FieldAuthReference {
  return {
    fieldId,
    entityId,
    fieldName: options?.fieldName,
    dataType: options?.dataType
  }
}

/**
 * Create an action authorization reference
 */
export function createActionAuthReference(
  actionId: string,
  actionType: ActionType,
  options?: { targetEntity?: string; actionName?: string }
): ActionAuthReference {
  return {
    actionId,
    actionType,
    targetEntity: options?.targetEntity,
    actionName: options?.actionName
  }
}

/**
 * Create a datasource authorization reference
 */
export function createDatasourceAuthReference(
  datasourceId: string,
  datasourceType: DatasourceType,
  options?: { datasourceName?: string; endpoint?: string }
): DatasourceAuthReference {
  return {
    datasourceId,
    datasourceType,
    datasourceName: options?.datasourceName,
    endpoint: options?.endpoint
  }
}

/**
 * Create an authorization context
 */
export function createAuthorizationContext(
  userId: string,
  tenantId: string,
  roleIds: string[],
  permissionGrants?: Map<string, PermissionLevel>,
  departmentId?: string
): AuthorizationContext {
  return {
    userId,
    tenantId,
    departmentId,
    roleIds,
    permissionGrants: permissionGrants ?? new Map(),
    timestamp: Date.now()
  }
}

/**
 * Create an authorization decision
 */
export function createAuthorizationDecision(
  outcome: AuthorizationOutcome,
  scope: AuthorizationScope,
  target: FieldAuthReference | ActionAuthReference | DatasourceAuthReference,
  context: AuthorizationContext,
  options?: {
    grantedPermissions?: PermissionLevel[]
    deniedPermissions?: PermissionLevel[]
    denialReasons?: string[]
    expiresAt?: number
    metadata?: Record<string, unknown>
  }
): AuthorizationDecision {
  return {
    decisionId: generateDecisionId(),
    outcome,
    scope,
    target,
    grantedPermissions: options?.grantedPermissions ?? [],
    deniedPermissions: options?.deniedPermissions ?? [],
    denialReasons: options?.denialReasons ?? [],
    context,
    timestamp: Date.now(),
    expiresAt: options?.expiresAt,
    metadata: options?.metadata
  }
}

/**
 * Create a field authorization rule
 */
export function createFieldAuthRule(
  field: FieldAuthReference,
  requiredPermission: PermissionLevel,
  options?: {
    allowedRoles?: string[]
    allowedDepartments?: string[]
    conditions?: FieldAuthCondition[]
    priority?: number
    enabled?: boolean
  }
): FieldAuthRule {
  return {
    ruleId: generateRuleId(),
    field,
    requiredPermission,
    allowedRoles: options?.allowedRoles ?? [],
    allowedDepartments: options?.allowedDepartments ?? [],
    conditions: options?.conditions,
    priority: options?.priority ?? 0,
    enabled: options?.enabled ?? true
  }
}

/**
 * Create an action authorization rule
 */
export function createActionAuthRule(
  action: ActionAuthReference,
  requiredPermission: PermissionLevel,
  options?: {
    allowedRoles?: string[]
    requiresApproval?: boolean
    approvalWorkflowId?: string
    riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    enabled?: boolean
  }
): ActionAuthRule {
  return {
    ruleId: generateRuleId(),
    action,
    requiredPermission,
    allowedRoles: options?.allowedRoles ?? [],
    requiresApproval: options?.requiresApproval ?? false,
    approvalWorkflowId: options?.approvalWorkflowId,
    riskLevel: options?.riskLevel ?? 'medium',
    enabled: options?.enabled ?? true
  }
}

/**
 * Create a datasource authorization rule
 */
export function createDatasourceAuthRule(
  datasource: DatasourceAuthReference,
  requiredPermission: PermissionLevel,
  options?: {
    allowedRoles?: string[]
    allowedIpRanges?: string[]
    rateLimit?: number
    enabled?: boolean
  }
): DatasourceAuthRule {
  return {
    ruleId: generateRuleId(),
    datasource,
    requiredPermission,
    allowedRoles: options?.allowedRoles ?? [],
    allowedIpRanges: options?.allowedIpRanges,
    rateLimit: options?.rateLimit,
    enabled: options?.enabled ?? true
  }
}

/**
 * Create an authorization audit entry
 */
export function createAuthorizationAuditEntry(
  decision: AuthorizationDecision,
  sessionId: string,
  traceId: string,
  details?: Record<string, unknown>
): AuthorizationAuditEntry {
  let targetDescription: string

  if ('fieldId' in decision.target) {
    targetDescription = `Field: ${decision.target.fieldId}`
  } else if ('actionId' in decision.target) {
    targetDescription = `Action: ${decision.target.actionId} (${decision.target.actionType})`
  } else {
    targetDescription = `Datasource: ${decision.target.datasourceId}`
  }

  return {
    entryId: generateAuditEntryId(),
    decisionId: decision.decisionId,
    sessionId,
    traceId,
    scope: decision.scope,
    outcome: decision.outcome,
    targetDescription,
    userId: decision.context.userId,
    timestamp: decision.timestamp,
    details
  }
}

/**
 * Create an authorization store
 */
export function createAuthorizationStore(): AuthorizationStore {
  return {
    fieldRules: new Map(),
    actionRules: new Map(),
    datasourceRules: new Map(),
    decisions: new Map(),
    auditLog: []
  }
}

// ============================================================================
// Permission Utilities
// ============================================================================

/**
 * Compare permission levels
 * Returns: positive if a > b, negative if a < b, 0 if equal
 */
export function comparePermissions(a: PermissionLevel, b: PermissionLevel): number {
  const aLevel = PERMISSION_HIERARCHY.get(a) ?? 0
  const bLevel = PERMISSION_HIERARCHY.get(b) ?? 0
  return aLevel - bLevel
}

/**
 * Check if a permission level satisfies a requirement
 */
export function permissionSatisfies(have: PermissionLevel, need: PermissionLevel): boolean {
  return comparePermissions(have, need) >= 0
}

/**
 * Get highest permission from a list
 */
export function getHighestPermission(permissions: PermissionLevel[]): PermissionLevel {
  if (permissions.length === 0) return 'none'

  let highest: PermissionLevel = 'none'
  for (const perm of permissions) {
    if (comparePermissions(perm, highest) > 0) {
      highest = perm
    }
  }
  return highest
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true
  return requiredRoles.some(role => userRoles.includes(role))
}
