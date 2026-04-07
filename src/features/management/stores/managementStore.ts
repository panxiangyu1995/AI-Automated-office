/**
 * Management 模块 Store
 */

import { create } from 'zustand'
import type { DashboardData, WarningItem, WarningRule } from '../types/management.types'
import { managementApi } from '../api/managementApi'

interface ManagementState {
  dashboard: DashboardData | null
  warnings: WarningItem[]
  rules: WarningRule[]
  isLoading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  clearError: () => void
}

export const useManagementStore = create<ManagementState>((set) => ({
  dashboard: null, warnings: [], rules: [], isLoading: false, error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const [dashboard, warnings, rules] = await Promise.all([
        managementApi.getDashboard(), managementApi.listWarnings(), managementApi.listRules()
      ])
      set({ dashboard, warnings, rules, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取数据失败', isLoading: false })
    }
  },
  clearError: () => set({ error: null }),
}))
