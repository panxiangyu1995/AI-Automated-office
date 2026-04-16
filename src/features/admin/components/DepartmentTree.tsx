/**
 * 部门树组件
 *
 * @module DepartmentTree
 * @description 展示部门层级结构的树形组件
 */

import { Plus, ChevronDown, ChevronRight, Building2, MoreHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { DepartmentTreeNode } from '../types/organization.types'

interface DepartmentTreeProps {
  tree: DepartmentTreeNode[]
  selectedId: string | null
  expandedIds: Set<string>
  loading?: boolean
  onSelect: (id: string) => void
  onToggleExpand: (id: string) => void
  onAdd: (parentId?: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

interface TreeNodeProps {
  node: DepartmentTreeNode
  level: number
  selectedId: string | null
  expandedIds: Set<string>
  onSelect: (id: string) => void
  onToggleExpand: (id: string) => void
  onContextMenu: (e: React.MouseEvent, node: DepartmentTreeNode) => void
}

function TreeNode({
  node,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onContextMenu,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors',
          isSelected
            ? 'bg-[var(--ao-selectionHighlightBackground)] text-[var(--ao-button.background)]'
            : 'hover:bg-gray-100 text-gray-600'
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={() => onSelect(node.id)}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {/* 展开/折叠图标 */}
        <button
          className={cn(
            'flex h-4 w-4 items-center justify-center',
            hasChildren ? 'cursor-pointer' : 'cursor-default'
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              onToggleExpand(node.id)
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        {/* 部门图标 */}
        <Building2
          className={cn(
            'h-4 w-4 flex-shrink-0',
            isSelected ? 'text-[var(--ao-button.background)]' : 'text-gray-500'
          )}
        />

        {/* 部门名称 */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            isSelected ? 'font-medium text-[var(--ao-button.background)]' : 'text-gray-700'
          )}
        >
          {node.name}
        </span>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  node: DepartmentTreeNode | null
}

export function DepartmentTree({
  tree,
  selectedId,
  expandedIds,
  loading,
  onSelect,
  onToggleExpand,
  onAdd,
  onEdit,
  onDelete,
}: DepartmentTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  })
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, node: DepartmentTreeNode) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node,
    })
  }

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      node: null,
    })
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        closeContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.visible])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ao-button.background)] border-t-transparent" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-lg font-bold text-gray-900">组织架构</h3>
        <Button
          size="sm"
          className="h-7 bg-[var(--ao-button.background)] hover:bg-[var(--ao-button.background)]/90 text-white"
          onClick={() => onAdd()}
        >
          <Plus className="h-3.5 w-3.5" />
          新增
        </Button>
      </div>

      {/* 树内容 */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {tree.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-gray-400">
            暂无部门数据
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.node && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[140px] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              onAdd(contextMenu.node?.id)
              closeContextMenu()
            }}
          >
            <Plus className="h-4 w-4" />
            新增子部门
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              if (contextMenu.node) {
                onEdit(contextMenu.node.id)
              }
              closeContextMenu()
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            编辑部门
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              if (contextMenu.node) {
                onDelete(contextMenu.node.id)
              }
              closeContextMenu()
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            删除部门
          </button>
        </div>
      )}
    </div>
  )
}
