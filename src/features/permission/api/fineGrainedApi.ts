/**
 * 细粒度权限 API 封装
 *
 * @module fineGrainedApi
 * @description 细粒度权限配置相关的 API 调用
 */

import { ApiClient } from '@/lib/api/client'
import type {
  ApiEnvelope,
  UserPermissionResult,
  PermissionOverride,
  UpdateUserOverridesRequest,
  DataScope,
  UpdateUserDataScopesRequest,
  FieldRestriction,
  UpdateUserFieldRestrictionsRequest,
  ResourceDefinition,
  ResourceListResponse,
  DepartmentTreeNode,
} from '../types/fine-grained.types'

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
 * 细粒度权限 API
 */
export const fineGrainedApi = {
  // ==================== 用户权限查询 ====================

  /**
   * 获取用户完整权限结果
   * @param userId 用户 ID
   */
  async getUserPermissionResult(userId: string): Promise<UserPermissionResult> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<UserPermissionResult>>(
      `${BASE_URL}/admin/users/${userId}/permissions`
    )
    return response.data
  },

  /**
   * 获取用户权限覆盖
   * @param userId 用户 ID
   */
  async getUserOverrides(userId: string): Promise<PermissionOverride[]> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<{ overrides: PermissionOverride[] }>>(
      `${BASE_URL}/admin/users/${userId}/permission-overrides`
    )
    return response.data.overrides
  },

  /**
   * 更新用户权限覆盖
   * @param userId 用户 ID
   * @param data 覆盖数据
   */
  async updateUserOverrides(
    userId: string,
    data: UpdateUserOverridesRequest
  ): Promise<PermissionOverride[]> {
    const client = createApiClient()
    const response = await client.put<ApiEnvelope<{ overrides: PermissionOverride[] }>>(
      `${BASE_URL}/admin/users/${userId}/permission-overrides`,
      data
    )
    return response.data.overrides
  },

  // ==================== 数据范围配置 ====================

  /**
   * 获取用户数据范围配置
   * @param userId 用户 ID
   */
  async getUserDataScopes(userId: string): Promise<Record<string, DataScope>> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<{ data_scopes: Record<string, DataScope> }>>(
      `${BASE_URL}/admin/users/${userId}/data-scopes`
    )
    return response.data.data_scopes
  },

  /**
   * 更新用户数据范围配置
   * @param userId 用户 ID
   * @param data 数据范围配置
   */
  async updateUserDataScopes(
    userId: string,
    data: UpdateUserDataScopesRequest
  ): Promise<Record<string, DataScope>> {
    const client = createApiClient()
    const response = await client.put<ApiEnvelope<{ data_scopes: Record<string, DataScope> }>>(
      `${BASE_URL}/admin/users/${userId}/data-scopes`,
      data
    )
    return response.data.data_scopes
  },

  // ==================== 字段权限配置 ====================

  /**
   * 获取用户字段权限配置
   * @param userId 用户 ID
   */
  async getUserFieldRestrictions(
    userId: string
  ): Promise<Record<string, Record<string, FieldRestriction>>> {
    const client = createApiClient()
    const response = await client.get<
      ApiEnvelope<{ field_restrictions: Record<string, Record<string, FieldRestriction>> }>
    >(`${BASE_URL}/admin/users/${userId}/field-restrictions`)
    return response.data.field_restrictions
  },

  /**
   * 更新用户字段权限配置
   * @param userId 用户 ID
   * @param data 字段权限配置
   */
  async updateUserFieldRestrictions(
    userId: string,
    data: UpdateUserFieldRestrictionsRequest
  ): Promise<Record<string, Record<string, FieldRestriction>>> {
    const client = createApiClient()
    const response = await client.put<
      ApiEnvelope<{ field_restrictions: Record<string, Record<string, FieldRestriction>> }>
    >(`${BASE_URL}/admin/users/${userId}/field-restrictions`, data)
    return response.data.field_restrictions
  },

  // ==================== 资源列表 ====================

  /**
   * 获取资源列表（包含权限和字段定义）
   */
  async getResources(): Promise<ResourceDefinition[]> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<ResourceListResponse>>(
      `${BASE_URL}/admin/resources`
    )
    return response.data.resources
  },

  // ==================== 部门树 ====================

  /**
   * 获取部门树
   */
  async getDepartmentTree(): Promise<DepartmentTreeNode[]> {
    const client = createApiClient()
    const response = await client.get<ApiEnvelope<{ tree: DepartmentTreeNode[] }>>(
      `${BASE_URL}/departments/tree`
    )
    return response.data.tree
  },
}

export default fineGrainedApi
