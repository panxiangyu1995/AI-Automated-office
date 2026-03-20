/**
 * 细粒度权限状态管理
 *
 * @module fineGrainedStore
 * @description 细粒度权限配置相关的 Zustand Store
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type {
  UserPermissionSummary,
  RolePermissionSource,
  OverrideType,
  DataScope,
  FieldRestriction,
  ResourceDefinition,
  DepartmentTreeNode,
} from '../types/fine-grained.types'
import { fineGrainedApi } from '../api/fineGrainedApi'

type TabType = 'override' | 'datascope' | 'field'

interface FineGrainedPermissionState {
  // ==================== 当前用户 ====================
  selectedUserId: string | null
  userSummary: UserPermissionSummary | null

  // ==================== 权限覆盖 ====================
  rolePermissions: Record<string, RolePermissionSource>
  currentOverrides: Record<string, OverrideType>
  pendingOverrides: Record<string, OverrideType | null>

  // ==================== 数据范围 ====================
  currentDataScopes: Record<string, DataScope>
  pendingDataScopes: Record<string, DataScope>

  // ==================== 字段权限 ====================
  currentFieldRestrictions: Record<string, Record<string, FieldRestriction>>
  pendingFieldRestrictions: Record<string, Record<string, FieldRestriction>>

  // ==================== 资源数据 ====================
  resources: ResourceDefinition[]
  departmentTree: DepartmentTreeNode[]

  // ==================== UI 状态 ====================
  activeTab: TabType
  selectedResource: string | null
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  error: string | null

  // ==================== 计算属性（getter 函数） ====================

  /**
   * 获取当前资源的权限列表
   */
  getResourcePermissions: (resourceCode: string) => { id: string; name: string }[]

  /**
   * 获取当前资源的字段列表
   */
  getResourceFields: (resourceCode: string) => { name: string; label: string }[]

  /**
   * 获取当前资源的权限覆盖变更
   */
  getOverrideChanges: () => { permission_id: string; type: OverrideType | null }[]

  /**
   * 获取是否有未保存的变更
   */
  getHasUnsavedChanges: () => boolean

  // ==================== 数据获取 Actions ====================

  /**
   * 选择用户并加载数据
   */
  selectUser: (userId: string) => Promise<void>

  /**
   * 获取资源列表
   */
  fetchResources: () => Promise<void>

  /**
   * 获取部门树
   */
  fetchDepartmentTree: () => Promise<void>

  // ==================== Tab 切换 ====================

  /**
   * 设置当前 Tab
   */
  setActiveTab: (tab: TabType) => void

  /**
   * 设置当前选中的资源
   */
  setSelectedResource: (resourceCode: string | null) => void

  // ==================== 权限覆盖 Actions ====================

  /**
   * 切换权限覆盖
   * @param permissionId 权限 ID
   * @param type 覆盖类型，null 表示清除覆盖
   */
  toggleOverride: (permissionId: string, type: OverrideType | null) => void

  /**
   * 批量设置权限覆盖
   */
  batchToggleOverrides: (permissionIds: string[], type: OverrideType | null) => void

  // ==================== 数据范围 Actions ====================

  /**
   * 更新数据范围
   */
  updateDataScope: (resource: string, scope: DataScope) => void

  // ==================== 字段权限 Actions ====================

  /**
   * 更新字段权限
   */
  updateFieldRestriction: (
    resource: string,
    field: string,
    restriction: FieldRestriction
  ) => void

  /**
   * 批量更新字段权限
   */
  batchUpdateFieldRestrictions: (
    resource: string,
    fields: string[],
    restriction: FieldRestriction
  ) => void

  // ==================== 保存和重置 Actions ====================

  /**
   * 保存所有变更
   */
  saveChanges: () => Promise<void>

  /**
   * 重置所有变更
   */
  resetChanges: () => void

  /**
   * 重置状态
   */
  reset: () => void

  /**
   * 设置错误信息
   */
  setError: (error: string | null) => void
}

const initialState = {
  selectedUserId: null,
  userSummary: null,
  rolePermissions: {},
  currentOverrides: {},
  pendingOverrides: {},
  currentDataScopes: {},
  pendingDataScopes: {},
  currentFieldRestrictions: {},
  pendingFieldRestrictions: {},
  resources: [],
  departmentTree: [],
  activeTab: 'override' as TabType,
  selectedResource: null,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,
  error: null,
}

export const useFineGrainedStore = create<FineGrainedPermissionState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // ==================== 计算属性 ====================

      getResourcePermissions: (resourceCode: string) => {
        const { resources } = get()
        const resource = resources.find((r) => r.code === resourceCode)
        if (!resource) return []
        return resource.permissions.map((p) => ({ id: p.id, name: p.name }))
      },

      getResourceFields: (resourceCode: string) => {
        const { resources } = get()
        const resource = resources.find((r) => r.code === resourceCode)
        if (!resource) return []
        return resource.fields.map((f) => ({ name: f.name, label: f.label }))
      },

      getOverrideChanges: () => {
        const { pendingOverrides } = get()
        return Object.entries(pendingOverrides).map(([permissionId, type]) => ({
          permission_id: permissionId,
          type,
        }))
      },

      getHasUnsavedChanges: () => {
        const { pendingOverrides, pendingDataScopes, pendingFieldRestrictions } = get()
        return (
          Object.keys(pendingOverrides).length > 0 ||
          Object.keys(pendingDataScopes).length > 0 ||
          Object.keys(pendingFieldRestrictions).length > 0
        )
      },

      // ==================== 数据获取 Actions ====================

      selectUser: async (userId: string) => {
        const { hasUnsavedChanges, selectedUserId } = get()

        // 如果有未保存的变更，不切换用户
        if (hasUnsavedChanges && selectedUserId !== userId) {
          set({ error: '有未保存的变更，请先保存或重置' })
          return
        }

        set({ isLoading: true, error: null, selectedUserId: userId })

        try {
          const result = await fineGrainedApi.getUserPermissionResult(userId)

          set({
            userSummary: result.user,
            rolePermissions: result.role_permissions,
            currentOverrides: result.overrides,
            pendingOverrides: {},
            currentDataScopes: result.data_scopes,
            pendingDataScopes: {},
            currentFieldRestrictions: result.field_restrictions,
            pendingFieldRestrictions: {},
            hasUnsavedChanges: false,
            isLoading: false,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取用户权限失败',
          })
          throw error
        }
      },

      fetchResources: async () => {
        try {
          const resources = await fineGrainedApi.getResources()
          set({ resources })
        } catch (error) {
          console.error('获取资源列表失败:', error)
        }
      },

      fetchDepartmentTree: async () => {
        try {
          const departmentTree = await fineGrainedApi.getDepartmentTree()
          set({ departmentTree })
        } catch (error) {
          console.error('获取部门树失败:', error)
        }
      },

      // ==================== Tab 切换 ====================

      setActiveTab: (tab: TabType) => set({ activeTab: tab }),

      setSelectedResource: (resourceCode: string | null) => set({ selectedResource: resourceCode }),

      // ==================== 权限覆盖 Actions ====================

      toggleOverride: (permissionId: string, type: OverrideType | null) => {
        const { currentOverrides, pendingOverrides } = get()
        const currentType = currentOverrides[permissionId] ?? null

        // 如果新值与当前值相同，移除待处理变更
        if (type === currentType) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [permissionId]: _, ...rest } = pendingOverrides
          set({
            pendingOverrides: rest,
            hasUnsavedChanges: Object.keys(rest).length > 0 ||
              Object.keys(get().pendingDataScopes).length > 0 ||
              Object.keys(get().pendingFieldRestrictions).length > 0,
          })
        } else {
          set({
            pendingOverrides: { ...pendingOverrides, [permissionId]: type },
            hasUnsavedChanges: true,
          })
        }
      },

      batchToggleOverrides: (permissionIds: string[], type: OverrideType | null) => {
        const { currentOverrides, pendingOverrides } = get()
        const newPendingOverrides = { ...pendingOverrides }

        permissionIds.forEach((permissionId) => {
          const currentType = currentOverrides[permissionId] ?? null
          if (type === currentType) {
            delete newPendingOverrides[permissionId]
          } else {
            newPendingOverrides[permissionId] = type
          }
        })

        set({
          pendingOverrides: newPendingOverrides,
          hasUnsavedChanges:
            Object.keys(newPendingOverrides).length > 0 ||
            Object.keys(get().pendingDataScopes).length > 0 ||
            Object.keys(get().pendingFieldRestrictions).length > 0,
        })
      },

      // ==================== 数据范围 Actions ====================

      updateDataScope: (resource: string, scope: DataScope) => {
        const { currentDataScopes, pendingDataScopes } = get()
        const currentScope = currentDataScopes[resource]

        // 简单比较是否相同
        const isSame = JSON.stringify(scope) === JSON.stringify(currentScope)

        if (isSame) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [resource]: _, ...rest } = pendingDataScopes
          set({
            pendingDataScopes: rest,
            hasUnsavedChanges:
              Object.keys(get().pendingOverrides).length > 0 ||
              Object.keys(rest).length > 0 ||
              Object.keys(get().pendingFieldRestrictions).length > 0,
          })
        } else {
          set({
            pendingDataScopes: { ...pendingDataScopes, [resource]: scope },
            hasUnsavedChanges: true,
          })
        }
      },

      // ==================== 字段权限 Actions ====================

      updateFieldRestriction: (
        resource: string,
        field: string,
        restriction: FieldRestriction
      ) => {
        const { currentFieldRestrictions, pendingFieldRestrictions } = get()
        const currentRestriction = currentFieldRestrictions[resource]?.[field]
        const isSame = JSON.stringify(restriction) === JSON.stringify(currentRestriction)

        const currentPendingForResource = pendingFieldRestrictions[resource] || {}
        const newPendingForResource = { ...currentPendingForResource }

        if (isSame) {
          delete newPendingForResource[field]
        } else {
          newPendingForResource[field] = restriction
        }

        // 如果该资源没有待处理变更，移除整个资源
        if (Object.keys(newPendingForResource).length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [resource]: _, ...rest } = pendingFieldRestrictions
          set({
            pendingFieldRestrictions: rest,
            hasUnsavedChanges:
              Object.keys(get().pendingOverrides).length > 0 ||
              Object.keys(get().pendingDataScopes).length > 0 ||
              Object.keys(rest).length > 0,
          })
        } else {
          set({
            pendingFieldRestrictions: {
              ...pendingFieldRestrictions,
              [resource]: newPendingForResource,
            },
            hasUnsavedChanges: true,
          })
        }
      },

      batchUpdateFieldRestrictions: (
        resource: string,
        fields: string[],
        restriction: FieldRestriction
      ) => {
        const { currentFieldRestrictions, pendingFieldRestrictions } = get()
        const currentForResource = currentFieldRestrictions[resource] || {}
        const currentPendingForResource = pendingFieldRestrictions[resource] || {}
        const newPendingForResource = { ...currentPendingForResource }

        fields.forEach((field) => {
          const currentRestriction = currentForResource[field]
          const isSame = JSON.stringify(restriction) === JSON.stringify(currentRestriction)

          if (isSame) {
            delete newPendingForResource[field]
          } else {
            newPendingForResource[field] = restriction
          }
        })

        if (Object.keys(newPendingForResource).length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [resource]: _, ...rest } = pendingFieldRestrictions
          set({
            pendingFieldRestrictions: rest,
            hasUnsavedChanges:
              Object.keys(get().pendingOverrides).length > 0 ||
              Object.keys(get().pendingDataScopes).length > 0 ||
              Object.keys(rest).length > 0,
          })
        } else {
          set({
            pendingFieldRestrictions: {
              ...pendingFieldRestrictions,
              [resource]: newPendingForResource,
            },
            hasUnsavedChanges: true,
          })
        }
      },

      // ==================== 保存和重置 Actions ====================

      saveChanges: async () => {
        const { selectedUserId, pendingOverrides, pendingDataScopes, pendingFieldRestrictions } =
          get()

        if (!selectedUserId) return

        set({ isSaving: true, error: null })

        try {
          // 1. 保存权限覆盖
          if (Object.keys(pendingOverrides).length > 0) {
            const overrideChanges = Object.entries(pendingOverrides)
              .filter(([_, type]) => type !== null)
              .map(([permissionId, type]) => ({
                permission_id: permissionId,
                type: type as OverrideType,
              }))

            if (overrideChanges.length > 0) {
              await fineGrainedApi.updateUserOverrides(selectedUserId, {
                overrides: overrideChanges,
              })
            }
          }

          // 2. 保存数据范围
          if (Object.keys(pendingDataScopes).length > 0) {
            await fineGrainedApi.updateUserDataScopes(selectedUserId, {
              data_scopes: pendingDataScopes,
            })
          }

          // 3. 保存字段权限
          if (Object.keys(pendingFieldRestrictions).length > 0) {
            await fineGrainedApi.updateUserFieldRestrictions(selectedUserId, {
              field_restrictions: pendingFieldRestrictions,
            })
          }

          // 更新当前值并清除待处理变更
          const { currentOverrides, currentDataScopes, currentFieldRestrictions } = get()

          // 合并权限覆盖
          const newOverrides = { ...currentOverrides }
          Object.entries(pendingOverrides).forEach(([permissionId, type]) => {
            if (type === null) {
              delete newOverrides[permissionId]
            } else {
              newOverrides[permissionId] = type
            }
          })

          // 合并数据范围
          const newDataScopes = { ...currentDataScopes, ...pendingDataScopes }

          // 合并字段权限
          const newFieldRestrictions = { ...currentFieldRestrictions }
          Object.entries(pendingFieldRestrictions).forEach(([resource, fields]) => {
            newFieldRestrictions[resource] = {
              ...(newFieldRestrictions[resource] || {}),
              ...fields,
            }
          })

          set({
            currentOverrides: newOverrides,
            currentDataScopes: newDataScopes,
            currentFieldRestrictions: newFieldRestrictions,
            pendingOverrides: {},
            pendingDataScopes: {},
            pendingFieldRestrictions: {},
            hasUnsavedChanges: false,
            isSaving: false,
          })
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : '保存失败',
          })
          throw error
        }
      },

      resetChanges: () => {
        set({
          pendingOverrides: {},
          pendingDataScopes: {},
          pendingFieldRestrictions: {},
          hasUnsavedChanges: false,
        })
      },

      reset: () => set(initialState),

      setError: (error: string | null) => set({ error }),
    })),
    { name: 'fine-grained-store' }
  )
)

export default useFineGrainedStore
