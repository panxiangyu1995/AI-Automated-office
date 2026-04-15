import { invoke } from '@tauri-apps/api/core'

export type PilotDepartment = 'finance' | 'approval' | 'sales'
export type BindingStatus = 'pending' | 'bound' | 'failed' | 'released'
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface PilotToolBinding {
  tool_id: string
  tool_name: string
  department: string
  status: BindingStatus
  permission: string
  last_used?: number
  usage_count: number
}

export interface PilotExecution {
  id: string
  department: PilotDepartment
  action: string
  status: ExecutionStatus
  steps: PilotStep[]
  started_at: number
  completed_at?: number
  duration_ms?: number
  result?: string
  error?: string
  correlation_id: string
}

export interface PilotStep {
  id: string
  phase: string
  label: string
  status: ExecutionStatus
  started_at?: number
  completed_at?: number
  duration_ms?: number
  result?: string
  error?: string
}

export interface PilotAuditEntry {
  id: string
  timestamp: number
  actor: string
  action: string
  target: string
  result: 'success' | 'failure' | 'denied'
  details: string
  correlation_id: string
}

export interface PilotStats {
  total_executions: number
  successful_executions: number
  failed_executions: number
  pending_confirmations: number
  avg_execution_time_ms: number
  active_bindings: number
}

export interface PilotContext {
  id: string
  title: string
  requester?: string
  department?: string
  amount?: number
  reason?: string
  status: string
  created_at: number
  [key: string]: unknown
}

export async function bindPilotTools(department: PilotDepartment, tools: string[]): Promise<PilotToolBinding[]> {
  return invoke('bind_pilot_tools', { department, tools })
}

export async function executePilot(
  department: PilotDepartment,
  action: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; department: string; action: string; result?: string; error?: string; duration_ms: number }> {
  return invoke('execute_pilot', { department, action, params })
}

export async function getPilotBindings(): Promise<PilotToolBinding[]> {
  return invoke('get_pilot_bindings')
}

export async function releasePilotBindings(department: PilotDepartment): Promise<void> {
  return invoke('release_pilot_bindings', { department })
}

export async function getPilotExecutions(department: PilotDepartment): Promise<PilotExecution[]> {
  return invoke('get_pilot_executions', { department })
}

export async function getPilotAuditLog(department: PilotDepartment, limit?: number): Promise<PilotAuditEntry[]> {
  return invoke('get_pilot_audit_log', { department, limit: limit ?? 50 })
}

export async function getPilotStats(department: PilotDepartment): Promise<PilotStats> {
  return invoke('get_pilot_stats', { department })
}

export async function getPilotContext(department: PilotDepartment, contextId?: string): Promise<PilotContext> {
  return invoke('get_pilot_context', { department, contextId })
}
