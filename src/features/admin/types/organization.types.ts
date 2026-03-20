/**
 * 组织管理相关类型定义
 *
 * @module organization.types
 * @description 定义部门管理、岗位管理等相关的类型
 */

/**
 * 部门状态
 */
export type DepartmentStatus = 'active' | 'inactive'

/**
 * 岗位状态
 */
export type PositionStatus = 'active' | 'inactive'

/**
 * 部门树节点
 */
export interface DepartmentTreeNode {
  id: string
  name: string
  code: string
  parent_id: string | null
  level: number
  sort_order: number
  status: DepartmentStatus
  leader_id: string | null
  leader_name?: string
  children: DepartmentTreeNode[]
}

/**
 * 部门详情
 */
export interface DepartmentDetail {
  id: string
  name: string
  code: string
  parent_id: string | null
  parent_name?: string
  level: number
  sort_order: number
  status: DepartmentStatus
  leader_id: string | null
  leader_name?: string
  path: string
  created_at: string
  updated_at?: string
}

/**
 * 部门列表项（带分页）
 */
export interface DepartmentListItem {
  id: string
  name: string
  code: string
  parent_id: string | null
  parent_name?: string
  level: number
  sort_order: number
  status: DepartmentStatus
  leader_name?: string
  employee_count?: number
}

/**
 * 岗位列表项
 */
export interface PositionListItem {
  id: string
  name: string
  code: string
  department_id: string
  department_name: string
  level: string
  status: PositionStatus
  description?: string
  employee_count?: number
  created_at: string
  updated_at?: string
}

/**
 * 岗位详情
 */
export interface PositionDetail extends PositionListItem {
  responsibilities?: string
  requirements?: string
}

/**
 * 部门树查询响应
 */
export interface DepartmentTreeResponse {
  items: DepartmentTreeNode[]
}

/**
 * 部门列表请求
 */
export interface ListDepartmentsRequest {
  page?: number
  page_size?: number
  name?: string
  code?: string
  status?: DepartmentStatus
  parent_id?: string
}

/**
 * 部门列表响应
 */
export interface ListDepartmentsResponse {
  items: DepartmentListItem[]
  total: number
  page: number
  page_size: number
}

/**
 * 岗位列表请求
 */
export interface ListPositionsRequest {
  page?: number
  page_size?: number
  name?: string
  code?: string
  department_id?: string
  status?: PositionStatus
}

/**
 * 岗位列表响应
 */
export interface ListPositionsResponse {
  items: PositionListItem[]
  total: number
  page: number
  page_size: number
}

/**
 * 创建部门请求
 */
export interface CreateDepartmentRequest {
  name: string
  code: string
  parent_id?: string
  leader_id?: string
  sort_order?: number
  status?: DepartmentStatus
}

/**
 * 更新部门请求
 */
export interface UpdateDepartmentRequest {
  name?: string
  code?: string
  leader_id?: string
  sort_order?: number
  status?: DepartmentStatus
}

/**
 * 创建岗位请求
 */
export interface CreatePositionRequest {
  name: string
  code: string
  department_id: string
  level: string
  description?: string
  responsibilities?: string
  requirements?: string
  status?: PositionStatus
}

/**
 * 更新岗位请求
 */
export interface UpdatePositionRequest {
  name?: string
  code?: string
  department_id?: string
  level?: string
  description?: string
  responsibilities?: string
  requirements?: string
  status?: PositionStatus
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
  code: string
  level: number
}
