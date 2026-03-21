/**
 * 权限状态管理 Store
 *
 * @module permissionStore
 * @description 管理用户权限缓存、403 弹窗状态和防重复弹出机制
 */

import { create } from 'zustand'
import type { PermissionState } from '@/features/permission/types/permission.types'

/** 同一资源禁止重复弹窗的时间窗口（毫秒） */
const FORBIDDEN_COOLDOWN_MS = 5 * 60 * 1000

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: new Set<string>(),
  forbiddenModal: {
    open: false,
    data: null,
  },
  shownForbiddenResources: new Set<string>(),

  setPermissions: (permissions) =>
    set({
      permissions: new Set(permissions),
    }),

  hasPermission: (permission) => {
    const { permissions } = get()
    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.has(p))
    }
    return permissions.has(permission)
  },

  showForbidden: (data) => {
    const { shownForbiddenResources } = get()

    // 同一资源在冷却期内不重复弹出
    if (shownForbiddenResources.has(data.resource)) {
      return
    }

    set({
      forbiddenModal: { open: true, data },
      shownForbiddenResources: new Set([...shownForbiddenResources, data.resource]),
    })

    // 冷却期后清除记录，允许再次弹出
    setTimeout(() => {
      get().clearForbiddenRecord(data.resource)
    }, FORBIDDEN_COOLDOWN_MS)
  },

  hideForbidden: () =>
    set({
      forbiddenModal: { open: false, data: null },
    }),

  clearForbiddenRecord: (resource) => {
    const { shownForbiddenResources } = get()
    const newSet = new Set(shownForbiddenResources)
    newSet.delete(resource)
    set({ shownForbiddenResources: newSet })
  },
}))
