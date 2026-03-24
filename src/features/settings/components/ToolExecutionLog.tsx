/**
 * Tool Execution Log - Story 21.8
 * 工具执行日志与审计
 * 
 * 功能：
 * - 列出工具执行记录（支持筛选）
 * - 显示 approve 决策和结果摘要
 * - 支持导出审计审查
 * 
 * 铁律合规：
 * - FR818, FR831
 * - NFR14 (操作审计), NFR23-8 (审计日志完整性)
 * - ADR-039 (元数据驱动配置)
 * - UX-02, UX-04
 */

import { useState, useMemo, useCallback } from 'react'
import { 
  FileText, Search, Download, Clock, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw,
  Shield, Eye, Trash2, Archive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Types
export type ExecutionStatus = 'success' | 'failed' | 'timeout' | 'cancelled' | 'pending' | 'running'
export type ApproveDecision = 'auto_approved' | 'user_approved' | 'user_denied' | 'policy_denied' | 'pending'
export type ExecutionToolCategory = 'file' | 'network' | 'database' | 'system' | 'agent' | 'external' | 'custom'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ExportFormat = 'json' | 'csv' | 'pdf'

export interface ToolExecutionRecord {
  id: string
  toolId: string
  toolName: string
  serviceId: string
  serviceName: string
  category: ExecutionToolCategory
  status: ExecutionStatus
  approveDecision: ApproveDecision
  riskLevel: RiskLevel
  inputParams: Record<string, unknown>
  outputResult?: unknown
  errorMessage?: string
  startTime: string
  endTime?: string
  duration?: number // ms
  actor: string
  sessionId: string
  correlationId?: string
  retryCount: number
  metadata?: {
    userAgent?: string
    ipAddress?: string
    environment?: string
    [key: string]: unknown
  }
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: 'execute' | 'approve' | 'deny' | 'retry' | 'cancel' | 'export'
  targetType: 'tool' | 'policy' | 'config'
  targetId: string
  targetName: string
  actor: string
  details: Record<string, unknown>
  result: 'success' | 'failure' | 'partial'
  reason?: string
}

export interface ExecutionStats {
  totalExecutions: number
  successRate: number
  avgDuration: number
  byStatus: Record<ExecutionStatus, number>
  byCategory: Record<ExecutionToolCategory, number>
  byApproveDecision: Record<ApproveDecision, number>
  byRiskLevel: Record<RiskLevel, number>
  recentErrors: number
  pendingApprovals: number
}

export interface LogExportConfig {
  format: ExportFormat
  dateRange: {
    start: string
    end: string
  }
  filters: {
    status?: ExecutionStatus[]
    category?: ExecutionToolCategory[]
    riskLevel?: RiskLevel[]
  }
  includeFields: string[]
  includeInput: boolean
  includeOutput: boolean
}

// Mock data generators
const generateMockRecords = (): ToolExecutionRecord[] => [
  {
    id: 'exec-1',
    toolId: 'tool-1',
    toolName: 'read_file',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    category: 'file',
    status: 'success',
    approveDecision: 'auto_approved',
    riskLevel: 'low',
    inputParams: { path: '/project/src/main.ts' },
    outputResult: { content: '// file content...', size: 1024 },
    startTime: '2026-03-24T10:30:00Z',
    endTime: '2026-03-24T10:30:00.250Z',
    duration: 250,
    actor: 'user@example.com',
    sessionId: 'session-1',
    retryCount: 0,
  },
  {
    id: 'exec-2',
    toolId: 'tool-2',
    toolName: 'write_file',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    category: 'file',
    status: 'success',
    approveDecision: 'user_approved',
    riskLevel: 'medium',
    inputParams: { path: '/project/src/utils.ts', content: 'export const util = () => {}' },
    outputResult: { written: true, bytes: 45 },
    startTime: '2026-03-24T10:25:00Z',
    endTime: '2026-03-24T10:25:00.350Z',
    duration: 350,
    actor: 'user@example.com',
    sessionId: 'session-1',
    retryCount: 0,
  },
  {
    id: 'exec-3',
    toolId: 'tool-4',
    toolName: 'execute_command',
    serviceId: 'shell-1',
    serviceName: 'shell',
    category: 'system',
    status: 'failed',
    approveDecision: 'user_approved',
    riskLevel: 'high',
    inputParams: { command: 'npm run build' },
    errorMessage: 'Build failed: TypeScript error in src/types.ts',
    startTime: '2026-03-24T10:20:00Z',
    endTime: '2026-03-24T10:20:15.500Z',
    duration: 15500,
    actor: 'user@example.com',
    sessionId: 'session-1',
    retryCount: 2,
  },
  {
    id: 'exec-4',
    toolId: 'tool-5',
    toolName: 'http_request',
    serviceId: 'http-1',
    serviceName: 'http',
    category: 'network',
    status: 'success',
    approveDecision: 'auto_approved',
    riskLevel: 'medium',
    inputParams: { url: 'https://api.example.com/data', method: 'GET' },
    outputResult: { status: 200, data: { items: [] } },
    startTime: '2026-03-24T10:15:00Z',
    endTime: '2026-03-24T10:15:01.200Z',
    duration: 1200,
    actor: 'user@example.com',
    sessionId: 'session-1',
    retryCount: 0,
  },
  {
    id: 'exec-5',
    toolId: 'tool-3',
    toolName: 'delete_file',
    serviceId: 'fs-1',
    serviceName: 'filesystem',
    category: 'file',
    status: 'cancelled',
    approveDecision: 'policy_denied',
    riskLevel: 'critical',
    inputParams: { path: '/project/important.txt' },
    errorMessage: 'Blocked by policy: critical risk operations require admin approval',
    startTime: '2026-03-24T10:10:00Z',
    endTime: '2026-03-24T10:10:00.050Z',
    duration: 50,
    actor: 'user@example.com',
    sessionId: 'session-1',
    retryCount: 0,
  },
  {
    id: 'exec-6',
    toolId: 'tool-6',
    toolName: 'query_database',
    serviceId: 'db-1',
    serviceName: 'database',
    category: 'database',
    status: 'timeout',
    approveDecision: 'user_approved',
    riskLevel: 'high',
    inputParams: { query: 'SELECT * FROM large_table' },
    errorMessage: 'Query timeout after 30 seconds',
    startTime: '2026-03-24T09:45:00Z',
    endTime: '2026-03-24T09:45:30.000Z',
    duration: 30000,
    actor: 'user@example.com',
    sessionId: 'session-2',
    retryCount: 1,
  },
  {
    id: 'exec-7',
    toolId: 'tool-7',
    toolName: 'send_email',
    serviceId: 'mail-1',
    serviceName: 'email',
    category: 'external',
    status: 'success',
    approveDecision: 'user_approved',
    riskLevel: 'medium',
    inputParams: { to: 'client@example.com', subject: 'Report', body: '...' },
    outputResult: { messageId: 'msg-123', sent: true },
    startTime: '2026-03-24T09:30:00Z',
    endTime: '2026-03-24T09:30:02.500Z',
    duration: 2500,
    actor: 'admin@example.com',
    sessionId: 'session-3',
    correlationId: 'corr-1',
    retryCount: 0,
  },
]

const generateMockAuditLog = (): AuditLogEntry[] => [
  {
    id: 'audit-1',
    timestamp: '2026-03-24T10:30:00Z',
    action: 'execute',
    targetType: 'tool',
    targetId: 'tool-1',
    targetName: 'read_file',
    actor: 'user@example.com',
    details: { status: 'success', duration: 250 },
    result: 'success',
  },
  {
    id: 'audit-2',
    timestamp: '2026-03-24T10:25:00Z',
    action: 'approve',
    targetType: 'tool',
    targetId: 'tool-2',
    targetName: 'write_file',
    actor: 'user@example.com',
    details: { decision: 'approved', riskLevel: 'medium' },
    result: 'success',
    reason: 'User confirmed write operation',
  },
  {
    id: 'audit-3',
    timestamp: '2026-03-24T10:10:00Z',
    action: 'deny',
    targetType: 'tool',
    targetId: 'tool-3',
    targetName: 'delete_file',
    actor: 'system',
    details: { policy: 'critical_risk_block' },
    result: 'success',
    reason: 'Critical risk operations require admin approval',
  },
  {
    id: 'audit-4',
    timestamp: '2026-03-24T10:00:00Z',
    action: 'export',
    targetType: 'tool',
    targetId: 'all',
    targetName: 'execution_log',
    actor: 'admin@example.com',
    details: { format: 'json', recordCount: 100 },
    result: 'success',
  },
]

// Helper functions
const getStatusBadge = (status: ExecutionStatus) => {
  switch (status) {
    case 'success': return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />成功</Badge>
    case 'failed': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />失败</Badge>
    case 'timeout': return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />超时</Badge>
    case 'cancelled': return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />已取消</Badge>
    case 'pending': return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />等待中</Badge>
    case 'running': return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />运行中</Badge>
    default: return null
  }
}

const getApproveBadge = (decision: ApproveDecision) => {
  switch (decision) {
    case 'auto_approved': return <Badge variant="default">自动批准</Badge>
    case 'user_approved': return <Badge variant="secondary">用户批准</Badge>
    case 'user_denied': return <Badge variant="destructive">用户拒绝</Badge>
    case 'policy_denied': return <Badge variant="destructive">策略拒绝</Badge>
    case 'pending': return <Badge variant="outline">待批准</Badge>
    default: return null
  }
}

const getRiskBadge = (risk: RiskLevel) => {
  switch (risk) {
    case 'low': return <Badge variant="default">低</Badge>
    case 'medium': return <Badge variant="secondary">中</Badge>
    case 'high': return <Badge variant="outline">高</Badge>
    case 'critical': return <Badge variant="destructive">极高</Badge>
    default: return null
  }
}

const formatDuration = (ms?: number): string => {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

// Main Component
export function ToolExecutionLog() {
  const [records, setRecords] = useState<ToolExecutionRecord[]>(generateMockRecords)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(generateMockAuditLog)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ExecutionToolCategory | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [approveFilter, setApproveFilter] = useState<ApproveDecision | 'all'>('all')
  const [dateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ToolExecutionRecord | null>(null)
  const [activeTab, setActiveTab] = useState('logs')

  // Stats
  const stats: ExecutionStats = useMemo(() => {
    const total = records.length
    const success = records.filter(r => r.status === 'success').length
    const durations = records.filter(r => r.duration).map(r => r.duration!)
    
    return {
      totalExecutions: total,
      successRate: total > 0 ? (success / total) * 100 : 0,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      byStatus: records.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
      }, {} as Record<ExecutionStatus, number>),
      byCategory: records.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1
        return acc
      }, {} as Record<ExecutionToolCategory, number>),
      byApproveDecision: records.reduce((acc, r) => {
        acc[r.approveDecision] = (acc[r.approveDecision] || 0) + 1
        return acc
      }, {} as Record<ApproveDecision, number>),
      byRiskLevel: records.reduce((acc, r) => {
        acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1
        return acc
      }, {} as Record<RiskLevel, number>),
      recentErrors: records.filter(r => r.status === 'failed' || r.status === 'timeout').length,
      pendingApprovals: records.filter(r => r.approveDecision === 'pending').length,
    }
  }, [records])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = searchQuery === '' || 
        record.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter
      const matchesRisk = riskFilter === 'all' || record.riskLevel === riskFilter
      const matchesApprove = approveFilter === 'all' || record.approveDecision === approveFilter
      
      const matchesDateRange = (!dateRange.start || record.startTime >= dateRange.start) &&
        (!dateRange.end || record.startTime <= dateRange.end)

      return matchesSearch && matchesStatus && matchesCategory && matchesRisk && matchesApprove && matchesDateRange
    })
  }, [records, searchQuery, statusFilter, categoryFilter, riskFilter, approveFilter, dateRange])

  // Handlers
  const handleViewDetail = useCallback((record: ToolExecutionRecord) => {
    setSelectedRecord(record)
    setShowDetailDialog(true)
  }, [])

  const handleExport = useCallback((format: ExportFormat) => {
    const exportData = filteredRecords.map(r => ({
      id: r.id,
      toolName: r.toolName,
      serviceName: r.serviceName,
      status: r.status,
      approveDecision: r.approveDecision,
      riskLevel: r.riskLevel,
      startTime: r.startTime,
      duration: r.duration,
      actor: r.actor,
      errorMessage: r.errorMessage,
    }))

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2)
      filename = `tool-execution-log-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else {
      // CSV format
      const headers = Object.keys(exportData[0] || {}).join(',')
      const rows = exportData.map(r => Object.values(r).join(','))
      content = [headers, ...rows].join('\n')
      filename = `tool-execution-log-${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
  }, [filteredRecords])

  const handleClearLogs = useCallback(() => {
    setRecords([])
    setAuditLog([])
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">总执行次数</p>
                <p className="text-2xl font-bold">{stats.totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">成功率</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">平均耗时</p>
                <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">近期错误</p>
                <p className="text-2xl font-bold">{stats.recentErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">批准决策分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>自动批准</span>
                <span>{stats.byApproveDecision.auto_approved || 0}</span>
              </div>
              <Progress 
                value={((stats.byApproveDecision.auto_approved || 0) / stats.totalExecutions) * 100} 
                className="h-2" 
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>用户批准</span>
                <span>{stats.byApproveDecision.user_approved || 0}</span>
              </div>
              <Progress 
                value={((stats.byApproveDecision.user_approved || 0) / stats.totalExecutions) * 100} 
                className="h-2 [&>div]:bg-yellow-500" 
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>拒绝</span>
                <span>{(stats.byApproveDecision.user_denied || 0) + (stats.byApproveDecision.policy_denied || 0)}</span>
              </div>
              <Progress 
                value={(((stats.byApproveDecision.user_denied || 0) + (stats.byApproveDecision.policy_denied || 0)) / stats.totalExecutions) * 100} 
                className="h-2 [&>div]:bg-red-500" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            执行日志
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-4 w-4 mr-2" />
            审计日志
          </TabsTrigger>
        </TabsList>

        {/* Execution Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
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
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExecutionStatus | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="success">成功</SelectItem>
                      <SelectItem value="failed">失败</SelectItem>
                      <SelectItem value="timeout">超时</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                      <SelectItem value="pending">等待中</SelectItem>
                      <SelectItem value="running">运行中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">类别</Label>
                  <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ExecutionToolCategory | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="file">文件</SelectItem>
                      <SelectItem value="network">网络</SelectItem>
                      <SelectItem value="database">数据库</SelectItem>
                      <SelectItem value="system">系统</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="external">外部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">风险级别</Label>
                  <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | 'all')}>
                    <SelectTrigger className="w-[100px]">
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
                  <Label className="text-xs">批准决策</Label>
                  <Select value={approveFilter} onValueChange={(v) => setApproveFilter(v as ApproveDecision | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="auto_approved">自动批准</SelectItem>
                      <SelectItem value="user_approved">用户批准</SelectItem>
                      <SelectItem value="user_denied">用户拒绝</SelectItem>
                      <SelectItem value="policy_denied">策略拒绝</SelectItem>
                      <SelectItem value="pending">待批准</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              显示 {filteredRecords.length} / {records.length} 条记录
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                清空
              </Button>
            </div>
          </div>

          {/* Records Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>工具</TableHead>
                    <TableHead>服务</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>批准决策</TableHead>
                    <TableHead>风险级别</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>执行人</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {new Date(record.startTime).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.toolName}</p>
                          <p className="text-xs text-muted-foreground">{record.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.serviceName}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{getApproveBadge(record.approveDecision)}</TableCell>
                      <TableCell>{getRiskBadge(record.riskLevel)}</TableCell>
                      <TableCell>{formatDuration(record.duration)}</TableCell>
                      <TableCell className="text-sm">{record.actor}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewDetail(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>审计日志</CardTitle>
              <CardDescription>所有工具操作的审计记录，保留180天</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge>{entry.action}</Badge>
                          <Badge variant="outline">{entry.targetType}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">执行人：</span>
                          <span>{entry.actor}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">目标：</span>
                          <span>{entry.targetName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">结果：</span>
                          <Badge variant={entry.result === 'success' ? 'default' : 'destructive'}>
                            {entry.result === 'success' ? '成功' : entry.result === 'partial' ? '部分成功' : '失败'}
                          </Badge>
                        </div>
                        {entry.reason && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">原因：</span>
                            <span>{entry.reason}</span>
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>执行详情 - {selectedRecord?.toolName}</DialogTitle>
            <DialogDescription>
              ID: {selectedRecord?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">状态</Label>
                  <div>{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">批准决策</Label>
                  <div>{getApproveBadge(selectedRecord.approveDecision)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">风险级别</Label>
                  <div>{getRiskBadge(selectedRecord.riskLevel)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">耗时</Label>
                  <div className="text-sm">{formatDuration(selectedRecord.duration)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">开始时间</Label>
                  <div className="text-sm">{new Date(selectedRecord.startTime).toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">执行人</Label>
                  <div className="text-sm">{selectedRecord.actor}</div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">输入参数</Label>
                <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-auto max-h-[150px]">
                  {JSON.stringify(selectedRecord.inputParams, null, 2) as string}
                </pre>
              </div>

              {Boolean(selectedRecord.outputResult) && (
                <div>
                  <Label className="text-xs text-muted-foreground">输出结果</Label>
                  <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-auto max-h-[150px]">
                    {JSON.stringify(selectedRecord.outputResult, null, 2) as string}
                  </pre>
                </div>
              )}

              {selectedRecord.errorMessage && (
                <div>
                  <Label className="text-xs text-muted-foreground text-red-500">错误信息</Label>
                  <pre className="text-sm bg-red-50 text-red-600 p-2 rounded mt-1 overflow-auto">
                    {selectedRecord.errorMessage}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出执行日志</DialogTitle>
            <DialogDescription>
              选择导出格式
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleExport('json')}
            >
              <FileText className="h-6 w-6 mb-2" />
              JSON 格式
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleExport('csv')}
            >
              <Archive className="h-6 w-6 mb-2" />
              CSV 格式
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
