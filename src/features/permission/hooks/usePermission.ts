import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import type { UsePermissionReturn } from '../types/permission.types'

export function usePermission(): UsePermissionReturn {
  const authPermissions = useAuthStore((state) => state.permissions)
  const setStorePermissions = usePermissionStore((state) => state.setPermissions)
  const storePermissions = usePermissionStore((state) => state.permissions)
  const isRestoring = useAuthStore((state) => state.isRestoring)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const syncPermissions = useCallback(() => {
    if (authPermissions?.permissions) {
      setStorePermissions(authPermissions.permissions)
    }
  }, [authPermissions?.permissions, setStorePermissions])

  const hasPermission = useCallback(
    (permission: string | string[]): boolean => {
      if (storePermissions.size > 0) {
        if (storePermissions.has('*')) {
          return true
        }

        if (Array.isArray(permission)) {
          return permission.some((item) => storePermissions.has(item))
        }

        return storePermissions.has(permission)
      }

      if (authPermissions?.permissions) {
        if (authPermissions.permissions.includes('*')) {
          return true
        }

        if (Array.isArray(permission)) {
          return permission.some((item) => authPermissions.permissions.includes(item))
        }

        return authPermissions.permissions.includes(permission)
      }

      return false
    },
    [storePermissions, authPermissions?.permissions]
  )

  const refresh = useCallback(async () => {
    syncPermissions()
  }, [syncPermissions])

  return {
    permissions: storePermissions,
    isLoading: isRestoring || !isAuthenticated,
    hasPermission,
    refresh,
  }
}
