/**
 * Pilot API 封装
 * 部门工具绑定和执行 API
 */

import { invoke } from '@tauri-apps/api/core'

// ==================== Types ====================

export type PilotDepartment = 'finance' | 'approval' | 'sales'

export type BindingStatus = 'pending' | 'bound' | 'failed' | 'released'

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface ToolBinding {
  tool_id: string
  tool_name: string
  department: string
  status: BindingStatus
  permission: string
  last_used?: number
  usage_count: number
}

export interface PilotResult {
  success: boolean
  department: string
  action: string
  result?: string
  error?: string
  duration_ms: number
}

// ==================== API Commands ====================

/**
 * Bind tools to a pilot department
 */
export async function bindPilotTools(
  department: PilotDepartment,
  tools: string[]
): Promise<ToolBinding[]> {
  return invoke('bind_pilot_tools', { department, tools })
}

/**
 * Execute a pilot action
 */
export async function executePilot(
  department: PilotDepartment,
  action: string,
  params?: Record<string, unknown>
): Promise<PilotResult> {
  return invoke('execute_pilot', { department, action, params })
}

/**
 * Get all pilot bindings
 */
export async function getPilotBindings(): Promise<ToolBinding[]> {
  return invoke('get_pilot_bindings')
}

/**
 * Release pilot bindings for a department
 */
export async function releasePilotBindings(
  department: PilotDepartment
): Promise<void> {
  return invoke('release_pilot_bindings', { department })
}
