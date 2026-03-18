import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  name: string
  department: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearAuthSession: () => void
  switchAccount: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      clearAuthSession: () => set({ user: null, token: null, isAuthenticated: false }),
      switchAccount: () => set({ user: null, token: null, isAuthenticated: false }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        // Persist user info if "Remember Me" is implicitly handled by token validity,
        // or explicitly if we want to show user info offline.
        // For now, let's persist user as well to avoid flicker on reload if token is valid.
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)
