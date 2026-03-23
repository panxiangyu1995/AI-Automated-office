/**
 * Agent Feature Module
 * Story 4.1 - AI对话界面实现
 * Story 4.2 - 会话管理功能
 * Story 4.3 - 历史对话管理
 * Story 4.7 - 检查点自动创建
 * Story 4.8 - 检查点回滚功能
 * Story 4.9 - 检查点编辑重试功能
 * Story 4.10 - Git工具集成
 * Story 4.11 - 检查点管理功能
 * 
 * 导出 Agent 相关的组件和 Hooks
 */

// Components
export { AgentChatPanel } from './components/AgentChatPanel'
export { ChatMessage } from './components/ChatMessage'
export { MessageInput } from './components/MessageInput'
export { MessageList } from './components/MessageList'
export { SessionList } from './components/SessionList'
export { SessionPanel } from './components/SessionPanel'
export { HistoryPanel } from './components/HistoryPanel'
export { CheckpointMarker, CheckpointList } from './components/CheckpointMarker'
export { RestoreDialog } from './components/RestoreDialog'
export { EditRetryDialog } from './components/EditRetryDialog'
export { GitStatusIndicator, GitBadge } from './components/GitStatusIndicator'
export { CheckpointManagementPanel } from './components/CheckpointManagementPanel'

// Hooks
export { 
  useChatStore, 
  useActiveChatSession, 
  useActiveMessages, 
  useStreamingStatus,
  type ChatSession,
  type ChatStoreState
} from './hooks/useChatStore'

export {
  useHistoryStore,
  useFilteredSessions,
  useHistoryFilter,
  useArchivedSessions,
  type TimeFilter,
  type HistoryFilter,
  type ArchivedSession
} from './hooks/useHistoryStore'

export {
  useCheckpointStore,
  useSessionCheckpoints,
  useLatestCheckpoint,
  useAutoCheckpointEnabled,
  useCheckpointCount,
  useRestoreHistory,
  useAllRestoreHistory,
  useSessionBranches,
  useActiveBranch,
  useOriginalMessage,
  useCleanupPolicy,
  useRetainedCheckpoints,
  useExpiredCheckpoints,
  useAllCheckpoints,
  useCheckpointStats,
  type Checkpoint,
  type CheckpointType,
  type CheckpointStatus,
  type WorkingStateSnapshot,
  type CheckpointMetadata,
  type CheckpointStoreState,
  type CreateCheckpointParams,
  type RestoreMode,
  type RestoreRecord,
  type BranchRecord,
  type CreateBranchParams,
  type RetentionType,
  type CleanupPolicy
} from './hooks/useCheckpointStore'

export {
  useGitStore,
  useGitStatus,
  useRepoState,
  useCheckpointGitBinding,
  useGitIntegrationEnabled,
  useAutoCommitEnabled,
  type GitStatus as GitStatusType,
  type GitCommitMetadata,
  type CheckpointGitBinding,
  type GitRepoState,
  type GitStoreState
} from './hooks/useGitStore'
