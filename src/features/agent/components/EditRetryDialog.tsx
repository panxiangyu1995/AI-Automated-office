/**
 * EditRetryDialog - 检查点编辑重试对话框组件
 * Story 4.9 - 检查点编辑重试功能
 * 
 * 支持从检查点编辑并重试：
 * - 预填充历史输入到编辑器
 * - 创建分支执行
 * - 保留原始分支供比较
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-02: 品牌色 var(--ao-button.background)
 * - UX-04: 对话驱动交互
 */

import { useState, useEffect } from 'react'
import { Edit3, GitBranch, History, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Checkpoint, BranchRecord } from '../hooks/useCheckpointStore'

// ==================== Types ====================

interface EditRetryDialogProps {
  checkpoint: Checkpoint
  originalMessage: string
  existingBranches: BranchRecord[]
  onEditRetry: (checkpointId: string, editedMessage: string, branchLabel?: string) => void
  onCancel: () => void
}

// ==================== Component ====================

export function EditRetryDialog({
  checkpoint,
  originalMessage,
  existingBranches,
  onEditRetry,
  onCancel,
}: EditRetryDialogProps) {
  const [editedMessage, setEditedMessage] = useState(originalMessage)
  const [branchLabel, setBranchLabel] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 重置编辑内容
  useEffect(() => {
    setEditedMessage(originalMessage)
  }, [originalMessage])
  
  const handleEditRetry = async () => {
    if (!editedMessage.trim()) return
    
    setIsProcessing(true)
    try {
      onEditRetry(checkpoint.id, editedMessage.trim(), branchLabel.trim() || undefined)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter 发送
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleEditRetry()
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
  
  const messageChanged = editedMessage !== originalMessage
  const activeBranchCount = existingBranches.filter(b => b.status === 'active').length
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Edit3 size={18} style={{ color: 'var(--ao-button.background)' }} />
          <h3 className="font-semibold text-slate-800">编辑并重试</h3>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Checkpoint Info */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <History size={14} />
              <span>
                检查点时间: {formatTime(checkpoint.createdAt)}
              </span>
            </div>
            {checkpoint.label && (
              <p className="text-slate-600 mt-1">
                <span className="font-medium">标签:</span> {checkpoint.label}
              </p>
            )}
          </div>
          
          {/* Branch Info */}
          {activeBranchCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <GitBranch size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">现有分支</p>
                <p className="text-blue-700">
                  此检查点已有 {activeBranchCount} 个活跃分支，原始分支将被保留供比较。
                </p>
              </div>
            </div>
          )}
          
          {/* Original Message Info */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">原始消息</p>
            <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-600 max-h-20 overflow-y-auto">
              {originalMessage || '(无消息内容)'}
            </div>
          </div>
          
          {/* Edit Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">编辑消息</p>
              {messageChanged && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  已修改
                </span>
              )}
            </div>
            <textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="编辑消息内容..."
              className="w-full min-h-[100px] p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              style={{ 
                borderColor: messageChanged ? 'var(--ao-button.background)' : undefined,
              }}
            />
            <p className="text-xs text-slate-400">
              按 Ctrl+Enter 发送
            </p>
          </div>
          
          {/* Branch Label (Optional) */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              分支标签 <span className="text-slate-400 font-normal">(可选)</span>
            </p>
            <input
              type="text"
              value={branchLabel}
              onChange={(e) => setBranchLabel(e.target.value)}
              placeholder="例如: 修复后的查询"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              style={{
                borderColor: branchLabel ? 'var(--ao-button.background)' : undefined,
              }}
            />
          </div>
          
          {/* Preview */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>操作将创建：</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>新分支: {branchLabel || `分支 ${Date.now()}`}</li>
              <li>消息数量: {checkpoint.messageIndex} 条基础 + 新对话</li>
              {activeBranchCount > 0 && (
                <li>保留 {activeBranchCount} 个现有分支供比较</li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            取消
          </Button>
          <Button
            onClick={handleEditRetry}
            disabled={isProcessing || !editedMessage.trim()}
            className="gap-1"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                处理中...
              </>
            ) : (
              <>
                <Edit3 size={14} />
                编辑并重试
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditRetryDialog
