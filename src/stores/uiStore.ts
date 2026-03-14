import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 活动栏项目类型
export type ActivityBarItem = 
  | 'dashboard' 
  | 'hr' 
  | 'finance' 
  | 'sales' 
  | 'approval' 
  | 'service' 
  | 'warehouse' 
  | 'knowledge'
  | 'settings'

interface UIState {
  // 侧边栏状态
  sidebarWidth: number
  sidebarCollapsed: boolean
  
  // AI 对话面板状态
  chatPanelWidth: number
  chatPanelCollapsed: boolean

  quickSearchOpen: boolean
  
  // 活动栏状态
  activeActivityItem: ActivityBarItem
  
  // 操作方法
  setSidebarWidth: (width: number) => void
  setChatPanelWidth: (width: number) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  openQuickSearch: () => void
  closeQuickSearch: () => void
  toggleQuickSearch: () => void
  setActiveActivityItem: (item: ActivityBarItem) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // 默认值 - 对齐 pencil-new.pen 设计
      sidebarWidth: 240,
      sidebarCollapsed: false,
      chatPanelWidth: 400,
      chatPanelCollapsed: false,
      quickSearchOpen: false,
      activeActivityItem: 'dashboard',
      
      // 操作方法
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      toggleSidebar: () => {
        const current = get().sidebarCollapsed
        console.log('[uiStore] toggleSidebar:', current, '->', !current)
        set({ sidebarCollapsed: !current })
      },
      toggleChatPanel: () => {
        const current = get().chatPanelCollapsed
        console.log('[uiStore] toggleChatPanel:', current, '->', !current)
        set({ chatPanelCollapsed: !current })
      },
      openQuickSearch: () => set({ quickSearchOpen: true }),
      closeQuickSearch: () => set({ quickSearchOpen: false }),
      toggleQuickSearch: () => {
        const current = get().quickSearchOpen
        set({ quickSearchOpen: !current })
      },
      setActiveActivityItem: (item) => set({ activeActivityItem: item }),
    }),
    {
      name: 'ui-layout',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelWidth: state.chatPanelWidth,
        chatPanelCollapsed: state.chatPanelCollapsed,
        activeActivityItem: state.activeActivityItem,
      }),
    }
  )
)
