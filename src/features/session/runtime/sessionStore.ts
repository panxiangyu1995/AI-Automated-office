/**
 * Session Lifecycle Store
 * Task 60: Story 43.1 - Session Lifecycle Management
 * 
 * In-memory store for managing session lifecycle state
 */

import { create } from 'zustand'
import {
  type SessionTransition,
  type SessionRecord,
  type SessionContext,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type ResumeSessionRequest,
  type ResumeSessionResponse,
  type CloseSessionRequest,
  type CloseSessionResponse,
  type SessionStateChangeEvent,
  isValidTransition,
  attemptTransition,
  createSessionRecord,
  validateSessionOwner,
  isSessionExpired,
  isSessionActive,
  createStateChangeEvent,
} from './sessionLifecycle'

// ==================== Store Types ====================

interface SessionStateListener {
  (event: SessionStateChangeEvent): void
}

interface SessionStore {
  // State
  sessions: Map<string, SessionRecord>
  activeSessionId: string | null
  listeners: Set<SessionStateListener>
  
  // Actions
  createSession: (request: CreateSessionRequest) => Promise<CreateSessionResponse>
  resumeSession: (request: ResumeSessionRequest) => Promise<ResumeSessionResponse>
  closeSession: (request: CloseSessionRequest) => Promise<CloseSessionResponse>
  
  // State transitions
  activateSession: (sessionId: string) => boolean
  pauseSession: (sessionId: string) => boolean
  resumeSessionState: (sessionId: string) => boolean
  expireSession: (sessionId: string, reason?: string) => boolean
  errorSession: (sessionId: string, reason: string) => boolean
  resetSession: (sessionId: string) => boolean
  
  // Getters
  getSession: (sessionId: string) => SessionRecord | undefined
  getActiveSession: () => SessionRecord | undefined
  getSessionsByOwner: (ownerId: string) => SessionRecord[]
  getSessionsByTenant: (tenantId: string) => SessionRecord[]
  isSessionActive: (sessionId: string) => boolean
  isSessionExpired: (sessionId: string) => boolean
  
  // Context
  getSessionContext: (sessionId: string) => SessionContext | undefined
  updateSessionContext: (sessionId: string, context: Partial<SessionContext>) => boolean
  
  // Lifecycle
  transitionState: (sessionId: string, transition: SessionTransition, reason?: string) => boolean
  
  // Listeners
  addStateListener: (listener: SessionStateListener) => () => void
  
  // Cleanup
  cleanupExpiredSessions: () => number
  clearAllSessions: () => void
}

// ==================== Store Implementation ====================

export const sessionStore = create<SessionStore>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,
  listeners: new Set(),

  // ==================== Session Creation ====================
  
  createSession: async (request: CreateSessionRequest): Promise<CreateSessionResponse> => {
    try {
      // Validate owner
      if (!validateSessionOwner(request.owner)) {
        return {
          session: null as unknown as SessionRecord,
          success: false,
          error: 'Invalid session owner',
        }
      }

      const session = createSessionRecord(request)
      const sessionId = session.id

      set((state) => {
        const newSessions = new Map(state.sessions)
        newSessions.set(sessionId, session)
        return {
          sessions: newSessions,
          activeSessionId: state.activeSessionId ?? sessionId,
        }
      })

      return {
        session,
        success: true,
      }
    } catch (error) {
      return {
        session: null as unknown as SessionRecord,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  // ==================== Session Resume ====================
  
  resumeSession: async (request: ResumeSessionRequest): Promise<ResumeSessionResponse> => {
    const { sessionId } = request
    const session = get().sessions.get(sessionId)

    if (!session) {
      return {
        session: null as unknown as SessionRecord,
        success: false,
        error: 'Session not found',
      }
    }

    if (isSessionExpired(session)) {
      // Auto-expire the session
      get().expireSession(sessionId, 'Session expired during resume attempt')
      return {
        session: null as unknown as SessionRecord,
        success: false,
        error: 'Session has expired',
      }
    }

    // Check if session is in a resumable state
    if (session.runtime.state !== 'paused' && session.runtime.state !== 'active') {
      return {
        session: null as unknown as SessionRecord,
        success: false,
        error: `Cannot resume session in state: ${session.runtime.state}`,
      }
    }

    // Resume the session
    if (session.runtime.state === 'paused') {
      get().resumeSessionState(sessionId)
    }

    // Update context if provided
    if (request.hostId || request.hostType || request.capabilities) {
      get().updateSessionContext(sessionId, {
        hostId: request.hostId,
        hostType: request.hostType,
        capabilities: request.capabilities,
      })
    }

    // Set as active
    set({ activeSessionId: sessionId })

    const updatedSession = get().sessions.get(sessionId)!
    return {
      session: updatedSession,
      success: true,
    }
  },

  // ==================== Session Close ====================
  
  closeSession: async (request: CloseSessionRequest): Promise<CloseSessionResponse> => {
    const { sessionId, reason } = request
    const session = get().sessions.get(sessionId)

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      }
    }

    const closed = get().transitionState(sessionId, 'close', reason)
    
    if (closed) {
      // Clear active session if this was the active one
      set((state) => {
        if (state.activeSessionId === sessionId) {
          return { activeSessionId: null }
        }
        return {}
      })
    }

    return {
      success: closed,
      error: closed ? undefined : 'Failed to close session',
    }
  },

  // ==================== State Transitions ====================
  
  transitionState: (sessionId: string, transition: SessionTransition, reason?: string): boolean => {
    const session = get().sessions.get(sessionId)
    if (!session) return false

    const currentState = session.runtime.state
    if (!isValidTransition(currentState, transition)) {
      return false
    }

    const newState = attemptTransition(currentState, transition)
    if (!newState) return false

    const now = Date.now()
    const event = createStateChangeEvent(sessionId, currentState, transition, reason)

    set((state) => {
      const newSessions = new Map(state.sessions)
      const existingSession = newSessions.get(sessionId)
      if (!existingSession) return {}

      const updatedSession: SessionRecord = {
        ...existingSession,
        runtime: {
          ...existingSession.runtime,
          state: newState,
          updatedAt: now,
          lastActiveAt: newState === 'active' ? now : existingSession.runtime.lastActiveAt,
          pausedAt: newState === 'paused' ? now : existingSession.runtime.pausedAt,
          closedAt: newState === 'closed' ? now : existingSession.runtime.closedAt,
          errorReason: newState === 'error' ? reason : undefined,
        },
      }

      newSessions.set(sessionId, updatedSession)
      return { sessions: newSessions }
    })

    // Notify listeners
    get().listeners.forEach(listener => listener(event))

    return true
  },

  activateSession: (sessionId: string): boolean => {
    return get().transitionState(sessionId, 'activate')
  },

  pauseSession: (sessionId: string): boolean => {
    return get().transitionState(sessionId, 'pause')
  },

  resumeSessionState: (sessionId: string): boolean => {
    const session = get().sessions.get(sessionId)
    if (!session || session.runtime.state !== 'paused') return false
    
    // First transition to resuming
    const resumed = get().transitionState(sessionId, 'resume')
    if (!resumed) return false

    // Then immediately transition to active
    return get().transitionState(sessionId, 'activate')
  },

  expireSession: (sessionId: string, reason?: string): boolean => {
    return get().transitionState(sessionId, 'expire', reason ?? 'Session expired')
  },

  errorSession: (sessionId: string, reason: string): boolean => {
    return get().transitionState(sessionId, 'error', reason)
  },

  resetSession: (sessionId: string): boolean => {
    return get().transitionState(sessionId, 'reset')
  },

  // ==================== Getters ====================
  
  getSession: (sessionId: string): SessionRecord | undefined => {
    return get().sessions.get(sessionId)
  },

  getActiveSession: (): SessionRecord | undefined => {
    const sessionId = get().activeSessionId
    if (!sessionId) return undefined
    return get().sessions.get(sessionId)
  },

  getSessionsByOwner: (ownerId: string): SessionRecord[] => {
    const sessions = Array.from(get().sessions.values())
    return sessions.filter(s => s.owner.userId === ownerId)
  },

  getSessionsByTenant: (tenantId: string): SessionRecord[] => {
    const sessions = Array.from(get().sessions.values())
    return sessions.filter(s => s.owner.tenantId === tenantId)
  },

  isSessionActive: (sessionId: string): boolean => {
    const session = get().sessions.get(sessionId)
    return session ? isSessionActive(session) : false
  },

  isSessionExpired: (sessionId: string): boolean => {
    const session = get().sessions.get(sessionId)
    return session ? isSessionExpired(session) : true
  },

  // ==================== Context ====================
  
  getSessionContext: (sessionId: string): SessionContext | undefined => {
    const session = get().sessions.get(sessionId)
    return session?.context
  },

  updateSessionContext: (sessionId: string, contextUpdate: Partial<SessionContext>): boolean => {
    const session = get().sessions.get(sessionId)
    if (!session) return false

    set((state) => {
      const newSessions = new Map(state.sessions)
      const existingSession = newSessions.get(sessionId)
      if (!existingSession) return {}

      const updatedSession: SessionRecord = {
        ...existingSession,
        context: {
          ...existingSession.context!,
          ...contextUpdate,
          session: existingSession.runtime,
        },
      }

      newSessions.set(sessionId, updatedSession)
      return { sessions: newSessions }
    })

    return true
  },

  // ==================== Listeners ====================
  
  addStateListener: (listener: SessionStateListener): (() => void) => {
    set((state) => {
      const newListeners = new Set(state.listeners)
      newListeners.add(listener)
      return { listeners: newListeners }
    })

    // Return unsubscribe function
    return () => {
      set((state) => {
        const newListeners = new Set(state.listeners)
        newListeners.delete(listener)
        return { listeners: newListeners }
      })
    }
  },

  // ==================== Cleanup ====================
  
  cleanupExpiredSessions: (): number => {
    let cleanedCount = 0
    
    set((state) => {
      const newSessions = new Map(state.sessions)
      
      newSessions.forEach((session, sessionId) => {
        if (isSessionExpired(session)) {
          newSessions.delete(sessionId)
          cleanedCount++
        }
      })

      // Clear activeSessionId if it was cleaned
      let newActiveId = state.activeSessionId
      if (newActiveId && !newSessions.has(newActiveId)) {
        newActiveId = null
      }

      return {
        sessions: newSessions,
        activeSessionId: newActiveId,
      }
    })

    return cleanedCount
  },

  clearAllSessions: (): void => {
    set({
      sessions: new Map(),
      activeSessionId: null,
    })
  },
}))

// ==================== Utility Hooks ====================

/**
 * Hook to get the active session
 */
export function useActiveSession(): SessionRecord | undefined {
  return sessionStore((state) => {
    const sessionId = state.activeSessionId
    if (!sessionId) return undefined
    return state.sessions.get(sessionId)
  })
}

/**
 * Hook to get sessions by owner
 */
export function useSessionsByOwner(ownerId: string): SessionRecord[] {
  return sessionStore((state) =>
    Array.from(state.sessions.values()).filter(s => s.owner.userId === ownerId)
  )
}

/**
 * Hook to listen for session state changes
 */
export function useSessionStateListener(
  _callback: (event: SessionStateChangeEvent) => void
): void {
  // Use useEffect pattern in React components
  // This is just the store utility, components should wrap with useEffect
}
