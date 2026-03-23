/**
 * Session Runtime Module
 * Task 60: Story 43.1 - Session Lifecycle Management
 */

// Session Lifecycle Types and Functions
export {
  // Types
  type SessionState,
  type SessionTransition,
  type SessionOwner,
  type SessionRuntimeMetadata,
  type SessionContext,
  type SessionRecord,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type ResumeSessionRequest,
  type ResumeSessionResponse,
  type CloseSessionRequest,
  type CloseSessionResponse,
  type SessionStateChangeEvent,
  
  // Constants
  VALID_TRANSITIONS,
  TRANSITION_TARGETS,
  
  // Functions
  isValidTransition,
  getTransitionTarget,
  attemptTransition,
  generateSessionId,
  createSessionRecord,
  validateSessionOwner,
  isSessionExpired,
  isSessionActive,
  buildSessionContext,
  createStateChangeEvent,
} from './sessionLifecycle'

// Session Store
export {
  sessionStore,
  useActiveSession,
  useSessionsByOwner,
} from './sessionStore'

// Session API
export {
  SessionApi,
  getSessionApi,
  resetSessionApi,
  createSession,
  resumeSession,
  closeSession,
  getActiveSession,
  getSession,
} from './sessionApi'

// Host Context Integration
export {
  type HostType,
  type HostConfig,
  type HostContextValue,
  useSessionHostContext,
  useSessionStateListener,
  useSessionCleanup,
  createWorkbenchSessionContext,
  createDashboardSessionContext,
  createEditorSessionContext,
  persistSessionToStorage,
  restoreSessionFromStorage,
} from './sessionHostContext'

// Runtime State Machine
export {
  // Types
  type RuntimeState,
  type RuntimeTransition,
  type StepStatus,
  type TaskStatus,
  type StepRecord,
  type TaskRecord,
  type RuntimeStateContext,
  type RuntimeStateChangeEvent,
  type RuntimeStateMachineConfig,
  
  // Constants
  VALID_RUNTIME_TRANSITIONS,
  RUNTIME_TRANSITION_TARGETS,
  
  // Class
  RuntimeStateMachine,
  
  // Functions
  createRuntimeStateMachine,
  isRuntimeActive,
  isRuntimeTerminal,
  isRuntimeWaitingForInput,
  getRuntimeStateName,
  calculateOverallProgress,
  getActiveTask,
  getPendingTasksCount,
  getCompletedTasksCount,
  getFailedTasksCount,
} from './runtimeStateMachine'

// Runtime State Context (React)
export {
  // Types
  type RuntimeStateContextValue,
  type RuntimeStateProviderProps,
  
  // Components
  RuntimeStateProvider,
  
  // Hooks
  useRuntimeStateContext,
  useRuntimeState,
  useRuntimeIsActive,
  useRuntimeIsTerminal,
  useRuntimeIsWaitingForInput,
  useRuntimeTransitions,
  useRuntimeTasks,
  useRuntimeSteps,
  useRuntimeConfirmation,
  useRuntimeError,
  useRuntimeStateName,
} from './runtimeStateContext'

// User Context (Task 76: Story 47.1)
export {
  // Types
  type DepartmentInfo,
  type TenantInfo,
  type TenantLimits,
  type UserIdentity,
  type UserRoleContext,
  type OrganizationContext,
  type UserContextEnvelope,
  type NormalizedContextPayload,
  type ContextInjectionOptions,
  
  // Factory functions
  createUserIdentity,
  createUserRoleContext,
  createOrganizationContext,
  generateContextId,
  createUserContextEnvelope,
  
  // Normalization functions
  normalizeContextPayload,
  normalizeForDepartment,
  
  // Validation functions
  isContextExpired,
  isContextValid,
  validateContext,
  
  // Merge functions
  mergePermissions,
  mergeDataScopes,
  
  // Permission model
  PermissionModelIdentifiers,
  isRolePermission,
  isDepartmentPermission,
  isFeaturePermission,
  extractRoleFromPermission,
  extractDepartmentFromPermission,
  createRolePermission,
  createDepartmentPermission,
  createFeaturePermission,
  
  // Injection functions
  injectContextToRuntime,
  safeInjectContext,
  
  // Helper factories
  createDefaultTenantInfo,
  createDefaultDepartmentInfo,
  createMinimalContextEnvelope,
} from './userContext'

// Page Context (Task 77: Story 47.2)
export {
  // Types
  type PageMode,
  type ResourceType,
  type ResourceState,
  type ResourceReference,
  type PageLocation,
  type EditorContext,
  type DynamicContext,
  type PageContext,
  type PageContextEnvelope,
  type ResolutionMode,
  type ContextResolutionOptions,
  type ResolvedPageContext,
  
  // Factory functions
  generatePageContextId,
  createResourceReference,
  createPageLocation,
  createEditorContext,
  createDynamicContext,
  createPageContext,
  createPageContextEnvelope,
  
  // Context resolution functions
  resolvePageContext,
  resolveStaticContext,
  resolveDynamicContext,
  resolveEditorContext,
  
  // Context attachment functions
  attachResource,
  attachResources,
  detachResource,
  setPrimaryResource,
  
  // Context exposure functions
  exposeToPlanner,
  exposeToToolRuntime,
  isValidForToolExecution,
  
  // Validation functions
  validatePageContext,
  isPageContextExpired,
  isPageContextStale,
  
  // Utility functions
  getActiveResources,
  getResourcesByType,
  getResourcesByState,
  getDirtyResources,
  mergePageContexts,
  clonePageContext,
  createMinimalPageContext,
} from './pageContext'

// Session Memory Summary (Task 78: Story 47.3)
export {
  // Types
  type MemoryEntryType,
  type MemoryImportance,
  type MemoryEntry,
  type KeyFact,
  type SessionMemorySummary,
  type SummaryOptions,
  type MemoryRefreshTrigger,
  type RefreshConfig,

  // ID generation
  generateMemoryId,
  generateSummaryId,
  generateFactId,

  // Creation functions
  createMemoryEntry,
  createKeyFact,
  createSessionMemorySummary,

  // Extraction functions
  extractMemoryFromMessage,
  extractMemoryFromPart,
  extractKeyFacts,

  // Summary functions
  summarizeSession,

  // Memory management
  addMemoryEntry,
  removeMemoryEntry,
  touchMemoryEntry,
  pruneExpiredEntries,
  mergeSummaries,

  // Refresh functions
  shouldRefreshMemory,
  refreshMemorySummary,

  // Query functions
  getEntriesByType,
  getEntriesByImportance,
  searchEntries,
  getFactsByCategory,
  getVerifiedFacts,

  // Serialization
  serializeSummary,
  deserializeSummary,
  validateSummary,
} from './sessionMemorySummary'

// Knowledge Retrieval Baseline (Task 79: Story 47.4)
export {
  // Types
  type KnowledgeSourceType,
  type KnowledgeScope,
  type RetrievalStatus,
  type KnowledgeSourceRef,
  type RetrievalRequest,
  type RetrievalOptions,
  type RetrievalFilter,
  type RetrievedItem,
  type RetrievalResult,
  type RetrievalAuditEntry,
  type KnowledgeContextInjection,

  // ID generation
  generateRequestId,
  generateItemId,
  generateAuditId,
  generateInjectionId,

  // Knowledge source functions
  createKnowledgeSource,
  filterSourcesByScope,
  sortSourcesByPriority,

  // Retrieval request functions
  createRetrievalRequest,
  validateRetrievalRequest,

  // Retrieval result functions
  createRetrievedItem,
  createRetrievalResult,
  filterByMinScore,
  sortByScore,
  rankItems,
  limitResults,

  // Audit functions
  createAuditEntry,

  // Context injection functions
  createContextInjection,
  formatForRuntimeContext,
  formatForPlannerContext,
  formatForToolRuntime,

  // Query functions
  getItemsBySource,
  getItemsBySourceType,
  getItemsAboveScore,
  searchItemsByContent,

  // Serialization
  serializeRequest,
  deserializeRequest,
  serializeResult,
  deserializeResult,
  validateRetrievalResult,

  // Mock
  mockRetrieve,
} from './knowledgeRetrieval'

// Trace and Step Log (Task 80: Story 48.1)
export {
  // Types
  type TraceId,
  type TraceStepStatus,
  type StepLogEntry,
  type TraceContext,
  type TraceSummary,
  type TraceStore,
  type SerializableTraceContext,
  type SerializableStepLogEntry,
  type SerializableTraceStore,

  // ID Generation
  generateTraceId,
  generateStepId,
  isValidTraceId,
  isValidStepId,

  // Trace Context
  createTraceContext,
  touchTraceContext,

  // Step Log
  createStepLogEntry,
  startStep,
  completeStep,
  failStep,
  skipStep,
  cancelStep,

  // Trace Store
  createTraceStore,
  registerTrace,
  addStepLog,
  updateStepLog,

  // Lookup
  getTraceContext,
  getSessionTraces,
  getTraceSteps,
  getStepById,
  getStepsByStatus,
  getStepsByType,

  // Summary
  generateTraceSummary,
  getTraceChain,

  // Serialization
  serializeTraceContext,
  deserializeTraceContext,
  serializeStepLogEntry,
  deserializeStepLogEntry,
  serializeTraceStore,
  deserializeTraceStore,

  // Debug
  formatTraceContext,
  formatStepLogEntry,
  formatTraceSummary,
} from './traceAndStepLog'

// Tool Audit Log (Task 81: Story 48.2)
export {
  // Types
  type AuditStatus,
  type PermissionOutcome,
  type ConfirmationOutcome,
  type ToolInputSummary,
  type ToolResultSummary,
  type ToolAuditEntry,
  type AuditLogStore,
  type AuditQueryOptions,
  type AuditStatistics,
  type SerializableAuditLogStore,

  // ID Generation
  generateToolAuditId,
  isValidAuditId,

  // Input/Output Summary
  isSensitiveParameter,
  createInputSummary,
  createResultSummary,

  // Permission and Confirmation
  createPermissionOutcome,
  createConfirmationOutcome,

  // Audit Entry Functions
  createToolAuditEntry,
  markExecuting,
  markSuccess,
  markFailure,
  markPermissionDenied,
  markConfirmationRejected,
  markTimeout,
  markCancelled,

  // Audit Store Functions
  createAuditLogStore,
  addAuditEntry,
  updateAuditEntry,

  // Query Functions
  getAuditEntry,
  getSessionAuditEntries,
  getTraceAuditEntries,
  getToolAuditEntries,
  queryAuditEntries,
  getEntriesByStatus,

  // Statistics
  calculateAuditStatistics,

  // Governance
  getGovernanceTaggedEntries,
  getEntriesByRetentionCategory,

  // Serialization
  serializeAuditEntry,
  deserializeAuditEntry,
  serializeAuditLogStore,
  deserializeAuditLogStore,

  // Debug
  formatAuditEntry,
  formatAuditStatistics,
} from './toolAuditLog'

// Failure and Result Recording (Task 82: Story 48.3)
export {
  // Types
  type ResultStatus,
  type FailureCategory,
  type RetryOutcomeStatus,
  type ReplanOutcomeStatus,
  type ImpactedStep,
  type FailureReason,
  type ResultSummary,
  type RetryOutcome,
  type ReplanOutcome,
  type TaskExecutionRecord,
  type ExecutionRecordStore,
  type ExecutionQueryOptions,
  type ExecutionStatistics,
  type SerializableExecutionRecordStore,

  // Constants
  RECORD_ID_PREFIX,
  OUTCOME_ID_PREFIX,
  FAILURE_CATEGORIES,
  RESULT_STATUSES,
  RECOVERABLE_FAILURES,

  // ID Generation
  generateRecordId,
  generateOutcomeId,
  isValidRecordId,
  isValidOutcomeId,

  // Factory Functions
  createImpactedStep,
  createFailureReason,
  createExecutionResultSummary,
  createRetryOutcome,
  createReplanOutcome,
  createTaskExecutionRecord,

  // Status Update Functions
  markExecutionSuccess,
  markExecutionPartialSuccess,
  markExecutionFailure,
  markExecutionCancelled,
  markExecutionTimeout,
  markReplanTriggered,

  // Impacted Steps Management
  addImpactedStep,
  addImpactedSteps,

  // Retry Management
  addRetryOutcome,
  updateRetryOutcome,
  markRetrySucceeded,
  markRetryFailed,
  markRetryExhausted,

  // Replan Management
  addReplanOutcome,
  updateReplanOutcome,
  markReplanSucceeded,
  markReplanFailed,
  markReplanExhausted,

  // Store Functions
  createExecutionRecordStore,
  addExecutionRecord,
  updateExecutionRecord,
  getExecutionRecord,
  getSessionRecords,
  getTraceRecords,
  getTaskRecords,
  queryExecutionRecords,
  getRecordsByStatus,
  getFailedRecords,
  getRecoverableFailures,

  // Statistics
  calculateExecutionStatistics,

  // Serialization
  serializeExecutionRecord,
  deserializeExecutionRecord,
  serializeExecutionStore,
  deserializeExecutionStore,

  // Debug Formatting
  formatExecutionRecord,
  formatExecutionStatistics,
} from './failureRecording'

// Runtime Metrics and Debug View (Task 83: Story 48.4)
export {
  // Types
  type MetricSeverity,
  type MetricCategory,
  type MetricPoint,
  type MetricAggregation,
  type RuntimeMetric,
  type LatencyMetrics,
  type SuccessMetrics,
  type RetryMetrics,
  type ConfirmationMetrics,
  type RuntimeMetricsSummary,
  type DebugViewEntry,
  type DebugViewFilter,
  type DebugViewStore,
  type MetricsStore,
  type SerializableMetricsStore,
  type SerializableDebugViewStore,

  // Constants
  METRIC_ID_PREFIX,
  DEBUG_ENTRY_ID_PREFIX,
  METRIC_CATEGORIES,
  METRIC_SEVERITIES,
  DEBUG_LEVELS,

  // ID Generation
  generateMetricId,
  generateDebugEntryId,
  isValidMetricId,
  isValidDebugEntryId,

  // Metric Point Functions
  createMetricPoint,
  calculateMetricAggregation,

  // Runtime Metric Functions
  createRuntimeMetric,
  addMetricPoint,
  addMetricPoints,

  // Metrics Summary Functions
  createEmptyLatencyMetrics,
  createEmptySuccessMetrics,
  createEmptyRetryMetrics,
  createEmptyConfirmationMetrics,
  createRuntimeMetricsSummary,
  updateLatencyMetrics,
  updateSuccessMetrics,
  updateRetryMetrics,
  updateConfirmationMetrics,
  addCustomMetric,

  // Debug View Functions
  createDebugEntry,
  createDebugViewStore,
  addDebugEntry,
  getDebugEntry,
  queryDebugEntries,
  getSessionDebugEntries,
  getTraceDebugEntries,
  getEntriesByLevel,

  // Metrics Store Functions
  createMetricsStore,
  addMetric,
  getMetric,
  getSessionMetrics,
  getMetricsByCategory,

  // Serialization
  serializeRuntimeMetric,
  deserializeRuntimeMetric,
  serializeMetricsStore,
  deserializeMetricsStore,
  serializeDebugEntry,
  deserializeDebugEntry,
  serializeDebugViewStore,
  deserializeDebugViewStore,

  // Debug Formatting
  formatRuntimeMetric,
  formatDebugEntry,
  formatMetricsSummary,
} from './runtimeMetrics'

// Form Writeback Adapter (Task 84: Story 49.1)
export {
  // Types
  type FieldDataType,
  type WritebackPermission,
  type FieldUpdateStatus,
  type WritebackStatus,
  type FieldReference,
  type FieldPermissionResult,
  type FieldUpdate,
  type WritebackAction,
  type WritebackContract,
  type FieldValidationRule,
  type NormalizedResult,
  type ResultToFieldMapping,
  type WritebackTraceEntry,
  type WritebackAdapterStore,
  type WritebackOptions,
  type WritebackResult,
  type SerializableWritebackContract,
  type SerializableWritebackAction,
  type SerializableWritebackAdapterStore,

  // Constants
  UPDATE_ID_PREFIX,
  ACTION_ID_PREFIX,
  MAPPING_ID_PREFIX,
  TRACE_ENTRY_ID_PREFIX,
  CONTRACT_ID_PREFIX,
  FIELD_DATA_TYPES,
  WRITEBACK_PERMISSIONS,
  FIELD_UPDATE_STATUSES,
  WRITEBACK_STATUSES,

  // ID Generation
  generateUpdateId,
  generateActionId,
  generateMappingId,
  generateTraceEntryId,
  generateContractId,
  isValidUpdateId,
  isValidActionId,
  isValidMappingId,
  isValidTraceEntryId,

  // Factory Functions
  createFieldReference,
  createFieldPermissionResult,
  createFieldUpdate,
  createWritebackAction,
  createWritebackContract,
  createValidationRule,
  createResultToFieldMapping,
  createWritebackTraceEntry,
  createWritebackAdapterStore,

  // Permission Checking
  isFieldAllowed,
  getFieldPermission,
  canWriteField,
  checkFieldPermissions,

  // Validation
  validateValueAgainstRule,
  validateFieldUpdate,
  validateFieldUpdates,

  // Result Mapping
  extractValueByPath,
  mapResultToUpdates,

  // Writeback Execution
  updateFieldStatus,
  updateWritebackStatus,
  executeWriteback,

  // Store Operations
  registerContract,
  addAction,
  addTraceEntries,
  getContract,
  getAction,
  getTraceEntries,
  getActionsByForm,
  getActionsBySession,
  getActionsByStatus,

  // Serialization
  serializeContract,
  deserializeContract,
  serializeAction,
  deserializeAction,
  serializeWritebackStore,
  deserializeWritebackStore,

  // Debug Formatting
  formatFieldReference,
  formatFieldUpdate,
  formatWritebackAction,
  formatWritebackResult,
  formatTraceEntry,
} from './formWritebackAdapter'
