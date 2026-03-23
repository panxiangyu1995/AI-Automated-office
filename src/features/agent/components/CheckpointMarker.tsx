/**
 * CheckpointMarker - 检查点标记组件
 * Story 4.7 - 检查点自动创建
 * Story 4.8 - 检查点回滚功能
 * Story 4.9 - 检查点编辑重试功能
 * Story 4.10 - Git工具集成
 * 
 * 在对话流中显示检查点标记，支持恢复到检查点
 * 支持选择恢复模式（仅对话 / 对话+内容）
 * 支持编辑检查点消息并创建分支重试
 * 支持 Git 绑定状态显示
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-02: 品牌色 #1E3A5F
 * - UX-04: 对话驱动交互
 */

import { useState } from 'react'
import { Bookmark, RotateCcw, Trash2, ChevronDown, ChevronUp, Clock, Edit3, GitBranch, GitCommit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  useSessionCheckpoints,
  useCheckpointStore,
  useSessionBranches,
  type Checkpoint, 
  type CheckpointType,
  type RestoreMode
} from '../hooks/useCheckpointStore'
import { 
  useGitStatus,
  useCheckpointGitBinding,
  useGitIntegrationEnabled
} from '../hooks/useGitStore'
import { RestoreDialog } from './RestoreDialog'
import { EditRetryDialog } from './EditRetryDialog'
import { GitBadge } from './GitStatusIndicator'

// ==================== Types ====================

interface CheckpointMarkerProps {
  checkpoint: Checkpoint
  currentMessageCount: number
  onRestore?: (checkpointId: string, mode: RestoreMode) => void
  onDelete?: (checkpointId: string) => void
  onEditRetry?: (checkpointId: string, editedMessage: string, branchLabel?: string) => void
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
  currentMessageCount,
  onRestore,
  onDelete,
  onEditRetry,
  isExpanded = false,
  onToggleExpand,
}: CheckpointMarkerProps) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showEditRetryDialog, setShowEditRetryDialog] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  
  // Get branches for this checkpoint's session
  const branches = useSessionBranches(checkpoint.sessionId)
  const existingBranches = branches.filter(b => b.sourceCheckpointId === checkpoint.id)
  
  // Get original message from checkpoint
  const originalMessage = checkpoint.messageSnapshot.lastMessageContent || ''
  
  // Git integration (Story 4.10)
  const gitStatus = useGitStatus()
  const gitIntegrationEnabled = useGitIntegrationEnabled()
  const gitBinding = useCheckpointGitBinding(checkpoint.id)
  
  const handleRestoreClick = () => {
    setShowRestoreDialog(true)
    setShowConfirmDelete(false)
    setShowEditRetryDialog(false)
  }
  
  const handleRestore = (checkpointId: string, mode: RestoreMode) => {
    onRestore?.(checkpointId, mode)
    setShowRestoreDialog(false)
  }
  
  const handleEditRetryClick = () => {
    setShowEditRetryDialog(true)
    setShowConfirmDelete(false)
    setShowRestoreDialog(false)
  }
  
  const handleEditRetry = (checkpointId: string, editedMessage: string, branchLabel?: string) => {
    onEditRetry?.(checkpointId, editedMessage, branchLabel)
    setShowEditRetryDialog(false)
  }
  
  const handleDelete = () => {
    if (showConfirmDelete) {
      onDelete?.(checkpoint.id)
      setShowConfirmDelete(false)
    } else {
      setShowConfirmDelete(true)
      setShowRestoreDialog(false)
      setShowEditRetryDialog(false)
    }
  }
  
  const handleCancel = () => {
    setShowConfirmDelete(false)
  }
  
  // Check if has Git metadata
  const hasGitMetadata = checkpoint.gitMetadata?.commitSha || gitBinding
  
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
        {/* Git Badge (Story 4.10) */}
        {gitIntegrationEnabled && hasGitMetadata && (
          <GitBadge gitStatus={gitStatus} binding={gitBinding} />
        )}
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
            {/* Git Metadata (Story 4.10) */}
            {gitIntegrationEnabled && hasGitMetadata && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <GitCommit size={10} />
                  Git 绑定
                </p>
                {gitBinding && (
                  <>
                    <p>
                      <span className="font-medium text-slate-600">提交:</span>{' '}
                      <code className="bg-slate-100 px-1 rounded text-[10px]">{gitBinding.commit.shortSha}</code>
                    </p>
                    <p>
                      <span className="font-medium text-slate-600">分支:</span> {gitBinding.branch}
                    </p>
                    {gitBinding.commit.isUnpushed && (
                      <p className="text-amber-600">未推送到远程</p>
                    )}
                  </>
                )}
                {checkpoint.gitMetadata?.commitSha && !gitBinding && (
                  <p>
                    <span className="font-medium text-slate-600">提交:</span>{' '}
                    <code className="bg-slate-100 px-1 rounded text-[10px]">
                      {checkpoint.gitMetadata.commitSha.slice(0, 7)}
                    </code>
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {checkpoint.status === 'active' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestoreClick}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw size={12} />
                  恢复
                </Button>
                
                {originalMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditRetryClick}
                    className="h-7 text-xs gap-1"
                    style={{ borderColor: '#1E3A5F', color: '#1E3A5F' }}
                  >
                    <Edit3 size={12} />
                    编辑重试
                  </Button>
                )}
                
                {existingBranches.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <GitBranch size={10} />
                    <span>{existingBranches.length} 个分支</span>
                  </div>
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
      
      {/* Restore Dialog */}
      {showRestoreDialog && (
        <RestoreDialog
          checkpoint={checkpoint}
          currentMessageCount={currentMessageCount}
          onRestore={handleRestore}
          onCancel={() => setShowRestoreDialog(false)}
        />
      )}
      
      {/* Edit Retry Dialog */}
      {showEditRetryDialog && (
        <EditRetryDialog
          checkpoint={checkpoint}
          originalMessage={originalMessage}
          existingBranches={existingBranches}
          onEditRetry={handleEditRetry}
          onCancel={() => setShowEditRetryDialog(false)}
        />
      )}
    </div>
  )
}

// ==================== Checkpoint List ====================

interface CheckpointListProps {
  sessionId: string
  currentMessageCount: number
  onRestore?: (checkpointId: string, mode: RestoreMode) => void
  onEditRetry?: (checkpointId: string, editedMessage: string, branchLabel?: string) => void
}

export function CheckpointList({ sessionId, currentMessageCount, onRestore, onEditRetry }: CheckpointListProps) {
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
          currentMessageCount={currentMessageCount}
          onRestore={onRestore}
          onEditRetry={onEditRetry}
          onDelete={handleDelete}
          isExpanded={expandedId === checkpoint.id}
          onToggleExpand={() => setExpandedId(expandedId === checkpoint.id ? null : checkpoint.id)}
        />
      ))}
    </div>
  )
}

export default CheckpointMarker
