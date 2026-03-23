/**
 * CheckpointManagementPanel - 检查点管理面板
 * Story 4.11 - 检查点管理功能
 * 
 * 提供检查点列表、删除、保留标记、清理策略配置
 * 
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-04: 品牌色 #1E3A5F
 */

import { useState } from 'react'
import {
  Trash2,
  Pin,
  PinOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCheckpointStore,
  useAllCheckpoints,
  useCheckpointStats,
  useCleanupPolicy,
  useExpiredCheckpoints,
  useRetainedCheckpoints,
  type Checkpoint,
  type RetentionType,
} from '../hooks/useCheckpointStore'

// ==================== Types ====================

interface CheckpointManagementPanelProps {
  sessionId?: string
  onClose?: () => void
}

// ==================== Helper Functions ====================

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  
  return formatDate(timestamp)
}

function getStatusBadgeVariant(status: Checkpoint['status']): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'restored':
      return 'secondary'
    case 'archived':
      return 'outline'
    default:
      return 'default'
  }
}

function getStatusLabel(status: Checkpoint['status']): string {
  switch (status) {
    case 'active':
      return '活跃'
    case 'restored':
      return '已恢复'
    case 'archived':
      return '已归档'
    default:
      return status
  }
}

function getTypeLabel(type: Checkpoint['type']): string {
  switch (type) {
    case 'auto':
      return '自动'
    case 'manual':
      return '手动'
    case 'pre_action':
      return '操作前'
    default:
      return type
  }
}

// ==================== Components ====================

/**
 * 检查点卡片
 */
function CheckpointCard({
  checkpoint,
  onDelete,
  onMarkRetention,
  selected,
  onToggleSelect,
}: {
  checkpoint: Checkpoint
  onDelete: (id: string) => void
  onMarkRetention: (id: string, type: RetentionType, reason?: string, temporaryDays?: number) => void
  selected: boolean
  onToggleSelect: () => void
}) {
  const [showRetentionDialog, setShowRetentionDialog] = useState(false)
  const [retentionType, setRetentionType] = useState<RetentionType>(
    checkpoint.retention?.type || 'none'
  )
  const [temporaryDays, setTemporaryDays] = useState(7)
  const [retentionReason, setRetentionReason] = useState(checkpoint.retention?.reason || '')
  
  const handleRetention = () => {
    onMarkRetention(checkpoint.id, retentionType, retentionReason || undefined, temporaryDays)
    setShowRetentionDialog(false)
  }
  
  const handleRetentionTypeChange = (value: string) => {
    setRetentionType(value as RetentionType)
  }
  
  const canDelete = checkpoint.retention?.type !== 'permanent'
  
  return (
    <>
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
          selected ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* 选择框 */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 rounded border-gray-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
        />
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部 */}
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getStatusBadgeVariant(checkpoint.status)} className="text-xs">
              {getStatusLabel(checkpoint.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getTypeLabel(checkpoint.type)}
            </Badge>
            {checkpoint.retention?.type === 'permanent' && (
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                <Pin className="w-3 h-3 mr-1" />
                永久保留
              </Badge>
            )}
            {checkpoint.retention?.type === 'temporary' && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                临时保留
              </Badge>
            )}
          </div>
          
          {/* 时间 */}
          <div className="text-sm text-gray-500 mb-1">
            {formatRelativeTime(checkpoint.createdAt)}
          </div>
          
          {/* 消息预览 */}
          {checkpoint.messageSnapshot.lastMessageContent && (
            <p className="text-sm text-gray-700 truncate">
              {checkpoint.messageSnapshot.lastMessageContent}
            </p>
          )}
          
          {/* 标签 */}
          {checkpoint.label && (
            <p className="text-xs text-gray-400 mt-1">{checkpoint.label}</p>
          )}
          
          {/* 元数据 */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{checkpoint.messageSnapshot.messageIds.length} 条消息</span>
            {checkpoint.gitMetadata?.commitSha && (
              <span className="font-mono">
                Git: {checkpoint.gitMetadata.commitSha.slice(0, 7)}
              </span>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRetentionDialog(true)}
            title="设置保留"
          >
            {checkpoint.retention?.type === 'permanent' ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(checkpoint.id)}
            disabled={!canDelete}
            title={canDelete ? '删除' : '永久保留的检查点不能删除'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* 保留设置对话框 */}
      <Dialog open={showRetentionDialog} onOpenChange={setShowRetentionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>设置检查点保留</DialogTitle>
            <DialogDescription>
              选择此检查点的保留策略
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm">保留类型</span>
              <Select
                value={retentionType}
                onValueChange={handleRetentionTypeChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无保留</SelectItem>
                  <SelectItem value="temporary">临时保留</SelectItem>
                  <SelectItem value="permanent">永久保留</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {retentionType === 'temporary' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm">保留天数</span>
                <div className="col-span-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={temporaryDays}
                    onChange={(e) => setTemporaryDays(parseInt(e.target.value) || 7)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    min={1}
                    max={90}
                  />
                  <span className="text-sm text-gray-500">天后自动解除保留</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm">原因</span>
              <input
                type="text"
                value={retentionReason}
                onChange={(e) => setRetentionReason(e.target.value)}
                placeholder="可选：保留原因"
                className="col-span-3 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetentionDialog(false)}>
              取消
            </Button>
            <Button onClick={handleRetention}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 清理策略配置
 */
function CleanupPolicyConfig() {
  const cleanupPolicy = useCleanupPolicy()
  const { setCleanupPolicy, runCleanup } = useCheckpointStore()
  const [isOpen, setIsOpen] = useState(false)
  
  const expiredCheckpoints = useExpiredCheckpoints()
  const stats = useCheckpointStats()
  
  const handleRunCleanup = () => {
    const result = runCleanup()
    alert(`清理完成：删除 ${result.deleted.length} 个，保留 ${result.retained.length} 个`)
  }
  
  return (
    <div className="border rounded-lg">
      <button
        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="font-medium">清理策略配置</span>
          {stats.expired > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {stats.expired} 个待清理
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t bg-gray-50">
          <div className="grid gap-4">
            {/* 启用自动清理 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">启用自动清理</div>
                <div className="text-sm text-gray-500">定期清理过期的检查点</div>
              </div>
              <Switch
                checked={cleanupPolicy.enabled}
                onCheckedChange={(checked) => setCleanupPolicy({ enabled: checked })}
              />
            </div>
            
            {/* 保留天数 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">保留天数</div>
                <div className="text-sm text-gray-500">超过此天数的检查点将被清理</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cleanupPolicy.retentionDays}
                  onChange={(e) => setCleanupPolicy({ retentionDays: parseInt(e.target.value) || 30 })}
                  className="w-20 px-2 py-1 border rounded text-center"
                  min={1}
                  max={365}
                />
                <span className="text-sm text-gray-500">天</span>
              </div>
            </div>
            
            {/* 最大数量 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">最大检查点数量</div>
                <div className="text-sm text-gray-500">超过此数量将删除最旧的</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cleanupPolicy.maxTotalCheckpoints}
                  onChange={(e) => setCleanupPolicy({ maxTotalCheckpoints: parseInt(e.target.value) || 100 })}
                  className="w-20 px-2 py-1 border rounded text-center"
                  min={10}
                  max={1000}
                />
                <span className="text-sm text-gray-500">个</span>
              </div>
            </div>
            
            {/* 清理已恢复的 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">清理已恢复的检查点</div>
                <div className="text-sm text-gray-500">已恢复的检查点也参与清理</div>
              </div>
              <Switch
                checked={cleanupPolicy.cleanupRestored}
                onCheckedChange={(checked) => setCleanupPolicy({ cleanupRestored: checked })}
              />
            </div>
            
            {/* 清理间隔 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">清理间隔</div>
                <div className="text-sm text-gray-500">自动清理的间隔天数</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cleanupPolicy.cleanupIntervalDays}
                  onChange={(e) => setCleanupPolicy({ cleanupIntervalDays: parseInt(e.target.value) || 7 })}
                  className="w-20 px-2 py-1 border rounded text-center"
                  min={1}
                  max={30}
                />
                <span className="text-sm text-gray-500">天</span>
              </div>
            </div>
            
            {/* 上次清理时间 */}
            {cleanupPolicy.lastCleanupAt && (
              <div className="text-sm text-gray-500">
                上次清理：{formatDate(cleanupPolicy.lastCleanupAt)}
              </div>
            )}
            
            {/* 手动清理按钮 */}
            <Button
              variant="outline"
              onClick={handleRunCleanup}
              disabled={expiredCheckpoints.length === 0}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              立即执行清理 ({expiredCheckpoints.length} 个过期)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 检查点管理面板
 */
export function CheckpointManagementPanel({
  sessionId,
  onClose,
}: CheckpointManagementPanelProps) {
  const allCheckpoints = useAllCheckpoints()
  const stats = useCheckpointStats()
  const retainedCheckpoints = useRetainedCheckpoints()
  
  const { deleteCheckpoint, batchDeleteCheckpoints, markRetention } = useCheckpointStore()
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRetention, setFilterRetention] = useState<string>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // 过滤检查点
  const filteredCheckpoints = allCheckpoints.filter(cp => {
    if (sessionId && cp.sessionId !== sessionId) return false
    if (filterStatus !== 'all' && cp.status !== filterStatus) return false
    if (filterRetention === 'retained' && !cp.retention?.type) return false
    if (filterRetention === 'none' && cp.retention?.type) return false
    return true
  })
  
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }
  
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCheckpoints.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCheckpoints.map(cp => cp.id)))
    }
  }
  
  const handleBatchDelete = () => {
    const result = batchDeleteCheckpoints(Array.from(selectedIds))
    setSelectedIds(new Set())
    setShowDeleteConfirm(false)
    
    if (result.retained.length > 0) {
      alert(`删除 ${result.deleted.length} 个检查点，${result.retained.length} 个因保留标记未被删除`)
    }
  }
  
  const handleDelete = (id: string) => {
    const success = deleteCheckpoint(id)
    if (!success) {
      alert('无法删除此检查点：已被标记为永久保留')
    }
  }
  
  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value)
  }
  
  const handleFilterRetentionChange = (value: string) => {
    setFilterRetention(value)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 头部统计 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-6 gap-2 text-center">
          <div className="p-2 rounded bg-white border">
            <div className="text-2xl font-bold text-[#1E3A5F]">{stats.total}</div>
            <div className="text-xs text-gray-500">总计</div>
          </div>
          <div className="p-2 rounded bg-white border">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-500">活跃</div>
          </div>
          <div className="p-2 rounded bg-white border">
            <div className="text-2xl font-bold text-blue-600">{stats.restored}</div>
            <div className="text-xs text-gray-500">已恢复</div>
          </div>
          <div className="p-2 rounded bg-white border">
            <div className="text-2xl font-bold text-gray-400">{stats.archived}</div>
            <div className="text-xs text-gray-500">已归档</div>
          </div>
          <div className="p-2 rounded bg-white border">
            <div className="text-2xl font-bold text-amber-600">{stats.retained}</div>
            <div className="text-xs text-gray-500">已保留</div>
          </div>
          <div className="p-2 rounded bg-white border">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-xs text-gray-500">已过期</div>
          </div>
        </div>
      </div>
      
      {/* 筛选和批量操作 */}
      <div className="p-4 border-b flex items-center gap-4">
        {/* 状态筛选 */}
        <Select value={filterStatus} onValueChange={handleFilterStatusChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="restored">已恢复</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
        
        {/* 保留筛选 */}
        <Select value={filterRetention} onValueChange={handleFilterRetentionChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="保留筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部保留</SelectItem>
            <SelectItem value="retained">已保留</SelectItem>
            <SelectItem value="none">未保留</SelectItem>
          </SelectContent>
        </Select>
        
        {/* 批量选择 */}
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {selectedIds.size === filteredCheckpoints.length ? '取消全选' : '全选'}
        </Button>
        
        {/* 批量删除 */}
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            删除选中 ({selectedIds.size})
          </Button>
        )}
      </div>
      
      {/* 清理策略配置 */}
      <div className="p-4 border-b">
        <CleanupPolicyConfig />
      </div>
      
      {/* 检查点列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCheckpoints.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>没有检查点</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCheckpoints.map(checkpoint => (
              <CheckpointCard
                key={checkpoint.id}
                checkpoint={checkpoint}
                onDelete={handleDelete}
                onMarkRetention={markRetention}
                selected={selectedIds.has(checkpoint.id)}
                onToggleSelect={() => toggleSelect(checkpoint.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 底部信息 */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 {allCheckpoints.length} 个检查点
          {retainedCheckpoints.length > 0 && ` · ${retainedCheckpoints.length} 个已保留`}
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        )}
      </div>
      
      {/* 批量删除确认对话框 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除选中的 {selectedIds.size} 个检查点吗？
              <br />
              永久保留的检查点将不会被删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CheckpointManagementPanel
