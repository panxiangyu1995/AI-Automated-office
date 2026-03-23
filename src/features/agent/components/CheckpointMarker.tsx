/**
 * CheckpointMarker - 检查点标记组件
 * Story 4.7 - 检查点自动创建
 * 
 * 在对话流中显示检查点标记，支持恢复到检查点
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-02: 品牌色 #1E3A5F
 * - UX-04: 对话驱动交互
 */

import { useState } from 'react'
import { Bookmark, RotateCcw, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  useSessionCheckpoints,
  useCheckpointStore,
  type Checkpoint, 
  type CheckpointType 
} from '../hooks/useCheckpointStore'

// ==================== Types ====================

interface CheckpointMarkerProps {
  checkpoint: Checkpoint
  onRestore?: (checkpoint: Checkpoint) => void
  onDelete?: (checkpointId: string) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

// ==================== Helper Functions ====================

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCheckpointTypeLabel(type: CheckpointType): string {
  const labels: Record<CheckpointType, string> = {
    auto: '自动检查点',
    manual: '手动检查点',
    pre_action: '操作前检查点',
  }
  return labels[type]
}

function getStatusLabel(status: Checkpoint['status']): string {
  const labels: Record<Checkpoint['status'], string> = {
    active: '有效',
    restored: '已恢复',
    archived: '已归档',
  }
  return labels[status]
}

function getStatusColor(status: Checkpoint['status']): string {
  const colors: Record<Checkpoint['status'], string> = {
    active: 'bg-green-100 text-green-700',
    restored: 'bg-blue-100 text-blue-700',
    archived: 'bg-slate-100 text-slate-500',
  }
  return colors[status]
}

// ==================== Component ====================

export function CheckpointMarker({
  checkpoint,
  onRestore,
  onDelete,
  isExpanded = false,
  onToggleExpand,
}: CheckpointMarkerProps) {
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  
  const handleRestore = () => {
    if (showConfirmRestore) {
      onRestore?.(checkpoint)
      setShowConfirmRestore(false)
    } else {
      setShowConfirmRestore(true)
      setShowConfirmDelete(false)
    }
  }
  
  const handleDelete = () => {
    if (showConfirmDelete) {
      onDelete?.(checkpoint.id)
      setShowConfirmDelete(false)
    } else {
      setShowConfirmDelete(true)
      setShowConfirmRestore(false)
    }
  }
  
  const handleCancel = () => {
    setShowConfirmRestore(false)
    setShowConfirmDelete(false)
  }
  
  return (
    <div className="my-2">
      {/* Main Marker */}
      <div 
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={onToggleExpand}
      >
        <Bookmark 
          size={12} 
          style={{ color: '#1E3A5F' }}
        />
        <span className="text-slate-600">
          {checkpoint.label || getCheckpointTypeLabel(checkpoint.type)}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 flex items-center gap-1">
          <Clock size={10} />
          {formatTimestamp(checkpoint.createdAt)}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatusColor(checkpoint.status)}`}>
          {getStatusLabel(checkpoint.status)}
        </span>
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 ml-4 p-3 bg-white border border-slate-200 rounded-lg text-sm">
          {/* Info */}
          <div className="space-y-1 text-xs text-slate-500 mb-3">
            <p>
              <span className="font-medium text-slate-600">消息索引:</span> {checkpoint.messageIndex}
            </p>
            <p>
              <span className="font-medium text-slate-600">消息数量:</span> {checkpoint.messageSnapshot.messageIds.length}
            </p>
            {checkpoint.messageSnapshot.lastMessageContent && (
              <p className="truncate">
                <span className="font-medium text-slate-600">最后消息:</span> {checkpoint.messageSnapshot.lastMessageContent.slice(0, 50)}...
              </p>
            )}
            {checkpoint.workingState && (
              <p>
                <span className="font-medium text-slate-600">包含工作状态</span>
              </p>
            )}
            {checkpoint.restoredAt && (
              <p>
                <span className="font-medium text-slate-600">恢复时间:</span> {formatTimestamp(checkpoint.restoredAt)}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {checkpoint.status === 'active' && (
              <>
                {showConfirmRestore ? (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleRestore}
                      className="h-7 text-xs"
                    >
                      确认恢复
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      className="h-7 text-xs"
                    >
                      取消
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestore}
                    className="h-7 text-xs gap-1"
                  >
                    <RotateCcw size={12} />
                    恢复到此检查点
                  </Button>
                )}
              </>
            )}
            
            {showConfirmDelete ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  className="h-7 text-xs"
                >
                  确认删除
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-7 text-xs"
                >
                  取消
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-7 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Checkpoint List ====================

interface CheckpointListProps {
  sessionId: string
  onRestore?: (checkpoint: Checkpoint) => void
}

export function CheckpointList({ sessionId, onRestore }: CheckpointListProps) {
  const checkpoints = useSessionCheckpoints(sessionId)
  const deleteCheckpoint = useCheckpointStore((state) => state.deleteCheckpoint)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const handleDelete = (checkpointId: string) => {
    deleteCheckpoint(checkpointId)
  }
  
  if (checkpoints.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-1">
      {checkpoints.map((checkpoint) => (
        <CheckpointMarker
          key={checkpoint.id}
          checkpoint={checkpoint}
          onRestore={onRestore}
          onDelete={handleDelete}
          isExpanded={expandedId === checkpoint.id}
          onToggleExpand={() => setExpandedId(expandedId === checkpoint.id ? null : checkpoint.id)}
        />
      ))}
    </div>
  )
}

export default CheckpointMarker
