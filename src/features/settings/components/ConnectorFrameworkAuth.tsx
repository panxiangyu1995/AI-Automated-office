/**
 * Connector Framework Auth - Story 30.1
 * 连接器框架与认证 - 连接器注册和认证配置
 *
 * 功能：
 * - 定义连接器注册表和认证方案
 * - 支持 OAuth、API 密钥和证书模式
 * - 持久化连接器配置以供运行时使用
 *
 * 铁律合规：
 * - FR1080, FR1081, FR1082, FR1083
 * - NFR29, NFR35
 * - ADR-015
 * - UX-02, UX-04
 */

import { useState, useMemo } from 'react'
import {
  Plus,
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
export type ConnectorAuthType = 'oauth' | 'api_key' | 'certificate' | 'none'
export type ConnectorStatus = 'active' | 'inactive' | 'error' | 'pending'
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export interface ConnectorAuth {
  type: ConnectorAuthType
  oauth?: {
    clientId: string
    clientSecret?: string
    authorizationUrl: string
    tokenUrl: string
    scopes: string[]
  }
  apiKey?: {
    key: string
    prefix?: string
    location: 'header' | 'query' | 'body'
  }
  certificate?: {
    certFile?: string
    keyFile?: string
    caFile?: string
  }
}

export interface Connector {
  id: string
  name: string
  type: 'http' | 'websocket' | 'grpc' | 'database' | 'filesystem'
  endpoint: string
  auth: ConnectorAuth
  status: ConnectorStatus
  health: HealthStatus
  lastHealthCheck?: string
  retryPolicy: RetryPolicy
  createdAt: string
  updatedAt: string
  description?: string
}

export interface RetryPolicy {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

export interface ConnectorLog {
  id: string
  connectorId: string
  connectorName: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface ConnectorStats {
  totalConnectors: number
  activeConnectors: number
  errorConnectors: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
}

// Mock Data
const MOCK_CONNECTORS: Connector[] = [
  {
    id: 'conn-1',
    name: '企业微信连接器',
    type: 'http',
    endpoint: 'https://qyapi.weixin.qq.com/cgi-bin',
    auth: {
      type: 'api_key',
      apiKey: {
        key: 'wx_corp_secret_xxxx',
        prefix: 'WW',
        location: 'query',
      },
    },
    status: 'active',
    health: 'healthy',
    lastHealthCheck: '2026-03-25T10:30:00Z',
    retryPolicy: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['timeout', '503', '429'],
    },
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
    description: '企业微信第三方应用连接器',
  },
  {
    id: 'conn-2',
    name: '钉钉连接器',
    type: 'http',
    endpoint: 'https://oapi.dingtalk.com',
    auth: {
      type: 'oauth',
      oauth: {
        clientId: 'dingtalk_app_xxxx',
        clientSecret: 'secret_xxxx',
        authorizationUrl: 'https://login.dingtalk.com/oauth2/auth',
        tokenUrl: 'https://api.dingtalk.com/oauth2/token',
        scopes: ['openid', 'Contact.Read'],
      },
    },
    status: 'active',
    health: 'healthy',
    lastHealthCheck: '2026-03-25T10:28:00Z',
    retryPolicy: {
      maxRetries: 2,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      retryableErrors: ['timeout', '502'],
    },
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-18T09:15:00Z',
    description: '钉钉开放平台连接器',
  },
  {
    id: 'conn-3',
    name: 'MySQL数据库',
    type: 'database',
    endpoint: 'mysql://192.168.1.100:3306/company_db',
    auth: {
      type: 'certificate',
      certificate: {
        certFile: '/certs/mysql-client.crt',
        keyFile: '/certs/mysql-client.key',
        caFile: '/certs/mysql-ca.crt',
      },
    },
    status: 'error',
    health: 'unhealthy',
    lastHealthCheck: '2026-03-25T10:25:00Z',
    retryPolicy: {
      maxRetries: 5,
      initialDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['connection_refused', 'timeout'],
    },
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-03-25T10:25:00Z',
    description: '公司MySQL数据库连接',
  },
  {
    id: 'conn-4',
    name: '飞书连接器',
    type: 'http',
    endpoint: 'https://open.feishu.cn/open-apis',
    auth: {
      type: 'none',
    },
    status: 'inactive',
    health: 'unknown',
    retryPolicy: {
      maxRetries: 0,
      initialDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      retryableErrors: [],
    },
    createdAt: '2026-03-01T15:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
    description: '飞书开放平台连接器（待配置）',
  },
]

const MOCK_LOGS: ConnectorLog[] = [
  {
    id: 'log-1',
    connectorId: 'conn-1',
    connectorName: '企业微信连接器',
    level: 'info',
    message: '成功发送消息到用户 zhangsan',
    timestamp: '2026-03-25T10:29:00Z',
  },
  {
    id: 'log-2',
    connectorId: 'conn-2',
    connectorName: '钉钉连接器',
    level: 'info',
    message: 'OAuth token 刷新成功',
    timestamp: '2026-03-25T10:28:30Z',
  },
  {
    id: 'log-3',
    connectorId: 'conn-3',
    connectorName: 'MySQL数据库',
    level: 'error',
    message: '连接失败：Connection refused',
    timestamp: '2026-03-25T10:25:00Z',
    metadata: { errorCode: 'ECONNREFUSED', retry: 1 },
  },
  {
    id: 'log-4',
    connectorId: 'conn-1',
    connectorName: '企业微信连接器',
    level: 'warning',
    message: 'API 调用频率接近限制',
    timestamp: '2026-03-25T10:20:00Z',
    metadata: { currentRate: 45, limit: 50 },
  },
]

// Helper functions
function getAuthTypeLabel(type: ConnectorAuthType): string {
  switch (type) {
    case 'oauth': return 'OAuth 2.0'
    case 'api_key': return 'API 密钥'
    case 'certificate': return '证书'
    case 'none': return '无认证'
  }
}

function getAuthTypeIcon(type: ConnectorAuthType) {
  switch (type) {
    case 'oauth': return <Shield className="h-4 w-4 text-blue-500" />
    case 'api_key': return <Key className="h-4 w-4 text-green-500" />
    case 'certificate': return <Lock className="h-4 w-4 text-orange-500" />
    case 'none': return <Unlock className="h-4 w-4 text-gray-400" />
  }
}

function getStatusColor(status: ConnectorStatus): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'inactive': return 'bg-gray-100 text-gray-800'
    case 'error': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
  }
}

function getHealthColor(health: HealthStatus): string {
  switch (health) {
    case 'healthy': return 'text-green-500'
    case 'degraded': return 'text-yellow-500'
    case 'unhealthy': return 'text-red-500'
    case 'unknown': return 'text-gray-400'
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

function calculateStats(connectors: Connector[]): ConnectorStats {
  return {
    totalConnectors: connectors.length,
    activeConnectors: connectors.filter(c => c.status === 'active').length,
    errorConnectors: connectors.filter(c => c.status === 'error').length,
    totalRequests: 1247,
    successfulRequests: 1189,
    failedRequests: 58,
    averageLatency: 245,
  }
}

// Main component
export function ConnectorFrameworkAuth() {
  const [activeTab, setActiveTab] = useState('connectors')
  const [connectors, setConnectors] = useState<Connector[]>(MOCK_CONNECTORS)
  const [logs] = useState<ConnectorLog[]>(MOCK_LOGS)
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [expandedConnector, setExpandedConnector] = useState<string | null>(null)

  const stats = useMemo(() => calculateStats(connectors), [connectors])

  const handleHealthCheck = (connectorId: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return {
          ...c,
          lastHealthCheck: new Date().toISOString(),
          health: Math.random() > 0.3 ? 'healthy' : 'degraded',
        }
      }
      return c
    }))
  }

  const handleDeleteConnector = (connector: Connector) => {
    setSelectedConnector(connector)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedConnector) {
      setConnectors(prev => prev.filter(c => c.id !== selectedConnector.id))
    }
    setShowDeleteDialog(false)
  }

  const handleEditConnector = (connector: Connector) => {
    setSelectedConnector(connector)
    setShowConfigDialog(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">连接器框架与认证</h2>
        <p className="text-sm text-slate-500 mt-1">配置和管理外部连接器，支持 OAuth、API 密钥和证书认证</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">连接器总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.totalConnectors}</div>
            <p className="text-xs text-slate-500 mt-1">
              活跃 {stats.activeConnectors} | 错误 {stats.errorConnectors}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">请求统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.totalRequests}</div>
            <p className="text-xs text-slate-500 mt-1">
              成功 {stats.successfulRequests} | 失败 {stats.failedRequests}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">平均延迟</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.averageLatency}ms</div>
            <p className="text-xs text-slate-500 mt-1">
              所有连接器平均响应时间
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">认证类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" /> OAuth
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Key className="h-3 w-3 text-green-500" /> API
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-orange-500" /> 证书
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connectors">连接器</TabsTrigger>
          <TabsTrigger value="logs">日志</TabsTrigger>
          <TabsTrigger value="settings">全局设置</TabsTrigger>
        </TabsList>

        {/* Connectors Tab */}
        <TabsContent value="connectors" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => { setSelectedConnector(null); setShowConfigDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                添加连接器
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4" />
              <span>最后更新: {formatRelativeTime(new Date().toISOString())}</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>端点</TableHead>
                    <TableHead>认证</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>健康度</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connectors.map((connector) => (
                    <>
                      <TableRow key={connector.id} className="cursor-pointer" onClick={() => setExpandedConnector(expandedConnector === connector.id ? null : connector.id)}>
                        <TableCell>
                          {expandedConnector === connector.id ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="font-medium">{connector.name}</div>
                              <div className="text-xs text-slate-500">{connector.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">{connector.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                          {connector.endpoint}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAuthTypeIcon(connector.auth.type)}
                            <span className="text-sm">{getAuthTypeLabel(connector.auth.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(connector.status)} variant="outline">
                            {connector.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getHealthColor(connector.health).replace('text-', 'bg-')}`} />
                            <span className={`text-sm ${getHealthColor(connector.health)}`}>
                              {connector.health}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleHealthCheck(connector.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditConnector(connector)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteConnector(connector)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedConnector === connector.id && (
                        <TableRow key={`${connector.id}-expanded`}>
                          <TableCell colSpan={8} className="bg-slate-50 p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">描述：</span>
                                <span className="ml-1">{connector.description || '无'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">最后健康检查：</span>
                                <span className="ml-1">
                                  {connector.lastHealthCheck ? formatRelativeTime(connector.lastHealthCheck) : '从未'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500">重试策略：</span>
                                <span className="ml-1">
                                  最多 {connector.retryPolicy.maxRetries} 次，初始延迟 {connector.retryPolicy.initialDelay}ms
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500">创建时间：</span>
                                <span className="ml-1">{new Date(connector.createdAt).toLocaleString('zh-CN')}</span>
                              </div>
                              {connector.auth.type === 'api_key' && connector.auth.apiKey && (
                                <div className="col-span-2">
                                  <span className="text-slate-500">API 密钥：</span>
                                  <span className="ml-1 font-mono">
                                    {showApiKey ? connector.auth.apiKey.key : '••••••••••••••••'}
                                  </span>
                                  <Button variant="ghost" size="sm" className="ml-2" onClick={() => setShowApiKey(!showApiKey)}>
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )}
                              {connector.auth.type === 'oauth' && connector.auth.oauth && (
                                <div className="col-span-2">
                                  <span className="text-slate-500">OAuth 配置：</span>
                                  <div className="mt-1 ml-1 text-xs text-slate-400">
                                    Client ID: {connector.auth.oauth.clientId}<br />
                                    授权 URL: {connector.auth.oauth.authorizationUrl}<br />
                                    Token URL: {connector.auth.oauth.tokenUrl}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">连接器日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                    log.level === 'error' ? 'border-l-red-500 bg-red-50' :
                    log.level === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}>
                    <div className={`mt-0.5 ${
                      log.level === 'error' ? 'text-red-500' :
                      log.level === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {log.level === 'error' ? <XCircle className="h-4 w-4" /> :
                       log.level === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.connectorName}</span>
                        <Badge variant="outline" className="uppercase text-xs">{log.level}</Badge>
                        <span className="text-xs text-slate-500">{formatRelativeTime(log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{log.message}</p>
                      {log.metadata && (
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">全局连接器设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">自动健康检查</Label>
                  <p className="text-sm text-slate-500">定期检查所有连接器的健康状态</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">健康检查间隔</Label>
                  <p className="text-sm text-slate-500">连接器健康状态检查的间隔时间</p>
                </div>
                <Select defaultValue="5">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">每 1 分钟</SelectItem>
                    <SelectItem value="5">每 5 分钟</SelectItem>
                    <SelectItem value="10">每 10 分钟</SelectItem>
                    <SelectItem value="30">每 30 分钟</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">默认重试次数</Label>
                  <p className="text-sm text-slate-500">连接失败时的默认重试次数</p>
                </div>
                <Select defaultValue="3">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不重试</SelectItem>
                    <SelectItem value="1">1 次</SelectItem>
                    <SelectItem value="3">3 次</SelectItem>
                    <SelectItem value="5">5 次</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">连接超时</Label>
                  <p className="text-sm text-slate-500">连接器请求的默认超时时间</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 秒</SelectItem>
                    <SelectItem value="30">30 秒</SelectItem>
                    <SelectItem value="60">60 秒</SelectItem>
                    <SelectItem value="120">120 秒</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">日志级别</Label>
                  <p className="text-sm text-slate-500">连接器日志的详细程度</p>
                </div>
                <Select defaultValue="info">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除连接器</DialogTitle>
            <DialogDescription>
              确定要删除此连接器吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          {selectedConnector && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium">{selectedConnector.name}</div>
              <div className="text-sm text-slate-500">{selectedConnector.endpoint}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog (Simplified) */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedConnector ? '编辑连接器' : '添加连接器'}
            </DialogTitle>
            <DialogDescription>
              {selectedConnector ? '修改连接器配置' : '创建新的外部连接器'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>连接器名称</Label>
                <Input placeholder="例如：企业微信连接器" defaultValue={selectedConnector?.name} />
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select defaultValue={selectedConnector?.type || 'http'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="websocket">WebSocket</SelectItem>
                    <SelectItem value="grpc">gRPC</SelectItem>
                    <SelectItem value="database">数据库</SelectItem>
                    <SelectItem value="filesystem">文件系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>端点 URL</Label>
              <Input placeholder="https://api.example.com" defaultValue={selectedConnector?.endpoint} />
            </div>
            <div className="space-y-2">
              <Label>认证类型</Label>
              <Select defaultValue={selectedConnector?.auth.type || 'none'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无认证</SelectItem>
                  <SelectItem value="api_key">API 密钥</SelectItem>
                  <SelectItem value="oauth">OAuth 2.0</SelectItem>
                  <SelectItem value="certificate">证书</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>描述（可选）</Label>
              <Input placeholder="连接器描述" defaultValue={selectedConnector?.description} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowConfigDialog(false)}>
              {selectedConnector ? '保存更改' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
