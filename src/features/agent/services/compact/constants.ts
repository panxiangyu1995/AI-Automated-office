import type {
  BusinessCompressionConfig,
  BusinessCompactTriggerConfig,
  NeverCompressType,
  CompressibleType,
  MicroCompactRule,
  TriggerType,
  RecoveryRule,
} from '../../types/compact.types'

export const DEFAULT_CONFIG: BusinessCompressionConfig = {
  autoCompactBufferTokens: 15000,
  warningThreshold: 25000,
  errorThreshold: 25000,
  memoryCompactThreshold: 20000,
  microCompactThreshold: 40000,
  fullCompactThreshold: 60000,
  approvalContextBuffer: 20000,
  staleThresholdMinutes: 30,
  archiveThresholdHours: 24,
  keepRecentMessages: 5,
  keepRecentResults: 3,
  targetCompressionRatio: 0.4,
  minCompressionRatio: 0.3,
  autoCompress: true,
  compressionCooldownMs: 300000,
  recoveryCacheTtlMs: 300000,
  recoveryCacheMaxSize: 100,
}

export const NEVER_COMPRESS_TYPES: Record<NeverCompressType, { reason: string; retention: string }> = {
  user_explicit_reference: { reason: '用户明确关注的数据', retention: 'permanent_until_user_dismissed' },
  pending_approval: { reason: '待审批项时效性最高', retention: 'permanent_until_decided' },
  approval_decision: { reason: '审批决定影响后续流程', retention: 'permanent' },
  transaction_in_progress: { reason: '进行中的事务不能丢失', retention: 'permanent_until_completed' },
  form_draft: { reason: '表单草稿用户可能继续编辑', retention: 'permanent_until_submitted' },
  current_department_context: { reason: '当前部门是操作的基础', retention: 'session_permanent' },
  user_permission_context: { reason: '权限上下文决定操作范围', retention: 'session_permanent' },
  recently_edited_document: { reason: '用户可能继续编辑', retention: '24_hours' },
}

export const COMPRESSIBLE_TYPES: Record<CompressibleType, { compressAfter: string; keepSummary: boolean; summaryTemplate?: string }> = {
  historical_data_query: { compressAfter: '24_hours', keepSummary: true, summaryTemplate: '[查询条件] 返回 [结果数] 条记录' },
  report_preview: { compressAfter: '1_hour', keepSummary: true, summaryTemplate: '[报告名] 生成于 [时间]' },
  search_results: { compressAfter: '30_minutes', keepSummary: true, summaryTemplate: '[搜索词] 找到 [结果数] 条' },
  notification: { compressAfter: '1_hour', keepSummary: false },
  activity_log: { compressAfter: '30_minutes', keepSummary: false },
  document_full_content: { compressAfter: '30_minutes', keepSummary: true, summaryTemplate: '[文档名] (ID: [id])' },
}

export const MICRO_COMPACT_RULES: MicroCompactRule[] = [
  { contentType: 'document_full_content', compressAfter: 30 * 60 * 1000, keepSummary: true },
  { contentType: 'search_results', compressAfter: 30 * 60 * 1000, keepSummary: true },
  { contentType: 'activity_log', compressAfter: 30 * 60 * 1000, keepSummary: false },
  { contentType: 'report_preview', compressAfter: 60 * 60 * 1000, keepSummary: true },
  { contentType: 'notification', compressAfter: 60 * 60 * 1000, keepSummary: false },
  { contentType: 'historical_data_query', compressAfter: 24 * 60 * 60 * 1000, keepSummary: true },
]

export const BUSINESS_COMPACT_TRIGGERS: BusinessCompactTriggerConfig[] = [
  { type: 'token_threshold', priority: 50, targetStrategy: 'micro' },
  { type: 'department_change', priority: 80, targetStrategy: 'business_memory' },
  { type: 'approval_change', priority: 90, targetStrategy: 'micro' },
  { type: 'time_based', priority: 40, targetStrategy: 'micro' },
  { type: 'manual', priority: 100, targetStrategy: 'business_full' },
  { type: 'api_error', priority: 100, targetStrategy: 'reactive' },
]

export const TRIGGER_COOLDOWNS: Record<TriggerType, number> = {
  token_threshold: 5 * 60 * 1000,
  department_change: 0,
  approval_change: 0,
  time_based: 0,
  manual: 0,
  api_error: 0,
}

export const REACTIVE_COMPACT_CONFIG = {
  maxRetries: 3,
  keepRecentRounds: 5,
  phase1TokensToFree: 0.05,
  phase2TokensToFree: 0.15,
  phase3TokensToFree: 0.30,
  userNotificationThreshold: 0.20,
}

export const AUTO_RECOVERY_RULES: RecoveryRule[] = [
  { trigger: 'user_mentions_document', pattern: /\b(doc|文档|文件|合同|报告)\s*[#：:]\s*(\w+)/i, action: 'restore_document_content', priority: 1 },
  { trigger: 'user_mentions_approval', pattern: /\b(审批|approve)\s*[#：:]\s*(\w+)/i, action: 'restore_approval_details', priority: 1 },
  { trigger: 'department_switch', action: 'restore_department_context', priority: 2 },
  { trigger: 'user_asks_about_previous', pattern: /\b(之前|刚才|上面|之前提到)\b/, action: 'restore_recent_context', priority: 2 },
]

export const MANUAL_RECOVERY_COMMANDS: Record<string, string> = {
  '@查看详情': 'restore_entity_full_content',
  '@恢复文档': 'restore_document',
  '@审批详情': 'restore_approval_chain',
  '@查看历史': 'restore_search_history',
  '@全部恢复': 'restore_all_compressed',
}

export const RECOVERY_CACHE_CONFIG = {
  maxSize: 100,
  ttlMs: 5 * 60 * 1000,
  cleanupIntervalMs: 60 * 1000,
}
