/**
 * OrgChart - 组织架构图主组件
 *
 * @module OrgChart
 * @description 可视化组织架构图，支持树形/矩阵布局、缩放、搜索等功能
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { OrgChartTree } from './OrgChartTree'
import { OrgChartToolbar } from './OrgChartToolbar'
import type { OrgChartProps, OrgChartNodeData, OrgChartLayout, TreeLayoutConfig } from './types'
import type { DepartmentTreeNode } from '../../types/organization.types'

// 默认布局配置
const DEFAULT_LAYOUT_CONFIG: TreeLayoutConfig = {
  nodeWidth: 220,
  nodeHeight: 80,
  horizontalGap: 40,
  verticalGap: 100,
}

/**
 * 计算树形布局位置
 */
function calculateTreeLayout(
  nodes: DepartmentTreeNode[],
  expandedIds: Set<string>,
  config: TreeLayoutConfig,
  layout: OrgChartLayout
): { positionedNodes: OrgChartNodeData[]; connections: Array<{ from: string; to: string }> } {
  const positionedNodes: OrgChartNodeData[] = []
  const connections: Array<{ from: string; to: string }> = []

  // 树形布局计算
  if (layout === 'tree') {
    const traverse = (
      node: DepartmentTreeNode,
      depth: number,
      horizontalIndex: number,
      parentX?: number
    ): { width: number; x: number } => {
      const expanded = expandedIds.has(node.id)
      const hasChildren = node.children && node.children.length > 0 && expanded

      // 计算子节点
      let totalWidth = config.nodeWidth
      let childPositions: Array<{ width: number; x: number }> = []

      if (hasChildren && node.children) {
        let currentX = 0
        for (const child of node.children) {
          const result = traverse(child, depth + 1, 0, undefined)
          childPositions.push({ width: result.width, x: currentX + result.x })
          currentX += result.width + config.horizontalGap
        }
        totalWidth = Math.max(config.nodeWidth, currentX - config.horizontalGap)
      }

      // 计算当前节点位置
      const x = parentX !== undefined
        ? parentX + (totalWidth - config.nodeWidth) / 2
        : horizontalIndex
      const y = depth * (config.nodeHeight + config.verticalGap)

      // 添加节点
      positionedNodes.push({
        ...node,
        depth,
        x,
        y,
        expanded,
        employeeCount: node.employeeCount ?? 0,
        manager: node.manager,
      })

      // 递归处理子节点
      if (hasChildren && node.children) {
        let childX = x - (totalWidth - config.nodeWidth) / 2
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i]
          const childPos = childPositions[i]
          connections.push({ from: node.id, to: child.id })
          traverse(child, depth + 1, 0, childX)
          childX += childPos.width + config.horizontalGap
        }
      }

      return { width: totalWidth, x }
    }

    // 从根节点开始遍历
    let startX = 100
    for (const rootNode of nodes) {
      const result = traverse(rootNode, 0, startX, undefined)
      startX += result.width + config.horizontalGap * 2
    }
  } else {
    // 矩阵布局
    const cols = Math.ceil(Math.sqrt(nodes.length))
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      positionedNodes.push({
        ...node,
        depth: 0,
        x: col * (config.nodeWidth + config.horizontalGap) + 100,
        y: row * (config.nodeHeight + config.verticalGap) + 100,
        expanded: false,
        employeeCount: node.employeeCount ?? 0,
      })
    })
  }

  return { positionedNodes, connections }
}

export function OrgChart({
  data,
  selectedId,
  layout = 'tree',
  loading,
  onSelect,
  onToggleExpand,
}: OrgChartProps) {
  // 状态
  const [currentLayout, setCurrentLayout] = useState<OrgChartLayout>(layout)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 50, y: 50 })
  const [searchValue, setSearchValue] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // 默认展开第一层
    const firstLevelIds = data.map((n) => n.id)
    return new Set(firstLevelIds)
  })

  // 拖拽状态
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 初始化时展开第一层
  useEffect(() => {
    if (data.length > 0) {
      const firstLevelIds = data.map((n) => n.id)
      setExpandedIds(new Set(firstLevelIds))
    }
  }, [data])

  // 计算布局
  const { positionedNodes, connections } = useMemo(() => {
    return calculateTreeLayout(data, expandedIds, DEFAULT_LAYOUT_CONFIG, currentLayout)
  }, [data, expandedIds, currentLayout])

  // 过滤搜索结果
  const filteredNodes = useMemo(() => {
    if (!searchValue.trim()) return positionedNodes

    const searchTerm = searchValue.toLowerCase()
    return positionedNodes.filter(
      (node) =>
        node.name.toLowerCase().includes(searchTerm) ||
        node.code?.toLowerCase().includes(searchTerm)
    )
  }, [positionedNodes, searchValue])

  // 节点点击处理
  const handleNodeClick = useCallback(
    (node: OrgChartNodeData) => {
      onSelect?.(node)
    },
    [onSelect]
  )

  // 节点展开/折叠处理
  const handleNodeToggleExpand = useCallback(
    (nodeId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(nodeId)) {
          next.delete(nodeId)
        } else {
          next.add(nodeId)
        }
        return next
      })
      onToggleExpand?.(nodeId)
    },
    [onToggleExpand]
  )

  // 重置视图
  const handleResetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 50, y: 50 })
  }, [])

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale((prev) => Math.max(0.3, Math.min(2, prev + delta)))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A5F] border-t-transparent" />
          <p className="text-sm text-gray-500">加载组织架构...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-500">暂无组织架构数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="flex-shrink-0 p-4">
        <OrgChartToolbar
          layout={currentLayout}
          scale={scale}
          searchValue={searchValue}
          onLayoutChange={setCurrentLayout}
          onScaleChange={setScale}
          onSearchChange={setSearchValue}
          onResetView={handleResetView}
        />
      </div>

      {/* 画布区域 */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-[#F9FAFB]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <OrgChartTree
          nodes={searchValue ? filteredNodes : positionedNodes}
          connections={connections}
          selectedId={selectedId}
          scale={scale}
          offset={offset}
          onNodeClick={handleNodeClick}
          onNodeToggleExpand={handleNodeToggleExpand}
        />
      </div>
    </div>
  )
}
