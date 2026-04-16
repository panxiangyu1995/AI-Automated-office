/**
 * 销售管理页面 - 核心部门（不可卸载）
 * 铁律来源: PRD 核心部门定义
 */
import { SalesPanel } from '../components/SalesPanel'

export function SalesPage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--ao-workbench.border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ao-workbench.foreground)' }}>
          销售管理
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <SalesPanel />
      </div>
    </div>
  )
}
