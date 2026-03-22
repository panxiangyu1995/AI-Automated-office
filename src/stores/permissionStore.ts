import { create } from 'zustand'
import type { PermissionState } from '@/features/permission/types/permission.types'

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

    if (permissions.has('*')) {
      return true
    }

    if (Array.isArray(permission)) {
      return permission.some((item) => permissions.has(item))
    }

    return permissions.has(permission)
  },

  showForbidden: (data) => {
    const { shownForbiddenResources } = get()

    if (shownForbiddenResources.has(data.resource)) {
      return
    }

    set({
      forbiddenModal: { open: true, data },
      shownForbiddenResources: new Set([...shownForbiddenResources, data.resource]),
    })

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
    const nextResources = new Set(shownForbiddenResources)
    nextResources.delete(resource)
    set({ shownForbiddenResources: nextResources })
  },
}))
