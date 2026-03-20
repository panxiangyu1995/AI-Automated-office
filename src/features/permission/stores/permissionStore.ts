/**
 * 权限中心状态管理
 *
 * @module permissionStore
 * @description 权限管理相关的 Zustand Store
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type {
  Role,
  Permission,
  PermissionLayer,
  PermissionGroup,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '../types/permission.types'
import { permissionApi } from '../api/permissionApi'

interface PermissionState {
  // ==================== 数据状态 ====================
  roles: Role[]
  permissions: Permission[]
  permissionGroups: PermissionGroup[]
  selectedRoleId: string | null
  currentPermissionIds: string[]
  pendingChanges: Record<string, boolean>

  // ==================== 加载状态 ====================
  isLoadingRoles: boolean
  isLoadingPermissions: boolean
  isSaving: boolean

  // ==================== UI 状态 ====================
  searchQuery: string
  isCreateDialogOpen: boolean
  isEditDialogOpen: boolean
  editingRole: Role | null

  // ==================== 错误状态 ====================
  error: string | null

  // ==================== 计算属性（getter 函数） ====================

  /**
   * 获取当前选中的角色
   */
  getSelectedRole: () => Role | null

  /**
   * 获取是否有未保存的变更
   */
  getHasUnsavedChanges: () => boolean

  /**
   * 获取按层级分组的角色
   */
  getRolesByLayer: () => Record<PermissionLayer, Role[]>

  /**
   * 获取按模块分组的权限
   */
  getPermissionsByModule: () => Record<string, Permission[]>

  // ==================== 数据获取 Actions ====================

  /**
   * 获取角色列表
   */
  fetchRoles: () => Promise<void>

  /**
   * 获取权限列表
   */
  fetchPermissions: () => Promise<void>

  /**
   * 获取角色权限
   */
  fetchRolePermissions: (roleId: string) => Promise<void>

  // ==================== 选择与变更 Actions ====================

  /**
   * 选择角色
   */
  selectRole: (roleId: string | null) => void

  /**
   * 切换权限选中状态
   */
  togglePermission: (permissionId: string) => void

  /**
   * 批量切换权限
   */
  batchToggle: (module: string, selected: boolean) => void

  /**
   * 重置变更
   */
  resetChanges: () => void

  // ==================== 保存 Actions ====================

  /**
   * 保存权限变更
   */
  saveChanges: () => Promise<void>

  // ==================== CRUD Actions ====================

  /**
   * 创建角色
   */
  createRole: (data: CreateRoleRequest) => Promise<Role>

  /**
   * 更新角色
   */
  updateRole: (id: string, data: UpdateRoleRequest) => Promise<Role>

  /**
   * 删除角色
   */
  deleteRole: (id: string) => Promise<void>

  // ==================== UI Actions ====================

  /**
   * 设置搜索关键词
   */
  setSearchQuery: (query: string) => void

  /**
   * 打开/关闭创建角色对话框
   */
  setCreateDialogOpen: (open: boolean) => void

  /**
   * 打开编辑角色对话框
   */
  openEditDialog: (role: Role) => void

  /**
   * 关闭编辑角色对话框
   */
  closeEditDialog: () => void

  /**
   * 设置错误信息
   */
  setError: (error: string | null) => void

  /**
   * 重置状态
   */
  reset: () => void
}

const initialState = {
  roles: [],
  permissions: [],
  permissionGroups: [],
  selectedRoleId: null,
  currentPermissionIds: [],
  pendingChanges: {},
  isLoadingRoles: false,
  isLoadingPermissions: false,
  isSaving: false,
  searchQuery: '',
  isCreateDialogOpen: false,
  isEditDialogOpen: false,
  editingRole: null,
  error: null,
}

export const usePermissionStore = create<PermissionState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // ==================== 计算属性 ====================

      getSelectedRole: () => {
        const { roles, selectedRoleId } = get()
        return roles.find((r) => r.id === selectedRoleId) || null
      },

      getHasUnsavedChanges: () => {
        const { pendingChanges } = get()
        return Object.keys(pendingChanges).length > 0
      },

      getRolesByLayer: () => {
        const { roles, searchQuery } = get()
        const filteredRoles = searchQuery
          ? roles.filter(
              (r) =>
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.code.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : roles

        return {
          base: filteredRoles.filter((r) => r.layer === 'base'),
          department: filteredRoles.filter((r) => r.layer === 'department'),
          approval: filteredRoles.filter((r) => r.layer === 'approval'),
        }
      },

      getPermissionsByModule: () => {
        const { permissions } = get()
        return permissions.reduce(
          (acc, p) => {
            if (!acc[p.module]) {
              acc[p.module] = []
            }
            acc[p.module].push(p)
            return acc
          },
          {} as Record<string, Permission[]>
        )
      },

      // ==================== 数据获取 Actions ====================

      fetchRoles: async () => {
        set({ isLoadingRoles: true, error: null })
        try {
          const roles = await permissionApi.getRoles()
          set({ roles, isLoadingRoles: false })
        } catch (error) {
          set({
            isLoadingRoles: false,
            error: error instanceof Error ? error.message : '获取角色列表失败',
          })
          throw error
        }
      },

      fetchPermissions: async () => {
        set({ isLoadingPermissions: true, error: null })
        try {
          const permissions = await permissionApi.getPermissions()
          // 计算权限分组
          const groupsMap = new Map<string, PermissionGroup>()
          permissions.forEach((p) => {
            if (!groupsMap.has(p.module)) {
              groupsMap.set(p.module, {
                module: p.module,
                module_name: p.module_name,
                permissions: [],
              })
            }
            groupsMap.get(p.module)!.permissions.push(p)
          })
          const permissionGroups = Array.from(groupsMap.values())
          set({ permissions, permissionGroups, isLoadingPermissions: false })
        } catch (error) {
          set({
            isLoadingPermissions: false,
            error: error instanceof Error ? error.message : '获取权限列表失败',
          })
          throw error
        }
      },

      fetchRolePermissions: async (roleId: string) => {
        set({ isLoadingPermissions: true, error: null })
        try {
          const permissionIds = await permissionApi.getRolePermissions(roleId)
          set({
            currentPermissionIds: permissionIds,
            pendingChanges: {},
            isLoadingPermissions: false,
          })
        } catch (error) {
          set({
            isLoadingPermissions: false,
            error: error instanceof Error ? error.message : '获取角色权限失败',
          })
          throw error
        }
      },

      // ==================== 选择与变更 Actions ====================

      selectRole: (roleId) => {
        set({ selectedRoleId: roleId, pendingChanges: {} })
        if (roleId) {
          get().fetchRolePermissions(roleId)
        } else {
          set({ currentPermissionIds: [] })
        }
      },

      togglePermission: (permissionId) => {
        const { currentPermissionIds, pendingChanges } = get()
        const isCurrentlySelected = currentPermissionIds.includes(permissionId)
        const hasPendingChange = permissionId in pendingChanges
        const isPendingSelected = hasPendingChange
          ? pendingChanges[permissionId]
          : isCurrentlySelected

        const newSelected = !isPendingSelected

        // 如果变更后与原始状态相同，则从 pendingChanges 中移除
        if (newSelected === isCurrentlySelected) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [permissionId]: _, ...rest } = pendingChanges
          set({ pendingChanges: rest })
        } else {
          set({
            pendingChanges: { ...pendingChanges, [permissionId]: newSelected },
          })
        }
      },

      batchToggle: (module, selected) => {
        const { permissions, currentPermissionIds, pendingChanges } = get()
        const modulePermissions = permissions.filter((p) => p.module === module)
        const newPendingChanges = { ...pendingChanges }

        modulePermissions.forEach((p) => {
          const isCurrentlySelected = currentPermissionIds.includes(p.id)
          if (selected === isCurrentlySelected) {
            // 与原始状态相同，移除变更
            delete newPendingChanges[p.id]
          } else {
            newPendingChanges[p.id] = selected
          }
        })

        set({ pendingChanges: newPendingChanges })
      },

      resetChanges: () => {
        set({ pendingChanges: {} })
      },

      // ==================== 保存 Actions ====================

      saveChanges: async () => {
        const { selectedRoleId, currentPermissionIds, pendingChanges } = get()
        if (!selectedRoleId) return

        set({ isSaving: true, error: null })
        try {
          // 计算最终的权限 ID 列表
          const finalPermissionIds = currentPermissionIds.filter(
            (id) => pendingChanges[id] !== false
          )
          Object.entries(pendingChanges).forEach(([id, selected]) => {
            if (selected && !finalPermissionIds.includes(id)) {
              finalPermissionIds.push(id)
            }
          })

          await permissionApi.updateRolePermissions(selectedRoleId, {
            permission_ids: finalPermissionIds,
          })

          // 更新当前权限列表
          set({
            currentPermissionIds: finalPermissionIds,
            pendingChanges: {},
            isSaving: false,
          })

          // 更新角色统计
          const roles = get().roles.map((r) =>
            r.id === selectedRoleId ? { ...r, permission_count: finalPermissionIds.length } : r
          )
          set({ roles })
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : '保存权限失败',
          })
          throw error
        }
      },

      // ==================== CRUD Actions ====================

      createRole: async (data) => {
        set({ isSaving: true, error: null })
        try {
          const role = await permissionApi.createRole(data)
          set((state) => ({
            roles: [...state.roles, role],
            isSaving: false,
            isCreateDialogOpen: false,
          }))
          return role
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : '创建角色失败',
          })
          throw error
        }
      },

      updateRole: async (id, data) => {
        set({ isSaving: true, error: null })
        try {
          const role = await permissionApi.updateRole(id, data)
          set((state) => ({
            roles: state.roles.map((r) => (r.id === id ? role : r)),
            isSaving: false,
            isEditDialogOpen: false,
            editingRole: null,
          }))
          return role
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : '更新角色失败',
          })
          throw error
        }
      },

      deleteRole: async (id) => {
        set({ isSaving: true, error: null })
        try {
          await permissionApi.deleteRole(id)
          set((state) => ({
            roles: state.roles.filter((r) => r.id !== id),
            selectedRoleId: state.selectedRoleId === id ? null : state.selectedRoleId,
            isSaving: false,
          }))
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : '删除角色失败',
          })
          throw error
        }
      },

      // ==================== UI Actions ====================

      setSearchQuery: (query) => set({ searchQuery: query }),

      setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),

      openEditDialog: (role) =>
        set({ isEditDialogOpen: true, editingRole: role }),

      closeEditDialog: () =>
        set({ isEditDialogOpen: false, editingRole: null }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    })),
    { name: 'permission-store' }
  )
)

export default usePermissionStore
