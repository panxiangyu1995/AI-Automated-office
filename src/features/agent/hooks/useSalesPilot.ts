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
  type PilotAuditEntry,
  type BindingStatus,
  type ExecutionStatus,
} from '../api/pilotApi'

export type { BindingStatus, ExecutionStatus }

export type SalesPhase = 'read' | 'generate' | 'confirm' | 'execute' | 'complete' | 'failed'
export type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

export interface SalesBinding {
  toolId: string
  toolName: string
  status: BindingStatus
  permission: 'none' | 'read' | 'write' | 'admin'
  lastUsed?: Date
  usageCount: number
}

export interface SalesRuntimeStep {
  id: string
  phase: SalesPhase
  label: string
  status: ExecutionStatus
  startedAt?: Date
  completedAt?: Date
  duration?: number
  error?: string
  result?: string
}

export interface SalesAuditEntry {
  id: string
  timestamp: Date
  actor: string
  action: string
  target: string
  result: 'success' | 'failure' | 'denied'
  details: string
  correlationId: string
}

export interface SalesPilotStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  pendingConfirmations: number
  avgExecutionTime: number
  activeBindings: number
  totalPipelineValue: number
}

export interface SalesContext {
  id: string
  customerName: string
  customerSegment: string
  contactPerson: string
  estimatedValue: number
  probability: number
  product: string
  createdAt: Date
  stage: OpportunityStage
}

const SALES_TOOLS = [
  'crm_customer_query',
  'crm_opportunity_update',
  'finance_quote_generate',
  'inventory_stock_check',
  'notification_send',
]

function convertBinding(b: PilotToolBinding): SalesBinding {
  return {
    toolId: b.tool_id,
    toolName: b.tool_name,
    status: b.status,
    permission: (b.permission as SalesBinding['permission']) || 'read',
    lastUsed: b.last_used ? new Date(b.last_used * 1000) : undefined,
    usageCount: b.usage_count,
  }
}

function convertAudit(e: PilotAuditEntry): SalesAuditEntry {
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

function convertContext(c: { id: string; title: string; [key: string]: unknown }): SalesContext {
  return {
    id: c.id,
    customerName: (c.customer_name as string) ?? (c.title as string) ?? '',
    customerSegment: (c.customer_segment as string) ?? '',
    contactPerson: (c.contact_person as string) ?? '',
    estimatedValue: (c.estimated_value as number) ?? 0,
    probability: (c.probability as number) ?? 0,
    product: (c.product as string) ?? '',
    createdAt: c.created_at ? new Date((c.created_at as number) * 1000) : new Date(),
    stage: (c.stage as OpportunityStage) ?? 'lead',
  }
}

export function useSalesPilot() {
  const [bindings, setBindings] = useState<SalesBinding[]>([])
  const [steps, setSteps] = useState<SalesRuntimeStep[]>([])
  const [auditEntries, setAuditEntries] = useState<SalesAuditEntry[]>([])
  const [context, setContext] = useState<SalesContext | null>(null)
  const [stats, setStats] = useState<SalesPilotStats>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    pendingConfirmations: 0,
    avgExecutionTime: 0,
    activeBindings: 0,
    totalPipelineValue: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [allBindings, executions, audit, pilotStats, pilotContext] = await Promise.allSettled([
        getPilotBindings(),
        getPilotExecutions('sales'),
        getPilotAuditLog('sales'),
        getPilotStats('sales'),
        getPilotContext('sales'),
      ])

      if (allBindings.status === 'fulfilled') {
        setBindings(allBindings.value.filter(b => b.department === 'sales').map(convertBinding))
      }
      if (executions.status === 'fulfilled' && executions.value.length > 0) {
        const latest = executions.value[0]
        setSteps(latest.steps.map(s => ({
          id: s.id,
          phase: s.phase as SalesPhase,
          label: s.label,
          status: s.status,
          startedAt: s.started_at ? new Date(s.started_at * 1000) : undefined,
          completedAt: s.completed_at ? new Date(s.completed_at * 1000) : undefined,
          duration: s.duration_ms,
          error: s.error,
          result: s.result,
        })))
      }
      if (audit.status === 'fulfilled') {
        setAuditEntries(audit.value.map(convertAudit))
      }
      if (pilotStats.status === 'fulfilled') {
        setStats(prev => ({
          ...prev,
          totalExecutions: pilotStats.value.total_executions,
          successfulExecutions: pilotStats.value.successful_executions,
          failedExecutions: pilotStats.value.failed_executions,
          pendingConfirmations: pilotStats.value.pending_confirmations,
          avgExecutionTime: pilotStats.value.avg_execution_time_ms,
          activeBindings: pilotStats.value.active_bindings,
        }))
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

  const bindSalesTools = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await bindPilotTools('sales', SALES_TOOLS)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  const release = useCallback(async () => {
    try {
      await releasePilotBindings('sales')
      setBindings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  const currentPhase = useMemo<SalesPhase>(() => {
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
    bindTools: bindSalesTools,
    release,
  }
}
