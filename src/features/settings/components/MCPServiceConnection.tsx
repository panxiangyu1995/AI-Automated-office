/**
 * MCP Service Connection - Story 21.4
 * MCP服务连接管理
 * 
 * 功能：
 * - 展示服务在线、离线和错误状态
 * - 允许重连和禁用操作
 * - 持久化服务健康和最后检查信息
 */

import { useState, useMemo } from 'react'
import { 
  Server, Wifi, WifiOff, AlertTriangle, RefreshCw, 
  Ban, CheckCircle2, Activity, Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Types
export type ConnectionStatus = 'online' | 'offline' | 'error' | 'connecting' | 'disabled'
export type HealthLevel = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
export type OperationType = 'connect' | 'disconnect' | 'reconnect' | 'disable' | 'enable'

export interface HealthCheck {
  id: string
  serviceId: string
  timestamp: string
  status: HealthLevel
  responseTime: number
  latency: number
  errorCount: number
  successRate: number
  details: {
    cpu: number
    memory: number
    connections: number
    messages: number
    errors: number
  }
}

export interface ServiceConnection {
  id: string
  serviceId: string
  serviceName: string
  serviceType: string
  status: ConnectionStatus
  health: HealthLevel
  lastHealthCheck: string
  lastConnected: string | null
  lastDisconnected: string | null
  connectionCount: number
  totalUptime: number
  currentUptime: number
  responseTime: number
  latency: number
  errorRate: number
  disabled: boolean
  disabledReason: string | null
  disabledBy: string | null
  disabledAt: string | null
  autoReconnect: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
  healthChecks: HealthCheck[]
}

export interface ConnectionOperation {
  id: string
  serviceId: string
  serviceName: string
  operation: OperationType
  timestamp: string
  actor: string
  reason?: string
  success: boolean
  previousStatus: ConnectionStatus
  newStatus: ConnectionStatus
  errorMessage?: string
}

export interface ConnectionStats {
  totalServices: number
  onlineServices: number
  offlineServices: number
  errorServices: number
  disabledServices: number
  averageResponseTime: number
  averageLatency: number
  totalUptime: number
  healthScore: number
}

export interface ServiceConnectionState {
  connections: ServiceConnection[]
  operations: ConnectionOperation[]
  stats: ConnectionStats
  isLoading: boolean
  isConnecting: boolean
  error: string | null
}

// Mock data generators
const generateMockConnections = (): ServiceConnection[] => [
  {
    id: 'conn-1',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    serviceType: 'stdio',
    status: 'online',
    health: 'healthy',
    lastHealthCheck: '2026-03-24T10:30:00Z',
    lastConnected: '2026-03-24T08:00:00Z',
    lastDisconnected: '2026-03-23T18:00:00Z',
    connectionCount: 156,
    totalUptime: 864000,
    currentUptime: 9000,
    responseTime: 12,
    latency: 5,
    errorRate: 0.02,
    disabled: false,
    disabledReason: null,
    disabledBy: null,
    disabledAt: null,
    autoReconnect: true,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    healthChecks: [
      {
        id: 'hc-1',
        serviceId: 'mcp-1',
        timestamp: '2026-03-24T10:30:00Z',
        status: 'healthy',
        responseTime: 12,
        latency: 5,
        errorCount: 2,
        successRate: 0.98,
        details: { cpu: 15, memory: 45, connections: 3, messages: 1024, errors: 2 },
      },
      {
        id: 'hc-2',
        serviceId: 'mcp-1',
        timestamp: '2026-03-24T10:00:00Z',
        status: 'healthy',
        responseTime: 15,
        latency: 6,
        errorCount: 1,
        successRate: 0.99,
        details: { cpu: 12, memory: 42, connections: 2, messages: 980, errors: 1 },
      },
    ],
  },
  {
    id: 'conn-2',
    serviceId: 'mcp-2',
    serviceName: 'brave-search',
    serviceType: 'http',
    status: 'online',
    health: 'degraded',
    lastHealthCheck: '2026-03-24T10:30:00Z',
    lastConnected: '2026-03-24T09:00:00Z',
    lastDisconnected: '2026-03-24T08:45:00Z',
    connectionCount: 89,
    totalUptime: 432000,
    currentUptime: 5400,
    responseTime: 250,
    latency: 180,
    errorRate: 0.08,
    disabled: false,
    disabledReason: null,
    disabledBy: null,
    disabledAt: null,
    autoReconnect: true,
    reconnectAttempts: 2,
    maxReconnectAttempts: 5,
    healthChecks: [
      {
        id: 'hc-3',
        serviceId: 'mcp-2',
        timestamp: '2026-03-24T10:30:00Z',
        status: 'degraded',
        responseTime: 250,
        latency: 180,
        errorCount: 8,
        successRate: 0.92,
        details: { cpu: 45, memory: 68, connections: 12, messages: 456, errors: 8 },
      },
    ],
  },
  {
    id: 'conn-3',
    serviceId: 'mcp-3',
    serviceName: 'postgres',
    serviceType: 'stdio',
    status: 'offline',
    health: 'unknown',
    lastHealthCheck: '2026-03-24T10:00:00Z',
    lastConnected: '2026-03-24T07:30:00Z',
    lastDisconnected: '2026-03-24T10:00:00Z',
    connectionCount: 23,
    totalUptime: 180000,
    currentUptime: 0,
    responseTime: 0,
    latency: 0,
    errorRate: 0,
    disabled: false,
    disabledReason: null,
    disabledBy: null,
    disabledAt: null,
    autoReconnect: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 3,
    healthChecks: [],
  },
  {
    id: 'conn-4',
    serviceId: 'mcp-4',
    serviceName: 'redis',
    serviceType: 'stdio',
    status: 'error',
    health: 'unhealthy',
    lastHealthCheck: '2026-03-24T10:25:00Z',
    lastConnected: '2026-03-24T06:00:00Z',
    lastDisconnected: '2026-03-24T10:20:00Z',
    connectionCount: 45,
    totalUptime: 120000,
    currentUptime: 0,
    responseTime: 0,
    latency: 0,
    errorRate: 1.0,
    disabled: false,
    disabledReason: null,
    disabledBy: null,
    disabledAt: null,
    autoReconnect: true,
    reconnectAttempts: 5,
    maxReconnectAttempts: 5,
    healthChecks: [
      {
        id: 'hc-4',
        serviceId: 'mcp-4',
        timestamp: '2026-03-24T10:25:00Z',
        status: 'unhealthy',
        responseTime: 0,
        latency: 0,
        errorCount: 15,
        successRate: 0,
        details: { cpu: 0, memory: 0, connections: 0, messages: 0, errors: 15 },
      },
    ],
  },
  {
    id: 'conn-5',
    serviceId: 'mcp-5',
    serviceName: 'analytics',
    serviceType: 'http',
    status: 'disabled',
    health: 'unknown',
    lastHealthCheck: '2026-03-20T10:00:00Z',
    lastConnected: null,
    lastDisconnected: null,
    connectionCount: 0,
    totalUptime: 0,
    currentUptime: 0,
    responseTime: 0,
    latency: 0,
    errorRate: 0,
    disabled: true,
    disabledReason: '计划维护',
    disabledBy: 'admin',
    disabledAt: '2026-03-20T10:00:00Z',
    autoReconnect: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 3,
    healthChecks: [],
  },
]

const generateMockOperations = (): ConnectionOperation[] => [
  {
    id: 'op-1',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    operation: 'reconnect',
    timestamp: '2026-03-24T08:00:00Z',
    actor: 'system',
    reason: '自动重连',
    success: true,
    previousStatus: 'offline',
    newStatus: 'online',
  },
  {
    id: 'op-2',
    serviceId: 'mcp-2',
    serviceName: 'brave-search',
    operation: 'connect',
    timestamp: '2026-03-24T09:00:00Z',
    actor: 'admin',
    success: true,
    previousStatus: 'offline',
    newStatus: 'online',
  },
  {
    id: 'op-3',
    serviceId: 'mcp-5',
    serviceName: 'analytics',
    operation: 'disable',
    timestamp: '2026-03-20T10:00:00Z',
    actor: 'admin',
    reason: '计划维护',
    success: true,
    previousStatus: 'online',
    newStatus: 'disabled',
  },
  {
    id: 'op-4',
    serviceId: 'mcp-4',
    serviceName: 'redis',
    operation: 'reconnect',
    timestamp: '2026-03-24T10:20:00Z',
    actor: 'system',
    success: false,
    previousStatus: 'error',
    newStatus: 'error',
    errorMessage: 'Connection refused',
  },
]

const generateMockStats = (connections: ServiceConnection[]): ConnectionStats => {
  const online = connections.filter(c => c.status === 'online')
  return {
    totalServices: connections.length,
    onlineServices: online.length,
    offlineServices: connections.filter(c => c.status === 'offline').length,
    errorServices: connections.filter(c => c.status === 'error').length,
    disabledServices: connections.filter(c => c.disabled).length,
    averageResponseTime: online.length > 0 
      ? online.reduce((acc, c) => acc + c.responseTime, 0) / online.length 
      : 0,
    averageLatency: online.length > 0 
      ? online.reduce((acc, c) => acc + c.latency, 0) / online.length 
      : 0,
    totalUptime: connections.reduce((acc, c) => acc + c.totalUptime, 0),
    healthScore: online.length > 0 
      ? online.filter(c => c.health === 'healthy').length / online.length * 100 
      : 0,
  }
}

// Status Badge Component
function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { color: string; icon: typeof Wifi; label: string }> = {
    online: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: Wifi, label: '在线' },
    offline: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300', icon: WifiOff, label: '离线' },
    error: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle, label: '错误' },
    connecting: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: RefreshCw, label: '连接中' },
    disabled: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Ban, label: '已禁用' },
  }
  const { color, icon: Icon, label } = config[status]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// Health Badge Component
function HealthBadge({ health }: { health: HealthLevel }) {
  const config: Record<HealthLevel, { color: string; label: string }> = {
    healthy: { color: 'bg-green-100 text-green-700', label: '健康' },
    degraded: { color: 'bg-yellow-100 text-yellow-700', label: '降级' },
    unhealthy: { color: 'bg-red-100 text-red-700', label: '不健康' },
    unknown: { color: 'bg-gray-100 text-gray-700', label: '未知' },
  }
  const { color, label } = config[health]
  return <Badge className={color}>{label}</Badge>
}

// Connection Card Component
function ConnectionCard({ 
  connection, 
  onReconnect, 
  onDisable, 
  onEnable,
  onViewDetails 
}: { 
  connection: ServiceConnection
  onReconnect: () => void
  onDisable: () => void
  onEnable: () => void
  onViewDetails: () => void
}) {
  const isDisabled = connection.disabled
  const isOnline = connection.status === 'online'
  const isOffline = connection.status === 'offline'
  const isError = connection.status === 'error'

  return (
    <Card className={isDisabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              {connection.serviceName}
            </CardTitle>
            <StatusBadge status={connection.status} />
            {isOnline && <HealthBadge health={connection.health} />}
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span className="text-xs">{connection.serviceType.toUpperCase()}</span>
          <span className="text-xs text-muted-foreground">ID: {connection.serviceId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">响应时间</div>
              <div className="font-medium">{connection.responseTime || '-'} ms</div>
            </div>
            <div>
              <div className="text-muted-foreground">延迟</div>
              <div className="font-medium">{connection.latency || '-'} ms</div>
            </div>
            <div>
              <div className="text-muted-foreground">错误率</div>
              <div className="font-medium">{(connection.errorRate * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Health Progress */}
          {isOnline && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">健康度</span>
                <span className="font-medium">
                  {connection.health === 'healthy' ? 100 : 
                   connection.health === 'degraded' ? 60 : 20}%
                </span>
              </div>
              <Progress 
                value={connection.health === 'healthy' ? 100 : 
                       connection.health === 'degraded' ? 60 : 20} 
                className="h-2"
              />
            </div>
          )}

          {/* Uptime Info */}
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">当前运行时间: </span>
              <span>{Math.floor(connection.currentUptime / 3600)}h</span>
            </div>
            <div>
              <span className="text-muted-foreground">连接次数: </span>
              <span>{connection.connectionCount}</span>
            </div>
          </div>

          {/* Disabled Info */}
          {isDisabled && (
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
              <div className="font-medium text-purple-700 dark:text-purple-300">禁用信息</div>
              <div>原因: {connection.disabledReason}</div>
              <div>操作人: {connection.disabledBy}</div>
              <div>时间: {new Date(connection.disabledAt || '').toLocaleString('zh-CN')}</div>
            </div>
          )}

          {/* Error Info */}
          {isError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
              <div className="font-medium">连接错误</div>
              <div>重连尝试: {connection.reconnectAttempts}/{connection.maxReconnectAttempts}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {(isOffline || isError) && !isDisabled && (
              <Button size="sm" onClick={onReconnect}>
                <RefreshCw className="h-4 w-4 mr-1" />
                重连
              </Button>
            )}
            {!isDisabled ? (
              <Button size="sm" variant="outline" onClick={onDisable}>
                <Ban className="h-4 w-4 mr-1" />
                禁用
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onEnable}>
                <Play className="h-4 w-4 mr-1" />
                启用
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onViewDetails}>
              详情
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export function MCPServiceConnection() {
  const [connections, _setConnections] = useState<ServiceConnection[]>(generateMockConnections())
  const [operations] = useState<ConnectionOperation[]>(generateMockOperations())
  const [activeTab, setActiveTab] = useState<string>('connections')
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<ServiceConnection | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [isOperating, setIsOperating] = useState(false)

  const stats = useMemo(() => generateMockStats(connections), [connections])

  const handleReconnect = (_connection: ServiceConnection) => {
    setIsOperating(true)
    setTimeout(() => {
      setIsOperating(false)
    }, 1500)
  }

  const handleOpenDisable = (connection: ServiceConnection) => {
    setSelectedConnection(connection)
    setDisableReason('')
    setDisableDialogOpen(true)
  }

  const handleDisable = () => {
    setIsOperating(true)
    setTimeout(() => {
      setIsOperating(false)
      setDisableDialogOpen(false)
    }, 1000)
  }

  const handleEnable = (_connection: ServiceConnection) => {
    setIsOperating(true)
    setTimeout(() => {
      setIsOperating(false)
    }, 1000)
  }

  const handleViewDetails = (connection: ServiceConnection) => {
    setSelectedConnection(connection)
    setDetailsDialogOpen(true)
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            MCP 服务连接管理
          </h2>
          <p className="text-muted-foreground">
            管理服务连接状态、健康检查和操作
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新状态
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <div className="text-sm text-muted-foreground">总服务数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <Wifi className="h-5 w-5" />
              {stats.onlineServices}
            </div>
            <div className="text-sm text-muted-foreground">在线</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-500 flex items-center gap-1">
              <WifiOff className="h-5 w-5" />
              {stats.offlineServices}
            </div>
            <div className="text-sm text-muted-foreground">离线</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-5 w-5" />
              {stats.errorServices}
            </div>
            <div className="text-sm text-muted-foreground">错误</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.healthScore.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">健康评分</div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">系统健康度</span>
            <span className="text-sm text-muted-foreground">
              平均响应: {stats.averageResponseTime.toFixed(0)}ms | 
              平均延迟: {stats.averageLatency.toFixed(0)}ms
            </span>
          </div>
          <Progress value={stats.healthScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connections">连接状态</TabsTrigger>
          <TabsTrigger value="operations">操作记录</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onReconnect={() => handleReconnect(connection)}
                onDisable={() => handleOpenDisable(connection)}
                onEnable={() => handleEnable(connection)}
                onViewDetails={() => handleViewDetails(connection)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>服务</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>状态变化</TableHead>
                    <TableHead>结果</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="text-sm">
                        {new Date(op.timestamp).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="font-medium">{op.serviceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {op.operation === 'connect' ? '连接' :
                           op.operation === 'disconnect' ? '断开' :
                           op.operation === 'reconnect' ? '重连' :
                           op.operation === 'disable' ? '禁用' : '启用'}
                        </Badge>
                      </TableCell>
                      <TableCell>{op.actor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={op.previousStatus} />
                          <span className="text-xs">→</span>
                          <StatusBadge status={op.newStatus} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {op.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {op.reason || op.errorMessage || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>服务详情</DialogTitle>
            <DialogDescription>
              {selectedConnection?.serviceName} 连接详情和健康检查记录
            </DialogDescription>
          </DialogHeader>

          {selectedConnection && (
            <div className="space-y-4">
              {/* Connection Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>服务 ID</Label>
                  <div className="text-sm">{selectedConnection.serviceId}</div>
                </div>
                <div className="space-y-2">
                  <Label>服务类型</Label>
                  <div className="text-sm">{selectedConnection.serviceType.toUpperCase()}</div>
                </div>
                <div className="space-y-2">
                  <Label>当前状态</Label>
                  <StatusBadge status={selectedConnection.status} />
                </div>
                <div className="space-y-2">
                  <Label>健康状态</Label>
                  <HealthBadge health={selectedConnection.health} />
                </div>
                <div className="space-y-2">
                  <Label>最后连接</Label>
                  <div className="text-sm">
                    {selectedConnection.lastConnected 
                      ? new Date(selectedConnection.lastConnected).toLocaleString('zh-CN')
                      : '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>最后断开</Label>
                  <div className="text-sm">
                    {selectedConnection.lastDisconnected 
                      ? new Date(selectedConnection.lastDisconnected).toLocaleString('zh-CN')
                      : '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>总运行时间</Label>
                  <div className="text-sm">{formatUptime(selectedConnection.totalUptime)}</div>
                </div>
                <div className="space-y-2">
                  <Label>连接次数</Label>
                  <div className="text-sm">{selectedConnection.connectionCount}</div>
                </div>
              </div>

              {/* Health Checks */}
              <div className="space-y-2">
                <Label>健康检查记录</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>响应时间</TableHead>
                      <TableHead>成功率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedConnection.healthChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="text-sm">
                          {new Date(check.timestamp).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <HealthBadge health={check.status} />
                        </TableCell>
                        <TableCell>{check.responseTime}ms</TableCell>
                        <TableCell>{(check.successRate * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                    {selectedConnection.healthChecks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          暂无健康检查记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁用服务</DialogTitle>
            <DialogDescription>
              请输入禁用原因，禁用后服务将不会自动连接
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>服务名称</Label>
              <div className="font-medium">{selectedConnection?.serviceName}</div>
            </div>
            <div className="space-y-2">
              <Label>禁用原因</Label>
              <Input
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="请输入禁用原因"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisable}
              disabled={!disableReason || isOperating}
            >
              {isOperating ? '处理中...' : '确认禁用'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MCPServiceConnection