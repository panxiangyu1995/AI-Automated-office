/**
 * 角色信息卡片组件
 *
 * @component RoleInfoCard
 * @description 展示选中角色的基本信息
 */

import { Edit, Trash2, Shield, Users, Hash, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Role } from '../types/permission.types'
import { LAYER_CONFIG } from '../types/permission.types'

interface RoleInfoCardProps {
  role: Role | null
  onEdit: () => void
  onDelete: () => void
}

export function RoleInfoCard({ role, onEdit, onDelete }: RoleInfoCardProps) {
  if (!role) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">请从左侧选择一个角色</p>
        </div>
      </div>
    )
  }

  const layerConfig = LAYER_CONFIG[role.layer]

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* 头部 */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[var(--ao-button.background)]" />
            <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
            {role.is_system && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                系统角色
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={role.is_system}
            >
              <Edit className="mr-1 h-4 w-4" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={role.is_system}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              删除
            </Button>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="space-y-4 p-6">
        {/* 角色编码 */}
        <div className="flex items-start gap-3">
          <Hash className="mt-0.5 h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">角色编码</p>
            <p className="font-mono text-sm text-gray-700">{role.code}</p>
          </div>
        </div>

        {/* 权限层级 */}
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">权限层级</p>
            <Badge
              style={{
                backgroundColor: layerConfig.bgColor,
                color: layerConfig.color,
              }}
            >
              {layerConfig.name}
            </Badge>
          </div>
        </div>

        {/* 用户数量 */}
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">关联用户</p>
            <p className="text-sm text-gray-700">{role.user_count} 人</p>
          </div>
        </div>

        {/* 权限数量 */}
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">权限数量</p>
            <p className="text-sm text-gray-700">{role.permission_count} 项</p>
          </div>
        </div>

        {/* 描述 */}
        {role.description && (
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">描述</p>
              <p className="text-sm text-gray-700">{role.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoleInfoCard
