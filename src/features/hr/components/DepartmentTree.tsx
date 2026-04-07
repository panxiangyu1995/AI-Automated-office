/**
 * 部门树组件
 * Task 147 - HR人事部门模块实现
 */

import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown, Users, Plus, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHrStore } from '../stores/hrStore'
import type { DepartmentTreeNode } from '../types/hr.types'

interface DepartmentTreeProps {
  onSelectDepartment?: (id: string) => void
  onAddDepartment?: () => void
}

interface TreeNodeProps {
  node: DepartmentTreeNode
  level: number
  expandedNodes: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}

function TreeNode({ node, level, expandedNodes, onToggle, onSelect }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.department.id)

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(node.department.id)}
      >
        {hasChildren ? (
          <button
            className="p-0.5 hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.department.id)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{node.department.name}</span>
        <span className="text-xs text-muted-foreground">({node.employeeCount}人)</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.department.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DepartmentTree({ onSelectDepartment, onAddDepartment }: DepartmentTreeProps) {
  const {
    departmentTree,
    isLoadingDepartments,
    fetchDepartmentTree,
  } = useHrStore()

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['dept-001']))

  useEffect(() => {
    fetchDepartmentTree()
  }, [fetchDepartmentTree])

  const handleToggle = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelect = (id: string) => {
    onSelectDepartment?.(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">组织架构</h2>
        {onAddDepartment && (
          <Button size="sm" onClick={onAddDepartment}>
            <Plus className="h-4 w-4 mr-1" />
            添加部门
          </Button>
        )}
      </div>

      {isLoadingDepartments ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            {departmentTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无部门数据
              </div>
            ) : (
              <div className="space-y-1">
                {departmentTree.map((node) => (
                  <TreeNode
                    key={node.department.id}
                    node={node}
                    level={0}
                    expandedNodes={expandedNodes}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
