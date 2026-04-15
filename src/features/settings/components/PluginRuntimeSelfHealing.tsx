/**
 * PluginRuntimeSelfHealing - 插件运行质量与自愈组件
 * Story 37.2 - 插件运行质量与自愈
 *
 * 实现插件健康监控、隔离和自愈控制，确保Agent稳定运行
 * - 监控插件健康和故障率
 * - 隔离不稳定的插件并在重复失败时自动禁用
 * - 生成诊断输出用于恢复
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-02: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  Zap,
  ZapOff,
  RefreshCw,
  Clock,
  FileText,
  Settings,
  Eye,
  Filter,
  Search,
  RefreshCcw,
  Power,
  PowerOff,
  Cpu,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type PluginHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'isolated' | 'disabled'
export type FaultSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IsolationReason = 'repeated_failure' | 'fault_threshold' | 'manual' | 'circuit_breaker'
export type RecoveryAction = 'retry' | 'restart' | 'downgrade' | 'isolate' | 'failover' | 'disable'
export type DiagnosticLevel = 'info' | 'warning' | 'error' | 'critical'

export interface PluginHealthSignal {
  id: string
  pluginId: string
  pluginName: string
  status: PluginHealthStatus
  faultRate: number
  faultCount: number
  lastFaultTime: Date | null
  lastCheckTime: Date
  consecutiveFailures: number
  isolationReason: IsolationReason | null
  autoDisableEnabled: boolean
  isAutoDisabled: boolean
  recoveryCount: number
  uptime: number
  memoryUsage: number
  cpuUsage: number
}

export interface FaultRecord {
  id: string
  pluginId: string
  pluginName: string
  severity: FaultSeverity
  errorCode: string
  errorMessage: string
  timestamp: Date
  recoverable: boolean
}

export interface DiagnosticEntry {
  id: string
  pluginId: string
  pluginName: string
  level: DiagnosticLevel
  code: string
  message: string
  timestamp: Date
  actionable: boolean
  actionTaken: RecoveryAction | null
}

export interface RecoveryEvent {
  id: string
  pluginId: string
  pluginName: string
  action: RecoveryAction
  triggeredBy: 'auto' | 'manual'
  status: 'pending' | 'executing' | 'success' | 'failed'
  timestamp: Date
  errorMessage?: string
  diagnosticRef?: string
}

export interface PluginRuntimeSelfHealingStats {
  totalPlugins: number
  healthyPlugins: number
  degradedPlugins: number
  unhealthyPlugins: number
  isolatedPlugins: number
  disabledPlugins: number
  autoDisabledCount: number
  totalRecoveries: number
  failedRecoveries: number
}

export interface PluginRuntimeSelfHealingProps {
  className?: string
  plugins?: PluginHealthSignal[]
  onPluginEnable?: (pluginId: string) => void
  onPluginDisable?: (pluginId: string) => void
  onPluginRestart?: (pluginId: string) => void
  onDiagnosticExport?: (pluginId: string) => void
}

// ==================== Mock Data ====================

const mockPlugins: PluginHealthSignal[] = [
  {
    id: 'plugin-1',
    pluginId: 'plugin-hr',
    pluginName: 'HR Assistant',
    status: 'healthy',
    faultRate: 2.1,
    faultCount: 5,
    lastFaultTime: new Date(Date.now() - 7200000),
    lastCheckTime: new Date(),
    consecutiveFailures: 0,
    isolationReason: null,
    autoDisableEnabled: true,
    isAutoDisabled: false,
    recoveryCount: 2,
    uptime: 99.8,
    memoryUsage: 45,
    cpuUsage: 12,
  },
  {
    id: 'plugin-2',
    pluginId: 'plugin-finance',
    pluginName: 'Finance OCR',
    status: 'degraded',
    faultRate: 8.5,
    faultCount: 23,
    lastFaultTime: new Date(Date.now() - 300000),
    lastCheckTime: new Date(),
    consecutiveFailures: 3,
    isolationReason: null,
    autoDisableEnabled: true,
    isAutoDisabled: false,
    recoveryCount: 7,
    uptime: 91.5,
    memoryUsage: 78,
    cpuUsage: 45,
  },
  {
    id: 'plugin-3',
    pluginId: 'plugin-knowledge',
    pluginName: 'Knowledge Base',
    status: 'unhealthy',
    faultRate: 15.2,
    faultCount: 67,
    lastFaultTime: new Date(Date.now() - 60000),
    lastCheckTime: new Date(),
    consecutiveFailures: 8,
    isolationReason: 'fault_threshold',
    autoDisableEnabled: true,
    isAutoDisabled: false,
    recoveryCount: 15,
    uptime: 84.2,
    memoryUsage: 92,
    cpuUsage: 88,
  },
  {
    id: 'plugin-4',
    pluginId: 'plugin-warehouse',
    pluginName: 'Warehouse Manager',
    status: 'isolated',
    faultRate: 25.0,
    faultCount: 142,
    lastFaultTime: new Date(Date.now() - 30000),
    lastCheckTime: new Date(),
    consecutiveFailures: 12,
    isolationReason: 'circuit_breaker',
    autoDisableEnabled: true,
    isAutoDisabled: false,
    recoveryCount: 28,
    uptime: 75.0,
    memoryUsage: 85,
    cpuUsage: 72,
  },
  {
    id: 'plugin-5',
    pluginId: 'plugin-sales',
    pluginName: 'Sales Automation',
    status: 'disabled',
    faultRate: 0,
    faultCount: 0,
    lastFaultTime: null,
    lastCheckTime: new Date(),
    consecutiveFailures: 25,
    isolationReason: 'repeated_failure',
    autoDisableEnabled: true,
    isAutoDisabled: true,
    recoveryCount: 42,
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  },
]

const mockFaultRecords: FaultRecord[] = [
  {
    id: 'fault-1',
    pluginId: 'plugin-knowledge',
    pluginName: 'Knowledge Base',
    severity: 'high',
    errorCode: 'KB-503',
    errorMessage: 'Vector database connection timeout after 30s',
    timestamp: new Date(Date.now() - 60000),
    recoverable: true,
  },
  {
    id: 'fault-2',
    pluginId: 'plugin-warehouse',
    pluginName: 'Warehouse Manager',
    severity: 'critical',
    errorCode: 'WH-500',
    errorMessage: 'Unhandled exception in inventory sync loop',
    timestamp: new Date(Date.now() - 30000),
    recoverable: false,
  },
  {
    id: 'fault-3',
    pluginId: 'plugin-finance',
    pluginName: 'Finance OCR',
    severity: 'medium',
    errorCode: 'FN-429',
    errorMessage: 'Rate limit exceeded for OCR API calls',
    timestamp: new Date(Date.now() - 300000),
    recoverable: true,
  },
]

const mockDiagnostics: DiagnosticEntry[] = [
  {
    id: 'diag-1',
    pluginId: 'plugin-knowledge',
    pluginName: 'Knowledge Base',
    level: 'error',
    code: 'DKB-001',
    message:
      'Chunk embedding generation failed 3 consecutive times. Consider increasing timeout or checking vector DB health.',
    timestamp: new Date(Date.now() - 120000),
    actionable: true,
    actionTaken: 'retry',
  },
  {
    id: 'diag-2',
    pluginId: 'plugin-warehouse',
    pluginName: 'Warehouse Manager',
    level: 'critical',
    code: 'DWH-001',
    message: 'Circuit breaker triggered after 12 consecutive failures. Plugin has been isolated.',
    timestamp: new Date(Date.now() - 30000),
    actionable: false,
    actionTaken: 'isolate',
  },
  {
    id: 'diag-3',
    pluginId: 'plugin-finance',
    pluginName: 'Finance OCR',
    level: 'warning',
    code: 'DFN-001',
    message:
      'Memory usage approaching threshold (78%). Consider scaling down concurrent OCR operations.',
    timestamp: new Date(Date.now() - 300000),
    actionable: true,
    actionTaken: null,
  },
]

const mockRecoveryEvents: RecoveryEvent[] = [
  {
    id: 'rec-1',
    pluginId: 'plugin-knowledge',
    pluginName: 'Knowledge Base',
    action: 'restart',
    triggeredBy: 'auto',
    status: 'success',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: 'rec-2',
    pluginId: 'plugin-warehouse',
    pluginName: 'Warehouse Manager',
    action: 'isolate',
    triggeredBy: 'auto',
    status: 'success',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: 'rec-3',
    pluginId: 'plugin-sales',
    pluginName: 'Sales Automation',
    action: 'disable',
    triggeredBy: 'auto',
    status: 'success',
    timestamp: new Date(Date.now() - 86400000),
  },
]

// ==================== Utility Functions ====================

function getHealthStatusColor(status: PluginHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'degraded':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'unhealthy':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'isolated':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'disabled':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

function getHealthStatusIcon(status: PluginHealthStatus) {
  switch (status) {
    case 'healthy':
      return <ShieldCheck className="h-4 w-4" />
    case 'degraded':
      return <ShieldAlert className="h-4 w-4" />
    case 'unhealthy':
      return <AlertTriangle className="h-4 w-4" />
    case 'isolated':
      return <ShieldOff className="h-4 w-4" />
    case 'disabled':
      return <ShieldX className="h-4 w-4" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

function getHealthStatusLabel(status: PluginHealthStatus): string {
  switch (status) {
    case 'healthy':
      return '健康'
    case 'degraded':
      return '降级'
    case 'unhealthy':
      return '不健康'
    case 'isolated':
      return '已隔离'
    case 'disabled':
      return '已禁用'
    default:
      return '未知'
  }
}

function getFaultSeverityColor(severity: FaultSeverity): string {
  switch (severity) {
    case 'low':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'high':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'critical':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

function getDiagnosticLevelColor(level: DiagnosticLevel): string {
  switch (level) {
    case 'info':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'error':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'critical':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

function getRecoveryActionIcon(action: RecoveryAction) {
  switch (action) {
    case 'retry':
      return <RefreshCw className="h-3 w-3" />
    case 'restart':
      return <RefreshCcw className="h-3 w-3" />
    case 'downgrade':
      return <ZapOff className="h-3 w-3" />
    case 'isolate':
      return <ShieldOff className="h-3 w-3" />
    case 'failover':
      return <Zap className="h-3 w-3" />
    case 'disable':
      return <PowerOff className="h-3 w-3" />
    default:
      return <Settings className="h-3 w-3" />
  }
}

function formatUptime(uptime: number): string {
  if (uptime === 0) return 'N/A'
  return `${uptime.toFixed(1)}%`
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return '无'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function getCircuitBreakerStatus(consecutiveFailures: number): { color: string; label: string } {
  if (consecutiveFailures >= 10) return { color: 'text-red-500', label: '熔断' }
  if (consecutiveFailures >= 5) return { color: 'text-orange-500', label: '预警' }
  return { color: 'text-green-500', label: '正常' }
}

// ==================== Plugin Health Card ====================

interface PluginHealthCardProps {
  plugin: PluginHealthSignal
  onEnable?: () => void
  onDisable?: () => void
  onRestart?: () => void
  onViewDetails?: () => void
}

function PluginHealthCard({
  plugin,
  onEnable,
  onDisable,
  onRestart,
  onViewDetails,
}: PluginHealthCardProps) {
  const circuitStatus = getCircuitBreakerStatus(plugin.consecutiveFailures)

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-colors',
        plugin.status === 'healthy' && 'border-green-500/20 bg-green-500/5',
        plugin.status === 'degraded' && 'border-yellow-500/20 bg-yellow-500/5',
        plugin.status === 'unhealthy' && 'border-orange-500/20 bg-orange-500/5',
        plugin.status === 'isolated' && 'border-purple-500/20 bg-purple-500/5',
        plugin.status === 'disabled' && 'border-red-500/20 bg-red-500/5'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              getHealthStatusColor(plugin.status)
            )}
          >
            {getHealthStatusIcon(plugin.status)}
          </div>
          <div>
            <h3 className="font-medium">{plugin.pluginName}</h3>
            <p className="text-xs text-muted-foreground">{plugin.pluginId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', getHealthStatusColor(plugin.status))}>
            {getHealthStatusLabel(plugin.status)}
          </Badge>
          {plugin.autoDisableEnabled && (
            <Badge variant="outline" className="text-xs">
              自动禁用
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">故障率:</span>
          <span
            className={
              plugin.faultRate > 10
                ? 'text-red-500 font-medium'
                : plugin.faultRate > 5
                  ? 'text-yellow-500'
                  : ''
            }
          >
            {plugin.faultRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">连续失败:</span>
          <span className={cn(circuitStatus.color, 'font-medium')}>
            {plugin.consecutiveFailures}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">上次故障:</span>
          <span>{formatTimeAgo(plugin.lastFaultTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">恢复次数:</span>
          <span>{plugin.recoveryCount}</span>
        </div>
      </div>

      {/* Resource Usage */}
      {plugin.status !== 'disabled' && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3" /> CPU
            </span>
            <span>{plugin.cpuUsage}%</span>
          </div>
          <Progress value={plugin.cpuUsage} className="h-1" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> 内存
            </span>
            <span>{plugin.memoryUsage}%</span>
          </div>
          <Progress value={plugin.memoryUsage} className="h-1" />
        </div>
      )}

      {/* Circuit Breaker Status */}
      <div
        className={cn(
          'flex items-center justify-between text-xs mb-3 p-2 rounded',
          circuitStatus.color === 'text-red-500'
            ? 'bg-red-500/10'
            : circuitStatus.color === 'text-orange-500'
              ? 'bg-orange-500/10'
              : 'bg-green-500/10'
        )}
      >
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          熔断状态: {circuitStatus.label}
        </span>
        <span>正常运行时间: {formatUptime(plugin.uptime)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
          <Eye className="h-3 w-3 mr-1" />
          详情
        </Button>
        {plugin.status === 'disabled' ? (
          <Button variant="default" size="sm" className="flex-1" onClick={onEnable}>
            <Power className="h-3 w-3 mr-1" />
            启用
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onDisable}>
            <PowerOff className="h-3 w-3" />
          </Button>
        )}
        {plugin.status !== 'disabled' && (
          <Button variant="ghost" size="sm" onClick={onRestart}>
            <RefreshCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ==================== Plugin Detail Dialog ====================

interface PluginDetailDialogProps {
  plugin: PluginHealthSignal | null
  open: boolean
  onClose: () => void
  onRestart?: () => void
  onEnable?: () => void
  onDisable?: () => void
  onExportDiag?: () => void
}

function PluginDetailDialog({
  plugin,
  open,
  onClose,
  onRestart,
  onEnable,
  onDisable,
  onExportDiag,
}: PluginDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'faults' | 'diagnostics' | 'recovery'>(
    'overview'
  )

  if (!plugin) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                getHealthStatusColor(plugin.status)
              )}
            >
              {getHealthStatusIcon(plugin.status)}
            </div>
            <div>
              <DialogTitle>{plugin.pluginName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', getHealthStatusColor(plugin.status))}>
                  {getHealthStatusLabel(plugin.status)}
                </Badge>
                <span>{plugin.pluginId}</span>
                {plugin.isAutoDisabled && (
                  <Badge variant="destructive" className="text-xs">
                    自动禁用
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="faults">故障</TabsTrigger>
            <TabsTrigger value="diagnostics">诊断</TabsTrigger>
            <TabsTrigger value="recovery">恢复</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">故障率</p>
                <p className="text-lg font-medium">{plugin.faultRate.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">故障次数</p>
                <p className="text-lg font-medium">{plugin.faultCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">连续失败</p>
                <p className="text-lg font-medium">{plugin.consecutiveFailures}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">恢复次数</p>
                <p className="text-lg font-medium">{plugin.recoveryCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">上次故障</p>
                <p className="text-lg font-medium">{formatTimeAgo(plugin.lastFaultTime)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">隔离原因</p>
                <p className="text-lg font-medium">{plugin.isolationReason || '无'}</p>
              </div>
            </div>

            {plugin.status !== 'disabled' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">资源使用</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> CPU
                    </span>
                    <span>{plugin.cpuUsage}%</span>
                  </div>
                  <Progress value={plugin.cpuUsage} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" /> 内存
                    </span>
                    <span>{plugin.memoryUsage}%</span>
                  </div>
                  <Progress value={plugin.memoryUsage} className="h-2" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">自动禁用</span>
              </div>
              <Switch checked={plugin.autoDisableEnabled} disabled />
            </div>
          </TabsContent>

          <TabsContent value="faults">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {mockFaultRecords.filter((f) => f.pluginId === plugin.pluginId).length === 0 ? (
                  <EmptyState
                    title="暂无故障记录"
                    description="运行正常，无故障记录"
                    icon={Shield}
                    size="sm"
                  />
                ) : (
                  mockFaultRecords
                    .filter((f) => f.pluginId === plugin.pluginId)
                    .map((fault) => (
                      <div key={fault.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div
                          className={cn(
                            'mt-0.5',
                            fault.severity === 'critical'
                              ? 'text-red-500'
                              : fault.severity === 'high'
                                ? 'text-orange-500'
                                : fault.severity === 'medium'
                                  ? 'text-yellow-500'
                                  : 'text-blue-500'
                          )}
                        >
                          {fault.severity === 'critical' || fault.severity === 'high' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-xs', getFaultSeverityColor(fault.severity))}>
                              {fault.severity}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {fault.errorCode}
                            </span>
                          </div>
                          <p className="text-sm">{fault.errorMessage}</p>
                          <p className="text-xs text-muted-foreground">
                            {fault.timestamp.toLocaleString()} •{' '}
                            {fault.recoverable ? '可恢复' : '不可恢复'}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="diagnostics">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {mockDiagnostics.filter((d) => d.pluginId === plugin.pluginId).length === 0 ? (
                  <EmptyState
                    title="暂无诊断信息"
                    description="暂无诊断数据"
                    icon={Activity}
                    size="sm"
                  />
                ) : (
                  mockDiagnostics
                    .filter((d) => d.pluginId === plugin.pluginId)
                    .map((diag) => (
                      <div key={diag.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div
                          className={cn(
                            'mt-0.5',
                            diag.level === 'critical'
                              ? 'text-red-500'
                              : diag.level === 'error'
                                ? 'text-orange-500'
                                : diag.level === 'warning'
                                  ? 'text-yellow-500'
                                  : 'text-blue-500'
                          )}
                        >
                          {diag.level === 'critical' || diag.level === 'error' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-xs', getDiagnosticLevelColor(diag.level))}>
                              {diag.level}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {diag.code}
                            </span>
                            {diag.actionable && (
                              <Badge variant="outline" className="text-xs">
                                可操作
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{diag.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {diag.timestamp.toLocaleString()}
                            {diag.actionTaken && (
                              <span className="ml-2">
                                操作: {getRecoveryActionIcon(diag.actionTaken)}
                                <span className="ml-1">{diag.actionTaken}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recovery">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {mockRecoveryEvents.filter((r) => r.pluginId === plugin.pluginId).length === 0 ? (
                  <EmptyState
                    title="暂无恢复事件"
                    description="恢复记录将在此显示"
                    icon={RefreshCcw}
                    size="sm"
                  />
                ) : (
                  mockRecoveryEvents
                    .filter((r) => r.pluginId === plugin.pluginId)
                    .map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div
                          className={cn(
                            'mt-0.5',
                            event.status === 'success'
                              ? 'text-green-500'
                              : event.status === 'failed'
                                ? 'text-red-500'
                                : event.status === 'executing'
                                  ? 'text-yellow-500'
                                  : 'text-gray-500'
                          )}
                        >
                          {event.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : event.status === 'failed' ? (
                            <XCircle className="h-4 w-4" />
                          ) : event.status === 'executing' ? (
                            <RefreshCw className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getRecoveryActionIcon(event.action)}
                            <span className="text-sm font-medium">{event.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.triggeredBy === 'auto' ? '自动' : '手动'}
                            </Badge>
                            <Badge
                              className={cn(
                                'text-xs',
                                event.status === 'success'
                                  ? 'bg-green-500/10 text-green-500'
                                  : event.status === 'failed'
                                    ? 'bg-red-500/10 text-red-500'
                                    : event.status === 'executing'
                                      ? 'bg-yellow-500/10 text-yellow-500'
                                      : ''
                              )}
                            >
                              {event.status === 'success'
                                ? '成功'
                                : event.status === 'failed'
                                  ? '失败'
                                  : event.status === 'executing'
                                    ? '执行中'
                                    : '等待'}
                            </Badge>
                          </div>
                          {event.errorMessage && (
                            <p className="text-sm text-red-500">{event.errorMessage}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onExportDiag}>
            <FileText className="h-3 w-3 mr-1" />
            导出诊断
          </Button>
          {plugin.status === 'disabled' ? (
            <Button className="flex-1" onClick={onEnable}>
              <Power className="h-3 w-3 mr-1" />
              启用插件
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={onDisable}>
              <PowerOff className="h-3 w-3 mr-1" />
              禁用插件
            </Button>
          )}
          <Button variant="outline" onClick={onRestart} disabled={plugin.status === 'disabled'}>
            <RefreshCcw className="h-3 w-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function PluginRuntimeSelfHealing({
  className,
  plugins: initialPlugins,
  onPluginEnable,
  onPluginDisable,
  onPluginRestart,
  onDiagnosticExport,
}: PluginRuntimeSelfHealingProps) {
  const [plugins, setPlugins] = useState<PluginHealthSignal[]>(initialPlugins || mockPlugins)
  const [selectedPlugin, setSelectedPlugin] = useState<PluginHealthSignal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PluginHealthStatus | 'all'>('all')

  // Stats
  const stats: PluginRuntimeSelfHealingStats = useMemo(() => {
    return {
      totalPlugins: plugins.length,
      healthyPlugins: plugins.filter((p) => p.status === 'healthy').length,
      degradedPlugins: plugins.filter((p) => p.status === 'degraded').length,
      unhealthyPlugins: plugins.filter((p) => p.status === 'unhealthy').length,
      isolatedPlugins: plugins.filter((p) => p.status === 'isolated').length,
      disabledPlugins: plugins.filter((p) => p.status === 'disabled').length,
      autoDisabledCount: plugins.filter((p) => p.isAutoDisabled).length,
      totalRecoveries: plugins.reduce((acc, p) => acc + p.recoveryCount, 0),
      failedRecoveries: plugins.filter((p) => p.isAutoDisabled).length,
    }
  }, [plugins])

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      const matchesSearch =
        plugin.pluginName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.pluginId.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || plugin.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [plugins, searchQuery, statusFilter])

  // Handlers
  const handleViewDetails = (plugin: PluginHealthSignal) => {
    setSelectedPlugin(plugin)
    setDetailDialogOpen(true)
  }

  const handleEnable = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) =>
        p.id === pluginId
          ? { ...p, status: 'healthy', isAutoDisabled: false, consecutiveFailures: 0 }
          : p
      )
    )
    onPluginEnable?.(pluginId)
  }

  const handleDisable = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, status: 'disabled', isAutoDisabled: true } : p))
    )
    onPluginDisable?.(pluginId)
  }

  const handleRestart = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) =>
        p.id === pluginId ? { ...p, consecutiveFailures: 0, recoveryCount: p.recoveryCount + 1 } : p
      )
    )
    onPluginRestart?.(pluginId)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          <h2 className="text-lg font-medium">插件运行质量与自愈</h2>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          刷新状态
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">健康</p>
            <p className="text-lg font-medium text-green-500">{stats.healthyPlugins}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <ShieldAlert className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">降级</p>
            <p className="text-lg font-medium text-yellow-500">{stats.degradedPlugins}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">不健康</p>
            <p className="text-lg font-medium text-orange-500">{stats.unhealthyPlugins}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <ShieldOff className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-xs text-muted-foreground">已隔离</p>
            <p className="text-lg font-medium text-purple-500">{stats.isolatedPlugins}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <ShieldX className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">已禁用</p>
            <p className="text-lg font-medium text-red-500">{stats.disabledPlugins}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-6 p-3 rounded-lg bg-muted/50 text-sm">
        <span>
          总插件: <strong>{stats.totalPlugins}</strong>
        </span>
        <span>
          自动禁用: <strong>{stats.autoDisabledCount}</strong>
        </span>
        <span>
          总恢复次数: <strong>{stats.totalRecoveries}</strong>
        </span>
        <span>
          失败恢复: <strong>{stats.failedRecoveries}</strong>
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索插件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-3 w-3 mr-1" />
              {statusFilter === 'all' ? '全部状态' : getHealthStatusLabel(statusFilter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>全部状态</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('healthy')}>
              <ShieldCheck className="h-3 w-3 mr-2 text-green-500" />
              健康
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('degraded')}>
              <ShieldAlert className="h-3 w-3 mr-2 text-yellow-500" />
              降级
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('unhealthy')}>
              <AlertTriangle className="h-3 w-3 mr-2 text-orange-500" />
              不健康
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('isolated')}>
              <ShieldOff className="h-3 w-3 mr-2 text-purple-500" />
              已隔离
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('disabled')}>
              <ShieldX className="h-3 w-3 mr-2 text-red-500" />
              已禁用
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Plugin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <PluginHealthCard
            key={plugin.id}
            plugin={plugin}
            onViewDetails={() => handleViewDetails(plugin)}
            onEnable={() => handleEnable(plugin.id)}
            onDisable={() => handleDisable(plugin.id)}
            onRestart={() => handleRestart(plugin.id)}
          />
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <EmptyState variant="search" title="没有找到匹配的插件" description="请尝试其他搜索条件" />
      )}

      {/* Detail Dialog */}
      <PluginDetailDialog
        plugin={selectedPlugin}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onRestart={() => selectedPlugin && handleRestart(selectedPlugin.id)}
        onEnable={() => selectedPlugin && handleEnable(selectedPlugin.id)}
        onDisable={() => selectedPlugin && handleDisable(selectedPlugin.id)}
        onExportDiag={() => selectedPlugin && onDiagnosticExport?.(selectedPlugin.pluginId)}
      />
    </div>
  )
}
