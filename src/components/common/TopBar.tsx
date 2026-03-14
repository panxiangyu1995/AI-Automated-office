import { Bell, Settings, User } from 'lucide-react'

interface TopBarProps {
  department?: string
  userName?: string
}

export function TopBar({ department = '首页', userName }: TopBarProps) {
  return (
    <header
      className="h-10 px-4 flex items-center justify-between flex-shrink-0"
      style={{ backgroundColor: '#1E3A5F' }}
    >
      {/* 左侧标题 */}
      <h1 className="text-white font-bold text-sm">
        AI-Automated-Office - {department}
      </h1>
      
      {/* 右侧操作区 */}
      <div className="flex items-center gap-4">
        <button 
          className="text-white hover:opacity-80 transition-opacity"
          aria-label="通知"
        >
          <Bell size={16} />
        </button>
        <button 
          className="text-white hover:opacity-80 transition-opacity"
          aria-label="设置"
        >
          <Settings size={16} />
        </button>
        {userName && (
          <div className="flex items-center gap-2 text-white text-sm">
            <User size={16} />
            <span>{userName}</span>
          </div>
        )}
      </div>
    </header>
  )
}
