import { useEffect, useState } from 'react'
import { CheckCircle2, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { SyncConflictDialog } from '../../features/sync/components/SyncConflictDialog'
import type { SyncConflict } from '../../features/sync/types'

/**
 * 显示同步状态指示
 * 集成 SyncConflictDialog (FR40/FR41) - 冲突时点击显示解决对话框
 */
export function SyncStatus() {
  const {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncCompletedAt,
  } = useNetworkStatus()
  const [showCompleted, setShowCompleted] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  /** 待解决的冲突数量（模拟） */
  const [conflictCount] = useState(0)

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

  return (
    <>
      {conflictCount > 0 && (
        <button
          className="flex items-center gap-1 text-xs"
          style={{ color: 'var(--ao-warningForeground)' }}
          onClick={() => setShowConflictDialog(true)}
          title={`${conflictCount} 个同步冲突`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{conflictCount} 冲突</span>
        </button>
      )}

      {!isOnline && (
        <div className="flex items-center gap-1 text-xs text-white/80">
          <CloudOff className="h-3.5 w-3.5" />
          <span>离线</span>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="flex items-center gap-1 text-xs text-white/80">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>同步中 {pendingSyncCount}</span>
        </div>
      )}

      {isOnline && !isSyncing && pendingSyncCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-white/80">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>待同步 {pendingSyncCount}</span>
        </div>
      )}

      {showCompleted && (
        <div className="flex items-center gap-1 text-xs text-white/80">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>同步完成</span>
        </div>
      )}

      {showConflictDialog && (
        <SyncConflictDialog
          conflicts={[] as SyncConflict[]}
          onResolve={() => setShowConflictDialog(false)}
          onDismiss={() => setShowConflictDialog(false)}
        />
      )}
    </>
  )
}
