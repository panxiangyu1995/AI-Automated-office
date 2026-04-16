/**
 * ApprovalPilotIntegration - 审批场景接入组件
 * Story 50.1 - 审批场景接入
 *
 * 验证通用 Agent 平台在审批场景中的集成
 * - 将审批上下文、工具和动态 UI 目标绑定到通用运行时
 * - 支持审批工作的读取、生成、确认、执行循环
 * - 验证场景中的审计和权限行为
 *
 * 铁律合规：
 * - ARCH: ADR-037 场景适配器合约
 * - UX-01, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck,
  Filter,
  History,
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
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { useApprovalPilot } from '../hooks/useApprovalPilot'
import type {
  ApprovalPhase,
  BindingStatus,
  ExecutionStatus,
  PermissionLevel,
  ApprovalBinding as ToolBinding,
  ApprovalRuntimeStep as RuntimeStep,
  ApprovalAuditEntry as AuditEntry,
  ApprovalPilotStats,
  ApprovalContext,
} from '../hooks/useApprovalPilot'

export type { ApprovalPhase, BindingStatus, ExecutionStatus, PermissionLevel, ApprovalContext, ToolBinding, RuntimeStep, AuditEntry, ApprovalPilotStats }

// ==================== Helper Functions ====================

function getPhaseIcon(phase: ApprovalPhase) {
  switch (phase) {
    case 'read':
      return <ListChecks className="h-4 w-4" />
    case 'generate':
      return <TrendingUp className="h-4 w-4" />
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

function getPhaseColor(phase: ApprovalPhase): string {
  switch (phase) {
    case 'read':
      return 'text-blue-500'
    case 'generate':
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

function getPermissionColor(permission: PermissionLevel): string {
  switch (permission) {
    case 'none':
      return 'text-gray-500'
    case 'read':
      return 'text-blue-500'
    case 'write':
      return 'text-orange-500'
    case 'admin':
      return 'text-red-500'
  }
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

interface ExecuteLoopProps {
  steps: RuntimeStep[]
  currentPhase: ApprovalPhase
}

function ExecuteLoop({ steps, currentPhase }: ExecuteLoopProps) {
  const phaseOrder: ApprovalPhase[] = ['read', 'generate', 'confirm', 'execute', 'complete']

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

      {/* Current Step Details */}
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

interface ToolBindingCardProps {
  binding: ToolBinding
  onConfigure: (binding: ToolBinding) => void
}

function ToolBindingCard({ binding, onConfigure }: ToolBindingCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
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
              <span
                className={cn(
                  'font-medium',
                  getPermissionColor(binding.permission)
                )}
              >
                {binding.permission}
              </span>
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

export interface ApprovalPilotIntegrationProps {
  className?: string
}

export function ApprovalPilotIntegration({
  className,
}: ApprovalPilotIntegrationProps) {
  const {
    bindings: toolBindings,
    steps: runtimeSteps,
    auditEntries,
    context: approvalContext,
    stats,
    currentPhase,
    isLoading,
    error,
    refresh,
  } = useApprovalPilot()

  const [activeTab, setActiveTab] = useState<'flow' | 'bindings' | 'audit'>('flow')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBinding, setSelectedBinding] = useState<ToolBinding | null>(null)
  const [configOpen, setConfigOpen] = useState(false)

  const filteredAudit = useMemo(() => {
    if (!searchQuery) return auditEntries
    return auditEntries.filter(
      (entry) =>
        entry.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [auditEntries, searchQuery])

  const handleConfigure = (binding: ToolBinding) => {
    setSelectedBinding(binding)
    setConfigOpen(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          <h2 className="text-lg font-medium">审批场景接入</h2>
        </div>
        <div className="flex items-center gap-2">
          {approvalContext && <Badge variant="outline">{approvalContext.id}</Badge>}
          <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      {isLoading && !approvalContext ? (
        <CardSkeleton />
      ) : approvalContext ? (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium mb-1">{approvalContext.title}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>申请人: {approvalContext.requester}</span>
              <span>部门: {approvalContext.department}</span>
              {approvalContext.amount && (
                <span>金额: ¥{approvalContext.amount.toLocaleString()}</span>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              approvalContext.status === 'pending'
                ? 'text-yellow-500'
                : approvalContext.status === 'approved'
                  ? 'text-green-500'
                  : 'text-red-500'
            }
          >
            {approvalContext.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{approvalContext.reason}</p>
        <div className="mt-2 text-xs text-muted-foreground">
          创建时间: {formatDate(approvalContext.createdAt)}
        </div>
      </div>
      ) : (
        <EmptyState
          icon={FileCheck}
          title="暂无审批上下文"
          description="当前没有活跃的审批任务"
        />
      )}

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
          <Shield className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">活跃绑定</p>
            <p className="text-lg font-medium text-blue-500">{stats.activeBindings}</p>
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
            <Badge variant="secondary" className="ml-1">{toolBindings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            审计日志
            <Badge variant="secondary" className="ml-1">{auditEntries.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-4">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium mb-4">执行循环</h3>
            <ExecuteLoop steps={runtimeSteps} currentPhase={currentPhase} />
          </div>

          {/* Runtime Steps Detail */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="text-sm font-medium">运行时步骤详情</h3>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-3 space-y-3">
                {runtimeSteps.map((step, idx) => (
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
                      {idx < runtimeSteps.length - 1 && (
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
            {toolBindings.map((binding) => (
              <ToolBindingCard
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
                <EmptyState
                  icon={History}
                  title="没有审计日志"
                  description="暂无审批场景的审计记录"
                />
              ) : (
                filteredAudit.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border rounded-lg bg-card"
                  >
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
                  <span
                    className={cn(
                      'font-medium',
                      getPermissionColor(selectedBinding.permission)
                    )}
                  >
                    {selectedBinding.permission}
                  </span>
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
