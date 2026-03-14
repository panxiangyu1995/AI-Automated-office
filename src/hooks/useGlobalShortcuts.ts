import { useState, useEffect, useCallback } from 'react'
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
    const unlistenOpenAiChat = listen('open-ai-chat', () => {
      console.log('AI 对话快捷键触发')
      // 触发 AI 对话面板打开
      window.dispatchEvent(new CustomEvent('shortcut:open-ai-chat'))
    })

    const unlistenQuickSearch = listen('open-quick-search', () => {
      console.log('快速搜索快捷键触发')
      // 触发快速搜索
      window.dispatchEvent(new CustomEvent('shortcut:open-quick-search'))
    })

    return () => {
      unlistenOpenAiChat.then((fn) => fn())
      unlistenQuickSearch.then((fn) => fn())
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
 */
export function useShortcutListener(
  event: 'open-ai-chat' | 'open-quick-search',
  callback: () => void
) {
  useEffect(() => {
    const handler = () => callback()
    window.addEventListener(`shortcut:${event}`, handler)
    return () => {
      window.removeEventListener(`shortcut:${event}`, handler)
    }
  }, [event, callback])
}
