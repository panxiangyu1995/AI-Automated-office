/**
 * Sales 模块 Store
 */

import { create } from 'zustand'
import type { CustomerListItem, QuoteListItem, ContractListItem, SalesStats } from '../types/sales.types'
import { salesApi } from '../api/salesApi'

interface SalesState {
  customers: CustomerListItem[]
  quotes: QuoteListItem[]
  contracts: ContractListItem[]
  stats: SalesStats | null
  isLoading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  fetchQuotes: () => Promise<void>
  fetchContracts: () => Promise<void>
  fetchStats: () => Promise<void>
  clearError: () => void
}

export const useSalesStore = create<SalesState>((set) => ({
  customers: [],
  quotes: [],
  contracts: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null })
    try {
      const customers = await salesApi.listCustomers()
      set({ customers, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取客户列表失败', isLoading: false })
    }
  },

  fetchQuotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const quotes = await salesApi.listQuotes()
      set({ quotes, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取报价单列表失败', isLoading: false })
    }
  },

  fetchContracts: async () => {
    set({ isLoading: true, error: null })
    try {
      const contracts = await salesApi.listContracts()
      set({ contracts, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取合同列表失败', isLoading: false })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await salesApi.getStats()
      set({ stats })
    } catch (e) {
      console.error('获取统计失败:', e)
    }
  },

  clearError: () => set({ error: null }),
}))

export const useCustomers = () => useSalesStore((s) => s.customers)
export const useQuotes = () => useSalesStore((s) => s.quotes)
export const useContracts = () => useSalesStore((s) => s.contracts)
