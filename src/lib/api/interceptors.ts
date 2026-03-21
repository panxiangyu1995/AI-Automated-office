import type { ApiError, ApiResult, HttpResponse, RequestConfig } from './types'

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const mapStatusToCode = (status?: number) => {
  if (!status) return 'ERR_NETWORK'
  if (status === 401) return 'ERR_UNAUTHORIZED'
  if (status === 403) return 'ERR_FORBIDDEN'
  if (status === 404) return 'ERR_NOT_FOUND'
  if (status === 422) return 'ERR_VALIDATION'
  if (status >= 500) return 'ERR_SERVER'
  return 'ERR_UNKNOWN'
}

/**
 * 401 响应处理函数类型
 */
export type UnauthorizedHandler = (data: {
  code?: string
  message: string
  reason?: string
}) => void

/** 401 处理回调（由应用层设置） */
let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * 设置 401 响应处理函数
 */
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler
}

/**
 * 处理 401 响应
 */
const handleUnauthorizedResponse = (
  body: Record<string, unknown> | null,
  defaultMessage: string
) => {
  if (!unauthorizedHandler) return

  unauthorizedHandler({
    code: body?.code as string | undefined,
    message: (body?.message as string) || defaultMessage,
    reason: body?.reason as string | undefined,
  })
}

/**
 * 403 响应处理函数类型
 */
export type ForbiddenHandler = (data: {
  resource: string
  requiredPermission: string
  message: string
  applyEntry?: string
  traceId?: string
}) => void

/** 403 处理回调（由应用层设置） */
let forbiddenHandler: ForbiddenHandler | null = null

/**
 * 设置 403 响应处理函数
 */
export const setForbiddenHandler = (handler: ForbiddenHandler | null) => {
  forbiddenHandler = handler
}

/**
 * 处理 403 响应
 */
const handleForbiddenResponse = (
  body: Record<string, unknown> | null,
  defaultMessage: string
) => {
  if (!forbiddenHandler) return

  forbiddenHandler({
    resource: (body?.resource as string) || 'unknown',
    requiredPermission: (body?.required_permission as string) || 'unknown',
    message: (body?.message as string) || defaultMessage,
    applyEntry: body?.apply_entry as string | undefined,
    traceId: body?.trace_id as string | undefined,
  })
}

export const applyRequestInterceptors = (
  config: RequestConfig,
  token: string | null
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': createRequestId(),
    ...config.headers,
  }

  if (!config.skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (config.idempotencyKey) {
    headers['Idempotency-Key'] = config.idempotencyKey
  }

  return {
    ...config,
    headers,
  }
}

export const parseResponseBody = <T>(response: HttpResponse): ApiResult<T> => {
  const bodyText = response.body ?? ''
  
  // 处理空响应体
  if (!bodyText) {
    if (response.ok) {
      return { success: true, data: undefined as T }
    }
    
    // 401 无响应体时的处理
    if (response.status === 401) {
      handleUnauthorizedResponse(null, '登录已过期，请重新登录')
    }
    
    // 403 无响应体时的处理
    if (response.status === 403) {
      handleForbiddenResponse(null, '您没有权限执行此操作')
    }
    
    return {
      success: false,
      code: mapStatusToCode(response.status),
      message: '请求失败',
      status: response.status,
    }
  }

  const parsed = (() => {
    try {
      return JSON.parse(bodyText)
    } catch {
      return bodyText
    }
  })()

  // 处理 401 响应
  if (response.status === 401 && typeof parsed === 'object' && parsed) {
    const body = parsed as Record<string, unknown>
    handleUnauthorizedResponse(body, '登录已过期，请重新登录')
  }

  // 处理 403 响应
  if (response.status === 403 && typeof parsed === 'object' && parsed) {
    const body = parsed as Record<string, unknown>
    handleForbiddenResponse(body, '您没有权限执行此操作')
  }

  if (typeof parsed === 'object' && parsed && 'success' in parsed) {
    const result = parsed as ApiResult<T>
    if (result.success) {
      return result
    }
    return {
      success: false,
      code: result.code || mapStatusToCode(response.status),
      message: result.message || '请求失败',
      details: result.details,
      status: response.status,
    }
  }

  if (response.ok) {
    return { success: true, data: parsed as T }
  }

  return {
    success: false,
    code: mapStatusToCode(response.status),
    message: typeof parsed === 'string' ? parsed : '请求失败',
    status: response.status,
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (typeof error === 'object' && error && 'success' in error) {
    const parsed = error as ApiError
    return {
      success: false,
      code: parsed.code || 'ERR_UNKNOWN',
      message: parsed.message || '请求失败',
      details: parsed.details,
      status: parsed.status,
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      code: 'ERR_NETWORK',
      message: error.message || '请求失败',
    }
  }

  return {
    success: false,
    code: 'ERR_UNKNOWN',
    message: '请求失败',
  }
}
