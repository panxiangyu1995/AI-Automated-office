/**
 * Vitest 测试环境设置
 *
 * 符合铁律文档要求：
 * - PRD: FR25 开发者可以调试和测试部门模块
 * - 架构: ARCH-01 测试策略
 */

import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// 每个测试后清理
// 注意：因为 globals: true，afterEach 是全局可用的
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).afterEach(() => {
  cleanup()
})

// ==================== Tauri Mock（浏览器环境） ====================

// 在任何 @tauri-apps/api 模块导入之前，注入 __TAURI_INTERNALS__
// transformCallback 是 Tauri JS API 的核心，它返回一个用于 IPC 通信的回调 ID
// 在浏览器中返回模拟 ID，阻止 "transformCallback undefined" 错误
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).window = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(globalThis as any).window,
  __TAURI_INTERNALS__: {
    transformCallback: (cb: unknown, _once?: boolean) => {
      // 返回一个模拟的回调 ID（任意正整数）
      // Tauri API 内部用此 ID 找到回调函数
      void cb
      return Math.floor(Math.random() * 999999) + 1
    },
  },
  // __TAURI__ 是 Tauri API 模块内部检测的对象
  __TAURI__: {
    invoke: (command: string, args?: Record<string, unknown>) => {
      console.warn(`[TauriMock] invoke('${command}', ${JSON.stringify(args ?? {})})`)
      return Promise.resolve()
    },
  },
}

// 拦截 @tauri-apps/api/core 的 require/import
// 当 Tauri API 检测到 __TAURI_INTERNALS__ 存在后，会调用 invoke
// 这里用 vi.fn() 让每个调用返回 Promise.resolve()
const mockTauriInvoke = vi.fn((_command: string, _args?: Record<string, unknown>) => Promise.resolve())
const mockTauriListen = vi.fn((_event: string, _handler: unknown) => Promise.resolve(() => {}))
const mockTauriEmit = vi.fn((_event: string, _payload?: unknown) => Promise.resolve())
const mockTauriGetCurrentWindow = vi.fn(() => ({
  close: () => {},
  minimize: () => {},
  toggleMaximize: () => {},
  setTitle: () => {},
  isMaximized: () => false,
  isMinimized: () => false,
  isVisible: () => true,
  label: 'main',
}))
const mockChannelOnmessage = vi.fn()

// 在模块加载前注入 mock
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockTauriInvoke,
  Channel: vi.fn().mockImplementation(() => ({
    onmessage: mockChannelOnmessage,
  })),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: mockTauriListen,
  emit: mockTauriEmit,
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: mockTauriGetCurrentWindow,
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}))

// 全局 __TAURI__ 引用 mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).__TAURI__ = {
  invoke: mockTauriInvoke,
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock CustomEvent
class CustomEventMock extends Event {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detail: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(type: string, options?: any) {
    super(type, options)
    this.detail = options?.detail
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.CustomEvent = CustomEventMock as any

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.ResizeObserver = ResizeObserverMock as any
