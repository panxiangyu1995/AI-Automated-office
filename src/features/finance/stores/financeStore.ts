/**
 * Finance 模块 Store
 */

import { create } from 'zustand'
import type { InvoiceListItem, LedgerListItem, FinanceStats } from '../types/finance.types'
import { financeApi } from '../api/financeApi'

interface FinanceState {
  invoices: InvoiceListItem[]
  ledgerEntries: LedgerListItem[]
  stats: FinanceStats | null
  filterType: string | undefined
  isLoading: boolean
  error: string | null
  fetchInvoices: () => Promise<void>
  fetchLedger: (type?: string) => Promise<void>
  fetchStats: () => Promise<void>
  setFilterType: (type: string | undefined) => void
  clearError: () => void
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  invoices: [],
  ledgerEntries: [],
  stats: null,
  filterType: undefined,
  isLoading: false,
  error: null,

  fetchInvoices: async () => {
    set({ isLoading: true, error: null })
    try {
      const invoices = await financeApi.listInvoices()
      set({ invoices, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取发票列表失败', isLoading: false })
    }
  },

  fetchLedger: async (type?: string) => {
    set({ isLoading: true, error: null, filterType: type })
    try {
      const ledgerEntries = await financeApi.listLedger(type)
      set({ ledgerEntries, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取台账列表失败', isLoading: false })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await financeApi.getStats()
      set({ stats })
    } catch (e) {
      console.error('获取统计失败:', e)
    }
  },

  setFilterType: (type) => get().fetchLedger(type),

  clearError: () => set({ error: null }),
}))

export const useInvoices = () => useFinanceStore((s) => s.invoices)
export const useLedgerEntries = () => useFinanceStore((s) => s.ledgerEntries)
export const useFinanceStats = () => useFinanceStore((s) => s.stats)
