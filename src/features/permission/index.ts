/**
 * 权限中心模块导出
 */

// 组件
export { PermissionCenter } from './components/PermissionCenter'
export { RoleList } from './components/RoleList'
export { RoleInfoCard } from './components/RoleInfoCard'
export { PermissionMatrix } from './components/PermissionMatrix'
export { RoleFormDialog } from './components/RoleFormDialog'

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

export { LAYER_CONFIG } from './types/permission.types'

// API
export { permissionApi } from './api/permissionApi'

// Store
export { usePermissionStore } from './stores/permissionStore'
