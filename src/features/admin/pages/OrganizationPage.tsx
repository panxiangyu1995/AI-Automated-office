/**
 * 组织管理入口页面
 *
 * @module OrganizationPage
 * @description 组织架构管理主页面，包含部门树和岗位管理
 */

import { useState, useCallback, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DepartmentTree } from '../components/DepartmentTree'
import { DepartmentDetail } from '../components/DepartmentDetail'
import { DepartmentForm, type CreateDepartmentData } from '../components/DepartmentForm'
import { PositionTable } from '../components/PositionTable'
import { PositionForm, type CreatePositionData } from '../components/PositionForm'
import { useDepartmentTree } from '../hooks/useDepartmentTree'
import { usePositions } from '../hooks/usePositions'
import { useDepartmentMutations, usePositionMutations } from '../hooks/useOrganizationMutations'
import type { DepartmentOption, PositionListItem, DepartmentTreeNode } from '../types/organization.types'

type DialogMode = 'none' | 'createDepartment' | 'editDepartment' | 'deleteDepartment' | 'createPosition' | 'editPosition' | 'deletePosition'

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

export function OrganizationPage() {
  // 部门树状态
  const {
    tree,
    selectedDepartment,
    selectedId,
    loading: treeLoading,
    error: treeError,
    expandedIds,
    selectDepartment,
    toggleExpand,
    refresh: refreshTree,
    refreshDetail,
  } = useDepartmentTree()

  // 岗位列表状态
  const {
    positions,
    loading: positionsLoading,
    error: positionsError,
    setDepartmentId: setPositionDeptId,
    refresh: refreshPositions,
  } = usePositions()

  // 变更操作
  const deptMutations = useDepartmentMutations()
  const posMutations = usePositionMutations()

  // 对话框状态
  const [dialogMode, setDialogMode] = useState<DialogMode>('none')
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null)
  const [createParentId, setCreateParentId] = useState<string | undefined>()
  const [editPosition, setEditPosition] = useState<PositionListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'position'; id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 部门选项列表
  const departmentOptions = flattenTreeToOptions(tree)

  // 当选中部门变化时，更新岗位筛选
  useEffect(() => {
    setPositionDeptId(selectedId || undefined)
  }, [selectedId, setPositionDeptId])

  // 清除错误提示
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // 打开创建部门对话框
  const handleAddDepartment = useCallback((parentId?: string) => {
    setCreateParentId(parentId)
    setEditDepartmentId(null)
    setDialogMode('createDepartment')
  }, [])

  // 打开编辑部门对话框
  const handleEditDepartment = useCallback((id: string) => {
    setEditDepartmentId(id)
    setDialogMode('editDepartment')
  }, [])

  // 打开删除部门对话框
  const handleDeleteDepartment = useCallback(async (id: string) => {
    // 查找部门名称
    const findDeptName = (nodes: DepartmentTreeNode[], targetId: string): string => {
      for (const node of nodes) {
        if (node.id === targetId) return node.name
        if (node.children?.length) {
          const found = findDeptName(node.children, targetId)
          if (found) return found
        }
      }
      return ''
    }
    const name = findDeptName(tree, id) || selectedDepartment?.name || ''
    setDeleteTarget({ type: 'department', id, name })
    setDialogMode('deleteDepartment')
  }, [tree, selectedDepartment])

  // 打开创建岗位对话框
  const handleCreatePosition = useCallback(() => {
    setEditPosition(null)
    setDialogMode('createPosition')
  }, [])

  // 打开编辑岗位对话框
  const handleEditPosition = useCallback((position: PositionListItem) => {
    setEditPosition(position)
    setDialogMode('editPosition')
  }, [])

  // 打开删除岗位对话框
  const handleDeletePosition = useCallback((position: PositionListItem) => {
    setDeleteTarget({ type: 'position', id: position.id, name: position.name })
    setDialogMode('deletePosition')
  }, [])

  // 关闭对话框
  const closeDialog = useCallback(() => {
    setDialogMode('none')
    setEditDepartmentId(null)
    setCreateParentId(undefined)
    setEditPosition(null)
    setDeleteTarget(null)
    setError(null)
    deptMutations.clearError()
    posMutations.clearError()
  }, [deptMutations, posMutations])

  // 提交部门表单
  const handleDepartmentSubmit = useCallback(async (data: CreateDepartmentData) => {
    let success = false
    
    if (dialogMode === 'createDepartment') {
      const result = await deptMutations.create(data)
      success = !!result
    } else if (dialogMode === 'editDepartment' && editDepartmentId) {
      success = await deptMutations.update(editDepartmentId, data)
    }

    if (success) {
      closeDialog()
      refreshTree()
      if (editDepartmentId === selectedId) {
        refreshDetail()
      }
    }
  }, [dialogMode, editDepartmentId, selectedId, deptMutations, closeDialog, refreshTree, refreshDetail])

  // 提交岗位表单
  const handlePositionSubmit = useCallback(async (data: CreatePositionData) => {
    let success = false
    
    if (dialogMode === 'createPosition') {
      const result = await posMutations.create(data)
      success = !!result
    } else if (dialogMode === 'editPosition' && editPosition) {
      success = await posMutations.update(editPosition.id, data)
    }

    if (success) {
      closeDialog()
      refreshPositions()
    }
  }, [dialogMode, editPosition, posMutations, closeDialog, refreshPositions])

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return

    let success = false
    if (deleteTarget.type === 'department') {
      success = await deptMutations.remove(deleteTarget.id)
      if (success) {
        refreshTree()
        if (deleteTarget.id === selectedId) {
          selectDepartment(null)
        }
      }
    } else {
      success = await posMutations.remove(deleteTarget.id)
      if (success) {
        refreshPositions()
      }
    }

    if (success) {
      closeDialog()
    }
  }, [deleteTarget, selectedId, deptMutations, posMutations, closeDialog, refreshTree, refreshPositions, selectDepartment])

  // 组合错误信息
  const displayError = error || treeError || positionsError || deptMutations.error || posMutations.error

  return (
    <div className="flex h-full">
      {/* 左侧部门树 */}
      <aside className="w-[280px] flex-shrink-0 border-r border-gray-200 bg-[#F9FAFB]">
        <DepartmentTree
          tree={tree}
          selectedId={selectedId}
          expandedIds={expandedIds}
          loading={treeLoading}
          onSelect={selectDepartment}
          onToggleExpand={toggleExpand}
          onAdd={handleAddDepartment}
          onEdit={handleEditDepartment}
          onDelete={handleDeleteDepartment}
        />
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-auto bg-white p-8">
        {/* 错误提示 */}
        {displayError && (
          <div className="mb-6 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{displayError}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 部门详情或岗位列表 */}
        {selectedDepartment ? (
          <DepartmentDetail
            department={selectedDepartment}
            onEdit={() => handleEditDepartment(selectedId!)}
            onDelete={() => handleDeleteDepartment(selectedId!)}
            onCreatePosition={handleCreatePosition}
          />
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">全部岗位</h2>
              <Button
                onClick={handleCreatePosition}
                className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              >
                创建岗位
              </Button>
            </div>
            <PositionTable
              positions={positions}
              loading={positionsLoading}
              onEdit={handleEditPosition}
              onDelete={handleDeletePosition}
            />
          </div>
        )}
      </main>

      {/* 部门表单对话框 */}
      <Dialog open={dialogMode === 'createDepartment' || dialogMode === 'editDepartment'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'createDepartment' ? '新增部门' : '编辑部门'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'createDepartment'
                ? '填写部门信息创建新部门'
                : '修改部门信息'}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            mode={dialogMode === 'createDepartment' ? 'create' : 'edit'}
            departments={departmentOptions}
            parentId={createParentId}
            onSubmit={handleDepartmentSubmit}
            onCancel={closeDialog}
            loading={deptMutations.loading}
          />
        </DialogContent>
      </Dialog>

      {/* 岗位表单对话框 */}
      <Dialog open={dialogMode === 'createPosition' || dialogMode === 'editPosition'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'createPosition' ? '创建岗位' : '编辑岗位'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'createPosition'
                ? '填写岗位信息创建新岗位'
                : '修改岗位信息'}
            </DialogDescription>
          </DialogHeader>
          <PositionForm
            mode={dialogMode === 'createPosition' ? 'create' : 'edit'}
            departments={departmentOptions}
            defaultDepartmentId={selectedId || undefined}
            onSubmit={handlePositionSubmit}
            onCancel={closeDialog}
            loading={posMutations.loading}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={dialogMode === 'deleteDepartment' || dialogMode === 'deletePosition'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'department' ? (
                <>
                  确定要删除部门"{deleteTarget?.name}"吗？<br />
                  该操作不可恢复。
                </>
              ) : (
                <>
                  确定要删除岗位"{deleteTarget?.name}"吗？<br />
                  该操作不可恢复。
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deptMutations.loading || posMutations.loading}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
