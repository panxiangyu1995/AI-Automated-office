import { type ReactNode } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { SettingsPanel } from '../../features/settings/components/SettingsPanel'

interface WorkbenchProps {
  children?: ReactNode
  className?: string
}

/**
 * 工作区容器
 */
export function Workbench({ children, className = '' }: WorkbenchProps) {
  const { activeActivityItem } = useUIStore()

  if (activeActivityItem === 'settings') {
    return (
      <main 
        className={`flex-1 overflow-auto ${className}`}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <SettingsPanel />
      </main>
    )
  }

  return (
    <main 
      className={`flex-1 overflow-auto ${className}`}
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {children || (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            欢迎使用 AI-Automated-Office
          </h2>
          <p className="text-slate-500">
            AI 赋能的企业 ERP 系统
          </p>
        </div>
      )}
    </main>
  )
}
