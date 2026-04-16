/**
 * Field Action and Datasource Authorization (Story 46.4)
 * Task 75: Extend authorization checks to fields, actions, and data sources.
 *
 * This module provides functionality for:
 * - Mapping field-level access into runtime decisions
 * - Checking action-level authorization before writeback or execution
 * - Restricting unauthorized data source resolution
 * - Exposing authorization outcomes to audit logs
 *
 * Barrel re-export from sub-modules:
 *  - fieldAuthTypes.ts     (type definitions)
 *  - fieldAuthFactories.ts (constants + ID generation + factories + permission utils)
 *  - fieldAuthChecks.ts    (field/action/datasource authorization checks)
 *  - fieldAuthStore.ts     (store + serialization + debug)
 */

export type {
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

export {
  DECISION_ID_PREFIX,
  RULE_ID_PREFIX,
  AUDIT_ENTRY_ID_PREFIX,
  AUTHORIZATION_OUTCOMES,
  AUTHORIZATION_SCOPES,
  PERMISSION_LEVELS,
  ACTION_TYPES,
  DATASOURCE_TYPES,
  PERMISSION_HIERARCHY,
  generateDecisionId,
  generateRuleId,
  generateAuditEntryId,
  isValidDecisionId,
  isValidRuleId,
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
  comparePermissions,
  permissionSatisfies,
  getHighestPermission,
  hasRequiredRole,
} from './fieldAuthFactories'

export {
  getFieldRule,
  checkFieldAccess,
  getActionRule,
  checkActionAuthorization,
  getDatasourceRule,
  checkDatasourceAuthorization,
} from './fieldAuthChecks'

export {
  registerFieldRule,
  registerActionRule,
  registerDatasourceRule,
  recordDecision,
  addAuditEntry,
  getDecision,
  getAuditEntriesByUser,
  getAuditEntriesBySession,
  getAuditEntriesByOutcome,
  serializeAuthContext,
  deserializeAuthContext,
  serializeAuthDecision,
  deserializeAuthDecision,
  serializeAuthStore,
  deserializeAuthStore,
  formatAuthOutcome,
  formatPermissionLevel,
  formatAuthDecision,
  formatAuditEntry,
} from './fieldAuthStore'

export type {
  SerializableAuthorizationContext,
  SerializableAuthorizationDecision,
  SerializableAuthorizationStore,
} from './fieldAuthStore'
