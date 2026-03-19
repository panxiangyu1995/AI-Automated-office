/**
 * 用户状态徽章组件
 *
 * @module UserStatusBadge
 * @description 展示用户状态的徽章组件
 */

import { cn } from '@/lib/utils'
import type { UserStatus } from '../types/user.types'

interface UserStatusBadgeProps {
  status: UserStatus
  className?: string
}

const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  active: {
    label: '启用',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  inactive: {
    label: '停用',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  locked: {
    label: '锁定',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
