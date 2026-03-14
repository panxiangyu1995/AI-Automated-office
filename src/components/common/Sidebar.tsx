import { type ReactNode } from 'react'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'

interface SidebarProps {
  children?: ReactNode
}

// 侧边栏菜单配置 - 根据 pencil-new.pen 设计
const defaultMenuItems = [
  { id: 'item1', label: '菜单项 1' },
  { id: 'item2', label: '菜单项 2' },
  { id: 'item3', label: '菜单项 3' },
]

export function Sidebar({ children }: SidebarProps) {
  const { 
    sidebarWidth, 
    sidebarCollapsed, 
    setSidebarWidth, 
  } = useUIStore()

  return (
    <ResizablePanel
      width={sidebarWidth}
      minWidth={200}
      maxWidth={280}
      onWidthChange={setSidebarWidth}
      direction="right"
      collapsed={sidebarCollapsed}
      className="h-full"
    >
      <div 
        className="h-full flex flex-col"
        style={{ backgroundColor: '#1E293B' }}
      >
        {/* 菜单内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {children || (
            <>
              <p 
                className="text-xs font-bold mb-2"
                style={{ color: '#94A3B8' }}
              >
                功能菜单
              </p>
              <nav className="space-y-1">
                {defaultMenuItems.map((item, index) => (
                  <button
                    key={item.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      index === 0 
                        ? 'bg-slate-700 text-white' 
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>
      </div>
    </ResizablePanel>
  )
}