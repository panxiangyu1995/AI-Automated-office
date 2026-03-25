/**
 * FinancePilotIntegration - 财务场景接入组件
 * Story 50.3 - 财务场景接入
 *
 * 验证通用 Agent 平台在财务场景中的最终集成
 * - 将财务上下文、工具和写入目标绑定到通用运行时
 * - 支持财务工作的读取、分析、确认、执行循环
 * - 验证跨场景重用相同的运行时、审计和权限链
 *
 * 铁律合规：
 * - ARCH: ADR-037 场景适配器合约
 * - UX-01, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  History,
  Landmark,
  ListChecks,
  Lock,
  Play,
  RefreshCw,
  Search,
  Settings,
  Shield,
  SkipForward,
  Square,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type FinancePhase = 'read' | 'analyze' | 'confirm' | 'execute' | 'complete' | 'failed'
export type BindingStatus = 'pending' | 'bound' | 'failed' | 'released'
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type TransactionType = 'expense' | 'revenue' | 'transfer' | 'adjustment' | 'settlement'

export interface FinanceContext {
  id: string
  transactionType: TransactionType
  amount: number
  currency: string
  department: string
  description: string
  submittedBy: string
  approvedBy?: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'processed'
}

export interface FinanceToolBinding {
  toolId: string
  toolName: string
  status: BindingStatus
  permission: 'none' | 'read' | 'write' | 'admin'
  lastUsed?: Date
  usageCount: number
}

export interface FinanceRuntimeStep {
  id: string
  phase: FinancePhase
  label: string
  status: ExecutionStatus
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

export interface FinancePilotStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  pendingConfirmations: number
  avgExecutionTime: number
  activeBindings: number
  totalProcessedAmount: number
}

// ==================== Mock Data ====================

const mockFinanceContext: FinanceContext = {
  id: 'finance-001',
  transactionType: 'expense',
  amount: 158000,
  currency: 'CNY',
  department: '技术部',
  description: '服务器采购费用 - 年度云服务续费',
  submittedBy: '王强',
  approvedBy: '张总',
  createdAt: new Date(Date.now() - 86400000 * 2),
  status: 'approved',
}

const mockFinanceToolBindings: FinanceToolBinding[] = [
  {
    toolId: 'finance_account_query',
    toolName: '账户查询',
    status: 'bound',
    permission: 'read',
    lastUsed: new Date(Date.now() - 3600000),
    usageCount: 28,
  },
  {
    toolId: 'finance_balance_check',
    toolName: '余额检查',
    status: 'bound',
    permission: 'read',
    lastUsed: new Date(Date.now() - 1800000),
    usageCount: 35,
  },
  {
    toolId: 'finance_transaction_create',
    toolName: '交易创建',
    status: 'bound',
    permission: 'write',
    usageCount: 0,
  },
  {
    toolId: 'approval_workflow_trigger',
    toolName: '审批工作流',
    status: 'bound',
    permission: 'write',
    lastUsed: new Date(Date.now() - 7200000),
    usageCount: 18,
  },
  {
    toolId: 'notification_send',
    toolName: '通知发送',
    status: 'bound',
    permission: 'write',
    lastUsed: new Date(Date.now() - 900000),
    usageCount: 42,
  },
]

const mockFinanceRuntimeSteps: FinanceRuntimeStep[] = [
  {
    id: 'step-1',
    phase: 'read',
    label: '读取财务数据',
    status: 'completed',
    startedAt: new Date(Date.now() - 480000),
    completedAt: new Date(Date.now() - 440000),
    duration: 40000,
    result: '账户余额充足，预算校验通过',
  },
  {
    id: 'step-2',
    phase: 'analyze',
    label: '分析合规性',
    status: 'completed',
    startedAt: new Date(Date.now() - 440000),
    completedAt: new Date(Date.now() - 380000),
    duration: 60000,
    result: '符合财务审批流程，预算充足',
  },
  {
    id: 'step-3',
    phase: 'confirm',
    label: '确认交易',
    status: 'completed',
    startedAt: new Date(Date.now() - 380000),
    completedAt: new Date(Date.now() - 360000),
    duration: 20000,
    result: '审批已通过，等待执行',
  },
  {
    id: 'step-4',
    phase: 'execute',
    label: '执行交易',
    status: 'running',
    startedAt: new Date(Date.now() - 60000),
  },
  {
    id: 'step-5',
    phase: 'complete',
    label: '完成',
    status: 'idle',
  },
]

const mockFinanceAuditEntries: FinanceAuditEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 480000),
    actor: '系统',
    action: '上下文绑定',
    target: 'finance-001',
    result: 'success',
    details: '财务上下文成功绑定到运行时',
    correlationId: 'corr-finance-001',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 460000),
    actor: 'Agent',
    action: '账户查询',
    target: 'finance_account_query',
    result: 'success',
    details: '查询账户余额：可用余额 ¥2,850,000',
    correlationId: 'corr-finance-002',
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 440000),
    actor: 'Agent',
    action: '预算检查',
    target: 'finance_balance_check',
    result: 'success',
    details: '预算检查：技术部预算剩余 ¥580,000，申请金额 ¥158,000，校验通过',
    correlationId: 'corr-finance-003',
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 380000),
    actor: '张总',
    action: '审批确认',
    target: 'finance-001',
    result: 'success',
    details: '审批通过，批准金额 ¥158,000',
    correlationId: 'corr-finance-004',
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 60000),
    actor: '系统',
    action: '执行交易',
    target: 'finance_transaction_create',
    result: 'success',
    details: '交易执行中，目标账户：云服务提供商',
    correlationId: 'corr-finance-005',
  },
]

// ==================== Helper Functions ====================

function getPhaseIcon(phase: FinancePhase) {
  switch (phase) {
    case 'read':
      return <ListChecks className="h-4 w-4" />
    case 'analyze':
      return <Calculator className="h-4 w-4" />
    case 'confirm':
      return <UserCheck className="h-4 w-4" />
    case 'execute':
      return <Play className="h-4 w-4" />
    case 'complete':
      return <CheckCircle2 className="h-4 w-4" />
    case 'failed':
      return <XCircle className="h-4 w-4" />
  }
}

function getPhaseColor(phase: FinancePhase): string {
  switch (phase) {
    case 'read':
      return 'text-blue-500'
    case 'analyze':
      return 'text-purple-500'
    case 'confirm':
      return 'text-yellow-500'
    case 'execute':
      return 'text-orange-500'
    case 'complete':
      return 'text-green-500'
    case 'failed':
      return 'text-red-500'
  }
}

function getStatusIcon(status: ExecutionStatus) {
  switch (status) {
    case 'idle':
      return <Clock className="h-4 w-4 text-muted-foreground" />
    case 'running':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    case 'paused':
      return <SkipForward className="h-4 w-4 text-yellow-500" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'cancelled':
      return <Square className="h-4 w-4 text-gray-500" />
  }
}

function getBindingStatusColor(status: BindingStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-500/10 border-gray-500/20 text-gray-500'
    case 'bound':
      return 'bg-green-500/10 border-green-500/20 text-green-500'
    case 'failed':
      return 'bg-red-500/10 border-red-500/20 text-red-500'
    case 'released':
      return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
  }
}

function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case 'expense':
      return '支出'
    case 'revenue':
      return '收入'
    case 'transfer':
      return '转账'
    case 'adjustment':
      return '调整'
    case 'settlement':
      return '结算'
  }
}

function getStatusColor(status: FinanceContext['status']): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-500'
    case 'approved':
      return 'text-green-500'
    case 'rejected':
      return 'text-red-500'
    case 'processed':
      return 'text-blue-500'
  }
}

function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('zh-CN')
  const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency
  return `${symbol}${formatted}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ==================== Components ====================

interface FinanceExecuteLoopProps {
  steps: FinanceRuntimeStep[]
  currentPhase: FinancePhase
}

function FinanceExecuteLoop({ steps, currentPhase }: FinanceExecuteLoopProps) {
  const phaseOrder: FinancePhase[] = ['read', 'analyze', 'confirm', 'execute', 'complete']

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {phaseOrder.map((phase, idx) => {
          const step = steps.find((s) => s.phase === phase)
          const isCurrent = phase === currentPhase

          return (
            <div key={phase} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border',
                  isCurrent && 'bg-blue-500/10 border-blue-500/20',
                  step?.status === 'completed' && 'bg-green-500/10 border-green-500/20',
                  step?.status === 'failed' && 'bg-red-500/10 border-red-500/20'
                )}
              >
                <span className={cn(getPhaseColor(phase))}>{getPhaseIcon(phase)}</span>
                <span className="text-sm font-medium">{step?.label || phase}</span>
                {getStatusIcon(step?.status || 'idle')}
              </div>
              {idx < phaseOrder.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          )
        })}
      </div>

      {steps.find((s) => s.phase === currentPhase)?.status === 'running' && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm font-medium">执行中...</span>
          </div>
          {steps.find((s) => s.phase === currentPhase)?.result && (
            <p className="text-sm text-muted-foreground">
              {steps.find((s) => s.phase === currentPhase)?.result}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface FinanceToolBindingCardProps {
  binding: FinanceToolBinding
  onConfigure: (binding: FinanceToolBinding) => void
}

function FinanceToolBindingCard({ binding, onConfigure }: FinanceToolBindingCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Landmark className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{binding.toolName}</span>
              <Badge
                variant="outline"
                className={cn('text-xs', getBindingStatusColor(binding.status))}
              >
                {binding.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mb-1">
              {binding.toolId}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">{binding.permission}</span>
              {binding.usageCount > 0 && <span>使用 {binding.usageCount} 次</span>}
              {binding.lastUsed && <span>上次: {formatDate(binding.lastUsed)}</span>}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onConfigure(binding)}>
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export interface FinancePilotIntegrationProps {
  className?: string
  financeContext?: FinanceContext
  financeToolBindings?: FinanceToolBinding[]
  financeRuntimeSteps?: FinanceRuntimeStep[]
  financeAuditEntries?: FinanceAuditEntry[]
}

export function FinancePilotIntegration({
  className,
  financeContext: initialContext,
  financeToolBindings: initialBindings,
  financeRuntimeSteps: initialSteps,
  financeAuditEntries: initialAudit,
}: FinancePilotIntegrationProps) {
  const financeContext = initialContext || mockFinanceContext
  const financeToolBindings = initialBindings || mockFinanceToolBindings
  const financeRuntimeSteps = initialSteps || mockFinanceRuntimeSteps
  const financeAuditEntries = initialAudit || mockFinanceAuditEntries

  const [activeTab, setActiveTab] = useState<'flow' | 'bindings' | 'audit'>('flow')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBinding, setSelectedBinding] = useState<FinanceToolBinding | null>(null)
  const [configOpen, setConfigOpen] = useState(false)

  const currentPhase = useMemo(() => {
    const running = financeRuntimeSteps.find((s) => s.status === 'running')
    if (running) return running.phase
    const pending = financeRuntimeSteps.find((s) => s.status === 'idle')
    if (pending) {
      const idx = financeRuntimeSteps.indexOf(pending)
      if (idx > 0) return financeRuntimeSteps[idx - 1].phase
    }
    return 'complete'
  }, [financeRuntimeSteps])

  const stats = useMemo((): FinancePilotStats => {
    const totalExecutions = financeRuntimeSteps.length
    const successfulExecutions = financeRuntimeSteps.filter(
      (s) => s.status === 'completed'
    ).length
    const failedExecutions = financeRuntimeSteps.filter((s) => s.status === 'failed').length
    const pendingConfirmations = financeRuntimeSteps.filter(
      (s) => s.phase === 'confirm' && s.status === 'running'
    ).length
    const completedSteps = financeRuntimeSteps.filter((s) => s.completedAt && s.startedAt)
    const avgExecutionTime =
      completedSteps.length > 0
        ? completedSteps.reduce((sum, s) => sum + (s.duration || 0), 0) /
          completedSteps.length
        : 0
    const activeBindings = financeToolBindings.filter((b) => b.status === 'bound').length
    const totalProcessedAmount = mockFinanceContext.amount

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      pendingConfirmations,
      avgExecutionTime,
      activeBindings,
      totalProcessedAmount,
    }
  }, [financeRuntimeSteps, financeToolBindings])

  const filteredAudit = useMemo(() => {
    if (!searchQuery) return financeAuditEntries
    return financeAuditEntries.filter(
      (entry) =>
        entry.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [financeAuditEntries, searchQuery])

  const handleConfigure = (binding: FinanceToolBinding) => {
    setSelectedBinding(binding)
    setConfigOpen(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <h2 className="text-lg font-medium">财务场景接入</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{financeContext.id}</Badge>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* Finance Context Card */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium mb-1">{financeContext.description}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>类型: {getTransactionTypeLabel(financeContext.transactionType)}</span>
              <span>部门: {financeContext.department}</span>
              <span>提交人: {financeContext.submittedBy}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(getStatusColor(financeContext.status))}
          >
            {financeContext.status}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">金额</p>
              <p className="text-lg font-medium text-green-500">
                {formatCurrency(financeContext.amount, financeContext.currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">币种</p>
              <p className="text-lg font-medium">{financeContext.currency}</p>
            </div>
          </div>
          {financeContext.approvedBy && (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">审批人</p>
                <p className="text-lg font-medium">{financeContext.approvedBy}</p>
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          创建时间: {formatDate(financeContext.createdAt)}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">成功执行</p>
            <p className="text-lg font-medium text-green-500">
              {stats.successfulExecutions}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">失败执行</p>
            <p className="text-lg font-medium text-red-500">{stats.failedExecutions}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <UserCheck className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">待确认</p>
            <p className="text-lg font-medium text-yellow-500">
              {stats.pendingConfirmations}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">处理金额</p>
            <p className="text-lg font-medium text-blue-500">
              {formatCurrency(stats.totalProcessedAmount, financeContext.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            执行流程
          </TabsTrigger>
          <TabsTrigger value="bindings" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            工具绑定
            <Badge variant="secondary" className="ml-1">{financeToolBindings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            审计日志
            <Badge variant="secondary" className="ml-1">{financeAuditEntries.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-4">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium mb-4">执行循环</h3>
            <FinanceExecuteLoop steps={financeRuntimeSteps} currentPhase={currentPhase} />
          </div>

          {/* Runtime Steps Detail */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="text-sm font-medium">运行时步骤详情</h3>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-3 space-y-3">
                {financeRuntimeSteps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center border',
                          step.status === 'completed' &&
                            'bg-green-500/10 border-green-500/20 text-green-500',
                          step.status === 'running' &&
                            'bg-blue-500/10 border-blue-500/20 text-blue-500',
                          step.status === 'failed' &&
                            'bg-red-500/10 border-red-500/20 text-red-500',
                          step.status === 'idle' &&
                            'bg-muted border-muted-foreground/20 text-muted-foreground'
                        )}
                      >
                        {getPhaseIcon(step.phase)}
                      </div>
                      {idx < financeRuntimeSteps.length - 1 && (
                        <div className="w-0.5 h-6 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{step.label}</span>
                        {getStatusIcon(step.status)}
                      </div>
                      {step.result && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {step.result}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {step.startedAt && <span>开始: {formatDate(step.startedAt)}</span>}
                        {step.completedAt && (
                          <span>完成: {formatDate(step.completedAt)}</span>
                        )}
                        {step.duration && <span>耗时: {formatDuration(step.duration)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <SkipForward className="h-3 w-3 mr-1" />
              跳过
            </Button>
            <Button variant="outline" size="sm">
              <Square className="h-3 w-3 mr-1" />
              取消
            </Button>
            <Button variant="default" size="sm">
              <Play className="h-3 w-3 mr-1" />
              继续执行
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bindings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索工具..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  状态
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>全部</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>已绑定</DropdownMenuItem>
                <DropdownMenuItem>待绑定</DropdownMenuItem>
                <DropdownMenuItem>失败</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            {financeToolBindings.map((binding) => (
              <FinanceToolBindingCard
                key={binding.toolId}
                binding={binding}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索审计日志..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredAudit.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3" />
                  <p>没有审计日志</p>
                </div>
              ) : (
                filteredAudit.map((entry) => (
                  <div key={entry.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-2',
                            entry.result === 'success'
                              ? 'bg-green-500'
                              : entry.result === 'failure'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          )}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{entry.actor}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{entry.action}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            目标: {entry.target}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.details}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatDate(entry.timestamp)}</p>
                        <p className="font-mono">{entry.correlationId}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Tool Configuration Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              工具配置
            </DialogTitle>
          </DialogHeader>
          {selectedBinding && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">{selectedBinding.toolName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedBinding.toolId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">状态</p>
                  <Badge
                    variant="outline"
                    className={cn(getBindingStatusColor(selectedBinding.status))}
                  >
                    {selectedBinding.status}
                  </Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">权限</p>
                  <span className="font-medium">{selectedBinding.permission}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Lock className="h-3 w-3 mr-1" />
                  锁定
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重新绑定
                </Button>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-3 w-3 mr-1" />
                  释放
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
