import { create } from 'zustand'
import type { PermissionSummary, User } from '@/features/auth/types/auth.types'
import { authApi } from '@/features/auth/api/authApi'
import {
  clearSessionCache,
  getSessionMetadata,
  hasSessionCache,
  saveSessionMetadata,
  type SessionMetadata,
} from '@/lib/tauri'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  permissions: PermissionSummary | null
  isRestoring: boolean

  setAuth: (data: {
    user: User
    accessToken: string
    refreshToken: string
    expiresIn: number
    permissions?: PermissionSummary
    rememberMe?: boolean
  }) => Promise<void>
  updateToken: (accessToken: string, refreshToken: string) => void

  setUser: (user: User) => void
  setToken: (token: string) => void

  clearAuth: () => Promise<void>
  clearAuthSession: () => Promise<void>
  switchAccount: () => Promise<void>
  logout: () => Promise<void>

  restoreSession: () => Promise<boolean>
  checkCachedSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  permissions: null,
  isRestoring: false,

  setAuth: async (data) => {
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      permissions: data.permissions ?? null,
      isAuthenticated: true,
    })

    if (!data.rememberMe) {
      try {
        await clearSessionCache()
      } catch {
        // ignore cache cleanup failures
      }
      return
    }

    try {
      const now = Math.floor(Date.now() / 1000)
      const metadata: SessionMetadata = {
        user_id: data.user.id,
        username: data.user.username,
        display_name: data.user.name,
        tenant_id: 'default',
        tenant_name: undefined,
        refresh_token: data.refreshToken,
        expires_at: now + data.expiresIn,
        last_active_at: now,
        created_at: now,
      }
      await saveSessionMetadata(metadata)
    } catch {
      // keep login flow successful even if secure cache fails
    }
  },

  updateToken: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken })
  },

  // Compatibility methods: never promote authentication from partial data.
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.accessToken),
    })),

  setToken: (token) =>
    set((state) => ({
      accessToken: token,
      isAuthenticated: Boolean(token && state.user),
    })),

  clearAuth: async () => {
    await get().clearAuthSession()
  },

  clearAuthSession: async () => {
    try {
      await clearSessionCache()
    } catch {
      // ignore
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: null,
      isAuthenticated: false,
      isRestoring: false,
    })
  },

  switchAccount: async () => {
    await get().clearAuthSession()
  },

  logout: async () => {
    await get().clearAuthSession()
  },

  restoreSession: async () => {
    if (get().isRestoring) {
      return false
    }

    set({ isRestoring: true })

    try {
      const hasCache = await hasSessionCache()
      if (!hasCache) {
        set({ isRestoring: false })
        return false
      }

      const metadata = await getSessionMetadata()
      if (!metadata?.refresh_token) {
        set({ isRestoring: false })
        return false
      }

      const refreshed = await authApi.refreshToken(metadata.refresh_token)
      set({
        user: {
          id: metadata.user_id,
          username: metadata.username,
          name: metadata.display_name || metadata.username,
          department: '',
          role: 'user',
        },
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        permissions: null,
        isAuthenticated: true,
        isRestoring: false,
      })

      const now = Math.floor(Date.now() / 1000)
      await saveSessionMetadata({
        ...metadata,
        refresh_token: refreshed.refreshToken,
        expires_at: now + refreshed.expiresIn,
        last_active_at: now,
      })

      return true
    } catch {
      await get().clearAuthSession()
      set({ isRestoring: false })
      return false
    }
  },

  checkCachedSession: async () => {
    try {
      return await hasSessionCache()
    } catch {
      return false
    }
  },
}))
