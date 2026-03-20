/**
 * 组织管理 API 封装
 *
 * @module organizationApi
 * @description 封装部门和岗位管理相关的 API 调用
 */

import { useAuthStore } from '@/stores/authStore'
import type {
  ApiEnvelope,
  DepartmentTreeNode,
  DepartmentDetail,
  ListDepartmentsRequest,
  ListDepartmentsResponse,
  ListPositionsRequest,
  ListPositionsResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  PositionDetail,
} from '../types/organization.types'

const REQUEST_TIMEOUT_MS = 15000
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  try {
    const base = new URL(API_BASE_URL)
    const basePath = base.pathname.replace(/\/+$/, '')

    const dedupedPath =
      basePath && basePath !== '/' && normalizedPath.startsWith(`${basePath}/`)
        ? normalizedPath.slice(basePath.length)
        : normalizedPath

    return `${base.origin}${basePath}${dedupedPath}`
  } catch {
    return `${API_BASE_URL}${normalizedPath}`
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    throw new Error('AUTH_UNAUTHORIZED')
  }

  const response = await fetch(buildApiUrl('/api/v1/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  const result = (await response.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || 'Token refresh failed')
  }

  useAuthStore.getState().updateToken(result.data.accessToken, result.data.refreshToken)
  return result.data.accessToken
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  skipAuth?: boolean
}

async function requestApi<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    let accessToken = useAuthStore.getState().accessToken
    if (!skipAuth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    let response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth) {
      try {
        accessToken = await refreshAccessToken()
        headers.Authorization = `Bearer ${accessToken}`
        response = await fetch(buildApiUrl(path), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })
      } catch {
        await useAuthStore.getState().clearAuthSession()
        throw new Error('登录状态已过期，请重新登录')
      }
    }

    const result = (await response.json()) as ApiEnvelope<T>

    if (!response.ok || !result.success) {
      throw new Error(result.message || result.code || '请求失败')
    }

    return result.data as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('API_TIMEOUT')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

// ============== 部门 API ==============

export const departmentApi = {
  /**
   * 获取部门树
   */
  async getTree(): Promise<DepartmentTreeNode[]> {
    const response = await requestApi<{ items: DepartmentTreeNode[] }>('/api/admin/departments/tree')
    return response.items
  },

  /**
   * 获取部门详情
   */
  async getDetail(departmentId: string): Promise<DepartmentDetail> {
    return requestApi<DepartmentDetail>(`/api/admin/departments/${departmentId}`)
  },

  /**
   * 获取部门列表（分页）
   */
  async list(params: ListDepartmentsRequest = {}): Promise<ListDepartmentsResponse> {
    const queryString = buildQueryString({
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      name: params.name,
      code: params.code,
      status: params.status,
      parent_id: params.parent_id,
    })

    return requestApi<ListDepartmentsResponse>(`/api/admin/departments${queryString}`)
  },

  /**
   * 创建部门
   */
  async create(request: CreateDepartmentRequest): Promise<{ id: string }> {
    return requestApi<{ id: string }>('/api/admin/departments', {
      method: 'POST',
      body: request,
    })
  },

  /**
   * 更新部门
   */
  async update(departmentId: string, request: UpdateDepartmentRequest): Promise<{ id: string }> {
    return requestApi<{ id: string }>(`/api/admin/departments/${departmentId}`, {
      method: 'PUT',
      body: request,
    })
  },

  /**
   * 删除部门
   */
  async delete(departmentId: string): Promise<void> {
    await requestApi<void>(`/api/admin/departments/${departmentId}`, {
      method: 'DELETE',
    })
  },

  /**
   * 检查部门编码是否存在
   */
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    const queryString = buildQueryString({ code, exclude_id: excludeId })
    const response = await requestApi<{ exists: boolean }>(`/api/admin/departments/check-code${queryString}`)
    return response.exists
  },
}

// ============== 岗位 API ==============

export const positionApi = {
  /**
   * 获取岗位列表
   */
  async list(params: ListPositionsRequest = {}): Promise<ListPositionsResponse> {
    const queryString = buildQueryString({
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      name: params.name,
      code: params.code,
      department_id: params.department_id,
      status: params.status,
    })

    return requestApi<ListPositionsResponse>(`/api/admin/positions${queryString}`)
  },

  /**
   * 获取岗位详情
   */
  async getDetail(positionId: string): Promise<PositionDetail> {
    return requestApi<PositionDetail>(`/api/admin/positions/${positionId}`)
  },

  /**
   * 创建岗位
   */
  async create(request: CreatePositionRequest): Promise<{ id: string }> {
    return requestApi<{ id: string }>('/api/admin/positions', {
      method: 'POST',
      body: request,
    })
  },

  /**
   * 更新岗位
   */
  async update(positionId: string, request: UpdatePositionRequest): Promise<{ id: string }> {
    return requestApi<{ id: string }>(`/api/admin/positions/${positionId}`, {
      method: 'PUT',
      body: request,
    })
  },

  /**
   * 删除岗位
   */
  async delete(positionId: string): Promise<void> {
    await requestApi<void>(`/api/admin/positions/${positionId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * 解析错误信息
 */
export function resolveErrorMessage(err: unknown, operation: string): string {
  if (err instanceof Error && err.message === 'API_TIMEOUT') {
    return '请求超时，请稍后重试'
  }

  if (err instanceof Error) {
    // 处理特定错误码
    if (err.message.includes('DEPARTMENT_HAS_CHILDREN')) {
      return '该部门下存在子部门，请先删除子部门'
    }
    if (err.message.includes('DEPARTMENT_HAS_USERS')) {
      return '该部门下存在员工，请先处理员工归属'
    }
    if (err.message.includes('POSITION_HAS_USERS')) {
      return '该岗位下存在员工，无法删除'
    }
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  return `${operation}失败，请稍后重试`
}
