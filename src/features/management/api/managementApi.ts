/**
 * Management 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { DashboardData, WarningItem, WarningRule, CreateWarningRuleRequest, ManagementStats } from '../types/management.types'

export async function getDashboard(): Promise<DashboardData> { return invoke('management_get_dashboard') }
export async function listWarnings(): Promise<WarningItem[]> { return invoke('management_list_warnings') }
export async function createWarningRule(request: CreateWarningRuleRequest): Promise<WarningRule> { return invoke('management_create_warning_rule', { request }) }
export async function listRules(): Promise<WarningRule[]> { return invoke('management_list_rules') }
export async function getManagementStats(): Promise<ManagementStats> { return invoke('management_get_stats') }

export const managementApi = { getDashboard, listWarnings, createWarningRule, listRules, getStats: getManagementStats }
