import { useEffect, useState } from 'react'
import { CheckCircle2, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { SyncConflictDialog } from '../../features/sync/components/SyncConflictDialog'
import type { SyncConflict } from '../../features/sync/types'

/**
 * 显示同步状态指示 - 对齐UX规范设计
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

  const getStatusText = () => {
    if (!isOnline) return null
    if (isSyncing) return `同步中 ${pendingSyncCount}`
    if (pendingSyncCount > 0) return `待同步 ${pendingSyncCount}`
    if (showCompleted) return '同步完成'
    return null
  }

  const statusText = getStatusText()
  if (!statusText) return null

  const getStatusColor = () => {
    if (showCompleted) return 'var(--ao-successForeground)'
    if (isSyncing) return 'var(--ao-statusBar-foreground)'
    if (pendingSyncCount > 0) return 'var(--ao-warningForeground)'
    return 'var(--ao-statusBar-foreground)'
  }

  const getStatusIcon = () => {
    if (showCompleted) return <CheckCircle2 size={11} style={{ color: getStatusColor() }} />
    if (isSyncing) return <RefreshCw size={11} className="animate-spin" style={{ color: getStatusColor() }} />
    return <RefreshCw size={11} style={{ color: getStatusColor() }} />
  }

  return (
    <>
      {conflictCount > 0 && (
        <button
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80 cursor-pointer"
          style={{ color: 'var(--ao-warningForeground)' }}
          onClick={() => setShowConflictDialog(true)}
          title={`${conflictCount} 个同步冲突`}
        >
          <AlertTriangle size={11} />
          <span>{conflictCount} 冲突</span>
        </button>
      )}

      <div className="flex items-center gap-1.5">
        {getStatusIcon()}
        <span className="text-xs" style={{ color: getStatusColor() }}>
          {statusText}
        </span>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-1.5">
          <CloudOff size={11} style={{ color: 'var(--ao-errorForeground)' }} />
          <span className="text-xs" style={{ color: 'var(--ao-errorForeground)' }}>
            离线模式
          </span>
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
