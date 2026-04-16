/**
 * 岗位数据表格组件
 *
 * @module PositionTable
 * @description 展示岗位列表数据的表格组件
 */

import { Pencil, Trash2, Briefcase } from 'lucide-react'
import type { PositionListItem, PositionStatus } from '../types/organization.types'
import { cn } from '@/lib/utils'

interface PositionTableProps {
  positions: PositionListItem[]
  loading?: boolean
  onEdit: (position: PositionListItem) => void
  onDelete: (position: PositionListItem) => void
}

/**
 * 状态徽章组件
 */
function StatusBadge({ status }: { status: PositionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'active'
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'
      )}
    >
      {status === 'active' ? '启用' : '停用'}
    </span>
  )
}

export function PositionTable({
  positions,
  loading,
  onEdit,
  onDelete,
}: PositionTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--ao-button.background)] border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-gray-400">
        <Briefcase className="h-12 w-12" />
        <p>暂无岗位数据</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-[150px] px-4 py-3 text-left font-medium text-gray-600">
              岗位名称
            </th>
            <th className="w-[120px] px-4 py-3 text-left font-medium text-gray-600">
              岗位编码
            </th>
            <th className="w-[150px] px-4 py-3 text-left font-medium text-gray-600">
              所属部门
            </th>
            <th className="w-[100px] px-4 py-3 text-left font-medium text-gray-600">
              级别
            </th>
            <th className="w-[100px] px-4 py-3 text-left font-medium text-gray-600">
              状态
            </th>
            <th className="w-[100px] px-4 py-3 text-right font-medium text-gray-600">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr
              key={position.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {position.name}
              </td>
              <td className="px-4 py-3 text-gray-600">{position.code}</td>
              <td className="px-4 py-3 text-gray-600">
                {position.department_name}
              </td>
              <td className="px-4 py-3 text-gray-600">{position.level}</td>
              <td className="px-4 py-3">
                <StatusBadge status={position.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => onEdit(position)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="编辑岗位"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(position)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="删除岗位"
                  >
                    <Trash2 className="h-4 w-4" />
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
