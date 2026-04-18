/**
 * DataView - 数据视图组件
 * 
 * 统一处理加载状态、错误状态，空状态和数据展示
 */

import { type ReactNode } from 'react'
import { AlertTriangle, Database, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataViewProps<T> {
  /** 数据 */
  data: T | null | undefined
  /** 加载状态 */
  loading?: boolean
  /** 错误信息 */
  error?: string | null
  /** 自定义加载组件 */
  loadingComponent?: ReactNode
  /** 空数据消息 */
  emptyMessage?: string
  /** 自定义空状态组件 */
  emptyComponent?: ReactNode
  /** 重试回调 */
  onRetry?: () => void
  /** 子组件 */
  children?: ReactNode
  /** 渲染函数（当有数据时） */
  render?: (data: T) => ReactNode
  /** 类名 */
  className?: string
}

/**
 * 数据视图组件
 */
export function DataView<T>({
  data,
  loading = false,
  error,
  loadingComponent,
  emptyMessage = '暂无数据',
  emptyComponent,
  onRetry,
  children,
  render,
  className = '',
}: DataViewProps<T>) {
  // 加载状态
  if (loading) {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>
    }
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground mb-3 text-center">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            重试
          </Button>
        )}
      </div>
    )
  }

  // 空状态
  if (!data || (Array.isArray(data) && data.length === 0)) {
    if (emptyComponent) {
      return <div className={className}>{emptyComponent}</div>
    }
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
        <Database className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  // 有数据 - 渲染内容
  if (render) {
    return <div className={className}>{render(data)}</div>
  }

  return <div className={className}>{children}</div>
}
