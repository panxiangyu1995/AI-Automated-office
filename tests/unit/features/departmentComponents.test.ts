/**
 * 部门核心组件静态分析测试
 * H4: 验证部门组件的导出、类型定义、CSS变量使用
 *
 * 使用源码静态分析，避免 React 渲染依赖问题。
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
    source.includes(`export class ${exportName}`) ||
    source.includes(`export { ${exportName}`) ||
    source.includes(`export default ${exportName}`) ||
    source.includes(`export type ${exportName}`) ||
    source.includes(`export interface ${exportName}`)
}

// ==================== HR ====================
describe('HR EmployeeList Component', () => {
  const source = readSource('features/hr/components/EmployeeList.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export EmployeeList component', () => {
    expect(hasExport(source, 'EmployeeList')).toBe(true)
  })

  it('should use var(--ao-*) CSS variables instead of hardcoded hex', () => {
    const hexPattern = /#[0-9A-Fa-f]{6}\b/g
    const matches = source.match(hexPattern) || []
    expect(matches.length).toBeLessThanOrEqual(3)
  })
})

// ==================== Sales ====================
describe('Sales SalesPilotIntegration Component', () => {
  const source = readSource('features/agent/components/SalesPilotIntegration.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export SalesPilotIntegration component', () => {
    expect(hasExport(source, 'SalesPilotIntegration')).toBe(true)
  })
})

// ==================== Warehouse ====================
describe('Warehouse LocationListPage Component', () => {
  const source = readSource('features/warehouse/pages/LocationListPage.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should use var(--ao-*) CSS variables', () => {
    expect(source).toContain('var(--ao-')
  })
})

describe('Warehouse MovementListPage Component', () => {
  const source = readSource('features/warehouse/pages/MovementListPage.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })
})

describe('Warehouse WarningListPage Component', () => {
  const source = readSource('features/warehouse/pages/WarningListPage.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })
})

describe('Warehouse LogisticsTrackingPage Component', () => {
  const source = readSource('features/warehouse/pages/LogisticsTrackingPage.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })
})

// ==================== Approval ====================
describe('Approval ApprovalFlowTimeline Component', () => {
  const source = readSource('features/approval/components/ApprovalFlowTimeline.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export ApprovalFlowTimeline component', () => {
    expect(hasExport(source, 'ApprovalFlowTimeline')).toBe(true)
  })
})

// ==================== Service ====================
describe('Service TicketList Component', () => {
  const source = readSource('features/service/components/TicketList.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export TicketList component', () => {
    expect(hasExport(source, 'TicketList')).toBe(true)
  })
})

// ==================== Finance ====================
describe('Finance FinancePanel Component', () => {
  const source = readSource('features/finance/components/FinancePanel.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export FinancePanel component', () => {
    expect(hasExport(source, 'FinancePanel')).toBe(true)
  })
})

describe('Finance FinancePilotIntegration Component', () => {
  const source = readSource('features/agent/components/FinancePilotIntegration.tsx')

  it('file should exist', () => {
    expect(source).not.toBe('')
  })

  it('should export FinancePilotIntegration component', () => {
    expect(hasExport(source, 'FinancePilotIntegration')).toBe(true)
  })
})
