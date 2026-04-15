/**
 * Connector Health Monitor - Story 30.2
 * 连接器健康与重试 - 监控、重试和降级处理
 *
 * 功能：
 * - 监控连接器健康状态和最近故障
 * - 应用重试和降级策略
 * - 暴露连接器事件和恢复状态
 *
 * 铁律合规：
 * - FR1084, FR1085, FR1086
 * - NFR35
 * - ADR-015, ADR-048
 * - UX-02, UX-04
 */

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  TrendingDown,
  Play,
  BellOff,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types
export type ConnectorHealthLevel = 'healthy' | 'degraded' | 'unhealthy' | 'critical'
export type RetryStatus = 'pending' | 'retrying' | 'success' | 'failed' | 'skipped'
export type DowngradeLevel = 'none' | 'l1' | 'l2' | 'l3'

export interface ConnectorHealth {
  id: string
  connectorId: string
  connectorName: string
  healthLevel: ConnectorHealthLevel
  uptime: number
  lastSuccess?: string
  lastFailure?: string
  failureCount: number
  successCount: number
  averageLatency: number
  requestCount: number
}

export interface RetryAttempt {
  id: string
  connectorId: string
  connectorName: string
  attemptNumber: number
  status: RetryStatus
  timestamp: string
  error?: string
  duration: number
  willRetry: boolean
}

export interface Incident {
  id: string
  connectorId: string
  connectorName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'timeout' | 'auth_error' | 'connection_refused' | 'rate_limit' | 'server_error' | 'unknown'
  message: string
  startedAt: string
  resolvedAt?: string
  status: 'active' | 'resolved' | 'ignored'
  retryCount: number
  affectedRequests: number
}

export interface DowngradeEvent {
  id: string
  connectorId: string
  connectorName: string
  fromLevel: DowngradeLevel
  toLevel: DowngradeLevel
  reason: string
  triggeredAt: string
  recoveredAt?: string
  status: 'active' | 'recovered' | 'permanent'
}

export interface HealthStats {
  totalConnectors: number
  healthyConnectors: number
  degradedConnectors: number
  unhealthyConnectors: number
  activeIncidents: number
  activeDowngrades: number
  totalRetries: number
  successfulRetries: number
  failedRetries: number
}

// Mock Data
const MOCK_HEALTH: ConnectorHealth[] = [
  {
    id: 'health-1',
    connectorId: 'conn-1',
    connectorName: '企业微信连接器',
    healthLevel: 'healthy',
    uptime: 99.8,
    lastSuccess: '2026-03-25T10:35:00Z',
    lastFailure: '2026-03-24T15:20:00Z',
    failureCount: 3,
    successCount: 892,
    averageLatency: 156,
    requestCount: 895,
  },
  {
    id: 'health-2',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    healthLevel: 'degraded',
    uptime: 95.2,
    lastSuccess: '2026-03-25T10:30:00Z',
    lastFailure: '2026-03-25T09:45:00Z',
    failureCount: 12,
    successCount: 245,
    averageLatency: 423,
    requestCount: 257,
  },
  {
    id: 'health-3',
    connectorId: 'conn-3',
    connectorName: 'MySQL数据库',
    healthLevel: 'critical',
    uptime: 45.0,
    lastSuccess: '2026-03-23T18:00:00Z',
    lastFailure: '2026-03-25T10:25:00Z',
    failureCount: 89,
    successCount: 74,
    averageLatency: 0,
    requestCount: 163,
  },
  {
    id: 'health-4',
    connectorId: 'conn-4',
    connectorName: '飞书连接器',
    healthLevel: 'healthy',
    uptime: 100.0,
    lastSuccess: '2026-03-25T10:00:00Z',
    failureCount: 0,
    successCount: 156,
    averageLatency: 89,
    requestCount: 156,
  },
]

const MOCK_RETRY_ATTEMPTS: RetryAttempt[] = [
  {
    id: 'retry-1',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    attemptNumber: 1,
    status: 'success',
    timestamp: '2026-03-25T10:30:15Z',
    duration: 1200,
    willRetry: false,
  },
  {
    id: 'retry-2',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    attemptNumber: 1,
    status: 'failed',
    timestamp: '2026-03-25T10:28:00Z',
    error: 'Connection timeout after 5000ms',
    duration: 5000,
    willRetry: true,
  },
  {
    id: 'retry-3',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    attemptNumber: 2,
    status: 'success',
    timestamp: '2026-03-25T10:28:05Z',
    duration: 980,
    willRetry: false,
  },
  {
    id: 'retry-4',
    connectorId: 'conn-3',
    connectorName: 'MySQL数据库',
    attemptNumber: 1,
    status: 'failed',
    timestamp: '2026-03-25T10:25:00Z',
    error: 'Connection refused',
    duration: 100,
    willRetry: true,
  },
  {
    id: 'retry-5',
    connectorId: 'conn-3',
    connectorName: 'MySQL数据库',
    attemptNumber: 2,
    status: 'failed',
    timestamp: '2026-03-25T10:25:02Z',
    error: 'Connection refused',
    duration: 100,
    willRetry: true,
  },
]

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    connectorId: 'conn-3',
    connectorName: 'MySQL数据库',
    severity: 'critical',
    type: 'connection_refused',
    message: '无法建立数据库连接，服务器拒绝连接',
    startedAt: '2026-03-25T08:00:00Z',
    status: 'active',
    retryCount: 15,
    affectedRequests: 45,
  },
  {
    id: 'inc-2',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    severity: 'medium',
    type: 'rate_limit',
    message: 'API 调用频率超出限制',
    startedAt: '2026-03-25T09:45:00Z',
    status: 'active',
    retryCount: 3,
    affectedRequests: 8,
  },
  {
    id: 'inc-3',
    connectorId: 'conn-1',
    connectorName: '企业微信连接器',
    severity: 'low',
    type: 'timeout',
    message: '偶尔发生请求超时',
    startedAt: '2026-03-24T15:20:00Z',
    resolvedAt: '2026-03-24T15:25:00Z',
    status: 'resolved',
    retryCount: 1,
    affectedRequests: 2,
  },
]

const MOCK_DOWNGRADES: DowngradeEvent[] = [
  {
    id: 'down-1',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    fromLevel: 'l1',
    toLevel: 'l2',
    reason: '连续 5 次请求失败，触发 L2 降级',
    triggeredAt: '2026-03-25T09:50:00Z',
    status: 'active',
  },
  {
    id: 'down-2',
    connectorId: 'conn-3',
    connectorName: 'MySQL数据库',
    fromLevel: 'none',
    toLevel: 'l3',
    reason: '数据库完全不可用，降级到只读缓存模式',
    triggeredAt: '2026-03-25T08:00:00Z',
    status: 'active',
  },
  {
    id: 'down-3',
    connectorId: 'conn-1',
    connectorName: '企业微信连接器',
    fromLevel: 'l1',
    toLevel: 'none',
    reason: '成功恢复，解除降级',
    triggeredAt: '2026-03-24T15:25:00Z',
    recoveredAt: '2026-03-24T15:25:00Z',
    status: 'recovered',
  },
]

// Helper functions
function getHealthColor(level: ConnectorHealthLevel): string {
  switch (level) {
    case 'healthy':
      return 'bg-green-100 text-green-800'
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800'
    case 'unhealthy':
      return 'bg-orange-100 text-orange-800'
    case 'critical':
      return 'bg-red-100 text-red-800'
  }
}

function getHealthIcon(level: ConnectorHealthLevel) {
  switch (level) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'degraded':
      return <TrendingDown className="h-4 w-4 text-yellow-500" />
    case 'unhealthy':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low':
      return 'bg-blue-100 text-blue-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'critical':
      return 'bg-red-100 text-red-800'
  }
}

function getRetryStatusColor(status: RetryStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800'
    case 'retrying':
      return 'bg-blue-100 text-blue-800'
    case 'success':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'skipped':
      return 'bg-yellow-100 text-yellow-800'
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function calculateStats(
  health: ConnectorHealth[],
  incidents: Incident[],
  retries: RetryAttempt[],
  downgrades: DowngradeEvent[]
): HealthStats {
  return {
    totalConnectors: health.length,
    healthyConnectors: health.filter((h) => h.healthLevel === 'healthy').length,
    degradedConnectors: health.filter((h) => h.healthLevel === 'degraded').length,
    unhealthyConnectors: health.filter(
      (h) => h.healthLevel === 'unhealthy' || h.healthLevel === 'critical'
    ).length,
    activeIncidents: incidents.filter((i) => i.status === 'active').length,
    activeDowngrades: downgrades.filter((d) => d.status === 'active').length,
    totalRetries: retries.length,
    successfulRetries: retries.filter((r) => r.status === 'success').length,
    failedRetries: retries.filter((r) => r.status === 'failed').length,
  }
}

// Main component
export function ConnectorHealthMonitor() {
  const [activeTab, setActiveTab] = useState('health')
  const [health] = useState<ConnectorHealth[]>(MOCK_HEALTH)
  const [retryAttempts] = useState<RetryAttempt[]>(MOCK_RETRY_ATTEMPTS)
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS)
  const [downgrades] = useState<DowngradeEvent[]>(MOCK_DOWNGRADES)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showIncidentDialog, setShowIncidentDialog] = useState(false)

  const stats = useMemo(
    () => calculateStats(health, incidents, retryAttempts, downgrades),
    [health, incidents, retryAttempts, downgrades]
  )

  const handleResolveIncident = (incident: Incident) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === incident.id) {
          return {
            ...i,
            status: 'resolved' as const,
            resolvedAt: new Date().toISOString(),
          }
        }
        return i
      })
    )
    setShowIncidentDialog(false)
  }

  const handleIgnoreIncident = (incident: Incident) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === incident.id) {
          return {
            ...i,
            status: 'ignored' as const,
          }
        }
        return i
      })
    )
    setShowIncidentDialog(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">连接器健康监控</h2>
        <p className="text-sm text-slate-500 mt-1">监控连接器健康状态、管理重试策略和处理降级</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">健康状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{stats.healthyConnectors}</div>
              <span className="text-slate-400">/</span>
              <div className="text-2xl font-bold text-slate-800">{stats.totalConnectors}</div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              降级 {stats.degradedConnectors} | 异常 {stats.unhealthyConnectors}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">活跃事件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeIncidents}</div>
            <p className="text-xs text-slate-500 mt-1">当前需要处理的事件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">活跃降级</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeDowngrades}</div>
            <p className="text-xs text-slate-500 mt-1">当前降级中的连接器</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">重试统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.totalRetries}</div>
            <p className="text-xs text-slate-500 mt-1">
              成功 {stats.successfulRetries} | 失败 {stats.failedRetries}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">平均延迟</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {Math.round(health.reduce((sum, h) => sum + h.averageLatency, 0) / health.length)}ms
            </div>
            <p className="text-xs text-slate-500 mt-1">所有连接器平均值</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="health">健康状态</TabsTrigger>
          <TabsTrigger value="incidents">
            事件
            {stats.activeIncidents > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.activeIncidents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="retries">重试记录</TabsTrigger>
          <TabsTrigger value="downgrades">降级管理</TabsTrigger>
        </TabsList>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">连接器健康状态</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>连接器</TableHead>
                    <TableHead>健康等级</TableHead>
                    <TableHead>可用率</TableHead>
                    <TableHead>平均延迟</TableHead>
                    <TableHead>请求数</TableHead>
                    <TableHead>成功/失败</TableHead>
                    <TableHead>最后成功</TableHead>
                    <TableHead>最后失败</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {health.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{h.connectorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getHealthColor(h.healthLevel)} variant="outline">
                          {getHealthIcon(h.healthLevel)}
                          <span className="ml-1">{h.healthLevel}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-24 rounded-full bg-slate-200 overflow-hidden`}>
                            <div
                              className={`h-full rounded-full ${
                                h.uptime >= 99
                                  ? 'bg-green-500'
                                  : h.uptime >= 95
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${h.uptime}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{h.uptime.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={h.averageLatency > 500 ? 'text-red-600' : 'text-slate-600'}
                        >
                          {h.averageLatency > 0 ? `${h.averageLatency}ms` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600">{h.requestCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">{h.successCount}</span>
                          <span className="text-slate-400">/</span>
                          <span className={h.failureCount > 0 ? 'text-red-600' : 'text-slate-400'}>
                            {h.failureCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {h.lastSuccess ? formatRelativeTime(h.lastSuccess) : '-'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {h.lastFailure ? formatRelativeTime(h.lastFailure) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">活跃事件</CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.filter((i) => i.status === 'active').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <EmptyState
                    title="暂无活跃事件"
                    description="连接器运行正常"
                    icon={CheckCircle2}
                    size="sm"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents
                    .filter((i) => i.status === 'active')
                    .map((incident) => (
                      <div
                        key={incident.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg border-l-4 ${
                          incident.severity === 'critical'
                            ? 'border-l-red-500'
                            : incident.severity === 'high'
                              ? 'border-l-orange-500'
                              : incident.severity === 'medium'
                                ? 'border-l-yellow-500'
                                : 'border-l-blue-500'
                        }`}
                      >
                        <div
                          className={`mt-0.5 ${
                            incident.severity === 'critical'
                              ? 'text-red-500'
                              : incident.severity === 'high'
                                ? 'text-orange-500'
                                : incident.severity === 'medium'
                                  ? 'text-yellow-500'
                                  : 'text-blue-500'
                          }`}
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{incident.connectorName}</span>
                            <Badge
                              className={getSeverityColor(incident.severity)}
                              variant="outline"
                            >
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline" className="uppercase">
                              {incident.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{incident.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>开始时间: {formatRelativeTime(incident.startedAt)}</span>
                            <span>重试次数: {incident.retryCount}</span>
                            <span>影响请求: {incident.affectedRequests}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIncident(incident)
                              setShowIncidentDialog(true)
                            }}
                          >
                            处理
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">已解决事件</CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.filter((i) => i.status !== 'active').length === 0 ? (
                <EmptyState
                  title="暂无已解决事件"
                  description="所有事件已处理"
                  icon={CheckCircle2}
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {incidents
                    .filter((i) => i.status !== 'active')
                    .map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{incident.connectorName}</span>
                            <Badge variant="outline" className="uppercase text-xs">
                              {incident.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {incident.resolvedAt
                              ? `解决时间: ${formatRelativeTime(incident.resolvedAt)}`
                              : `状态: ${incident.status}`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retries Tab */}
        <TabsContent value="retries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">重试记录</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>连接器</TableHead>
                    <TableHead>重试次数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>错误信息</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>将继续重试</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retryAttempts.map((retry) => (
                    <TableRow key={retry.id}>
                      <TableCell className="font-medium">{retry.connectorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">第 {retry.attemptNumber} 次</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRetryStatusColor(retry.status)} variant="outline">
                          {retry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-600 text-sm max-w-xs truncate">
                        {retry.error || '-'}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDuration(retry.duration)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatRelativeTime(retry.timestamp)}
                      </TableCell>
                      <TableCell>
                        {retry.willRetry ? (
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Downgrades Tab */}
        <TabsContent value="downgrades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">降级管理</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>连接器</TableHead>
                    <TableHead>降级级别</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>触发时间</TableHead>
                    <TableHead>恢复时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downgrades.map((downgrade) => (
                    <TableRow key={downgrade.id}>
                      <TableCell className="font-medium">{downgrade.connectorName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">
                            {downgrade.fromLevel === 'none'
                              ? '正常'
                              : `L${downgrade.fromLevel.replace('l', '')}`}
                          </Badge>
                          <ArrowDown className="h-4 w-4 text-red-500" />
                          <Badge
                            variant="outline"
                            className={downgrade.toLevel === 'none' ? 'bg-green-100' : 'bg-red-100'}
                          >
                            {downgrade.toLevel === 'none'
                              ? '正常'
                              : `L${downgrade.toLevel.replace('l', '')}`}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs">
                        {downgrade.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            downgrade.status === 'active'
                              ? 'bg-red-100 text-red-800'
                              : downgrade.status === 'recovered'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }
                          variant="outline"
                        >
                          {downgrade.status === 'active'
                            ? '进行中'
                            : downgrade.status === 'recovered'
                              ? '已恢复'
                              : '永久'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatRelativeTime(downgrade.triggeredAt)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {downgrade.recoveredAt ? formatRelativeTime(downgrade.recoveredAt) : '-'}
                      </TableCell>
                      <TableCell>
                        {downgrade.status === 'active' && (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-1" />
                            尝试恢复
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">降级策略配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">启用自动降级</Label>
                  <p className="text-sm text-slate-500">当连接器持续失败时自动降级</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>降级触发阈值</Label>
                  <p className="text-sm text-slate-500">连续失败次数达到此值时触发降级</p>
                </div>
                <Select defaultValue="5">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 次</SelectItem>
                    <SelectItem value="5">5 次</SelectItem>
                    <SelectItem value="10">10 次</SelectItem>
                    <SelectItem value="20">20 次</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>降级时间窗口</Label>
                  <p className="text-sm text-slate-500">在指定时间内计算失败次数</p>
                </div>
                <Select defaultValue="300">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 分钟</SelectItem>
                    <SelectItem value="300">5 分钟</SelectItem>
                    <SelectItem value="600">10 分钟</SelectItem>
                    <SelectItem value="1800">30 分钟</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自动恢复检测</Label>
                  <p className="text-sm text-slate-500">定期检测连接器是否已恢复</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Incident Dialog */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理事件</DialogTitle>
            <DialogDescription>选择如何处理此事件</DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium">{selectedIncident.connectorName}</div>
                <div className="text-sm text-slate-500">{selectedIncident.message}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">严重程度：</span>
                  <Badge className={getSeverityColor(selectedIncident.severity)} variant="outline">
                    {selectedIncident.severity}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500">类型：</span>
                  <Badge variant="outline" className="uppercase">
                    {selectedIncident.type}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500">开始时间：</span>
                  <span>{formatRelativeTime(selectedIncident.startedAt)}</span>
                </div>
                <div>
                  <span className="text-slate-500">影响请求：</span>
                  <span>{selectedIncident.affectedRequests}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleIgnoreIncident(selectedIncident!)}>
              <BellOff className="h-4 w-4 mr-2" />
              忽略
            </Button>
            <Button onClick={() => handleResolveIncident(selectedIncident!)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              标记已解决
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
