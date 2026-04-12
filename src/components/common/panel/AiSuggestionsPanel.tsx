import { useState, useCallback } from 'react'
import { Lightbulb, Check, X, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import type { AiSuggestion } from './types'

interface AiSuggestionsPanelProps {
  suggestions: AiSuggestion[]
  title?: string
  onAccept?: (id: string) => void
  onDismiss?: (id: string) => void
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}

export function AiSuggestionsPanel({
  suggestions,
  title = 'AI 建议',
  onAccept,
  onDismiss,
}: AiSuggestionsPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  const handleAccept = useCallback(
    (id: string) => {
      onAccept?.(id)
    },
    [onAccept]
  )

  const handleDismiss = useCallback(
    (id: string) => {
      onDismiss?.(id)
    },
    [onDismiss]
  )

  if (suggestions.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#21262D] px-4 py-2">
          <span className="text-sm font-medium" style={{ color: '#8B949E' }}>
            {title}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: '#21262D' }}
            >
              <Lightbulb className="h-5 w-5" style={{ color: '#8B949E' }} />
            </div>
            <span className="text-sm" style={{ color: '#8B949E' }}>
              暂无 AI 建议
            </span>
            <span className="text-xs" style={{ color: '#6E7681' }}>
              AI 会根据上下文提供建议
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex cursor-pointer items-center justify-between border-b border-[#21262D] px-4 py-2"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-4 w-4" style={{ color: '#8B949E' }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: '#8B949E' }} />
          )}
          <Lightbulb className="h-4 w-4" style={{ color: '#F59E0B' }} />
          <span className="text-sm font-medium" style={{ color: '#8B949E' }}>
            {title}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-xs"
            style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
          >
            {suggestions.length}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded border p-3"
                style={{
                  backgroundColor: '#161B22',
                  borderColor: suggestion.accepted ? '#238636' : '#21262D',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: '#C9D1D9' }}>
                      {suggestion.content}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-1 text-xs"
                      style={{ color: '#6E7681' }}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(suggestion.timestamp)}</span>
                    </div>
                  </div>
                  {!suggestion.accepted && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="采纳建议"
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#238636]"
                        onClick={() => handleAccept(suggestion.id)}
                      >
                        <Check className="h-3 w-3" style={{ color: '#238636' }} />
                      </button>
                      <button
                        type="button"
                        aria-label="忽略建议"
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#F85149]"
                        onClick={() => handleDismiss(suggestion.id)}
                      >
                        <X className="h-3 w-3" style={{ color: '#F85149' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
