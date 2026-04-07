/**
 * Management 模块类型定义
 */

export interface DashboardData {
  totalEmployees: number
  totalCustomers: number
  totalSales: number
  totalContracts: number
  pendingApprovals: number
  pendingInventory: number
  totalReceivable: number
  totalPayable: number
}

export interface WarningItem {
  id: string
  warningType: string
  title: string
  description: string
  level: string
  source: string
  createdAt: number
}

export interface WarningRule {
  id: string
  warningType: string
  title: string
  condition: string
  level: string
  createdAt: number
}

export interface CreateWarningRuleRequest {
  warningType: string
  title: string
  condition: string
  level: string
}

export interface ManagementStats {
  warningsCount: number
  rulesCount: number
}

export const WARNING_LEVEL_LABELS: Record<string, string> = {
  info: '提示', warning: '警告', critical: '紧急'
}

export const WARNING_LEVEL_COLORS: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
}
