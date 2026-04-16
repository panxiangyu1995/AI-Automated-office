import { useState, useCallback } from 'react'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import type { PropertyItem } from './types'

interface PropertiesPanelProps {
  properties: PropertyItem[]
  title?: string
}

export function PropertiesPanel({ properties, title = '属性' }: PropertiesPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const handleCopy = useCallback(async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('[PropertiesPanel] 复制失败:', err)
    }
  }, [])

  if (properties.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: 'var(--ao-bottomPanel-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            {title}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            暂无属性信息
          </span>
        </div>
      </div>
    )
  }

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
          <span
            className="rounded px-1.5 py-0.5 text-xs"
            style={{ backgroundColor: 'var(--ao-bottomPanel-activeBackground)', color: 'var(--ao-bottomPanel-foreground)' }}
          >
            {properties.length}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          <dl className="space-y-1">
            {properties.map((property, index) => (
              <div
                key={index}
                className="group flex items-start justify-between rounded px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
              >
                <dt
                  className="min-w-[80px] max-w-[120px] flex-shrink-0 text-xs"
                  style={{ color: 'var(--ao-bottomPanel-foreground)' }}
                >
                  {property.label}
                </dt>
                <dd
                  className="min-w-0 flex-1 truncate text-sm"
                  style={{ color: 'var(--ao-bottomPanel-activeForeground)' }}
                  title={property.value}
                >
                  {property.value}
                </dd>
                {property.copyable && (
                  <button
                    type="button"
                    aria-label={`复制 ${property.label}`}
                    className="ml-2 flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ao-bottomPanel-activeBackground)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(property.value, index)
                    }}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3 w-3" style={{ color: 'var(--ao-successForeground)' }} />
                    ) : (
                      <Copy className="h-3 w-3" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
