/**
 * C3 新增组件静态分析测试
 * I2: Agent 协作组件 + I5: 消息状态组件 + I3: 模板版本存储 + ProblemCenter
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const SRC_ROOT = resolve(__dirname, '../../../src')

function readSource(relativePath: string): string {
  const fullPath = resolve(SRC_ROOT, relativePath)
  if (!existsSync(fullPath)) return ''
  return readFileSync(fullPath, 'utf-8')
}

function hasExport(source: string, exportName: string): boolean {
  return source.includes(`export function ${exportName}`) ||
    source.includes(`export const ${exportName}`) ||
    source.includes(`export { ${exportName}`) ||
    source.includes(`export type ${exportName}`) ||
    source.includes(`export interface ${exportName}`)
}

function countHexColors(source: string): number {
  const hexPattern = /#[0-9A-Fa-f]{6}\b/g
  return (source.match(hexPattern) || []).length
}

// ==================== I2: Agent Collaboration ====================
describe('I2: AgentCollaboration Component', () => {
  const source = readSource('features/agent/components/AgentCollaboration.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export AgentBadge', () => {
    expect(hasExport(source, 'AgentBadge')).toBe(true)
  })

  it('should export AgentMentionInput', () => {
    expect(hasExport(source, 'AgentMentionInput')).toBe(true)
  })

  it('should export TaskNotificationCard', () => {
    expect(hasExport(source, 'TaskNotificationCard')).toBe(true)
  })

  it('should export AgentDataCardComponent', () => {
    expect(hasExport(source, 'AgentDataCardComponent')).toBe(true)
  })

  it('should export AgentProgressReportCard', () => {
    expect(hasExport(source, 'AgentProgressReportCard')).toBe(true)
  })

  it('should export AgentBehaviorToggle', () => {
    expect(hasExport(source, 'AgentBehaviorToggle')).toBe(true)
  })

  it('should export AgentGroupMember type', () => {
    expect(hasExport(source, 'AgentGroupMember')).toBe(true)
  })

  it('should export MentionTarget type', () => {
    expect(hasExport(source, 'MentionTarget')).toBe(true)
  })

  it('should export AgentTaskNotification type', () => {
    expect(hasExport(source, 'AgentTaskNotification')).toBe(true)
  })

  it('should use var(--ao-*) CSS variables', () => {
    expect(source).toContain('var(--ao-')
  })

  it('should not contain hardcoded hex colors', () => {
    expect(countHexColors(source)).toBe(0)
  })

  it('should reference FR631-FR649 in doc comment', () => {
    expect(source).toContain('FR631')
  })
})

// ==================== I5: Message Status Indicator ====================
describe('I5: MessageStatusIndicator Component', () => {
  const source = readSource('features/agent/components/MessageStatusIndicator.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export MessageStatusIcon', () => {
    expect(hasExport(source, 'MessageStatusIcon')).toBe(true)
  })

  it('should export MessageStatusIndicator', () => {
    expect(hasExport(source, 'MessageStatusIndicator')).toBe(true)
  })

  it('should export BulkReadReceiptDisplay', () => {
    expect(hasExport(source, 'BulkReadReceiptDisplay')).toBe(true)
  })

  it('should export MessageReceipt type', () => {
    expect(hasExport(source, 'MessageReceipt')).toBe(true)
  })

  it('should export ReadReceipt type', () => {
    expect(hasExport(source, 'ReadReceipt')).toBe(true)
  })

  it('should define all 5 delivery statuses', () => {
    expect(source).toContain("'sending'")
    expect(source).toContain("'sent'")
    expect(source).toContain("'delivered'")
    expect(source).toContain("'read'")
    expect(source).toContain("'failed'")
  })

  it('should use var(--ao-*) CSS variables', () => {
    expect(source).toContain('var(--ao-')
  })

  it('should not contain hardcoded hex colors', () => {
    expect(countHexColors(source)).toBe(0)
  })

  it('should reference FR622-FR630 in doc comment', () => {
    expect(source).toContain('FR622')
  })
})

// ==================== I3: Template Version Store ====================
describe('I3: TemplateVersionStore SQLite migration', () => {
  const source = readSource('features/template/runtime/templateVersionStore.ts')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should import from @tauri-apps/api/core', () => {
    expect(source).toContain('@tauri-apps/api/core')
  })

  it('should still have localStorage fallback', () => {
    expect(source).toContain('localStorage')
  })

  it('should export async functions', () => {
    expect(source).toContain('async function createDraft')
    expect(source).toContain('async function publishVersion')
    expect(source).toContain('async function listTemplateVersions')
  })

  it('should reference ADR-003', () => {
    expect(source).toContain('ADR-003')
  })
})

// ==================== ProblemCenter (from C2) ====================
describe('ProblemCenter Component', () => {
  const source = readSource('components/common/panel/ProblemCenter.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export ProblemCenter', () => {
    expect(hasExport(source, 'ProblemCenter')).toBe(true)
  })

  it('should export ProblemItem type', () => {
    expect(hasExport(source, 'ProblemItem')).toBe(true)
  })

  it('should use var(--ao-*) CSS variables', () => {
    expect(source).toContain('var(--ao-')
  })

  it('should not contain hardcoded hex colors', () => {
    expect(countHexColors(source)).toBe(0)
  })

  it('should support all 3 severity levels', () => {
    expect(source).toContain("'error'")
    expect(source).toContain("'warning'")
    expect(source).toContain("'info'")
  })
})
