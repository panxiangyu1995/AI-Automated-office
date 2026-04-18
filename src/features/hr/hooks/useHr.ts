/**
 * HR 模块 Hooks - 使用统一 Hooks 封装
 * Phase 11-20: 应用统一Hooks到各业务模块
 */

import { useMemo } from 'react'
import { useTauriCommand } from '@/hooks/useTauriCommand'
import type {
  Employee,
  EmployeeListItem,
  EmployeeDetail,
  HrDepartment,
  DepartmentTreeNode,
  Position,
  PositionListItem,
} from '../types/hr.types'

// ==================== 员工 Hooks ====================

/**
 * 员工列表 Hook
 */
export function useEmployees() {
  return useTauriCommand<EmployeeListItem[]>({
    command: 'hr_list_employees',
  })
}

/**
 * 单个员工 Hook
 */
export function useEmployee(id: string | null) {
  return useTauriCommand<EmployeeDetail | null>({
    command: 'hr_get_employee',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建员工 Hook
 */
export function useCreateEmployee() {
  return useTauriCommand<Employee>({
    command: 'hr_create_employee',
  })
}

/**
 * 更新员工 Hook
 */
export function useUpdateEmployee() {
  return useTauriCommand<Employee>({
    command: 'hr_update_employee',
  })
}

/**
 * 删除员工 Hook
 */
export function useDeleteEmployee() {
  return useTauriCommand<void>({
    command: 'hr_delete_employee',
  })
}

// ==================== 部门 Hooks ====================

/**
 * 部门树 Hook
 */
export function useDepartmentTree() {
  return useTauriCommand<DepartmentTreeNode[]>({
    command: 'hr_get_department_tree',
  })
}

/**
 * 单个部门 Hook
 */
export function useDepartment(id: string | null) {
  return useTauriCommand<HrDepartment | null>({
    command: 'hr_get_department',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建部门 Hook
 */
export function useCreateDepartment() {
  return useTauriCommand<HrDepartment>({
    command: 'hr_create_department',
  })
}

/**
 * 更新部门 Hook
 */
export function useUpdateDepartment() {
  return useTauriCommand<HrDepartment>({
    command: 'hr_update_department',
  })
}

/**
 * 删除部门 Hook
 */
export function useDeleteDepartment() {
  return useTauriCommand<void>({
    command: 'hr_delete_department',
  })
}

// ==================== 岗位 Hooks ====================

/**
 * 岗位列表 Hook
 */
export function usePositions() {
  return useTauriCommand<PositionListItem[]>({
    command: 'hr_list_positions',
  })
}

/**
 * 单个岗位 Hook
 */
export function usePosition(id: string | null) {
  return useTauriCommand<Position | null>({
    command: 'hr_get_position',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建岗位 Hook
 */
export function useCreatePosition() {
  return useTauriCommand<Position>({
    command: 'hr_create_position',
  })
}

/**
 * 更新岗位 Hook
 */
export function useUpdatePosition() {
  return useTauriCommand<Position>({
    command: 'hr_update_position',
  })
}

/**
 * 删除岗位 Hook
 */
export function useDeletePosition() {
  return useTauriCommand<void>({
    command: 'hr_delete_position',
  })
}

// ==================== 辅助 Hooks ====================

/**
 * HR 仪表盘 Hook（组合多个数据源）
 */
export function useHrDashboard() {
  const employees = useEmployees()
  const departments = useDepartmentTree()
  const positions = usePositions()

  return useMemo(
    () => ({
      employees,
      departments,
      positions,
      isLoading: employees.loading || departments.loading || positions.loading,
      error: employees.error || departments.error || positions.error,
    }),
    [employees, departments, positions]
  )
}
