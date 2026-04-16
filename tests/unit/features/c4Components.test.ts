/**
 * C4 前端组件静态分析测试
 * J1: Template Designer UI + J2: AgentCollaboration 集成 GroupChat + J7: pluginSidebarRegistry 颜色修复
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

function hasImport(source: string, importName: string, fromModule: string): boolean {
  return source.includes(importName) && source.includes(fromModule)
}

function countHexColors(source: string): number {
  const hexPattern = /#[0-9A-Fa-f]{6}\b/g
  return (source.match(hexPattern) || []).length
}

// ==================== J2: GroupChat + AgentCollaboration Integration ====================
describe('J2: GroupChat AgentCollaboration Integration', () => {
  const groupChatSource = readSource('features/agent/components/GroupChat.tsx')

  it('GroupChat.tsx should exist', () => {
    expect(groupChatSource).not.toBe('')
  })

  it('should import AgentBadge from AgentCollaboration', () => {
    expect(hasImport(groupChatSource, 'AgentBadge', 'AgentCollaboration')).toBe(true)
  })

  it('should import AgentMentionInput from AgentCollaboration', () => {
    expect(hasImport(groupChatSource, 'AgentMentionInput', 'AgentCollaboration')).toBe(true)
  })

  it('should import AgentBehaviorToggle from AgentCollaboration', () => {
    expect(hasImport(groupChatSource, 'AgentBehaviorToggle', 'AgentCollaboration')).toBe(true)
  })

  it('should import TaskNotificationCard from AgentCollaboration', () => {
    expect(hasImport(groupChatSource, 'TaskNotificationCard', 'AgentCollaboration')).toBe(true)
  })

  it('should import AgentDataCardComponent from AgentCollaboration', () => {
    expect(hasImport(groupChatSource, 'AgentDataCardComponent', 'AgentCollaboration')).toBe(true)
  })

  it('should import AgentProgressReportCard from AgentCollaboration', () => {
    expect(hasImport(groupChatSource, 'AgentProgressReportCard', 'AgentCollaboration')).toBe(true)
  })

  it('should import MessageStatusIcon from MessageStatusIndicator', () => {
    expect(hasImport(groupChatSource, 'MessageStatusIcon', 'MessageStatusIndicator')).toBe(true)
  })

  it('should extend GroupMember with isAgent field (FR639)', () => {
    expect(groupChatSource).toContain('isAgent?: boolean')
  })

  it('should extend GroupMember with agentBehavior field (FR640)', () => {
    expect(groupChatSource).toContain('agentBehavior?: AgentBehavior')
  })

  it('should extend GroupMember with agentJoinMode field (FR634)', () => {
    expect(groupChatSource).toContain('agentJoinMode?: AgentJoinMode')
  })

  it('should extend MessageType with agent_task, agent_data, agent_progress', () => {
    expect(groupChatSource).toContain("'agent_task'")
    expect(groupChatSource).toContain("'agent_data'")
    expect(groupChatSource).toContain("'agent_progress'")
  })

  it('should have agentPayload in GroupMessage', () => {
    expect(groupChatSource).toContain('agentPayload?:')
  })

  it('should render AgentBadge for agent members in MemberItem', () => {
    expect(groupChatSource).toContain('<AgentBadge')
  })

  it('should render AgentBehaviorToggle for agent members', () => {
    expect(groupChatSource).toContain('<AgentBehaviorToggle')
  })

  it('should render TaskNotificationCard for agent_task messages', () => {
    expect(groupChatSource).toContain('<TaskNotificationCard')
  })

  it('should render AgentDataCardComponent for agent_data messages', () => {
    expect(groupChatSource).toContain('<AgentDataCardComponent')
  })

  it('should render AgentProgressReportCard for agent_progress messages', () => {
    expect(groupChatSource).toContain('<AgentProgressReportCard')
  })

  it('should have @mention support in input (FR641)', () => {
    expect(groupChatSource).toContain('mentionQuery')
    expect(groupChatSource).toContain('mentionOpen')
    expect(groupChatSource).toContain('handleMentionSelect')
  })

  it('should render AgentMentionInput in input area', () => {
    expect(groupChatSource).toContain('<AgentMentionInput')
  })

  it('should use MessageStatusIcon for message status (FR622-FR630)', () => {
    expect(groupChatSource).toContain('MessageStatusIcon')
  })

  it('should reference FR631-FR649 in doc comment', () => {
    expect(groupChatSource).toContain('FR631')
    expect(groupChatSource).toContain('FR639')
    expect(groupChatSource).toContain('FR641')
  })

  it('should have mock agent member data', () => {
    expect(groupChatSource).toContain('isAgent: true')
    expect(groupChatSource).toContain('agentBehavior:')
  })

  it('should have mock agent task/data messages', () => {
    expect(groupChatSource).toContain("'agent_task'")
    expect(groupChatSource).toContain("'agent_data'")
  })
})

// ==================== J7: pluginSidebarRegistry color fix ====================
describe('J7: pluginSidebarRegistry color fix', () => {
  const source = readSource('lib/pluginSidebarRegistry.ts')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should not contain #F59E0B hardcoded hex', () => {
    expect(source).not.toContain('#F59E0B')
  })

  it('should use CSS variable for approval badge color', () => {
    expect(source).toContain('var(--ao-warningForeground)')
  })

  it('should have no hardcoded hex colors', () => {
    expect(countHexColors(source)).toBe(0)
  })
})

// ==================== J1: Template Designer UI ====================
describe('J1: TemplateDesigner UI', () => {
  const source = readSource('features/template/components/TemplateDesigner.tsx')
  const indexSource = readSource('features/template/components/index.ts')

  it('TemplateDesigner.tsx should exist', () => {
    expect(source).not.toBe('')
  })

  it('index.ts should re-export TemplateDesigner', () => {
    expect(indexSource).toContain('TemplateDesigner')
  })

  it('should export TemplateDesigner component', () => {
    expect(source).toContain('export function TemplateDesigner')
  })

  it('should export TemplateElement type', () => {
    expect(source).toContain('export interface TemplateElement')
  })

  it('should export TemplateLayer type', () => {
    expect(source).toContain('export interface TemplateLayer')
  })

  it('should export TemplateSchema type', () => {
    expect(source).toContain('export interface TemplateSchema')
  })

  it('should support text/rect/image/table element types', () => {
    expect(source).toContain("'text'")
    expect(source).toContain("'rect'")
    expect(source).toContain("'image'")
    expect(source).toContain("'table'")
  })

  it('should support alignment operations (FR1283)', () => {
    expect(source).toContain("AlignmentType")
    expect(source).toContain("'left'")
    expect(source).toContain("'center_h'")
    expect(source).toContain("'right'")
  })

  it('should support undo/redo (FR1284)', () => {
    expect(source).toContain('undoStack')
    expect(source).toContain('redoStack')
    expect(source).toContain('handleUndo')
    expect(source).toContain('handleRedo')
  })

  it('should support zoom (FR1286)', () => {
    expect(source).toContain('ZoomIn')
    expect(source).toContain('ZoomOut')
    expect(source).toContain('zoom')
  })

  it('should have layer panel with visibility/lock toggles (FR1281)', () => {
    expect(source).toContain('LayerPanel')
    expect(source).toContain('onLayerToggleVisible')
    expect(source).toContain('onLayerToggleLock')
  })

  it('should have property panel (FR1282)', () => {
    expect(source).toContain('PropertyPanel')
    expect(source).toContain('onPropertyChange')
  })

  it('should use Tauri invoke for align (FR1283)', () => {
    expect(source).toContain("invoke")
    expect(source).toContain("'template_align_elements'")
  })

  it('should reference FR1280-FR1287 in doc comment', () => {
    expect(source).toContain('FR1280')
    expect(source).toContain('FR1287')
  })

  it('should use var(--ao-*) CSS variables', () => {
    expect(source).toContain('var(--ao-')
  })

  it('should not contain hardcoded hex colors', () => {
    expect(countHexColors(source)).toBe(0)
  })
})

// ==================== J1 (routes): Core Department Routes ====================
describe('J1: Core Department Routes', () => {
  const routesSource = readSource('routes/workbenchRoutes.tsx')
  const sidebarSource = readSource('components/common/Sidebar.tsx')

  it('workbenchRoutes.tsx should import HrPage', () => {
    expect(routesSource).toContain('HrPage')
  })

  it('workbenchRoutes.tsx should import FinancePage', () => {
    expect(routesSource).toContain('FinancePage')
  })

  it('workbenchRoutes.tsx should import SalesPage', () => {
    expect(routesSource).toContain('SalesPage')
  })

  it('workbenchRoutes.tsx should import ApprovalPage', () => {
    expect(routesSource).toContain('ApprovalPage')
  })

  it('workbenchRoutes.tsx should import WarehousePage', () => {
    expect(routesSource).toContain('WarehousePage')
  })

  it('workbenchRoutes should have hr route', () => {
    expect(routesSource).toContain("path: 'hr'")
  })

  it('workbenchRoutes should have finance route', () => {
    expect(routesSource).toContain("path: 'finance'")
  })

  it('workbenchRoutes should have sales route', () => {
    expect(routesSource).toContain("path: 'sales'")
  })

  it('workbenchRoutes should have approval route', () => {
    expect(routesSource).toContain("path: 'approval'")
  })

  it('workbenchRoutes should have warehouse route', () => {
    expect(routesSource).toContain("path: 'warehouse'")
  })

  it('Sidebar should have hr entry', () => {
    expect(sidebarSource).toContain("'hr'")
    expect(sidebarSource).toContain('/hr')
  })

  it('Sidebar should have finance entry', () => {
    expect(sidebarSource).toContain('/finance')
  })

  it('Sidebar should have sales entry', () => {
    expect(sidebarSource).toContain('/sales')
  })

  it('Sidebar should have approval entry', () => {
    expect(sidebarSource).toContain('/approval')
  })

  it('Sidebar should have warehouse entry', () => {
    expect(sidebarSource).toContain('/warehouse')
  })
})

// ==================== J2 (isolation fix): Component Integration ====================
describe('J2: Isolated Component Integration', () => {
  const bottomPanelSource = readSource('components/common/BottomPanel.tsx')
  const syncStatusSource = readSource('components/common/SyncStatus.tsx')
  const groupChatSource = readSource('features/agent/components/GroupChat.tsx')
  const routesSource = readSource('routes/workbenchRoutes.tsx')

  it('BottomPanel should import ProblemCenter', () => {
    expect(bottomPanelSource).toContain('ProblemCenter')
  })

  it('BottomPanel should have problems panel type', () => {
    expect(bottomPanelSource).toContain("'problems'")
  })

  it('SyncStatus should import SyncConflictDialog', () => {
    expect(syncStatusSource).toContain('SyncConflictDialog')
  })

  it('SyncStatus should reference FR40/FR41', () => {
    expect(syncStatusSource).toContain('FR40')
  })

  it('GroupChat should import AgentGroupParticipant', () => {
    expect(groupChatSource).toContain('AgentGroupParticipant')
  })

  it('workbenchRoutes should have GroupChat route', () => {
    expect(routesSource).toContain('GroupChat')
    expect(routesSource).toContain("path: 'chat/group'")
  })
})
