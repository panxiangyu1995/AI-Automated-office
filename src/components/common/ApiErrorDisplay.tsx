/**
 * API 错误展示组件
 * 
 * 统一展示：
 * - 认证错误（401）
 * - 权限错误（403）
 * - 验证错误（422）
 * - 服务器错误（500）
 * - 网络错误
 */

import { AlertCircle, Lock, ShieldAlert, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getErrorMessage, isAuthError, isPermissionError } from '@/lib/api/errorCodes'
import type { TauriError } from '@/hooks/useTauriCommand'

interface ApiErrorDisplayProps {
  error: TauriError | null
  /** 是否显示重试按钮 */
  showRetry?: boolean
  /** 重试回调 */
  onRetry?: () => void
  /** 自定义类名 */
  className?: string
  /** 是否简洁模式（用于内联展示） */
  compact?: boolean
}

export function ApiErrorDisplay({
  error,
  showRetry = true,
  onRetry,
  className = '',
  compact = false,
}: ApiErrorDisplayProps) {
  if (!error) return null

  const code = error.code || ''
  const message = error.message || getErrorMessage(code) || '请求失败'

  // 认证错误
  if (isAuthError(code)) {
    if (compact) {
      return (
        <span className={`text-destructive text-sm ${className}`}>
          <Lock className="inline h-3 w-3 mr-1" />
          {message}
        </span>
      )
    }
    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg bg-destructive/10 ${className}`}>
        <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-destructive">登录已过期</h4>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">
            请重新登录以继续操作。
          </p>
        </div>
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重新登录
          </Button>
        )}
      </div>
    )
  }

  // 权限错误
  if (isPermissionError(code)) {
    if (compact) {
      return (
        <span className={`text-warning text-sm ${className}`}>
          <ShieldAlert className="inline h-3 w-3 mr-1" />
          {message}
        </span>
      )
    }
    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg bg-warning/10 ${className}`}>
        <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-warning">权限不足</h4>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          {error.details && Object.keys(error.details).length > 0 && (
            <div className="mt-2">
              {Object.entries(error.details).map(([key, value]) => (
                <p key={key} className="text-xs text-muted-foreground">
                  {key}: {value}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 网络错误
  if (code === 'ERR_NETWORK' || code === 'ERR_OFFLINE') {
    if (compact) {
      return (
        <span className={`text-muted-foreground text-sm ${className}`}>
          <WifiOff className="inline h-3 w-3 mr-1" />
          {message}
        </span>
      )
    }
    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg bg-muted ${className}`}>
        <WifiOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium">网络连接失败</h4>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">
            请检查网络连接后重试。
          </p>
        </div>
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重试
          </Button>
        )}
      </div>
    )
  }

  // 服务器错误
  if (code === 'ERR_SERVER' || code === 'ERR_INTERNAL') {
    if (compact) {
      return (
        <span className={`text-destructive text-sm ${className}`}>
          <AlertCircle className="inline h-3 w-3 mr-1" />
          {message}
        </span>
      )
    }
    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg bg-destructive/10 ${className}`}>
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-destructive">服务器错误</h4>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">
            稍后重试，如果问题持续存在请联系管理员。
          </p>
        </div>
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重试
          </Button>
        )}
      </div>
    )
  }

  // 默认错误
  if (compact) {
    return (
      <span className={`text-muted-foreground text-sm ${className}`}>
        <AlertCircle className="inline h-3 w-3 mr-1" />
        {message}
      </span>
    )
  }
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg bg-muted ${className}`}>
      <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium">操作失败</h4>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
        {error.details && Object.keys(error.details).length > 0 && (
          <div className="mt-2 space-y-1">
            {Object.entries(error.details).map(([key, value]) => (
              <p key={key} className="text-xs text-muted-foreground">
                {key}: {value}
              </p>
            ))}
          </div>
        )}
      </div>
      {showRetry && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1" />
          重试
        </Button>
      )}
    </div>
  )
}

/**
 * 验证错误展示组件
 */
interface ValidationErrorsProps {
  errors: Record<string, string>
  className?: string
}

export function ValidationErrors({ errors, className = '' }: ValidationErrorsProps) {
  const entries = Object.entries(errors)
  if (entries.length === 0) return null

  return (
    <div className={`space-y-1 ${className}`}>
      {entries.map(([field, message]) => (
        <p key={field} className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{message}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * 空状态展示组件
 */
interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = '暂无数据',
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * 加载状态展示组件
 */
interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = '加载中...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  )
}
