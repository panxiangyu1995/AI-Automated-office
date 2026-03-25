/**
 * ChannelGatewayManager - 通道与网关管理组件
 * Story 37.1 - 通道与网关管理
 *
 * 创建通道访问、路由和网关治理，实现多通道Agent操作
 * - 配置通道认证和路由
 * - 支持离线队列和重新投递策略
 * - 记录通道事件用于审计和追踪
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-02, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  Network,
  Server,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Globe,
  Wifi,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Database,
  ArrowRight,
  Plus,
  Trash2,
  Pause,
  Play,
  Filter,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type ChannelStatus = 'online' | 'offline' | 'degraded' | 'maintenance'
export type ChannelType = 'websocket' | 'http' | 'grpc' | 'mqtt' | 'amqp' | 'custom'
export type AuthType = 'none' | 'api_key' | 'oauth2' | 'jwt' | 'mtls'
export type RoutingStrategy = 'round_robin' | 'least_load' | 'hash' | 'priority'
export type DeliveryMode = 'at_least_once' | 'exactly_once' | 'best_effort'
export type QueueStatus = 'active' | 'paused' | 'drained' | 'full'

export interface ChannelEndpoint {
  id: string
  name: string
  url: string
  weight: number
  isHealthy: boolean
  lastCheck?: Date
  responseTime?: number
}

export interface ChannelQueue {
  id: string
  name: string
  size: number
  maxSize: number
  status: QueueStatus
  messageCount: number
  consumerCount: number
  enqueueRate: number
  dequeueRate: number
  avgLatency: number
}

export interface ChannelEvent {
  id: string
  channelId: string
  type: 'connect' | 'disconnect' | 'error' | 'retry' | 'delivery' | 'health_check'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  metadata?: Record<string, string>
}

export interface Channel {
  id: string
  name: string
  type: ChannelType
  status: ChannelStatus
  authType: AuthType
  endpoints: ChannelEndpoint[]
  queues: ChannelQueue[]
  routingStrategy: RoutingStrategy
  deliveryMode: DeliveryMode
  retryPolicy: {
    maxRetries: number
    backoffMultiplier: number
    initialInterval: number
    maxInterval: number
  }
  offlineQueueEnabled: boolean
  offlineQueueMaxSize: number
  circuitBreakerEnabled: boolean
  circuitBreakerThreshold: number
  circuitBreakerTimeout: number
  createdAt: Date
  updatedAt?: Date
  events: ChannelEvent[]
  stats: {
    totalMessages: number
    deliveredMessages: number
    failedMessages: number
    avgLatency: number
    throughput: number
    errorRate: number
  }
}

export interface GatewayStats {
  totalChannels: number
  onlineChannels: number
  offlineChannels: number
  degradedChannels: number
  totalMessages: number
  totalDeliveryRate: number
  totalQueuedMessages: number
  activeCircuitBreakers: number
}

export interface ChannelGatewayManagerProps {
  className?: string
  channels?: Channel[]
  onChannelDelete?: (channelId: string) => void
  onChannelEnable?: (channelId: string) => void
  onChannelDisable?: (channelId: string) => void
  onChannelTest?: (channelId: string) => void
}

// ==================== Mock Data ====================

const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    name: 'WebSocket Main',
    type: 'websocket',
    status: 'online',
    authType: 'jwt',
    endpoints: [
      { id: 'ep-1', name: 'Primary', url: 'wss://ws1.example.com', weight: 70, isHealthy: true, lastCheck: new Date(), responseTime: 45 },
      { id: 'ep-2', name: 'Secondary', url: 'wss://ws2.example.com', weight: 30, isHealthy: true, lastCheck: new Date(), responseTime: 62 },
    ],
    queues: [
      { id: 'q-1', name: 'high-priority', size: 120, maxSize: 10000, status: 'active', messageCount: 120, consumerCount: 5, enqueueRate: 45, dequeueRate: 48, avgLatency: 12 },
      { id: 'q-2', name: 'normal', size: 890, maxSize: 50000, status: 'active', messageCount: 890, consumerCount: 10, enqueueRate: 320, dequeueRate: 315, avgLatency: 28 },
    ],
    routingStrategy: 'least_load',
    deliveryMode: 'at_least_once',
    retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialInterval: 1000, maxInterval: 30000 },
    offlineQueueEnabled: true,
    offlineQueueMaxSize: 5000,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    events: [
      { id: 'evt-1', channelId: 'channel-1', type: 'connect', severity: 'info', message: 'Channel connected successfully', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
      { id: 'evt-2', channelId: 'channel-1', type: 'health_check', severity: 'info', message: 'Health check passed', timestamp: new Date(Date.now() - 1 * 60 * 1000) },
    ],
    stats: { totalMessages: 45678, deliveredMessages: 45321, failedMessages: 357, avgLatency: 32, throughput: 1250, errorRate: 0.78 },
  },
  {
    id: 'channel-2',
    name: 'HTTP API Gateway',
    type: 'http',
    status: 'degraded',
    authType: 'oauth2',
    endpoints: [
      { id: 'ep-3', name: 'API Primary', url: 'https://api1.example.com', weight: 100, isHealthy: true, lastCheck: new Date(), responseTime: 120 },
      { id: 'ep-4', name: 'API Backup', url: 'https://api2.example.com', weight: 0, isHealthy: false, lastCheck: new Date(Date.now() - 10 * 60 * 1000), responseTime: undefined },
    ],
    queues: [
      { id: 'q-3', name: 'sync-queue', size: 2340, maxSize: 100000, status: 'active', messageCount: 2340, consumerCount: 8, enqueueRate: 890, dequeueRate: 850, avgLatency: 56 },
    ],
    routingStrategy: 'round_robin',
    deliveryMode: 'exactly_once',
    retryPolicy: { maxRetries: 5, backoffMultiplier: 1.5, initialInterval: 500, maxInterval: 60000 },
    offlineQueueEnabled: true,
    offlineQueueMaxSize: 10000,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 10,
    circuitBreakerTimeout: 120,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    events: [
      { id: 'evt-3', channelId: 'channel-2', type: 'error', severity: 'warning', message: 'Elevated error rate detected: 5.2%', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
      { id: 'evt-4', channelId: 'channel-2', type: 'retry', severity: 'info', message: 'Retrying failed deliveries', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    ],
    stats: { totalMessages: 123456, deliveredMessages: 120891, failedMessages: 2565, avgLatency: 145, throughput: 3200, errorRate: 2.08 },
  },
  {
    id: 'channel-3',
    name: 'MQTT IoT Bridge',
    type: 'mqtt',
    status: 'offline',
    authType: 'api_key',
    endpoints: [
      { id: 'ep-5', name: 'MQTT Broker', url: 'mqtt://broker.example.com:1883', weight: 100, isHealthy: false, lastCheck: new Date(Date.now() - 30 * 60 * 1000), responseTime: undefined },
    ],
    queues: [],
    routingStrategy: 'priority',
    deliveryMode: 'at_least_once',
    retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialInterval: 1000, maxInterval: 30000 },
    offlineQueueEnabled: false,
    offlineQueueMaxSize: 0,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerTimeout: 30,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    events: [
      { id: 'evt-5', channelId: 'channel-3', type: 'disconnect', severity: 'critical', message: 'Broker connection lost', timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    ],
    stats: { totalMessages: 8901, deliveredMessages: 8901, failedMessages: 0, avgLatency: 0, throughput: 0, errorRate: 0 },
  },
]

// ==================== Helper Functions ====================

function getChannelStatusColor(status: ChannelStatus): string {
  switch (status) {
    case 'online':
      return 'text-green-600 bg-green-50 dark:bg-green-950'
    case 'offline':
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900'
    case 'degraded':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    case 'maintenance':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
    default:
      return ''
  }
}

function getChannelStatusLabel(status: ChannelStatus): string {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'degraded': return '降级'
    case 'maintenance': return '维护中'
    default: return status
  }
}

function getChannelTypeIcon(type: ChannelType) {
  switch (type) {
    case 'websocket': return <Network className="h-4 w-4" />
    case 'http': return <Globe className="h-4 w-4" />
    case 'grpc': return <Server className="h-4 w-4" />
    case 'mqtt': return <Wifi className="h-4 w-4" />
    case 'amqp': return <Database className="h-4 w-4" />
    default: return <Network className="h-4 w-4" />
  }
}

function getAuthTypeIcon(authType: AuthType) {
  switch (authType) {
    case 'none': return <Lock className="h-3 w-3" />
    case 'api_key': return <Key className="h-3 w-3" />
    case 'oauth2': return <Shield className="h-3 w-3" />
    case 'jwt': return <ShieldCheck className="h-3 w-3" />
    case 'mtls': return <ShieldAlert className="h-3 w-3" />
    default: return <Lock className="h-3 w-3" />
  }
}

function getSeverityColor(severity: ChannelEvent['severity']): string {
  switch (severity) {
    case 'info': return 'text-blue-600 bg-blue-50'
    case 'warning': return 'text-yellow-600 bg-yellow-50'
    case 'error': return 'text-red-600 bg-red-50'
    case 'critical': return 'text-red-700 bg-red-100 font-bold'
    default: return ''
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// ==================== Sub-Components ====================

interface ChannelCardProps {
  channel: Channel
  onSelect?: () => void
  isSelected?: boolean
}

function ChannelCard({ channel, onSelect, isSelected }: ChannelCardProps) {
  const [showEndpoints, setShowEndpoints] = useState(false)
  const [showQueues, setShowQueues] = useState(false)

  return (
    <div
      className={cn(
        'group rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer',
        isSelected && 'ring-2 ring-blue-500',
        channel.status === 'offline' && 'opacity-70',
        channel.status === 'degraded' && 'border-yellow-200'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            getChannelStatusColor(channel.status)
          )}>
            {getChannelTypeIcon(channel.type)}
          </div>
          <div>
            <h4 className="font-semibold">{channel.name}</h4>
            <p className="text-xs text-muted-foreground">
              {channel.type.toUpperCase()} • {channel.endpoints.length} 端点
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', getChannelStatusColor(channel.status))}>
            {getChannelStatusLabel(channel.status)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getAuthTypeIcon(channel.authType)}
            <span className="ml-1">{channel.authType.toUpperCase()}</span>
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">消息总数</p>
          <p className="font-semibold">{channel.stats.totalMessages.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">投递率</p>
          <p className="font-semibold text-green-600">
            {((channel.stats.deliveredMessages / channel.stats.totalMessages) * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">吞吐量</p>
          <p className="font-semibold">{channel.stats.throughput}/s</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">错误率</p>
          <p className={cn(
            'font-semibold',
            channel.stats.errorRate > 1 ? 'text-red-600' : channel.stats.errorRate > 0.5 ? 'text-yellow-600' : 'text-green-600'
          )}>
            {channel.stats.errorRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="mt-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={(e) => { e.stopPropagation(); setShowEndpoints(!showEndpoints); }}
        >
          <span className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            端点 ({channel.endpoints.length})
          </span>
          <ArrowRight className={cn('h-4 w-4 transition-transform', showEndpoints && 'rotate-90')} />
        </Button>

        {showEndpoints && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            {channel.endpoints.map((endpoint) => (
              <div key={endpoint.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {endpoint.isHealthy ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{endpoint.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{endpoint.url}</span>
                  {endpoint.responseTime && <span>{endpoint.responseTime}ms</span>}
                  <span>权重 {endpoint.weight}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {channel.queues.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={(e) => { e.stopPropagation(); setShowQueues(!showQueues); }}
            >
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                队列 ({channel.queues.length})
              </span>
              <ArrowRight className={cn('h-4 w-4 transition-transform', showQueues && 'rotate-90')} />
            </Button>

            {showQueues && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                {channel.queues.map((queue) => (
                  <div key={queue.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{queue.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {queue.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{queue.messageCount} 消息</span>
                      <span>{queue.consumerCount} 消费者</span>
                      <span>入队 {queue.enqueueRate}/s</span>
                      <span>出队 {queue.dequeueRate}/s</span>
                    </div>
                    <Progress value={(queue.size / queue.maxSize) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface ChannelDetailDialogProps {
  channel: Channel | null
  open: boolean
  onClose: () => void
  onTest?: () => void
  onDelete?: () => void
}

function ChannelDetailDialog({ channel, open, onClose, onTest, onDelete }: ChannelDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'queues' | 'events'>('overview')

  if (!channel) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', getChannelStatusColor(channel.status))}>
              {getChannelTypeIcon(channel.type)}
            </div>
            <div>
              <DialogTitle>{channel.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', getChannelStatusColor(channel.status))}>
                  {getChannelStatusLabel(channel.status)}
                </Badge>
                <span>{channel.type.toUpperCase()}</span>
                <span>•</span>
                <span>认证: {channel.authType.toUpperCase()}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="endpoints">端点</TabsTrigger>
            <TabsTrigger value="queues">队列</TabsTrigger>
            <TabsTrigger value="events">事件</TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="max-h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-4 p-2">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">消息总数</p>
                  <p className="text-2xl font-bold">{channel.stats.totalMessages.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">成功投递</p>
                  <p className="text-2xl font-bold text-green-600">{channel.stats.deliveredMessages.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">投递失败</p>
                  <p className="text-2xl font-bold text-red-600">{channel.stats.failedMessages.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">平均延迟</p>
                  <p className="text-2xl font-bold">{channel.stats.avgLatency}ms</p>
                </div>
              </div>

              {/* Routing & Delivery */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">路由与投递</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">路由策略</p>
                    <p className="font-medium">{channel.routingStrategy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">投递模式</p>
                    <p className="font-medium">{channel.deliveryMode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">最大重试</p>
                    <p className="font-medium">{channel.retryPolicy.maxRetries} 次</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">错误率</p>
                    <p className="font-medium">{channel.stats.errorRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              {/* Offline Queue */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">离线队列</h4>
                  <Badge variant={channel.offlineQueueEnabled ? 'default' : 'outline'}>
                    {channel.offlineQueueEnabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>
                {channel.offlineQueueEnabled && (
                  <p className="text-sm text-muted-foreground">
                    最大队列大小: {channel.offlineQueueMaxSize}
                  </p>
                )}
              </div>

              {/* Circuit Breaker */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">熔断器</h4>
                  <Badge variant={channel.circuitBreakerEnabled ? 'default' : 'outline'}>
                    {channel.circuitBreakerEnabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>
                {channel.circuitBreakerEnabled && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">阈值</p>
                      <p className="font-medium">{channel.circuitBreakerThreshold} 次失败</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">超时</p>
                      <p className="font-medium">{channel.circuitBreakerTimeout} 秒</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-3 p-2">
              {channel.endpoints.map((endpoint) => (
                <div key={endpoint.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {endpoint.isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{endpoint.name}</p>
                        <p className="text-sm text-muted-foreground">{endpoint.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">响应时间</p>
                        <p className="font-medium">{endpoint.responseTime ? `${endpoint.responseTime}ms` : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">权重</p>
                        <p className="font-medium">{endpoint.weight}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">最后检查</p>
                        <p className="font-medium">{endpoint.lastCheck ? formatRelativeTime(endpoint.lastCheck) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'queues' && (
            <div className="space-y-3 p-2">
              {channel.queues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无队列配置</p>
                </div>
              ) : (
                channel.queues.map((queue) => (
                  <div key={queue.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5" />
                        <span className="font-medium">{queue.name}</span>
                      </div>
                      <Badge variant="outline">{queue.status}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">消息数</p>
                        <p className="font-medium">{queue.messageCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">消费者</p>
                        <p className="font-medium">{queue.consumerCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">入队率</p>
                        <p className="font-medium">{queue.enqueueRate}/s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">出队率</p>
                        <p className="font-medium">{queue.dequeueRate}/s</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">队列容量</span>
                        <span>{queue.size} / {queue.maxSize}</span>
                      </div>
                      <Progress value={(queue.size / queue.maxSize) * 100} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-2 p-2">
              {channel.events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无事件记录</p>
                </div>
              ) : (
                channel.events.map((event) => (
                  <div
                    key={event.id}
                    className={cn('flex items-start gap-3 rounded-lg border p-3', getSeverityColor(event.severity))}
                  >
                    <div className="mt-0.5">
                      {event.severity === 'critical' || event.severity === 'error' ? (
                        <XCircle className="h-4 w-4" />
                      ) : event.severity === 'warning' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString('zh-CN')} • {event.type}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between mt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onTest}>
              <RefreshCw className="h-4 w-4 mr-2" />
              测试连接
            </Button>
            <Button variant="outline" size="sm" className="text-red-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          </div>
          <Button size="sm" onClick={onClose}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Component ====================

export function ChannelGatewayManager({
  className,
  channels: initialChannels,
  onChannelDelete,
  onChannelEnable,
  onChannelDisable,
  onChannelTest,
}: ChannelGatewayManagerProps) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels || mockChannels)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChannelStatus | 'all'>('all')

  // Stats
  const stats: GatewayStats = useMemo(() => {
    return {
      totalChannels: channels.length,
      onlineChannels: channels.filter((c) => c.status === 'online').length,
      offlineChannels: channels.filter((c) => c.status === 'offline').length,
      degradedChannels: channels.filter((c) => c.status === 'degraded').length,
      totalMessages: channels.reduce((sum, c) => sum + c.stats.totalMessages, 0),
      totalDeliveryRate: channels.length > 0
        ? channels.reduce((sum, c) => sum + (c.stats.deliveredMessages / c.stats.totalMessages) * 100, 0) / channels.length
        : 0,
      totalQueuedMessages: channels.reduce((sum, c) => sum + c.queues.reduce((qsum, q) => qsum + q.messageCount, 0), 0),
      activeCircuitBreakers: channels.filter((c) => c.circuitBreakerEnabled).length,
    }
  }, [channels])

  // Filtered channels
  const filteredChannels = useMemo(() => {
    let result = channels

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.type.toLowerCase().includes(query)
      )
    }

    return result
  }, [channels, statusFilter, searchQuery])

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)

  // Handlers
  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId)
    setDetailDialogOpen(true)
  }

  const handleChannelToggle = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)
    if (!channel) return

    if (channel.status === 'offline') {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId ? { ...c, status: 'online' as ChannelStatus } : c
        )
      )
      onChannelEnable?.(channelId)
    } else {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId ? { ...c, status: 'offline' as ChannelStatus } : c
        )
      )
      onChannelDisable?.(channelId)
    }
  }

  const handleChannelDelete = (channelId: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== channelId))
    onChannelDelete?.(channelId)
    setDetailDialogOpen(false)
    setSelectedChannelId(null)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">通道与网关管理</h2>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新建通道
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索通道..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter === 'all' ? '全部状态' : getChannelStatusLabel(statusFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>全部状态</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('online')}>
                <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                在线
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('degraded')}>
                <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                降级
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('offline')}>
                <span className="mr-2 h-2 w-2 rounded-full bg-gray-400" />
                离线
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('maintenance')}>
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                维护中
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 border-b px-4 py-3 overflow-x-auto text-sm">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">通道:</span>
          <span className="font-medium">{stats.totalChannels}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">在线:</span>
          <span className="font-medium text-green-600">{stats.onlineChannels}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">降级:</span>
          <span className="font-medium text-yellow-600">{stats.degradedChannels}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-muted-foreground">离线:</span>
          <span className="font-medium text-gray-600">{stats.offlineChannels}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">总消息:</span>
          <span className="font-medium">{stats.totalMessages.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">平均投递率:</span>
          <span className="font-medium text-green-600">{stats.totalDeliveryRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">队列消息:</span>
          <span className="font-medium">{stats.totalQueuedMessages.toLocaleString()}</span>
        </div>
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">未找到匹配的通道</p>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <div key={channel.id} className="flex items-start gap-4">
                <ChannelCard
                  channel={channel}
                  isSelected={selectedChannelId === channel.id}
                  onSelect={() => handleChannelSelect(channel.id)}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleChannelToggle(channel.id)
                    }}
                  >
                    {channel.status === 'offline' ? (
                      <Play className="h-4 w-4 text-green-600" />
                    ) : (
                      <Pause className="h-4 w-4 text-yellow-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChannelTest?.(channel.id)
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Detail Dialog */}
      <ChannelDetailDialog
        channel={selectedChannel || null}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onTest={() => selectedChannelId && onChannelTest?.(selectedChannelId)}
        onDelete={() => selectedChannelId && handleChannelDelete(selectedChannelId)}
      />
    </div>
  )
}
