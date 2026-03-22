/**
 * Session Lifecycle Management
 * Task 60: Story 43.1 - Session Lifecycle Management
 * 
 * This module defines session states, transitions, and runtime contracts
 * for the Agent runtime session management.
 */

// ==================== Session States ====================

/**
 * Session lifecycle states
 * Based on ADR-001 layered microkernel architecture
 */
export type SessionState =
  | 'created'      // Initial state after session creation
  | 'active'       // Session is active and usable
  | 'paused'       // Session is temporarily paused
  | 'resuming'     // Session is being resumed from paused state
  | 'closing'      // Session is in closing process
  | 'closed'       // Session has been closed
  | 'expired'      // Session has expired due to timeout
  | 'error'        // Session encountered an error

/**
 * Session state transition events
 */
export type SessionTransition =
  | 'activate'     // created -> active
  | 'pause'        // active -> paused
  | 'resume'       // paused -> resuming -> active
  | 'close'        // active/paused -> closing -> closed
  | 'finish'       // closing -> closed (completion of close process)
  | 'expire'       // active/paused -> expired
  | 'error'        // any -> error
  | 'reset'        // error -> created (recovery)

/**
 * Valid state transitions map
 */
export const VALID_TRANSITIONS: Record<SessionState, SessionTransition[]> = {
  created: ['activate', 'close', 'error'],
  active: ['pause', 'close', 'expire', 'error'],
  paused: ['resume', 'close', 'expire', 'error'],
  resuming: ['activate', 'close', 'error'],
  closing: ['finish', 'error'],
  closed: [],
  expired: ['close'],
  error: ['reset', 'close'],
}

/**
 * Transition target states
 */
export const TRANSITION_TARGETS: Record<SessionTransition, SessionState> = {
  activate: 'active',
  pause: 'paused',
  resume: 'resuming',
  close: 'closing',
  finish: 'closed',
  expire: 'expired',
  error: 'error',
  reset: 'created',
}

// ==================== Session Metadata ====================

/**
 * Session ownership information
 */
export interface SessionOwner {
  userId: string
  username: string
  displayName?: string
  tenantId: string
  tenantName?: string
  departmentId?: string
  departmentName?: string
}

/**
 * Session runtime metadata
 */
export interface SessionRuntimeMetadata {
  sessionId: string
  ownerId: string
  state: SessionState
  createdAt: number      // Unix timestamp in milliseconds
  updatedAt: number      // Unix timestamp in milliseconds
  lastActiveAt: number   // Unix timestamp in milliseconds
  expiresAt?: number     // Unix timestamp in milliseconds
  pausedAt?: number      // Unix timestamp in milliseconds
  closedAt?: number      // Unix timestamp in milliseconds
  errorReason?: string
  metadata?: Record<string, unknown>
}

/**
 * Session context for host integration
 */
export interface SessionContext {
  session: SessionRuntimeMetadata
  owner: SessionOwner
  hostId?: string        // Host context identifier
  hostType?: string      // Type of host (workbench, dashboard, etc.)
  capabilities: string[] // Available capabilities for this session
}

/**
 * Full session record
 */
export interface SessionRecord {
  id: string
  owner: SessionOwner
  runtime: SessionRuntimeMetadata
  context?: SessionContext
}

// ==================== Session API Types ====================

/**
 * Create session request
 */
export interface CreateSessionRequest {
  owner: SessionOwner
  hostId?: string
  hostType?: string
  capabilities?: string[]
  expiresIn?: number     // Duration in milliseconds
  metadata?: Record<string, unknown>
}

/**
 * Create session response
 */
export interface CreateSessionResponse {
  session: SessionRecord
  success: boolean
  error?: string
}

/**
 * Resume session request
 */
export interface ResumeSessionRequest {
  sessionId: string
  hostId?: string
  hostType?: string
  capabilities?: string[]
}

/**
 * Resume session response
 */
export interface ResumeSessionResponse {
  session: SessionRecord
  success: boolean
  error?: string
}

/**
 * Close session request
 */
export interface CloseSessionRequest {
  sessionId: string
  reason?: string
}

/**
 * Close session response
 */
export interface CloseSessionResponse {
  success: boolean
  error?: string
}

/**
 * Session state change event
 */
export interface SessionStateChangeEvent {
  sessionId: string
  previousState: SessionState
  newState: SessionState
  transition: SessionTransition
  timestamp: number
  reason?: string
}

// ==================== Session Lifecycle Functions ====================

/**
 * Check if a transition is valid from current state
 */
export function isValidTransition(
  currentState: SessionState,
  transition: SessionTransition
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentState]
  return allowedTransitions.includes(transition)
}

/**
 * Get the target state for a transition
 */
export function getTransitionTarget(transition: SessionTransition): SessionState {
  return TRANSITION_TARGETS[transition]
}

/**
 * Attempt a state transition
 * Returns new state if valid, null if invalid
 */
export function attemptTransition(
  currentState: SessionState,
  transition: SessionTransition
): SessionState | null {
  if (!isValidTransition(currentState, transition)) {
    return null
  }
  return getTransitionTarget(transition)
}

/**
 * Generate a unique session ID
 * Uses crypto.getRandomValues for security
 */
export function generateSessionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create a new session record
 */
export function createSessionRecord(
  request: CreateSessionRequest
): SessionRecord {
  const now = Date.now()
  const sessionId = generateSessionId()
  const expiresIn = request.expiresIn ?? 24 * 60 * 60 * 1000 // Default 24 hours

  return {
    id: sessionId,
    owner: request.owner,
    runtime: {
      sessionId,
      ownerId: request.owner.userId,
      state: 'created',
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
      expiresAt: now + expiresIn,
      metadata: request.metadata,
    },
    context: {
      session: {
        sessionId,
        ownerId: request.owner.userId,
        state: 'created',
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        expiresAt: now + expiresIn,
        metadata: request.metadata,
      },
      owner: request.owner,
      hostId: request.hostId,
      hostType: request.hostType,
      capabilities: request.capabilities ?? [],
    },
  }
}

/**
 * Validate session owner
 */
export function validateSessionOwner(owner: SessionOwner): boolean {
  return Boolean(
    owner.userId &&
    owner.username &&
    owner.tenantId
  )
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: SessionRecord): boolean {
  if (session.runtime.state === 'expired' || session.runtime.state === 'closed') {
    return true
  }
  if (session.runtime.expiresAt) {
    return Date.now() > session.runtime.expiresAt
  }
  return false
}

/**
 * Check if session is active and usable
 */
export function isSessionActive(session: SessionRecord): boolean {
  return session.runtime.state === 'active' && !isSessionExpired(session)
}

/**
 * Build session context for host integration
 */
export function buildSessionContext(
  session: SessionRecord,
  hostId?: string,
  hostType?: string,
  capabilities?: string[]
): SessionContext {
  return {
    session: session.runtime,
    owner: session.owner,
    hostId: hostId ?? session.context?.hostId,
    hostType: hostType ?? session.context?.hostType,
    capabilities: capabilities ?? session.context?.capabilities ?? [],
  }
}

/**
 * Create session state change event
 */
export function createStateChangeEvent(
  sessionId: string,
  previousState: SessionState,
  transition: SessionTransition,
  reason?: string
): SessionStateChangeEvent {
  return {
    sessionId,
    previousState,
    newState: getTransitionTarget(transition),
    transition,
    timestamp: Date.now(),
    reason,
  }
}
