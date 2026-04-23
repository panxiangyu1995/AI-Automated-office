/**
 * Marketplace 模块 API
 */

import { safeInvoke } from '@/lib/tauri'
import type { MarketplacePlugin, PluginStats } from '../types/marketplace.types'

export async function listPlugins(): Promise<MarketplacePlugin[]> {
  const result = await safeInvoke<MarketplacePlugin[]>('marketplace_list_plugins')
  return result ?? []
}

export async function installPlugin(id: string): Promise<void> {
  await safeInvoke('marketplace_install_plugin', { id })
}

export async function uninstallPlugin(id: string): Promise<void> {
  await safeInvoke('marketplace_uninstall_plugin', { id })
}

export async function enablePlugin(id: string): Promise<void> {
  await safeInvoke('marketplace_enable_plugin', { id })
}

export async function getMarketplaceStats(): Promise<PluginStats> {
  const result = await safeInvoke<PluginStats>('marketplace_get_stats')
  return result ?? ({} as PluginStats)
}

export const marketplaceApi = { listPlugins, installPlugin, uninstallPlugin, enablePlugin, getStats: getMarketplaceStats }
