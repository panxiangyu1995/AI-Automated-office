/**
 * Field Action and Datasource Authorization - Store, Serialization & Debug
 * Story 46.4
 *
 * Store CRUD operations, serialization/deserialization, and debug formatting.
 */

import type {
  PermissionLevel,
  AuthorizationOutcome,
  AuthorizationScope,
  FieldAuthReference,
  ActionAuthReference,
  DatasourceAuthReference,
  FieldAuthRule,
  FieldAuthCondition,
  ActionAuthRule,
  DatasourceAuthRule,
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationAuditEntry,
  AuthorizationStore,
} from './fieldAuthTypes'
import { createAuthorizationStore } from './fieldAuthFactories'

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
    'allowed': '[OK]',
    'denied': '[DENIED]',
    'restricted': '[RESTRICTED]',
    'requires-approval': '[PENDING]'
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
