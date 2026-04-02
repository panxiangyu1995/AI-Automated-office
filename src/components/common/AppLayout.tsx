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
    <div 
      className="h-screen flex flex-col overflow-hidden" 
      style={{ backgroundColor: '#0F1419' }}
    >
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
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={closeQuickSearch}
        >
          <div
            className="mt-24 w-[600px] flex flex-col rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: '#161B22', 
              border: '1px solid #30363D',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* 搜索头部 */}
            <div 
              className="flex h-[52px] items-center gap-3 px-4"
              style={{ borderBottom: '1px solid #30363D' }}
            >
              <Search size={16} style={{ color: '#8B949E' }} />
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="输入命令或搜索..."
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: '#C9D1D9' }}
              />
              <div 
                className="flex items-center px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: '#21262D', color: '#8B949E' }}
              >
                ESC
              </div>
            </div>

            {/* 搜索结果 */}
            <div className="p-2 max-h-[400px] overflow-y-auto">
              <div 
                className="px-3 py-2 text-xs font-semibold"
                style={{ color: '#8B949E' }}
              >
                最近
              </div>
              <div className="flex flex-col gap-1">
                {searchResults.length === 0 && (
                  <div 
                    className="px-3 py-6 text-sm"
                    style={{ color: '#8B949E' }}
                  >
                    暂无搜索结果
                  </div>
                )}
                {searchResults.map((result, index) => {
                  const isSelected = index === selectedIndex
                  const Icon = result.icon
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isSelected ? '#21262D' : 'transparent',
                      }}
                      onClick={() => handleSelectResult(index)}
                    >
                      {Icon && (
                        <span style={{ color: isSelected ? '#FFFFFF' : '#8B949E' }}>
                          <Icon className="w-4 h-4" />
                        </span>
                      )}
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span 
                          className="text-sm font-medium" 
                          style={{ color: isSelected ? '#FFFFFF' : '#C9D1D9' }}
                        >
                          {result.title}
                        </span>
                        <span 
                          className="text-xs" 
                          style={{ color: '#8B949E' }}
                        >
                          {result.subtitle}
                        </span>
                      </div>
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5" style={{ color: '#8B949E' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 底部提示 */}
            <div 
              className="flex h-9 items-center gap-4 px-4"
              style={{ 
                backgroundColor: '#0D1117',
                borderTop: '1px solid #30363D',
                color: '#8B949E',
                fontSize: '12px',
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                </div>
                <span>导航</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3 h-3" />
                <span>选择</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
