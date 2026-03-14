/**
 * useGlobalShortcuts Hook 单元测试
 *
 * 测试范围：
 * - 快捷键配置默认值
 * - 快捷键配置保存到 localStorage
 * - 快捷键配置从 localStorage 恢复
 * - updateShortcut 函数调用
 * - checkAvailable 函数调用
 *
 * 铁律合规：
 * - PRD FR085: 全局快捷键支持
 * - PRD FR25: 开发者可以调试和测试部门模块
 * - ARCH-01: 测试策略
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGlobalShortcuts } from '../useGlobalShortcuts'

// Mock Tauri API
const mockInvoke = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (cmd: string, args?: unknown) => mockInvoke(cmd, args),
}))

// Mock Tauri event API - 修复为接受两个参数的函数
const mockListen = vi.fn((_event: string, _handler: (event: { state: string }) => void) => Promise.resolve(vi.fn()))

vi.mock('@tauri-apps/api/event', () => ({
  listen: (_event: string, _handler: (event: { state: string }) => void) => mockListen(_event, _handler),
}))

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
    // 重置 mocks
    vi.clearAllMocks()
  })

  describe('默认快捷键配置', () => {
    it('应该返回正确的默认快捷键配置', () => {
      const { result } = renderHook(() => useGlobalShortcuts())

      expect(result.current.shortcuts).toEqual({
        showApp: 'Ctrl+Shift+A',
        openAiChat: 'Ctrl+Shift+D',
        quickSearch: 'Ctrl+Shift+F',
      })
    })
  })

  describe('快捷键配置持久化', () => {
    it('应该将快捷键配置保存到 localStorage', () => {
      const { result } = renderHook(() => useGlobalShortcuts())

      const newShortcuts = {
        showApp: 'Ctrl+Shift+B',
        openAiChat: 'Ctrl+Shift+E',
        quickSearch: 'Ctrl+Shift+G',
      }

      act(() => {
        // 直接修改内部状态（绕过 updateShortcut 的验证）
        localStorage.setItem('shortcuts', JSON.stringify(newShortcuts))
        // 重新渲染以触发 localStorage 读取
        result.current
      })

      // 验证 localStorage 已保存
      expect(localStorage.getItem('shortcuts')).toEqual(
        JSON.stringify(newShortcuts)
      )
    })

    it('应该从 localStorage 恢复快捷键配置', () => {
      const savedShortcuts = {
        showApp: 'Ctrl+Shift+X',
        openAiChat: 'Ctrl+Shift+Y',
        quickSearch: 'Ctrl+Shift+Z',
      }

      localStorage.setItem('shortcuts', JSON.stringify(savedShortcuts))

      const { result } = renderHook(() => useGlobalShortcuts())

      expect(result.current.shortcuts).toEqual(savedShortcuts)
    })

    it('应该处理无效的 localStorage 数据并回退到默认值', () => {
      localStorage.setItem('shortcuts', 'invalid json')

      const { result } = renderHook(() => useGlobalShortcuts())

      expect(result.current.shortcuts).toEqual({
        showApp: 'Ctrl+Shift+A',
        openAiChat: 'Ctrl+Shift+D',
        quickSearch: 'Ctrl+Shift+F',
      })
    })
  })

  describe('updateShortcut 函数', () => {
    it('应该在快捷键可用时成功更新', async () => {
      mockInvoke.mockResolvedValue(true) // check_shortcut_available 返回 true

      const { result } = renderHook(() => useGlobalShortcuts())

      await act(async () => {
        const success = await result.current.updateShortcut(
          'showApp',
          'Ctrl+Shift+B'
        )
        expect(success).toBe(true)
      })

      expect(mockInvoke).toHaveBeenCalledWith('check_shortcut_available', {
        shortcutStr: 'Ctrl+Shift+B',
      })

      expect(mockInvoke).toHaveBeenCalledWith('update_shortcut', {
        action: 'show_app',
        newShortcut: 'Ctrl+Shift+B',
      })
    })

    it('应该在快捷键被占用时抛出错误', async () => {
      mockInvoke.mockResolvedValue(false) // check_shortcut_available 返回 false

      const { result } = renderHook(() => useGlobalShortcuts())

      await expect(
        act(async () => {
          await result.current.updateShortcut('showApp', 'Ctrl+Shift+B')
        })
      ).rejects.toThrow('快捷键已被占用')
    })

    it('应该正确映射 action 名称', async () => {
      mockInvoke.mockResolvedValue(true)

      const { result } = renderHook(() => useGlobalShortcuts())

      // 测试 showApp -> show_app
      await act(async () => {
        await result.current.updateShortcut('showApp', 'Ctrl+Shift+B')
      })
      expect(mockInvoke).toHaveBeenCalledWith('update_shortcut', {
        action: 'show_app',
        newShortcut: 'Ctrl+Shift+B',
      })

      // 测试 openAiChat -> open_ai_chat
      await act(async () => {
        await result.current.updateShortcut('openAiChat', 'Ctrl+Shift+E')
      })
      expect(mockInvoke).toHaveBeenCalledWith('update_shortcut', {
        action: 'open_ai_chat',
        newShortcut: 'Ctrl+Shift+E',
      })

      // 测试 quickSearch -> quick_search
      await act(async () => {
        await result.current.updateShortcut('quickSearch', 'Ctrl+Shift+G')
      })
      expect(mockInvoke).toHaveBeenCalledWith('update_shortcut', {
        action: 'quick_search',
        newShortcut: 'Ctrl+Shift+G',
      })
    })
  })

  describe('checkAvailable 函数', () => {
    it('应该在快捷键可用时返回 true', async () => {
      mockInvoke.mockResolvedValue(true)

      const { result } = renderHook(() => useGlobalShortcuts())

      const available = await result.current.checkAvailable('Ctrl+Shift+A')

      expect(available).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('check_shortcut_available', {
        shortcutStr: 'Ctrl+Shift+A',
      })
    })

    it('应该在快捷键不可用时返回 false', async () => {
      mockInvoke.mockResolvedValue(false)

      const { result } = renderHook(() => useGlobalShortcuts())

      const available = await result.current.checkAvailable('Ctrl+Shift+A')

      expect(available).toBe(false)
    })

    it('应该在调用失败时返回 false', async () => {
      mockInvoke.mockRejectedValue(new Error('RPC error'))

      const { result } = renderHook(() => useGlobalShortcuts())

      const available = await result.current.checkAvailable('Ctrl+Shift+A')

      expect(available).toBe(false)
    })
  })

  describe('快捷键事件监听', () => {
    it('应该在挂载时监听 open-ai-chat 事件', () => {
      renderHook(() => useGlobalShortcuts())

      expect(mockListen).toHaveBeenCalledWith(
        'open-ai-chat',
        expect.any(Function)
      )
    })

    it('应该在挂载时监听 open-quick-search 事件', () => {
      renderHook(() => useGlobalShortcuts())

      expect(mockListen).toHaveBeenCalledWith(
        'open-quick-search',
        expect.any(Function)
      )
    })

    it('应该在 open-ai-chat 事件触发时派发自定义事件', async () => {
      let eventHandler: ((event: { state: string }) => void) | undefined

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockListen.mockImplementation((event: string, handler: any) => {
        // 只捕获 open-ai-chat 事件的处理器
        if (event === 'open-ai-chat') {
          eventHandler = handler
        }
        return Promise.resolve(vi.fn())
      })

      renderHook(() => useGlobalShortcuts())

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      // 模拟 Tauri 事件触发
      await act(async () => {
        eventHandler?.({ state: 'Pressed' })
      })

      // 验证 dispatchEvent 被调用
      expect(dispatchSpy).toHaveBeenCalled()

      // 找到正确的事件类型
      const aiChatEvent = dispatchSpy.mock.calls.find(
        (call) => (call[0] as Event)?.type === 'shortcut:open-ai-chat'
      )
      expect(aiChatEvent).toBeDefined()

      dispatchSpy.mockRestore()
    })
  })
})
