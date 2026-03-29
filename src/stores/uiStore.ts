import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LayoutConfig, PresetMode } from '../features/workspace/types/layout'

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

export type SidebarOpenMode = 'static' | 'dynamic' | 'editor'
export type AgentSecondarySurface = 'none' | 'sessions' | 'history'

export interface SidebarOpenTarget {
  path: string
  mode: SidebarOpenMode
  activityItem?: ActivityBarItem
}

export interface SidebarResourceEntry {
  id: string
  label: string
  description?: string
  kind: 'dynamic' | 'editor' | 'recent'
  target: SidebarOpenTarget
}

interface UIState {
  sidebarWidth: number
  sidebarCollapsed: boolean
  chatPanelWidth: number
  chatPanelCollapsed: boolean
  agentSecondarySurface: AgentSecondarySurface
  quickSearchOpen: boolean
  activeActivityItem: ActivityBarItem
  topBarVisible: boolean
  bottomPanelHeight: number
  bottomPanelCollapsed: boolean
  dynamicSidebarEntries: SidebarResourceEntry[]
  editorSidebarEntries: SidebarResourceEntry[]
  recentSidebarEntries: SidebarResourceEntry[]
  // Layout preset state
  activePresetId: string | null
  activePresetMode: PresetMode | null
  aiPanelVisible: boolean
  aiPanelWidth: number
  // Layout preset actions
  setSidebarWidth: (width: number) => void
  setChatPanelWidth: (width: number) => void
  setBottomPanelHeight: (height: number) => void
  setAiPanelWidth: (width: number) => void
  openChatPanel: () => void
  closeChatPanel: () => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  openAgentSecondarySurface: (surface: Exclude<AgentSecondarySurface, 'none'>) => void
  closeAgentSecondarySurface: () => void
  toggleBottomPanel: () => void
  toggleTopBar: () => void
  toggleAiPanel: () => void
  resetLayout: () => void
  openQuickSearch: () => void
  closeQuickSearch: () => void
  toggleQuickSearch: () => void
  setActiveActivityItem: (item: ActivityBarItem) => void
  setDynamicSidebarEntries: (entries: SidebarResourceEntry[]) => void
  setEditorSidebarEntries: (entries: SidebarResourceEntry[]) => void
  registerRecentSidebarEntry: (entry: SidebarResourceEntry) => void
  clearRecentSidebarEntries: () => void
  // Layout preset methods
  applyLayoutPreset: (layout: LayoutConfig, presetId?: string, presetMode?: PresetMode | null) => void
  applyLayoutConfig: (config: Partial<LayoutConfig>) => void
  resetToDefaultLayout: () => void
}

type PersistedUIState = Pick<
  UIState,
  | 'sidebarWidth'
  | 'sidebarCollapsed'
  | 'chatPanelWidth'
  | 'chatPanelCollapsed'
  | 'bottomPanelHeight'
  | 'bottomPanelCollapsed'
  | 'activeActivityItem'
  | 'topBarVisible'
  | 'activePresetId'
  | 'activePresetMode'
  | 'aiPanelVisible'
  | 'aiPanelWidth'
>

const defaultLayout = {
  sidebarWidth: 240,
  sidebarCollapsed: false,
  chatPanelWidth: 400,
  chatPanelCollapsed: false,
  bottomPanelHeight: 200,
  bottomPanelCollapsed: true,
  topBarVisible: true,
  activePresetId: null,
  activePresetMode: null,
  aiPanelVisible: true,
  aiPanelWidth: 400,
}

const createDebouncedStorage = (storage: Storage, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let pendingKey: string | null = null
  let pendingValue: string | null = null

  return {
    getItem: (name: string) => storage.getItem(name),
    setItem: (name: string, value: string) => {
      pendingKey = name
      pendingValue = value
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => {
        if (pendingKey !== null && pendingValue !== null) {
          storage.setItem(pendingKey, pendingValue)
        }
        pendingKey = null
        pendingValue = null
      }, delay)
    },
    removeItem: (name: string) => storage.removeItem(name),
  }
}

export const useUIStore = create<UIState>()(
  persist<UIState, [], [], PersistedUIState>(
    (set, get) => ({
      ...defaultLayout,
      agentSecondarySurface: 'none',
      quickSearchOpen: false,
      activeActivityItem: 'dashboard',
      dynamicSidebarEntries: [],
      editorSidebarEntries: [],
      recentSidebarEntries: [],
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
      setAiPanelWidth: (width) => set({ aiPanelWidth: width }),
      openChatPanel: () => set({ chatPanelCollapsed: false }),
      closeChatPanel: () => set({ chatPanelCollapsed: true, agentSecondarySurface: 'none' }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      toggleChatPanel: () =>
        set((state) => ({
          chatPanelCollapsed: !state.chatPanelCollapsed,
          agentSecondarySurface: state.chatPanelCollapsed ? state.agentSecondarySurface : 'none',
        })),
      openAgentSecondarySurface: (surface) =>
        set({
          chatPanelCollapsed: false,
          agentSecondarySurface: surface,
        }),
      closeAgentSecondarySurface: () => set({ agentSecondarySurface: 'none' }),
      toggleBottomPanel: () => set({ bottomPanelCollapsed: !get().bottomPanelCollapsed }),
      toggleTopBar: () => set({ topBarVisible: !get().topBarVisible }),
      toggleAiPanel: () => set({ aiPanelVisible: !get().aiPanelVisible }),
      resetLayout: () => set({ ...defaultLayout, agentSecondarySurface: 'none' }),
      openQuickSearch: () => set({ quickSearchOpen: true }),
      closeQuickSearch: () => set({ quickSearchOpen: false }),
      toggleQuickSearch: () => set({ quickSearchOpen: !get().quickSearchOpen }),
      setActiveActivityItem: (item) => set({ activeActivityItem: item }),
      setDynamicSidebarEntries: (entries) => set({ dynamicSidebarEntries: entries }),
      setEditorSidebarEntries: (entries) => set({ editorSidebarEntries: entries }),
      registerRecentSidebarEntry: (entry) =>
        set((state) => {
          const nextEntries = [
            { ...entry, kind: 'recent' as const },
            ...state.recentSidebarEntries.filter((item) => item.id !== entry.id),
          ].slice(0, 6)

          return { recentSidebarEntries: nextEntries }
        }),
      clearRecentSidebarEntries: () => set({ recentSidebarEntries: [] }),
      // Layout preset methods
      applyLayoutPreset: (layout, presetId, presetMode) =>
        set({
          sidebarWidth: layout.sidebarWidth,
          sidebarCollapsed: layout.sidebarCollapsed,
          chatPanelWidth: layout.chatPanelWidth,
          chatPanelCollapsed: layout.chatPanelCollapsed,
          bottomPanelHeight: layout.bottomPanelHeight,
          bottomPanelCollapsed: layout.bottomPanelCollapsed,
          topBarVisible: layout.topBarVisible,
          aiPanelVisible: layout.aiPanelVisible,
          activePresetId: presetId || null,
          activePresetMode: presetMode ?? null,
        }),
      applyLayoutConfig: (config) =>
        set((state) => ({
          sidebarWidth: config.sidebarWidth ?? state.sidebarWidth,
          sidebarCollapsed: config.sidebarCollapsed ?? state.sidebarCollapsed,
          chatPanelWidth: config.chatPanelWidth ?? state.chatPanelWidth,
          chatPanelCollapsed: config.chatPanelCollapsed ?? state.chatPanelCollapsed,
          bottomPanelHeight: config.bottomPanelHeight ?? state.bottomPanelHeight,
          bottomPanelCollapsed: config.bottomPanelCollapsed ?? state.bottomPanelCollapsed,
          topBarVisible: config.topBarVisible ?? state.topBarVisible,
          aiPanelVisible: config.aiPanelVisible ?? state.aiPanelVisible,
          activePresetId: null, // Custom config, no preset
          activePresetMode: null,
        })),
      resetToDefaultLayout: () =>
        set({
          ...defaultLayout,
          agentSecondarySurface: 'none',
          activePresetId: null,
          activePresetMode: null,
        }),
    }),
    {
      name: 'ui-layout',
      storage: createJSONStorage(() => createDebouncedStorage(localStorage, 100)),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelWidth: state.chatPanelWidth,
        chatPanelCollapsed: state.chatPanelCollapsed,
        bottomPanelHeight: state.bottomPanelHeight,
        bottomPanelCollapsed: state.bottomPanelCollapsed,
        activeActivityItem: state.activeActivityItem,
        topBarVisible: state.topBarVisible,
        activePresetId: state.activePresetId,
        activePresetMode: state.activePresetMode,
        aiPanelVisible: state.aiPanelVisible,
        aiPanelWidth: state.aiPanelWidth,
      }),
    }
  )
)
