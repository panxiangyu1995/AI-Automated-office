import { useEffect, useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'

/**
 * 托盘事件类型
 */
export interface TrayEvent {
  type: 'show' | 'hide' | 'quit' | 'click'
  timestamp: number
}

/**
 * 托盘 Hook
 * 用于监听和处理托盘事件
 */
export function useTray(onEvent?: (event: TrayEvent) => void) {
  useEffect(() => {
    let unlisten: (() => void) | undefined

    const setupListener = async () => {
      unlisten = await listen<TrayEvent>('tray-event', (event) => {
        onEvent?.(event.payload)
      })
    }

    setupListener()

    return () => {
      unlisten?.()
    }
  }, [onEvent])
}

/**
 * 窗口可见性 Hook
 * 用于控制窗口的显示和隐藏
 */
export function useWindowVisibility() {
  const showWindow = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const window = getCurrentWindow()
    await window.show()
    await window.setFocus()
  }, [])

  const hideWindow = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const window = getCurrentWindow()
    await window.hide()
  }, [])

  const toggleWindow = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const window = getCurrentWindow()
    const isVisible = await window.isVisible()
    if (isVisible) {
      await window.hide()
    } else {
      await window.show()
      await window.setFocus()
    }
  }, [])

  return {
    showWindow,
    hideWindow,
    toggleWindow,
  }
}
