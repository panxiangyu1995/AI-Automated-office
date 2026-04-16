/**
 * EventBus 类型定义
 * 统一的事件发布/订阅系统类型
 */

/**
 * 事件处理器类型
 */
export type EventHandler<T = unknown> = (payload: T) => void

/**
 * 事件总线接口
 */
export interface IEventBus {
  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns 取消订阅函数
   */
  subscribe<T>(event: string, handler: EventHandler<T>): () => void

  /**
   * 订阅一次性事件（自动取消订阅）
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns 取消订阅函数
   */
  once<T>(event: string, handler: EventHandler<T>): () => void

  /**
   * 发布事件
   * @param event 事件名称
   * @param payload 事件数据
   */
  publish<T>(event: string, payload: T): void

  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 要移除的处理器（可选，不传则移除该事件所有处理器）
   */
  unsubscribe(event: string, handler?: EventHandler): void

  /**
   * 清除所有订阅或指定事件的订阅
   * @param event 可选的事件名称
   */
  clear(event?: string): void

  /**
   * 获取订阅数量
   * @param event 可选的事件名称
   */
  getSubscriptionCount(event?: string): number

  /**
   * 获取所有已订阅的事件名称
   */
  getSubscribedEvents(): string[]
}

// ==================== 预定义事件类型 ====================

/**
 * Chat 相关事件
 */
export const ChatEvents = {
  MESSAGE_ADD: 'chat:message:add',
  MESSAGE_UPDATE: 'chat:message:update',
  MESSAGE_DELETE: 'chat:message:delete',
  SESSION_CREATE: 'chat:session:create',
  SESSION_DELETE: 'chat:session:delete',
  SESSION_SWITCH: 'chat:session:switch',
  STREAMING_START: 'chat:streaming:start',
  STREAMING_UPDATE: 'chat:streaming:update',
  STREAMING_END: 'chat:streaming:end',
} as const

export interface MessageAddPayload {
  sessionId: string
  messageId: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface SessionCreatePayload {
  sessionId: string
  title?: string
}

export interface StreamingPayload {
  sessionId: string
  messageId: string
  content: string
}

/**
 * Agent 相关事件
 */
export const AgentEvents = {
  RUNTIME_START: 'agent:runtime:start',
  RUNTIME_END: 'agent:runtime:end',
  TOOL_CALL: 'agent:tool:call',
  TOOL_RESULT: 'agent:tool:result',
  ERROR: 'agent:error',
  WARNING: 'agent:warning',
} as const

export interface RuntimeStartPayload {
  sessionId: string
  traceId: string
}

export interface RuntimeEndPayload {
  sessionId: string
  traceId: string
  duration: number
  reason: 'completed' | 'interrupted' | 'failed'
}

export interface ToolCallPayload {
  sessionId: string
  toolId: string
  toolName: string
  params: Record<string, unknown>
}

/**
 * 插件相关事件
 */
export const PluginEvents = {
  LOAD: 'plugin:load',
  UNLOAD: 'plugin:unload',
  ENABLE: 'plugin:enable',
  DISABLE: 'plugin:disable',
  ERROR: 'plugin:error',
  SIDEBAR_UPDATE: 'plugin:sidebar:update',
} as const

export interface PluginLoadPayload {
  pluginId: string
  version: string
}

export interface PluginErrorPayload {
  pluginId: string
  error: string
}

/**
 * 系统相关事件
 */
export const SystemEvents = {
  ONLINE: 'system:online',
  OFFLINE: 'system:offline',
  CONFIG_UPDATE: 'system:config:update',
} as const
