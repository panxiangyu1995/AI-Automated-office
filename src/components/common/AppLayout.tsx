import { useEffect, useState } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { useAppStore } from '../../stores/appStore'
import { TopBar } from './TopBar'
import { ActivityBar } from './ActivityBar'
import { Sidebar } from './Sidebar'
import { Workbench } from './Workbench'
import { AiChatPanel } from './AiChatPanel'
import { BottomPanel } from './BottomPanel'
import { StatusBar } from './StatusBar'
import { LayoutSettingsDialog } from './LayoutSettingsDialog'
import { CommandPalette } from './CommandPalette'
import { QuickAsk } from './QuickAsk'
import { useShortcutListener } from '../../hooks/useGlobalShortcuts'
import { usePluginSidebar } from '../../hooks/usePluginSidebar'
import { useWorkspaceStateRecovery } from '../../hooks/useWorkspaceStateRecovery'
import { systemCommands } from '../../lib/systemCommands'

export function AppLayout() {
  const location = useLocation()
  const { topBarVisible, sidebarCollapsed, toggleTopBar, setActiveActivityItem, quickSearchOpen: storeQuickSearchOpen, openQuickSearch: storeOpenQuickSearch, closeQuickSearch: storeCloseQuickSearch, activityBarVisible, zoomLevel } = useUIStore(
    useShallow((state) => ({
      topBarVisible: state.topBarVisible,
      sidebarCollapsed: state.sidebarCollapsed,
      quickSearchOpen: state.quickSearchOpen,
      openQuickSearch: state.openQuickSearch,
      closeQuickSearch: state.closeQuickSearch,
      toggleTopBar: state.toggleTopBar,
      setActiveActivityItem: state.setActiveActivityItem,
      activityBarVisible: state.activityBarVisible,
      zoomLevel: state.zoomLevel,
    }))
  )
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false)
  const [quickAskOpen, setQuickAskOpen] = useState(false)
  const activeEditorDocument = useEditorStore((state) => state.activeDocument)

  // Workspace state recovery
  const restoreWorkspaceOnStartup = useAppStore((state) => state.restoreWorkspaceOnStartup)
  useWorkspaceStateRecovery({
    enabled: restoreWorkspaceOnStartup,
  })

  // Initialize system commands once
  useEffect(() => {
    systemCommands.init()
  }, [])

  // Initialize plugin sidebar registry
  usePluginSidebar()

  // Use store functions for Quick Open
  const quickSearchOpen = storeQuickSearchOpen
  const openQuickSearch = storeOpenQuickSearch
  const closeQuickSearch = storeCloseQuickSearch

  useShortcutListener('open-quick-search', openQuickSearch)

  useShortcutListener('open-settings', () => {
    setActiveActivityItem('settings')
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault()
        toggleTopBar()
      }
      // Quick Ask: Ctrl+L / Cmd+L
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        setQuickAskOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggleTopBar])

  const statusMessage = (() => {
    if (!location.pathname.startsWith('/editor') || !activeEditorDocument) {
      return '系统就绪'
    }

    if (activeEditorDocument.isSaving) {
      return `${activeEditorDocument.title} · 保存中...`
    }

    if (activeEditorDocument.isDirty) {
      return `${activeEditorDocument.title} · 未保存更改`
    }

    return `${activeEditorDocument.title} · 已保存`
  })()

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden" 
      style={{ backgroundColor: 'var(--ao-workbench-background)' }}
    >
      {/* 顶部工具栏 - 必须 */}
      <TopBar 
        visible={topBarVisible} 
        onToggle={toggleTopBar}
        onOpenLayoutDialog={() => setLayoutDialogOpen(true)}
      />

      {/* 主内容区 */}
      <div
        className="flex-1 flex overflow-hidden"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
      >
        {/* 活动栏 */}
        {activityBarVisible && <ActivityBar />}

        {/* 侧边栏 */}
        {!sidebarCollapsed && <Sidebar />}

        {/* 中间区域：工作区 + 底部面板 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 工作区 */}
          <Workbench className="flex-1">
            <Outlet />
          </Workbench>

          {/* 底部面板 */}
          <BottomPanel />
        </div>

        {/* AI 对话面板 */}
        <AiChatPanel />
      </div>

      {/* 状态栏 */}
      <StatusBar message={statusMessage} />

      {/* 布局设置对话框 */}
      <LayoutSettingsDialog 
        open={layoutDialogOpen} 
        onOpenChange={setLayoutDialogOpen} 
      />

      {/* Command Palette */}
      <CommandPalette
        open={quickSearchOpen}
        onClose={closeQuickSearch}
      />

      {/* Quick Ask */}
      <QuickAsk
        open={quickAskOpen}
        onClose={() => setQuickAskOpen(false)}
      />
    </div>
  )
}
