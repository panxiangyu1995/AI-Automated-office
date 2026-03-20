/**
 * 权限中心页面
 *
 * @component PermissionCenter
 * @description 权限管理的主页面，包含角色列表和权限矩阵
 */

import { useEffect, useState } from 'react'
import { RefreshCw, Save, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { RoleList } from './RoleList'
import { RoleInfoCard } from './RoleInfoCard'
import { PermissionMatrix } from './PermissionMatrix'
import { RoleFormDialog } from './RoleFormDialog'
import { usePermissionStore } from '../stores/permissionStore'
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '../types/permission.types'

export function PermissionCenter() {
  const { toast } = useToast()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const {
    // 数据
    roles,
    permissionGroups,
    selectedRoleId,
    currentPermissionIds,
    pendingChanges,
    // 加载状态
    isLoadingRoles,
    isLoadingPermissions,
    isSaving,
    // UI 状态
    isCreateDialogOpen,
    isEditDialogOpen,
    editingRole,
    // 错误
    error,
    // Actions
    fetchRoles,
    fetchPermissions,
    selectRole,
    togglePermission,
    batchToggle,
    resetChanges,
    saveChanges,
    createRole,
    updateRole,
    deleteRole,
    setCreateDialogOpen,
    openEditDialog,
    closeEditDialog,
    getSelectedRole,
    getHasUnsavedChanges,
  } = usePermissionStore()

  // 初始化数据
  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [fetchRoles, fetchPermissions])

  // 显示错误提示
  useEffect(() => {
    if (error) {
      toast({
        title: '操作失败',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // 获取当前选中的角色
  const selectedRole = getSelectedRole()
  const hasUnsavedChanges = getHasUnsavedChanges()

  // 处理刷新
  const handleRefresh = async () => {
    await Promise.all([fetchRoles(), fetchPermissions()])
    if (selectedRoleId) {
      await usePermissionStore.getState().fetchRolePermissions(selectedRoleId)
    }
    toast({
      title: '刷新成功',
      description: '数据已更新',
    })
  }

  // 处理保存
  const handleSave = async () => {
    try {
      await saveChanges()
      toast({
        title: '保存成功',
        description: '权限配置已保存',
      })
    } catch {
      // 错误已在 store 中处理
    }
  }

  // 处理重置
  const handleReset = () => {
    resetChanges()
    toast({
      title: '已重置',
      description: '变更已撤销',
    })
  }

  // 处理创建角色
  const handleCreateRole = async (data: CreateRoleRequest) => {
    try {
      const role = await createRole(data)
      toast({
        title: '创建成功',
        description: `角色 "${role.name}" 已创建`,
      })
    } catch {
      // 错误已在 store 中处理
    }
  }

  // 处理更新角色
  const handleUpdateRole = async (data: UpdateRoleRequest) => {
    if (!editingRole) return
    try {
      await updateRole(editingRole.id, data)
      toast({
        title: '更新成功',
        description: `角色信息已更新`,
      })
    } catch {
      // 错误已在 store 中处理
    }
  }

  // 处理删除角色
  const handleDeleteRole = async () => {
    if (!roleToDelete) return
    try {
      await deleteRole(roleToDelete.id)
      setDeleteConfirmOpen(false)
      setRoleToDelete(null)
      toast({
        title: '删除成功',
        description: `角色 "${roleToDelete.name}" 已删除`,
      })
    } catch {
      // 错误已在 store 中处理
    }
  }

  // 确认删除对话框
  const confirmDelete = (role: Role) => {
    setRoleToDelete(role)
    setDeleteConfirmOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">权限中心</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingRoles || isLoadingPermissions}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isLoadingRoles || isLoadingPermissions ? 'animate-spin' : ''
              }`}
            />
            刷新
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            新建角色
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧角色列表 */}
        <RoleList
          roles={roles}
          selectedId={selectedRoleId}
          onSelect={selectRole}
          onCreate={() => setCreateDialogOpen(true)}
          isLoading={isLoadingRoles}
        />

        {/* 右侧内容区 */}
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
          {selectedRole ? (
            <>
              {/* 角色信息卡片 */}
              <div className="border-b border-gray-200 bg-white p-6">
                <RoleInfoCard
                  role={selectedRole}
                  onEdit={() => openEditDialog(selectedRole)}
                  onDelete={() => confirmDelete(selectedRole)}
                />
              </div>

              {/* 权限矩阵 */}
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">权限配置</h2>
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={isSaving}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        重置
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        保存变更
                      </Button>
                    </div>
                  )}
                </div>
                <PermissionMatrix
                  permissionGroups={permissionGroups}
                  selectedIds={currentPermissionIds}
                  pendingChanges={pendingChanges}
                  onToggle={togglePermission}
                  onBatchToggle={batchToggle}
                  disabled={selectedRole.is_system}
                />
                {selectedRole.is_system && (
                  <div className="mt-4 rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-500">
                    系统角色权限不可修改
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500">请从左侧选择一个角色</p>
                <p className="mt-1 text-sm text-gray-400">查看和配置角色权限</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建角色对话框 */}
      <RoleFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateRole}
        isLoading={isSaving}
        mode="create"
      />

      {/* 编辑角色对话框 */}
      {editingRole && (
        <RoleFormDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => !open && closeEditDialog()}
          role={editingRole}
          onSubmit={handleUpdateRole}
          isLoading={isSaving}
          mode="edit"
        />
      )}

      {/* 删除确认对话框 */}
      {deleteConfirmOpen && roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
            <p className="mt-2 text-gray-600">
              确定要删除角色 "{roleToDelete.name}" 吗？此操作不可撤销。
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setRoleToDelete(null)
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRole}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionCenter
