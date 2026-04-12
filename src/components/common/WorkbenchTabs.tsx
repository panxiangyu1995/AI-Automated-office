import type { ReactNode } from 'react'
import { useWorkbenchStore, type WorkbenchTab } from '../../stores/workbenchStore'

export interface WorkbenchTabsProps {
  renderContent: (tab: WorkbenchTab) => ReactNode
  emptyState?: ReactNode
  className?: string
}

export function WorkbenchTabs({ renderContent, emptyState, className = '' }: WorkbenchTabsProps) {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useWorkbenchStore()

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {activeTab ? (
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-auto">
            {renderContent(activeTab)}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center">
          {emptyState ?? (
            <div className="text-center">
              <p className="mb-2 text-lg font-medium" style={{ color: '#C9D1D9' }}>
                暂无打开的标签页
              </p>
              <p className="text-sm" style={{ color: '#8B949E' }}>
                从侧边栏或 AI 导航打开内容
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
