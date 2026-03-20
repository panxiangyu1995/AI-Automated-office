/**
 * 角色列表组件
 *
 * @component RoleList
 * @description 左侧角色列表面板，按层级分组展示角色
 */

import { useState } from 'react'
import { Search, Plus, ChevronDown, ChevronRight, Users, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Role, PermissionLayer } from '../types/permission.types'
import { LAYER_CONFIG } from '../types/permission.types'

interface RoleListProps {
  roles: Role[]
  selectedId: string | null
  onSelect: (roleId: string) => void
  onCreate: () => void
  isLoading?: boolean
}

const LAYER_ORDER: PermissionLayer[] = ['base', 'department', 'approval']

export function RoleList({
  roles,
  selectedId,
  onSelect,
  onCreate,
}: RoleListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLayers, setExpandedLayers] = useState<PermissionLayer[]>(LAYER_ORDER)

  // 过滤角色
  const filteredRoles = searchQuery
    ? roles.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : roles

  // 按层级分组
  const rolesByLayer = LAYER_ORDER.reduce(
    (acc, layer) => {
      acc[layer] = filteredRoles.filter((r) => r.layer === layer)
      return acc
    },
    {} as Record<PermissionLayer, Role[]>
  )

  // 切换层级展开状态
  const toggleLayer = (layer: PermissionLayer) => {
    setExpandedLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    )
  }

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white" style={{ width: '320px' }}>
      {/* 搜索栏 */}
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="搜索角色..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 角色列表 */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {LAYER_ORDER.map((layer) => {
            const layerRoles = rolesByLayer[layer]
            const config = LAYER_CONFIG[layer]
            const isExpanded = expandedLayers.includes(layer)

            return (
              <div key={layer} className="mb-4">
                {/* 层级标题 */}
                <button
                  onClick={() => toggleLayer(layer)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-700">{config.name}</span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      {layerRoles.length}
                    </Badge>
                  </div>
                </button>

                {/* 角色列表 */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {layerRoles.map((role) => (
                      <RoleItem
                        key={role.id}
                        role={role}
                        isSelected={selectedId === role.id}
                        onClick={() => onSelect(role.id)}
                      />
                    ))}
                    {layerRoles.length === 0 && (
                      <div className="py-2 text-center text-sm text-gray-400">
                        暂无角色
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* 新建角色按钮 */}
      <div className="border-t border-gray-200 p-4">
        <Button className="w-full" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      </div>
    </div>
  )
}

/**
 * 角色项组件
 */
interface RoleItemProps {
  role: Role
  isSelected: boolean
  onClick: () => void
}

function RoleItem({ role, isSelected, onClick }: RoleItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
        isSelected
          ? 'bg-[#1E3A5F] text-white'
          : 'hover:bg-gray-100 text-gray-700'
      )}
    >
      <Shield className={cn('h-4 w-4', isSelected ? 'text-white' : 'text-gray-400')} />
      <span className="flex-1 truncate font-medium">{role.name}</span>
      {role.user_count > 0 && (
        <div className={cn('flex items-center gap-1 text-xs', isSelected ? 'text-gray-200' : 'text-gray-400')}>
          <Users className="h-3 w-3" />
          {role.user_count}
        </div>
      )}
    </button>
  )
}

export default RoleList
