import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { TopBar } from './TopBar'
import { ActivityBar } from './ActivityBar'
import { Sidebar } from './Sidebar'
import { Workbench } from './Workbench'
import { AiChatPanel } from './AiChatPanel'
import { BottomPanel } from './BottomPanel'
import { StatusBar } from './StatusBar'
import { LayoutSettingsDialog } from './LayoutSettingsDialog'
import { useShortcutListener } from '../../hooks/useGlobalShortcuts'
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'

type SearchResult = {
  id: string
  title: string
  subtitle: string
  icon?: ComponentType<{ className?: string }>
}

const searchResults: SearchResult[] = []

export function AppLayout() {
  const location = useLocation()
  const {
    sidebarCollapsed,
    topBarVisible,
    quickSearchOpen,
    openQuickSearch,
    closeQuickSearch,
    toggleTopBar,
    setActiveActivityItem,
  } = useUIStore(
    useShallow((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      topBarVisible: state.topBarVisible,
      quickSearchOpen: state.quickSearchOpen,
      openQuickSearch: state.openQuickSearch,
      closeQuickSearch: state.closeQuickSearch,
      toggleTopBar: state.toggleTopBar,
      setActiveActivityItem: state.setActiveActivityItem,
    }))
  )
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const activeEditorDocument = useEditorStore((state) => state.activeDocument)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const handleSelectResult = (index: number) => {
    const result = searchResults[index]
    if (!result) return
    console.log('Selected:', result)
    closeQuickSearch()
  }

  useShortcutListener('open-quick-search', openQuickSearch)

  useShortcutListener('open-settings', () => {
    setActiveActivityItem('settings')
  })

  useEffect(() => {
    if (quickSearchOpen) {
      searchInputRef.current?.focus()
      setSelectedIndex(searchResults.length > 0 ? 0 : -1)
    } else {
      setSearchValue('')
    }
  }, [quickSearchOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault()
        toggleTopBar()
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 顶部工具栏 - 必须 */}
      <TopBar 
        visible={topBarVisible} 
        onToggle={toggleTopBar}
        onOpenLayoutDialog={() => setLayoutDialogOpen(true)}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 活动栏 */}
        <ActivityBar />

        {/* 侧边栏 */}
        {!sidebarCollapsed && <Sidebar />}

        {/* 中间区域：工作区 + 底部面板 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 工作区 */}
          <Workbench className="flex-1" />
          
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

      {/* 快速搜索浮层 */}
      {quickSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm"
          onClick={closeQuickSearch}
        >
          <div
            className="mt-24 w-[600px] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            {/* 搜索头部 */}
            <div className="flex h-[60px] items-center gap-3 px-4 border-b border-slate-200">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 text-base outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    closeQuickSearch()
                  }
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    if (searchResults.length > 0) {
                      setSelectedIndex(prev => (prev + 1) % searchResults.length)
                    }
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    if (searchResults.length > 0) {
                      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
                    }
                  }
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    if (searchResults.length > 0) {
                      handleSelectResult(selectedIndex)
                    }
                  }
                }}
              />
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-500">
                ESC
              </div>
            </div>

            {/* 搜索结果 */}
            <div className="p-2 max-h-[400px] overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500">Recent</div>
              <div className="flex flex-col gap-1">
                {searchResults.length === 0 && (
                  <div className="px-3 py-6 text-sm text-slate-500">
                    暂无搜索结果
                  </div>
                )}
                {searchResults.map((result, index) => {
                  const isSelected = index === selectedIndex
                  const Icon = result.icon
                  return (
                    <div
                      key={result.id}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors
                        ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}
                      `}
                      onClick={() => handleSelectResult(index)}
                    >
                      {Icon && (
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-800' : 'text-slate-500'}`} />
                      )}
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {result.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          {result.subtitle}
                        </span>
                      </div>
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 底部提示 */}
            <div className="flex h-9 items-center gap-4 px-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                </div>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3 h-3" />
                <span>Select</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
