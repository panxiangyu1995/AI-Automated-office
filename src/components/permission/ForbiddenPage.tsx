/**
 * 403 禁止访问页面
 *
 * @module ForbiddenPage
 * @description 当用户无权限访问某页面时显示的专用页面
 */

import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ForbiddenPageProps {
  /** 被拒绝的资源标识 */
  resource?: string
  /** 所需权限编码 */
  requiredPermission?: string
  /** 自定义提示消息 */
  message?: string
  /** 申请权限回调 */
  onApply?: () => void
  /** 返回回调 */
  onBack?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * ForbiddenPage 组件
 *
 * 用于展示用户无权限访问页面时的提示信息。
 * 支持展示被拒绝的资源、所需权限，以及申请权限入口。
 *
 * @example
 * ```tsx
 * <ForbiddenPage
 *   resource="hr.employee"
 *   requiredPermission="hr_employee_write"
 *   message="您没有权限访问此页面"
 *   onApply={() => openApplyModal()}
 * />
 * ```
 */
export function ForbiddenPage({
  resource,
  requiredPermission,
  message,
  onApply,
  onBack,
  className,
}: ForbiddenPageProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center p-8',
        'bg-background',
        className
      )}
    >
      <div className="text-center">
        {/* 图标 */}
        <div
          className={cn(
            'mx-auto mb-4 flex h-24 w-24 items-center justify-center',
            'rounded-full bg-red-100 dark:bg-red-900/20'
          )}
        >
          <ShieldX className="h-12 w-12 text-red-500" />
        </div>

        {/* 标题 */}
        <h1 className="mb-2 text-3xl font-bold text-foreground">访问被拒绝</h1>

        {/* 描述 */}
        <p className="mb-6 max-w-md text-muted-foreground">
          {message || '您没有权限访问此页面，请联系管理员申请相应权限。'}
        </p>

        {/* 资源信息卡片 */}
        {resource && (
          <div className="mb-6 max-w-md rounded-lg bg-muted p-4 text-left">
            <div className="mb-1 text-sm text-muted-foreground">资源</div>
            <div className="font-mono text-sm text-foreground">{resource}</div>

            {requiredPermission && (
              <>
                <div className="mb-1 mt-2 text-sm text-muted-foreground">所需权限</div>
                <div className="font-mono text-sm text-foreground">{requiredPermission}</div>
              </>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回上一页
          </Button>

          {onApply && (
            <Button onClick={onApply}>
              <Key className="mr-2 h-4 w-4" />
              申请权限
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
