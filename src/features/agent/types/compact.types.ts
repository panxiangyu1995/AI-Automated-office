/**
 * 业务上下文压缩 - 类型定义
 */

export type CompressionLayer = 'business_memory' | 'micro' | 'business_full' | 'reactive'
export type CompressionStatus = 'idle' | 'pending' | 'compressing' | 'completed' | 'failed'
export type ThresholdStatus = 'normal' | 'warning' | 'critical' | 'exceeded'
export type CompressionLevel = 'none' | 'summary' | 'reference' | 'full'

export type NeverCompressType = 'user_explicit_reference' | 'pending_approval' | 'approval_decision' | 'transaction_in_progress' | 'form_draft' | 'current_department_context' | 'user_permission_context' | 'recently_edited_document'
export type CompressibleType = 'historical_data_query' | 'report_preview' | 'search_results' | 'notification' | 'activity_log' | 'document_full_content'
export type DepartmentType = 'hr' | 'approval' | 'sales' | 'finance' | 'warehouse' | 'management' | 'service' | 'bidding' | 'marketing'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'
export type TriggerType = 'token_threshold' | 'department_change' | 'approval_change' | 'time_based' | 'manual' | 'api_error'
export type RecoveryAction = 'restore_document_content' | 'restore_approval_details' | 'restore_department_context' | 'restore_recent_context' | 'restore_entity_full_content'

export interface DepartmentContext {
  currentDepartment: DepartmentType
  currentDepartmentId: string
  currentDepartmentName: string
  relatedDepartments: Array<{ id: string; name: string; type: DepartmentType; relationType: string }>
  permissions: string[]
  activeWorkflows: string[]
}

export interface ApprovalSummary {
  id: string
  type: string
  title: string
  status: ApprovalStatus
  requester: { id: string; name: string; department: string }
  amount?: number
  currentStep: number
  totalSteps: number
  deadline?: Date
  createdAt: Date
}

export interface ApprovalChainStatus {
  pendingCount: number
  pendingApprovals: ApprovalSummary[]
  nextApproval?: { id: string; type: string; fromStep: number; toStep: number; deadline?: Date }
  recentDecisions: Array<{ id: string; type: string; decision: ApprovalStatus; at: Date; approver: string }>
}

export interface BusinessSessionMemory {
  sessionId: string
  departmentContext: DepartmentContext
  keyEntities: {
    documents: Array<{ id: string; name: string; type: string; lastAccessed: Date }>
    approvals: Array<{ id: string; status: ApprovalStatus; deadline?: Date }>
    employees: Array<{ id: string; name: string; department: string }>
  }
  conversationSummary: string
  keyFacts: string[]
  neverCompressEntities: string[]
  lastUpdated: Date
}

export interface BusinessCompactSummary {
  primaryRequest: string
  keyBusinessConcepts: string[]
  documentsAndData: string[]
  decisionsAndResolutions: string[]
  problemSolving: string[]
  allUserMessages: string[]
  pendingTasks: string[]
  currentWork: string
  optionalNextStep: string
  departmentContext: DepartmentContext
  approvalChainStatus?: ApprovalChainStatus
  relatedDocuments: string[]
  crossDepartmentDependencies: { pending: Array<{ dept: string; task: string }>; completed: Array<{ dept: string; result: string }> }
  businessRulesApplied: { applied: string[]; custom: string[] }
  tokenCount: number
  createdAt: Date
}

export interface CompressibilityDecision {
  canCompress: boolean
  reason: string
  preserveTypes: string[]
  compressionLevel: CompressionLevel
  suggestedLayer?: CompressionLayer
}

export interface BusinessCompactTriggerConfig {
  type: TriggerType
  priority: number
  targetStrategy: CompressionLayer
}

export interface TriggerState {
  lastTriggerTime: Map<TriggerType, Date>
  triggerCount: Map<TriggerType, number>
  pendingTriggers: TriggerType[]
  suppressUntil: Date | null
}

export interface TriggerEvent {
  type: TriggerType
  timestamp: Date
  tokenCount?: number
  metadata?: Record<string, unknown>
}

export interface RecoveryRule {
  trigger: string
  pattern?: RegExp
  action: RecoveryAction
  priority: number
}

export interface RecoveryResult {
  entityId: string
  entityType: string
  content: unknown
  retrievedAt: Date
  source: 'database' | 'message_history' | 'compression_cache'
  success: boolean
  error?: string
}

export interface BusinessCompressionConfig {
  autoCompactBufferTokens: number
  warningThreshold: number
  errorThreshold: number
  memoryCompactThreshold: number
  microCompactThreshold: number
  fullCompactThreshold: number
  approvalContextBuffer: number
  staleThresholdMinutes: number
  archiveThresholdHours: number
  keepRecentMessages: number
  keepRecentResults: number
  targetCompressionRatio: number
  minCompressionRatio: number
  autoCompress: boolean
  compressionCooldownMs: number
  recoveryCacheTtlMs: number
  recoveryCacheMaxSize: number
}

export interface CompressionRecord {
  id: string
  sessionId: string
  timestamp: Date
  trigger: TriggerType
  triggerType?: TriggerType
  layer: CompressionLayer
  beforeTokenCount: number
  beforeMessageCount: number
  afterTokenCount: number
  afterMessageCount: number
  beforeTokens?: number
  afterTokens?: number
  compressionRatio?: number
  success?: boolean
  summary?: BusinessCompactSummary
  status: CompressionStatus
  duration: number
  error?: string
}

export interface MicroCompactRule {
  contentType: CompressibleType
  compressAfter: number
  keepSummary: boolean
  summaryTemplate?: string
}

export interface MicroCompactResult {
  clearedItems: Array<{ messageId: string; contentType: CompressibleType; originalTokens: number; summary?: string }>
  keptItems: Array<{ messageId: string; contentType: CompressibleType; retained: 'full' | 'summary' | 'reference' }>
  tokensFreed: number
  duration: number
}

// Message type for agent conversations
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  parts?: Array<{ type: 'text'; content: string } | { type: 'file'; content: string } | { type: 'tool_call'; content: string }>
  createdAt?: Date
  updatedAt?: Date
}

// CompressionResult type for compression operations
export interface CompressionResult {
  keptMessages: Message[]
  compressedMessages: Message[]
  summary: BusinessCompactSummary
  preCompactTokenCount: number
  postCompactTokenCount: number
  compressionRatio: number
  layer: CompressionLayer
  duration: number
}
