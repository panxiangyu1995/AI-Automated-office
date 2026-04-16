import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'

// Mock tauri lib functions
vi.mock('@/lib/tauri', () => ({
  clearSessionCache: vi.fn(() => Promise.resolve()),
  saveSessionMetadata: vi.fn(() => Promise.resolve()),
  hasSessionCache: vi.fn(() => Promise.resolve(false)),
  getSessionMetadata: vi.fn(() => Promise.resolve(null)),
}))

// Mock auth API
vi.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
  },
}))

describe('authStore', () => {
  beforeEach(() => {
    // Reset auth state
    useAuthStore.getState().clearAuthSession()
  })

  describe('initial state', () => {
    it('should have no user by default', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should not be authenticated by default', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should have no access token by default', () => {
      expect(useAuthStore.getState().accessToken).toBeNull()
    })

    it('should have no refresh token by default', () => {
      expect(useAuthStore.getState().refreshToken).toBeNull()
    })

    it('should have no permissions by default', () => {
      expect(useAuthStore.getState().permissions).toBeNull()
    })
  })

  describe('setAuth', () => {
    it('should set authentication data', async () => {
      await useAuthStore.getState().setAuth({
        user: { id: '1', username: 'admin', name: 'Admin', department: 'IT', role: 'admin' },
        accessToken: 'at-123',
        refreshToken: 'rt-456',
        expiresIn: 3600,
        permissions: { roles: ['admin'], permissions: ['read', 'write'], dataScopes: {} },
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.username).toBe('admin')
      expect(state.accessToken).toBe('at-123')
      expect(state.refreshToken).toBe('rt-456')
      expect(state.permissions?.roles).toContain('admin')
    })

    it('should set permissions to null when not provided', async () => {
      await useAuthStore.getState().setAuth({
        user: { id: '2', username: 'user', name: 'User', department: 'Sales', role: 'user' },
        accessToken: 'at-xxx',
        refreshToken: 'rt-xxx',
        expiresIn: 3600,
      })

      expect(useAuthStore.getState().permissions).toBeNull()
    })
  })

  describe('clearAuthSession', () => {
    it('should clear all auth data', async () => {
      await useAuthStore.getState().setAuth({
        user: { id: '1', username: 'admin', name: 'Admin', department: 'IT', role: 'admin' },
        accessToken: 'at-123',
        refreshToken: 'rt-456',
        expiresIn: 3600,
      })

      await useAuthStore.getState().clearAuthSession()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.permissions).toBeNull()
    })
  })

  describe('updateToken', () => {
    it('should update tokens', async () => {
      await useAuthStore.getState().setAuth({
        user: { id: '1', username: 'admin', name: 'Admin', department: 'IT', role: 'admin' },
        accessToken: 'old-at',
        refreshToken: 'old-rt',
        expiresIn: 3600,
      })

      useAuthStore.getState().updateToken('new-at', 'new-rt')
      expect(useAuthStore.getState().accessToken).toBe('new-at')
      expect(useAuthStore.getState().refreshToken).toBe('new-rt')
    })
  })

  describe('setUser', () => {
    it('should set user without changing auth status when no token', () => {
      useAuthStore.getState().setUser({ id: '1', username: 'test', name: 'Test', department: 'HR', role: 'user' })
      expect(useAuthStore.getState().user?.username).toBe('test')
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('setToken', () => {
    it('should set token without changing auth status when no user', () => {
      useAuthStore.getState().setToken('some-token')
      expect(useAuthStore.getState().accessToken).toBe('some-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
