/**
 * Resource Execution Audit - Story 10.7
 * 资源执行审计 - 执行审计跟踪
 *
 * 功能：
 * - 记录资源执行操作和结果
 * - 异常执行模式告警
 * - 支持审计查询和导出
 *
 * 铁律合规：
 * - FR751, FR752, FR754, FR755
 * - NFR14, NFR23-8
 * - ADR-046, ADR-047
 * - UX-02, UX-04
 */

import { Fragment, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  User,
  FileCode,
  Pause,
  ChevronDown,
  ChevronUp,
  FileJson,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
export type AuditExecutionStatus = 'success' | 'failure' | 'timeout' | 'cancelled'
export type ExecutionPattern = 'normal' | 'suspicious' | 'anomalous'
export type ResourceType = 'plugin' | 'skill' | 'soul' | 'template'

export interface ExecutionRecord {
  id: string
  resourceId: string
  resourceName: string
  resourceType: ResourceType
  action: string
  status: AuditExecutionStatus
  duration: number
  executedAt: string
  executedBy: string
  tenantId: string
  pattern: ExecutionPattern
  riskScore: number
  errorMessage?: string
  outputSummary?: string
  metadata?: Record<string, unknown>
}

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  condition: AlertCondition
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'notify' | 'block' | 'log'
  lastTriggered?: string
  triggerCount: number
}

export interface AlertCondition {
  type: 'frequency' | 'failure_rate' | 'response_time' | 'pattern' | 'custom'
  threshold?: number
  timeWindow?: number
  pattern?: string
  expression?: string
}

export interface AlertEvent {
  id: string
  ruleId: string
  ruleName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resourceId: string
  resourceName: string
  message: string
  details?: string
  triggeredAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface AuditExport {
  id: string
  format: 'json' | 'csv' | 'xlsx'
  dateRange: {
    start: string
    end: string
  }
  resourceTypes: ResourceType[]
  status?: AuditExecutionStatus
  exportedAt: string
  exportedBy: string
  recordCount: number
  downloadUrl?: string
}

export interface AuditStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageDuration: number
  totalAlerts: number
  unacknowledgedAlerts: number
  topExecutedResources: { resourceId: string; resourceName: string; count: number }[]
  anomalousPatterns: number
}

// Mock Data
const MOCK_RECORDS: ExecutionRecord[] = [
  {
    id: 'exec-1',
    resourceId: 'skill-1',
    resourceName: 'Document Parser',
    resourceType: 'skill',
    action: 'parse_document',
    status: 'success',
    duration: 1250,
    executedAt: '2026-03-25T10:30:00Z',
    executedBy: 'user@company.com',
    tenantId: 'tenant-1',
    pattern: 'normal',
    riskScore: 5,
    outputSummary: 'Parsed 15 pages in 1.25s',
  },
  {
    id: 'exec-2',
    resourceId: 'plugin-1',
    resourceName: 'HR Employee Manager',
    resourceType: 'plugin',
    action: 'get_employee_list',
    status: 'success',
    duration: 890,
    executedAt: '2026-03-25T10:28:00Z',
    executedBy: 'hr-admin@company.com',
    tenantId: 'tenant-1',
    pattern: 'normal',
    riskScore: 3,
    outputSummary: 'Retrieved 25 employees',
  },
  {
    id: 'exec-3',
    resourceId: 'skill-2',
    resourceName: 'Email Auto-Reply',
    resourceType: 'skill',
    action: 'send_auto_reply',
    status: 'failure',
    duration: 3200,
    executedAt: '2026-03-25T10:25:00Z',
    executedBy: 'support@company.com',
    tenantId: 'tenant-1',
    pattern: 'suspicious',
    riskScore: 72,
    errorMessage: 'SMTP connection timeout after 3s',
  },
  {
    id: 'exec-4',
    resourceId: 'soul-1',
    resourceName: 'Sales Persona',
    resourceType: 'soul',
    action: 'generate_response',
    status: 'success',
    duration: 2100,
    executedAt: '2026-03-25T10:20:00Z',
    executedBy: 'sales-bot@company.com',
    tenantId: 'tenant-1',
    pattern: 'normal',
    riskScore: 8,
    outputSummary: 'Generated 3 response options',
  },
  {
    id: 'exec-5',
    resourceId: 'plugin-2',
    resourceName: 'Finance OCR Scanner',
    resourceType: 'plugin',
    action: 'scan_invoice',
    status: 'success',
    duration: 5600,
    executedAt: '2026-03-25T10:15:00Z',
    executedBy: 'finance@company.com',
    tenantId: 'tenant-1',
    pattern: 'anomalous',
    riskScore: 85,
    outputSummary: 'Flagged: Suspicious data pattern detected',
  },
  {
    id: 'exec-6',
    resourceId: 'template-1',
    resourceName: 'Invoice Template',
    resourceType: 'template',
    action: 'render_template',
    status: 'timeout',
    duration: 30000,
    executedAt: '2026-03-25T10:10:00Z',
    executedBy: 'user@company.com',
    tenantId: 'tenant-1',
    pattern: 'suspicious',
    riskScore: 65,
    errorMessage: 'Template rendering exceeded 30s timeout',
  },
]

const MOCK_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-1',
    name: '高频执行告警',
    description: '资源执行频率超过正常值的3倍',
    enabled: true,
    condition: {
      type: 'frequency',
      threshold: 100,
      timeWindow: 300,
    },
    severity: 'medium',
    action: 'notify',
    lastTriggered: '2026-03-25T09:00:00Z',
    triggerCount: 12,
  },
  {
    id: 'rule-2',
    name: '高失败率告警',
    description: '资源执行失败率超过20%',
    enabled: true,
    condition: {
      type: 'failure_rate',
      threshold: 20,
      timeWindow: 600,
    },
    severity: 'high',
    action: 'notify',
    lastTriggered: '2026-03-24T15:30:00Z',
    triggerCount: 5,
  },
  {
    id: 'rule-3',
    name: '响应超时告警',
    description: '资源响应时间超过60秒',
    enabled: true,
    condition: {
      type: 'response_time',
      threshold: 60000,
    },
    severity: 'low',
    action: 'log',
    triggerCount: 28,
  },
  {
    id: 'rule-4',
    name: '异常模式检测',
    description: '检测到可疑的执行模式',
    enabled: true,
    condition: {
      type: 'pattern',
      pattern: 'suspicious|anomalous',
    },
    severity: 'critical',
    action: 'block',
    lastTriggered: '2026-03-25T10:25:00Z',
    triggerCount: 3,
  },
]

const MOCK_ALERTS: AlertEvent[] = [
  {
    id: 'alert-1',
    ruleId: 'rule-4',
    ruleName: '异常模式检测',
    severity: 'critical',
    resourceId: 'plugin-2',
    resourceName: 'Finance OCR Scanner',
    message: '检测到可疑的执行模式',
    details: '资源在5分钟内执行了12次，且所有执行都返回了异常数据模式',
    triggeredAt: '2026-03-25T10:25:00Z',
    acknowledged: false,
  },
  {
    id: 'alert-2',
    ruleId: 'rule-2',
    ruleName: '高失败率告警',
    severity: 'high',
    resourceId: 'skill-2',
    resourceName: 'Email Auto-Reply',
    message: '资源执行失败率超过20%',
    details: '在过去的10分钟内，该资源执行了10次，其中3次失败',
    triggeredAt: '2026-03-25T10:25:00Z',
    acknowledged: false,
  },
  {
    id: 'alert-3',
    ruleId: 'rule-3',
    ruleName: '响应超时告警',
    severity: 'low',
    resourceId: 'template-1',
    resourceName: 'Invoice Template',
    message: '资源响应时间超过60秒',
    details: '模板渲染耗时62.5秒，超出阈值60秒',
    triggeredAt: '2026-03-25T10:11:00Z',
    acknowledged: true,
    acknowledgedBy: 'admin@company.com',
    acknowledgedAt: '2026-03-25T10:15:00Z',
  },
]

// Helper functions
function getStatusColor(status: AuditExecutionStatus): string {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800'
    case 'failure': return 'bg-red-100 text-red-800'
    case 'timeout': return 'bg-yellow-100 text-yellow-800'
    case 'cancelled': return 'bg-gray-100 text-gray-800'
  }
}

function getPatternColor(pattern: ExecutionPattern): string {
  switch (pattern) {
    case 'normal': return 'bg-green-100 text-green-800'
    case 'suspicious': return 'bg-yellow-100 text-yellow-800'
    case 'anomalous': return 'bg-red-100 text-red-800'
  }
}

function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low': return 'bg-blue-100 text-blue-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'critical': return 'bg-red-100 text-red-800'
  }
}

function getStatusIcon(status: AuditExecutionStatus) {
  switch (status) {
    case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failure': return <XCircle className="h-4 w-4 text-red-500" />
    case 'timeout': return <Clock className="h-4 w-4 text-yellow-500" />
    case 'cancelled': return <Pause className="h-4 w-4 text-gray-400" />
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
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

function calculateStats(records: ExecutionRecord[], alerts: AlertEvent[]): AuditStats {
  return {
    totalExecutions: records.length,
    successfulExecutions: records.filter(r => r.status === 'success').length,
    failedExecutions: records.filter(r => r.status === 'failure' || r.status === 'timeout').length,
    averageDuration: Math.round(records.reduce((sum, r) => sum + r.duration, 0) / records.length),
    totalAlerts: alerts.length,
    unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length,
    topExecutedResources: Object.entries(
      records.reduce((acc, r) => {
        acc[r.resourceName] = (acc[r.resourceName] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .map(([resourceName, count]) => ({ resourceId: '', resourceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    anomalousPatterns: records.filter(r => r.pattern === 'anomalous' || r.pattern === 'suspicious').length,
  }
}

// Main component
export function ResourceExecutionAudit() {
  const [activeTab, setActiveTab] = useState('records')
  const [records] = useState<ExecutionRecord[]>(MOCK_RECORDS)
  const [alertRules] = useState<AlertRule[]>(MOCK_ALERT_RULES)
  const [alerts, setAlerts] = useState<AlertEvent[]>(MOCK_ALERTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AuditExecutionStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [patternFilter, setPatternFilter] = useState<ExecutionPattern | 'all'>('all')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('json')
  const [exportRange, setExportRange] = useState('7d')
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  const stats = useMemo(() => calculateStats(records, alerts), [records, alerts])

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (searchQuery && !record.resourceName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false
      }
      if (typeFilter !== 'all' && record.resourceType !== typeFilter) {
        return false
      }
      if (patternFilter !== 'all' && record.pattern !== patternFilter) {
        return false
      }
      return true
    })
  }, [records, searchQuery, statusFilter, typeFilter, patternFilter])

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          acknowledged: true,
          acknowledgedBy: 'admin@company.com',
          acknowledgedAt: new Date().toISOString(),
        }
      }
      return a
    }))
  }

  const handleExport = () => {
    // Mock export functionality
    setShowExportDialog(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">资源执行审计</h2>
        <p className="text-sm text-slate-500 mt-1">记录资源执行操作，检测异常模式，支持审计查询和导出</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">总执行数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.totalExecutions}</div>
            <p className="text-xs text-slate-500 mt-1">
              成功 {stats.successfulExecutions} | 失败 {stats.failedExecutions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">平均耗时</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatDuration(stats.averageDuration)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              所有执行平均响应时间
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">告警总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalAlerts}</div>
            <p className="text-xs text-slate-500 mt-1">
              未处理 {stats.unacknowledgedAlerts} | 已处理 {stats.totalAlerts - stats.unacknowledgedAlerts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">异常模式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.anomalousPatterns}</div>
            <p className="text-xs text-slate-500 mt-1">
              可疑/异常执行模式数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Executed Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            热门执行资源
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {stats.topExecutedResources.map((resource, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">{resource.resourceName}</span>
                <Badge variant="outline">{resource.count}次</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AuditExecutionStatus | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="failure">失败</SelectItem>
            <SelectItem value="timeout">超时</SelectItem>
            <SelectItem value="cancelled">取消</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="plugin">插件</SelectItem>
            <SelectItem value="skill">技能</SelectItem>
            <SelectItem value="soul">人格</SelectItem>
            <SelectItem value="template">模板</SelectItem>
          </SelectContent>
        </Select>
        <Select value={patternFilter} onValueChange={(v) => setPatternFilter(v as ExecutionPattern | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模式</SelectItem>
            <SelectItem value="normal">正常</SelectItem>
            <SelectItem value="suspicious">可疑</SelectItem>
            <SelectItem value="anomalous">异常</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="records">执行记录</TabsTrigger>
          <TabsTrigger value="alerts">
            告警
            {stats.unacknowledgedAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unacknowledgedAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">告警规则</TabsTrigger>
        </TabsList>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>资源</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>执行人</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>模式</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <Fragment key={record.id}>
                      <TableRow key={record.id} className="cursor-pointer" onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}>
                        <TableCell>
                          {expandedRecord === record.id ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="font-medium">{record.resourceName}</div>
                              <div className="text-xs text-slate-500">{record.resourceType}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{record.action}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)} variant="outline">
                            {getStatusIcon(record.status)}
                            <span className="ml-1">{record.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDuration(record.duration)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{record.executedBy}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatRelativeTime(record.executedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPatternColor(record.pattern)} variant="outline">
                            {record.pattern}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {expandedRecord === record.id && (
                        <TableRow key={`${record.id}-expanded`}>
                          <TableCell colSpan={8} className="bg-slate-50 p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">风险评分：</span>
                                <span className="font-medium ml-1">{record.riskScore}/100</span>
                              </div>
                              <div>
                                <span className="text-slate-500">租户ID：</span>
                                <span className="font-medium ml-1">{record.tenantId}</span>
                              </div>
                              {record.outputSummary && (
                                <div className="col-span-2">
                                  <span className="text-slate-500">输出摘要：</span>
                                  <span className="ml-1">{record.outputSummary}</span>
                                </div>
                              )}
                              {record.errorMessage && (
                                <div className="col-span-2">
                                  <span className="text-red-500">错误信息：</span>
                                  <span className="text-red-600 ml-1">{record.errorMessage}</span>
                                </div>
                              )}
                              <div className="col-span-2">
                                <span className="text-slate-500">执行ID：</span>
                                <span className="font-mono text-xs ml-1">{record.id}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">活跃告警</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.filter(a => !a.acknowledged).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>暂无未处理的告警</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.filter(a => !a.acknowledged).map(alert => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg border-l-4 border-l-red-500">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.ruleName}</span>
                          <Badge className={getSeverityColor(alert.severity)} variant="outline">
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.resourceName}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{alert.message}</p>
                        {alert.details && (
                          <p className="text-xs text-slate-500 mt-1">{alert.details}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          触发时间：{formatRelativeTime(alert.triggeredAt)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                        确认
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">已处理告警</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.filter(a => a.acknowledged).length === 0 ? (
                <EmptyState variant="default" title="暂无已处理的告警" description="当前没有已处理的告警记录" />
              ) : (
                <div className="space-y-3">
                  {alerts.filter(a => a.acknowledged).map(alert => (
                    <div key={alert.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{alert.ruleName}</span>
                          <Badge variant="outline">{alert.resourceName}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          由 {alert.acknowledgedBy} 在 {formatRelativeTime(alert.acknowledgedAt!)} 确认
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">告警规则配置</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规则名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>严重程度</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>触发次数</TableHead>
                    <TableHead>最后触发</TableHead>
                    <TableHead>启用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-xs">{rule.description}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(rule.severity)} variant="outline">
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{rule.action}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{rule.triggerCount}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {rule.lastTriggered ? formatRelativeTime(rule.lastTriggered) : '从未'}
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.enabled} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出审计记录</DialogTitle>
            <DialogDescription>
              选择导出格式和时间范围
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>导出格式</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'json' | 'csv' | 'xlsx')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="xlsx">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Excel (XLSX)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>时间范围</Label>
              <Select value={exportRange} onValueChange={setExportRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">最近24小时</SelectItem>
                  <SelectItem value="7d">最近7天</SelectItem>
                  <SelectItem value="30d">最近30天</SelectItem>
                  <SelectItem value="90d">最近90天</SelectItem>
                  <SelectItem value="custom">自定义范围</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">预计导出记录数：</span>
                <span className="font-medium">{filteredRecords.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">预计文件大小：</span>
                <span className="font-medium">~{(filteredRecords.length * 0.5 / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              取消
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
