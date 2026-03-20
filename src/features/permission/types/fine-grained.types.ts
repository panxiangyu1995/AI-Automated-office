/**
 * 细粒度权限类型定义
 *
 * @module fine-grained.types
 * @description 细粒度权限配置相关的类型定义（用户级权限覆盖、数据范围、字段权限）
 */

// ==================== 数据范围类型 ====================

/**
 * 数据范围类型
 */
export type DataScopeType = 'all' | 'department' | 'department_tree' | 'self' | 'custom'

/**
 * 自定义规则条件操作符
 */
export type RuleOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains'

/**
 * 自定义规则条件
 */
export interface CustomRuleCondition {
  field: string
  operator: RuleOperator
  value: string | string[]
}

/**
 * 自定义规则逻辑关系
 */
export type CustomRuleLogic = 'and' | 'or'

/**
 * 自定义规则
 */
export interface CustomRule {
  conditions: CustomRuleCondition[]
  logic: CustomRuleLogic
}

/**
 * 数据范围配置
 */
export interface DataScope {
  type: DataScopeType
  /** 当 type 为 custom 时使用 */
  rule: CustomRule | null
  /** 当 type 为 department 或 department_tree 时使用 */
  department_ids?: string[]
}

// ==================== 字段权限类型 ====================

/**
 * 字段权限模式
 */
export type FieldRestrictionMode = 'visible' | 'hidden' | 'readonly' | 'masked'

/**
 * 脱敏规则类型
 */
export type MaskRuleType = 'phone' | 'email' | 'idcard' | 'bankcard' | 'custom'

/**
 * 字段限制配置
 */
export interface FieldRestriction {
  mode: FieldRestrictionMode
  /** 当 mode 为 masked 时使用 */
  mask_rule?: MaskRuleType
  /** 自定义脱敏规则 */
  custom_mask_pattern?: string
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum'
}

// ==================== 权限覆盖类型 ====================

/**
 * 权限覆盖类型
 */
export type OverrideType = 'grant' | 'deny'

/**
 * 权限覆盖项
 */
export interface PermissionOverride {
  permission_id: string
  type: OverrideType
  reason?: string
}

// ==================== 用户权限结果 ====================

/**
 * 角色权限来源
 */
export interface RolePermissionSource {
  has: boolean
  source: string
  source_id: string
}

/**
 * 用户权限摘要
 */
export interface UserPermissionSummary {
  id: string
  name: string
  employee_code: string
  department: string
  roles: string[]
  role_names: string[]
}

/**
 * 用户权限结果
 */
export interface UserPermissionResult {
  user: UserPermissionSummary
  /** 角色权限来源 */
  role_permissions: Record<string, RolePermissionSource>
  /** 用户覆盖 */
  overrides: Record<string, OverrideType>
  /** 最终权限 */
  final_permissions: Record<string, boolean>
  /** 数据范围配置 */
  data_scopes: Record<string, DataScope>
  /** 字段权限配置 */
  field_restrictions: Record<string, Record<string, FieldRestriction>>
}

// ==================== API 请求/响应类型 ====================

/**
 * 获取用户权限覆盖响应
 */
export interface GetUserOverridesResponse {
  user_id: string
  overrides: PermissionOverride[]
}

/**
 * 更新用户权限覆盖请求
 */
export interface UpdateUserOverridesRequest {
  overrides: PermissionOverride[]
}

/**
 * 更新用户数据范围请求
 */
export interface UpdateUserDataScopesRequest {
  data_scopes: Record<string, DataScope>
}

/**
 * 更新用户字段权限请求
 */
export interface UpdateUserFieldRestrictionsRequest {
  field_restrictions: Record<string, Record<string, FieldRestriction>>
}

/**
 * 资源列表响应
 */
export interface ResourceListResponse {
  resources: ResourceDefinition[]
}

/**
 * 资源定义
 */
export interface ResourceDefinition {
  id: string
  name: string
  code: string
  module: string
  module_name: string
  permissions: PermissionDefinition[]
  fields: FieldDefinition[]
}

/**
 * 权限定义
 */
export interface PermissionDefinition {
  id: string
  name: string
  code: string
  action: string
  action_name: string
}

// ==================== 部门树类型 ====================

/**
 * 部门树节点
 */
export interface DepartmentTreeNode {
  id: string
  name: string
  parent_id: string | null
  children: DepartmentTreeNode[]
}

// ==================== API 响应包装 ====================

/**
 * API 响应信封
 */
export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
  code?: string
}
