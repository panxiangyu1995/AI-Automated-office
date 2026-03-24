import React, { useState, useMemo } from 'react'
import {
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  GitMerge,
  Settings,
  Eye,
  AlertTriangle,
  Activity,
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
import { Textarea } from '@/components/ui/textarea'

// Memory Update Decision Types
export type UpdateAction = 'ADD' | 'UPDATE' | 'DELETE' | 'MERGE' | 'NONE'
export type ConflictResolution = 'overwrite' | 'merge' | 'skip' | 'ask_user' | 'priority'
export type UpdateSource = 'extraction' | 'manual' | 'correction' | 'system'
export type UpdateStatus = 'pending' | 'applied' | 'rejected' | 'conflict' | 'rolled_back'

export interface MemoryUpdateDecision {
  id: string
  action: UpdateAction
  status: UpdateStatus
  source: UpdateSource
  memoryKey: string
  extractedValue: string
  currentValue?: string
  resolvedValue?: string
  confidence: number
  reason: string
  conflictResolution?: ConflictResolution
  createdAt: number
  appliedAt?: number
  sessionId: string
  actor: string
  metadata?: Record<string, unknown>
}

export interface ConflictRule {
  id: string
  name: string
  description: string
  priority: number
  condition: string
  resolution: ConflictResolution
  enabled: boolean
}

export interface UpdateStats {
  totalDecisions: number
  appliedCount: number
  rejectedCount: number
  conflictCount: number
  pendingCount: number
  byAction: Record<UpdateAction, number>
  avgConfidence: number
}

// Mock Data
const mockDecisions: MemoryUpdateDecision[] = [
  {
    id: '1',
    action: 'ADD',
    status: 'applied',
    source: 'extraction',
    memoryKey: 'user_project_context',
    extractedValue: '用户正在开发AI-Automated-office项目',
    resolvedValue: '用户正在开发AI-Automated-office项目',
    confidence: 0.95,
    reason: '从对话中提取的新项目上下文信息',
    createdAt: Date.now() - 3600000,
    appliedAt: Date.now() - 3500000,
    sessionId: 'session-001',
    actor: 'Agent-001',
  },
  {
    id: '2',
    action: 'UPDATE',
    status: 'applied',
    source: 'extraction',
    memoryKey: 'user_code_style',
    extractedValue: 'TypeScript with strict mode',
    currentValue: 'TypeScript',
    resolvedValue: 'TypeScript with strict mode',
    confidence: 0.88,
    reason: '用户明确表示偏好严格模式',
    createdAt: Date.now() - 7200000,
    appliedAt: Date.now() - 7100000,
    sessionId: 'session-001',
    actor: 'Agent-001',
  },
  {
    id: '3',
    action: 'UPDATE',
    status: 'conflict',
    source: 'extraction',
    memoryKey: 'user_preferred_language',
    extractedValue: 'Rust',
    currentValue: 'TypeScript',
    confidence: 0.72,
    reason: '检测到可能的偏好变更，需要确认',
    conflictResolution: 'ask_user',
    createdAt: Date.now() - 1800000,
    sessionId: 'session-001',
    actor: 'Agent-001',
  },
  {
    id: '4',
    action: 'DELETE',
    status: 'pending',
    source: 'correction',
    memoryKey: 'deprecated_api_key_hint',
    extractedValue: '',
    currentValue: '旧API密钥存储提示',
    confidence: 0.99,
    reason: '用户明确表示信息已过期',
    createdAt: Date.now() - 900000,
    sessionId: 'session-002',
    actor: 'user-001',
  },
  {
    id: '5',
    action: 'MERGE',
    status: 'applied',
    source: 'extraction',
    memoryKey: 'user_workflow_preferences',
    extractedValue: '偏好自动化测试',
    currentValue: '偏好代码审查',
    resolvedValue: '偏好代码审查和自动化测试',
    confidence: 0.85,
    reason: '合并互补的工作流偏好',
    conflictResolution: 'merge',
    createdAt: Date.now() - 5400000,
    appliedAt: Date.now() - 5350000,
    sessionId: 'session-001',
    actor: 'Agent-001',
  },
  {
    id: '6',
    action: 'NONE',
    status: 'applied',
    source: 'extraction',
    memoryKey: 'user_theme_preference',
    extractedValue: 'dark mode',
    currentValue: 'dark mode',
    confidence: 0.99,
    reason: '值未变化，无需更新',
    createdAt: Date.now() - 10800000,
    appliedAt: Date.now() - 10750000,
    sessionId: 'session-003',
    actor: 'Agent-002',
  },
]

const mockConflictRules: ConflictRule[] = [
  {
    id: 'r1',
    name: '高置信度自动合并',
    description: '当置信度 > 0.9 时自动合并',
    priority: 1,
    condition: 'confidence > 0.9',
    resolution: 'merge',
    enabled: true,
  },
  {
    id: 'r2',
    name: '低置信度询问用户',
    description: '当置信度 < 0.7 时询问用户',
    priority: 2,
    condition: 'confidence < 0.7',
    resolution: 'ask_user',
    enabled: true,
  },
  {
    id: 'r3',
    name: '敏感键跳过',
    description: '对于敏感键跳过自动更新',
    priority: 3,
    condition: 'key in sensitive_keys',
    resolution: 'skip',
    enabled: true,
  },
  {
    id: 'r4',
    name: '优先级覆盖',
    description: '高优先级源覆盖低优先级',
    priority: 4,
    condition: 'source_priority > current_priority',
    resolution: 'overwrite',
    enabled: true,
  },
]

const mockStats: UpdateStats = {
  totalDecisions: 156,
  appliedCount: 142,
  rejectedCount: 5,
  conflictCount: 4,
  pendingCount: 5,
  byAction: {
    ADD: 45,
    UPDATE: 68,
    DELETE: 12,
    MERGE: 18,
    NONE: 13,
  },
  avgConfidence: 0.87,
}

const actionColors: Record<UpdateAction, string> = {
  ADD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  MERGE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  NONE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

const statusColors: Record<UpdateStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  applied: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  conflict: 'bg-orange-100 text-orange-800',
  rolled_back: 'bg-gray-100 text-gray-800',
}

const sourceColors: Record<UpdateSource, string> = {
  extraction: 'bg-cyan-100 text-cyan-800',
  manual: 'bg-amber-100 text-amber-800',
  correction: 'bg-rose-100 text-rose-800',
  system: 'bg-indigo-100 text-indigo-800',
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

export function MemoryUpdateDecisioning(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('decisions')
  const [decisions, setDecisions] = useState<MemoryUpdateDecision[]>(mockDecisions)
  const [conflictRules, setConflictRules] = useState<ConflictRule[]>(mockConflictRules)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<UpdateAction | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<UpdateStatus | 'all'>('all')
  const [selectedDecision, setSelectedDecision] = useState<MemoryUpdateDecision | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolveValue, setResolveValue] = useState('')

  // Filter decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((decision) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !decision.memoryKey.toLowerCase().includes(query) &&
          !decision.reason.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (selectedAction !== 'all' && decision.action !== selectedAction) return false
      if (selectedStatus !== 'all' && decision.status !== selectedStatus) return false
      return true
    })
  }, [decisions, searchQuery, selectedAction, selectedStatus])

  // Handlers
  const handleApproveDecision = (id: string) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: 'applied' as UpdateStatus, appliedAt: Date.now() }
          : d
      )
    )
  }

  const handleRejectDecision = (id: string) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'rejected' as UpdateStatus } : d
      )
    )
  }

  const handleResolveConflict = () => {
    if (selectedDecision) {
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === selectedDecision.id
            ? {
                ...d,
                status: 'applied' as UpdateStatus,
                resolvedValue: resolveValue,
                appliedAt: Date.now(),
              }
            : d
        )
      )
      setShowResolveDialog(false)
      setSelectedDecision(null)
      setResolveValue('')
    }
  }

  const handleToggleRule = (id: string) => {
    setConflictRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  const handleViewDecision = (decision: MemoryUpdateDecision) => {
    setSelectedDecision(decision)
    setShowDetailDialog(true)
  }

  const handleOpenResolveDialog = (decision: MemoryUpdateDecision) => {
    setSelectedDecision(decision)
    setResolveValue(decision.extractedValue)
    setShowResolveDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E3A5F]">记忆智能更新</h2>
          <p className="text-muted-foreground">智能决策ADD、UPDATE、DELETE和NONE操作</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            配置规则
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#1E3A5F]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalDecisions}</p>
                <p className="text-sm text-muted-foreground">总决策数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.appliedCount}</p>
                <p className="text-sm text-muted-foreground">已应用</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.rejectedCount}</p>
                <p className="text-sm text-muted-foreground">已拒绝</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.conflictCount}</p>
                <p className="text-sm text-muted-foreground">冲突待解</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.pendingCount}</p>
                <p className="text-sm text-muted-foreground">待处理</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">平均置信度</span>
            <span className="text-sm text-muted-foreground">
              {(mockStats.avgConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={mockStats.avgConfidence * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="decisions">更新决策</TabsTrigger>
          <TabsTrigger value="byAction">按操作分类</TabsTrigger>
          <TabsTrigger value="rules">冲突规则</TabsTrigger>
        </TabsList>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索记忆键或原因..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedAction}
              onValueChange={(v) => setSelectedAction(v as UpdateAction | 'all')}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部操作</SelectItem>
                <SelectItem value="ADD">ADD</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="MERGE">MERGE</SelectItem>
                <SelectItem value="NONE">NONE</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as UpdateStatus | 'all')}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="applied">已应用</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="conflict">冲突</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decisions List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredDecisions.map((decision) => (
                <Card key={decision.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={actionColors[decision.action]}>{decision.action}</Badge>
                          <Badge className={statusColors[decision.status]}>{decision.status}</Badge>
                          <Badge className={sourceColors[decision.source]}>{decision.source}</Badge>
                          <span className="font-mono font-medium">{decision.memoryKey}</span>
                          <span className="text-sm text-muted-foreground">
                            置信度: {(decision.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{decision.reason}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {decision.action === 'UPDATE' && decision.currentValue && (
                            <span>
                              当前值: <code className="bg-muted px-1 rounded">{decision.currentValue}</code>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(decision.createdAt)}
                          </span>
                          <span>会话: {decision.sessionId}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDecision(decision)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {decision.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveDecision(decision.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectDecision(decision.id)}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {decision.status === 'conflict' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenResolveDialog(decision)}
                          >
                            <GitMerge className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* By Action Tab */}
        <TabsContent value="byAction" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(mockStats.byAction) as [UpdateAction, number][]).map(
              ([action, count]) => (
                <Card key={action}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={actionColors[action]}>{action}</Badge>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      value={(count / mockStats.totalDecisions) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      占总决策的 {((count / mockStats.totalDecisions) * 100).toFixed(1)}%
                    </p>
                    <ScrollArea className="h-[150px] mt-3">
                      <div className="space-y-2">
                        {decisions
                          .filter((d) => d.action === action)
                          .slice(0, 5)
                          .map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                            >
                              <span className="font-mono truncate flex-1">{d.memoryKey}</span>
                              <Badge variant="outline" className="text-xs">
                                {d.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </TabsContent>

        {/* Conflict Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">冲突解决规则</CardTitle>
              <CardDescription>配置记忆更新时的冲突解决策略</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conflictRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="outline">优先级: {rule.priority}</Badge>
                        <Badge
                          className={
                            rule.resolution === 'merge'
                              ? 'bg-purple-100 text-purple-800'
                              : rule.resolution === 'overwrite'
                                ? 'bg-blue-100 text-blue-800'
                                : rule.resolution === 'skip'
                                  ? 'bg-gray-100 text-gray-800'
                                  : rule.resolution === 'ask_user'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-green-100 text-green-800'
                          }
                        >
                          {rule.resolution}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                        {rule.condition}
                      </code>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Rule Button */}
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            添加新规则
          </Button>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>决策详情</DialogTitle>
          </DialogHeader>
          {selectedDecision && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">操作</label>
                  <p>
                    <Badge className={actionColors[selectedDecision.action]}>
                      {selectedDecision.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <p>
                    <Badge className={statusColors[selectedDecision.status]}>
                      {selectedDecision.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">记忆键</label>
                  <p className="font-mono">{selectedDecision.memoryKey}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">来源</label>
                  <p>
                    <Badge className={sourceColors[selectedDecision.source]}>
                      {selectedDecision.source}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">置信度</label>
                  <p>{(selectedDecision.confidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">会话ID</label>
                  <p className="font-mono text-sm">{selectedDecision.sessionId}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">原因</label>
                <p className="p-3 bg-muted rounded-md">{selectedDecision.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">提取值</label>
                <p className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {selectedDecision.extractedValue}
                </p>
              </div>
              {selectedDecision.currentValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">当前值</label>
                  <p className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    {selectedDecision.currentValue}
                  </p>
                </div>
              )}
              {selectedDecision.resolvedValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">解决后值</label>
                  <p className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    {selectedDecision.resolvedValue}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">创建时间</label>
                  <p>{formatTimestamp(selectedDecision.createdAt)}</p>
                </div>
                {selectedDecision.appliedAt && (
                  <div>
                    <label className="text-muted-foreground">应用时间</label>
                    <p>{formatTimestamp(selectedDecision.appliedAt)}</p>
                  </div>
                )}
              </div>
              {selectedDecision.conflictResolution && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">冲突解决策略</span>
                  </div>
                  <p className="mt-1">{selectedDecision.conflictResolution}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Conflict Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>解决冲突</DialogTitle>
            <DialogDescription>选择如何解决此记忆更新冲突</DialogDescription>
          </DialogHeader>
          {selectedDecision && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">记忆键</label>
                <p className="font-mono">{selectedDecision.memoryKey}</p>
              </div>
              <div>
                <label className="text-sm font-medium">当前值</label>
                <p className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  {selectedDecision.currentValue}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">提取值</label>
                <p className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  {selectedDecision.extractedValue}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">解决后的值</label>
                <Textarea
                  value={resolveValue}
                  onChange={(e) => setResolveValue(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              取消
            </Button>
            <Button onClick={handleResolveConflict}>确认解决</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
