import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Users, Building2 } from 'lucide-react'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'

interface SidebarProps {
  children?: ReactNode
}

// 管理员菜单配置
const adminMenuItems = [
  { id: 'users', label: '用户管理', icon: Users, path: '/admin/users' },
  { id: 'organization', label: '组织架构', icon: Building2, path: '/admin/organization' },
]

export function Sidebar({ children }: SidebarProps) {
  const { 
    sidebarWidth, 
    sidebarCollapsed, 
    setSidebarWidth, 
  } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()

  // 判断是否是管理员路由
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  // 获取当前选中的菜单项
  const getActiveItem = () => {
    if (location.pathname === '/admin/users') return 'users'
    if (location.pathname === '/admin/organization') return 'organization'
    return null
  }
  
  const activeItem = getActiveItem()

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
                {isAdminRoute ? '系统管理' : '功能菜单'}
              </p>
              <nav className="space-y-1">
                {isAdminRoute ? (
                  adminMenuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeItem === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    )
                  })
                ) : (
                  // 默认占位菜单
                  <>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-slate-700 text-white"
                    >
                      菜单项 1
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    >
                      菜单项 2
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    >
                      菜单项 3
                    </button>
                  </>
                )}
              </nav>
            </>
          )}
        </div>
      </div>
    </ResizablePanel>
  )
}