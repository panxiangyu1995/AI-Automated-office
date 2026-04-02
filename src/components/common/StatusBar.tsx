import type { ReactNode } from 'react'
import { SyncStatus } from './SyncStatus'
import { Moon } from 'lucide-react'

interface StatusBarProps {
  message?: string
  rightContent?: ReactNode
}

/**
 * 渲染应用状态栏 - 对齐设置页设计风格
 */
export function StatusBar({ message = '系统就绪', rightContent }: StatusBarProps) {
  return (
    <footer
      className="h-6 px-3 flex items-center justify-between flex-shrink-0"
      style={{ backgroundColor: '#161B22' }}
    >
      {/* 左侧：状态信息 */}
      <span
        className="text-xs"
        style={{ color: '#8B949E' }}
      >
        {message}
      </span>

      {/* 右侧：同步状态和主题 */}
      <div className="flex items-center gap-4">
        {rightContent}
        <SyncStatus />
        
        {/* 主题指示 */}
        <div className="flex items-center gap-1.5">
          <Moon size={12} style={{ color: '#8B949E' }} />
          <span className="text-xs" style={{ color: '#8B949E' }}>
            深色主题
          </span>
        </div>
      </div>
    </footer>
  )
}
