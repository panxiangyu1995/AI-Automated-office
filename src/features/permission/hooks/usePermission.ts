/**
 * 权限检查 Hook
 *
 * @module usePermission
 * @description 提供权限检查功能，支持单权限和多权限检查
 */

import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import type { UsePermissionReturn } from '../types/permission.types'

/**
 * 权限检查 Hook
 *
 * @returns 权限集合、加载状态、检查方法和刷新方法
 *
 * @example
 * ```tsx
 * const { hasPermission, isLoading } = usePermission()
 *
 * if (hasPermission('hr_employee_write')) {
 *   // 有权限
 * }
 *
 * // 多权限检查（OR 关系）
 * if (hasPermission(['hr_employee_write', 'hr_employee_admin'])) {
 *   // 至少有一个权限
 * }
 * ```
 */
export function usePermission(): UsePermissionReturn {
  const authPermissions = useAuthStore((state) => state.permissions)
  const setStorePermissions = usePermissionStore((state) => state.setPermissions)
  const storePermissions = usePermissionStore((state) => state.permissions)
  const isRestoring = useAuthStore((state) => state.isRestoring)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // 从 authStore 同步权限到 permissionStore
  const syncPermissions = useCallback(() => {
    if (authPermissions?.permissions) {
      setStorePermissions(authPermissions.permissions)
    }
  }, [authPermissions?.permissions, setStorePermissions])

  // 权限检查方法
  const hasPermission = useCallback(
    (permission: string | string[]): boolean => {
      // 优先使用 store 中的权限
      if (storePermissions.size > 0) {
        if (Array.isArray(permission)) {
          return permission.some((p) => storePermissions.has(p))
        }
        return storePermissions.has(permission)
      }

      // 回退到 authStore 的权限
      if (authPermissions?.permissions) {
        if (Array.isArray(permission)) {
          return permission.some((p) => authPermissions.permissions.includes(p))
        }
        return authPermissions.permissions.includes(permission)
      }

      return false
    },
    [storePermissions, authPermissions?.permissions],
  )

  // 刷新权限
  const refresh = useCallback(async () => {
    // 触发权限同步
    syncPermissions()
  }, [syncPermissions])

  return {
    permissions: storePermissions,
    isLoading: isRestoring || !isAuthenticated,
    hasPermission,
    refresh,
  }
}
