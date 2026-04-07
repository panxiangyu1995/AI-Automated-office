/**
 * 部门模块 - 统一导出
 * Task 146 - 部门模块基础框架
 */

// 类型导出
export * from './types/department'

// API 导出
export { departmentApi } from './api/departmentApi'
export * from './api/departmentApi'

// Store 导出
export { useDepartmentStore } from './stores/departmentStore'
export { useDepartments, useSelectedDepartment, useLoadedDepartments, useDepartmentStats, useDepartmentLoading, useDepartmentError } from './stores/departmentStore'

// 组件导出
export { DepartmentList } from './components/DepartmentList'
export { DepartmentDetail } from './components/DepartmentDetail'
export { DepartmentPanel } from './components/DepartmentPanel'
