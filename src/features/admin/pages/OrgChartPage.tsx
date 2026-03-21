/**
 * 组织架构图页面
 *
 * @module OrgChartPage
 * @description 可视化展示组织架构，支持树形/矩阵布局、缩放、搜索
 */

import { useState, useCallback } from 'react'
import { OrgChart } from '../components/OrgChart'
import { DepartmentDetail } from '../components/DepartmentDetail'
import { useDepartmentTree } from '../hooks/useDepartmentTree'
import type { OrgChartNodeData } from '../components/OrgChart/types'
import type { DepartmentTreeNode } from '../types/organization.types'

/**
 * 转换部门树数据格式
 */
function transformDepartmentTree(
  nodes: DepartmentTreeNode[]
): DepartmentTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    employeeCount: node.employeeCount ?? 0,
    children: node.children ? transformDepartmentTree(node.children) : [],
  }))
}

export function OrgChartPage() {
  // 部门树状态
  const {
    tree,
    selectedDepartment,
    selectedId,
    loading,
    error,
    selectDepartment,
  } = useDepartmentTree()

  // 侧边栏状态
  const [showDetail, setShowDetail] = useState(false)

  // 转换数据格式
  const chartData = transformDepartmentTree(tree)

  // 节点选中处理
  const handleNodeSelect = useCallback(
    (node: OrgChartNodeData) => {
      selectDepartment(node.id)
      setShowDetail(true)
    },
    [selectDepartment]
  )

  // 节点展开/折叠处理
  const handleToggleExpand = useCallback((_nodeId: string) => {
    // OrgChart 内部已处理展开状态
  }, [])

  // 关闭详情面板
  const handleCloseDetail = useCallback(() => {
    setShowDetail(false)
  }, [])

  // 编辑部门
  const handleEditDepartment = useCallback(() => {
    // TODO: 打开编辑部门对话框
  }, [])

  // 删除部门
  const handleDeleteDepartment = useCallback(() => {
    // TODO: 打开删除确认对话框
  }, [])

  // 创建岗位
  const handleCreatePosition = useCallback(() => {
    // TODO: 打开创建岗位对话框
  }, [])

  return (
    <div className="flex h-full">
      {/* 主内容区 - 组织架构图 */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <OrgChart
            data={chartData}
            selectedId={selectedId}
            layout="tree"
            loading={loading}
            onSelect={handleNodeSelect}
            onToggleExpand={handleToggleExpand}
          />
        )}
      </div>

      {/* 右侧详情面板 */}
      {showDetail && selectedDepartment && (
        <div className="w-[360px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <DepartmentDetail
            department={selectedDepartment}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
            onCreatePosition={handleCreatePosition}
            onClose={handleCloseDetail}
          />
        </div>
      )}
    </div>
  )
}
