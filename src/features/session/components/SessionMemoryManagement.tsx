import React, { useState, useMemo } from 'react'
import {
  Brain,
  Clock,
  Database,
  Trash2,
  RefreshCw,
  Save,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  FileText,
  Tag,
  User,
  Building,
  Shield,
  Archive,
  RotateCcw,
  Download,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Memory Entry Types
export type MemoryScope = 'session' | 'user' | 'tenant' | 'enterprise'
export type MemorySource = 'extracted' | 'manual' | 'imported' | 'inferred'
export type MemoryStatus = 'active' | 'archived' | 'expired' | 'pending_review'
export type MemoryConfidence = 'high' | 'medium' | 'low'

export interface MemoryEntry {
  id: string
  key: string
  value: string
  scope: MemoryScope
  source: MemorySource
  status: MemoryStatus
  confidence: MemoryConfidence
  tags: string[]
  createdAt: number
  updatedAt: number
  expiresAt?: number
  lastAccessedAt: number
  accessCount: number
  sessionId?: string
  userId?: string
  tenantId?: string
  metadata?: Record<string, unknown>
}

export interface MemoryStats {
  totalEntries: number
  activeEntries: number
  archivedEntries: number
  pendingReview: number
  byScope: Record<MemoryScope, number>
  bySource: Record<MemorySource, number>
  storageUsed: number
  storageLimit: number
}

export interface MemoryAuditLog {
  id: string
  action: 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'access'
  entryId: string
  entryKey: string
  oldValue?: string
  newValue?: string
  actor: string
  actorType: 'user' | 'system' | 'agent'
  timestamp: number
  reason?: string
}

// Mock Data
const mockMemoryEntries: MemoryEntry[] = [
  {
    id: '1',
    key: 'user_preference_theme',
    value: 'dark_mode_enabled',
    scope: 'user',
    source: 'extracted',
    status: 'active',
    confidence: 'high',
    tags: ['preference', 'ui'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000,
    lastAccessedAt: Date.now() - 1800000,
    accessCount: 42,
    userId: 'user-001',
  },
  {
    id: '2',
    key: 'project_context_main',
    value: 'Working on AI-Automated-office project with React + Tauri stack',
    scope: 'session',
    source: 'extracted',
    status: 'active',
    confidence: 'high',
    tags: ['project', 'context'],
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 1800000,
    lastAccessedAt: Date.now() - 60000,
    accessCount: 15,
    sessionId: 'session-001',
  },
  {
    id: '3',
    key: 'company_policy_vacation',
    value: 'Annual leave requires 7 days advance notice',
    scope: 'tenant',
    source: 'imported',
    status: 'active',
    confidence: 'high',
    tags: ['policy', 'hr'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    lastAccessedAt: Date.now() - 86400000,
    accessCount: 8,
    tenantId: 'tenant-001',
  },
  {
    id: '4',
    key: 'api_key_reminder',
    value: 'User prefers to store API keys in environment variables',
    scope: 'user',
    source: 'manual',
    status: 'active',
    confidence: 'medium',
    tags: ['security', 'preference'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
    lastAccessedAt: Date.now() - 86400000,
    accessCount: 5,
    userId: 'user-001',
  },
  {
    id: '5',
    key: 'deprecated_config',
    value: 'Old configuration format - needs review',
    scope: 'session',
    source: 'inferred',
    status: 'pending_review',
    confidence: 'low',
    tags: ['config', 'deprecated'],
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 14,
    lastAccessedAt: Date.now() - 86400000 * 10,
    accessCount: 2,
    sessionId: 'session-002',
    expiresAt: Date.now() + 86400000 * 7,
  },
]

const mockStats: MemoryStats = {
  totalEntries: 156,
  activeEntries: 142,
  archivedEntries: 10,
  pendingReview: 4,
  byScope: {
    session: 45,
    user: 68,
    tenant: 28,
    enterprise: 15,
  },
  bySource: {
    extracted: 89,
    manual: 32,
    imported: 20,
    inferred: 15,
  },
  storageUsed: 2.4,
  storageLimit: 10,
}

const mockAuditLogs: MemoryAuditLog[] = [
  {
    id: 'a1',
    action: 'create',
    entryId: '1',
    entryKey: 'user_preference_theme',
    newValue: 'dark_mode_enabled',
    actor: 'Agent-001',
    actorType: 'agent',
    timestamp: Date.now() - 3600000,
    reason: 'Extracted from user conversation',
  },
  {
    id: 'a2',
    action: 'update',
    entryId: '2',
    entryKey: 'project_context_main',
    oldValue: 'Working on React project',
    newValue: 'Working on AI-Automated-office project with React + Tauri stack',
    actor: 'user-001',
    actorType: 'user',
    timestamp: Date.now() - 1800000,
    reason: 'Manual update via memory panel',
  },
  {
    id: 'a3',
    action: 'archive',
    entryId: '5',
    entryKey: 'deprecated_config',
    actor: 'System',
    actorType: 'system',
    timestamp: Date.now() - 86400000,
    reason: 'Low confidence and no recent access',
  },
]

const scopeColors: Record<MemoryScope, string> = {
  session: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  tenant: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

const sourceColors: Record<MemorySource, string> = {
  extracted: 'bg-cyan-100 text-cyan-800',
  manual: 'bg-amber-100 text-amber-800',
  imported: 'bg-indigo-100 text-indigo-800',
  inferred: 'bg-rose-100 text-rose-800',
}

const confidenceColors: Record<MemoryConfidence, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600',
}

const statusColors: Record<MemoryStatus, string> = {
  active: 'bg-green-500',
  archived: 'bg-gray-500',
  expired: 'bg-red-500',
  pending_review: 'bg-yellow-500',
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

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

export function SessionMemoryManagement(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('entries')
  const [entries, setEntries] = useState<MemoryEntry[]>(mockMemoryEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScope, setSelectedScope] = useState<MemoryScope | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<MemoryStatus | 'all'>('all')
  const [showExpired, setShowExpired] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MemoryEntry | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !entry.key.toLowerCase().includes(query) &&
          !entry.value.toLowerCase().includes(query) &&
          !entry.tags.some((tag) => tag.toLowerCase().includes(query))
        ) {
          return false
        }
      }
      if (selectedScope !== 'all' && entry.scope !== selectedScope) return false
      if (selectedStatus !== 'all' && entry.status !== selectedStatus) return false
      if (!showExpired && entry.status === 'expired') return false
      return true
    })
  }, [entries, searchQuery, selectedScope, selectedStatus, showExpired])

  // Handlers
  const handleArchiveEntry = (entryId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: 'archived' as MemoryStatus } : e))
    )
  }

  const handleRestoreEntry = (entryId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: 'active' as MemoryStatus } : e))
    )
  }

  const handleDeleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  const handleViewEntry = (entry: MemoryEntry) => {
    setSelectedEntry(entry)
    setShowDetailDialog(true)
  }

  const handleEditEntry = (entry: MemoryEntry) => {
    setEditingEntry({ ...entry })
    setShowEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (editingEntry) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id ? { ...editingEntry, updatedAt: Date.now() } : e
        )
      )
      setShowEditDialog(false)
      setEditingEntry(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">会话记忆管理</h2>
          <p className="text-muted-foreground">管理会话上下文和提取的知识事实</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出记忆
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            配置策略
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--ao-button.background)]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalEntries}</p>
                <p className="text-sm text-muted-foreground">总记忆条目</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.activeEntries}</p>
                <p className="text-sm text-muted-foreground">活跃条目</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.archivedEntries}</p>
                <p className="text-sm text-muted-foreground">已归档</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.pendingReview}</p>
                <p className="text-sm text-muted-foreground">待审核</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">存储空间使用</span>
            <span className="text-sm text-muted-foreground">
              {mockStats.storageUsed} MB / {mockStats.storageLimit} MB
            </span>
          </div>
          <Progress value={(mockStats.storageUsed / mockStats.storageLimit) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entries">记忆条目</TabsTrigger>
          <TabsTrigger value="byScope">按范围统计</TabsTrigger>
          <TabsTrigger value="audit">审计日志</TabsTrigger>
        </TabsList>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索记忆键、值或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedScope}
              onValueChange={(v) => setSelectedScope(v as MemoryScope | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部范围</SelectItem>
                <SelectItem value="session">会话</SelectItem>
                <SelectItem value="user">用户</SelectItem>
                <SelectItem value="tenant">租户</SelectItem>
                <SelectItem value="enterprise">企业</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as MemoryStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
                <SelectItem value="pending_review">待审核</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                checked={showExpired}
                onCheckedChange={setShowExpired}
                id="show-expired"
              />
              <label htmlFor="show-expired" className="text-sm">
                显示过期
              </label>
            </div>
          </div>

          {/* Entries List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-2 h-2 rounded-full ${statusColors[entry.status]}`}
                          />
                          <span className="font-mono font-medium">{entry.key}</span>
                          <Badge className={scopeColors[entry.scope]}>{entry.scope}</Badge>
                          <Badge className={sourceColors[entry.source]}>{entry.source}</Badge>
                          <span className={`text-sm ${confidenceColors[entry.confidence]}`}>
                            置信度: {entry.confidence}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {entry.value}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {entry.tags.join(', ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            更新于 {formatTimeAgo(entry.updatedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            访问 {entry.accessCount} 次
                          </span>
                          {entry.expiresAt && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <AlertTriangle className="h-3 w-3" />
                              {entry.expiresAt > Date.now() ? '将过期' : '已过期'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {entry.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveEntry(entry.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        ) : entry.status === 'archived' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreEntry(entry.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* By Scope Tab */}
        <TabsContent value="byScope" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Scope Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按范围分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(Object.entries(mockStats.byScope) as [MemoryScope, number][]).map(
                    ([scope, count]) => (
                      <div key={scope} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={scopeColors[scope]}>{scope}</Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress
                          value={(count / mockStats.totalEntries) * 100}
                          className="h-2"
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按来源分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(Object.entries(mockStats.bySource) as [MemorySource, number][]).map(
                    ([source, count]) => (
                      <div key={source} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={sourceColors[source]}>{source}</Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress
                          value={(count / mockStats.totalEntries) * 100}
                          className="h-2"
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Memory Continuity Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">记忆连续性</CardTitle>
              <CardDescription>会话恢复时记忆状态的连续性显示</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>会话上下文已恢复</span>
                  </div>
                  <span className="text-sm text-muted-foreground">45 条目已加载</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    <span>用户偏好记忆已应用</span>
                  </div>
                  <span className="text-sm text-muted-foreground">68 条目可用</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-500" />
                    <span>租户知识库已连接</span>
                  </div>
                  <span className="text-sm text-muted-foreground">28 条目已同步</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">记忆操作审计日志</CardTitle>
              <CardDescription>追踪所有记忆创建、更新、删除和访问操作</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {mockAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          log.action === 'create'
                            ? 'bg-green-100'
                            : log.action === 'update'
                              ? 'bg-blue-100'
                              : log.action === 'delete'
                                ? 'bg-red-100'
                                : log.action === 'archive'
                                  ? 'bg-gray-100'
                                  : 'bg-yellow-100'
                        }`}
                      >
                        {log.action === 'create' && <Save className="h-4 w-4 text-green-600" />}
                        {log.action === 'update' && (
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                        )}
                        {log.action === 'delete' && <Trash2 className="h-4 w-4 text-red-600" />}
                        {log.action === 'archive' && <Archive className="h-4 w-4 text-gray-600" />}
                        {log.action === 'restore' && (
                          <RotateCcw className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{log.action}</span>
                          <code className="text-sm bg-muted px-1 rounded">{log.entryKey}</code>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        {log.oldValue && log.newValue && (
                          <div className="text-sm space-y-1 mb-2">
                            <div className="text-red-600 line-through">{log.oldValue}</div>
                            <div className="text-green-600">{log.newValue}</div>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {log.actorType === 'user' && <User className="h-3 w-3" />}
                            {log.actorType === 'system' && <Shield className="h-3 w-3" />}
                            {log.actorType === 'agent' && <Brain className="h-3 w-3" />}
                            {log.actor}
                          </span>
                          {log.reason && <span>原因: {log.reason}</span>}
                        </div>
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
            <DialogTitle>记忆详情</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">键</label>
                  <p className="font-mono">{selectedEntry.key}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[selectedEntry.status]}`} />
                    {selectedEntry.status}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">范围</label>
                  <Badge className={scopeColors[selectedEntry.scope]}>{selectedEntry.scope}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">来源</label>
                  <Badge className={sourceColors[selectedEntry.source]}>
                    {selectedEntry.source}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">置信度</label>
                  <span className={confidenceColors[selectedEntry.confidence]}>
                    {selectedEntry.confidence}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">访问次数</label>
                  <span>{selectedEntry.accessCount}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">值</label>
                <p className="p-3 bg-muted rounded-md">{selectedEntry.value}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">标签</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEntry.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">创建时间</label>
                  <p>{formatTimestamp(selectedEntry.createdAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">更新时间</label>
                  <p>{formatTimestamp(selectedEntry.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">最后访问</label>
                  <p>{formatTimestamp(selectedEntry.lastAccessedAt)}</p>
                </div>
              </div>
              {selectedEntry.expiresAt && (
                <div className="text-orange-500 text-sm">
                  过期时间: {formatTimestamp(selectedEntry.expiresAt)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑记忆</DialogTitle>
            <DialogDescription>修改记忆条目的值和属性</DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">键</label>
                <Input value={editingEntry.key} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">值</label>
                <Input
                  value={editingEntry.value}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, value: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">置信度</label>
                <Select
                  value={editingEntry.confidence}
                  onValueChange={(v) =>
                    setEditingEntry({
                      ...editingEntry,
                      confidence: v as MemoryConfidence,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">标签（逗号分隔）</label>
                <Input
                  value={editingEntry.tags.join(', ')}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      tags: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
