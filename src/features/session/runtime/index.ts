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
