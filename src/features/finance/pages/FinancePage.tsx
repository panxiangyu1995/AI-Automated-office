/**
 * 财务管理页面 - 核心部门（不可卸载）
 * 铁律来源: PRD 核心部门定义
 */
import { FinancePanel } from '../components/FinancePanel'

export function FinancePage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--ao-workbench.border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ao-workbench.foreground)' }}>
          财务管理
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <FinancePanel />
      </div>
    </div>
  )
}
