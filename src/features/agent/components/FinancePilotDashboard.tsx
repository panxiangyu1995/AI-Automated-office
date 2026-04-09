/**
 * FinancePilotDashboard
 * 使用真实 API 的财务 Pilot 仪表板
 */

import { FinancePilotIntegration } from './FinancePilotIntegration'
import { useFinancePilot } from '../hooks/useFinancePilot'

interface FinanceAuditEntry {
  id: string
  timestamp: Date
  actor: string
  action: string
  target: string
  result: 'success' | 'failure' | 'denied'
  details: string
  correlationId: string
}

export function FinancePilotDashboard() {
  const {
    bindings,
    isLoading,
    error,
  } = useFinancePilot()

  // Convert API bindings to component format
  const financeToolBindings = bindings.map((b) => ({
    toolId: b.toolId,
    toolName: b.toolName,
    status: b.status,
    permission: b.permission,
    lastUsed: b.lastUsed,
    usageCount: b.usageCount,
  }))

  // Mock runtime steps for now (would need API support for this)
  const mockRuntimeSteps = [
    {
      id: 'step-1',
      phase: 'read' as const,
      label: '读取财务数据',
      status: 'completed' as const,
      startedAt: new Date(Date.now() - 480000),
      completedAt: new Date(Date.now() - 440000),
      duration: 40000,
      result: '账户余额充足，预算校验通过',
    },
    {
      id: 'step-2',
      phase: 'analyze' as const,
      label: '分析合规性',
      status: 'completed' as const,
      startedAt: new Date(Date.now() - 440000),
      completedAt: new Date(Date.now() - 380000),
      duration: 60000,
      result: '符合财务审批流程，预算充足',
    },
    {
      id: 'step-3',
      phase: 'confirm' as const,
      label: '确认交易',
      status: 'idle' as const,
    },
    {
      id: 'step-4',
      phase: 'execute' as const,
      label: '执行交易',
      status: 'idle' as const,
    },
    {
      id: 'step-5',
      phase: 'complete' as const,
      label: '完成',
      status: 'idle' as const,
    },
  ]

  // Mock context for now
  const mockContext = {
    id: 'finance-' + Date.now(),
    transactionType: 'expense' as const,
    amount: 158000,
    currency: 'CNY',
    department: '技术部',
    description: '服务器采购费用 - 年度云服务续费',
    submittedBy: '王强',
    approvedBy: '张总',
    createdAt: new Date(Date.now() - 86400000 * 2),
    status: 'approved' as const,
  }

  // Mock audit entries
  const mockAuditEntries: FinanceAuditEntry[] = [
    {
      id: 'audit-001',
      timestamp: new Date(Date.now() - 480000),
      actor: '系统',
      action: '上下文绑定',
      target: mockContext.id,
      result: 'success',
      details: '财务上下文成功绑定到运行时',
      correlationId: 'corr-finance-001',
    },
  ]

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">加载中...</div>
        </div>
      )}
      {error && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-destructive/10 text-destructive text-sm z-10">
          {error}
        </div>
      )}
      <FinancePilotIntegration
        financeContext={mockContext}
        financeToolBindings={financeToolBindings}
        financeRuntimeSteps={mockRuntimeSteps}
        financeAuditEntries={mockAuditEntries}
      />
    </div>
  )
}
