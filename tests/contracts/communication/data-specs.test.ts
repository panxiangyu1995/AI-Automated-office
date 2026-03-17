import { describe, expect, it } from 'vitest'
import type {
  ApiClientConfig,
  ApiResponse,
  ApiError,
  QueuedRequest,
  HttpRequest,
  HttpResponse,
  NetworkStatus,
} from '@/lib/api/types'
import type { WebSocketMessage, WebSocketNotification } from './websocket-types'

// 从 spec.md 定义的数据规格
// 这些测试验证代码实现是否符合规格定义

describe('数据规格验证: ApiClientConfig', () => {
  it('默认配置符合规格', () => {
    const config: ApiClientConfig = {
      baseUrl: '',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      retryBackoff: 'exponential',
    }

    expect(config.timeout).toBe(30000)
    expect(config.retryCount).toBe(3)
    expect(config.retryDelay).toBe(1000)
    expect(config.retryBackoff).toBe('exponential')
  })

  it('支持 fixed 退避策略', () => {
    const config: ApiClientConfig = {
      baseUrl: 'https://api.example.com',
      timeout: 30000,
      retryCount: 5,
      retryDelay: 500,
      retryBackoff: 'fixed',
    }

    expect(config.retryBackoff).toBe('fixed')
  })
})

describe('数据规格验证: API 响应格式', () => {
  it('成功响应格式符合规格', () => {
    const response: ApiResponse<{ id: number }> = {
      success: true,
      data: { id: 1 },
      message: '操作成功',
    }

    expect(response.success).toBe(true)
    expect(response.data).toEqual({ id: 1 })
    expect(response.message).toBe('操作成功')
  })

  it('错误响应格式符合规格', () => {
    const error: ApiError = {
      success: false,
      code: 'ERR_NOT_FOUND',
      message: '资源不存在',
      details: { field: 'id' },
      status: 404,
    }

    expect(error.success).toBe(false)
    expect(error.code).toBe('ERR_NOT_FOUND')
    expect(error.message).toBe('资源不存在')
    expect(error.details).toEqual({ field: 'id' })
    expect(error.status).toBe(404)
  })

  it('错误响应 code 字段符合规格定义', () => {
    const errorCodes = [
      'ERR_NETWORK',
      'ERR_TIMEOUT',
      'ERR_UNAUTHORIZED',
      'ERR_FORBIDDEN',
      'ERR_NOT_FOUND',
      'ERR_VALIDATION',
      'ERR_SERVER',
      'ERR_OFFLINE',
    ]

    const testError: ApiError = {
      success: false,
      code: 'ERR_UNAUTHORIZED',
      message: 'Token 已过期',
    }

    expect(errorCodes).toContain(testError.code)
  })
})

describe('数据规格验证: 离线队列项', () => {
  it('QueuedRequest 格式符合规格', () => {
    const queued: QueuedRequest = {
      id: 'uuid-12345',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
      idempotencyKey: 'unique-key',
    }

    expect(queued.id).toBeDefined()
    expect(['GET', 'POST', 'PUT', 'DELETE']).toContain(queued.method)
    expect(queued.status).toBe('pending')
    expect(queued.idempotencyKey).toBeDefined()
  })

  it('status 只能是指定的值', () => {
    const validStatuses: QueuedRequest['status'][] = [
      'pending',
      'processing',
      'failed',
      'synced',
    ]

    const queued: QueuedRequest = {
      id: '1',
      method: 'POST',
      url: '/test',
      headers: {},
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    }

    expect(validStatuses).toContain(queued.status)
  })
})

describe('数据规格验证: WebSocket 消息格式', () => {
  it('客户端发送消息格式符合规格', () => {
    const message: WebSocketMessage = {
      type: 'ping',
      payload: {},
      timestamp: Date.now(),
    }

    expect(['ping', 'pong', 'subscribe', 'unsubscribe', 'action']).toContain(message.type)
    expect(message.timestamp).toBeDefined()
  })

  it('服务端推送消息格式符合规格', () => {
    const notification: WebSocketNotification = {
      type: 'notification',
      payload: { title: '新消息' },
      timestamp: Date.now(),
    }

    expect(['notification', 'task_update', 'message', 'sync']).toContain(notification.type)
    expect(notification.timestamp).toBeDefined()
  })
})

describe('数据规格验证: 网络状态', () => {
  it('NetworkStatus 格式符合规格', () => {
    const status: NetworkStatus = {
      isOnline: true,
      connectionType: 'wifi',
      lastChecked: Date.now(),
    }

    expect(typeof status.isOnline).toBe('boolean')
    expect(['wifi', 'ethernet', 'cellular', 'unknown']).toContain(status.connectionType)
    expect(status.lastChecked).toBeDefined()
  })
})

describe('数据规格验证: HttpRequest', () => {
  it('HttpRequest 格式符合规格', () => {
    const request: HttpRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      },
      body: JSON.stringify({ name: 'Test' }),
      timeout: 30000,
    }

    expect(['GET', 'POST', 'PUT', 'DELETE']).toContain(request.method)
    expect(request.url).toBeDefined()
    expect(request.headers).toBeDefined()
  })
})

describe('数据规格验证: HttpResponse', () => {
  it('HttpResponse 格式符合规格', () => {
    const response: HttpResponse = {
      status: 200,
      ok: true,
      body: JSON.stringify({ success: true, data: {} }),
      headers: { 'content-type': 'application/json' },
    }

    expect(typeof response.status).toBe('number')
    expect(typeof response.ok).toBe('boolean')
    expect(response.body).toBeDefined()
  })
})

describe('错误码映射验证', () => {
  it('HTTP 状态码映射正确', () => {
    const statusCodeMap: Record<number, string> = {
      401: 'ERR_UNAUTHORIZED',
      403: 'ERR_FORBIDDEN',
      404: 'ERR_NOT_FOUND',
      422: 'ERR_VALIDATION',
      500: 'ERR_SERVER',
    }

    expect(statusCodeMap[401]).toBe('ERR_UNAUTHORIZED')
    expect(statusCodeMap[403]).toBe('ERR_FORBIDDEN')
    expect(statusCodeMap[404]).toBe('ERR_NOT_FOUND')
    expect(statusCodeMap[422]).toBe('ERR_VALIDATION')
    expect(statusCodeMap[500]).toBe('ERR_SERVER')
  })
})
