/**
 * Management 模块 API
 */

import { safeInvoke } from '@/lib/tauri'
import type { DashboardData, WarningItem, WarningRule, CreateWarningRuleRequest, ManagementStats } from '../types/management.types'
import { useAuthStore } from '@/stores/authStore'

export async function getDashboard(): Promise<DashboardData> {
  const authStore = useAuthStore.getState()
  const tenantId = authStore.user?.tenant_id
  const result = await safeInvoke<DashboardData>('management_get_dashboard', { tenantId })
  return result ?? ({} as DashboardData)
}

export async function listWarnings(): Promise<WarningItem[]> {
  const result = await safeInvoke<WarningItem[]>('management_list_warnings')
  return result ?? []
}

export async function createWarningRule(request: CreateWarningRuleRequest): Promise<WarningRule> {
  const result = await safeInvoke<WarningRule>('management_create_warning_rule', { request })
  return result ?? ({} as WarningRule)
}

export async function listRules(): Promise<WarningRule[]> {
  const result = await safeInvoke<WarningRule[]>('management_list_rules')
  return result ?? []
}

export async function getManagementStats(): Promise<ManagementStats> {
  const result = await safeInvoke<ManagementStats>('management_get_stats')
  return result ?? ({} as ManagementStats)
}

export const managementApi = { getDashboard, listWarnings, createWarningRule, listRules, getStats: getManagementStats }
