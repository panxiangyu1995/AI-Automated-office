/**
 * Plugin Capabilities Registry
 * 
 * Provides plugin capability descriptors for AI recommendation engine.
 * Plugins register their capabilities here, and the AI can match user input
 * against these capabilities to suggest relevant plugins.
 */

import type { LucideIcon } from 'lucide-react'

export interface PluginAction {
  name: string
  description: string
  commandId?: string
}

export interface PluginCapabilityDescriptor {
  pluginId: string
  pluginName: string
  description: string
  keywords: string[]
  icon?: LucideIcon
  actions: PluginAction[]
  enabled?: boolean
  dismissed?: boolean
}

class PluginCapabilitiesRegistryImpl {
  private capabilities: Map<string, PluginCapabilityDescriptor> = new Map()
  private listeners: Set<() => void> = new Set()

  register(capability: PluginCapabilityDescriptor): void {
    this.capabilities.set(capability.pluginId, capability)
    this.notifyListeners()
  }

  unregister(pluginId: string): void {
    this.capabilities.delete(pluginId)
    this.notifyListeners()
  }

  get(pluginId: string): PluginCapabilityDescriptor | undefined {
    return this.capabilities.get(pluginId)
  }

  getAll(): PluginCapabilityDescriptor[] {
    return Array.from(this.capabilities.values()).filter(c => c.enabled !== false && !c.dismissed)
  }

  match(input: string): PluginCapabilityDescriptor[] {
    if (!input.trim()) return []
    
    const lowerInput = input.toLowerCase()
    const words = lowerInput.split(/\s+/)

    return this.getAll()
      .map(cap => {
        let score = 0
        
        // Exact keyword match (highest priority)
        for (const kw of cap.keywords) {
          if (lowerInput.includes(kw.toLowerCase())) {
            score += 10
          }
        }

        // Word match (partial priority)
        for (const word of words) {
          for (const kw of cap.keywords) {
            if (kw.toLowerCase().includes(word)) {
              score += 5
            }
          }
          // Match in description
          if (cap.description.toLowerCase().includes(word)) {
            score += 2
          }
          // Match in plugin name
          if (cap.pluginName.toLowerCase().includes(word)) {
            score += 3
          }
        }

        return { capability: cap, score }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.capability)
  }

  dismiss(pluginId: string): void {
    const cap = this.capabilities.get(pluginId)
    if (cap) {
      cap.dismissed = true
      this.notifyListeners()
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l())
  }
}

export const PluginCapabilitiesRegistry = new PluginCapabilitiesRegistryImpl()

/**
 * Register built-in plugin capabilities
 */
export function registerBuiltinCapabilities() {
  // HR Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'hr',
    pluginName: '人事管理',
    description: '管理员工信息、考勤、招聘、绩效考核等人事事务',
    keywords: ['员工', '招聘', '考勤', '绩效', '人事', '工资', '请假', '离职', '入职', '档案'],
    actions: [
      { name: '员工管理', description: '查看和管理员工信息', commandId: 'nav.hr' },
      { name: '考勤记录', description: '查看员工考勤数据', commandId: 'nav.hr' },
      { name: '招聘流程', description: '管理招聘流程和候选人', commandId: 'nav.hr' },
    ],
  })

  // Finance Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'finance',
    pluginName: '财务管理',
    description: '处理发票识别、报销审批、账务管理、财务报表等财务事务',
    keywords: ['发票', '报销', '财务', '账务', '报表', '预算', '付款', '收款', '凭证', 'OCR'],
    actions: [
      { name: '发票识别', description: 'OCR识别发票信息', commandId: 'nav.finance' },
      { name: '报销审批', description: '处理报销申请', commandId: 'nav.finance' },
      { name: '财务报表', description: '生成财务报表', commandId: 'nav.finance' },
    ],
  })

  // Sales Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'sales',
    pluginName: '销售管理',
    description: '管理客户、商机、订单、销售合同等销售业务',
    keywords: ['客户', '商机', '订单', '合同', '销售', '报价', 'CRM', '售前', '售后'],
    actions: [
      { name: '客户管理', description: '管理客户信息和跟进记录', commandId: 'nav.sales' },
      { name: '商机跟踪', description: '跟踪销售商机进展', commandId: 'nav.sales' },
      { name: '订单管理', description: '管理销售订单', commandId: 'nav.sales' },
    ],
  })

  // Warehouse Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'warehouse',
    pluginName: '仓储管理',
    description: '管理库存、出入库、盘点、物流等仓储业务',
    keywords: ['库存', '入库', '出库', '盘点', '仓储', '物流', '仓库', '商品', '批次', '补货', '预警'],
    actions: [
      { name: '库存查询', description: '查询当前库存情况', commandId: 'warehouse.inventory' },
      { name: '入库登记', description: '创建入库单', commandId: 'warehouse.inbound' },
      { name: '出库登记', description: '创建出库单', commandId: 'warehouse.outbound' },
      { name: '库存盘点', description: '进行库存盘点', commandId: 'warehouse.stocktaking' },
      { name: '查看预警', description: '查看库存预警', commandId: 'warehouse.inventory' },
    ],
  })

  // Dashboard Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'dashboard',
    pluginName: '数据看板',
    description: '可视化展示各类业务数据、统计报表、趋势分析',
    keywords: ['数据', '报表', '图表', '统计', '分析', '仪表盘', '看板', '趋势', '指标'],
    actions: [
      { name: '查看报表', description: '查看各类统计报表', commandId: 'nav.dashboard' },
      { name: '数据分析', description: '分析业务数据趋势', commandId: 'nav.dashboard' },
    ],
  })

  // Knowledge Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'knowledge',
    pluginName: '知识库',
    description: '管理企业知识文档、FAQ、流程规范等知识资产',
    keywords: ['知识', '文档', 'FAQ', '规范', '流程', '手册', '指南', '制度', '政策'],
    actions: [
      { name: '知识搜索', description: '搜索知识库内容', commandId: 'nav.knowledge' },
      { name: '新建文档', description: '创建知识文档', commandId: 'nav.knowledge' },
    ],
  })

  // After-sales Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'service',
    pluginName: '售后工单',
    description: '管理客户服务工单、投诉处理、满意度调查',
    keywords: ['售后', '工单', '投诉', '客服', '服务', '退换货', '维修', '售后'],
    actions: [
      { name: '工单管理', description: '查看和处理工单', commandId: 'nav.service' },
      { name: '投诉处理', description: '处理客户投诉', commandId: 'nav.service' },
    ],
  })

  // Approval Plugin
  PluginCapabilitiesRegistry.register({
    pluginId: 'approval',
    pluginName: '审批中心',
    description: '处理各类审批流程，包括请假、报销、采购等',
    keywords: ['审批', '申请', '流程', '通过', '驳回', '待办', '加签', '会签'],
    actions: [
      { name: '发起申请', description: '发起新的审批申请', commandId: 'nav.approval' },
      { name: '审批待办', description: '处理待审批事项', commandId: 'nav.approval' },
    ],
  })
}
