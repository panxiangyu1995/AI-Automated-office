import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight } from 'lucide-react'
import type { DiagnosticItem, DiagnosticSeverity } from './types'

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticItem[]
  title?: string
}

const SEVERITY_CONFIG: Record<DiagnosticSeverity, { icon: React.ReactNode; colorVar: string }> = {
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    colorVar: 'var(--ao-errorForeground)',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    colorVar: 'var(--ao-warningForeground)',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    colorVar: 'var(--ao-infoForeground)',
  },
}

export function DiagnosticsPanel({
  diagnostics,
  title = '诊断',
}: DiagnosticsPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (diagnostics.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: 'var(--ao-bottomPanel-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            {title}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--ao-bottomPanel-activeBackground)' }}
            >
              <Info className="h-5 w-5" style={{ color: 'var(--ao-successForeground)' }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
              没有发现任何问题
            </span>
          </div>
        </div>
      </div>
    )
  }

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex cursor-pointer items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'var(--ao-bottomPanel-border)' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-4 w-4" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          )}
          <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
              style={{ color: 'var(--ao-errorForeground)' }}
            >
              <AlertCircle className="h-3 w-3" />
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
              style={{ color: 'var(--ao-warningForeground)' }}
            >
              <AlertTriangle className="h-3 w-3" />
              {warningCount}
            </span>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {diagnostics.map((diagnostic) => {
              const config = SEVERITY_CONFIG[diagnostic.severity]
              return (
                <div
                  key={diagnostic.id}
                  className="flex items-start gap-2 rounded px-2 py-2"
                  style={{ backgroundColor: 'var(--ao-bottomPanel-activeBackground)' }}
                >
                  <span style={{ color: config.colorVar }}>{config.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: 'var(--ao-bottomPanel-activeForeground)' }}>
                      {diagnostic.message}
                    </p>
                    {diagnostic.action && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--ao-bottomPanel-foreground)' }}
                      >
                        建议: {diagnostic.action}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
