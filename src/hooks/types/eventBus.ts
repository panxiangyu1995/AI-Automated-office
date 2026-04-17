/**
 * EventBus类型定义
 * 统一事件发布/订阅系统的类型声明
 */

// ==================== Chat Events ====================

/**
 * 聊天事件名称
 */
export const ChatEvents = {
  MESSAGE_ADD: 'chat:message:add',
  MESSAGE_UPDATE: 'chat:message:update',
  MESSAGE_DELETE: 'chat:message:delete',
  SESSION_CREATE: 'chat:session:create',
  SESSION_UPDATE: 'chat:session:update',
  SESSION_DELETE: 'chat:session:delete',
  STREAMING_START: 'chat:streaming:start',
  STREAMING_END: 'chat:streaming:end',
} as const;

/**
 * 消息添加事件载荷
 */
export interface MessageAddPayload {
  sessionId: string;
  messageId: string;
  role: string;
  content: string;
}

/**
 * 事件处理器类型
 */
export interface EventHandler<T = unknown> {
  (payload: T): void;
}

/**
 * EventBus接口
 */
export interface IEventBus {
  /**
   * 订阅事件
   * @param event 事件名称，支持通配符 * 和 **
   * @param handler 事件处理器
   * @returns 取消订阅函数
   */
  subscribe<T>(event: string, handler: EventHandler<T>): () => void;

  /**
   * 订阅一次性事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns 取消订阅函数
   */
  once<T>(event: string, handler: EventHandler<T>): () => void;

  /**
   * 发布事件
   * @param event 事件名称
   * @param payload 事件数据
   */
  publish<T>(event: string, payload: T): void;

  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 可选，指定处理器，如不指定则取消该事件所有订阅
   */
  unsubscribe(event: string, handler?: EventHandler): void;

  /**
   * 清除订阅
   * @param event 可选，如指定则只清除该事件的订阅
   */
  clear(event?: string): void;

  /**
   * 获取订阅数量
   * @param event 可选，如指定则返回该事件的订阅数
   */
  getSubscriptionCount(event?: string): number;

  /**
   * 获取所有已订阅的事件
   */
  getSubscribedEvents(): string[];
}

/**
 * 内部订阅者结构
 */
interface InternalSubscription {
  handler: EventHandler;
  event: string;
  subscribedAt: number;
}

// 导出以供外部使用（如需要）
export type { InternalSubscription };
