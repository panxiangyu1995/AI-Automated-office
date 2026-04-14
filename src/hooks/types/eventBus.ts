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
export namespace ChatEvents {
  export const MESSAGE_ADD = 'chat:message:add'
  export const MESSAGE_UPDATE = 'chat:message:update'
  export const MESSAGE_DELETE = 'chat:message:delete'
  export const SESSION_CREATE = 'chat:session:create'
  export const SESSION_DELETE = 'chat:session:delete'
  export const SESSION_SWITCH = 'chat:session:switch'
  export const STREAMING_START = 'chat:streaming:start'
  export const STREAMING_UPDATE = 'chat:streaming:update'
  export const STREAMING_END = 'chat:streaming:end'

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
}

/**
 * Agent 相关事件
 */
export namespace AgentEvents {
  export const RUNTIME_START = 'agent:runtime:start'
  export const RUNTIME_END = 'agent:runtime:end'
  export const TOOL_CALL = 'agent:tool:call'
  export const TOOL_RESULT = 'agent:tool:result'
  export const ERROR = 'agent:error'
  export const WARNING = 'agent:warning'

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
}

/**
 * 插件相关事件
 */
export namespace PluginEvents {
  export const LOAD = 'plugin:load'
  export const UNLOAD = 'plugin:unload'
  export const ENABLE = 'plugin:enable'
  export const DISABLE = 'plugin:disable'
  export const ERROR = 'plugin:error'
  export const SIDEBAR_UPDATE = 'plugin:sidebar:update'

  export interface PluginLoadPayload {
    pluginId: string
    version: string
  }

  export interface PluginErrorPayload {
    pluginId: string
    error: string
  }
}

/**
 * 系统相关事件
 */
export namespace SystemEvents {
  export const ONLINE = 'system:online'
  export const OFFLINE = 'system:offline'
  export const CONFIG_UPDATE = 'system:config:update'
}
