/**
 * Field Action and Datasource Authorization - Types
 * Story 46.4
 *
 * Type definitions for field/action/datasource authorization.
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
