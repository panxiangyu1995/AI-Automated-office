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
