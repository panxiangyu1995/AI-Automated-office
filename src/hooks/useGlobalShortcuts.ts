import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  SHORTCUT_STORAGE_KEY,
  parseShortcutConfig,
  type ShortcutConfig,
} from '../lib/shortcutConfig'

/**
 * 全局快捷键 Hook
 */
export function useGlobalShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => {
    return parseShortcutConfig(localStorage.getItem(SHORTCUT_STORAGE_KEY))
  })

  // 保存快捷键配置到本地存储
  useEffect(() => {
    localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(shortcuts))
  }, [shortcuts])

  // 监听快捷键事件
  useEffect(() => {
    let unlistenOpenAiChat: (() => void) | null = null
    let unlistenQuickSearch: (() => void) | null = null
    let unlistenOpenSettings: (() => void) | null = null
    let cancelled = false

    // 使用 async/await 正确处理 Promise
    const setupListeners = async () => {
      const [openAiUnlisten, quickSearchUnlisten, openSettingsUnlisten] = await Promise.all([
        listen('open-ai-chat', () => {
          window.dispatchEvent(new CustomEvent('shortcut:open-ai-chat'))
        }),
        listen('open-quick-search', () => {
          window.dispatchEvent(new CustomEvent('shortcut:open-quick-search'))
        }),
        listen('open-settings', () => {
          window.dispatchEvent(new CustomEvent('shortcut:open-settings'))
        }),
      ])

      unlistenOpenAiChat = openAiUnlisten
      unlistenQuickSearch = quickSearchUnlisten
      unlistenOpenSettings = openSettingsUnlisten

      if (cancelled && unlistenOpenAiChat) {
        unlistenOpenAiChat()
        unlistenOpenAiChat = null
      }
      if (cancelled && unlistenQuickSearch) {
        unlistenQuickSearch()
        unlistenQuickSearch = null
      }
      if (cancelled && unlistenOpenSettings) {
        unlistenOpenSettings()
        unlistenOpenSettings = null
      }
    }

    setupListeners().catch((err) => {
      console.error('[useGlobalShortcuts] 设置事件监听器失败:', err)
    })

    return () => {
      cancelled = true
      if (unlistenOpenAiChat) unlistenOpenAiChat()
      if (unlistenQuickSearch) unlistenQuickSearch()
      if (unlistenOpenSettings) unlistenOpenSettings()
    }
  }, [])

  // 更新快捷键
  const updateShortcut = useCallback(
    async (key: keyof ShortcutConfig, value: string) => {
      try {
        // 检查快捷键是否可用
        const available = await invoke<boolean>('check_shortcut_available', {
          shortcutStr: value,
        })

        if (!available) {
          throw new Error('快捷键已被占用')
        }

        // 更新快捷键
        await invoke('update_shortcut', {
          action:
            key === 'showApp'
              ? 'show_app'
              : key === 'openAiChat'
                ? 'open_ai_chat'
                : key === 'openSettings'
                  ? 'open_settings'
                  : 'quick_search',
          newShortcut: value,
        })

        setShortcuts((prev) => ({ ...prev, [key]: value }))
        return true
      } catch (error) {
        console.error('更新快捷键失败:', error)
        throw error
      }
    },
    []
  )

  // 检查快捷键是否可用
  const checkAvailable = useCallback(async (shortcut: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('check_shortcut_available', {
        shortcutStr: shortcut,
      })
    } catch {
      return false
    }
  }, [])

  return {
    shortcuts,
    updateShortcut,
    checkAvailable,
  }
}

/**
 * 快捷键监听 Hook
 * 
 * 使用 useRef 避免闭包问题
 */
export function useShortcutListener(
  event: 'open-ai-chat' | 'open-quick-search' | 'open-settings',
  callback: () => void
) {
  // 使用 useRef 保存最新的 callback，避免闭包捕获旧值
  const savedCallback = useRef(callback)
  
  // 每次渲染时更新 ref
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const handler = () => {
      // 调用最新的 callback
      savedCallback.current()
    }

    window.addEventListener(`shortcut:${event}`, handler)

    return () => {
      window.removeEventListener(`shortcut:${event}`, handler)
    }
  }, [event])
}
