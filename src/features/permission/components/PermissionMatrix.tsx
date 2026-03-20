/**
 * 权限矩阵组件
 *
 * @component PermissionMatrix
 * @description 按模块分组展示权限列表，支持批量操作
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import type { Permission, PermissionGroup } from '../types/permission.types'

interface PermissionMatrixProps {
  permissionGroups: PermissionGroup[]
  selectedIds: string[]
  pendingChanges: Record<string, boolean>
  onToggle: (permissionId: string) => void
  onBatchToggle: (module: string, selected: boolean) => void
  disabled?: boolean
}

export function PermissionMatrix({
  permissionGroups,
  selectedIds,
  pendingChanges,
  onToggle,
  onBatchToggle,
  disabled,
}: PermissionMatrixProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    permissionGroups.map((g) => g.module)
  )

  // 判断权限是否选中（考虑 pending 变更）
  const isSelected = (permissionId: string): boolean => {
    if (permissionId in pendingChanges) {
      return pendingChanges[permissionId]
    }
    return selectedIds.includes(permissionId)
  }

  // 切换模块展开状态
  const toggleModule = (module: string) => {
    setExpandedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    )
  }

  return (
    <div className="space-y-4">
      {permissionGroups.map((group) => {
        const isExpanded = expandedModules.includes(group.module)

        return (
          <div
            key={group.module}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            {/* 模块头部 */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <button
                onClick={() => toggleModule(group.module)}
                className="flex items-center gap-2"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-bold text-gray-700">{group.module_name}</span>
              </button>

              {/* 全选/清空按钮 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onBatchToggle(group.module, true)}
                  disabled={disabled}
                  className="text-sm font-medium text-[#1E3A5F] hover:underline disabled:opacity-50"
                >
                  全选
                </button>
                <button
                  onClick={() => onBatchToggle(group.module, false)}
                  disabled={disabled}
                  className="text-sm font-medium text-gray-500 hover:underline disabled:opacity-50"
                >
                  清空
                </button>
              </div>
            </div>

            {/* 权限列表 */}
            {isExpanded && (
              <div className="divide-y divide-gray-100 bg-white">
                {group.permissions.map((permission) => (
                  <PermissionRow
                    key={permission.id}
                    permission={permission}
                    isSelected={isSelected(permission.id)}
                    onToggle={() => onToggle(permission.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {permissionGroups.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center text-gray-500">
          暂无权限配置
        </div>
      )}
    </div>
  )
}

/**
 * 权限行组件
 */
interface PermissionRowProps {
  permission: Permission
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

function PermissionRow({ permission, isSelected, onToggle, disabled }: PermissionRowProps) {
  // 获取操作类型显示名称
  const getActionLabel = (action: string): string => {
    const actionMap: Record<string, string> = {
      view: '查看',
      create: '创建',
      edit: '编辑',
      delete: '删除',
      approve: '审批',
      export: '导出',
    }
    return actionMap[action] || action
  }

  return (
    <div className="flex items-center gap-6 px-4 py-3">
      {/* 权限名称 */}
      <div className="w-[120px] flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">{permission.name}</span>
      </div>

      {/* 操作复选框 */}
      <div className="flex items-center gap-1">
        <Checkbox
          id={`perm-${permission.id}`}
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded',
            isSelected && 'border-[#1E3A5F] bg-[#1E3A5F]'
          )}
        />
        <label
          htmlFor={`perm-${permission.id}`}
          className="cursor-pointer text-sm text-gray-600"
          onClick={(e) => {
            e.preventDefault()
            if (!disabled) onToggle()
          }}
        >
          {getActionLabel(permission.action)}
        </label>
      </div>
    </div>
  )
}

export default PermissionMatrix
