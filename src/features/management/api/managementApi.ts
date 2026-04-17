/**
 * Management 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { DashboardData, WarningItem, WarningRule, CreateWarningRuleRequest, ManagementStats } from '../types/management.types'
import { useAuthStore } from '@/stores/authStore'

export async function getDashboard(): Promise<DashboardData> {
  const authStore = useAuthStore.getState()
  const tenantId = authStore.user?.tenantId
  return invoke('management_get_dashboard', { tenantId })
}

export async function listWarnings(): Promise<WarningItem[]> { return invoke('management_list_warnings') }
export async function createWarningRule(request: CreateWarningRuleRequest): Promise<WarningRule> { return invoke('management_create_warning_rule', { request }) }
export async function listRules(): Promise<WarningRule[]> { return invoke('management_list_rules') }
export async function getManagementStats(): Promise<ManagementStats> { return invoke('management_get_stats') }

export const managementApi = { getDashboard, listWarnings, createWarningRule, listRules, getStats: getManagementStats }
