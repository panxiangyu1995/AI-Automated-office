/**
 * MCP Bulk Config - Story 21.7
 * MCP工具批量配置
 * 
 * 功能：
 * - 选择多个 MCP 工具
 * - 批量应用共享策略或状态更改
 * - 记录批量变更操作的审计日志
 * 
 * 铁律合规：
 * - FR829, FR830, FR831, FR832
 * - NFR16 (权限控制), NFR23-8 (审计追踪)
 * - ADR-039 (元数据驱动配置)
 * - UX-02, UX-04
 */

import { useState, useMemo, useCallback } from 'react'
import { 
  CheckSquare, Settings, Play, Pause,
  Download, Search,
  CheckCircle2, XCircle, AlertTriangle, Clock, History,
  FileText, Layers, RefreshCw, ArrowRight, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

// Types
export type ToolStatus = 'enabled' | 'disabled' | 'error' | 'pending'
export type BulkAction = 'enable' | 'disable' | 'set_policy' | 'set_risk_level' | 'reset' | 'export' | 'import'
export type ApprovePolicy = 'auto' | 'confirm' | 'deny'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface MCPToolItem {
  id: string
  name: string
  serviceId: string
  serviceName: string
  status: ToolStatus
  policy: ApprovePolicy
  riskLevel: RiskLevel
  category: string
  description?: string
  lastUsed?: string
  usageCount: number
  tags?: string[]
  isSelected?: boolean
}

export interface BulkOperation {
  id: string
  action: BulkAction
  targetCount: number
  targetType: 'tools' | 'services'
  targetIds: string[]
  parameters: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startedAt?: string
  completedAt?: string
  result?: {
    success: number
    failed: number
    errors?: Array<{ id: string; error: string }>
  }
  actor: string
  reason?: string
}

export interface BulkAuditEntry {
  id: string
  timestamp: string
  operation: BulkOperation
  summary: string
}

export interface BulkConfigState {
  tools: MCPToolItem[]
  selectedIds: Set<string>
  operations: BulkOperation[]
  auditLog: BulkAuditEntry[]
  isLoading: boolean
  isApplying: boolean
  error: string | null
}

export interface BulkConfigStats {
  totalTools: number
  selectedCount: number
  enabledCount: number
  disabledCount: number
  byPolicy: Record<ApprovePolicy, number>
  byRiskLevel: Record<RiskLevel, number>
  byService: Record<string, number>
}

// Mock data generators
const generateMockTools = (): MCPToolItem[] => [
  {
    id: 'tool-1',
    name: 'read_file',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    status: 'enabled',
    policy: 'auto',
    riskLevel: 'low',
    category: 'file',
    description: '读取文件内容',
    lastUsed: '2026-03-24T10:30:00Z',
    usageCount: 150,
    tags: ['file', 'read'],
  },
  {
    id: 'tool-2',
    name: 'write_file',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    status: 'enabled',
    policy: 'confirm',
    riskLevel: 'medium',
    category: 'file',
    description: '写入文件内容',
    lastUsed: '2026-03-24T09:15:00Z',
    usageCount: 45,
    tags: ['file', 'write'],
  },
  {
    id: 'tool-3',
    name: 'delete_file',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    status: 'enabled',
    policy: 'deny',
    riskLevel: 'critical',
    category: 'file',
    description: '删除文件',
    usageCount: 0,
    tags: ['file', 'delete', 'dangerous'],
  },
  {
    id: 'tool-4',
    name: 'execute_command',
    serviceId: 'shell-1',
    serviceName: 'shell',
    status: 'enabled',
    policy: 'confirm',
    riskLevel: 'high',
    category: 'system',
    description: '执行Shell命令',
    lastUsed: '2026-03-23T14:20:00Z',
    usageCount: 23,
    tags: ['shell', 'execute'],
  },
  {
    id: 'tool-5',
    name: 'http_request',
    serviceId: 'http-1',
    serviceName: 'http',
    status: 'enabled',
    policy: 'auto',
    riskLevel: 'medium',
    category: 'network',
    description: '发送HTTP请求',
    lastUsed: '2026-03-24T08:45:00Z',
    usageCount: 89,
    tags: ['http', 'network'],
  },
  {
    id: 'tool-6',
    name: 'query_database',
    serviceId: 'db-1',
    serviceName: 'database',
    status: 'disabled',
    policy: 'confirm',
    riskLevel: 'high',
    category: 'database',
    description: '查询数据库',
    usageCount: 0,
    tags: ['database', 'query'],
  },
  {
    id: 'tool-7',
    name: 'send_email',
    serviceId: 'mail-1',
    serviceName: 'email',
    status: 'enabled',
    policy: 'confirm',
    riskLevel: 'medium',
    category: 'communication',
    description: '发送邮件',
    lastUsed: '2026-03-22T16:30:00Z',
    usageCount: 12,
    tags: ['email', 'send'],
  },
  {
    id: 'tool-8',
    name: 'list_directory',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    status: 'enabled',
    policy: 'auto',
    riskLevel: 'low',
    category: 'file',
    description: '列出目录内容',
    lastUsed: '2026-03-24T11:00:00Z',
    usageCount: 200,
    tags: ['file', 'directory'],
  },
]

const generateMockOperations = (): BulkOperation[] => [
  {
    id: 'op-1',
    action: 'set_policy',
    targetCount: 5,
    targetType: 'tools',
    targetIds: ['tool-1', 'tool-2', 'tool-5', 'tool-7', 'tool-8'],
    parameters: { policy: 'confirm' },
    status: 'completed',
    progress: 100,
    startedAt: '2026-03-24T09:00:00Z',
    completedAt: '2026-03-24T09:00:05Z',
    result: { success: 5, failed: 0 },
    actor: 'admin@example.com',
    reason: '安全策略升级',
  },
  {
    id: 'op-2',
    action: 'disable',
    targetCount: 2,
    targetType: 'tools',
    targetIds: ['tool-3', 'tool-4'],
    parameters: {},
    status: 'completed',
    progress: 100,
    startedAt: '2026-03-23T14:00:00Z',
    completedAt: '2026-03-23T14:00:02Z',
    result: { success: 2, failed: 0 },
    actor: 'admin@example.com',
    reason: '高风险工具临时禁用',
  },
]

// Helper functions
const getStatusBadgeVariant = (status: ToolStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'enabled': return 'default'
    case 'disabled': return 'secondary'
    case 'error': return 'destructive'
    case 'pending': return 'outline'
    default: return 'outline'
  }
}

const getStatusIcon = (status: ToolStatus) => {
  switch (status) {
    case 'enabled': return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'disabled': return <XCircle className="h-4 w-4 text-gray-400" />
    case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
    default: return null
  }
}

const getPolicyBadgeVariant = (policy: ApprovePolicy): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (policy) {
    case 'auto': return 'default'
    case 'confirm': return 'secondary'
    case 'deny': return 'destructive'
    default: return 'outline'
  }
}

const getRiskBadgeVariant = (risk: RiskLevel): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (risk) {
    case 'low': return 'default'
    case 'medium': return 'secondary'
    case 'high': return 'outline'
    case 'critical': return 'destructive'
    default: return 'outline'
  }
}

const getActionLabel = (action: BulkAction): string => {
  switch (action) {
    case 'enable': return '启用'
    case 'disable': return '禁用'
    case 'set_policy': return '设置策略'
    case 'set_risk_level': return '设置风险级别'
    case 'reset': return '重置'
    case 'export': return '导出'
    case 'import': return '导入'
    default: return action
  }
}

const getOperationStatusBadge = (status: BulkOperation['status']) => {
  switch (status) {
    case 'pending': return <Badge variant="outline">等待中</Badge>
    case 'running': return <Badge variant="secondary">执行中</Badge>
    case 'completed': return <Badge variant="default">已完成</Badge>
    case 'failed': return <Badge variant="destructive">失败</Badge>
    case 'cancelled': return <Badge variant="outline">已取消</Badge>
    default: return null
  }
}

// Main Component
export function MCPBulkConfig() {
  const [tools, setTools] = useState<MCPToolItem[]>(generateMockTools)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [operations, setOperations] = useState<BulkOperation[]>(generateMockOperations)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all')
  const [policyFilter, setPolicyFilter] = useState<ApprovePolicy | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [bulkParams, setBulkParams] = useState<Record<string, unknown>>({})
  const [bulkReason, setBulkReason] = useState('')
  const [activeTab, setActiveTab] = useState('tools')

  // Computed values
  const services = useMemo(() => {
    const serviceMap = new Map<string, string>()
    tools.forEach(t => serviceMap.set(t.serviceId, t.serviceName))
    return Array.from(serviceMap.entries()).map(([id, name]) => ({ id, name }))
  }, [tools])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = searchQuery === '' || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesStatus = statusFilter === 'all' || tool.status === statusFilter
      const matchesPolicy = policyFilter === 'all' || tool.policy === policyFilter
      const matchesRisk = riskFilter === 'all' || tool.riskLevel === riskFilter
      const matchesService = serviceFilter === 'all' || tool.serviceId === serviceFilter

      return matchesSearch && matchesStatus && matchesPolicy && matchesRisk && matchesService
    })
  }, [tools, searchQuery, statusFilter, policyFilter, riskFilter, serviceFilter])

  const stats: BulkConfigStats = useMemo(() => ({
    totalTools: tools.length,
    selectedCount: selectedIds.size,
    enabledCount: tools.filter(t => t.status === 'enabled').length,
    disabledCount: tools.filter(t => t.status === 'disabled').length,
    byPolicy: {
      auto: tools.filter(t => t.policy === 'auto').length,
      confirm: tools.filter(t => t.policy === 'confirm').length,
      deny: tools.filter(t => t.policy === 'deny').length,
    },
    byRiskLevel: {
      low: tools.filter(t => t.riskLevel === 'low').length,
      medium: tools.filter(t => t.riskLevel === 'medium').length,
      high: tools.filter(t => t.riskLevel === 'high').length,
      critical: tools.filter(t => t.riskLevel === 'critical').length,
    },
    byService: tools.reduce((acc, t) => {
      acc[t.serviceName] = (acc[t.serviceName] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }), [tools, selectedIds])

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTools.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTools.map(t => t.id)))
    }
  }, [filteredTools, selectedIds.size])

  const handleSelectTool = useCallback((toolId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }, [])

  const handleBulkAction = useCallback((action: BulkAction) => {
    setBulkAction(action)
    setBulkParams({})
    setBulkReason('')
    setShowBulkDialog(true)
  }, [])

  const executeBulkAction = useCallback(() => {
    if (!bulkAction || selectedIds.size === 0) return

    const operation: BulkOperation = {
      id: `op-${Date.now()}`,
      action: bulkAction,
      targetCount: selectedIds.size,
      targetType: 'tools',
      targetIds: Array.from(selectedIds),
      parameters: bulkParams,
      status: 'completed',
      progress: 100,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      result: { success: selectedIds.size, failed: 0 },
      actor: 'current-user',
      reason: bulkReason,
    }

    // Apply changes
    setTools(prev => prev.map(tool => {
      if (!selectedIds.has(tool.id)) return tool

      switch (bulkAction) {
        case 'enable':
          return { ...tool, status: 'enabled' as ToolStatus }
        case 'disable':
          return { ...tool, status: 'disabled' as ToolStatus }
        case 'set_policy':
          return { ...tool, policy: bulkParams.policy as ApprovePolicy }
        case 'set_risk_level':
          return { ...tool, riskLevel: bulkParams.riskLevel as RiskLevel }
        case 'reset':
          return { ...tool, policy: 'auto' as ApprovePolicy, riskLevel: 'low' as RiskLevel, status: 'enabled' as ToolStatus }
        default:
          return tool
      }
    }))

    setOperations(prev => [operation, ...prev])
    setShowBulkDialog(false)
    setSelectedIds(new Set())
  }, [bulkAction, selectedIds, bulkParams, bulkReason])

  const exportConfig = useCallback(() => {
    const selectedTools = tools.filter(t => selectedIds.has(t.id))
    const config = {
      exportedAt: new Date().toISOString(),
      tools: selectedTools.map(t => ({
        id: t.id,
        name: t.name,
        serviceId: t.serviceId,
        serviceName: t.serviceName,
        policy: t.policy,
        riskLevel: t.riskLevel,
        status: t.status,
        tags: t.tags,
      })),
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mcp-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [tools, selectedIds])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">总工具数</p>
                <p className="text-2xl font-bold">{stats.totalTools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">已选择</p>
                <p className="text-2xl font-bold">{stats.selectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">已启用</p>
                <p className="text-2xl font-bold">{stats.enabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">已禁用</p>
                <p className="text-2xl font-bold">{stats.disabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy & Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">策略分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>自动批准</span>
                  <span>{stats.byPolicy.auto}</span>
                </div>
                <Progress value={(stats.byPolicy.auto / stats.totalTools) * 100} className="h-2" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>需要确认</span>
                  <span>{stats.byPolicy.confirm}</span>
                </div>
                <Progress value={(stats.byPolicy.confirm / stats.totalTools) * 100} className="h-2 [&>div]:bg-yellow-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>禁止</span>
                  <span>{stats.byPolicy.deny}</span>
                </div>
                <Progress value={(stats.byPolicy.deny / stats.totalTools) * 100} className="h-2 [&>div]:bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">风险级别分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="default">{stats.byRiskLevel.low} 低</Badge>
              <Badge variant="secondary">{stats.byRiskLevel.medium} 中</Badge>
              <Badge variant="outline">{stats.byRiskLevel.high} 高</Badge>
              <Badge variant="destructive">{stats.byRiskLevel.critical} 极高</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tools">
            <Settings className="h-4 w-4 mr-2" />
            工具列表
          </TabsTrigger>
          <TabsTrigger value="operations">
            <History className="h-4 w-4 mr-2" />
            操作历史
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            审计日志
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs">搜索</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索工具名、服务名..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">状态</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ToolStatus | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="enabled">已启用</SelectItem>
                      <SelectItem value="disabled">已禁用</SelectItem>
                      <SelectItem value="error">错误</SelectItem>
                      <SelectItem value="pending">等待中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">策略</Label>
                  <Select value={policyFilter} onValueChange={(v) => setPolicyFilter(v as ApprovePolicy | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="auto">自动</SelectItem>
                      <SelectItem value="confirm">确认</SelectItem>
                      <SelectItem value="deny">禁止</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">风险级别</Label>
                  <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="critical">极高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">服务</Label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部服务</SelectItem>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {stats.selectedCount > 0 && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <span className="font-medium">已选择 {stats.selectedCount} 个工具</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('enable')}>
                      <Play className="h-4 w-4 mr-1" />
                      批量启用
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('disable')}>
                      <Pause className="h-4 w-4 mr-1" />
                      批量禁用
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('set_policy')}>
                      <Shield className="h-4 w-4 mr-1" />
                      设置策略
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('set_risk_level')}>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      设置风险
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportConfig}>
                      <Download className="h-4 w-4 mr-1" />
                      导出配置
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkAction('reset')}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      重置
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tools Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedIds.size === filteredTools.length && filteredTools.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>工具名称</TableHead>
                    <TableHead>服务</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>策略</TableHead>
                    <TableHead>风险级别</TableHead>
                    <TableHead>使用次数</TableHead>
                    <TableHead>最近使用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map((tool) => (
                    <TableRow 
                      key={tool.id}
                      className={selectedIds.has(tool.id) ? 'bg-primary/5' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(tool.id)}
                          onCheckedChange={() => handleSelectTool(tool.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tool.serviceName}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tool.status)}
                          <Badge variant={getStatusBadgeVariant(tool.status)}>
                            {tool.status === 'enabled' ? '已启用' : 
                             tool.status === 'disabled' ? '已禁用' :
                             tool.status === 'error' ? '错误' : '等待中'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPolicyBadgeVariant(tool.policy)}>
                          {tool.policy === 'auto' ? '自动' : 
                           tool.policy === 'confirm' ? '确认' : '禁止'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(tool.riskLevel)}>
                          {tool.riskLevel === 'low' ? '低' :
                           tool.riskLevel === 'medium' ? '中' :
                           tool.riskLevel === 'high' ? '高' : '极高'}
                        </Badge>
                      </TableCell>
                      <TableCell>{tool.usageCount}</TableCell>
                      <TableCell>
                        {tool.lastUsed ? new Date(tool.lastUsed).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>批量操作历史</CardTitle>
              <CardDescription>查看所有批量配置变更记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>操作类型</TableHead>
                    <TableHead>目标数量</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>执行时间</TableHead>
                    <TableHead>执行人</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell>
                        <Badge>{getActionLabel(op.action)}</Badge>
                      </TableCell>
                      <TableCell>{op.targetCount} 个工具</TableCell>
                      <TableCell>{getOperationStatusBadge(op.status)}</TableCell>
                      <TableCell>
                        {op.startedAt ? new Date(op.startedAt).toLocaleString('zh-CN') : '-'}
                      </TableCell>
                      <TableCell>{op.actor}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{op.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>审计日志</CardTitle>
              <CardDescription>所有批量变更的详细审计记录</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {operations.map((op) => (
                    <div key={op.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge>{getActionLabel(op.action)}</Badge>
                          {getOperationStatusBadge(op.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {op.startedAt ? new Date(op.startedAt).toLocaleString('zh-CN') : '-'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">执行人：</span>
                          <span>{op.actor}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">目标数量：</span>
                          <span>{op.targetCount}</span>
                        </div>
                        {op.reason && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">原因：</span>
                            <span>{op.reason}</span>
                          </div>
                        )}
                        {op.result && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">结果：</span>
                            <span className="text-green-600">{op.result.success} 成功</span>
                            {op.result.failed > 0 && (
                              <span className="text-red-600 ml-2">{op.result.failed} 失败</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction && getActionLabel(bulkAction)} - {selectedIds.size} 个工具
            </DialogTitle>
            <DialogDescription>
              确认对选中的工具执行批量操作
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {bulkAction === 'set_policy' && (
              <div>
                <Label>选择策略</Label>
                <Select 
                  value={bulkParams.policy as string} 
                  onValueChange={(v) => setBulkParams(prev => ({ ...prev, policy: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择策略" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动批准</SelectItem>
                    <SelectItem value="confirm">需要确认</SelectItem>
                    <SelectItem value="deny">禁止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkAction === 'set_risk_level' && (
              <div>
                <Label>选择风险级别</Label>
                <Select 
                  value={bulkParams.riskLevel as string} 
                  onValueChange={(v) => setBulkParams(prev => ({ ...prev, riskLevel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择风险级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低风险</SelectItem>
                    <SelectItem value="medium">中风险</SelectItem>
                    <SelectItem value="high">高风险</SelectItem>
                    <SelectItem value="critical">极高风险</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>操作原因（可选）</Label>
              <Textarea
                placeholder="请输入操作原因，用于审计记录..."
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>将影响以下工具：</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from(selectedIds).slice(0, 10).map(id => {
                  const tool = tools.find(t => t.id === id)
                  return tool ? (
                    <Badge key={id} variant="outline">{tool.name}</Badge>
                  ) : null
                })}
                {selectedIds.size > 10 && (
                  <Badge variant="outline">+{selectedIds.size - 10} 更多</Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              取消
            </Button>
            <Button onClick={executeBulkAction}>
              <ArrowRight className="h-4 w-4 mr-2" />
              确认执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
