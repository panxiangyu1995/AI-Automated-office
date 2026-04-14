/**
 * EventBus - 统一事件发布/订阅系统
 *
 * 特性：
 * - 单例模式：全局只有一个实例
 * - 类型安全：泛型支持
 * - 自动清理：返回取消订阅函数
 * - 通配符支持：支持 * 和 ** 模式匹配
 */

import type { EventHandler, IEventBus } from './types/eventBus'

/**
 * 内部订阅者结构
 */
interface InternalSubscription {
  handler: EventHandler
  event: string
  subscribedAt: number
}

/**
 * EventBus 单例实现
 */
export class EventBusImpl implements IEventBus {
  private static _instance: EventBusImpl | null = null
  private subscriptions: Map<string, Set<InternalSubscription>> = new Map()
  private subscriptionCount = 0

  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取单例实例
   */
  static getInstance(): EventBusImpl {
    if (!EventBusImpl._instance) {
      EventBusImpl._instance = new EventBusImpl()
    }
    return EventBusImpl._instance
  }

  /**
   * 重置实例（主要用于测试）
   */
  static resetInstance(): void {
    if (EventBusImpl._instance) {
      EventBusImpl._instance.clear()
      EventBusImpl._instance = null
    }
  }

  /**
   * 订阅事件
   */
  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (typeof handler !== 'function') {
      console.warn('[EventBus] Handler must be a function')
      return () => {}
    }

    const subscription: InternalSubscription = {
      handler: handler as EventHandler,
      event,
      subscribedAt: Date.now(),
    }

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set())
    }

    this.subscriptions.get(event)!.add(subscription)
    this.subscriptionCount++

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(event, subscription.handler)
    }
  }

  /**
   * 订阅一次性事件
   */
  once<T>(event: string, handler: EventHandler<T>): () => void {
    let cancelled = false
    const wrappedHandler = (payload: unknown) => {
      if (cancelled) return
      cancelled = true
      this.unsubscribe(event, wrappedHandler)
      handler(payload as T)
    }
    return this.subscribe(event, wrappedHandler)
  }

  /**
   * 发布事件
   */
  publish<T>(event: string, payload: T): void {
    // 直接匹配
    const directSubs = this.subscriptions.get(event)
    if (directSubs) {
      for (const sub of directSubs) {
        try {
          sub.handler(payload)
        } catch (error) {
          console.error(`[EventBus] Error in handler for "${event}":`, error)
        }
      }
    }

    // 通配符匹配
    this.publishWithWildcard(event, payload)
  }

  /**
   * 通配符匹配发布
   * 支持:
   * - * 匹配单级（如 chat:* 匹配 chat:message, chat:session）
   * - ** 匹配多级（如 chat:** 匹配 chat:message:add）
   */
  private publishWithWildcard<T>(event: string, payload: T): void {
    const parts = event.split(':')

    for (const [pattern, subs] of this.subscriptions) {
      if (pattern === event) continue // 跳过直接匹配

      const patternParts = pattern.split(':')

      // 简单通配符匹配
      let matches = false

      if (pattern.endsWith(':**')) {
        // ** 匹配剩余所有
        const prefix = pattern.slice(0, -2)
        if (event.startsWith(prefix.slice(0, -1))) {
          matches = true
        }
      } else if (pattern.includes('*')) {
        // * 匹配单级
        if (parts.length === patternParts.length) {
          matches = parts.every((part, i) =>
            patternParts[i] === '*' || patternParts[i] === part
          )
        }
      }

      if (matches) {
        for (const sub of subs) {
          try {
            sub.handler(payload)
          } catch (error) {
            console.error(`[EventBus] Error in wildcard handler for "${pattern}":`, error)
          }
        }
      }
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 移除该事件所有订阅
      const subs = this.subscriptions.get(event)
      if (subs) {
        this.subscriptionCount -= subs.size
        subs.clear()
        this.subscriptions.delete(event)
      }
      return
    }

    const subs = this.subscriptions.get(event)
    if (subs) {
      for (const sub of subs) {
        if (sub.handler === handler) {
          subs.delete(sub)
          this.subscriptionCount--
          break
        }
      }
      if (subs.size === 0) {
        this.subscriptions.delete(event)
      }
    }
  }

  /**
   * 清除所有订阅
   */
  clear(event?: string): void {
    if (event) {
      this.unsubscribe(event)
    } else {
      this.subscriptions.clear()
      this.subscriptionCount = 0
    }
  }

  /**
   * 获取订阅数量
   */
  getSubscriptionCount(event?: string): number {
    if (event) {
      return this.subscriptions.get(event)?.size ?? 0
    }
    return this.subscriptionCount
  }

  /**
   * 获取所有已订阅的事件
   */
  getSubscribedEvents(): string[] {
    return Array.from(this.subscriptions.keys())
  }
}

// ==================== 单例导出 ====================

/**
 * 获取 EventBus 单例
 */
export const eventBus = EventBusImpl.getInstance()
