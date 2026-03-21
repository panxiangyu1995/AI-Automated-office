/**
 * 部门详情面板组件
 *
 * @module DepartmentDetail
 * @description 展示选中部门的基本信息和下属岗位
 */

import { Pencil, Trash2, Briefcase, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DepartmentDetail } from '../types/organization.types'

interface DepartmentDetailProps {
  department: DepartmentDetail | null
  onEdit: () => void
  onDelete: () => void
  onCreatePosition: () => void
  onClose?: () => void
}

export function DepartmentDetail({
  department,
  onEdit,
  onDelete,
  onCreatePosition,
  onClose,
}: DepartmentDetailProps) {
  if (!department) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        请从左侧选择一个部门
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 部门信息头部 */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {department.name}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            部门编码: {department.code}
            {department.leader_name && (
              <> | 负责人: {department.leader_name}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-9 gap-2"
          >
            <Pencil className="h-4 w-4" />
            编辑部门
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="h-9 gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 部门基本信息 */}
      <div className="grid grid-cols-2 gap-4 py-6">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">上级部门</p>
          <p className="mt-1 font-medium text-gray-900">
            {department.parent_name || '无'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">部门层级</p>
          <p className="mt-1 font-medium text-gray-900">
            第 {department.level} 级
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">排序号</p>
          <p className="mt-1 font-medium text-gray-900">
            {department.sort_order}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">状态</p>
          <p className="mt-1">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                department.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {department.status === 'active' ? '启用' : '停用'}
            </span>
          </p>
        </div>
      </div>

      {/* 下属岗位区域占位 */}
      <div className="flex-1 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">下属岗位</h3>
          </div>
          <Button
            size="sm"
            onClick={onCreatePosition}
            className="h-8 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
          >
            <Plus className="h-4 w-4" />
            创建岗位
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          请在岗位列表中查看和管理该部门的岗位信息
        </p>
      </div>
    </div>
  )
}