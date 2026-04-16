/**
 * 核心布局组件主题变量接入测试
 * 验证 G1+G6: 颜色系统接入 — 核心组件使用 var(--ao-*) 而非硬编码 hex
 *
 * 使用源码静态分析而非组件渲染，避免 React Router/Store 复杂依赖问题。
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SRC_ROOT = resolve(__dirname, '../../../../src')

function readComponentSource(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8')
}

describe('ActivityBar Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/ActivityBar.tsx')

  it('should not contain hardcoded #1C2128 background', () => {
    expect(source).not.toContain('#1C2128')
  })

  it('should use var(--ao-activityBar-background)', () => {
    expect(source).toContain('var(--ao-activityBar-background)')
  })

  it('should use var(--ao-activityBar-activeBackground)', () => {
    expect(source).toContain('var(--ao-activityBar-activeBackground)')
  })

  it('should use var(--ao-activityBar-activeForeground)', () => {
    expect(source).toContain('var(--ao-activityBar-activeForeground)')
  })

  it('should use var(--ao-activityBar-foreground) for inactive items', () => {
    expect(source).toContain('var(--ao-activityBar-foreground)')
  })

  it('should use var(--ao-activityBar-border) for separator', () => {
    expect(source).toContain('var(--ao-activityBar-border)')
  })
})

describe('StatusBar Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/StatusBar.tsx')

  it('should not contain hardcoded #161B22 background', () => {
    expect(source).not.toContain('#161B22')
  })

  it('should use var(--ao-statusBar-background)', () => {
    expect(source).toContain('var(--ao-statusBar-background)')
  })

  it('should use var(--ao-statusBar-foreground)', () => {
    expect(source).toContain('var(--ao-statusBar-foreground)')
  })
})

describe('AiChatPanel Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/AiChatPanel.tsx')

  it('should not contain hardcoded #0F1419 background', () => {
    expect(source).not.toContain('#0F1419')
  })

  it('should not contain hardcoded #30363D border', () => {
    expect(source).not.toContain('#30363D')
  })

  it('should use var(--ao-aiChatPanel-background)', () => {
    expect(source).toContain('var(--ao-aiChatPanel-background)')
  })

  it('should use var(--ao-aiChatPanel-border)', () => {
    expect(source).toContain('var(--ao-aiChatPanel-border)')
  })
})

describe('Workbench Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/Workbench.tsx')

  it('should not contain hardcoded #0F1419 background', () => {
    expect(source).not.toContain('#0F1419')
  })

  it('should use var(--ao-workbench-background)', () => {
    expect(source).toContain('var(--ao-workbench-background)')
  })

  it('should use var(--ao-workbench-foreground)', () => {
    expect(source).toContain('var(--ao-workbench-foreground)')
  })

  it('should use var(--ao-workbench-secondaryForeground)', () => {
    expect(source).toContain('var(--ao-workbench-secondaryForeground)')
  })
})

describe('TabBar Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/TabBar.tsx')

  it('should not contain hardcoded #161B22 background', () => {
    expect(source).not.toContain('#161B22')
  })

  it('should not contain hardcoded #21262D border', () => {
    expect(source).not.toContain('#21262D')
  })

  it('should use var(--ao-tabBar-background)', () => {
    expect(source).toContain('var(--ao-tabBar-background)')
  })

  it('should use var(--ao-tabBar-border)', () => {
    expect(source).toContain('var(--ao-tabBar-border)')
  })
})

describe('BottomPanel Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/BottomPanel.tsx')

  it('should not contain hardcoded #161B22 background', () => {
    expect(source).not.toContain('#161B22')
  })

  it('should not contain hardcoded #30363D border', () => {
    expect(source).not.toContain('#30363D')
  })

  it('should use var(--ao-bottomPanel-background)', () => {
    expect(source).toContain('var(--ao-bottomPanel-background)')
  })

  it('should use var(--ao-bottomPanel-border)', () => {
    expect(source).toContain('var(--ao-bottomPanel-border)')
  })
})

describe('Sidebar Theme Integration (G6)', () => {
  const source = readComponentSource('components/common/Sidebar.tsx')

  it('should use var(--ao-sidebar-activeForeground) instead of #FFFFFF', () => {
    expect(source).toContain('var(--ao-sidebar-activeForeground)')
    expect(source).not.toContain('#FFFFFF')
  })
})
