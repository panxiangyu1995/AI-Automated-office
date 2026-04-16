/**
 * OperationBlacklist - 操作黑名单管理组件
 * Story 5.10 - 操作黑名单管理
 */
import { useState, useCallback } from 'react'
import {
  Ban,
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  User,
  Building,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const BRAND_COLOR = 'var(--ao-button.background)'

// 黑名单范围
export type BlacklistScope = 'personal' | 'tenant'

// 黑名单状态
export type BlacklistStatus = 'active' | 'inactive' | 'expired'

// 黑名单条目
export interface BlacklistEntry {
  id: string
  scope: BlacklistScope
  toolId: string
  toolName: string
  operationPattern?: string      // 操作匹配模式
  reason: string                 // 加入黑名单的原因
  status: BlacklistStatus
  createdBy: {
    id: string
    name: string
  }
  createdAt: number
  expiresAt?: number             // 过期时间（可选）
  auditTrail: AuditRecord[]
}

// 审计记录
export interface AuditRecord {
  id: string
  action: 'created' | 'modified' | 'removed' | 'blocked'
  timestamp: number
  actor: {
    id: string
    name: string
  }
  details?: string
}

// 黑名单配置
export interface BlacklistConfig {
  entries: BlacklistEntry[]
  globalEnabled: boolean
  notifyOnBlock: boolean
  logAllBlocks: boolean
}

// 范围配置
const SCOPE_CONFIG: Record<BlacklistScope, { label: string; icon: React.ReactNode; color: string }> = {
  personal: {
    label: '个人',
    icon: <User className="h-3 w-3" />,
    color: 'bg-blue-100 text-blue-700',
  },
  tenant: {
    label: '租户',
    icon: <Building className="h-3 w-3" />,
    color: 'bg-purple-100 text-purple-700',
  },
}

// 状态配置
const STATUS_CONFIG: Record<BlacklistStatus, { label: string; color: string }> = {
  active: {
    label: '生效中',
    color: 'bg-green-100 text-green-700',
  },
  inactive: {
    label: '已禁用',
    color: 'bg-gray-100 text-gray-700',
  },
  expired: {
    label: '已过期',
    color: 'bg-red-100 text-red-700',
  },
}

export interface OperationBlacklistProps {
  config: BlacklistConfig
  onUpdate?: (config: BlacklistConfig) => void
  onAddEntry?: (entry: Omit<BlacklistEntry, 'id' | 'createdAt' | 'auditTrail'>) => void
  onRemoveEntry?: (entryId: string) => void
  onModifyEntry?: (entryId: string, updates: Partial<BlacklistEntry>) => void
  readOnly?: boolean
}

export function OperationBlacklist({
  config,
  onUpdate,
  onAddEntry,
  onRemoveEntry,
  onModifyEntry,
  readOnly = false,
}: OperationBlacklistProps): React.ReactNode {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterScope, setFilterScope] = useState<BlacklistScope | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<BlacklistStatus | 'all'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null)

  // 新条目表单
  const [newEntry, setNewEntry] = useState({
    scope: 'personal' as BlacklistScope,
    toolId: '',
    toolName: '',
    operationPattern: '',
    reason: '',
    expiresAt: '',
  })

  const updateConfig = useCallback((updates: Partial<BlacklistConfig>) => {
    onUpdate?.({ ...config, ...updates })
  }, [config, onUpdate])

  const filteredEntries = config.entries.filter(entry => {
    const matchesSearch = entry.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.toolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesScope = filterScope === 'all' || entry.scope === filterScope
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus
    return matchesSearch && matchesScope && matchesStatus
  })

  const handleAddEntry = useCallback(() => {
    onAddEntry?.({
      scope: newEntry.scope,
      toolId: newEntry.toolId,
      toolName: newEntry.toolName || newEntry.toolId,
      operationPattern: newEntry.operationPattern || undefined,
      reason: newEntry.reason,
      status: 'active',
      createdBy: { id: 'current-user', name: '当前用户' },
      expiresAt: newEntry.expiresAt ? new Date(newEntry.expiresAt).getTime() : undefined,
    })
    setShowAddDialog(false)
    setNewEntry({
      scope: 'personal',
      toolId: '',
      toolName: '',
      operationPattern: '',
      reason: '',
      expiresAt: '',
    })
  }, [newEntry, onAddEntry])

  const handleDeleteEntry = useCallback(() => {
    if (selectedEntry) {
      onRemoveEntry?.(selectedEntry.id)
      setShowDeleteDialog(false)
      setSelectedEntry(null)
    }
  }, [selectedEntry, onRemoveEntry])

  const handleToggleStatus = useCallback((entry: BlacklistEntry) => {
    const newStatus = entry.status === 'active' ? 'inactive' : 'active'
    onModifyEntry?.(entry.id, { status: newStatus })
  }, [onModifyEntry])

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* 全局设置 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5" style={{ color: BRAND_COLOR }} />
              <div>
                <CardTitle className="text-base">操作黑名单管理</CardTitle>
                <CardDescription className="text-sm">
                  管理个人和租户级别的操作黑名单
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {config.entries.filter(e => e.status === 'active').length} 条生效中
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 全局开关 */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.globalEnabled}
                onCheckedChange={(checked) => updateConfig({ globalEnabled: checked })}
                disabled={readOnly}
              />
              <Label className="text-sm">启用黑名单</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.notifyOnBlock}
                onCheckedChange={(checked) => updateConfig({ notifyOnBlock: checked })}
                disabled={readOnly}
              />
              <Label className="text-sm">阻止时通知</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.logAllBlocks}
                onCheckedChange={(checked) => updateConfig({ logAllBlocks: checked })}
                disabled={readOnly}
              />
              <Label className="text-sm">记录所有阻止</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索和过滤 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索工具名称、ID 或原因..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterScope} onValueChange={(v) => setFilterScope(v as BlacklistScope | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部范围</SelectItem>
            <SelectItem value="personal">个人</SelectItem>
            <SelectItem value="tenant">租户</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as BlacklistStatus | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">生效中</SelectItem>
            <SelectItem value="inactive">已禁用</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
        {!readOnly && (
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            <Plus className="h-4 w-4" />
            添加条目
          </Button>
        )}
      </div>

      {/* 黑名单列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">状态</TableHead>
                <TableHead>工具</TableHead>
                <TableHead className="w-20">范围</TableHead>
                <TableHead>原因</TableHead>
                <TableHead className="w-36">创建时间</TableHead>
                <TableHead className="w-28">过期时间</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchQuery || filterScope !== 'all' || filterStatus !== 'all'
                      ? '没有找到匹配的黑名单条目'
                      : '暂无黑名单条目，点击上方"添加条目"按钮创建'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const scopeConfig = SCOPE_CONFIG[entry.scope]
                  const statusConfig = STATUS_CONFIG[entry.status]
                  const isExpired = Boolean(entry.expiresAt && entry.expiresAt < Date.now())

                  return (
                    <TableRow key={entry.id} className={cn(isExpired && 'opacity-50')}>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{entry.toolName}</div>
                          <div className="text-xs text-muted-foreground">{entry.toolId}</div>
                          {entry.operationPattern && (
                            <div className="text-xs text-muted-foreground mt-1">
                              模式: {entry.operationPattern}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs flex items-center gap-1 w-fit', scopeConfig.color)}>
                          {scopeConfig.icon}
                          {scopeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.reason}>
                        {entry.reason}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.expiresAt ? formatDate(entry.expiresAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleToggleStatus(entry)}
                                  disabled={readOnly || isExpired}
                                >
                                  {entry.status === 'active' ? (
                                    <Ban className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <Shield className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {entry.status === 'active' ? '禁用' : '启用'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setSelectedEntry(entry)
                                    setShowDeleteDialog(true)
                                  }}
                                  disabled={readOnly}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">删除</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 添加对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              添加黑名单条目
            </DialogTitle>
            <DialogDescription>
              创建新的操作黑名单条目，阻止特定工具的执行
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">范围</Label>
                <Select
                  value={newEntry.scope}
                  onValueChange={(v) => setNewEntry(prev => ({ ...prev, scope: v as BlacklistScope }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        个人
                      </div>
                    </SelectItem>
                    <SelectItem value="tenant">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        租户
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">过期时间（可选）</Label>
                <Input
                  type="datetime-local"
                  value={newEntry.expiresAt}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">工具 ID *</Label>
              <Input
                placeholder="输入要阻止的工具标识符"
                value={newEntry.toolId}
                onChange={(e) => setNewEntry(prev => ({ ...prev, toolId: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">工具名称</Label>
              <Input
                placeholder="工具显示名称（可选）"
                value={newEntry.toolName}
                onChange={(e) => setNewEntry(prev => ({ ...prev, toolName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">操作模式（可选）</Label>
              <Input
                placeholder="如: delete:* 或 write:/data/*"
                value={newEntry.operationPattern}
                onChange={(e) => setNewEntry(prev => ({ ...prev, operationPattern: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                使用通配符匹配特定操作，留空则阻止该工具的所有操作
              </p>
            </div>
            <div>
              <Label className="text-sm">阻止原因 *</Label>
              <Textarea
                placeholder="说明为什么将该工具加入黑名单..."
                value={newEntry.reason}
                onChange={(e) => setNewEntry(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddEntry}
              disabled={!newEntry.toolId || !newEntry.reason}
              style={{ backgroundColor: BRAND_COLOR }}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除黑名单条目 "{selectedEntry?.toolName}" 吗？删除后该工具将不再被阻止。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-red-500 hover:bg-red-600">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 创建默认黑名单配置
export function createDefaultBlacklistConfig(): BlacklistConfig {
  return {
    entries: [],
    globalEnabled: true,
    notifyOnBlock: true,
    logAllBlocks: true,
  }
}
