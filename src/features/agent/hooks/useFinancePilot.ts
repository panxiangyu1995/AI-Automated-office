/**
 * useFinancePilot Hook
 * 财务 Pilot 集成 Hook
 */

import { useState, useEffect, useCallback } from 'react'
import {
  bindPilotTools,
  executePilot,
  getPilotBindings,
  releasePilotBindings,
  type ToolBinding,
  type PilotResult,
} from '@/lib/pilot'

export type FinanceBindingStatus = 'pending' | 'bound' | 'failed' | 'released'
export type FinancePermission = 'none' | 'read' | 'write' | 'admin'

export interface FinanceBinding {
  toolId: string
  toolName: string
  status: FinanceBindingStatus
  permission: FinancePermission
  lastUsed?: Date
  usageCount: number
  // API fields
  tool_id: string
  tool_name: string
  department: string
  last_used?: number
  usage_count: number
}

export interface FinanceRuntimeStep {
  id: string
  phase: 'read' | 'analyze' | 'confirm' | 'execute' | 'complete' | 'failed'
  label: string
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  startedAt?: Date
  completedAt?: Date
  duration?: number
  error?: string
  result?: string
}

export interface FinanceAuditEntry {
  id: string
  timestamp: Date
  actor: string
  action: string
  target: string
  result: 'success' | 'failure' | 'denied'
  details: string
  correlationId: string
}

interface UseFinancePilotOptions {
  autoBind?: boolean
  tools?: string[]
}

interface UseFinancePilotReturn {
  bindings: FinanceBinding[]
  isLoading: boolean
  error: string | null
  stats: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    pendingConfirmations: number
    avgExecutionTime: number
    activeBindings: number
  }
  // Actions
  bindTools: (tools: string[]) => Promise<void>
  releaseTools: () => Promise<void>
  execute: (action: string, params?: Record<string, unknown>) => Promise<PilotResult>
  refresh: () => Promise<void>
}

const defaultTools = [
  'finance_account_query',
  'finance_balance_check',
  'finance_transaction_create',
  'approval_workflow_trigger',
  'notification_send',
]

type ApiBindingStatus = 'pending' | 'bound' | 'failed' | 'released'

export function useFinancePilot(
  options: UseFinancePilotOptions = {}
): UseFinancePilotReturn {
  const { autoBind = true, tools = defaultTools } = options

  const [bindings, setBindings] = useState<FinanceBinding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    pendingConfirmations: 0,
    avgExecutionTime: 0,
    activeBindings: 0,
  })

  // Convert ToolBinding to FinanceBinding
  const convertBinding = useCallback((binding: ToolBinding): FinanceBinding => {
    const statusMap: Record<ApiBindingStatus, FinanceBindingStatus> = {
      pending: 'pending',
      bound: 'bound',
      failed: 'failed',
      released: 'released',
    }
    const permissionMap: Record<string, FinancePermission> = {
      none: 'none',
      read: 'read',
      write: 'write',
      admin: 'admin',
    }
    return {
      toolId: binding.tool_id,
      toolName: binding.tool_name,
      status: statusMap[binding.status as ApiBindingStatus] || 'pending',
      permission: permissionMap[binding.permission] || 'read',
      lastUsed: binding.last_used ? new Date(binding.last_used * 1000) : undefined,
      usageCount: binding.usage_count,
      // Keep original fields for API calls
      tool_id: binding.tool_id,
      tool_name: binding.tool_name,
      department: binding.department,
      last_used: binding.last_used,
      usage_count: binding.usage_count,
    }
  }, [])

  // Fetch bindings
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getPilotBindings()
      const financeBindings = result
        .filter((b) => b.department === 'finance')
        .map(convertBinding)
      setBindings(financeBindings)

      // Update stats
      const activeCount = financeBindings.filter((b) => b.status === 'bound').length
      setStats((prev) => ({
        ...prev,
        activeBindings: activeCount,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [convertBinding])

  // Bind tools
  const bindTools = useCallback(async (toolList: string[]) => {
    setIsLoading(true)
    setError(null)
    try {
      await bindPilotTools('finance', toolList)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  // Release tools
  const releaseTools = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await releasePilotBindings('finance')
      setBindings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Execute action
  const execute = useCallback(
    async (action: string, params?: Record<string, unknown>): Promise<PilotResult> => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await executePilot('finance', action, params)

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalExecutions: prev.totalExecutions + 1,
          successfulExecutions: result.success
            ? prev.successfulExecutions + 1
            : prev.successfulExecutions,
          failedExecutions: result.success
            ? prev.failedExecutions
            : prev.failedExecutions + 1,
          avgExecutionTime:
            prev.avgExecutionTime === 0
              ? result.duration_ms
              : (prev.avgExecutionTime + result.duration_ms) / 2,
        }))

        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Initial load and auto-bind
  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (autoBind && !isLoading && bindings.length === 0) {
      void bindTools(tools).catch(() => {
        // Ignore bind errors on mount
      })
    }
  }, [autoBind, isLoading, bindings.length, bindTools, tools])

  return {
    bindings,
    isLoading,
    error,
    stats,
    bindTools,
    releaseTools,
    execute,
    refresh,
  }
}
