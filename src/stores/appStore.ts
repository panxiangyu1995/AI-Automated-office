import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  initialized: boolean
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  // Feature flags
  subAgentUIEnabled: boolean  // 控制 SubAgent UI 功能开关
  // Workspace recovery
  restoreWorkspaceOnStartup: boolean  // 启动时恢复上次工作状态
  setInitialized: (value: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSubAgentUIEnabled: (enabled: boolean) => void
  setRestoreWorkspaceOnStartup: (enabled: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      initialized: false,
      theme: 'system',
      sidebarCollapsed: false,
      subAgentUIEnabled: false,  // 默认关闭，等待功能稳定
      restoreWorkspaceOnStartup: true,  // 默认开启启动恢复
      setInitialized: (value) => set({ initialized: value }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSubAgentUIEnabled: (enabled) => set({ subAgentUIEnabled: enabled }),
      setRestoreWorkspaceOnStartup: (enabled) => set({ restoreWorkspaceOnStartup: enabled }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        subAgentUIEnabled: state.subAgentUIEnabled,
        restoreWorkspaceOnStartup: state.restoreWorkspaceOnStartup,
      }),
    }
  )
)
