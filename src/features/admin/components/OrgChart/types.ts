/**
 * OrgChart 组件类型定义
 */

import type { DepartmentTreeNode } from '../../types/organization.types'

export type OrgChartLayout = 'tree' | 'matrix'

export interface OrgChartNodeData extends DepartmentTreeNode {
  /** 节点深度 */
  depth: number
  /** 节点位置 X */
  x: number
  /** 节点位置 Y */
  y: number
  /** 是否展开 */
  expanded: boolean
  /** 员工数量 */
  employeeCount: number
  /** 部门负责人 */
  manager?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface OrgChartProps {
  /** 组织架构数据 */
  data: DepartmentTreeNode[]
  /** 当前选中的节点 ID */
  selectedId?: string | null
  /** 布局模式 */
  layout?: OrgChartLayout
  /** 是否加载中 */
  loading?: boolean
  /** 节点选中回调 */
  onSelect?: (node: OrgChartNodeData) => void
  /** 节点展开/折叠回调 */
  onToggleExpand?: (nodeId: string) => void
  /** 编辑节点回调 */
  onEdit?: (nodeId: string) => void
}

export interface OrgChartNodeProps {
  /** 节点数据 */
  node: OrgChartNodeData
  /** 是否选中 */
  isSelected: boolean
  /** 缩放比例 */
  scale: number
  /** 点击回调 */
  onClick: () => void
  /** 展开/折叠回调 */
  onToggleExpand: () => void
}

export interface OrgChartTreeProps {
  /** 节点数据列表 */
  nodes: OrgChartNodeData[]
  /** 连接线数据 */
  connections: Array<{ from: string; to: string }>
  /** 当前选中节点 ID */
  selectedId?: string | null
  /** 缩放比例 */
  scale: number
  /** 视图偏移 */
  offset: { x: number; y: number }
  /** 节点点击回调 */
  onNodeClick: (node: OrgChartNodeData) => void
  /** 节点展开/折叠回调 */
  onNodeToggleExpand: (nodeId: string) => void
}

export interface OrgChartToolbarProps {
  /** 布局模式 */
  layout: OrgChartLayout
  /** 缩放比例 */
  scale: number
  /** 搜索值 */
  searchValue: string
  /** 布局切换回调 */
  onLayoutChange: (layout: OrgChartLayout) => void
  /** 缩放回调 */
  onScaleChange: (scale: number) => void
  /** 搜索回调 */
  onSearchChange: (value: string) => void
  /** 重置视图回调 */
  onResetView: () => void
}

export interface LayoutPosition {
  x: number
  y: number
}

export interface TreeLayoutConfig {
  /** 节点宽度 */
  nodeWidth: number
  /** 节点高度 */
  nodeHeight: number
  /** 水平间距 */
  horizontalGap: number
  /** 垂直间距 */
  verticalGap: number
}
