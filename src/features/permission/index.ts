/**
 * 权限中心模块导出
 */

// 组件
export { PermissionCenter } from './components/PermissionCenter'
export { RoleList } from './components/RoleList'
export { RoleInfoCard } from './components/RoleInfoCard'
export { PermissionMatrix } from './components/PermissionMatrix'
export { RoleFormDialog } from './components/RoleFormDialog'

// 细粒度权限组件
export { FineGrainedPermissionPage } from './components/FineGrainedPermissionPage'
export { UserSelector } from './components/UserSelector'
export { PermissionOverrideTab } from './components/PermissionOverrideTab'
export { DataScopeTab } from './components/DataScopeTab'
export { FieldPermissionTab } from './components/FieldPermissionTab'

// 类型
export type {
  Role,
  RoleListItem,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  PermissionAction,
  PermissionGroup,
  PermissionLayer,
  PermissionSourceType,
  PermissionSource,
  RolePermission,
  UpdateRolePermissionsRequest,
} from './types/permission.types'

// 细粒度权限类型
export type {
  DataScopeType,
  RuleOperator,
  CustomRuleCondition,
  CustomRuleLogic,
  CustomRule,
  DataScope,
  FieldRestrictionMode,
  MaskRuleType,
  FieldRestriction,
  FieldDefinition,
  OverrideType,
  PermissionOverride,
  RolePermissionSource,
  UserPermissionSummary,
  UserPermissionResult,
  ResourceDefinition,
  DepartmentTreeNode,
} from './types/fine-grained.types'

export { LAYER_CONFIG } from './types/permission.types'

// API
export { permissionApi } from './api/permissionApi'
export { fineGrainedApi } from './api/fineGrainedApi'

// Store
export { usePermissionStore } from './stores/permissionStore'
export { useFineGrainedStore } from './stores/fineGrainedStore'
