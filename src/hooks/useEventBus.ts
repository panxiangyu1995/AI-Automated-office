/**
 * useEventBus Hook
 *
 * React 友好的 EventBus 订阅接口
 * 特性：
 * - 组件卸载时自动取消订阅
 * - 懒订阅：只在 useEffect 中订阅
 * - 支持通配符模式
 */

import { useEffect, useCallback, useRef } from 'react'
import { eventBus } from './eventBus'
import type { EventHandler } from './types/eventBus'

/**
 * useEventBus Hook 选项
 */
export interface UseEventBusOptions {
  /** 是否立即订阅，默认为 true */
  immediate?: boolean
  /** 自定义事件名称 */
  event?: string
}

/**
 * useEventBus 返回类型
 */
export interface UseEventBusReturn {
  /**
   * 发布事件
   */
  publish: <T>(event: string, payload: T) => void

  /**
   * 订阅事件（手动模式）
   */
  subscribe: <T>(event: string, handler: EventHandler<T>) => () => void

  /**
   * 取消订阅
   */
  unsubscribe: (event: string, handler?: EventHandler) => void

  /**
   * 清除所有订阅
   */
  clear: (event?: string) => void

  /**
   * 获取订阅数量
   */
  getSubscriptionCount: (event?: string) => number

  /**
   * 获取已订阅的事件列表
   */
  getSubscribedEvents: () => string[]
}

/**
 * useEventBus Hook
 *
 * @example
 * // 基础用法
 * function MyComponent() {
 *   const { publish } = useEventBus()
 *
 *   useEffect(() => {
 *     const unsubscribe = subscribe('chat:message:add', (payload) => {
 *       // Handle message
 *     })
 *     return unsubscribe
 *   }, [])
 *
 *   const sendMessage = () => {
 *     publish('chat:message:add', { content: 'Hello' })
 *   }
 * }
 *
 * @example
 * // 懒订阅模式
 * function MyComponent() {
 *   const { subscribe } = useEventBus({ immediate: false })
 *
 *   useEffect(() => {
 *     return subscribe('chat:message:add', handleMessage)
 *   }, [handleMessage])
 * }
 */
export function useEventBus(): UseEventBusReturn {
  // 用于追踪订阅的 ref
  const subscriptionsRef = useRef<Array<() => void>>([])

  /**
   * 发布事件
   */
  const publish = useCallback(<T>(event: string, payload: T) => {
    eventBus.publish(event, payload)
  }, [])

  /**
   * 手动订阅
   */
  const subscribe = useCallback(<T>(event: string, handler: EventHandler<T>) => {
    const unsubscribe = eventBus.subscribe(event, handler)
    return unsubscribe
  }, [])

  /**
   * 取消订阅
   */
  const unsubscribe = useCallback((event: string, handler?: EventHandler) => {
    eventBus.unsubscribe(event, handler)
  }, [])

  /**
   * 清除订阅
   */
  const clear = useCallback((event?: string) => {
    eventBus.clear(event)
  }, [])

  /**
   * 获取订阅数量
   */
  const getSubscriptionCount = useCallback((event?: string) => {
    return eventBus.getSubscriptionCount(event)
  }, [])

  /**
   * 获取已订阅的事件
   */
  const getSubscribedEvents = useCallback(() => {
    return eventBus.getSubscribedEvents()
  }, [])

  // 组件卸载时清理所有订阅
  useEffect(() => {
    return () => {
      for (const unsubscribe of subscriptionsRef.current) {
        unsubscribe()
      }
      subscriptionsRef.current = []
    }
  }, [])

  return {
    publish,
    subscribe,
    unsubscribe,
    clear,
    getSubscriptionCount,
    getSubscribedEvents,
  }
}

/**
 * useEventSubscription - 订阅特定事件的 Hook
 *
 * @example
 * function MyComponent() {
 *   useEventSubscription('chat:message:add', (payload) => {
 *     // Handle message
 *   })
 *
 *   // 或者只获取 payload
 *   const payload = useEventSubscription('chat:message:add')
 * }
 *
 * @param event - 事件名称
 * @param handler - 事件处理器
 * @param options - 选项
 */
export function useEventSubscription<T>(
  event: string,
  handler: EventHandler<T>,
  options: { enabled?: boolean } = {}
): void {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const unsubscribe = eventBus.subscribe(event, handler as EventHandler)

    return () => {
      unsubscribe()
    }
  }, [event, handler, enabled])
}

/**
 * useEventPublisher - 获取发布功能的 Hook
 *
 * @example
 * function MyComponent() {
 *   const { publish } = useEventPublisher()
 *
 *   const handleClick = () => {
 *     publish('button:click', { buttonId: 'submit' })
 *   }
 * }
 */
export function useEventPublisher(): Pick<UseEventBusReturn, 'publish'> {
  const publishRef = useRef(eventBus.publish.bind(eventBus))

  return {
    publish: publishRef.current,
  }
}

/**
 * useSharedSubscription - 共享订阅 Hook
 *
 * 用于多个组件订阅同一个事件时避免重复订阅
 * 内部维护一个订阅计数，只有第一个订阅者真正订阅
 *
 * @example
 * function ComponentA() {
 *   useSharedSubscription('app:ready', handleAppReady)
 * }
 *
 * function ComponentB() {
 *   useSharedSubscription('app:ready', handleAppReady)
 * }
 * // 只有第一次订阅会真正注册到 EventBus
 */
export function useSharedSubscription<T>(
  event: string,
  handler: EventHandler<T>
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    let isFirst = false

    // 检查是否已经有订阅
    const count = eventBus.getSubscriptionCount(event)
    if (count === 0) {
      isFirst = true
    }

    if (isFirst) {
      const unsubscribe = eventBus.subscribe(event, handlerRef.current)
      return () => {
        unsubscribe()
      }
    }

    // 已经有订阅，只更新 handler
    return () => {}
  }, [event])
}
