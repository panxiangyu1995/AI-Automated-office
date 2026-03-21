/**
 * 权限守卫组件
 *
 * @module PermissionGuard
 * @description 根据权限控制子组件的显示方式
 */

import { type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NoPermissionEmpty } from './NoPermissionEmpty'
import { usePermission } from '@/features/permission/hooks'
import type { PermissionGuardMode } from '@/features/permission/types/permission.types'
import { cn } from '@/lib/utils'

export interface PermissionGuardProps {
  /** 所需权限（支持多个权限 OR 关系） */
  permission: string | string[]
  /** 守卫模式 */
  mode?: PermissionGuardMode
  /** empty 模式的自定义组件 */
  emptyComponent?: ReactNode
  /** disabled 模式的提示原因 */
  disabledReason?: string
  /** 需要保护的子组件 */
  children: ReactNode
  /** 自定义类名 */
  className?: string
}

/**
 * PermissionGuard 组件
 *
 * 用于根据权限控制子组件的显示方式，支持三种模式：
 * - hidden: 隐藏子组件（默认）
 * - disabled: 禁用子组件并显示 Tooltip
 * - empty: 显示无权限空状态
 *
 * @example
 * ```tsx
 * // 隐藏模式（默认）
 * <PermissionGuard permission="hr_employee_write">
 *   <Button>编辑员工</Button>
 * </PermissionGuard>
 *
 * // 禁用模式
 * <PermissionGuard permission="hr_employee_delete" mode="disabled">
 *   <Button>删除员工</Button>
 * </PermissionGuard>
 *
 * // 空状态模式
 * <PermissionGuard permission="hr_employee_read" mode="empty">
 *   <EmployeeTable />
 * </PermissionGuard>
 *
 * // 多权限（OR 关系）
 * <PermissionGuard permission={["hr_employee_write", "hr_employee_admin"]}>
 *   <Button>高级操作</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  mode = 'hidden',
  emptyComponent,
  disabledReason,
  children,
  className,
}: PermissionGuardProps) {
  const { hasPermission } = usePermission()
  const hasAccess = hasPermission(permission)

  // 有权限，直接渲染子组件
  if (hasAccess) {
    return <>{children}</>
  }

  // 根据模式处理无权限情况
  switch (mode) {
    case 'hidden':
      return null

    case 'disabled':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('pointer-events-none opacity-50', className)}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {disabledReason || '您没有权限执行此操作'}
          </TooltipContent>
        </Tooltip>
      )

    case 'empty':
      return emptyComponent ? <>{emptyComponent}</> : <NoPermissionEmpty />

    default:
      return null
  }
}
