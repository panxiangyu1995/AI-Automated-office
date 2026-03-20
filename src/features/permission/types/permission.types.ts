/**
 * 权限中心类型定义
 *
 * @module permission.types
 * @description 权限管理相关的类型定义
 */

// ==================== 权限层级 ====================

/**
 * 权限层级类型
 * - base: 基础权限（系统级）
 * - department: 部门权限（部门级）
 * - approval: 审批权限（流程级）
 */
export type PermissionLayer = 'base' | 'department' | 'approval'

// ==================== 角色 ====================

/**
 * 角色信息
 */
export interface Role {
  id: string
  name: string
  code: string
  description: string
  layer: PermissionLayer
  is_system: boolean
  user_count: number
  permission_count: number
  created_at: string
  updated_at: string
}

/**
 * 角色列表项
 */
export interface RoleListItem extends Role {
  // 用于前端展示的额外字段
}

/**
 * 创建角色请求
 */
export interface CreateRoleRequest {
  name: string
  code: string
  description?: string
  layer: PermissionLayer
}

/**
 * 更新角色请求
 */
export interface UpdateRoleRequest {
  name?: string
  description?: string
}

// ==================== 权限 ====================

/**
 * 权限操作类型
 */
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

/**
 * 权限信息
 */
export interface Permission {
  id: string
  name: string
  code: string
  module: string
  module_name: string
  action: PermissionAction
  action_name: string
  description: string
  layer: PermissionLayer
}

/**
 * 按模块分组的权限
 */
export interface PermissionGroup {
  module: string
  module_name: string
  permissions: Permission[]
}

/**
 * 权限来源类型
 */
export type PermissionSourceType = 'role' | 'department' | 'user_override'

/**
 * 权限来源信息
 */
export interface PermissionSource {
  permission_id: string
  source_type: PermissionSourceType
  source_id: string
  source_name: string
}

// ==================== 角色权限 ====================

/**
 * 角色权限信息
 */
export interface RolePermission {
  role_id: string
  permission_ids: string[]
  inherited_permission_ids?: string[]
}

/**
 * 更新角色权限请求
 */
export interface UpdateRolePermissionsRequest {
  permission_ids: string[]
}

// ==================== API 响应 ====================

/**
 * 通用 API 响应包装
 */
export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
  code?: string
}

/**
 * 角色列表响应
 */
export interface RoleListResponse {
  items: Role[]
  total: number
}

/**
 * 权限列表响应
 */
export interface PermissionListResponse {
  items: Permission[]
  total: number
  groups: PermissionGroup[]
}

/**
 * 角色权限响应
 */
export interface RolePermissionsResponse {
  role_id: string
  permission_ids: string[]
}

// ==================== 前端状态 ====================

/**
 * 权限变更状态
 */
export interface PermissionChange {
  permissionId: string
  selected: boolean
  original: boolean
}

/**
 * 层级分组显示
 */
export interface LayerGroup {
  layer: PermissionLayer
  name: string
  color: string
  bgColor: string
  roles: Role[]
}

/**
 * 层级配置
 */
export const LAYER_CONFIG: Record<PermissionLayer, { name: string; color: string; bgColor: string }> = {
  base: {
    name: '基础权限',
    color: '#4B5563',
    bgColor: '#F3F4F6',
  },
  department: {
    name: '部门权限',
    color: '#92400E',
    bgColor: '#FEF3C7',
  },
  approval: {
    name: '审批权限',
    color: '#166534',
    bgColor: '#DCFCE7',
  },
}
