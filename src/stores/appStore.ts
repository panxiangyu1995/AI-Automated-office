import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  initialized: boolean
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  setInitialized: (value: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      initialized: false,
      theme: 'system',
      sidebarCollapsed: false,
      setInitialized: (value) => set({ initialized: value }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
