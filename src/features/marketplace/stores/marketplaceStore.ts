/**
 * Marketplace 模块 Store
 */

import { create } from 'zustand'
import type { MarketplacePlugin, PluginStats } from '../types/marketplace.types'
import { marketplaceApi } from '../api/marketplaceApi'

interface MarketplaceState {
  plugins: MarketplacePlugin[]
  stats: PluginStats | null
  isLoading: boolean
  error: string | null
  fetchPlugins: () => Promise<void>
  install: (id: string) => Promise<void>
  uninstall: (id: string) => Promise<void>
  enable: (id: string) => Promise<void>
  clearError: () => void
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  plugins: [], stats: null, isLoading: false, error: null,

  fetchPlugins: async () => {
    set({ isLoading: true, error: null })
    try {
      const plugins = await marketplaceApi.listPlugins()
      const stats = await marketplaceApi.getStats()
      set({ plugins, stats, isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '获取插件列表失败', isLoading: false })
    }
  },

  install: async (id: string) => {
    try {
      await marketplaceApi.installPlugin(id)
      await get().fetchPlugins()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '安装失败' })
    }
  },

  uninstall: async (id: string) => {
    try {
      await marketplaceApi.uninstallPlugin(id)
      await get().fetchPlugins()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '卸载失败' })
    }
  },

  enable: async (id: string) => {
    try {
      await marketplaceApi.enablePlugin(id)
      await get().fetchPlugins()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '启用失败' })
    }
  },

  clearError: () => set({ error: null }),
}))
