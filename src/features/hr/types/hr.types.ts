/**
 * HR 模块类型定义
 * Task 147 - HR人事部门模块实现
 */

// 员工状态
export type EmployeeStatus = 'active' | 'inactive' | 'probation'

// 员工
export interface Employee {
  id: string
  employeeCode: string
  name: string
  email: string
  phone?: string
  departmentId: string
  positionId: string
  managerId?: string
  hireDate: number
  status: EmployeeStatus
  avatar?: string
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

// 部门
export interface HrDepartment {
  id: string
  code: string
  name: string
  parentId?: string
  managerId?: string
  level: number
  sortOrder: number
  children?: HrDepartment[]
  createdAt: number
  updatedAt: number
}

// 岗位
export interface Position {
  id: string
  code: string
  name: string
  level: number
  departmentId?: string
  permissions: string[]
  createdAt: number
  updatedAt: number
}

// 创建员工请求
export interface CreateEmployeeRequest {
  employeeCode: string
  name: string
  email: string
  phone?: string
  departmentId: string
  positionId: string
  managerId?: string
  hireDate?: number
  status?: EmployeeStatus
}

// 更新员工请求
export interface UpdateEmployeeRequest {
  name?: string
  email?: string
  phone?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  hireDate?: number
  status?: EmployeeStatus
}

// 创建部门请求
export interface CreateDepartmentRequest {
  code: string
  name: string
  parentId?: string
  managerId?: string
  sortOrder?: number
}

// 更新部门请求
export interface UpdateDepartmentRequest {
  name?: string
  parentId?: string
  managerId?: string
  sortOrder?: number
}

// 创建岗位请求
export interface CreatePositionRequest {
  code: string
  name: string
  level?: number
  departmentId?: string
  permissions?: string[]
}

// 更新岗位请求
export interface UpdatePositionRequest {
  name?: string
  level?: number
  departmentId?: string
  permissions?: string[]
}

// 员工列表项
export interface EmployeeListItem {
  id: string
  employeeCode: string
  name: string
  email: string
  departmentName?: string
  positionName?: string
  managerName?: string
  hireDate: number
  status: EmployeeStatus
}

// 员工详情
export interface EmployeeDetail {
  employee: Employee
  department?: HrDepartment
  position?: Position
  manager?: Employee
  subordinates: EmployeeListItem[]
}

// 部门树节点
export interface DepartmentTreeNode {
  department: HrDepartment
  employeeCount: number
  children: DepartmentTreeNode[]
}

// 岗位列表项
export interface PositionListItem {
  id: string
  code: string
  name: string
  level: number
  departmentName?: string
  employeeCount: number
}

// 员工查询参数
export interface EmployeeQueryParams {
  keyword?: string
  departmentId?: string
  positionId?: string
  status?: EmployeeStatus
  page?: number
  pageSize?: number
}

// 分页结果
export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 状态标签映射
export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: '正式',
  inactive: '离职',
  probation: '试用期',
}

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  probation: 'bg-yellow-500',
}
