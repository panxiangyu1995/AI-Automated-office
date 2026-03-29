import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  initialized: boolean
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  // Feature flags
  subAgentUIEnabled: boolean  // 控制 SubAgent UI 功能开关
  setInitialized: (value: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSubAgentUIEnabled: (enabled: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      initialized: false,
      theme: 'system',
      sidebarCollapsed: false,
      subAgentUIEnabled: false,  // 默认关闭，等待功能稳定
      setInitialized: (value) => set({ initialized: value }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSubAgentUIEnabled: (enabled) => set({ subAgentUIEnabled: enabled }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        subAgentUIEnabled: state.subAgentUIEnabled,
      }),
    }
  )
)
