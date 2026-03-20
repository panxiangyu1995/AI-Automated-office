/**
 * 部门树数据 Hook
 *
 * @module useDepartmentTree
 * @description 用于获取和管理部门树数据
 */

import { useState, useEffect, useCallback } from 'react'
import { departmentApi, resolveErrorMessage } from '../api/organizationApi'
import type { DepartmentTreeNode, DepartmentDetail } from '../types/organization.types'

interface UseDepartmentTreeReturn {
  tree: DepartmentTreeNode[]
  selectedDepartment: DepartmentDetail | null
  selectedId: string | null
  loading: boolean
  error: string | null
  expandedIds: Set<string>
  selectDepartment: (id: string | null) => void
  toggleExpand: (id: string) => void
  expandAll: () => void
  collapseAll: () => void
  refresh: () => Promise<void>
  refreshDetail: () => Promise<void>
}

/**
 * 收集树中所有节点的 ID
 */
function collectAllIds(nodes: DepartmentTreeNode[]): string[] {
  const ids: string[] = []
  const traverse = (items: DepartmentTreeNode[]) => {
    for (const item of items) {
      ids.push(item.id)
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }
  traverse(nodes)
  return ids
}

/**
 * 查找节点路径
 */
function findNodePath(
  nodes: DepartmentTreeNode[],
  targetId: string,
  path: string[] = []
): string[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.id]
    if (node.id === targetId) {
      return currentPath
    }
    if (node.children?.length) {
      const result = findNodePath(node.children, targetId, currentPath)
      if (result) return result
    }
  }
  return null
}

export function useDepartmentTree(): UseDepartmentTreeReturn {
  const [tree, setTree] = useState<DepartmentTreeNode[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetail | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // 加载部门树
  const fetchTree = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await departmentApi.getTree()
      setTree(data)
      
      // 默认展开第一层
      const firstLevelIds = data.map((node) => node.id)
      setExpandedIds(new Set(firstLevelIds))
    } catch (err) {
      setError(resolveErrorMessage(err, '获取部门树'))
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载选中部门详情
  const fetchDetail = useCallback(async (id: string) => {
    try {
      const detail = await departmentApi.getDetail(id)
      setSelectedDepartment(detail)
    } catch (err) {
      setError(resolveErrorMessage(err, '获取部门详情'))
    }
  }, [])

  useEffect(() => {
    void fetchTree()
  }, [fetchTree])

  // 选择部门
  const selectDepartment = useCallback(async (id: string | null) => {
    setSelectedId(id)
    if (id) {
      await fetchDetail(id)
      
      // 确保父节点展开
      const path = findNodePath(tree, id)
      if (path) {
        setExpandedIds((prev) => {
          const newSet = new Set(prev)
          // 展开路径上所有父节点（不包括目标节点自己）
          path.slice(0, -1).forEach((pathId) => newSet.add(pathId))
          return newSet
        })
      }
    } else {
      setSelectedDepartment(null)
    }
  }, [fetchDetail, tree])

  // 切换展开状态
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // 展开全部
  const expandAll = useCallback(() => {
    const allIds = collectAllIds(tree)
    setExpandedIds(new Set(allIds))
  }, [tree])

  // 折叠全部
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  // 刷新树
  const refresh = useCallback(async () => {
    await fetchTree()
  }, [fetchTree])

  // 刷新详情
  const refreshDetail = useCallback(async () => {
    if (selectedId) {
      await fetchDetail(selectedId)
    }
  }, [selectedId, fetchDetail])

  return {
    tree,
    selectedDepartment,
    selectedId,
    loading,
    error,
    expandedIds,
    selectDepartment,
    toggleExpand,
    expandAll,
    collapseAll,
    refresh,
    refreshDetail,
  }
}
