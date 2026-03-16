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
  if (!bodyText) {
    if (response.ok) {
      return { success: true, data: undefined as T }
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
