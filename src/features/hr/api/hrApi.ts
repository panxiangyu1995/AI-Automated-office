/**
 * HR 模块 API 封装
 * Task 147 - HR人事部门模块实现
 */

import { safeInvoke } from '@/lib/tauri'
import type {
  Employee,
  EmployeeListItem,
  EmployeeDetail,
  HrDepartment,
  DepartmentTreeNode,
  Position,
  PositionListItem,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  EmployeeQueryParams,
  PagedResult,
} from '../types/hr.types'

// ==================== 员工 API ====================

/**
 * 创建员工
 */
export async function createEmployee(
  request: CreateEmployeeRequest
): Promise<Employee> {
  const result = await safeInvoke<Employee>('hr_create_employee', { request })
  return result ?? ({} as Employee)
}

/**
 * 获取员工列表
 */
export async function listEmployees(
  params?: EmployeeQueryParams
): Promise<PagedResult<EmployeeListItem>> {
  const result = await safeInvoke<PagedResult<EmployeeListItem>>('hr_list_employees', { params })
  return result ?? ({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } as PagedResult<EmployeeListItem>)
}

/**
 * 获取员工详情
 */
export async function getEmployee(id: string): Promise<EmployeeDetail> {
  const result = await safeInvoke<EmployeeDetail>('hr_get_employee', { id })
  return result ?? ({} as EmployeeDetail)
}

/**
 * 更新员工
 */
export async function updateEmployee(
  id: string,
  request: UpdateEmployeeRequest
): Promise<Employee> {
  const result = await safeInvoke<Employee>('hr_update_employee', { id, request })
  return result ?? ({} as Employee)
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: string): Promise<void> {
  await safeInvoke('hr_delete_employee', { id })
}

// ==================== 部门 API ====================

/**
 * 创建部门
 */
export async function createDepartment(
  request: CreateDepartmentRequest
): Promise<HrDepartment> {
  const result = await safeInvoke<HrDepartment>('hr_create_department', { request })
  return result ?? ({} as HrDepartment)
}

/**
 * 获取部门树
 */
export async function getDepartmentTree(): Promise<DepartmentTreeNode[]> {
  const result = await safeInvoke<DepartmentTreeNode[]>('hr_get_department_tree')
  return result ?? []
}

/**
 * 获取部门详情
 */
export async function getDepartment(id: string): Promise<HrDepartment> {
  const result = await safeInvoke<HrDepartment>('hr_get_department', { id })
  return result ?? ({} as HrDepartment)
}

/**
 * 更新部门
 */
export async function updateDepartment(
  id: string,
  request: UpdateDepartmentRequest
): Promise<HrDepartment> {
  const result = await safeInvoke<HrDepartment>('hr_update_department', { id, request })
  return result ?? ({} as HrDepartment)
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: string): Promise<void> {
  await safeInvoke('hr_delete_department', { id })
}

// ==================== 岗位 API ====================

/**
 * 创建岗位
 */
export async function createPosition(
  request: CreatePositionRequest
): Promise<Position> {
  const result = await safeInvoke<Position>('hr_create_position', { request })
  return result ?? ({} as Position)
}

/**
 * 获取岗位列表
 */
export async function listPositions(): Promise<PositionListItem[]> {
  const result = await safeInvoke<PositionListItem[]>('hr_list_positions')
  return result ?? []
}

/**
 * 获取岗位详情
 */
export async function getPosition(id: string): Promise<Position> {
  const result = await safeInvoke<Position>('hr_get_position', { id })
  return result ?? ({} as Position)
}

/**
 * 更新岗位
 */
export async function updatePosition(
  id: string,
  request: UpdatePositionRequest
): Promise<Position> {
  const result = await safeInvoke<Position>('hr_update_position', { id, request })
  return result ?? ({} as Position)
}

/**
 * 删除岗位
 */
export async function deletePosition(id: string): Promise<void> {
  await safeInvoke('hr_delete_position', { id })
}

// ==================== API 汇总导出 ====================

export const hrApi = {
  // 员工
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  // 部门
  createDepartment,
  getDepartmentTree,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  // 岗位
  createPosition,
  listPositions,
  getPosition,
  updatePosition,
  deletePosition,
}
