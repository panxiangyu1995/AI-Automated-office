/**
 * 部门模块 Zustand Store
 * Task 146 - 部门模块基础框架
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DepartmentListItem,
  DepartmentPackage,
  DepartmentDetailResponse,
  DepartmentStats,
  DepartmentMessage,
} from '../types/department'
import { departmentApi } from '../api/departmentApi'

interface DepartmentState {
  // 数据
  departments: DepartmentListItem[]
  selectedDepartment: DepartmentDetailResponse | null
  loadedDepartments: DepartmentPackage[]
  messages: DepartmentMessage[]
  stats: DepartmentStats | null

  // 加载状态
  isLoading: boolean
  isLoadingDetail: boolean
  isLoadingMessages: boolean
  isEnabling: boolean
  isDisabling: boolean

  // 错误状态
  error: string | null

  // 操作方法
  fetchDepartments: () => Promise<void>
  fetchDepartmentDetail: (id: string) => Promise<void>
  fetchLoadedDepartments: () => Promise<void>
  fetchMessages: (limit?: number) => Promise<void>
  fetchStats: () => Promise<void>

  enableDepartment: (id: string) => Promise<void>
  disableDepartment: (id: string) => Promise<void>
  loadDepartment: (id: string) => Promise<void>
  unloadDepartment: (id: string) => Promise<void>

  sendMessage: (
    from: string,
    to: string,
    messageType: string,
    payload: unknown
  ) => Promise<void>

  setSelectedDepartment: (department: DepartmentDetailResponse | null) => void
  clearError: () => void
}

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      // 初始状态
      departments: [],
      selectedDepartment: null,
      loadedDepartments: [],
      messages: [],
      stats: null,

      isLoading: false,
      isLoadingDetail: false,
      isLoadingMessages: false,
      isEnabling: false,
      isDisabling: false,

      error: null,

      // 获取部门列表
      fetchDepartments: async () => {
        set({ isLoading: true, error: null })
        try {
          const departments = await departmentApi.list()
          set({ departments, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取部门列表失败',
            isLoading: false,
          })
        }
      },

      // 获取部门详情
      fetchDepartmentDetail: async (id: string) => {
        set({ isLoadingDetail: true, error: null })
        try {
          const detail = await departmentApi.get(id)
          set({ selectedDepartment: detail, isLoadingDetail: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取部门详情失败',
            isLoadingDetail: false,
          })
        }
      },

      // 获取已加载部门
      fetchLoadedDepartments: async () => {
        try {
          const loaded = await departmentApi.listLoaded()
          set({ loadedDepartments: loaded })
        } catch (error) {
          console.error('获取已加载部门失败:', error)
        }
      },

      // 获取消息历史
      fetchMessages: async (limit?: number) => {
        set({ isLoadingMessages: true })
        try {
          const messages = await departmentApi.getMessageHistory(limit)
          set({ messages, isLoadingMessages: false })
        } catch (error) {
          set({ isLoadingMessages: false })
          console.error('获取消息历史失败:', error)
        }
      },

      // 获取统计信息
      fetchStats: async () => {
        try {
          const stats = await departmentApi.getStats()
          set({ stats })
        } catch (error) {
          console.error('获取部门统计失败:', error)
        }
      },

      // 启用部门
      enableDepartment: async (id: string) => {
        set({ isEnabling: true, error: null })
        try {
          await departmentApi.enable(id)
          // 刷新列表
          await get().fetchDepartments()
          await get().fetchLoadedDepartments()
          await get().fetchStats()
          set({ isEnabling: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '启用部门失败',
            isEnabling: false,
          })
        }
      },

      // 禁用部门
      disableDepartment: async (id: string) => {
        set({ isDisabling: true, error: null })
        try {
          await departmentApi.disable(id)
          // 刷新列表
          await get().fetchDepartments()
          await get().fetchLoadedDepartments()
          await get().fetchStats()
          set({ isDisabling: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '禁用部门失败',
            isDisabling: false,
          })
        }
      },

      // 加载部门
      loadDepartment: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await departmentApi.load(id)
          await get().fetchDepartments()
          await get().fetchLoadedDepartments()
          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '加载部门失败',
            isLoading: false,
          })
        }
      },

      // 卸载部门
      unloadDepartment: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await departmentApi.unload(id)
          await get().fetchDepartments()
          await get().fetchLoadedDepartments()
          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '卸载部门失败',
            isLoading: false,
          })
        }
      },

      // 发送消息
      sendMessage: async (
        from: string,
        to: string,
        messageType: string,
        payload: unknown
      ) => {
        try {
          await departmentApi.sendMessage(from, to, messageType, payload)
          // 刷新消息列表
          await get().fetchMessages()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '发送消息失败',
          })
        }
      },

      // 设置选中的部门
      setSelectedDepartment: (department: DepartmentDetailResponse | null) => {
        set({ selectedDepartment: department })
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'department-storage',
      partialize: (state) => ({
        // 只持久化必要的数据
        selectedDepartment: state.selectedDepartment,
      }),
    }
  )
)

// 便捷的 selector hooks
export const useDepartments = () => useDepartmentStore((s) => s.departments)
export const useSelectedDepartment = () =>
  useDepartmentStore((s) => s.selectedDepartment)
export const useLoadedDepartments = () =>
  useDepartmentStore((s) => s.loadedDepartments)
export const useDepartmentStats = () => useDepartmentStore((s) => s.stats)
export const useDepartmentLoading = () =>
  useDepartmentStore((s) => s.isLoading)
export const useDepartmentError = () => useDepartmentStore((s) => s.error)
