/**
 * GitStatusIndicator - Git 状态指示器组件
 * Story 4.10 - Git工具集成
 * 
 * 显示检查点的 Git 绑定状态
 * 支持 Git 状态检测和仓库信息显示
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 组件
 * - UX-02: 品牌色 var(--ao-button.background)
 * - UX-04: 对话驱动交互
 */

import { GitBranch, GitCommit, AlertCircle, Check, Clock } from 'lucide-react'
import type { CheckpointGitBinding, GitStatus, GitRepoState } from '../hooks/useGitStore'

// ==================== Types ====================

interface GitStatusIndicatorProps {
  gitStatus: GitStatus
  binding?: CheckpointGitBinding | null
  repoState?: GitRepoState | null
  compact?: boolean
}

// ==================== Component ====================

export function GitStatusIndicator({
  gitStatus,
  binding,
  repoState,
  compact = false,
}: GitStatusIndicatorProps) {
  // Git 不可用
  if (gitStatus === 'not_installed' || gitStatus === 'unknown') {
    if (compact) return null
    return (
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <AlertCircle size={12} />
        <span>Git 不可用</span>
      </div>
    )
  }
  
  // 不是 Git 仓库
  if (gitStatus === 'not_a_repo') {
    if (compact) return null
    return (
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <AlertCircle size={12} />
        <span>非 Git 仓库</span>
      </div>
    )
  }
  
  // Git 错误
  if (gitStatus === 'error') {
    if (compact) return null
    return (
      <div className="flex items-center gap-1 text-xs text-red-500">
        <AlertCircle size={12} />
        <span>Git 错误</span>
      </div>
    )
  }
  
  // 有绑定
  if (binding) {
    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    
    if (compact) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <GitCommit size={10} />
          <span>{binding.commit.shortSha}</span>
        </div>
      )
    }
    
    return (
      <div className="space-y-1 text-xs text-slate-500">
        <div className="flex items-center gap-1 text-green-600">
          <Check size={12} />
          <span>已绑定 Git 提交</span>
        </div>
        <div className="flex items-center gap-1">
          <GitCommit size={10} />
          <span className="font-mono">{binding.commit.shortSha}</span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="truncate max-w-[200px]">{binding.commit.message}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch size={10} />
          <span>{binding.branch}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock size={10} />
          <span>{formatTime(binding.boundAt)}</span>
        </div>
        {binding.commit.isUnpushed && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle size={10} />
            <span>未推送</span>
          </div>
        )}
      </div>
    )
  }
  
  // 无绑定，显示仓库状态
  if (repoState) {
    if (compact) {
      return (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <GitBranch size={10} />
          <span>{repoState.currentBranch}</span>
        </div>
      )
    }
    
    return (
      <div className="space-y-1 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <GitBranch size={10} />
          <span>{repoState.currentBranch}</span>
        </div>
        {repoState.hasUncommittedChanges && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle size={10} />
            <span>有未提交的更改</span>
          </div>
        )}
        {repoState.hasUnpushedCommits && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle size={10} />
            <span>有未推送的提交</span>
          </div>
        )}
        {repoState.lastCommit && (
          <div className="flex items-center gap-1 text-slate-400">
            <GitCommit size={10} />
            <span className="font-mono">{repoState.lastCommit.shortSha}</span>
          </div>
        )}
      </div>
    )
  }
  
  return null
}

// ==================== Compact Version ====================

interface GitBadgeProps {
  gitStatus: GitStatus
  binding?: CheckpointGitBinding | null
}

export function GitBadge({ gitStatus, binding }: GitBadgeProps) {
  if (gitStatus !== 'ready') return null
  
  if (binding) {
    return (
      <span 
        className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-green-50 text-green-600"
        title={`Git: ${binding.commit.shortSha}`}
      >
        <GitCommit size={8} />
        {binding.commit.shortSha}
      </span>
    )
  }
  
  return null
}

export default GitStatusIndicator
