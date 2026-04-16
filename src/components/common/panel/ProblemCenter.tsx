/**
 * Problem Center Panel
 *
 * H5: 收集错误、警告、通知的问题中心面板
 * 铁律来源: PRD 工作台体验增强 — Problems Panel
 * 集成到 BottomPanel / StatusBar
 */

import { useState, useCallback, useMemo } from 'react'
import { AlertCircle, AlertTriangle, Info, Bell, ChevronDown, ChevronRight, X, Filter } from 'lucide-react'

/** 问题严重级别 */
export type ProblemSeverity = 'error' | 'warning' | 'info'

/** 问题来源 */
export type ProblemSource = 'sync' | 'validation' | 'runtime' | 'network' | 'permission' | 'system'

/** 问题条目 */
export interface ProblemItem {
  id: string
  severity: ProblemSeverity
  source: ProblemSource
  message: string
  detail?: string
  timestamp: number
  dismissed?: boolean
}

/** 筛选器 */
export type ProblemFilter = 'all' | ProblemSeverity

interface ProblemCenterProps {
  problems: ProblemItem[]
  onDismiss?: (id: string) => void
  onClearAll?: () => void
  onProblemClick?: (problem: ProblemItem) => void
  title?: string
}

const SEVERITY_ICON: Record<ProblemSeverity, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const SEVERITY_COLOR_VAR: Record<ProblemSeverity, string> = {
  error: 'var(--ao-errorForeground)',
  warning: 'var(--ao-warningForeground)',
  info: 'var(--ao-infoForeground)',
}

const SOURCE_LABEL: Record<ProblemSource, string> = {
  sync: '同步',
  validation: '校验',
  runtime: '运行时',
  network: '网络',
  permission: '权限',
  system: '系统',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function ProblemCenter({
  problems,
  onDismiss,
  onClearAll,
  onProblemClick,
  title = '问题',
}: ProblemCenterProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState<ProblemFilter>('all')

  const filteredProblems = useMemo(() => {
    const active = problems.filter((p) => !p.dismissed)
    if (filter === 'all') return active
    return active.filter((p) => p.severity === filter)
  }, [problems, filter])

  const counts = useMemo(() => {
    const active = problems.filter((p) => !p.dismissed)
    return {
      error: active.filter((p) => p.severity === 'error').length,
      warning: active.filter((p) => p.severity === 'warning').length,
      info: active.filter((p) => p.severity === 'info').length,
      total: active.length,
    }
  }, [problems])

  const handleDismiss = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss?.(id)
  }, [onDismiss])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
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
          <AlertCircle className="h-4 w-4" style={{ color: counts.error > 0 ? 'var(--ao-errorForeground)' : 'var(--ao-bottomPanel-foreground)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            {title}
          </span>
          {counts.total > 0 && (
            <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'var(--ao-bottomPanel-activeBackground)', color: 'var(--ao-bottomPanel-foreground)' }}>
              {counts.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {counts.error > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ao-errorForeground)' }}>
              <AlertCircle className="h-3 w-3" />{counts.error}
            </span>
          )}
          {counts.warning > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ao-warningForeground)' }}>
              <AlertTriangle className="h-3 w-3" />{counts.warning}
            </span>
          )}
          {counts.info > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ao-infoForeground)' }}>
              <Info className="h-3 w-3" />{counts.info}
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {!collapsed && (
        <div className="flex items-center gap-1 border-b px-3 py-1.5" style={{ borderColor: 'var(--ao-bottomPanel-border)' }}>
          <Filter className="h-3 w-3" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          {(['all', 'error', 'warning', 'info'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded px-2 py-0.5 text-xs transition-colors"
              style={{
                backgroundColor: filter === f ? 'var(--ao-bottomPanel-activeBackground)' : 'transparent',
                color: filter === f ? 'var(--ao-bottomPanel-activeForeground)' : 'var(--ao-bottomPanel-foreground)',
              }}
            >
              {f === 'all' ? '全部' : f === 'error' ? '错误' : f === 'warning' ? '警告' : '通知'}
            </button>
          ))}
          <div className="flex-1" />
          {onClearAll && counts.total > 0 && (
            <button
              onClick={onClearAll}
              className="rounded px-2 py-0.5 text-xs transition-colors"
              style={{ color: 'var(--ao-bottomPanel-foreground)' }}
            >
              全部清除
            </button>
          )}
        </div>
      )}

      {/* Problem list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-1">
          {filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="h-8 w-8 mb-2" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
                {filter === 'all' ? '没有问题' : `没有${filter === 'error' ? '错误' : filter === 'warning' ? '警告' : '通知'}`}
              </span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredProblems.map((problem) => {
                const Icon = SEVERITY_ICON[problem.severity]
                return (
                  <div
                    key={problem.id}
                    className="group flex items-start gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ao-bottomPanel-activeBackground)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    onClick={() => onProblemClick?.(problem)}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: SEVERITY_COLOR_VAR[problem.severity] }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate" style={{ color: 'var(--ao-bottomPanel-activeForeground)' }}>
                        {problem.message}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
                          {SOURCE_LABEL[problem.source]}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--ao-workbench-secondaryForeground)' }}>
                          {formatTime(problem.timestamp)}
                        </span>
                      </div>
                      {problem.detail && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ao-workbench-secondaryForeground)' }}>
                          {problem.detail}
                        </p>
                      )}
                    </div>
                    {onDismiss && (
                      <button
                        type="button"
                        aria-label="忽略"
                        className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--ao-bottomPanel-foreground)' }}
                        onClick={(e) => handleDismiss(problem.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
