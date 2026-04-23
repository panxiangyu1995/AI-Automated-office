/**
 * Pilot API 封装
 * 部门工具绑定和执行 API
 */

import { safeInvoke } from '@/lib/tauri'

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
  const result = await safeInvoke<ToolBinding[]>('bind_pilot_tools', { department, tools })
  return result ?? []
}

/**
 * Execute a pilot action
 */
export async function executePilot(
  department: PilotDepartment,
  action: string,
  params?: Record<string, unknown>
): Promise<PilotResult> {
  const result = await safeInvoke<PilotResult>('execute_pilot', { department, action, params })
  return result ?? { success: false, department, action, error: 'execute_pilot 调用失败', duration_ms: 0 }
}

/**
 * Get all pilot bindings
 */
export async function getPilotBindings(): Promise<ToolBinding[]> {
  const result = await safeInvoke<ToolBinding[]>('get_pilot_bindings')
  return result ?? []
}

/**
 * Release pilot bindings for a department
 */
export async function releasePilotBindings(
  department: PilotDepartment
): Promise<void> {
  await safeInvoke('release_pilot_bindings', { department })
}
