import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  fallback?: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <ErrorFallback error={this.state.error!} resetErrorBoundary={this.handleReset} />
    }
    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      style={{
        backgroundColor: 'var(--ao-editor-background, var(--ao-activityBar.activeForeground))',
        minHeight: '200px',
      }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
        style={{ backgroundColor: 'var(--ao-inputValidation-errorBackground, var(--ao-selectionHighlightBackground))' }}
      >
        <AlertTriangle
          className="h-8 w-8"
          style={{ color: 'var(--ao-inputValidation-errorForeground, var(--ao-errorForeground))' }}
        />
      </div>
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--ao-editor-foreground, var(--ao-bottomPanel.activeBackground))' }}
      >
        页面出了点问题
      </h3>
      <p
        className="text-sm mb-4 max-w-md"
        style={{ color: 'var(--ao-editor-foreground, var(--ao-workbench.secondaryForeground))' }}
      >
        数据加载时发生了错误，请尝试刷新页面。
      </p>
      {isDev && (
        <pre
          className="text-xs text-left p-3 rounded mb-4 max-w-lg overflow-auto"
          style={{
            backgroundColor: 'var(--ao-editor-inactiveSelectionBackground, var(--ao-selectionHighlightBackground))',
            color: 'var(--ao-inputValidation-errorForeground, var(--ao-errorForeground))',
            maxHeight: '120px',
          }}
        >
          {error.message}
        </pre>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
          <RefreshCw className="h-4 w-4 mr-1" />
          重试
        </Button>
      </div>
    </div>
  )
}
