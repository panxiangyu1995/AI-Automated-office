/**
 * EventBus 集成测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventBusImpl } from '@/hooks/eventBus'

describe('EventBus Integration Tests', () => {
  let eventBus: EventBusImpl

  beforeEach(() => {
    EventBusImpl.resetInstance()
    eventBus = EventBusImpl.getInstance()
  })

  afterEach(() => {
    eventBus.clear()
    EventBusImpl.resetInstance()
  })

  describe('Basic Pub/Sub', () => {
    it('should publish and subscribe to events', () => {
      const receivedPayloads: string[] = []

      const unsubscribe = eventBus.subscribe<string>('test:event', (payload) => {
        receivedPayloads.push(payload)
      })

      eventBus.publish('test:event', 'hello')
      eventBus.publish('test:event', 'world')

      expect(receivedPayloads).toEqual(['hello', 'world'])

      unsubscribe()
      eventBus.publish('test:event', 'should not receive')
      expect(receivedPayloads).toHaveLength(2)
    })

    it('should return unsubscribe function', () => {
      let callCount = 0
      const unsubscribe = eventBus.subscribe('test', () => {
        callCount++
      })

      eventBus.publish('test', null)
      expect(callCount).toBe(1)

      const result = unsubscribe()
      eventBus.publish('test', null)
      expect(callCount).toBe(1)
      expect(result).toBeUndefined()
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventBusImpl.getInstance()
      const instance2 = EventBusImpl.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should reset instance', () => {
      const instance1 = EventBusImpl.getInstance()
      EventBusImpl.resetInstance()
      const instance2 = EventBusImpl.getInstance()
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Wildcard Pattern', () => {
    it('should support single-level wildcard *', () => {
      const received: string[] = []

      eventBus.subscribe('chat:*', (payload: string) => {
        received.push(payload)
      })

      eventBus.publish('chat:message', 'msg1')
      eventBus.publish('chat:session', 'session1')

      expect(received).toHaveLength(2)
    })

    it('should support multi-level wildcard **', () => {
      const received: string[] = []

      eventBus.subscribe('plugin:**', (payload: string) => {
        received.push(payload)
      })

      eventBus.publish('plugin:registered', 'p1')
      eventBus.publish('plugin:unregistered', 'p2')

      expect(received).toHaveLength(2)
    })
  })

  describe('Multiple Subscribers', () => {
    it('should notify all subscribers', () => {
      const results: number[] = []

      eventBus.subscribe('test', () => results.push(1))
      eventBus.subscribe('test', () => results.push(2))
      eventBus.subscribe('test', () => results.push(3))

      eventBus.publish('test', null)

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle errors in one subscriber gracefully', () => {
      let success = false

      eventBus.subscribe('test', () => {
        throw new Error('Test error')
      })
      eventBus.subscribe('test', () => {
        success = true
      })

      eventBus.publish('test', null)

      expect(success).toBe(true)
    })
  })

  describe('Clear', () => {
    it('should clear specific event subscriptions', () => {
      let count = 0
      eventBus.subscribe('test', () => count++)
      eventBus.subscribe('test2', () => count++)

      eventBus.publish('test', null)
      eventBus.publish('test2', null)
      expect(count).toBe(2)

      eventBus.clear('test')

      eventBus.publish('test', null)
      eventBus.publish('test2', null)
      expect(count).toBe(3)
    })

    it('should clear all subscriptions', () => {
      let count = 0
      eventBus.subscribe('test1', () => count++)
      eventBus.subscribe('test2', () => count++)

      eventBus.publish('test1', null)
      eventBus.publish('test2', null)
      expect(count).toBe(2)

      eventBus.clear()

      eventBus.publish('test1', null)
      eventBus.publish('test2', null)
      expect(count).toBe(2)
    })
  })

  describe('Subscription Count', () => {
    it('should return correct subscription count', () => {
      expect(eventBus.getSubscriptionCount()).toBe(0)

      eventBus.subscribe('test', () => {})
      expect(eventBus.getSubscriptionCount('test')).toBe(1)
      expect(eventBus.getSubscriptionCount()).toBe(1)

      eventBus.subscribe('test', () => {})
      expect(eventBus.getSubscriptionCount('test')).toBe(2)
      expect(eventBus.getSubscriptionCount()).toBe(2)
    })

    it('should return correct subscribed events', () => {
      eventBus.subscribe('event1', () => {})
      eventBus.subscribe('event2', () => {})

      const events = eventBus.getSubscribedEvents()
      expect(events).toContain('event1')
      expect(events).toContain('event2')
    })
  })
})
