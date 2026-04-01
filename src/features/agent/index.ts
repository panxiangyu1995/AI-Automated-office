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
 * Story 4.12 - 上下文自动压缩
 * 
 * 导出 Agent 相关的组件和 Hooks
 */

// Legacy Components (deprecated, will be removed in future version)
export { AgentChatPanel } from './components/AgentChatPanel'
export { ChatMessage } from './components/ChatMessage'
export { 
  MessageInput,
  type MediaAttachment,
  type MediaType
} from './components/MessageInput'
export { MessageList } from './components/MessageList'
export { SessionList } from './components/SessionList'
export { SessionPanel } from './components/SessionPanel'
export { StagedReviewPanel } from './components/StagedReviewPanel'
export { HistoryPanel } from './components/HistoryPanel'
export { CheckpointMarker, CheckpointList } from './components/CheckpointMarker'
export { RestoreDialog } from './components/RestoreDialog'
export { EditRetryDialog } from './components/EditRetryDialog'
export { GitStatusIndicator, GitBadge } from './components/GitStatusIndicator'
export { CheckpointManagementPanel } from './components/CheckpointManagementPanel'
export { 
  CompressionStatusIndicator, 
  CompressionHistoryItem,
  CompressionHistoryList 
} from './components/CompressionStatusIndicator'
export { CompressionConfigPanel } from './components/CompressionConfigPanel'
export { TokenUsageIndicator } from './components/TokenUsageIndicator'
export {
  EmployeeDirectory,
  type EmployeeStatus,
  type Employee,
  type Department,
  type DirectoryStats,
  type EmployeeDirectoryProps
} from './components/EmployeeDirectory'
export {
  EmployeeCard,
  type EmployeeProfile,
  type ParticipantType,
  type ContactAction,
  type VisibilitySettings,
  type EmployeeCardProps
} from './components/EmployeeCard'
export {
  PrivateChat,
  type MessageStatus,
  type MessageType,
  type PrivateMessage,
  type MessageAttachment,
  type Conversation,
  type ChatStats,
  type PrivateChatProps
} from './components/PrivateChat'
export {
  GroupChat,
  type GroupRole,
  type GroupMemberStatus,
  type GroupMember,
  type GroupMessage,
  type GroupAttachment,
  type Group,
  type GroupChatStats,
  type GroupChatProps
} from './components/GroupChat'
export {
  AgentGroupParticipant,
  type AgentRole,
  type AgentStatus,
  type ParticipationMode,
  type AgentIdentity,
  type AgentMention,
  type AgentEvent,
  type ParticipationPolicy,
  type AgentGroupParticipantStats,
  type AgentGroupParticipantProps
} from './components/AgentGroupParticipant'
export {
  SystemAnnouncements,
  type Notice,
  type NoticeType,
  type NoticeStatus,
  type NoticePriority,
  type AnnouncementStats,
  type SystemAnnouncementsProps
} from './components/SystemAnnouncements'
export {
  TaskNotifications,
  type NotificationType,
  type NotificationStatus,
  type DeliveryChannel,
  type ReminderStatus,
  type NotificationPreference,
  type TaskNotification,
  type NotificationStats,
  type TaskNotificationsProps
} from './components/TaskNotifications'
export {
  AgentIntercom,
  type AgentContact,
  type AgentMessage,
  type AgentMessageType,
  type MessageDirection,
  type PermissionLevel,
  type SecurityLevel,
  type AuditStatus,
  type ConversationThread,
  type IntercomStats,
  type AgentIntercomProps
} from './components/AgentIntercom'
export {
  WorkCardMessage,
  WorkCardFeed,
  type CardField,
  type CardAction,
  type CardStatus,
  type CardPriority,
  type CardActionType,
  type CardActionStatus,
  type ResultType,
  type WorkCard,
  type WorkCardMessageProps,
  type WorkCardFeedProps
} from './components/WorkCardMessage'
export {
  MessageSearchManager,
  type SortOrder,
  type SortField,
  type SearchFilter,
  type MessageItem,
  type SearchStats,
  type MessageSearchManagerProps
} from './components/MessageSearchManager'
export {
  LogMetricsCenter,
  type LogMetricsCenterProps,
  type LogFilter,
  type LogLevel,
  type LogSource,
  type MetricType,
  type HealthStatus,
  type LogEntry,
  type MetricValue,
  type Metric,
  type HealthIndicator,
  type LogMetricsCenterStats
} from './components/LogMetricsCenter'
export {
  TaskTraceAnalysis,
  type TaskTraceAnalysisProps,
  type TraceStatus,
  type StepStatus,
  type ToolCallStatus,
  type TraceSpan,
  type TraceEvent,
  type Trace,
  type LatencyBucket,
  type TraceStats
} from './components/TaskTraceAnalysis'
export {
  HeartbeatChecklist,
  type HeartbeatChecklistProps,
  type CheckItemStatus,
  type QuietMode,
  type HeartbeatStatus,
  type CheckCategory,
  type CheckItem,
  type ChecklistRun,
  type HeartbeatSchedule,
  type HeartbeatStats
} from './components/HeartbeatChecklist'
export {
  ScheduledTaskCenter,
  type ScheduledTaskCenterProps,
  type TaskStatus,
  type TaskType,
  type RetryPolicy,
  type MutexPolicy,
  type RiskLevel,
  type ApprovalStatus,
  type CronDefinition,
  type RetryConfig,
  type TimeoutConfig,
  type MutexConfig,
  type TaskPolicy,
  type ScheduledTask,
  type TaskExecution,
  type ScheduledTaskCenterStats
} from './components/ScheduledTaskCenter'
export {
  ErrorClassificationGuidance,
  type ErrorClassificationGuidanceProps,
  type ErrorSeverity,
  type ErrorCategory,
  type ErrorClass,
  type RecoveryStatus,
  type ErrorCode,
  type ErrorInstance,
  type ErrorGuidanceStats
} from './components/ErrorClassificationGuidance'
export {
  FailoverSessionRepair,
  type FailoverSessionRepairProps,
  type ProviderStatus,
  type ProviderType,
  type FailoverAction,
  type RepairStatus,
  type SessionHealth,
  type Provider,
  type FailoverRecord,
  type SessionRepair,
  type FailoverSessionRepairStats
} from './components/FailoverSessionRepair'
export {
  ApprovalPilotIntegration,
  type ApprovalPilotIntegrationProps,
  type ApprovalPhase,
  type BindingStatus as ApprovalBindingStatus,
  type ExecutionStatus as ApprovalExecutionStatus,
  type ApprovalContext,
  type ToolBinding as ApprovalToolBinding,
  type RuntimeStep as ApprovalRuntimeStep,
  type AuditEntry as ApprovalAuditEntry,
  type ApprovalPilotStats
} from './components/ApprovalPilotIntegration'
export {
  SalesPilotIntegration,
  type SalesPilotIntegrationProps,
  type SalesPhase,
  type BindingStatus as SalesBindingStatus,
  type ExecutionStatus as SalesExecutionStatus,
  type OpportunityStage,
  type SalesContext,
  type SalesToolBinding,
  type SalesRuntimeStep,
  type SalesAuditEntry,
  type SalesPilotStats
} from './components/SalesPilotIntegration'
export {
  FinancePilotIntegration,
  type FinancePilotIntegrationProps,
  type FinancePhase,
  type BindingStatus as FinanceBindingStatus,
  type ExecutionStatus as FinanceExecutionStatus,
  type TransactionType,
  type FinanceContext,
  type FinanceToolBinding,
  type FinanceRuntimeStep,
  type FinanceAuditEntry,
  type FinancePilotStats
} from './components/FinancePilotIntegration'

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

export {
  useContextCompression,
  useCompressionConfig,
  useSessionCompressionState,
  useThresholdStatus,
  useCompressionStatus,
  useCompressionHistory,
  type CompressionStatus,
  type ThresholdStatus,
  type CompressionStrategy,
  type CompressionConfig,
  type CompressionRecord,
  type TokenStats,
  type SessionCompressionState,
  type ContextCompressionState
} from './hooks/useContextCompression'
