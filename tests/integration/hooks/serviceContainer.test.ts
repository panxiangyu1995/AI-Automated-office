/**
 * ServiceContainer 集成测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { serviceContainer, ServiceContainerImpl } from '@/hooks/serviceContainer'

describe('ServiceContainer Integration Tests', () => {
  let container: ServiceContainerImpl

  beforeEach(() => {
    ServiceContainerImpl.resetInstance()
    container = ServiceContainerImpl.getInstance()
  })

  afterEach(() => {
    ServiceContainerImpl.resetInstance()
  })

  describe('Registration', () => {
    it('should register a service with factory', () => {
      const factory = () => ({ name: 'test' })
      container.register('test:service', factory)
      expect(container.has('test:service')).toBe(true)
    })

    it('should register singleton service', () => {
      const factory = () => ({ id: Math.random() })
      container.registerSingleton('test:singleton', factory)

      const instance1 = container.resolve<{ id: number }>('test:singleton')
      const instance2 = container.resolve<{ id: number }>('test:singleton')

      expect(instance1).toBe(instance2)
    })

    it('should register instance directly', () => {
      const instance = { value: 42 }
      container.registerInstance('test:instance', instance)

      const resolved = container.resolve<{ value: number }>('test:instance')
      expect(resolved).toBe(instance)
    })
  })

  describe('Resolution', () => {
    it('should resolve registered service', () => {
      container.register('test:service', () => ({ message: 'hello' }))
      const service = container.resolve<{ message: string }>('test:service')
      expect(service.message).toBe('hello')
    })

    it('should throw error for unresolved service', () => {
      expect(() => container.resolve('non:existent')).toThrow()
    })

    it('should tryResolve without throwing', () => {
      const result = container.tryResolve<{ value: string }>('non:existent')
      expect(result).toBeUndefined()

      container.registerInstance('test:exists', { value: 'found' })
      const found = container.tryResolve<{ value: string }>('test:exists')
      expect(found?.value).toBe('found')
    })
  })

  describe('Singleton Behavior', () => {
    it('should return same instance for singletons', () => {
      let instantiationCount = 0
      const factory = () => {
        instantiationCount++
        return { count: instantiationCount }
      }

      container.registerSingleton('test', factory)

      const instance1 = container.resolve<{ count: number }>('test')
      const instance2 = container.resolve<{ count: number }>('test')
      const instance3 = container.resolve<{ count: number }>('test')

      expect(instantiationCount).toBe(1)
      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })

    it('should return new instance for non-singleton', () => {
      let instantiationCount = 0
      const factory = () => {
        instantiationCount++
        return { count: instantiationCount }
      }

      container.register('test', factory, { singleton: false })

      const instance1 = container.resolve<{ count: number }>('test')
      const instance2 = container.resolve<{ count: number }>('test')

      expect(instantiationCount).toBe(2)
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Dependency Injection', () => {
    it('should inject container into factory', () => {
      container.registerInstance('dep1', { name: 'dep1' })
      container.registerInstance('dep2', { name: 'dep2' })

      let injectedContainer: ServiceContainer | null = null
      container.register('test:di', (c) => {
        injectedContainer = c
        return { deps: [c.resolve('dep1'), c.resolve('dep2')] }
      })

      const result = container.resolve<{ deps: any[] }>('test:di')
      expect(injectedContainer).toBe(container)
      expect(result.deps).toHaveLength(2)
    })
  })

  describe('Metadata', () => {
    it('should store metadata with registration', () => {
      container.register('test:meta', () => ({}), {
        metadata: { version: '1.0.0', author: 'test' },
      })

      const services = container.getRegisteredServices()
      expect(services).toContain('test:meta')
    })
  })
})
