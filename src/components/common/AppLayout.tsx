import { useEffect, useRef, useState } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { TopBar } from './TopBar'
import { ActivityBar } from './ActivityBar'
import { Sidebar } from './Sidebar'
import { Workbench } from './Workbench'
import { AiChatPanel } from './AiChatPanel'
import { StatusBar } from './StatusBar'
import { useShortcutListener } from '../../hooks/useGlobalShortcuts'

// 部门名称映射
const departmentNames: Record<string, string> = {
  dashboard: '首页',
  hr: '人事部',
  finance: '财务部',
  sales: '销售部',
  approval: '审批中心',
  service: '售后服务',
  warehouse: '仓储部',
  knowledge: '知识库',
  settings: '系统设置',
}

export function AppLayout() {
  const { 
    activeActivityItem, 
    sidebarCollapsed,
    quickSearchOpen,
    openQuickSearch,
    closeQuickSearch,
  } = useUIStore()
  const departmentName = departmentNames[activeActivityItem] || '首页'
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useShortcutListener('open-quick-search', () => {
    openQuickSearch()
  })

  useEffect(() => {
    if (quickSearchOpen) {
      searchInputRef.current?.focus()
    } else {
      setSearchValue('')
    }
  }, [quickSearchOpen])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 顶部工具栏 - 必须 */}
      <TopBar department={departmentName} />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 活动栏 */}
        <ActivityBar />

        {/* 侧边栏 */}
        {!sidebarCollapsed && <Sidebar />}

        {/* 工作区 */}
        <Workbench />

        {/* AI 对话面板 */}
        <AiChatPanel />
      </div>

      {/* 状态栏 */}
      <StatusBar />

      {quickSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30"
          onClick={closeQuickSearch}
        >
          <div
            className="mt-24 w-[560px] rounded-lg bg-white shadow-xl border border-slate-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200">
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="输入关键词进行快速搜索..."
                className="w-full text-sm outline-none bg-transparent"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    closeQuickSearch()
                  }
                }}
              />
            </div>
            <div className="max-h-[320px] overflow-auto px-4 py-3 text-sm text-slate-600">
              {searchValue ? `搜索关键字：${searchValue}` : '请输入关键字后进行搜索'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
