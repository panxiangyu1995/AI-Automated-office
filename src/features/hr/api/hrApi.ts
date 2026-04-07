/**
 * HR 模块 API 封装
 * Task 147 - HR人事部门模块实现
 */

import { invoke } from '@tauri-apps/api/core'
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
  return invoke('hr_create_employee', { request })
}

/**
 * 获取员工列表
 */
export async function listEmployees(
  params?: EmployeeQueryParams
): Promise<PagedResult<EmployeeListItem>> {
  return invoke('hr_list_employees', { params })
}

/**
 * 获取员工详情
 */
export async function getEmployee(id: string): Promise<EmployeeDetail> {
  return invoke('hr_get_employee', { id })
}

/**
 * 更新员工
 */
export async function updateEmployee(
  id: string,
  request: UpdateEmployeeRequest
): Promise<Employee> {
  return invoke('hr_update_employee', { id, request })
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: string): Promise<void> {
  return invoke('hr_delete_employee', { id })
}

// ==================== 部门 API ====================

/**
 * 创建部门
 */
export async function createDepartment(
  request: CreateDepartmentRequest
): Promise<HrDepartment> {
  return invoke('hr_create_department', { request })
}

/**
 * 获取部门树
 */
export async function getDepartmentTree(): Promise<DepartmentTreeNode[]> {
  return invoke('hr_get_department_tree')
}

/**
 * 获取部门详情
 */
export async function getDepartment(id: string): Promise<HrDepartment> {
  return invoke('hr_get_department', { id })
}

/**
 * 更新部门
 */
export async function updateDepartment(
  id: string,
  request: UpdateDepartmentRequest
): Promise<HrDepartment> {
  return invoke('hr_update_department', { id, request })
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: string): Promise<void> {
  return invoke('hr_delete_department', { id })
}

// ==================== 岗位 API ====================

/**
 * 创建岗位
 */
export async function createPosition(
  request: CreatePositionRequest
): Promise<Position> {
  return invoke('hr_create_position', { request })
}

/**
 * 获取岗位列表
 */
export async function listPositions(): Promise<PositionListItem[]> {
  return invoke('hr_list_positions')
}

/**
 * 获取岗位详情
 */
export async function getPosition(id: string): Promise<Position> {
  return invoke('hr_get_position', { id })
}

/**
 * 更新岗位
 */
export async function updatePosition(
  id: string,
  request: UpdatePositionRequest
): Promise<Position> {
  return invoke('hr_update_position', { id, request })
}

/**
 * 删除岗位
 */
export async function deletePosition(id: string): Promise<void> {
  return invoke('hr_delete_position', { id })
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
