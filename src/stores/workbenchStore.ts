import { create } from 'zustand'

export type TabType = 'file' | 'report' | 'detail' | 'form' | 'custom'

export interface WorkbenchTab {
  id: string
  title: string
  type: TabType
  icon?: string
  closable: boolean
  dirty: boolean
  routeKey?: string
  params?: Record<string, string>
  meta?: Record<string, unknown>
  createdAt: number
}

export interface WorkbenchState {
  tabs: WorkbenchTab[]
  activeTabId: string | null
  maxTabs: number
}

export interface WorkbenchActions {
  addTab: (tab: Omit<WorkbenchTab, 'id' | 'createdAt'>) => string
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<WorkbenchTab>) => void
  closeOtherTabs: (id: string) => void
  closeAllTabs: () => void
  closeTabsToLeft: (id: string) => void
  closeTabsToRight: (id: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  getTabById: (id: string) => WorkbenchTab | undefined
  getActiveTab: () => WorkbenchTab | undefined
  setMaxTabs: (max: number) => void
  clearDirty: (id: string) => void
  // 路由相关方法
  openTabByRoute: (routeKey: string, params?: Record<string, string>) => string
  findTabByRouteKey: (routeKey: string) => WorkbenchTab | undefined
  closeTabByRoute: (routeKey: string) => void
}

export type WorkbenchStore = WorkbenchState & WorkbenchActions

const defaultState: WorkbenchState = {
  tabs: [],
  activeTabId: null,
  maxTabs: 10,
}

export const useWorkbenchStore = create<WorkbenchStore>()((set, get) => ({
  ...defaultState,

  addTab: (tabData) => {
    const { tabs, maxTabs, activeTabId } = get()

    if (tabs.length >= maxTabs) {
      console.warn(`[WorkbenchStore] Tab数量已达上限 (${maxTabs})，请先关闭不需要的Tab`)
      return ''
    }

    const newTab: WorkbenchTab = {
      ...tabData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }

    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
    })

    return newTab.id
  },

  removeTab: (id) => {
    const { tabs, activeTabId } = get()
    const index = tabs.findIndex((t) => t.id === id)

    if (index === -1) return

    const newTabs = tabs.filter((t) => t.id !== id)
    let newActiveTabId = activeTabId

    if (activeTabId === id) {
      if (newTabs.length === 0) {
        newActiveTabId = null
      } else if (index >= newTabs.length) {
        newActiveTabId = newTabs[newTabs.length - 1].id
      } else {
        newActiveTabId = newTabs[index].id
      }
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
    })
  },

  setActiveTab: (id) => {
    const { tabs } = get()
    if (tabs.some((t) => t.id === id)) {
      set({ activeTabId: id })
    }
  },

  updateTab: (id, updates) => {
    const { tabs } = get()
    const index = tabs.findIndex((t) => t.id === id)

    if (index === -1) return

    const newTabs = [...tabs]
    newTabs[index] = { ...newTabs[index], ...updates }

    set({ tabs: newTabs })
  },

  closeOtherTabs: (id) => {
    const { tabs } = get()
    const tab = tabs.find((t) => t.id === id)

    if (!tab) return

    set({
      tabs: [tab],
      activeTabId: id,
    })
  },

  closeAllTabs: () => {
    set({
      tabs: [],
      activeTabId: null,
    })
  },

  closeTabsToLeft: (id) => {
    const { tabs } = get()
    const index = tabs.findIndex((t) => t.id === id)

    if (index <= 0) return

    const newTabs = tabs.slice(index)
    const activeTabStillExists = newTabs.some((t) => t.id === id)

    set({
      tabs: newTabs,
      activeTabId: activeTabStillExists ? id : (newTabs[0]?.id ?? null),
    })
  },

  closeTabsToRight: (id) => {
    const { tabs } = get()
    const index = tabs.findIndex((t) => t.id === id)

    if (index === -1 || index === tabs.length - 1) return

    const newTabs = tabs.slice(0, index + 1)

    set({
      tabs: newTabs,
      activeTabId: id,
    })
  },

  reorderTabs: (fromIndex, toIndex) => {
    const { tabs, activeTabId } = get()

    if (
      fromIndex < 0 ||
      fromIndex >= tabs.length ||
      toIndex < 0 ||
      toIndex >= tabs.length ||
      fromIndex === toIndex
    ) {
      return
    }

    const newTabs = [...tabs]
    const [movedTab] = newTabs.splice(fromIndex, 1)
    newTabs.splice(toIndex, 0, movedTab)

    set({ tabs: newTabs })
  },

  getTabById: (id) => {
    return get().tabs.find((t) => t.id === id)
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId)
  },

  setMaxTabs: (max) => {
    set({ maxTabs: Math.max(1, max) })
  },

  clearDirty: (id) => {
    const { tabs } = get()
    const index = tabs.findIndex((t) => t.id === id)

    if (index === -1) return

    const newTabs = [...tabs]
    newTabs[index] = { ...newTabs[index], dirty: false }

    set({ tabs: newTabs })
  },

  // 路由相关方法
  openTabByRoute: (routeKey, params) => {
    const { tabs, maxTabs, addTab, setActiveTab } = get()

    const existingTab = tabs.find((t) => t.routeKey === routeKey)
    if (existingTab) {
      setActiveTab(existingTab.id)
      return existingTab.id
    }

    const title = routeKey.split('.').pop() ?? routeKey
    return addTab({
      title,
      type: 'custom',
      closable: true,
      dirty: false,
      routeKey,
      params,
    })
  },

  findTabByRouteKey: (routeKey) => {
    return get().tabs.find((t) => t.routeKey === routeKey)
  },

  closeTabByRoute: (routeKey) => {
    const { tabs, removeTab } = get()
    const tab = tabs.find((t) => t.routeKey === routeKey)
    if (tab) {
      removeTab(tab.id)
    }
  },
}))
