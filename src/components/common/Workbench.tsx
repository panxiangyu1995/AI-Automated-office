import { type ReactNode } from 'react'

interface WorkbenchProps {
  children?: ReactNode
  className?: string
}

export function Workbench({ children, className = '' }: WorkbenchProps) {
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
