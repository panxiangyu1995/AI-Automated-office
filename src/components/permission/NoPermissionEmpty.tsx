/**
 * 无权限空状态组件
 *
 * @module NoPermissionEmpty
 * @description 当用户无权限查看某内容时显示的空状态提示
 */

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface NoPermissionEmptyProps {
  /** 标题 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 申请权限回调 */
  onApply?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * NoPermissionEmpty 组件
 *
 * 用于在列表、表格等内容区域显示无权限空状态。
 * 提供友好的提示和申请入口。
 *
 * @example
 * ```tsx
 * <NoPermissionEmpty
 *   title="暂无权限"
 *   description="您没有权限查看此内容"
 *   onApply={() => openApplyModal()}
 * />
 * ```
 */
export function NoPermissionEmpty({
  title = '暂无权限',
  description = '您没有权限查看此内容',
  onApply,
  className,
}: NoPermissionEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        className
      )}
    >
      {/* 图标 */}
      <Lock className="mb-4 h-16 w-16 text-muted-foreground" />

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>

      {/* 描述 */}
      <p className="mb-4 text-center text-muted-foreground">{description}</p>

      {/* 申请按钮 */}
      {onApply && (
        <Button variant="outline" onClick={onApply}>
          申请查看权限
        </Button>
      )}
    </div>
  )
}
