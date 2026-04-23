import { useCallback, useState } from 'react'
import { Channel } from '@tauri-apps/api/core'
import { safeInvoke } from '@/lib/tauri'

export interface UpdateInfo {
  version: string
  currentVersion: string
  notes?: string
  downloadUrl?: string | null
}

/**
 * 软件更新 Hook
 */
export function useUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null)

  /**
   * 检查是否存在可用更新
   */
  const checkUpdate = useCallback(async (): Promise<UpdateInfo | null> => {
    try {
      const info = await safeInvoke<UpdateInfo | null>('check_update')
      if (!info) {
        setUpdateInfo(null)
        return null
      }
      if (dismissedVersion && dismissedVersion === info.version) {
        return null
      }
      setUpdateInfo(info)
      return info
    } catch (error) {
      console.error('[useUpdate] 检查更新失败:', error)
      return null
    }
  }, [dismissedVersion])

  /**
   * 下载并安装更新
   */
  const downloadAndInstall = useCallback(async () => {
    setDownloading(true)
    setProgress(0)

    const onProgress = new Channel<number>()
    onProgress.onmessage = (value) => {
      if (typeof value === 'number') {
        setProgress(Math.min(100, Math.max(0, Math.round(value))))
      }
    }

    try {
      await safeInvoke('download_and_install', { onProgress })
    } catch (error) {
      console.error('[useUpdate] 下载更新失败:', error)
    } finally {
      setDownloading(false)
    }
  }, [])

  /**
   * 暂时关闭更新提醒
   */
  const dismiss = useCallback(() => {
    if (updateInfo) {
      setDismissedVersion(updateInfo.version)
    }
    setUpdateInfo(null)
  }, [updateInfo])

  return {
    updateInfo,
    downloading,
    progress,
    checkUpdate,
    downloadAndInstall,
    dismiss,
  }
}
