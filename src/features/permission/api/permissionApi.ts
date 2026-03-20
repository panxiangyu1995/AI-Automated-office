/**
 * 权限中心 API 封装
 *
 * @module permissionApi
 * @description 权限管理相关的 API 调用
 */

import { ApiClient } from '@/lib/api/client'
import type {
  ApiEnvelope,
  Role,
  RoleListResponse,
  Permission,
  PermissionListResponse,
  RolePermissionsResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  PermissionLayer,
} from '../types/permission.types'

const BASE_URL = '/api/v1'

// 创建 API 客户端实例
const createApiClient = () => {
  return new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? '',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    retryBackoff: 'exponential',
  })
}

/**
 * 权限 API
 */
export const permissionApi = {
  // ==================== 角色管理 ====================

  /**
   * 获取角色列表
   */
  async getRoles(): Promise<Role[]> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<RoleListResponse>>(`${BASE_URL}/roles`)
    return response.data.items
  },

  /**
   * 获取角色详情
   */
  async getRole(id: string): Promise<Role> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<Role>>(`${BASE_URL}/roles/${id}`)
    return response.data
  },

  /**
   * 创建角色
   */
  async createRole(data: CreateRoleRequest): Promise<Role> {
    const client = createApiClient()
    const response = await client.post<ApiEnvelope<Role>>(`${BASE_URL}/roles`, data)
    return response.data
  },

  /**
   * 更新角色
   */
  async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    const client = createApiClient()
    const response = await client.put<ApiEnvelope<Role>>(`${BASE_URL}/roles/${id}`, data)
    return response.data
  },

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<void> {
    const client = createApiClient()
    await client.delete(`${BASE_URL}/roles/${id}`)
  },

  // ==================== 权限管理 ====================

  /**
   * 获取权限列表
   * @param layer 权限层级过滤（可选）
   */
  async getPermissions(layer?: PermissionLayer): Promise<Permission[]> {
    const client = createApiClient()
    const url = layer
      ? `${BASE_URL}/permissions?layer=${encodeURIComponent(layer)}`
      : `${BASE_URL}/permissions`
    const response = await client.get<ApiEnvelope<PermissionListResponse>>(url)
    return response.data.items
  },

  /**
   * 获取权限分组列表
   * @param layer 权限层级过滤（可选）
   */
  async getPermissionGroups(layer?: PermissionLayer): Promise<PermissionListResponse['groups']> {
    const client = createApiClient()
    const url = layer
      ? `${BASE_URL}/permissions?layer=${encodeURIComponent(layer)}`
      : `${BASE_URL}/permissions`
    const response = await client.get<ApiEnvelope<PermissionListResponse>>(url)
    return response.data.groups
  },

  // ==================== 角色权限 ====================

  /**
   * 获取角色权限
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<RolePermissionsResponse>>(
      `${BASE_URL}/roles/${roleId}/permissions`
    )
    return response.data.permission_ids
  },

  /**
   * 更新角色权限
   */
  async updateRolePermissions(
    roleId: string,
    data: UpdateRolePermissionsRequest
  ): Promise<void> {
    const client = createApiClient()
    await client.put(`${BASE_URL}/roles/${roleId}/permissions`, data)
  },
}

export default permissionApi
