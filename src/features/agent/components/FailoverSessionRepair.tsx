/**
 * FailoverSessionRepair - Failover与会话修复组件
 * Story 36.2 - Failover与会话修复
 *
 * 实现 Provider 故障转移、会话修复和审计记录
 * - 在受控故障条件下切换 Provider 和认证配置
 * - 修复会话和上下文损坏并提供差异摘要
 * - 记录故障转移和修复操作以供审计和诊断
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Diff,
  Filter,
  GitBranch,
  History,
  Info,
  Lightbulb,
  ListChecks,
  MoreVertical,
  Pause,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Shield,
  SkipForward,
  Timer,
  TrendingUp,
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

export type ProviderStatus = 'active' | 'standby' | 'degraded' | 'failed'
export type ProviderType = 'openai' | 'zhipu' | 'dashscope' | 'deepseek' | 'custom'
export type FailoverAction = 'switch' | 'repair' | 'rollback' | 'isolate' | 'escalate'
export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back'
export type SessionHealth = 'healthy' | 'degraded' | 'corrupted' | 'unknown'

export interface Provider {
  id: string
  name: string
  type: ProviderType
  status: ProviderStatus
  health: number
  latency: number
  isDefault: boolean
  lastFailover?: Date
  failoverCount: number
}

export interface FailoverRecord {
  id: string
  providerId: string
  providerName: string
  fromProvider?: string
  toProvider?: string
  action: FailoverAction
  reason: string
  trigger: string
  status: 'success' | 'failed' | 'rolled_back'
  timestamp: Date
  duration: number
  correlationId: string
}

export interface SessionRepair {
  id: string
  sessionId: string
  status: RepairStatus
  corruptionType: string
  corruptionScope: string
  diffSummary: {
    added: number
    removed: number
    modified: number
  }
  repairActions: string[]
  createdAt: Date
  completedAt?: Date
  rollbackAvailable: boolean
}

export interface FailoverSessionRepairStats {
  totalFailovers: number
  successfulFailovers: number
  failedFailovers: number
  activeProviders: number
  degradedProviders: number
  pendingRepairs: number
  completedRepairs: number
  avgFailoverTime: number
  avgRepairTime: number
}

// ==================== Mock Data ====================

const mockProviders: Provider[] = [
  {
    id: 'prov-001',
    name: 'OpenAI GPT-4',
    type: 'openai',
    status: 'active',
    health: 98,
    latency: 120,
    isDefault: true,
    failoverCount: 0,
  },
  {
    id: 'prov-002',
    name: '智谱 GLM-4',
    type: 'zhipu',
    status: 'standby',
    health: 95,
    latency: 85,
    isDefault: false,
    failoverCount: 1,
    lastFailover: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'prov-003',
    name: '阿里百炼',
    type: 'dashscope',
    status: 'degraded',
    health: 62,
    latency: 320,
    isDefault: false,
    failoverCount: 2,
    lastFailover: new Date(Date.now() - 86400000),
  },
  {
    id: 'prov-004',
    name: 'DeepSeek V2',
    type: 'deepseek',
    status: 'failed',
    health: 0,
    latency: 0,
    isDefault: false,
    failoverCount: 5,
    lastFailover: new Date(Date.now() - 3600000),
  },
]

const mockFailoverRecords: FailoverRecord[] = [
  {
    id: 'fo-001',
    providerId: 'prov-004',
    providerName: 'DeepSeek V2',
    fromProvider: 'DeepSeek V2',
    toProvider: 'OpenAI GPT-4',
    action: 'switch',
    reason: '连续超时达到阈值',
    trigger: 'circuit_breaker',
    status: 'success',
    timestamp: new Date(Date.now() - 3600000),
    duration: 1250,
    correlationId: 'corr-abc-123',
  },
  {
    id: 'fo-002',
    providerId: 'prov-003',
    providerName: '阿里百炼',
    action: 'isolate',
    reason: '延迟过高超过 SLA',
    trigger: 'latency_threshold',
    status: 'success',
    timestamp: new Date(Date.now() - 86400000),
    duration: 800,
    correlationId: 'corr-def-456',
  },
  {
    id: 'fo-003',
    providerId: 'prov-002',
    providerName: '智谱 GLM-4',
    fromProvider: '智谱 GLM-4',
    toProvider: 'OpenAI GPT-4',
    action: 'switch',
    reason: '认证失败',
    trigger: 'auth_failure',
    status: 'success',
    timestamp: new Date(Date.now() - 86400000 * 2),
    duration: 950,
    correlationId: 'corr-ghi-789',
  },
]

const mockSessionRepairs: SessionRepair[] = [
  {
    id: 'rep-001',
    sessionId: 'sess-abc-123',
    status: 'completed',
    corruptionType: 'context_overflow',
    corruptionScope: 'recent_history',
    diffSummary: { added: 45, removed: 32, modified: 8 },
    repairActions: ['压缩上下文', '清理历史', '重建索引'],
    createdAt: new Date(Date.now() - 7200000),
    completedAt: new Date(Date.now() - 7100000),
    rollbackAvailable: true,
  },
  {
    id: 'rep-002',
    sessionId: 'sess-def-456',
    status: 'in_progress',
    corruptionType: 'state_mismatch',
    corruptionScope: 'session_state',
    diffSummary: { added: 12, removed: 5, modified: 15 },
    repairActions: ['同步状态', '重建checkpoint'],
    createdAt: new Date(Date.now() - 1800000),
    rollbackAvailable: false,
  },
  {
    id: 'rep-003',
    sessionId: 'sess-ghi-789',
    status: 'pending',
    corruptionType: 'memory_corruption',
    corruptionScope: 'vector_store',
    diffSummary: { added: 0, removed: 0, modified: 0 },
    repairActions: ['重建向量索引', '验证完整性'],
    createdAt: new Date(Date.now() - 900000),
    rollbackAvailable: true,
  },
]

// ==================== Helper Functions ====================

function getProviderStatusIcon(status: ProviderStatus) {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'standby':
      return <Pause className="h-4 w-4 text-yellow-500" />
    case 'degraded':
      return <TrendingUp className="h-4 w-4 text-orange-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

function getProviderStatusColor(status: ProviderStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 border-green-500/20 text-green-500'
    case 'standby':
      return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
    case 'degraded':
      return 'bg-orange-500/10 border-orange-500/20 text-orange-500'
    case 'failed':
      return 'bg-red-500/10 border-red-500/20 text-red-500'
  }
}

function getProviderTypeLabel(type: ProviderType): string {
  switch (type) {
    case 'openai':
      return 'OpenAI'
    case 'zhipu':
      return '智谱'
    case 'dashscope':
      return '百炼'
    case 'deepseek':
      return 'DeepSeek'
    case 'custom':
      return '自定义'
  }
}

function getActionIcon(action: FailoverAction) {
  switch (action) {
    case 'switch':
      return <ArrowRight className="h-3 w-3" />
    case 'repair':
      return <RefreshCw className="h-3 w-3" />
    case 'rollback':
      return <RotateCcw className="h-3 w-3" />
    case 'isolate':
      return <Shield className="h-3 w-3" />
    case 'escalate':
      return <TrendingUp className="h-3 w-3" />
  }
}

function getActionLabel(action: FailoverAction): string {
  switch (action) {
    case 'switch':
      return '切换'
    case 'repair':
      return '修复'
    case 'rollback':
      return '回滚'
    case 'isolate':
      return '隔离'
    case 'escalate':
      return '升级'
  }
}

function getRepairStatusIcon(status: RepairStatus) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-500" />
    case 'in_progress':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'rolled_back':
      return <SkipForward className="h-4 w-4 text-purple-500" />
  }
}

function getRepairStatusColor(status: RepairStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-500/10 border-gray-500/20 text-gray-500'
    case 'in_progress':
      return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    case 'completed':
      return 'bg-green-500/10 border-green-500/20 text-green-500'
    case 'failed':
      return 'bg-red-500/10 border-red-500/20 text-red-500'
    case 'rolled_back':
      return 'bg-purple-500/10 border-purple-500/20 text-purple-500'
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
  })
}

// ==================== Components ====================

interface ProviderCardProps {
  provider: Provider
  onFailover: (provider: Provider) => void
  onViewDetails: (provider: Provider) => void
}

function ProviderCard({ provider, onFailover, onViewDetails }: ProviderCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getProviderStatusIcon(provider.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium">{provider.name}</span>
              <Badge variant="outline" className="text-xs">
                {getProviderTypeLabel(provider.type)}
              </Badge>
              {provider.isDefault && (
                <Badge variant="default" className="text-xs">
                  默认
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getProviderStatusColor(provider.status)
                )}
              >
                {provider.status}
              </span>
              <span>健康度: {provider.health}%</span>
              {provider.latency > 0 && <span>延迟: {provider.latency}ms</span>}
            </div>
            {provider.failoverCount > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                故障转移次数: {provider.failoverCount}
                {provider.lastFailover && (
                  <span>，上次: {formatDate(provider.lastFailover)}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(provider)}>
              <Info className="h-3 w-3 mr-2" />
              查看详情
            </DropdownMenuItem>
            {provider.status !== 'active' && (
              <DropdownMenuItem onClick={() => onFailover(provider)}>
                <ArrowRight className="h-3 w-3 mr-2" />
                故障转移
              </DropdownMenuItem>
            )}
            {provider.status === 'degraded' && (
              <DropdownMenuItem>
                <Pause className="h-3 w-3 mr-2" />
                标记为待机
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-3 w-3 mr-2" />
              配置
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface FailoverRecordRowProps {
  record: FailoverRecord
  onViewDetails: (record: FailoverRecord) => void
}

function FailoverRecordRow({ record, onViewDetails }: FailoverRecordRowProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
      onClick={() => onViewDetails(record)}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          record.status === 'success'
            ? 'bg-green-500'
            : record.status === 'failed'
              ? 'bg-red-500'
              : 'bg-purple-500'
        )}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{record.providerName}</span>
          <Badge variant="outline" className="text-xs">
            {getActionIcon(record.action)}
            <span className="ml-1">{getActionLabel(record.action)}</span>
          </Badge>
          {record.fromProvider && (
            <>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{record.toProvider}</span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{record.reason}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{formatDate(record.timestamp)}</p>
        <p className="text-xs text-muted-foreground">{formatDuration(record.duration)}</p>
      </div>
    </div>
  )
}

interface SessionRepairCardProps {
  repair: SessionRepair
  onViewDetails: (repair: SessionRepair) => void
  onRollback: (repair: SessionRepair) => void
}

function SessionRepairCard({ repair, onViewDetails, onRollback }: SessionRepairCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getRepairStatusIcon(repair.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm">会话: {repair.sessionId}</span>
              <Badge
                variant="outline"
                className={cn('text-xs', getRepairStatusColor(repair.status))}
              >
                {repair.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              损坏类型: {repair.corruptionType}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Diff className="h-3 w-3" />
                +{repair.diffSummary.added}/-{repair.diffSummary.removed}/~{repair.diffSummary.modified}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(repair.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {repair.rollbackAvailable && repair.status === 'completed' && (
            <Button variant="ghost" size="sm" onClick={() => onRollback(repair)}>
              <RotateCcw className="h-3 w-3 mr-1" />
              回滚
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(repair)}>
            <Info className="h-3 w-3 mr-1" />
            详情
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export interface FailoverSessionRepairProps {
  className?: string
  providers?: Provider[]
  failoverRecords?: FailoverRecord[]
  sessionRepairs?: SessionRepair[]
}

export function FailoverSessionRepair({
  className,
  providers: initialProviders,
  failoverRecords: initialRecords,
  sessionRepairs: initialRepairs,
}: FailoverSessionRepairProps) {
  const providers = initialProviders ?? mockProviders
  const failoverRecords = initialRecords ?? mockFailoverRecords
  const sessionRepairs = initialRepairs ?? mockSessionRepairs

  const [activeTab, setActiveTab] = useState<'providers' | 'failovers' | 'repairs'>('providers')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProviderStatus | 'all'>('all')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [selectedFailover, setSelectedFailover] = useState<FailoverRecord | null>(null)
  const [selectedRepair, setSelectedRepair] = useState<SessionRepair | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsType, setDetailsType] = useState<'provider' | 'failover' | 'repair'>('provider')

  const stats = useMemo((): FailoverSessionRepairStats => {
    const totalFailovers = failoverRecords.length
    const successfulFailovers = failoverRecords.filter((r) => r.status === 'success').length
    const failedFailovers = failoverRecords.filter((r) => r.status === 'failed').length
    const activeProviders = providers.filter((p) => p.status === 'active').length
    const degradedProviders = providers.filter(
      (p) => p.status === 'degraded' || p.status === 'failed'
    ).length
    const pendingRepairs = sessionRepairs.filter((r) => r.status === 'pending').length
    const completedRepairs = sessionRepairs.filter((r) => r.status === 'completed').length
    const avgFailoverTime =
      totalFailovers > 0
        ? failoverRecords.reduce((sum, r) => sum + r.duration, 0) / totalFailovers
        : 0
    const completed = sessionRepairs.filter((r) => r.completedAt)
    const avgRepairTime =
      completed.length > 0
        ? completed.reduce((sum, r) => {
            if (r.completedAt) {
              return sum + (r.completedAt.getTime() - r.createdAt.getTime())
            }
            return sum
          }, 0) / completed.length
        : 0

    return {
      totalFailovers,
      successfulFailovers,
      failedFailovers,
      activeProviders,
      degradedProviders,
      pendingRepairs,
      completedRepairs,
      avgFailoverTime,
      avgRepairTime,
    }
  }, [providers, failoverRecords, sessionRepairs])

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [providers, searchQuery, statusFilter])

  const handleViewDetails = (type: 'provider' | 'failover' | 'repair') => {
    setDetailsType(type)
    setDetailsOpen(true)
  }

  const handleFailover = (provider: Provider) => {
    console.log('Initiating failover for:', provider.name)
  }

  const handleRollback = (repair: SessionRepair) => {
    console.log('Rolling back repair:', repair.id)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-lg font-medium">故障转移与会话修复</h2>
        </div>
        <Button size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          刷新状态
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">活跃 Provider</p>
            <p className="text-lg font-medium text-green-500">{stats.activeProviders}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">降级/故障</p>
            <p className="text-lg font-medium text-orange-500">{stats.degradedProviders}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <GitBranch className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">故障转移</p>
            <p className="text-lg font-medium text-blue-500">{stats.successfulFailovers}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <RefreshCw className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-xs text-muted-foreground">待处理修复</p>
            <p className="text-lg font-medium text-purple-500">{stats.pendingRepairs}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Provider 状态
            <Badge variant="secondary" className="ml-1">{providers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="failovers" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            故障转移记录
            <Badge variant="secondary" className="ml-1">{failoverRecords.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            会话修复
            <Badge variant="secondary" className="ml-1">{sessionRepairs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索 Provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  状态: {statusFilter === 'all' ? '全部' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  全部状态
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                  活跃
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('standby')}>
                  <Pause className="h-3 w-3 mr-2 text-yellow-500" />
                  待机
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('degraded')}>
                  <TrendingUp className="h-3 w-3 mr-2 text-orange-500" />
                  降级
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                  <XCircle className="h-3 w-3 mr-2 text-red-500" />
                  故障
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onFailover={handleFailover}
                onViewDetails={(p) => {
                  setSelectedProvider(p)
                  handleViewDetails('provider')
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failovers">
          <ScrollArea className="h-[400px]">
            <div className="border rounded-lg">
              {failoverRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>没有故障转移记录</p>
                </div>
              ) : (
                failoverRecords.map((record) => (
                  <FailoverRecordRow
                    key={record.id}
                    record={record}
                    onViewDetails={(r) => {
                      setSelectedFailover(r)
                      handleViewDetails('failover')
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="repairs" className="space-y-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {sessionRepairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>没有待修复的会话</p>
                </div>
              ) : (
                sessionRepairs.map((repair) => (
                  <SessionRepairCard
                    key={repair.id}
                    repair={repair}
                    onViewDetails={(r) => {
                      setSelectedRepair(r)
                      handleViewDetails('repair')
                    }}
                    onRollback={handleRollback}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailsType === 'provider' && (
                <>
                  <ListChecks className="h-5 w-5" />
                  Provider 详情
                </>
              )}
              {detailsType === 'failover' && (
                <>
                  <GitBranch className="h-5 w-5" />
                  故障转移详情
                </>
              )}
              {detailsType === 'repair' && (
                <>
                  <RefreshCw className="h-5 w-5" />
                  会话修复详情
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailsType === 'provider' && selectedProvider && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-medium">{selectedProvider.name}</span>
                <Badge variant="outline">{getProviderTypeLabel(selectedProvider.type)}</Badge>
                <Badge
                  variant="outline"
                  className={cn(getProviderStatusColor(selectedProvider.status))}
                >
                  {selectedProvider.status}
                </Badge>
                {selectedProvider.isDefault && <Badge variant="default">默认</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">健康度</p>
                  <p className="text-2xl font-medium">{selectedProvider.health}%</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">延迟</p>
                  <p className="text-2xl font-medium">
                    {selectedProvider.latency > 0 ? `${selectedProvider.latency}ms` : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  故障转移次数: {selectedProvider.failoverCount}
                  {selectedProvider.lastFailover && (
                    <span>（上次: {formatDate(selectedProvider.lastFailover)}）</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                {selectedProvider.status !== 'active' && (
                  <Button variant="default" size="sm">
                    <ArrowRight className="h-3 w-3 mr-1" />
                    发起故障转移
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Settings className="h-3 w-3 mr-1" />
                  配置
                </Button>
              </div>
            </div>
          )}

          {detailsType === 'failover' && selectedFailover && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-medium">{selectedFailover.providerName}</span>
                <Badge variant="outline">
                  {getActionIcon(selectedFailover.action)}
                  <span className="ml-1">{getActionLabel(selectedFailover.action)}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    selectedFailover.status === 'success'
                      ? 'text-green-500'
                      : selectedFailover.status === 'failed'
                        ? 'text-red-500'
                        : 'text-purple-500'
                  }
                >
                  {selectedFailover.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">原因</p>
                  <p className="text-sm">{selectedFailover.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">触发器</p>
                  <p className="text-sm font-mono">{selectedFailover.trigger}</p>
                </div>
                {selectedFailover.fromProvider && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">切换路径:</p>
                    <span className="text-sm">{selectedFailover.fromProvider}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{selectedFailover.toProvider}</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">耗时</p>
                    <p className="text-sm">{formatDuration(selectedFailover.duration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">时间</p>
                    <p className="text-sm">{formatDate(selectedFailover.timestamp)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">关联 ID</p>
                  <p className="text-sm font-mono">{selectedFailover.correlationId}</p>
                </div>
              </div>
            </div>
          )}

          {detailsType === 'repair' && selectedRepair && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm">会话: {selectedRepair.sessionId}</span>
                <Badge
                  variant="outline"
                  className={cn(getRepairStatusColor(selectedRepair.status))}
                >
                  {selectedRepair.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">损坏类型</p>
                  <p className="text-sm">{selectedRepair.corruptionType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">损坏范围</p>
                  <p className="text-sm">{selectedRepair.corruptionScope}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">差异摘要</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-green-500">
                    +{selectedRepair.diffSummary.added} 新增
                  </Badge>
                  <Badge variant="outline" className="text-red-500">
                    -{selectedRepair.diffSummary.removed} 删除
                  </Badge>
                  <Badge variant="outline" className="text-orange-500">
                    ~{selectedRepair.diffSummary.modified} 修改
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">修复操作</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedRepair.repairActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>创建: {formatDate(selectedRepair.createdAt)}</span>
                {selectedRepair.completedAt && (
                  <span>完成: {formatDate(selectedRepair.completedAt)}</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                {selectedRepair.rollbackAvailable && selectedRepair.status === 'completed' && (
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    回滚修复
                  </Button>
                )}
                <Button variant="default" size="sm">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  应用建议
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
