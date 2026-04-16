import React, { useState, useMemo } from 'react'
import {
  Database,
  Search,
  Edit,
  Trash2,
  Download,
  Upload,
  Clock,
  User,
  Building,
  Globe,
  Lock,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  FileText,
  History,
  Shield,
  Copy,
  Archive,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Memory Data Management Types
export type MemoryType = 'session' | 'preference' | 'knowledge' | 'correction' | 'audit'
export type MemoryScopeLevel = 'private' | 'user' | 'team' | 'tenant' | 'global'
export type MemoryDataType = 'text' | 'json' | 'embedding' | 'reference'
export type DataMemoryStatus = 'active' | 'expired' | 'archived' | 'pending_delete'
export type ChangeType = 'create' | 'update' | 'delete' | 'archive' | 'restore'

export interface MemoryRecord {
  id: string
  type: MemoryType
  scope: MemoryScopeLevel
  dataType: MemoryDataType
  status: DataMemoryStatus
  key: string
  value: string
  confidence: number
  source: string
  owner: string
  tenantId: string
  createdAt: number
  updatedAt: number
  expiresAt?: number
  accessCount: number
  lastAccessedAt?: number
  metadata?: Record<string, unknown>
}

export interface MemoryChangeHistory {
  id: string
  recordId: string
  changeType: ChangeType
  oldValue?: string
  newValue?: string
  changedBy: string
  changedAt: number
  reason?: string
}

export interface DataMemoryStats {
  totalRecords: number
  activeRecords: number
  byType: Record<MemoryType, number>
  byScope: Record<MemoryScopeLevel, number>
  totalSize: number
  lastBackup?: number
  expiringSoon: number
}

// Mock Data
const mockMemoryRecords: MemoryRecord[] = [
  {
    id: 'mem-001',
    type: 'session',
    scope: 'user',
    dataType: 'json',
    status: 'active',
    key: 'user.preferences.theme',
    value: '{"theme": "dark", "fontSize": 14}',
    confidence: 0.95,
    source: 'explicit',
    owner: 'user@example.com',
    tenantId: 'tenant-001',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000,
    accessCount: 156,
    lastAccessedAt: Date.now() - 3600,
  },
  {
    id: 'mem-002',
    type: 'preference',
    scope: 'user',
    dataType: 'text',
    status: 'active',
    key: 'user.code_style',
    value: 'Prefer TypeScript with strict mode enabled',
    confidence: 0.88,
    source: 'inferred',
    owner: 'user@example.com',
    tenantId: 'tenant-001',
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000,
    accessCount: 89,
    lastAccessedAt: Date.now() - 86400,
  },
  {
    id: 'mem-003',
    type: 'knowledge',
    scope: 'tenant',
    dataType: 'embedding',
    status: 'active',
    key: 'company.policy.security',
    value: 'Security policy document content...',
    confidence: 0.92,
    source: 'imported',
    owner: 'admin@company.com',
    tenantId: 'tenant-001',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    accessCount: 234,
    lastAccessedAt: Date.now() - 7200,
    expiresAt: Date.now() + 86400000 * 30,
  },
  {
    id: 'mem-004',
    type: 'correction',
    scope: 'team',
    dataType: 'json',
    status: 'active',
    key: 'correction.output_format_001',
    value: '{"rule": "Always include implementation steps"}',
    confidence: 0.85,
    source: 'extracted',
    owner: 'team-lead@example.com',
    tenantId: 'tenant-001',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000,
    accessCount: 45,
    lastAccessedAt: Date.now() - 14400,
  },
  {
    id: 'mem-005',
    type: 'session',
    scope: 'private',
    dataType: 'text',
    status: 'expired',
    key: 'session.temp_context',
    value: 'Temporary context data',
    confidence: 0.5,
    source: 'runtime',
    owner: 'user@example.com',
    tenantId: 'tenant-001',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    accessCount: 12,
    expiresAt: Date.now() - 3600,
  },
]

const mockChangeHistory: MemoryChangeHistory[] = [
  {
    id: 'chg-001',
    recordId: 'mem-001',
    changeType: 'update',
    oldValue: '{"theme": "light"}',
    newValue: '{"theme": "dark", "fontSize": 14}',
    changedBy: 'user@example.com',
    changedAt: Date.now() - 3600000,
    reason: 'User preference update',
  },
  {
    id: 'chg-002',
    recordId: 'mem-003',
    changeType: 'create',
    newValue: 'Security policy document content...',
    changedBy: 'admin@company.com',
    changedAt: Date.now() - 86400000 * 30,
    reason: 'Imported from company policy document',
  },
  {
    id: 'chg-003',
    recordId: 'mem-004',
    changeType: 'update',
    oldValue: '{"rule": "Basic output format"}',
    newValue: '{"rule": "Always include implementation steps"}',
    changedBy: 'team-lead@example.com',
    changedAt: Date.now() - 86400000,
    reason: 'Rule refinement based on feedback',
  },
]

const mockStats: DataMemoryStats = {
  totalRecords: 156,
  activeRecords: 142,
  byType: {
    session: 45,
    preference: 38,
    knowledge: 52,
    correction: 15,
    audit: 6,
  },
  byScope: {
    private: 12,
    user: 58,
    team: 28,
    tenant: 48,
    global: 10,
  },
  totalSize: 15728640,
  lastBackup: Date.now() - 86400000 * 2,
  expiringSoon: 5,
}

const typeColors: Record<MemoryType, string> = {
  session: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  preference: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  knowledge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  correction: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  audit: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

const scopeColors: Record<MemoryScopeLevel, string> = {
  private: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  user: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  team: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  tenant: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  global: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
}

const statusColors: Record<DataMemoryStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  pending_delete: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
}

const scopeIcons: Record<MemoryScopeLevel, React.ReactNode> = {
  private: <Lock className="h-3 w-3" />,
  user: <User className="h-3 w-3" />,
  team: <User className="h-3 w-3" />,
  tenant: <Building className="h-3 w-3" />,
  global: <Globe className="h-3 w-3" />,
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

export function MemoryDataManagement(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('records')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<MemoryType | 'all'>('all')
  const [selectedScope, setSelectedScope] = useState<MemoryScopeLevel | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<DataMemoryStatus | 'all'>('all')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(null)
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())

  // Filter records
  const filteredRecords = useMemo(() => {
    return mockMemoryRecords.filter((record) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!record.key.toLowerCase().includes(query) && !record.value.toLowerCase().includes(query)) {
          return false
        }
      }
      if (selectedType !== 'all' && record.type !== selectedType) return false
      if (selectedScope !== 'all' && record.scope !== selectedScope) return false
      if (selectedStatus !== 'all' && record.status !== selectedStatus) return false
      return true
    })
  }, [searchQuery, selectedType, selectedScope, selectedStatus])

  // Filter history for selected record
  const recordHistory = useMemo(() => {
    if (!selectedRecord) return []
    return mockChangeHistory.filter((h) => h.recordId === selectedRecord.id)
  }, [selectedRecord])

  // Handlers
  const handleEdit = (record: MemoryRecord) => {
    setSelectedRecord(record)
    setShowEditDialog(true)
  }

  const handleDelete = (_recordId: string) => {
    // Delete record
  }

  const handleExport = () => {
    // Export records
  }

  const handleBackup = () => {
    setShowBackupDialog(true)
  }

  const handleRestore = () => {
    // Restore from backup
  }

  const toggleExpand = (recordId: string) => {
    setExpandedRecords((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) {
        next.delete(recordId)
      } else {
        next.add(recordId)
      }
      return next
    })
  }

  const handleViewHistory = (record: MemoryRecord) => {
    setSelectedRecord(record)
    setShowHistoryDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">记忆数据管理</h2>
          <p className="text-muted-foreground">管理记忆条目、查看历史、导出备份</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRestore}>
            <Upload className="h-4 w-4 mr-2" />
            恢复备份
          </Button>
          <Button variant="outline" size="sm" onClick={handleBackup}>
            <Archive className="h-4 w-4 mr-2" />
            创建备份
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--ao-button.background)]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalRecords}</p>
                <p className="text-sm text-muted-foreground">总记录数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.activeRecords}</p>
                <p className="text-sm text-muted-foreground">活跃记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.expiringSoon}</p>
                <p className="text-sm text-muted-foreground">即将过期</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatBytes(mockStats.totalSize)}</p>
                <p className="text-sm text-muted-foreground">存储使用</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">
                  {mockStats.lastBackup ? formatTimeAgo(mockStats.lastBackup) : '无'}
                </p>
                <p className="text-sm text-muted-foreground">上次备份</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="records">记忆记录</TabsTrigger>
          <TabsTrigger value="history">变更历史</TabsTrigger>
          <TabsTrigger value="analytics">统计分析</TabsTrigger>
        </TabsList>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索记录..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as MemoryType | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="session">会话</SelectItem>
                    <SelectItem value="preference">偏好</SelectItem>
                    <SelectItem value="knowledge">知识</SelectItem>
                    <SelectItem value="correction">纠正</SelectItem>
                    <SelectItem value="audit">审计</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as MemoryScopeLevel | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部范围</SelectItem>
                    <SelectItem value="private">私有</SelectItem>
                    <SelectItem value="user">用户</SelectItem>
                    <SelectItem value="team">团队</SelectItem>
                    <SelectItem value="tenant">租户</SelectItem>
                    <SelectItem value="global">全局</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as DataMemoryStatus | 'all')}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="expired">已过期</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                    <SelectItem value="pending_delete">待删除</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Records List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredRecords.map((record) => {
                const isExpanded = expandedRecords.has(record.id)
                return (
                  <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={typeColors[record.type]}>{record.type}</Badge>
                            <div className="flex items-center gap-1">
                              {scopeIcons[record.scope]}
                              <Badge className={scopeColors[record.scope]}>{record.scope}</Badge>
                            </div>
                            <Badge className={statusColors[record.status]}>{record.status}</Badge>
                            <span className="font-medium text-sm">{record.key}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.owner}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(record.updatedAt)}
                            </span>
                            <span>访问: {record.accessCount}次</span>
                            <span>置信度: {(record.confidence * 100).toFixed(0)}%</span>
                            {record.expiresAt && (
                              <span className={record.expiresAt < Date.now() ? 'text-red-500' : ''}>
                                {record.expiresAt < Date.now() ? '已过期' : `${formatTimeAgo(record.expiresAt)}后过期`}
                              </span>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <p className="text-muted-foreground mb-1">值:</p>
                              <pre className="whitespace-pre-wrap break-all">{record.value}</pre>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleExpand(record.id)}>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewHistory(record)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEdit(record)}>
                                <Edit className="h-4 w-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewHistory(record)}>
                                <History className="h-4 w-4 mr-2" />
                                查看历史
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                复制
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(record.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-[450px]">
            <div className="space-y-2">
              {mockChangeHistory.map((change) => (
                <Card key={change.id}>
                  <CardContent className="pt-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{change.changeType}</Badge>
                          <span className="text-sm text-muted-foreground">记录: {change.recordId}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {change.oldValue && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">旧值</p>
                              <p className="bg-red-50 dark:bg-red-950 p-2 rounded line-clamp-2">{change.oldValue}</p>
                            </div>
                          )}
                          {change.newValue && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">新值</p>
                              <p className="bg-green-50 dark:bg-green-950 p-2 rounded line-clamp-2">{change.newValue}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>操作者: {change.changedBy}</span>
                          <span>{new Date(change.changedAt).toLocaleString()}</span>
                          {change.reason && <span>原因: {change.reason}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockStats.byType).map(([type, count]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={typeColors[type as MemoryType]}>{type}</Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress value={(count / mockStats.totalRecords) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按范围分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockStats.byScope).map(([scope, count]) => (
                    <div key={scope} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          {scopeIcons[scope as MemoryScopeLevel]}
                          <Badge className={scopeColors[scope as MemoryScopeLevel]}>{scope}</Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress value={(count / mockStats.totalRecords) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">存储统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{formatBytes(mockStats.totalSize)}</p>
                    <p className="text-sm text-muted-foreground">总存储使用</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">平均记录大小</p>
                      <p className="font-medium">{formatBytes(mockStats.totalSize / mockStats.totalRecords)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">活跃记录占比</p>
                      <p className="font-medium">{((mockStats.activeRecords / mockStats.totalRecords) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ownership */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">所有权边界</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">租户隔离</p>
                      <p className="text-sm text-muted-foreground">数据按租户隔离存储</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">权限控制</p>
                      <p className="text-sm text-muted-foreground">按范围级别控制访问权限</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">变更追踪</p>
                      <p className="text-sm text-muted-foreground">所有变更记录可审计</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑记忆记录</DialogTitle>
            <DialogDescription>修改记忆记录的值和属性</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <Input value={selectedRecord.key} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">值</label>
                <Textarea defaultValue={selectedRecord.value} rows={5} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">置信度</label>
                  <Input type="number" defaultValue={selectedRecord.confidence} step={0.01} min={0} max={1} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">过期时间</label>
                  <Input type="datetime-local" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">修改原因</label>
                <Input placeholder="输入修改原因..." />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>变更历史</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">{selectedRecord.key}</p>
                <p className="text-xs text-muted-foreground">记录ID: {selectedRecord.id}</p>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {recordHistory.length > 0 ? (
                    recordHistory.map((change) => (
                      <div key={change.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{change.changeType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(change.changedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">操作者: {change.changedBy}</p>
                        {change.reason && <p className="text-xs mt-1">原因: {change.reason}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">暂无变更历史</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>创建备份</DialogTitle>
            <DialogDescription>导出记忆数据备份</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">备份范围</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部数据</SelectItem>
                    <SelectItem value="active">仅活跃数据</SelectItem>
                    <SelectItem value="user">仅用户数据</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">格式</label>
                <Select defaultValue="json">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm">备份将包含敏感数据，请妥善保管</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
