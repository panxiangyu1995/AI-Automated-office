/**
 * Field Action and Datasource Authorization - Authorization Checks
 * Story 46.4
 *
 * Field, action, and datasource authorization checking logic.
 */

import type {
  PermissionLevel,
  FieldAuthReference,
  ActionAuthReference,
  DatasourceAuthReference,
  AuthorizationContext,
  AuthorizationDecision,
  FieldAuthRule,
  ActionAuthRule,
  DatasourceAuthRule,
  AuthorizationStore,
} from './fieldAuthTypes'
import {
  createAuthorizationDecision,
  permissionSatisfies,
  hasRequiredRole,
} from './fieldAuthFactories'

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
