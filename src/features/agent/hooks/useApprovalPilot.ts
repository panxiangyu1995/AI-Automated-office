import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  bindPilotTools,
  releasePilotBindings,
  getPilotBindings,
  getPilotExecutions,
  getPilotAuditLog,
  getPilotStats,
  getPilotContext,
  type PilotToolBinding,
  type PilotExecution,
  type PilotAuditEntry,
  type PilotStats,
  type PilotContext,
  type PilotStep,
  type BindingStatus,
  type ExecutionStatus,
} from '../api/pilotApi'

export type { BindingStatus, ExecutionStatus, PilotStep, PilotToolBinding, PilotExecution, PilotAuditEntry, PilotStats, PilotContext }

export type ApprovalPhase = 'read' | 'generate' | 'confirm' | 'execute' | 'complete' | 'failed'
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin'

export interface ApprovalBinding {
  toolId: string
  toolName: string
  status: BindingStatus
  permission: PermissionLevel
  lastUsed?: Date
  usageCount: number
}

export interface ApprovalRuntimeStep {
  id: string
  phase: ApprovalPhase
  label: string
  status: ExecutionStatus
  startedAt?: Date
  completedAt?: Date
  duration?: number
  error?: string
  result?: string
}

export interface ApprovalAuditEntry {
  id: string
  timestamp: Date
  actor: string
  action: string
  target: string
  result: 'success' | 'failure' | 'denied'
  details: string
  correlationId: string
}

export interface ApprovalPilotStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  pendingConfirmations: number
  avgExecutionTime: number
  activeBindings: number
}

export interface ApprovalContext {
  id: string
  title: string
  requester: string
  department: string
  amount?: number
  reason: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
}

const APPROVAL_TOOLS = [
  'hr_employee_query',
  'finance_budget_check',
  'approval_submit',
  'notification_send',
  'admin_override',
]

function convertBinding(b: PilotToolBinding): ApprovalBinding {
  return {
    toolId: b.tool_id,
    toolName: b.tool_name,
    status: b.status,
    permission: (b.permission as PermissionLevel) || 'read',
    lastUsed: b.last_used ? new Date(b.last_used * 1000) : undefined,
    usageCount: b.usage_count,
  }
}

function convertStep(s: PilotStep): ApprovalRuntimeStep {
  return {
    id: s.id,
    phase: s.phase as ApprovalPhase,
    label: s.label,
    status: s.status,
    startedAt: s.started_at ? new Date(s.started_at * 1000) : undefined,
    completedAt: s.completed_at ? new Date(s.completed_at * 1000) : undefined,
    duration: s.duration_ms,
    error: s.error,
    result: s.result,
  }
}

function convertAudit(e: PilotAuditEntry): ApprovalAuditEntry {
  return {
    id: e.id,
    timestamp: new Date(e.timestamp * 1000),
    actor: e.actor,
    action: e.action,
    target: e.target,
    result: e.result,
    details: e.details,
    correlationId: e.correlation_id,
  }
}

function convertContext(c: PilotContext): ApprovalContext {
  return {
    id: c.id,
    title: c.title,
    requester: c.requester ?? '',
    department: c.department ?? '',
    amount: c.amount,
    reason: c.reason ?? '',
    createdAt: new Date(c.created_at * 1000),
    status: (c.status as ApprovalContext['status']) || 'pending',
  }
}

export function useApprovalPilot() {
  const [bindings, setBindings] = useState<ApprovalBinding[]>([])
  const [steps, setSteps] = useState<ApprovalRuntimeStep[]>([])
  const [auditEntries, setAuditEntries] = useState<ApprovalAuditEntry[]>([])
  const [context, setContext] = useState<ApprovalContext | null>(null)
  const [stats, setStats] = useState<ApprovalPilotStats>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    pendingConfirmations: 0,
    avgExecutionTime: 0,
    activeBindings: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [allBindings, executions, audit, pilotStats, pilotContext] = await Promise.allSettled([
        getPilotBindings(),
        getPilotExecutions('approval'),
        getPilotAuditLog('approval'),
        getPilotStats('approval'),
        getPilotContext('approval'),
      ])

      if (allBindings.status === 'fulfilled') {
        setBindings(allBindings.value.filter(b => b.department === 'approval').map(convertBinding))
      }
      if (executions.status === 'fulfilled' && executions.value.length > 0) {
        const latest = executions.value[0]
        setSteps(latest.steps.map(convertStep))
      }
      if (audit.status === 'fulfilled') {
        setAuditEntries(audit.value.map(convertAudit))
      }
      if (pilotStats.status === 'fulfilled') {
        setStats({
          totalExecutions: pilotStats.value.total_executions,
          successfulExecutions: pilotStats.value.successful_executions,
          failedExecutions: pilotStats.value.failed_executions,
          pendingConfirmations: pilotStats.value.pending_confirmations,
          avgExecutionTime: pilotStats.value.avg_execution_time_ms,
          activeBindings: pilotStats.value.active_bindings,
        })
      }
      if (pilotContext.status === 'fulfilled') {
        setContext(convertContext(pilotContext.value))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const bindApprovalTools = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await bindPilotTools('approval', APPROVAL_TOOLS)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  const release = useCallback(async () => {
    try {
      await releasePilotBindings('approval')
      setBindings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  const currentPhase = useMemo<ApprovalPhase>(() => {
    const running = steps.find(s => s.status === 'running')
    if (running) return running.phase
    const pending = steps.find(s => s.status === 'idle')
    if (pending) {
      const idx = steps.indexOf(pending)
      if (idx > 0) return steps[idx - 1].phase
    }
    return 'complete'
  }, [steps])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    bindings,
    steps,
    auditEntries,
    context,
    stats,
    currentPhase,
    isLoading,
    error,
    refresh,
    bindTools: bindApprovalTools,
    release,
  }
}
