/**
 * HR 模块 - 统一导出
 * Task 147 - HR人事部门模块实现
 */

// 类型导出
export * from './types/hr.types'

// API 导出
export { hrApi } from './api/hrApi'
export * from './api/hrApi'

// Store 导出
export { useHrStore } from './stores/hrStore'
export { useEmployees, useEmployeeDetail, useDepartmentTree, usePositions, useHrLoading, useHrError } from './stores/hrStore'

// 组件导出
export { EmployeeList } from './components/EmployeeList'
export { DepartmentTree } from './components/DepartmentTree'
