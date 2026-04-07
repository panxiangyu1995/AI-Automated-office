/**
 * Approval 模块 Zustand Store
 * Task 148 - Approval审批中心模块
 */

import { create } from 'zustand'
import type {
  ApprovalFlow,
  FlowListItem,
  ApprovalRecord,
  RecordListItem,
  ApprovalStats,
} from '../types/approval.types'
import { approvalApi } from '../api/approvalApi'

interface ApprovalState {
  flows: FlowListItem[]
  records: RecordListItem[]
  selectedRecord: ApprovalRecord | null
  selectedFlow: ApprovalFlow | null
  stats: ApprovalStats | null
  filterStatus: string | undefined
  isLoadingFlows: boolean
  isLoadingRecords: boolean
  isProcessing: boolean
  error: string | null

  fetchFlows: () => Promise<void>
  fetchFlow: (id: string) => Promise<void>
  fetchRecords: (status?: string) => Promise<void>
  fetchRecord: (id: string) => Promise<void>
  fetchStats: () => Promise<void>
  approve: (id: string, approverId: string, approverName: string, comment?: string) => Promise<void>
  reject: (id: string, approverId: string, approverName: string, comment?: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  setFilterStatus: (status: string | undefined) => void
  clearError: () => void
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  flows: [],
  records: [],
  selectedRecord: null,
  selectedFlow: null,
  stats: null,
  filterStatus: undefined,
  isLoadingFlows: false,
  isLoadingRecords: false,
  isProcessing: false,
  error: null,

  fetchFlows: async () => {
    set({ isLoadingFlows: true, error: null })
    try {
      const flows = await approvalApi.listFlows()
      set({ flows, isLoadingFlows: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取流程列表失败', isLoadingFlows: false })
    }
  },

  fetchFlow: async (id: string) => {
    try {
      const flow = await approvalApi.getFlow(id)
      set({ selectedFlow: flow })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取流程详情失败' })
    }
  },

  fetchRecords: async (status?: string) => {
    set({ isLoadingRecords: true, error: null, filterStatus: status })
    try {
      const records = await approvalApi.listRecords(status)
      set({ records, isLoadingRecords: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取记录列表失败', isLoadingRecords: false })
    }
  },

  fetchRecord: async (id: string) => {
    try {
      const record = await approvalApi.getRecord(id)
      set({ selectedRecord: record })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取记录详情失败' })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await approvalApi.getStats()
      set({ stats })
    } catch (e) {
      console.error('获取统计失败:', e)
    }
  },

  approve: async (id, approverId, approverName, comment) => {
    set({ isProcessing: true, error: null })
    try {
      await approvalApi.approveRecord(id, { approverId, approverName, comment })
      await get().fetchRecords(get().filterStatus)
      await get().fetchStats()
      set({ selectedRecord: null, isProcessing: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '审批失败', isProcessing: false })
    }
  },

  reject: async (id, approverId, approverName, comment) => {
    set({ isProcessing: true, error: null })
    try {
      await approvalApi.rejectRecord(id, { approverId, approverName, comment })
      await get().fetchRecords(get().filterStatus)
      await get().fetchStats()
      set({ selectedRecord: null, isProcessing: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '驳回失败', isProcessing: false })
    }
  },

  cancel: async (id: string) => {
    set({ isProcessing: true, error: null })
    try {
      await approvalApi.cancelRecord(id)
      await get().fetchRecords(get().filterStatus)
      await get().fetchStats()
      set({ selectedRecord: null, isProcessing: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '取消失败', isProcessing: false })
    }
  },

  setFilterStatus: (status) => {
    get().fetchRecords(status)
  },

  clearError: () => set({ error: null }),
}))

export const useFlows = () => useApprovalStore((s) => s.flows)
export const useRecords = () => useApprovalStore((s) => s.records)
export const useApprovalStats = () => useApprovalStore((s) => s.stats)
export const useApprovalLoading = () => useApprovalStore((s) => s.isLoadingRecords)
