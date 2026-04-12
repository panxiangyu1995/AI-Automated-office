/**
 * Plugin Sidebar Registry
 * 
 * Manages plugin sidebar entries registration.
 * Plugins can register their sidebar entries here, which will be
 * automatically rendered in the Sidebar component.
 */

import type { LucideIcon } from 'lucide-react'
import type { SidebarResourceEntry } from '@/stores/uiStore'

export interface PluginSidebarEntryConfig {
  id: string
  label: string
  icon?: LucideIcon
  description?: string
  path: string
  activityItem?: string
}

export interface PluginSidebarRegistration {
  pluginId: string
  pluginName: string
  icon?: LucideIcon
  entries: PluginSidebarEntryConfig[]
  /** Badge configuration for the activity bar */
  badge?: {
    targetId: string
    count: number | string
    color?: string
  }
}

class PluginSidebarRegistryImpl {
  private registrations: Map<string, PluginSidebarRegistration> = new Map()
  private listeners: Set<() => void> = new Set()

  register(registration: PluginSidebarRegistration): void {
    this.registrations.set(registration.pluginId, registration)
    this.notifyListeners()
  }

  unregister(pluginId: string): void {
    this.registrations.delete(pluginId)
    this.notifyListeners()
  }

  get(pluginId: string): PluginSidebarRegistration | undefined {
    return this.registrations.get(pluginId)
  }

  getAll(): PluginSidebarRegistration[] {
    return Array.from(this.registrations.values())
  }

  /** Convert registrations to SidebarResourceEntry format for store */
  toSidebarEntries(): SidebarResourceEntry[] {
    const entries: SidebarResourceEntry[] = []
    
    for (const [, reg] of this.registrations) {
      for (const entry of reg.entries) {
        entries.push({
          id: `${reg.pluginId}:${entry.id}`,
          label: entry.label,
          description: entry.description,
          kind: 'dynamic',
          target: {
            path: entry.path,
            mode: 'dynamic' as const,
            activityItem: entry.activityItem as any,
          },
        })
      }
    }

    return entries
  }

  /** Get badge configurations */
  getBadges(): Array<{ targetId: string; count: number | string; color?: string; pluginId: string }> {
    const badges: Array<{ targetId: string; count: number | string; color?: string; pluginId: string }> = []
    for (const [pluginId, reg] of this.registrations) {
      if (reg.badge && typeof reg.badge.count === 'number' ? reg.badge.count > 0 : true) {
        badges.push({
          targetId: reg.badge!.targetId,
          count: reg.badge!.count,
          color: reg.badge!.color,
          pluginId,
        })
      }
    }
    return badges
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l())
  }
}

export const PluginSidebarRegistry = new PluginSidebarRegistryImpl()

/**
 * Register built-in plugin sidebar entries
 */
export function registerBuiltinSidebarEntries() {
  // HR Plugin
  PluginSidebarRegistry.register({
    pluginId: 'hr',
    pluginName: '人事管理',
    entries: [
      { id: 'employees', label: '员工列表', path: '/hr/employees', icon: undefined },
      { id: 'attendance', label: '考勤记录', path: '/hr/attendance', icon: undefined },
      { id: 'recruitment', label: '招聘管理', path: '/hr/recruitment', icon: undefined },
    ],
  })

  // Finance Plugin
  PluginSidebarRegistry.register({
    pluginId: 'finance',
    pluginName: '财务管理',
    entries: [
      { id: 'invoices', label: '发票管理', path: '/finance/invoices', icon: undefined },
      { id: 'reimburse', label: '报销审批', path: '/finance/reimburse', icon: undefined },
      { id: 'reports', label: '财务报表', path: '/finance/reports', icon: undefined },
    ],
  })

  // Sales Plugin
  PluginSidebarRegistry.register({
    pluginId: 'sales',
    pluginName: '销售管理',
    entries: [
      { id: 'customers', label: '客户列表', path: '/sales/customers', icon: undefined },
      { id: 'opportunities', label: '商机跟踪', path: '/sales/opportunities', icon: undefined },
      { id: 'orders', label: '订单管理', path: '/sales/orders', icon: undefined },
    ],
  })

  // Warehouse Plugin
  PluginSidebarRegistry.register({
    pluginId: 'warehouse',
    pluginName: '仓储管理',
    entries: [
      { id: 'inventory', label: '库存查询', path: '/warehouse/inventory', icon: undefined },
      { id: 'inbound', label: '入库管理', path: '/warehouse/inbound', icon: undefined },
      { id: 'outbound', label: '出库管理', path: '/warehouse/outbound', icon: undefined },
    ],
  })

  // Dashboard Plugin
  PluginSidebarRegistry.register({
    pluginId: 'dashboard',
    pluginName: '数据看板',
    entries: [
      { id: 'overview', label: '总览', path: '/dashboard/overview', icon: undefined },
      { id: 'analytics', label: '数据分析', path: '/dashboard/analytics', icon: undefined },
    ],
  })

  // Knowledge Plugin
  PluginSidebarRegistry.register({
    pluginId: 'knowledge',
    pluginName: '知识库',
    entries: [
      { id: 'docs', label: '知识文档', path: '/knowledge/docs', icon: undefined },
      { id: 'faq', label: '常见问题', path: '/knowledge/faq', icon: undefined },
    ],
  })

  // Service Plugin
  PluginSidebarRegistry.register({
    pluginId: 'service',
    pluginName: '售后工单',
    entries: [
      { id: 'tickets', label: '工单列表', path: '/service/tickets', icon: undefined },
      { id: 'complaints', label: '投诉管理', path: '/service/complaints', icon: undefined },
    ],
  })

  // Approval Plugin
  PluginSidebarRegistry.register({
    pluginId: 'approval',
    pluginName: '审批中心',
    entries: [
      { id: 'pending', label: '待我审批', path: '/approval/pending', icon: undefined },
      { id: 'my', label: '我的申请', path: '/approval/my', icon: undefined },
      { id: 'processes', label: '流程管理', path: '/approval/processes', icon: undefined },
    ],
    badge: {
      targetId: 'approval',
      count: 3,
      color: '#F59E0B',
    },
  })
}
