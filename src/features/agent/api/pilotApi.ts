import { safeInvoke } from '@/lib/tauri'

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
  const result = await safeInvoke<PilotToolBinding[]>('bind_pilot_tools', { department, tools })
  return result ?? []
}

export async function executePilot(
  department: PilotDepartment,
  action: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; department: string; action: string; result?: string; error?: string; duration_ms: number }> {
  const result = await safeInvoke<{ success: boolean; department: string; action: string; result?: string; error?: string; duration_ms: number }>('execute_pilot', { department, action, params })
  return result ?? { success: false, department, action, error: 'execute_pilot 调用失败', duration_ms: 0 }
}

export async function getPilotBindings(): Promise<PilotToolBinding[]> {
  const result = await safeInvoke<PilotToolBinding[]>('get_pilot_bindings')
  return result ?? []
}

export async function releasePilotBindings(department: PilotDepartment): Promise<void> {
  await safeInvoke('release_pilot_bindings', { department })
}

export async function getPilotExecutions(department: PilotDepartment): Promise<PilotExecution[]> {
  const result = await safeInvoke<PilotExecution[]>('get_pilot_executions', { department })
  return result ?? []
}

export async function getPilotAuditLog(department: PilotDepartment, limit?: number): Promise<PilotAuditEntry[]> {
  const result = await safeInvoke<PilotAuditEntry[]>('get_pilot_audit_log', { department, limit: limit ?? 50 })
  return result ?? []
}

export async function getPilotStats(department: PilotDepartment): Promise<PilotStats> {
  const result = await safeInvoke<PilotStats>('get_pilot_stats', { department })
  return result ?? { total_executions: 0, successful_executions: 0, failed_executions: 0, pending_confirmations: 0, avg_execution_time_ms: 0, active_bindings: 0 }
}

export async function getPilotContext(department: PilotDepartment, contextId?: string): Promise<PilotContext> {
  const result = await safeInvoke<PilotContext>('get_pilot_context', { department, contextId })
  return result ?? { id: '', title: '', status: '', created_at: 0 }
}
