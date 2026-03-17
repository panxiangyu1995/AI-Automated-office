import { useCallback, useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  checkNetworkStatus,
  getPendingRequests,
  processPendingRequests,
} from '../lib/tauri'

export interface NetworkStatus {
  isOnline: boolean
  lastOnlineTime: Date | null
  pendingSyncCount: number
  isSyncing: boolean
  lastSyncCompletedAt: Date | null
}

/**
 * 获取并维护当前网络与同步队列状态
 */
export function useNetworkStatus() {
  const syncInFlight = useRef(false)
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    pendingSyncCount: 0,
    isSyncing: false,
    lastSyncCompletedAt: null,
  })

  /**
   * 刷新待同步请求数量
   */
  const refreshPendingCount = useCallback(async () => {
    const pending = await getPendingRequests().catch(() => null)
    if (!pending) {
      return
    }
    setStatus((prev) => ({
      ...prev,
      pendingSyncCount: pending.length,
    }))
  }, [])

  /**
   * 触发待同步请求处理
   */
  const syncPendingRequests = useCallback(async () => {
    if (syncInFlight.current) {
      return
    }
    syncInFlight.current = true
    setStatus((prev) => ({ ...prev, isSyncing: true }))
    try {
      await processPendingRequests()
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncCompletedAt: new Date(),
      }))
    } catch {
      setStatus((prev) => ({ ...prev, isSyncing: false }))
    } finally {
      syncInFlight.current = false
      void refreshPendingCount()
    }
  }, [refreshPendingCount])

  useEffect(() => {
    let unlisten: (() => void) | undefined

    const handleOnline = () =>
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        lastOnlineTime: new Date(),
      }))
    const handleOffline = () =>
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }))

    const setup = async () => {
      const initial = await checkNetworkStatus().catch(() => navigator.onLine)
      setStatus((prev) => ({
        ...prev,
        isOnline: initial,
        lastOnlineTime: initial ? new Date() : prev.lastOnlineTime,
      }))
      unlisten = await listen('network-status-changed', (event) => {
        const nextOnline = Boolean(event.payload)
        setStatus((prev) => ({
          ...prev,
          isOnline: nextOnline,
          lastOnlineTime: nextOnline ? new Date() : prev.lastOnlineTime,
        }))
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setup()
    void refreshPendingCount()

    const intervalId = window.setInterval(() => {
      void refreshPendingCount()
    }, 15000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unlisten?.()
      window.clearInterval(intervalId)
    }
  }, [refreshPendingCount])

  useEffect(() => {
    if (!status.isOnline || status.pendingSyncCount === 0) {
      return
    }
    void syncPendingRequests()
  }, [status.isOnline, status.pendingSyncCount, syncPendingRequests])

  return status
}
