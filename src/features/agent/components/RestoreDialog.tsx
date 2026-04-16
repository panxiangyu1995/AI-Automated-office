/**
 * RestoreDialog - 检查点恢复对话框组件
 * Story 4.8 - 检查点回滚功能
 * 
 * 支持选择恢复模式：仅对话 / 对话+内容
 * 显示恢复预览和确认
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-02: 品牌色 var(--ao-button.background)
 * - UX-04: 对话驱动交互
 */

import { useState } from 'react'
import { AlertTriangle, MessageSquare, Package, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Checkpoint, RestoreMode } from '../hooks/useCheckpointStore'

// ==================== Types ====================

interface RestoreDialogProps {
  checkpoint: Checkpoint
  currentMessageCount: number
  onRestore: (checkpointId: string, mode: RestoreMode) => void
  onCancel: () => void
}

// ==================== Component ====================

export function RestoreDialog({
  checkpoint,
  currentMessageCount,
  onRestore,
  onCancel,
}: RestoreDialogProps) {
  const [selectedMode, setSelectedMode] = useState<RestoreMode>('conversation_only')
  const [isRestoring, setIsRestoring] = useState(false)
  
  const messagesToRestore = checkpoint.messageIndex
  const messagesToRemove = currentMessageCount - messagesToRestore
  const hasWorkingState = !!checkpoint.workingState
  
  const handleRestore = async () => {
    setIsRestoring(true)
    try {
      onRestore(checkpoint.id, selectedMode)
    } finally {
      setIsRestoring(false)
    }
  }
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <RotateCcw size={18} style={{ color: 'var(--ao-button.background)' }} />
          <h3 className="font-semibold text-slate-800">恢复检查点</h3>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Checkpoint Info */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="text-slate-600">
              <span className="font-medium">检查点时间:</span> {formatTime(checkpoint.createdAt)}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">消息数量:</span> {messagesToRestore} 条
            </p>
            {checkpoint.label && (
              <p className="text-slate-600">
                <span className="font-medium">标签:</span> {checkpoint.label}
              </p>
            )}
          </div>
          
          {/* Warning */}
          {messagesToRemove > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">注意</p>
                <p className="text-amber-700">
                  恢复后将删除 {messagesToRemove} 条后续消息，此操作不可撤销。
                </p>
              </div>
            </div>
          )}
          
          {/* Restore Mode Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">恢复模式</p>
            
            {/* Conversation Only */}
            <button
              onClick={() => setSelectedMode('conversation_only')}
              className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${
                selectedMode === 'conversation_only'
                  ? 'border-primary bg-blue-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
              style={{ borderColor: selectedMode === 'conversation_only' ? 'var(--ao-button.background)' : undefined }}
            >
              <MessageSquare size={20} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-800">仅恢复对话</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  将对话恢复到检查点时的状态，不恢复其他工作内容
                </p>
              </div>
            </button>
            
            {/* Conversation Plus Content */}
            <button
              onClick={() => setSelectedMode('conversation_plus_content')}
              disabled={!hasWorkingState}
              className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${
                !hasWorkingState
                  ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                  : selectedMode === 'conversation_plus_content'
                  ? 'border-primary bg-blue-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
              style={{ borderColor: selectedMode === 'conversation_plus_content' ? 'var(--ao-button.background)' : undefined }}
            >
              <Package size={20} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-800">恢复对话和工作内容</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {!hasWorkingState
                    ? '此检查点不包含工作状态'
                    : '同时恢复对话和检查点时的工作状态（表单数据、选择项等）'}
                </p>
              </div>
            </button>
          </div>
          
          {/* Preview */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>恢复后状态：</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>消息数量: {messagesToRestore} 条</li>
              {selectedMode === 'conversation_plus_content' && hasWorkingState && (
                <li>工作状态: 将恢复</li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isRestoring}>
            取消
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isRestoring}
            className="gap-1"
          >
            {isRestoring ? (
              <>
                <span className="animate-spin">⏳</span>
                恢复中...
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                确认恢复
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RestoreDialog
