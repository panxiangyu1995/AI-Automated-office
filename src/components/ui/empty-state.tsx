import type { LucideIcon } from 'lucide-react'
import { FileQuestion, SearchX, Database, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const variantConfig = {
  default: {
    icon: FileQuestion as LucideIcon,
    title: '暂无数据',
    description: '当前没有可显示的内容',
  },
  search: {
    icon: SearchX as LucideIcon,
    title: '未找到结果',
    description: '没有找到匹配的内容，请尝试其他搜索条件',
  },
  data: {
    icon: Database as LucideIcon,
    title: '数据为空',
    description: '尚未创建任何数据记录',
  },
  error: {
    icon: AlertTriangle as LucideIcon,
    title: '加载出错',
    description: '数据加载失败，请稍后重试',
  },
} as const

type EmptyStateVariant = keyof typeof variantConfig

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: EmptyStateVariant
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const IconComponent = icon ?? config.icon

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
        style={{ backgroundColor: 'var(--ao-editor-inactiveSelectionBackground, var(--ao-selectionHighlightBackground))' }}
      >
        <IconComponent
          className="h-8 w-8"
          style={{ color: 'var(--ao-editor-foreground, var(--ao-workbench.secondaryForeground))' }}
        />
      </div>
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--ao-editor-foreground, var(--ao-bottomPanel.activeBackground))' }}
      >
        {title ?? config.title}
      </h3>
      <p
        className="text-sm max-w-md mb-4"
        style={{ color: 'var(--ao-editor-foreground, var(--ao-workbench.secondaryForeground))' }}
      >
        {description ?? config.description}
      </p>
      {action && (
        <Button variant="outline" onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
