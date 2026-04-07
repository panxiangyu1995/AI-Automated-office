/**
 * Marketplace 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { MarketplacePlugin, PluginStats } from '../types/marketplace.types'

export async function listPlugins(): Promise<MarketplacePlugin[]> { return invoke('marketplace_list_plugins') }
export async function installPlugin(id: string): Promise<void> { return invoke('marketplace_install_plugin', { id }) }
export async function uninstallPlugin(id: string): Promise<void> { return invoke('marketplace_uninstall_plugin', { id }) }
export async function enablePlugin(id: string): Promise<void> { return invoke('marketplace_enable_plugin', { id }) }
export async function getMarketplaceStats(): Promise<PluginStats> { return invoke('marketplace_get_stats') }

export const marketplaceApi = { listPlugins, installPlugin, uninstallPlugin, enablePlugin, getStats: getMarketplaceStats }
