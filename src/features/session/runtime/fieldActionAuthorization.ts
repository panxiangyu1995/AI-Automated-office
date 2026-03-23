/**
 * Field Action and Datasource Authorization (Story 46.4)
 * Task 75: Extend authorization checks to fields, actions, and data sources.
 *
 * This module provides functionality for:
 * - Mapping field-level access into runtime decisions
 * - Checking action-level authorization before writeback or execution
 * - Restricting unauthorized data source resolution
 * - Exposing authorization outcomes to audit logs
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Authorization decision outcome
 */
export type AuthorizationOutcome =
  | 'allowed'
  | 'denied'
  | 'restricted'
  | 'requires-approval'

/**
 * Authorization scope
 */
export type AuthorizationScope =
  | 'field'
  | 'action'
  | 'datasource'
  | 'resource'

/**
 * Permission level for field/action
 */
export type PermissionLevel =
  | 'none'
  | 'read'
  | 'write'
  | 'delete'
  | 'admin'

/**
 * Action type for authorization
 */
export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'export'
  | 'import'
  | 'approve'
  | 'delegate'

/**
 * Datasource type
 */
export type DatasourceType =
  | 'database'
  | 'api'
  | 'file'
  | 'storage'
  | 'cache'
  | 'external'

/**
 * Field reference for authorization
 */
export interface FieldAuthReference {
  /** Field ID */
  fieldId: string
  /** Entity/table ID */
  entityId: string
  /** Field name */
  fieldName?: string
  /** Field data type */
  dataType?: string
}

/**
 * Action reference for authorization
 */
export interface ActionAuthReference {
  /** Action ID */
  actionId: string
  /** Action type */
  actionType: ActionType
  /** Target entity */
  targetEntity?: string
  /** Target action name */
  actionName?: string
}

/**
 * Datasource reference for authorization
 */
export interface DatasourceAuthReference {
  /** Datasource ID */
  datasourceId: string
  /** Datasource type */
  datasourceType: DatasourceType
  /** Datasource name */
  datasourceName?: string
  /** Connection string or endpoint (masked) */
  endpoint?: string
}

/**
 * Authorization context
 */
export interface AuthorizationContext {
  /** User ID */
  userId: string
  /** Tenant ID */
  tenantId: string
  /** Department ID */
  departmentId?: string
  /** Role IDs */
  roleIds: string[]
  /** Permission grants */
  permissionGrants: Map<string, PermissionLevel>
  /** Context timestamp */
  timestamp: number
}

/**
 * Authorization decision
 */
export interface AuthorizationDecision {
  /** Decision ID */
  decisionId: string
  /** Authorization outcome */
  outcome: AuthorizationOutcome
  /** Authorization scope */
  scope: AuthorizationScope
  /** Target reference */
  target: FieldAuthReference | ActionAuthReference | DatasourceAuthReference
  /** Granted permissions */
  grantedPermissions: PermissionLevel[]
  /** Denied permissions */
  deniedPermissions: PermissionLevel[]
  /** Denial reasons */
  denialReasons: string[]
  /** Context at decision time */
  context: AuthorizationContext
  /** Decision timestamp */
  timestamp: number
  /** Expires at (if applicable) */
  expiresAt?: number
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Field authorization rule
 */
export interface FieldAuthRule {
  /** Rule ID */
  ruleId: string
  /** Target field reference */
  field: FieldAuthReference
  /** Required permission level */
  requiredPermission: PermissionLevel
  /** Allowed roles */
  allowedRoles: string[]
  /** Allowed departments */
  allowedDepartments: string[]
  /** Conditions for access */
  conditions?: FieldAuthCondition[]
  /** Rule priority */
  priority: number
  /** Rule enabled */
  enabled: boolean
}

/**
 * Field authorization condition
 */
export interface FieldAuthCondition {
  /** Condition type */
  type: 'role-based' | 'department-based' | 'time-based' | 'data-based' | 'custom'
  /** Condition expression */
  expression: string
  /** Description */
  description?: string
}

/**
 * Action authorization rule
 */
export interface ActionAuthRule {
  /** Rule ID */
  ruleId: string
  /** Target action reference */
  action: ActionAuthReference
  /** Required permission level */
  requiredPermission: PermissionLevel
  /** Allowed roles */
  allowedRoles: string[]
  /** Approval required */
  requiresApproval: boolean
  /** Approval workflow ID */
  approvalWorkflowId?: string
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** Rule enabled */
  enabled: boolean
}

/**
 * Datasource authorization rule
 */
export interface DatasourceAuthRule {
  /** Rule ID */
  ruleId: string
  /** Target datasource reference */
  datasource: DatasourceAuthReference
  /** Required permission level */
  requiredPermission: PermissionLevel
  /** Allowed roles */
  allowedRoles: string[]
  /** Allowed IP ranges */
  allowedIpRanges?: string[]
  /** Rate limit per minute */
  rateLimit?: number
  /** Rule enabled */
  enabled: boolean
}

/**
 * Authorization audit entry
 */
export interface AuthorizationAuditEntry {
  /** Entry ID */
  entryId: string
  /** Decision ID */
  decisionId: string
  /** Session ID */
  sessionId: string
  /** Trace ID */
  traceId: string
  /** Authorization scope */
  scope: AuthorizationScope
  /** Outcome */
  outcome: AuthorizationOutcome
  /** Target description */
  targetDescription: string
  /** User ID */
  userId: string
  /** Timestamp */
  timestamp: number
  /** Details */
  details?: Record<string, unknown>
}

/**
 * Authorization store
 */
export interface AuthorizationStore {
  /** Field authorization rules */
  fieldRules: Map<string, FieldAuthRule>
  /** Action authorization rules */
  actionRules: Map<string, ActionAuthRule>
  /** Datasource authorization rules */
  datasourceRules: Map<string, DatasourceAuthRule>
  /** Authorization decisions */
  decisions: Map<string, AuthorizationDecision>
  /** Audit entries */
  auditLog: AuthorizationAuditEntry[]
}

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

// ============================================================================
// Field Authorization
// ============================================================================

/**
 * Get applicable field rule for a field
 */
export function getFieldRule(
  store: AuthorizationStore,
  field: FieldAuthReference
): FieldAuthRule | undefined {
  // Look for exact match first
  const exactKey = `${field.entityId}:${field.fieldId}`
  if (store.fieldRules.has(exactKey)) {
    return store.fieldRules.get(exactKey)
  }
  
  // Look for entity-wide rule
  const entityKey = `${field.entityId}:*`
  if (store.fieldRules.has(entityKey)) {
    return store.fieldRules.get(entityKey)
  }
  
  // Look for global rule
  return store.fieldRules.get('*:*')
}

/**
 * Check field access authorization
 */
export function checkFieldAccess(
  store: AuthorizationStore,
  field: FieldAuthReference,
  context: AuthorizationContext,
  requestedPermission: PermissionLevel
): AuthorizationDecision {
  const rule = getFieldRule(store, field)
  
  // No rule found - default deny
  if (!rule || !rule.enabled) {
    return createAuthorizationDecision(
      'denied',
      'field',
      field,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: ['No authorization rule found']
      }
    )
  }
  
  // Check role requirement
  if (!hasRequiredRole(context.roleIds, rule.allowedRoles)) {
    return createAuthorizationDecision(
      'denied',
      'field',
      field,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: ['User does not have required role']
      }
    )
  }
  
  // Check department requirement
  if (rule.allowedDepartments.length > 0) {
    if (!context.departmentId || !rule.allowedDepartments.includes(context.departmentId)) {
      return createAuthorizationDecision(
        'denied',
        'field',
        field,
        context,
        {
          deniedPermissions: [requestedPermission],
          denialReasons: ['User department not authorized']
        }
      )
    }
  }
  
  // Get user's permission for this field
  const fieldKey = `${field.entityId}:${field.fieldId}`
  const userPermission = context.permissionGrants.get(fieldKey) ?? 
    context.permissionGrants.get(`${field.entityId}:*`) ??
    'none'
  
  // Check permission level
  if (!permissionSatisfies(userPermission, rule.requiredPermission)) {
    return createAuthorizationDecision(
      'denied',
      'field',
      field,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: [`Insufficient permission: has ${userPermission}, needs ${rule.requiredPermission}`]
      }
    )
  }
  
  if (!permissionSatisfies(userPermission, requestedPermission)) {
    return createAuthorizationDecision(
      'restricted',
      'field',
      field,
      context,
      {
        grantedPermissions: [userPermission],
        deniedPermissions: [requestedPermission],
        denialReasons: [`Cannot grant ${requestedPermission}: only has ${userPermission}`]
      }
    )
  }
  
  return createAuthorizationDecision(
    'allowed',
    'field',
    field,
    context,
    {
      grantedPermissions: [requestedPermission]
    }
  )
}

// ============================================================================
// Action Authorization
// ============================================================================

/**
 * Get applicable action rule for an action
 */
export function getActionRule(
  store: AuthorizationStore,
  action: ActionAuthReference
): ActionAuthRule | undefined {
  // Look for exact match first
  const exactKey = `${action.actionType}:${action.actionId}`
  if (store.actionRules.has(exactKey)) {
    return store.actionRules.get(exactKey)
  }
  
  // Look for action type rule
  const typeKey = `${action.actionType}:*`
  if (store.actionRules.has(typeKey)) {
    return store.actionRules.get(typeKey)
  }
  
  // Look for global rule
  return store.actionRules.get('*:*')
}

/**
 * Check action authorization
 */
export function checkActionAuthorization(
  store: AuthorizationStore,
  action: ActionAuthReference,
  context: AuthorizationContext,
  requestedPermission: PermissionLevel
): AuthorizationDecision {
  const rule = getActionRule(store, action)
  
  // No rule found - default deny
  if (!rule || !rule.enabled) {
    return createAuthorizationDecision(
      'denied',
      'action',
      action,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: ['No authorization rule found for action']
      }
    )
  }
  
  // Check role requirement
  if (!hasRequiredRole(context.roleIds, rule.allowedRoles)) {
    return createAuthorizationDecision(
      'denied',
      'action',
      action,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: ['User does not have required role for action']
      }
    )
  }
  
  // Get user's permission for this action
  const actionKey = `${action.actionType}:${action.actionId}`
  const userPermission = context.permissionGrants.get(actionKey) ??
    context.permissionGrants.get(`${action.actionType}:*`) ??
    'none'
  
  // Check permission level
  if (!permissionSatisfies(userPermission, rule.requiredPermission)) {
    return createAuthorizationDecision(
      'denied',
      'action',
      action,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: [`Insufficient permission for action: has ${userPermission}, needs ${rule.requiredPermission}`]
      }
    )
  }
  
  if (!permissionSatisfies(userPermission, requestedPermission)) {
    return createAuthorizationDecision(
      'restricted',
      'action',
      action,
      context,
      {
        grantedPermissions: [userPermission],
        deniedPermissions: [requestedPermission],
        denialReasons: [`Cannot grant ${requestedPermission} for action: only has ${userPermission}`]
      }
    )
  }
  
  // Check if approval required
  if (rule.requiresApproval) {
    return createAuthorizationDecision(
      'requires-approval',
      'action',
      action,
      context,
      {
        grantedPermissions: [requestedPermission],
        metadata: {
          approvalWorkflowId: rule.approvalWorkflowId,
          riskLevel: rule.riskLevel
        }
      }
    )
  }
  
  return createAuthorizationDecision(
    'allowed',
    'action',
    action,
    context,
    {
      grantedPermissions: [requestedPermission],
      metadata: {
        riskLevel: rule.riskLevel
      }
    }
  )
}

// ============================================================================
// Datasource Authorization
// ============================================================================

/**
 * Get applicable datasource rule for a datasource
 */
export function getDatasourceRule(
  store: AuthorizationStore,
  datasource: DatasourceAuthReference
): DatasourceAuthRule | undefined {
  // Look for exact match first
  const exactKey = `${datasource.datasourceType}:${datasource.datasourceId}`
  if (store.datasourceRules.has(exactKey)) {
    return store.datasourceRules.get(exactKey)
  }
  
  // Look for datasource type rule
  const typeKey = `${datasource.datasourceType}:*`
  if (store.datasourceRules.has(typeKey)) {
    return store.datasourceRules.get(typeKey)
  }
  
  // Look for global rule
  return store.datasourceRules.get('*:*')
}

/**
 * Check datasource authorization
 */
export function checkDatasourceAuthorization(
  store: AuthorizationStore,
  datasource: DatasourceAuthReference,
  context: AuthorizationContext,
  requestedPermission: PermissionLevel
): AuthorizationDecision {
  const rule = getDatasourceRule(store, datasource)
  
  // No rule found - default deny
  if (!rule || !rule.enabled) {
    return createAuthorizationDecision(
      'denied',
      'datasource',
      datasource,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: ['No authorization rule found for datasource']
      }
    )
  }
  
  // Check role requirement
  if (!hasRequiredRole(context.roleIds, rule.allowedRoles)) {
    return createAuthorizationDecision(
      'denied',
      'datasource',
      datasource,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: ['User does not have required role for datasource']
      }
    )
  }
  
  // Get user's permission for this datasource
  const dsKey = `${datasource.datasourceType}:${datasource.datasourceId}`
  const userPermission = context.permissionGrants.get(dsKey) ??
    context.permissionGrants.get(`${datasource.datasourceType}:*`) ??
    'none'
  
  // Check permission level
  if (!permissionSatisfies(userPermission, rule.requiredPermission)) {
    return createAuthorizationDecision(
      'denied',
      'datasource',
      datasource,
      context,
      {
        deniedPermissions: [requestedPermission],
        denialReasons: [`Insufficient permission for datasource: has ${userPermission}, needs ${rule.requiredPermission}`]
      }
    )
  }
  
  if (!permissionSatisfies(userPermission, requestedPermission)) {
    return createAuthorizationDecision(
      'restricted',
      'datasource',
      datasource,
      context,
      {
        grantedPermissions: [userPermission],
        deniedPermissions: [requestedPermission],
        denialReasons: [`Cannot grant ${requestedPermission} for datasource: only has ${userPermission}`]
      }
    )
  }
  
  return createAuthorizationDecision(
    'allowed',
    'datasource',
    datasource,
    context,
    {
      grantedPermissions: [requestedPermission],
      metadata: {
        rateLimit: rule.rateLimit
      }
    }
  )
}

// ============================================================================
// Store Operations
// ============================================================================

/**
 * Register a field authorization rule
 */
export function registerFieldRule(
  store: AuthorizationStore,
  rule: FieldAuthRule
): AuthorizationStore {
  const newStore = createAuthorizationStore()
  
  // Copy existing rules
  for (const [key, value] of store.fieldRules) {
    newStore.fieldRules.set(key, value)
  }
  for (const [key, value] of store.actionRules) {
    newStore.actionRules.set(key, value)
  }
  for (const [key, value] of store.datasourceRules) {
    newStore.datasourceRules.set(key, value)
  }
  for (const [key, value] of store.decisions) {
    newStore.decisions.set(key, value)
  }
  newStore.auditLog = [...store.auditLog]
  
  // Add new rule
  const key = `${rule.field.entityId}:${rule.field.fieldId}`
  newStore.fieldRules.set(key, rule)
  
  return newStore
}

/**
 * Register an action authorization rule
 */
export function registerActionRule(
  store: AuthorizationStore,
  rule: ActionAuthRule
): AuthorizationStore {
  const newStore = createAuthorizationStore()
  
  // Copy existing rules
  for (const [key, value] of store.fieldRules) {
    newStore.fieldRules.set(key, value)
  }
  for (const [key, value] of store.actionRules) {
    newStore.actionRules.set(key, value)
  }
  for (const [key, value] of store.datasourceRules) {
    newStore.datasourceRules.set(key, value)
  }
  for (const [key, value] of store.decisions) {
    newStore.decisions.set(key, value)
  }
  newStore.auditLog = [...store.auditLog]
  
  // Add new rule
  const key = `${rule.action.actionType}:${rule.action.actionId}`
  newStore.actionRules.set(key, rule)
  
  return newStore
}

/**
 * Register a datasource authorization rule
 */
export function registerDatasourceRule(
  store: AuthorizationStore,
  rule: DatasourceAuthRule
): AuthorizationStore {
  const newStore = createAuthorizationStore()
  
  // Copy existing rules
  for (const [key, value] of store.fieldRules) {
    newStore.fieldRules.set(key, value)
  }
  for (const [key, value] of store.actionRules) {
    newStore.actionRules.set(key, value)
  }
  for (const [key, value] of store.datasourceRules) {
    newStore.datasourceRules.set(key, value)
  }
  for (const [key, value] of store.decisions) {
    newStore.decisions.set(key, value)
  }
  newStore.auditLog = [...store.auditLog]
  
  // Add new rule
  const key = `${rule.datasource.datasourceType}:${rule.datasource.datasourceId}`
  newStore.datasourceRules.set(key, rule)
  
  return newStore
}

/**
 * Record an authorization decision
 */
export function recordDecision(
  store: AuthorizationStore,
  decision: AuthorizationDecision
): AuthorizationStore {
  const newStore = createAuthorizationStore()
  
  // Copy existing data
  for (const [key, value] of store.fieldRules) {
    newStore.fieldRules.set(key, value)
  }
  for (const [key, value] of store.actionRules) {
    newStore.actionRules.set(key, value)
  }
  for (const [key, value] of store.datasourceRules) {
    newStore.datasourceRules.set(key, value)
  }
  for (const [key, value] of store.decisions) {
    newStore.decisions.set(key, value)
  }
  newStore.auditLog = [...store.auditLog]
  
  // Add decision
  newStore.decisions.set(decision.decisionId, decision)
  
  return newStore
}

/**
 * Add audit entry
 */
export function addAuditEntry(
  store: AuthorizationStore,
  entry: AuthorizationAuditEntry
): AuthorizationStore {
  const newStore = createAuthorizationStore()
  
  // Copy existing data
  for (const [key, value] of store.fieldRules) {
    newStore.fieldRules.set(key, value)
  }
  for (const [key, value] of store.actionRules) {
    newStore.actionRules.set(key, value)
  }
  for (const [key, value] of store.datasourceRules) {
    newStore.datasourceRules.set(key, value)
  }
  for (const [key, value] of store.decisions) {
    newStore.decisions.set(key, value)
  }
  newStore.auditLog = [...store.auditLog, entry]
  
  return newStore
}

/**
 * Get decision by ID
 */
export function getDecision(
  store: AuthorizationStore,
  decisionId: string
): AuthorizationDecision | undefined {
  return store.decisions.get(decisionId)
}

/**
 * Get audit entries by user
 */
export function getAuditEntriesByUser(
  store: AuthorizationStore,
  userId: string
): AuthorizationAuditEntry[] {
  return store.auditLog.filter(entry => entry.userId === userId)
}

/**
 * Get audit entries by session
 */
export function getAuditEntriesBySession(
  store: AuthorizationStore,
  sessionId: string
): AuthorizationAuditEntry[] {
  return store.auditLog.filter(entry => entry.sessionId === sessionId)
}

/**
 * Get audit entries by outcome
 */
export function getAuditEntriesByOutcome(
  store: AuthorizationStore,
  outcome: AuthorizationOutcome
): AuthorizationAuditEntry[] {
  return store.auditLog.filter(entry => entry.outcome === outcome)
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serializable authorization context
 */
export interface SerializableAuthorizationContext {
  userId: string
  tenantId: string
  departmentId?: string
  roleIds: string[]
  permissionGrants: [string, PermissionLevel][]
  timestamp: number
}

/**
 * Serializable authorization decision
 */
export interface SerializableAuthorizationDecision {
  decisionId: string
  outcome: AuthorizationOutcome
  scope: AuthorizationScope
  target: FieldAuthReference | ActionAuthReference | DatasourceAuthReference
  grantedPermissions: PermissionLevel[]
  deniedPermissions: PermissionLevel[]
  denialReasons: string[]
  context: SerializableAuthorizationContext
  timestamp: number
  expiresAt?: number
  metadata?: Record<string, unknown>
}

/**
 * Serializable authorization store
 */
export interface SerializableAuthorizationStore {
  fieldRules: Array<{
    ruleId: string
    field: FieldAuthReference
    requiredPermission: PermissionLevel
    allowedRoles: string[]
    allowedDepartments: string[]
    conditions?: FieldAuthCondition[]
    priority: number
    enabled: boolean
  }>
  actionRules: Array<{
    ruleId: string
    action: ActionAuthReference
    requiredPermission: PermissionLevel
    allowedRoles: string[]
    requiresApproval: boolean
    approvalWorkflowId?: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    enabled: boolean
  }>
  datasourceRules: Array<{
    ruleId: string
    datasource: DatasourceAuthReference
    requiredPermission: PermissionLevel
    allowedRoles: string[]
    allowedIpRanges?: string[]
    rateLimit?: number
    enabled: boolean
  }>
  decisions: SerializableAuthorizationDecision[]
  auditLog: AuthorizationAuditEntry[]
}

/**
 * Serialize authorization context
 */
export function serializeAuthContext(context: AuthorizationContext): SerializableAuthorizationContext {
  return {
    userId: context.userId,
    tenantId: context.tenantId,
    departmentId: context.departmentId,
    roleIds: context.roleIds,
    permissionGrants: Array.from(context.permissionGrants.entries()),
    timestamp: context.timestamp
  }
}

/**
 * Deserialize authorization context
 */
export function deserializeAuthContext(data: SerializableAuthorizationContext): AuthorizationContext {
  return {
    userId: data.userId,
    tenantId: data.tenantId,
    departmentId: data.departmentId,
    roleIds: data.roleIds,
    permissionGrants: new Map(data.permissionGrants),
    timestamp: data.timestamp
  }
}

/**
 * Serialize authorization decision
 */
export function serializeAuthDecision(decision: AuthorizationDecision): SerializableAuthorizationDecision {
  return {
    decisionId: decision.decisionId,
    outcome: decision.outcome,
    scope: decision.scope,
    target: decision.target,
    grantedPermissions: decision.grantedPermissions,
    deniedPermissions: decision.deniedPermissions,
    denialReasons: decision.denialReasons,
    context: serializeAuthContext(decision.context),
    timestamp: decision.timestamp,
    expiresAt: decision.expiresAt,
    metadata: decision.metadata
  }
}

/**
 * Deserialize authorization decision
 */
export function deserializeAuthDecision(data: SerializableAuthorizationDecision): AuthorizationDecision {
  return {
    decisionId: data.decisionId,
    outcome: data.outcome,
    scope: data.scope,
    target: data.target,
    grantedPermissions: data.grantedPermissions,
    deniedPermissions: data.deniedPermissions,
    denialReasons: data.denialReasons,
    context: deserializeAuthContext(data.context),
    timestamp: data.timestamp,
    expiresAt: data.expiresAt,
    metadata: data.metadata
  }
}

/**
 * Serialize authorization store
 */
export function serializeAuthStore(store: AuthorizationStore): SerializableAuthorizationStore {
  return {
    fieldRules: Array.from(store.fieldRules.values()),
    actionRules: Array.from(store.actionRules.values()),
    datasourceRules: Array.from(store.datasourceRules.values()),
    decisions: Array.from(store.decisions.values()).map(serializeAuthDecision),
    auditLog: store.auditLog
  }
}

/**
 * Deserialize authorization store
 */
export function deserializeAuthStore(data: SerializableAuthorizationStore): AuthorizationStore {
  const store = createAuthorizationStore()
  
  for (const rule of data.fieldRules) {
    store.fieldRules.set(`${rule.field.entityId}:${rule.field.fieldId}`, rule as FieldAuthRule)
  }
  
  for (const rule of data.actionRules) {
    store.actionRules.set(`${rule.action.actionType}:${rule.action.actionId}`, rule as ActionAuthRule)
  }
  
  for (const rule of data.datasourceRules) {
    store.datasourceRules.set(`${rule.datasource.datasourceType}:${rule.datasource.datasourceId}`, rule as DatasourceAuthRule)
  }
  
  for (const decision of data.decisions) {
    store.decisions.set(decision.decisionId, deserializeAuthDecision(decision))
  }
  
  store.auditLog = data.auditLog
  
  return store
}

// ============================================================================
// Debug Formatting
// ============================================================================

/**
 * Format authorization outcome for debugging
 */
export function formatAuthOutcome(outcome: AuthorizationOutcome): string {
  const icons: Record<AuthorizationOutcome, string> = {
    'allowed': '✓',
    'denied': '✗',
    'restricted': '⚠',
    'requires-approval': '⏳'
  }
  return `${icons[outcome]} ${outcome}`
}

/**
 * Format permission level for debugging
 */
export function formatPermissionLevel(level: PermissionLevel): string {
  const labels: Record<PermissionLevel, string> = {
    'none': '—',
    'read': 'R',
    'write': 'RW',
    'delete': 'RWD',
    'admin': 'RWDA'
  }
  return labels[level]
}

/**
 * Format authorization decision for debugging
 */
export function formatAuthDecision(decision: AuthorizationDecision): string {
  const targetDesc = 'fieldId' in decision.target
    ? `field:${decision.target.fieldId}`
    : 'actionId' in decision.target
    ? `action:${decision.target.actionId}`
    : `datasource:${decision.target.datasourceId}`
  
  return `Decision ${decision.decisionId}:
  Outcome: ${formatAuthOutcome(decision.outcome)}
  Scope: ${decision.scope}
  Target: ${targetDesc}
  Granted: ${decision.grantedPermissions.map(formatPermissionLevel).join(', ') || 'none'}
  Denied: ${decision.deniedPermissions.map(formatPermissionLevel).join(', ') || 'none'}
  Reasons: ${decision.denialReasons.join('; ') || 'none'}
  User: ${decision.context.userId}
  Timestamp: ${new Date(decision.timestamp).toISOString()}`
}

/**
 * Format audit entry for debugging
 */
export function formatAuditEntry(entry: AuthorizationAuditEntry): string {
  return `[${new Date(entry.timestamp).toISOString()}] ${formatAuthOutcome(entry.outcome)} ${entry.scope}: ${entry.targetDescription} (user: ${entry.userId})`
}
