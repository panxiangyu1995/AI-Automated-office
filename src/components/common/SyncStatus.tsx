import { useEffect, useState } from 'react'
import { CheckCircle2, CloudOff, RefreshCw } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

/**
 * 显示同步状态指示
 */
export function SyncStatus() {
  const {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncCompletedAt,
  } = useNetworkStatus()
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    if (!lastSyncCompletedAt) {
      return
    }
    setShowCompleted(true)
    const timer = window.setTimeout(() => {
      setShowCompleted(false)
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [lastSyncCompletedAt])

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 text-xs text-white/80">
        <CloudOff className="h-3.5 w-3.5" />
        <span>离线</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1 text-xs text-white/80">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>同步中 {pendingSyncCount}</span>
      </div>
    )
  }

  if (pendingSyncCount > 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-white/80">
        <RefreshCw className="h-3.5 w-3.5" />
        <span>待同步 {pendingSyncCount}</span>
      </div>
    )
  }

  if (showCompleted) {
    return (
      <div className="flex items-center gap-1 text-xs text-white/80">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>同步完成</span>
      </div>
    )
  }

  return null
}
