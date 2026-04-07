/**
 * Warehouse 模块 Store
 */

import { create } from 'zustand'
import type { InboundListItem, OutboundListItem, InventoryListItem, WarehouseStats } from '../types/warehouse.types'
import { warehouseApi } from '../api/warehouseApi'

interface WarehouseState {
  inbounds: InboundListItem[]
  outbounds: OutboundListItem[]
  inventory: InventoryListItem[]
  stats: WarehouseStats | null
  isLoading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  clearError: () => void
}

export const useWarehouseStore = create<WarehouseState>((set) => ({
  inbounds: [], outbounds: [], inventory: [], stats: null,
  isLoading: false, error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const [inbounds, outbounds, inventory, stats] = await Promise.all([
        warehouseApi.listInbounds(), warehouseApi.listOutbounds(),
        warehouseApi.listInventory(), warehouseApi.getStats()
      ])
      set({ inbounds, outbounds, inventory, stats, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取数据失败', isLoading: false })
    }
  },
  clearError: () => set({ error: null }),
}))

export const useWarehouseInventory = () => useWarehouseStore((s) => s.inventory)
