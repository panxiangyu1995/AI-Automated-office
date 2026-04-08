/**
 * HR 模块 Zustand Store
 * Task 147 - HR人事部门模块实现
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  EmployeeListItem,
  EmployeeDetail,
  HrDepartment,
  DepartmentTreeNode,
  PositionListItem,
  EmployeeQueryParams,
} from '../types/hr.types'
import { hrApi } from '../api/hrApi'

interface HrState {
  // 员工数据
  employees: EmployeeListItem[]
  selectedEmployee: EmployeeDetail | null
  employeeTotal: number
  employeePage: number
  employeePageSize: number

  // 部门数据
  departmentTree: DepartmentTreeNode[]
  selectedDepartment: HrDepartment | null

  // 岗位数据
  positions: PositionListItem[]
  selectedPosition: PositionListItem | null

  // 加载状态
  isLoadingEmployees: boolean
  isLoadingEmployeeDetail: boolean
  isLoadingDepartments: boolean
  isLoadingPositions: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean

  // 错误状态
  error: string | null

  // 员工操作
  fetchEmployees: (params?: EmployeeQueryParams) => Promise<void>
  fetchEmployeeDetail: (id: string) => Promise<void>
  createEmployee: (request: Parameters<typeof hrApi.createEmployee>[0]) => Promise<void>
  updateEmployee: (id: string, request: Parameters<typeof hrApi.updateEmployee>[1]) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>

  // 部门操作
  fetchDepartmentTree: () => Promise<void>
  fetchDepartment: (id: string) => Promise<void>
  createDepartment: (request: Parameters<typeof hrApi.createDepartment>[0]) => Promise<void>
  updateDepartment: (id: string, request: Parameters<typeof hrApi.updateDepartment>[1]) => Promise<void>
  deleteDepartment: (id: string) => Promise<void>

  // 岗位操作
  fetchPositions: () => Promise<void>
  createPosition: (request: Parameters<typeof hrApi.createPosition>[0]) => Promise<void>
  updatePosition: (id: string, request: Parameters<typeof hrApi.updatePosition>[1]) => Promise<void>
  deletePosition: (id: string) => Promise<void>

  // 状态操作
  setSelectedEmployee: (employee: EmployeeDetail | null) => void
  setSelectedDepartment: (department: HrDepartment | null) => void
  clearError: () => void
}

export const useHrStore = create<HrState>()(
  persist(
    (set, get) => ({
      // 初始状态
      employees: [],
      selectedEmployee: null,
      employeeTotal: 0,
      employeePage: 1,
      employeePageSize: 20,

      departmentTree: [],
      selectedDepartment: null,

      positions: [],
      selectedPosition: null,

      isLoadingEmployees: false,
      isLoadingEmployeeDetail: false,
      isLoadingDepartments: false,
      isLoadingPositions: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,

      error: null,

      // 员工操作
      fetchEmployees: async (params?: EmployeeQueryParams) => {
        set({ isLoadingEmployees: true, error: null })
        try {
          const result = await hrApi.listEmployees(params)
          set({
            employees: result.items,
            employeeTotal: result.total,
            employeePage: result.page,
            employeePageSize: result.pageSize,
            isLoadingEmployees: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取员工列表失败',
            isLoadingEmployees: false,
          })
        }
      },

      fetchEmployeeDetail: async (id: string) => {
        set({ isLoadingEmployeeDetail: true, error: null })
        try {
          const detail = await hrApi.getEmployee(id)
          set({ selectedEmployee: detail, isLoadingEmployeeDetail: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取员工详情失败',
            isLoadingEmployeeDetail: false,
          })
        }
      },

      createEmployee: async (request) => {
        set({ isCreating: true, error: null })
        try {
          await hrApi.createEmployee(request)
          await get().fetchEmployees()
          set({ isCreating: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建员工失败',
            isCreating: false,
          })
        }
      },

      updateEmployee: async (id, request) => {
        set({ isUpdating: true, error: null })
        try {
          await hrApi.updateEmployee(id, request)
          await get().fetchEmployees()
          await get().fetchEmployeeDetail(id)
          set({ isUpdating: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新员工失败',
            isUpdating: false,
          })
        }
      },

      deleteEmployee: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          await hrApi.deleteEmployee(id)
          await get().fetchEmployees()
          set({ selectedEmployee: null, isDeleting: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除员工失败',
            isDeleting: false,
          })
        }
      },

      // 部门操作
      fetchDepartmentTree: async () => {
        set({ isLoadingDepartments: true, error: null })
        try {
          const tree = await hrApi.getDepartmentTree()
          set({ departmentTree: tree, isLoadingDepartments: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取部门树失败',
            isLoadingDepartments: false,
          })
        }
      },

      fetchDepartment: async (id: string) => {
        try {
          const dept = await hrApi.getDepartment(id)
          set({ selectedDepartment: dept })
        } catch (error) {
          console.error('获取部门详情失败:', error)
        }
      },

      createDepartment: async (request) => {
        set({ isCreating: true, error: null })
        try {
          await hrApi.createDepartment(request)
          await get().fetchDepartmentTree()
          set({ isCreating: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建部门失败',
            isCreating: false,
          })
        }
      },

      updateDepartment: async (id, request) => {
        set({ isUpdating: true, error: null })
        try {
          await hrApi.updateDepartment(id, request)
          await get().fetchDepartmentTree()
          set({ isUpdating: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新部门失败',
            isUpdating: false,
          })
        }
      },

      deleteDepartment: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          await hrApi.deleteDepartment(id)
          await get().fetchDepartmentTree()
          set({ selectedDepartment: null, isDeleting: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除部门失败',
            isDeleting: false,
          })
        }
      },

      // 岗位操作
      fetchPositions: async () => {
        set({ isLoadingPositions: true, error: null })
        try {
          const positions = await hrApi.listPositions()
          set({ positions, isLoadingPositions: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取岗位列表失败',
            isLoadingPositions: false,
          })
        }
      },

      createPosition: async (request) => {
        set({ isCreating: true, error: null })
        try {
          await hrApi.createPosition(request)
          await get().fetchPositions()
          set({ isCreating: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建岗位失败',
            isCreating: false,
          })
        }
      },

      updatePosition: async (id, request) => {
        set({ isUpdating: true, error: null })
        try {
          await hrApi.updatePosition(id, request)
          await get().fetchPositions()
          set({ isUpdating: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新岗位失败',
            isUpdating: false,
          })
        }
      },

      deletePosition: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          await hrApi.deletePosition(id)
          await get().fetchPositions()
          set({ isDeleting: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除岗位失败',
            isDeleting: false,
          })
        }
      },

      // 状态操作
      setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
      setSelectedDepartment: (department) => set({ selectedDepartment: department }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'hr-storage',
      partialize: (state) => ({
        employeePage: state.employeePage,
        employeePageSize: state.employeePageSize,
      }),
    }
  )
)

// 便捷的 selector hooks
export const useEmployees = () => useHrStore((s) => s.employees)
export const useEmployeeDetail = () => useHrStore((s) => s.selectedEmployee)
export const useDepartmentTree = () => useHrStore((s) => s.departmentTree)
export const usePositions = () => useHrStore((s) => s.positions)
export const useHrLoading = () => useHrStore((s) => s.isLoadingEmployees)
export const useHrError = () => useHrStore((s) => s.error)
