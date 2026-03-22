/**
 * Session API Service
 * Task 60: Story 43.1 - Session Lifecycle Management
 * 
 * API service for session create/resume/close operations
 */

import {
  type SessionRecord,
  type SessionOwner,
  type SessionContext,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type ResumeSessionRequest,
  type ResumeSessionResponse,
  type CloseSessionRequest,
  type CloseSessionResponse,
  type SessionStateChangeEvent,
  validateSessionOwner,
} from './sessionLifecycle'
import { sessionStore } from './sessionStore'

// ==================== Session API Class ====================

/**
 * Session API class for managing session lifecycle
 */
export class SessionApi {

  /**
   * Create a new session
   */
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    // Validate owner
    if (!validateSessionOwner(request.owner)) {
      return {
        session: null as unknown as SessionRecord,
        success: false,
        error: 'Invalid session owner: userId, username, and tenantId are required',
      }
    }

    // Use the store to create the session
    return await sessionStore.getState().createSession(request)
  }

  /**
   * Resume an existing session
   */
  async resumeSession(request: ResumeSessionRequest): Promise<ResumeSessionResponse> {
    return await sessionStore.getState().resumeSession(request)
  }

  /**
   * Close a session
   */
  async closeSession(request: CloseSessionRequest): Promise<CloseSessionResponse> {
    return await sessionStore.getState().closeSession(request)
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): SessionRecord | undefined {
    return sessionStore.getState().getSession(sessionId)
  }

  /**
   * Get the active session
   */
  getActiveSession(): SessionRecord | undefined {
    return sessionStore.getState().getActiveSession()
  }

  /**
   * Get all sessions for an owner
   */
  getSessionsByOwner(ownerId: string): SessionRecord[] {
    return sessionStore.getState().getSessionsByOwner(ownerId)
  }

  /**
   * Get all sessions for a tenant
   */
  getSessionsByTenant(tenantId: string): SessionRecord[] {
    return sessionStore.getState().getSessionsByTenant(tenantId)
  }

  /**
   * Check if a session is active
   */
  isSessionActive(sessionId: string): boolean {
    return sessionStore.getState().isSessionActive(sessionId)
  }

  /**
   * Check if a session is expired
   */
  isSessionExpired(sessionId: string): boolean {
    return sessionStore.getState().isSessionExpired(sessionId)
  }

  /**
   * Get session context
   */
  getSessionContext(sessionId: string): SessionContext | undefined {
    return sessionStore.getState().getSessionContext(sessionId)
  }

  /**
   * Update session context
   */
  updateSessionContext(sessionId: string, context: Partial<SessionContext>): boolean {
    return sessionStore.getState().updateSessionContext(sessionId, context)
  }

  /**
   * Activate a session
   */
  activateSession(sessionId: string): boolean {
    return sessionStore.getState().activateSession(sessionId)
  }

  /**
   * Pause a session
   */
  pauseSession(sessionId: string): boolean {
    return sessionStore.getState().pauseSession(sessionId)
  }

  /**
   * Expire a session
   */
  expireSession(sessionId: string, reason?: string): boolean {
    return sessionStore.getState().expireSession(sessionId, reason)
  }

  /**
   * Mark session as error
   */
  errorSession(sessionId: string, reason: string): boolean {
    return sessionStore.getState().errorSession(sessionId, reason)
  }

  /**
   * Reset a session from error state
   */
  resetSession(sessionId: string): boolean {
    return sessionStore.getState().resetSession(sessionId)
  }

  /**
   * Subscribe to session state changes
   */
  subscribeToStateChanges(
    callback: (event: SessionStateChangeEvent) => void
  ): () => void {
    return sessionStore.getState().addStateListener(callback)
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    return sessionStore.getState().cleanupExpiredSessions()
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    sessionStore.getState().clearAllSessions()
  }
}

// ==================== Singleton Instance ====================

let sessionApiInstance: SessionApi | null = null

/**
 * Get the singleton session API instance
 */
export function getSessionApi(): SessionApi {
  if (!sessionApiInstance) {
    sessionApiInstance = new SessionApi()
  }
  return sessionApiInstance
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetSessionApi(): void {
  sessionApiInstance = null
}

// ==================== Convenience Functions ====================

/**
 * Create a new session (convenience function)
 */
export async function createSession(
  owner: SessionOwner,
  options?: {
    hostId?: string
    hostType?: string
    capabilities?: string[]
    expiresIn?: number
    metadata?: Record<string, unknown>
  }
): Promise<CreateSessionResponse> {
  const api = getSessionApi()
  return api.createSession({
    owner,
    hostId: options?.hostId,
    hostType: options?.hostType,
    capabilities: options?.capabilities,
    expiresIn: options?.expiresIn,
    metadata: options?.metadata,
  })
}

/**
 * Resume a session (convenience function)
 */
export async function resumeSession(
  sessionId: string,
  options?: {
    hostId?: string
    hostType?: string
    capabilities?: string[]
  }
): Promise<ResumeSessionResponse> {
  const api = getSessionApi()
  return api.resumeSession({
    sessionId,
    hostId: options?.hostId,
    hostType: options?.hostType,
    capabilities: options?.capabilities,
  })
}

/**
 * Close a session (convenience function)
 */
export async function closeSession(
  sessionId: string,
  reason?: string
): Promise<CloseSessionResponse> {
  const api = getSessionApi()
  return api.closeSession({ sessionId, reason })
}

/**
 * Get active session (convenience function)
 */
export function getActiveSession(): SessionRecord | undefined {
  return getSessionApi().getActiveSession()
}

/**
 * Get session by ID (convenience function)
 */
export function getSession(sessionId: string): SessionRecord | undefined {
  return getSessionApi().getSession(sessionId)
}
