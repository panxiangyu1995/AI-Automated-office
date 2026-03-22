/**
 * Session Host Context Integration
 * Task 60: Story 43.1 - Session Lifecycle Management
 * 
 * Integration layer for host context (workbench, dashboard, etc.)
 */

import { useCallback, useEffect, useRef } from 'react'
import {
  type SessionRecord,
  type SessionContext,
  type SessionOwner,
  type SessionStateChangeEvent,
  type CreateSessionResponse,
  type ResumeSessionResponse,
  type CloseSessionResponse,
} from './sessionLifecycle'
import { sessionStore, useActiveSession } from './sessionStore'
import {
  createSession,
  resumeSession,
  closeSession,
} from './sessionApi'

// ==================== Host Types ====================

/**
 * Host type identifiers
 */
export type HostType =
  | 'workbench'
  | 'dashboard'
  | 'editor'
  | 'admin'
  | 'settings'
  | 'custom'

/**
 * Host configuration
 */
export interface HostConfig {
  hostId: string
  hostType: HostType
  capabilities: string[]
  autoCreate?: boolean      // Auto-create session on mount
  autoResume?: boolean      // Auto-resume last session
  autoClose?: boolean       // Auto-close session on unmount
  defaultExpiresIn?: number // Default session duration in ms
}

/**
 * Host context value
 */
export interface HostContextValue {
  session: SessionRecord | undefined
  context: SessionContext | undefined
  isActive: boolean
  isLoading: boolean
  error: string | undefined
  
  create: (owner: SessionOwner, options?: Partial<HostConfig>) => Promise<CreateSessionResponse>
  resume: (sessionId: string) => Promise<ResumeSessionResponse>
  close: (reason?: string) => Promise<CloseSessionResponse>
  pause: () => boolean
  activate: () => boolean
}

// ==================== Host Context Hook ====================

/**
 * Hook to manage session lifecycle for a host
 */
export function useSessionHostContext(config: HostConfig): HostContextValue {
  const {
    hostId,
    hostType,
    capabilities,
    autoCreate = false,
    autoClose = false,
    defaultExpiresIn,
  } = config

  const activeSession = useActiveSession()
  const isLoadingRef = useRef(false)
  const errorRef = useRef<string | undefined>()
  const sessionCreatedRef = useRef(false)

  // Create session
  const create = useCallback(async (
    owner: SessionOwner,
    options?: Partial<HostConfig>
  ): Promise<CreateSessionResponse> => {
    isLoadingRef.current = true
    errorRef.current = undefined

    try {
      const response = await createSession(owner, {
        hostId: options?.hostId ?? hostId,
        hostType: options?.hostType ?? hostType,
        capabilities: options?.capabilities ?? capabilities,
        expiresIn: options?.defaultExpiresIn ?? defaultExpiresIn,
      })

      if (!response.success) {
        errorRef.current = response.error
      }

      return response
    } finally {
      isLoadingRef.current = false
    }
  }, [hostId, hostType, capabilities, defaultExpiresIn])

  // Resume session
  const resume = useCallback(async (
    sessionId: string
  ): Promise<ResumeSessionResponse> => {
    isLoadingRef.current = true
    errorRef.current = undefined

    try {
      const response = await resumeSession(sessionId, {
        hostId,
        hostType,
        capabilities,
      })

      if (!response.success) {
        errorRef.current = response.error
      }

      return response
    } finally {
      isLoadingRef.current = false
    }
  }, [hostId, hostType, capabilities])

  // Close session
  const close = useCallback(async (
    reason?: string
  ): Promise<CloseSessionResponse> => {
    if (!activeSession) {
      return {
        success: false,
        error: 'No active session to close',
      }
    }

    isLoadingRef.current = true
    errorRef.current = undefined

    try {
      const response = await closeSession(activeSession.id, reason)

      if (!response.success) {
        errorRef.current = response.error
      }

      return response
    } finally {
      isLoadingRef.current = false
    }
  }, [activeSession])

  // Pause session
  const pause = useCallback((): boolean => {
    if (!activeSession) return false
    return sessionStore.getState().pauseSession(activeSession.id)
  }, [activeSession])

  // Activate session
  const activate = useCallback((): boolean => {
    if (!activeSession) return false
    return sessionStore.getState().activateSession(activeSession.id)
  }, [activeSession])

  // Auto-create on mount
  useEffect(() => {
    if (autoCreate && !activeSession && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true
      // Note: Owner must be provided by caller, this just sets up the pattern
      console.log('Auto-create session requested for host:', hostId)
    }
  }, [autoCreate, activeSession, hostId])

  // Auto-close on unmount
  useEffect(() => {
    return () => {
      if (autoClose && activeSession) {
        closeSession(activeSession.id, 'Host unmounted').catch(console.error)
      }
    }
  }, [autoClose, activeSession])

  return {
    session: activeSession,
    context: activeSession?.context,
    isActive: activeSession ? sessionStore.getState().isSessionActive(activeSession.id) : false,
    isLoading: isLoadingRef.current,
    error: errorRef.current,
    create,
    resume,
    close,
    pause,
    activate,
  }
}

// ==================== Session State Listener Hook ====================

/**
 * Hook to listen for session state changes
 */
export function useSessionStateListener(
  callback: (event: SessionStateChangeEvent) => void,
  deps: React.DependencyList = []
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const unsubscribe = sessionStore.getState().addStateListener((event) => {
      callbackRef.current(event)
    })

    return unsubscribe
  }, deps)
}

// ==================== Session Cleanup Hook ====================

/**
 * Hook for periodic session cleanup
 */
export function useSessionCleanup(intervalMs: number = 60000): void {
  useEffect(() => {
    const interval = setInterval(() => {
      const cleaned = sessionStore.getState().cleanupExpiredSessions()
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired sessions`)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])
}

// ==================== Host Context Provider ====================

/**
 * Create a session host context for a workbench
 */
export function createWorkbenchSessionContext(
  hostId: string,
  capabilities: string[] = ['read', 'write', 'execute']
): HostConfig {
  return {
    hostId,
    hostType: 'workbench',
    capabilities,
    autoClose: true,
    defaultExpiresIn: 8 * 60 * 60 * 1000, // 8 hours
  }
}

/**
 * Create a session host context for a dashboard
 */
export function createDashboardSessionContext(
  hostId: string,
  capabilities: string[] = ['read']
): HostConfig {
  return {
    hostId,
    hostType: 'dashboard',
    capabilities,
    autoClose: true,
    defaultExpiresIn: 24 * 60 * 60 * 1000, // 24 hours
  }
}

/**
 * Create a session host context for an editor
 */
export function createEditorSessionContext(
  hostId: string,
  capabilities: string[] = ['read', 'write']
): HostConfig {
  return {
    hostId,
    hostType: 'editor',
    capabilities,
    autoClose: true,
    defaultExpiresIn: 4 * 60 * 60 * 1000, // 4 hours
  }
}

// ==================== Session Persistence Integration ====================

/**
 * Persist session to external storage (Tauri backend)
 */
export async function persistSessionToStorage(session: SessionRecord): Promise<boolean> {
  try {
    // Import Tauri storage functions
    const { setStorage } = await import('@/lib/tauri')
    
    await setStorage(`session:${session.id}`, {
      id: session.id,
      ownerId: session.owner.userId,
      tenantId: session.owner.tenantId,
      state: session.runtime.state,
      createdAt: session.runtime.createdAt,
      updatedAt: session.runtime.updatedAt,
      lastActiveAt: session.runtime.lastActiveAt,
      expiresAt: session.runtime.expiresAt,
    })

    return true
  } catch (error) {
    console.error('Failed to persist session:', error)
    return false
  }
}

/**
 * Restore session from external storage (Tauri backend)
 */
export async function restoreSessionFromStorage(sessionId: string): Promise<SessionRecord | null> {
  try {
    const { getStorage } = await import('@/lib/tauri')
    
    const stored = await getStorage<{
      id: string
      ownerId: string
      tenantId: string
      state: string
      createdAt: number
      updatedAt: number
      lastActiveAt: number
      expiresAt?: number
    }>(`session:${sessionId}`)

    if (!stored) {
      return null
    }

    // Check if expired
    if (stored.expiresAt && Date.now() > stored.expiresAt) {
      return null
    }

    // Reconstruct session record
    const session: SessionRecord = {
      id: stored.id,
      owner: {
        userId: stored.ownerId,
        username: '', // Will need to be populated from auth store
        tenantId: stored.tenantId,
      },
      runtime: {
        sessionId: stored.id,
        ownerId: stored.ownerId,
        state: stored.state as SessionRecord['runtime']['state'],
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
        lastActiveAt: stored.lastActiveAt,
        expiresAt: stored.expiresAt,
      },
    }

    return session
  } catch (error) {
    console.error('Failed to restore session:', error)
    return null
  }
}
