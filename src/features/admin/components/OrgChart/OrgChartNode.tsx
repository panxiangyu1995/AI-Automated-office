/**
 * OrgChartNode - 组织架构图节点组件
 *
 * @module OrgChartNode
 * @description 渲染单个组织架构节点，显示部门信息和员工数量
 */

import { Building2, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgChartNodeProps } from './types'

export function OrgChartNode({
  node,
  isSelected,
  scale,
  onClick,
  onToggleExpand,
}: OrgChartNodeProps) {
  const hasChildren = node.children && node.children.length > 0

  return (
    <div
      className={cn(
        'group absolute flex flex-col rounded-lg border-2 bg-white shadow-sm transition-all duration-200',
        'hover:shadow-md cursor-pointer',
        isSelected
          ? 'border-[var(--ao-button.background)] shadow-lg ring-2 ring-[var(--ao-button.background)]/20'
          : 'border-gray-200 hover:border-[var(--ao-button.background)]/50'
      )}
      style={{
        left: node.x,
        top: node.y,
        width: 220 * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      onClick={onClick}
    >
      {/* 节点头部 */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            isSelected ? 'bg-[var(--ao-button.background)]' : 'bg-[var(--ao-button.background)]/10'
          )}
        >
          <Building2
            className={cn(
              'h-4 w-4',
              isSelected ? 'text-white' : 'text-[var(--ao-button.background)]'
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-gray-900">
            {node.name}
          </h4>
          {node.code && (
            <p className="truncate text-xs text-gray-500">{node.code}</p>
          )}
        </div>

        {/* 展开/折叠按钮 */}
        {hasChildren && (
          <button
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full transition-colors',
              'hover:bg-gray-100'
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            {node.expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* 节点内容 */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* 负责人信息 */}
        {node.manager ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ao-button.background)]/10 text-xs font-medium text-[var(--ao-button.background)]">
              {node.manager.name.charAt(0)}
            </div>
            <span className="text-xs text-gray-600">{node.manager.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">暂无负责人</span>
        )}

        {/* 员工数量 */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-3 w-3" />
          <span>{node.employeeCount}</span>
        </div>
      </div>

      {/* 子节点数量指示 */}
      {hasChildren && !node.expanded && (
        <div className="absolute -bottom-2 left-1/2 flex h-5 min-w-[24px] -translate-x-1/2 items-center justify-center rounded-full bg-[var(--ao-button.background)] px-2 text-[10px] font-medium text-white shadow-sm">
          {node.children?.length}
        </div>
      )}
    </div>
  )
}
