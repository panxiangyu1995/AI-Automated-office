import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

/**
 * 快捷键配置类型
 */
export interface ShortcutConfig {
  showApp: string
  openAiChat: string
  quickSearch: string
}

/**
 * 默认快捷键配置
 */
const DEFAULT_SHORTCUTS: ShortcutConfig = {
  showApp: 'Ctrl+Shift+A',
  openAiChat: 'Ctrl+Shift+D',
  quickSearch: 'Ctrl+Shift+F',
}

/**
 * 全局快捷键 Hook
 */
export function useGlobalShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => {
    // 从本地存储加载快捷键配置
    const saved = localStorage.getItem('shortcuts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEFAULT_SHORTCUTS
      }
    }
    return DEFAULT_SHORTCUTS
  })

  // 保存快捷键配置到本地存储
  useEffect(() => {
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts))
  }, [shortcuts])

  // 监听快捷键事件
  useEffect(() => {
    let unlistenOpenAiChat: (() => void) | null = null
    let unlistenQuickSearch: (() => void) | null = null
    let cancelled = false

    // 使用 async/await 正确处理 Promise
    const setupListeners = async () => {
      console.log('[useGlobalShortcuts] 开始设置事件监听器...')
      
      unlistenOpenAiChat = await listen('open-ai-chat', () => {
        console.log('[useGlobalShortcuts] 收到 open-ai-chat 事件，派发 window 事件')
        window.dispatchEvent(new CustomEvent('shortcut:open-ai-chat'))
      })
      if (cancelled && unlistenOpenAiChat) {
        unlistenOpenAiChat()
        unlistenOpenAiChat = null
      }

      unlistenQuickSearch = await listen('open-quick-search', () => {
        console.log('[useGlobalShortcuts] 收到 open-quick-search 事件，派发 window 事件')
        window.dispatchEvent(new CustomEvent('shortcut:open-quick-search'))
      })
      if (cancelled && unlistenQuickSearch) {
        unlistenQuickSearch()
        unlistenQuickSearch = null
      }
      
      console.log('[useGlobalShortcuts] 事件监听器设置完成')
    }

    setupListeners().catch((err) => {
      console.error('[useGlobalShortcuts] 设置事件监听器失败:', err)
    })

    return () => {
      cancelled = true
      console.log('[useGlobalShortcuts] 清理事件监听器')
      if (unlistenOpenAiChat) unlistenOpenAiChat()
      if (unlistenQuickSearch) unlistenQuickSearch()
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
          action: key === 'showApp' ? 'show_app' : key === 'openAiChat' ? 'open_ai_chat' : 'quick_search',
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
  event: 'open-ai-chat' | 'open-quick-search',
  callback: () => void
) {
  // 使用 useRef 保存最新的 callback，避免闭包捕获旧值
  const savedCallback = useRef(callback)
  
  // 每次渲染时更新 ref
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    console.log(`[useShortcutListener] 设置 window 事件监听: shortcut:${event}`)
    
    const handler = () => {
      console.log(`[useShortcutListener] 收到 window 事件: shortcut:${event}`)
      // 调用最新的 callback
      savedCallback.current()
    }
    
    window.addEventListener(`shortcut:${event}`, handler)
    
    return () => {
      console.log(`[useShortcutListener] 清理 window 事件监听: shortcut:${event}`)
      window.removeEventListener(`shortcut:${event}`, handler)
    }
  }, [event])
}
