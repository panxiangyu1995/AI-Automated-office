/**
 * ErrorBoundary - React 错误边界组件
 * 
 * 捕获子组件树中的 JavaScript 错误，显示备用 UI
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertTriangle className="h-8 w-8" />
            <h3 className="text-lg font-semibold">出错了</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 简单的错误展示组件
 */
export function ErrorDisplay({ 
  error, 
  onRetry,
  title = '加载失败'
}: { 
  error: string | Error | null
  onRetry?: () => void
  title?: string
}) {
  if (!error) return null

  const message = error instanceof Error ? error.message : error

  return (
    <div className="flex flex-col items-center justify-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <div className="flex items-center gap-2 text-destructive mb-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  )
}

/**
 * 空状态展示组件
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <Button onClick={action} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
