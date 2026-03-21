/**
 * OrgChartTree - 组织架构树形渲染组件
 *
 * @module OrgChartTree
 * @description 渲染组织架构树，包括节点和连接线
 */

import { useMemo } from 'react'
import { OrgChartNode } from './OrgChartNode'
import type { OrgChartTreeProps } from './types'

export function OrgChartTree({
  nodes,
  connections,
  selectedId,
  scale,
  offset,
  onNodeClick,
  onNodeToggleExpand,
}: OrgChartTreeProps) {
  // 计算画布尺寸
  const canvasSize = useMemo(() => {
    let maxX = 0
    let maxY = 0

    for (const node of nodes) {
      const nodeRight = node.x + 220
      const nodeBottom = node.y + 100
      if (nodeRight > maxX) maxX = nodeRight
      if (nodeBottom > maxY) maxY = nodeBottom
    }

    return {
      width: maxX + 200,
      height: maxY + 200,
    }
  }, [nodes])

  // 渲染连接线
  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromNode = nodes.find((n) => n.id === conn.from)
      const toNode = nodes.find((n) => n.id === conn.to)

      if (!fromNode || !toNode) return null

      // 计算连接线起点和终点
      const startX = fromNode.x + 110 // 节点宽度的一半
      const startY = fromNode.y + 80 // 节点底部
      const endX = toNode.x + 110
      const endY = toNode.y

      // 生成贝塞尔曲线路径
      const midY = startY + (endY - startY) / 2
      const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`

      return (
        <path
          key={`conn-${index}`}
          d={path}
          fill="none"
          stroke="#D1D5DB"
          strokeWidth={2}
          className="transition-colors duration-200"
        />
      )
    })
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {/* 可滚动容器 */}
      <div
        className="absolute"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      >
        {/* SVG 连接线层 */}
        <svg
          className="absolute left-0 top-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
        >
          {renderConnections()}
        </svg>

        {/* 节点层 */}
        {nodes.map((node) => (
          <OrgChartNode
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            scale={scale}
            onClick={() => onNodeClick(node)}
            onToggleExpand={() => onNodeToggleExpand(node.id)}
          />
        ))}
      </div>
    </div>
  )
}
