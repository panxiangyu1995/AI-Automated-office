/**
 * 403 禁止访问处理 Hook
 *
 * @module useForbiddenHandler
 * @description 提供 403 弹窗的显示和隐藏控制
 */

import { usePermissionStore } from '@/stores/permissionStore'
import type {
  ForbiddenData,
  UseForbiddenHandlerReturn,
} from '../types/permission.types'

/**
 * 403 处理 Hook
 *
 * @returns 显示/隐藏弹窗方法和弹窗状态
 *
 * @example
 * ```tsx
 * const { showForbidden, hideForbidden, forbiddenModal } = useForbiddenHandler()
 *
 * // 显示 403 弹窗
 * showForbidden({
 *   resource: 'hr.employee',
 *   requiredPermission: 'hr_employee_write',
 *   message: '您没有权限编辑员工信息',
 * })
 *
 * // 检查弹窗状态
 * if (forbiddenModal.open) {
 *   // 弹窗已打开
 * }
 * ```
 */
export function useForbiddenHandler(): UseForbiddenHandlerReturn {
  const showForbidden = usePermissionStore((state) => state.showForbidden)
  const hideForbidden = usePermissionStore((state) => state.hideForbidden)
  const forbiddenModal = usePermissionStore((state) => state.forbiddenModal)

  return {
    showForbidden: (data: ForbiddenData) => showForbidden(data),
    hideForbidden,
    forbiddenModal,
  }
}
