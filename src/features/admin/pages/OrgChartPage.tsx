/**
 * 组织架构图页面
 *
 * @module OrgChartPage
 * @description 可视化展示组织架构，支持树形/矩阵布局、缩放、搜索
 */

import { useState, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrgChart } from '../components/OrgChart'
import { DepartmentDetail } from '../components/DepartmentDetail'
import { DepartmentForm, type CreateDepartmentData } from '../components/DepartmentForm'
import { PositionForm, type CreatePositionData } from '../components/PositionForm'
import { useDepartmentTree } from '../hooks/useDepartmentTree'
import { useDepartmentMutations, usePositionMutations } from '../hooks/useOrganizationMutations'
import type { OrgChartNodeData } from '../components/OrgChart/types'
import type { DepartmentTreeNode, DepartmentOption } from '../types/organization.types'

type DialogMode = 'none' | 'editDepartment' | 'deleteDepartment' | 'createPosition'

/**
 * 转换部门树数据格式
 */
function transformDepartmentTree(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    employeeCount: node.employeeCount ?? 0,
    children: node.children ? transformDepartmentTree(node.children) : [],
  }))
}

/**
 * 将部门树扁平化为选项列表
 */
function flattenTreeToOptions(nodes: DepartmentTreeNode[]): DepartmentOption[] {
  const options: DepartmentOption[] = []
  const traverse = (items: DepartmentTreeNode[], level: number) => {
    for (const item of items) {
      options.push({
        id: item.id,
        name: item.name,
        code: item.code,
        level,
      })
      if (item.children?.length) {
        traverse(item.children, level + 1)
      }
    }
  }
  traverse(nodes, 0)
  return options
}

/**
 * 查找部门名称
 */
function findDeptName(nodes: DepartmentTreeNode[], targetId: string): string {
  for (const node of nodes) {
    if (node.id === targetId) return node.name
    if (node.children?.length) {
      const found = findDeptName(node.children, targetId)
      if (found) return found
    }
  }
  return ''
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
    refresh: refreshTree,
    refreshDetail,
  } = useDepartmentTree()

  // 变更操作
  const deptMutations = useDepartmentMutations()
  const posMutations = usePositionMutations()

  // 侧边栏状态
  const [showDetail, setShowDetail] = useState(false)

  // 对话框状态
  const [dialogMode, setDialogMode] = useState<DialogMode>('none')
  const [error2, setError] = useState<string | null>(null)

  // 转换数据格式
  const chartData = transformDepartmentTree(tree)

  // 部门选项列表
  const departmentOptions = flattenTreeToOptions(tree)

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
    if (!selectedId) return
    setDialogMode('editDepartment')
  }, [selectedId])

  // 删除部门
  const handleDeleteDepartment = useCallback(() => {
    if (!selectedId) return
    setDialogMode('deleteDepartment')
  }, [selectedId])

  // 创建岗位
  const handleCreatePosition = useCallback(() => {
    setDialogMode('createPosition')
  }, [])

  // 关闭对话框
  const closeDialog = useCallback(() => {
    setDialogMode('none')
    setError(null)
    deptMutations.clearError()
    posMutations.clearError()
  }, [deptMutations, posMutations])

  // 提交部门编辑
  const handleDepartmentSubmit = useCallback(
    async (data: CreateDepartmentData) => {
      if (!selectedId) return
      const success = await deptMutations.update(selectedId, data)
      if (success) {
        closeDialog()
        refreshTree()
        refreshDetail()
      }
    },
    [selectedId, deptMutations, closeDialog, refreshTree, refreshDetail]
  )

  // 提交岗位创建
  const handlePositionSubmit = useCallback(
    async (data: CreatePositionData) => {
      const result = await posMutations.create(data)
      if (result) {
        closeDialog()
        refreshDetail()
      }
    },
    [posMutations, closeDialog, refreshDetail]
  )

  // 确认删除部门
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedId) return
    const success = await deptMutations.remove(selectedId)
    if (success) {
      closeDialog()
      refreshTree()
      selectDepartment(null)
      setShowDetail(false)
    }
  }, [selectedId, deptMutations, closeDialog, refreshTree, selectDepartment])

  // 组合错误信息
  const displayError = error2 || error || deptMutations.error || posMutations.error

  // 删除目标名称
  const deleteTargetName = selectedId
    ? findDeptName(tree, selectedId) || selectedDepartment?.name || ''
    : ''

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

      {/* 编辑部门对话框 */}
      <Dialog
        open={dialogMode === 'editDepartment'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑部门</DialogTitle>
            <DialogDescription>修改部门信息</DialogDescription>
          </DialogHeader>
          <DepartmentForm
            mode="edit"
            initialValues={selectedDepartment ?? undefined}
            departments={departmentOptions}
            onSubmit={handleDepartmentSubmit}
            onCancel={closeDialog}
            loading={deptMutations.loading}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={dialogMode === 'deleteDepartment'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除部门"{deleteTargetName}"吗？
              <br />
              该操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deptMutations.loading}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建岗位对话框 */}
      <Dialog
        open={dialogMode === 'createPosition'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>创建岗位</DialogTitle>
            <DialogDescription>填写岗位信息创建新岗位</DialogDescription>
          </DialogHeader>
          <PositionForm
            mode="create"
            departments={departmentOptions}
            defaultDepartmentId={selectedId || undefined}
            onSubmit={handlePositionSubmit}
            onCancel={closeDialog}
            loading={posMutations.loading}
          />
        </DialogContent>
      </Dialog>

      {/* 全局错误提示 */}
      {displayError && dialogMode === 'none' && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{displayError}</p>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
