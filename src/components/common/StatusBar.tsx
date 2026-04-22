import { useEffect, useState } from 'react'
import { SyncStatus } from './SyncStatus'
import { Moon, Sun, Wifi, WifiOff, Clock } from 'lucide-react'
import { useTheme } from '../../theme'

interface StatusBarProps {
  message?: string
  rightContent?: React.ReactNode
}

/**
 * 渲染应用状态栏 - 对齐UX规范设计
 * 功能：
 * - 显示当前活动上下文和状态
 * - 显示网络连接状态
 * - 显示同步状态
 * - 显示主题模式
 */
export function StatusBar({ message = '系统就绪', rightContent }: StatusBarProps) {
  const { resolvedTheme } = useTheme()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <footer
      className="h-6 px-3 flex items-center justify-between flex-shrink-0 select-none border-t"
      style={{
        backgroundColor: 'var(--ao-statusBar-background)',
        borderColor: 'var(--ao-statusBar-border)',
      }}
    >
      {/* 左侧：状态信息和时间 */}
      <div className="flex items-center gap-4">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--ao-statusBar-foreground)' }}
        >
          {message}
        </span>

        {/* 网络状态 */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi size={11} style={{ color: 'var(--ao-statusBar-foreground)' }} />
          ) : (
            <WifiOff size={11} style={{ color: 'var(--ao-errorForeground, var(--ao-statusBar-foreground))' }} />
          )}
          <span className="text-xs" style={{ color: 'var(--ao-statusBar-foreground)' }}>
            {isOnline ? '已连接' : '离线'}
          </span>
        </div>
      </div>

      {/* 右侧：同步状态、时间和主题 */}
      <div className="flex items-center gap-4">
        {rightContent}
        <SyncStatus />

        {/* 分隔线 */}
        <div
          className="h-3 w-px"
          style={{ backgroundColor: 'var(--ao-statusBar-border)' }}
        />

        {/* 时间 */}
        <div className="flex items-center gap-1.5">
          <Clock size={11} style={{ color: 'var(--ao-statusBar-foreground)' }} />
          <span className="text-xs tabular-nums" style={{ color: 'var(--ao-statusBar-foreground)' }}>
            {formatTime(currentTime)}
          </span>
        </div>

        {/* 分隔线 */}
        <div
          className="h-3 w-px"
          style={{ backgroundColor: 'var(--ao-statusBar-border)' }}
        />

        {/* 主题指示 */}
        <div className="flex items-center gap-1.5">
          {resolvedTheme === 'dark' ? (
            <Moon size={11} style={{ color: 'var(--ao-statusBar-foreground)' }} />
          ) : (
            <Sun size={11} style={{ color: 'var(--ao-statusBar-foreground)' }} />
          )}
          <span className="text-xs" style={{ color: 'var(--ao-statusBar-foreground)' }}>
            {resolvedTheme === 'dark' ? '深色' : resolvedTheme === 'light' ? '浅色' : '高对比'}
          </span>
        </div>
      </div>
    </footer>
  )
}
