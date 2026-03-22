/**
 * Session Lifecycle Unit Tests
 * Task 60: Story 43.1 - Session Lifecycle Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  type SessionState,
  type SessionTransition,
  type SessionOwner,
  type SessionRecord,
  VALID_TRANSITIONS,
  TRANSITION_TARGETS,
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
} from '@/features/session/runtime/sessionLifecycle'

// ==================== State Transitions ====================

describe('Session State Transitions', () => {
  describe('isValidTransition', () => {
    it('should return true for valid transitions from created state', () => {
      expect(isValidTransition('created', 'activate')).toBe(true)
      expect(isValidTransition('created', 'close')).toBe(true)
      expect(isValidTransition('created', 'error')).toBe(true)
    })

    it('should return false for invalid transitions from created state', () => {
      expect(isValidTransition('created', 'pause')).toBe(false)
      expect(isValidTransition('created', 'resume')).toBe(false)
      expect(isValidTransition('created', 'expire')).toBe(false)
    })

    it('should return true for valid transitions from active state', () => {
      expect(isValidTransition('active', 'pause')).toBe(true)
      expect(isValidTransition('active', 'close')).toBe(true)
      expect(isValidTransition('active', 'expire')).toBe(true)
      expect(isValidTransition('active', 'error')).toBe(true)
    })

    it('should return false for invalid transitions from active state', () => {
      expect(isValidTransition('active', 'activate')).toBe(false)
      expect(isValidTransition('active', 'resume')).toBe(false)
    })

    it('should return true for valid transitions from paused state', () => {
      expect(isValidTransition('paused', 'resume')).toBe(true)
      expect(isValidTransition('paused', 'close')).toBe(true)
      expect(isValidTransition('paused', 'expire')).toBe(true)
    })

    it('should return true for valid transitions from closing state', () => {
      expect(isValidTransition('closing', 'finish')).toBe(true)
      expect(isValidTransition('closing', 'error')).toBe(true)
    })

    it('should return true for valid transitions from error state', () => {
      expect(isValidTransition('error', 'reset')).toBe(true)
      expect(isValidTransition('error', 'close')).toBe(true)
    })

    it('should return false for all transitions from closed state', () => {
      expect(isValidTransition('closed', 'activate')).toBe(false)
      expect(isValidTransition('closed', 'close')).toBe(false)
      expect(isValidTransition('closed', 'error')).toBe(false)
    })
  })

  describe('getTransitionTarget', () => {
    it('should return correct target states', () => {
      expect(getTransitionTarget('activate')).toBe('active')
      expect(getTransitionTarget('pause')).toBe('paused')
      expect(getTransitionTarget('resume')).toBe('resuming')
      expect(getTransitionTarget('close')).toBe('closing')
      expect(getTransitionTarget('finish')).toBe('closed')
      expect(getTransitionTarget('expire')).toBe('expired')
      expect(getTransitionTarget('error')).toBe('error')
      expect(getTransitionTarget('reset')).toBe('created')
    })
  })

  describe('attemptTransition', () => {
    it('should return target state for valid transitions', () => {
      expect(attemptTransition('created', 'activate')).toBe('active')
      expect(attemptTransition('active', 'pause')).toBe('paused')
      expect(attemptTransition('paused', 'resume')).toBe('resuming')
      expect(attemptTransition('active', 'close')).toBe('closing')
      expect(attemptTransition('closing', 'finish')).toBe('closed')
    })

    it('should return null for invalid transitions', () => {
      expect(attemptTransition('created', 'pause')).toBe(null)
      expect(attemptTransition('active', 'activate')).toBe(null)
      expect(attemptTransition('closed', 'activate')).toBe(null)
    })
  })
})

// ==================== Session ID Generation ====================

describe('generateSessionId', () => {
  it('should generate a 32-character hex string', () => {
    const id = generateSessionId()
    expect(id).toHaveLength(32)
    expect(/^[0-9a-f]+$/.test(id)).toBe(true)
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId())
    }
    expect(ids.size).toBe(100)
  })
})

// ==================== Session Owner Validation ====================

describe('validateSessionOwner', () => {
  it('should return true for valid owner', () => {
    const owner: SessionOwner = {
      userId: 'user-123',
      username: 'testuser',
      tenantId: 'tenant-456',
    }
    expect(validateSessionOwner(owner)).toBe(true)
  })

  it('should return true for owner with optional fields', () => {
    const owner: SessionOwner = {
      userId: 'user-123',
      username: 'testuser',
      tenantId: 'tenant-456',
      displayName: 'Test User',
      tenantName: 'Test Tenant',
      departmentId: 'dept-789',
      departmentName: 'Engineering',
    }
    expect(validateSessionOwner(owner)).toBe(true)
  })

  it('should return false for missing userId', () => {
    const owner = {
      username: 'testuser',
      tenantId: 'tenant-456',
    } as SessionOwner
    expect(validateSessionOwner(owner)).toBe(false)
  })

  it('should return false for missing username', () => {
    const owner = {
      userId: 'user-123',
      tenantId: 'tenant-456',
    } as SessionOwner
    expect(validateSessionOwner(owner)).toBe(false)
  })

  it('should return false for missing tenantId', () => {
    const owner = {
      userId: 'user-123',
      username: 'testuser',
    } as SessionOwner
    expect(validateSessionOwner(owner)).toBe(false)
  })
})

// ==================== Session Record Creation ====================

describe('createSessionRecord', () => {
  const validOwner: SessionOwner = {
    userId: 'user-123',
    username: 'testuser',
    tenantId: 'tenant-456',
  }

  it('should create a session record with default values', () => {
    const record = createSessionRecord({ owner: validOwner })

    expect(record.id).toBeDefined()
    expect(record.id).toHaveLength(32)
    expect(record.owner).toEqual(validOwner)
    expect(record.runtime.state).toBe('created')
    expect(record.runtime.ownerId).toBe('user-123')
    expect(record.runtime.createdAt).toBeDefined()
    expect(record.runtime.updatedAt).toBeDefined()
    expect(record.runtime.lastActiveAt).toBeDefined()
    expect(record.runtime.expiresAt).toBeDefined()
  })

  it('should create a session record with custom expiresIn', () => {
    const customExpiresIn = 2 * 60 * 60 * 1000 // 2 hours
    const record = createSessionRecord({
      owner: validOwner,
      expiresIn: customExpiresIn,
    })

    const expectedExpiry = record.runtime.createdAt + customExpiresIn
    expect(record.runtime.expiresAt).toBe(expectedExpiry)
  })

  it('should create a session record with host context', () => {
    const record = createSessionRecord({
      owner: validOwner,
      hostId: 'host-789',
      hostType: 'workbench',
      capabilities: ['read', 'write'],
    })

    expect(record.context).toBeDefined()
    expect(record.context?.hostId).toBe('host-789')
    expect(record.context?.hostType).toBe('workbench')
    expect(record.context?.capabilities).toEqual(['read', 'write'])
  })

  it('should create a session record with metadata', () => {
    const metadata = { source: 'test', version: '1.0' }
    const record = createSessionRecord({
      owner: validOwner,
      metadata,
    })

    expect(record.runtime.metadata).toEqual(metadata)
  })
})

// ==================== Session Expiry ====================

describe('isSessionExpired', () => {
  const createTestSession = (state: SessionState, expiresAt?: number): SessionRecord => {
    return {
      id: 'test-session-id',
      owner: {
        userId: 'user-123',
        username: 'testuser',
        tenantId: 'tenant-456',
      },
      runtime: {
        sessionId: 'test-session-id',
        ownerId: 'user-123',
        state,
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt,
      },
    }
  }

  it('should return true for expired state', () => {
    const session = createTestSession('expired')
    expect(isSessionExpired(session)).toBe(true)
  })

  it('should return true for closed state', () => {
    const session = createTestSession('closed')
    expect(isSessionExpired(session)).toBe(true)
  })

  it('should return true when expiresAt is in the past', () => {
    const session = createTestSession('active', Date.now() - 1000)
    expect(isSessionExpired(session)).toBe(true)
  })

  it('should return false for active session with future expiry', () => {
    const session = createTestSession('active', Date.now() + 3600000)
    expect(isSessionExpired(session)).toBe(false)
  })

  it('should return false for active session without expiresAt', () => {
    const session = createTestSession('active', undefined)
    expect(isSessionExpired(session)).toBe(false)
  })
})

// ==================== Session Active Check ====================

describe('isSessionActive', () => {
  const createTestSession = (state: SessionState, expiresAt?: number): SessionRecord => {
    return {
      id: 'test-session-id',
      owner: {
        userId: 'user-123',
        username: 'testuser',
        tenantId: 'tenant-456',
      },
      runtime: {
        sessionId: 'test-session-id',
        ownerId: 'user-123',
        state,
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt,
      },
    }
  }

  it('should return true for active state with valid expiry', () => {
    const session = createTestSession('active', Date.now() + 3600000)
    expect(isSessionActive(session)).toBe(true)
  })

  it('should return false for non-active states', () => {
    expect(isSessionActive(createTestSession('created'))).toBe(false)
    expect(isSessionActive(createTestSession('paused'))).toBe(false)
    expect(isSessionActive(createTestSession('closed'))).toBe(false)
    expect(isSessionActive(createTestSession('expired'))).toBe(false)
  })

  it('should return false for expired active session', () => {
    const session = createTestSession('active', Date.now() - 1000)
    expect(isSessionActive(session)).toBe(false)
  })
})

// ==================== Session Context ====================

describe('buildSessionContext', () => {
  const testSession: SessionRecord = {
    id: 'test-session-id',
    owner: {
      userId: 'user-123',
      username: 'testuser',
      tenantId: 'tenant-456',
      displayName: 'Test User',
    },
    runtime: {
      sessionId: 'test-session-id',
      ownerId: 'user-123',
      state: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    },
    context: {
      session: {} as any,
      owner: {
        userId: 'user-123',
        username: 'testuser',
        tenantId: 'tenant-456',
        displayName: 'Test User',
      },
      hostId: 'original-host',
      hostType: 'workbench',
      capabilities: ['read'],
    },
  }

  it('should build context from session with defaults', () => {
    const context = buildSessionContext(testSession)

    expect(context.session).toEqual(testSession.runtime)
    expect(context.owner).toEqual(testSession.owner)
    expect(context.hostId).toBe('original-host')
    expect(context.capabilities).toEqual(['read'])
  })

  it('should override host context values', () => {
    const context = buildSessionContext(
      testSession,
      'new-host',
      'dashboard',
      ['read', 'write', 'execute']
    )

    expect(context.hostId).toBe('new-host')
    expect(context.hostType).toBe('dashboard')
    expect(context.capabilities).toEqual(['read', 'write', 'execute'])
  })
})

// ==================== State Change Events ====================

describe('createStateChangeEvent', () => {
  it('should create a valid state change event', () => {
    const event = createStateChangeEvent(
      'session-123',
      'active',
      'pause',
      'User requested pause'
    )

    expect(event.sessionId).toBe('session-123')
    expect(event.previousState).toBe('active')
    expect(event.newState).toBe('paused')
    expect(event.transition).toBe('pause')
    expect(event.timestamp).toBeDefined()
    expect(event.reason).toBe('User requested pause')
  })

  it('should create event without reason', () => {
    const event = createStateChangeEvent('session-123', 'created', 'activate')

    expect(event.reason).toBeUndefined()
  })
})

// ==================== Valid Transitions Map ====================

describe('VALID_TRANSITIONS', () => {
  it('should have all states defined', () => {
    const expectedStates: SessionState[] = [
      'created', 'active', 'paused', 'resuming', 'closing', 'closed', 'expired', 'error'
    ]
    
    expectedStates.forEach(state => {
      expect(VALID_TRANSITIONS[state]).toBeDefined()
    })
  })

  it('should have non-empty transition arrays for non-terminal states', () => {
    const nonTerminalStates: SessionState[] = ['created', 'active', 'paused', 'resuming', 'closing', 'expired', 'error']
    
    nonTerminalStates.forEach(state => {
      expect(VALID_TRANSITIONS[state].length).toBeGreaterThan(0)
    })
  })

  it('should have empty transition array for closed state', () => {
    expect(VALID_TRANSITIONS['closed']).toEqual([])
  })
})

// ==================== Transition Targets Map ====================

describe('TRANSITION_TARGETS', () => {
  it('should have all transitions defined', () => {
    const expectedTransitions: SessionTransition[] = [
      'activate', 'pause', 'resume', 'close', 'finish', 'expire', 'error', 'reset'
    ]
    
    expectedTransitions.forEach(transition => {
      expect(TRANSITION_TARGETS[transition]).toBeDefined()
    })
  })
})
