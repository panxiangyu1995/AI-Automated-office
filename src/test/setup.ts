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

// Mock Tauri API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).__TAURI__ = {
  tauri: {
    invoke: vi.fn(),
  },
  event: {
    listen: vi.fn(() => Promise.resolve(() => {})),
    emit: vi.fn(),
  },
  core: {
    invoke: vi.fn(),
  },
}

// Mock Tauri 内部 API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).window.__TAURI_INTERNALS__ = {
  transformCallback: vi.fn((_cb: unknown, _once: unknown) => {
    return (_once ? 1 : 0) as number
  }),
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
