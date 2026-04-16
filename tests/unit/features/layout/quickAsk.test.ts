/**
 * QuickAsk 组件单元测试
 * 验证 G6: Quick Ask 统一入口 - 组件源码结构和主题变量接入
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SRC_ROOT = resolve(__dirname, '../../../../src')

function readComponentSource(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8')
}

describe('QuickAsk Component Structure', () => {
  const source = readComponentSource('components/common/QuickAsk.tsx')

  it('should export QuickAsk function', () => {
    expect(source).toContain('export function QuickAsk')
  })

  it('should accept open and onClose props', () => {
    expect(source).toContain('open: boolean')
    expect(source).toContain('onClose: () => void')
  })

  it('should use AI chat store for session management', () => {
    expect(source).toContain('useChatStore')
    expect(source).toContain('createSession')
  })

  it('should open AI chat panel on submit', () => {
    expect(source).toContain('openChatPanel')
  })

  it('should handle Enter key to submit', () => {
    expect(source).toContain("e.key === 'Enter'")
  })

  it('should handle Escape key to close', () => {
    expect(source).toContain("e.key === 'Escape'")
  })
})

describe('QuickAsk Theme Integration', () => {
  const source = readComponentSource('components/common/QuickAsk.tsx')

  it('should use var(--ao-aiChatPanel-background)', () => {
    expect(source).toContain('var(--ao-aiChatPanel-background)')
  })

  it('should use var(--ao-aiChatPanel-foreground)', () => {
    expect(source).toContain('var(--ao-aiChatPanel-foreground)')
  })

  it('should use var(--ao-aiChatPanel-border)', () => {
    expect(source).toContain('var(--ao-aiChatPanel-border)')
  })

  it('should not contain hardcoded hex colors', () => {
    expect(source).not.toMatch(/#[0-9A-Fa-f]{6}/)
  })

  it('should use Lucide icons (no emoji)', () => {
    expect(source).toContain('lucide-react')
    expect(source).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
  })
})

describe('QuickAsk Shortcut Configuration', () => {
  const source = readComponentSource('lib/shortcutConfig.ts')

  it('should have quickAsk shortcut defined', () => {
    expect(source).toContain('quickAsk')
  })

  it('should default to CmdOrCtrl+L', () => {
    expect(source).toContain("quickAsk: 'CmdOrCtrl+L'")
  })
})

describe('QuickAsk Integration in AppLayout', () => {
  const source = readComponentSource('components/common/AppLayout.tsx')

  it('should import QuickAsk component', () => {
    expect(source).toContain("import { QuickAsk }")
  })

  it('should render QuickAsk in layout', () => {
    expect(source).toContain('<QuickAsk')
  })

  it('should have Ctrl+L keyboard shortcut handler', () => {
    expect(source).toContain("'l'")
    expect(source).toContain('quickAskOpen')
  })
})
