/**
 * 用户管理相关类型定义
 *
 * @module user.types
 * @description 定义用户管理、筛选、API 请求/响应等相关类型
 */

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'inactive' | 'locked'

/**
 * 部门引用
 */
export interface DepartmentRef {
  id: string
  name: string
  is_primary: boolean
}

/**
 * 角色引用
 */
export interface RoleRef {
  id: string
  name: string
  code: string
}

/**
 * 用户列表项
 */
export interface UserListItem {
  id: string
  username: string
  real_name: string
  employee_code: string
  email: string
  phone: string
  status: UserStatus
  manager_id?: string
  manager_name?: string
  departments: DepartmentRef[]
  roles: RoleRef[]
  created_at: string
}

/**
 * 用户详情
 */
export interface UserDetail extends UserListItem {
  updated_at?: string
  last_login_at?: string
}

/**
 * 用户筛选条件
 */
export interface UserFilters {
  name?: string
  employee_code?: string
  department_id?: string
  status?: UserStatus | 'all'
}

/**
 * 用户列表请求
 */
export interface ListUsersRequest {
  page?: number
  page_size?: number
  name?: string
  employee_code?: string
  department_id?: string
  status?: string
}

/**
 * 用户列表响应
 */
export interface ListUsersResponse {
  items: UserListItem[]
  total: number
  page: number
  page_size: number
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  username: string
  real_name: string
  employee_code: string
  email?: string
  phone?: string
  department_ids?: string[]
  role_ids?: string[]
  manager_id?: string | null
  send_notification?: boolean
}

/**
 * 创建用户响应
 */
export interface CreateUserResponse {
  id: string
  username: string
  real_name: string
  temp_password: string
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  real_name?: string
  email?: string
  phone?: string
  department_ids?: string[]
  role_ids?: string[]
  manager_id?: string | null
}

/**
 * 更新状态请求
 */
export interface UpdateStatusRequest {
  status: UserStatus
  reason?: string
}

/**
 * API 响应信封
 */
export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
}

/**
 * 部门选项
 */
export interface DepartmentOption {
  id: string
  name: string
}

/**
 * 角色选项
 */
export interface RoleOption {
  id: string
  name: string
  code: string
}

/**
 * 部门简要信息
 */
export interface DeptSummary {
  id: string
  name: string
}

/**
 * 用户简要信息
 */
export interface UserSummary {
  id: string
  real_name: string
  employee_code?: string
  department?: DeptSummary
}

/**
 * 上级链项
 */
export interface ManagerChainItem {
  level: number
  user: UserSummary
}

/**
 * 下属项
 */
export interface SubordinateItem {
  id: string
  real_name: string
  employee_code: string
  department?: DeptSummary
  status: string
}

/**
 * 更新上级请求
 */
export interface UpdateManagerRequest {
  manager_id: string | null
}

/**
 * 上级链响应
 */
export interface ManagerChainResponse {
  chain: ManagerChainItem[]
}

/**
 * 下属列表响应
 */
export interface SubordinatesResponse {
  items: SubordinateItem[]
}

/**
 * 上级搜索响应
 */
export interface ManagerSearchResponse {
  items: UserSummary[]
}
