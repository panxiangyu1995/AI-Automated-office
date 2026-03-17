import type { ReactNode } from 'react'
import { SyncStatus } from './SyncStatus'

interface StatusBarProps {
  message?: string
  rightContent?: ReactNode
}

/**
 * 渲染应用状态栏
 */
export function StatusBar({ message = '系统就绪', rightContent }: StatusBarProps) {
  return (
    <footer 
      className="h-6 px-3 flex items-center justify-between flex-shrink-0"
      style={{ backgroundColor: '#1E3A5F' }}
    >
      <span 
        className="text-xs"
        style={{ color: 'rgba(255, 255, 255, 0.8)' }}
      >
        {message}
      </span>
      <div className="flex items-center gap-2">
        {rightContent}
        <SyncStatus />
      </div>
    </footer>
  )
}
