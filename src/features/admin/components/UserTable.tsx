/**
 * 用户数据表格组件
 *
 * @module UserTable
 * @description 展示用户列表数据的表格组件
 */

import { Pencil, Lock, Unlock } from 'lucide-react'
import { UserStatusBadge } from './UserStatusBadge'
import type { UserListItem, UserStatus } from '../types/user.types'
import { cn } from '@/lib/utils'

interface UserTableProps {
  users: UserListItem[]
  loading?: boolean
  onEdit: (userId: string) => void
  onStatusChange: (userId: string, status: UserStatus) => void
}

export function UserTable({ users, loading, onEdit, onStatusChange }: UserTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  const getNextStatus = (currentStatus: UserStatus): UserStatus => {
    switch (currentStatus) {
      case 'active':
        return 'inactive'
      case 'inactive':
        return 'active'
      case 'locked':
        return 'active'
      default:
        return 'active'
    }
  }

  const getStatusActionIcon = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Lock className="h-4 w-4" />
      case 'inactive':
        return <Unlock className="h-4 w-4" />
      case 'locked':
        return <Unlock className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const getStatusActionTitle = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return '停用用户'
      case 'inactive':
        return '启用用户'
      case 'locked':
        return '解锁用户'
      default:
        return '更改状态'
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-600">头像</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">姓名</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">工号</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">部门</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">角色</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">创建时间</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                  {user.real_name.charAt(0)}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{user.real_name}</td>
              <td className="px-4 py-3 text-gray-600">{user.employee_code}</td>
              <td className="px-4 py-3 text-gray-600">
                {user.departments.length > 0
                  ? user.departments.map((d) => d.name).join(', ')
                  : '-'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {user.roles.length > 0
                  ? user.roles.map((r) => r.name).join(', ')
                  : '-'}
              </td>
              <td className="px-4 py-3">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => onEdit(user.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="编辑用户"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onStatusChange(user.id, getNextStatus(user.status))}
                    className={cn(
                      'text-gray-500 hover:text-gray-700 transition-colors',
                      user.status === 'locked' && 'text-red-500 hover:text-red-700'
                    )}
                    title={getStatusActionTitle(user.status)}
                  >
                    {getStatusActionIcon(user.status)}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
