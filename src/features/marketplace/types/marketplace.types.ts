/**
 * Marketplace 模块类型定义
 */

export interface MarketplacePlugin {
  id: string
  name: string
  description: string
  version: string
  category: string
  icon?: string
  author: string
  installed: boolean
  enabled: boolean
  price: number
}

export interface PluginStats {
  totalPlugins: number
  installed: number
  categories: string[]
}
