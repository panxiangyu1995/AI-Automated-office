/**
 * Tool Registry Tests
 * Task 68: Story 45.1 - Tool Descriptor and Registry
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ToolRegistry,
  createToolRegistry,
  getToolRegistry,
  type ToolDescriptor,
  type RegistryChangeEvent,
} from '@/features/session/tools'
import { defineTool, stringParam } from '@/features/session/tools'

describe('ToolRegistry', () => {
  let registry: ToolRegistry

  const createTestDescriptor = (id: string, overrides: Partial<ToolDescriptor> = {}): ToolDescriptor => {
    return defineTool(id, `Tool ${id}`)
      .withDescription(`Description for ${id}`)
      .withCategory(overrides.category ?? 'core')
      .withMetadata({
        version: '1.0.0',
        tags: overrides.metadata?.tags ?? [],
        category: 'test',
      })
      .withCapabilities(overrides.capabilities ?? {})
      .build()
  }

  beforeEach(() => {
    registry = createToolRegistry()
  })

  describe('Registration', () => {
    it('registers a tool', () => {
      const descriptor = createTestDescriptor('tool1')

      expect(registry.register(descriptor)).toBe(true)
      expect(registry.has('tool1')).toBe(true)
      expect(registry.size()).toBe(1)
    })

    it('prevents duplicate registration by default', () => {
      const descriptor = createTestDescriptor('tool1')

      registry.register(descriptor)
      expect(registry.register(descriptor)).toBe(false)
      expect(registry.size()).toBe(1)
    })

    it('allows overwrite when configured', () => {
      registry = createToolRegistry({ allowOverwrite: true })

      const d1 = createTestDescriptor('tool1')
      const d2 = createTestDescriptor('tool1')

      registry.register(d1)
      expect(registry.register(d2)).toBe(true)
      expect(registry.size()).toBe(1)
    })

    it('validates descriptor on registration', () => {
      registry = createToolRegistry({ validateOnRegister: true })

      const valid = createTestDescriptor('valid')
      expect(() => registry.register(valid)).not.toThrow()

      const invalid = { id: 123 } as unknown as ToolDescriptor
      expect(() => registry.register(invalid)).toThrow('Invalid tool descriptor')
    })

    it('respects max tools limit', () => {
      registry = createToolRegistry({ maxTools: 2 })

      registry.register(createTestDescriptor('tool1'))
      registry.register(createTestDescriptor('tool2'))

      expect(() => registry.register(createTestDescriptor('tool3'))).toThrow('Maximum tools limit')
    })

    it('registers multiple tools', () => {
      const result = registry.registerAll([
        createTestDescriptor('tool1'),
        createTestDescriptor('tool2'),
        createTestDescriptor('tool3'),
      ])

      expect(result.success).toBe(3)
      expect(result.failed).toHaveLength(0)
      expect(registry.size()).toBe(3)
    })

    it('unregisters a tool', () => {
      registry.register(createTestDescriptor('tool1'))

      expect(registry.unregister('tool1')).toBe(true)
      expect(registry.has('tool1')).toBe(false)
      expect(registry.size()).toBe(0)
    })

    it('returns false when unregistering non-existent tool', () => {
      expect(registry.unregister('nonexistent')).toBe(false)
    })
  })

  describe('Lookup', () => {
    beforeEach(() => {
      registry.registerAll([
        createTestDescriptor('core1', { category: 'core', metadata: { tags: ['basic', 'system'] } as any }),
        createTestDescriptor('core2', { category: 'core', metadata: { tags: ['advanced'] } as any }),
        createTestDescriptor('mcp1', { category: 'mcp', metadata: { tags: ['external'] } as any }),
        createTestDescriptor('plugin1', { category: 'plugin', metadata: { tags: ['basic'] } as any }),
      ])
    })

    it('gets tool by ID', () => {
      const tool = registry.get('core1')
      expect(tool?.id).toBe('core1')
    })

    it('returns undefined for non-existent tool', () => {
      expect(registry.get('nonexistent')).toBeUndefined()
    })

    it('checks if tool exists', () => {
      expect(registry.has('core1')).toBe(true)
      expect(registry.has('nonexistent')).toBe(false)
    })

    it('gets all tools', () => {
      const tools = registry.getAll()
      expect(tools).toHaveLength(4)
    })

    it('gets tools by category', () => {
      const core = registry.getByCategory('core')
      expect(core).toHaveLength(2)

      const mcp = registry.getByCategory('mcp')
      expect(mcp).toHaveLength(1)
    })

    it('gets tools by tag', () => {
      const basic = registry.getByTag('basic')
      expect(basic).toHaveLength(2)
    })

    it('gets tools by capability', () => {
      registry.register(createTestDescriptor('streaming', {
        capabilities: { supportsStreaming: true } as any,
      }))

      const streaming = registry.getByCapability('supportsStreaming', true)
      expect(streaming).toHaveLength(1)
      expect(streaming[0].id).toBe('streaming')
    })

    it('looks up tools with filter', () => {
      const result = registry.lookup({ category: 'core' })
      expect(result.filtered).toBe(2)
      expect(result.total).toBe(4)
    })

    it('filters by enabled status', () => {
      registry.get('core1')!.enabled = false

      const enabled = registry.lookup({ enabled: true })
      expect(enabled.filtered).toBe(3)
    })

    it('filters by tags', () => {
      const result = registry.lookup({ tags: ['basic'] })
      expect(result.filtered).toBe(2)
    })

    it('filters by capabilities', () => {
      registry.register(createTestDescriptor('readonly', {
        capabilities: { isReadOnly: true } as any,
      }))

      const result = registry.lookup({
        capabilities: { isReadOnly: true },
      })
      expect(result.filtered).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Validation', () => {
    it('validates parameters for a tool', () => {
      const descriptor = defineTool('validate_test', 'Validate Test')
        .withDescription('Test validation')
        .withParameter(stringParam('name', 'Name', true))
        .build()

      registry.register(descriptor)

      const valid = registry.validate('validate_test', { name: 'test' })
      expect(valid.valid).toBe(true)

      const invalid = registry.validate('validate_test', {})
      expect(invalid.valid).toBe(false)
    })

    it('returns error for non-existent tool', () => {
      const result = registry.validate('nonexistent', {})
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Tool not found: nonexistent')
    })
  })

  describe('State Management', () => {
    it('enables a tool', () => {
      const descriptor = createTestDescriptor('toggle')
      descriptor.enabled = false
      registry.register(descriptor)

      expect(registry.enable('toggle')).toBe(true)
      expect(registry.get('toggle')?.enabled).toBe(true)
    })

    it('disables a tool', () => {
      registry.register(createTestDescriptor('toggle'))

      expect(registry.disable('toggle')).toBe(true)
      expect(registry.get('toggle')?.enabled).toBe(false)
    })

    it('returns false for non-existent tool', () => {
      expect(registry.enable('nonexistent')).toBe(false)
      expect(registry.disable('nonexistent')).toBe(false)
    })
  })

  describe('Statistics', () => {
    beforeEach(() => {
      registry.registerAll([
        createTestDescriptor('core1', { category: 'core', metadata: { tags: ['a'] } as any }),
        createTestDescriptor('core2', { category: 'core', metadata: { tags: ['b'] } as any }),
        createTestDescriptor('mcp1', { category: 'mcp', metadata: { tags: ['a'] } as any }),
      ])
    })

    it('calculates statistics', () => {
      const stats = registry.getStatistics()

      expect(stats.totalTools).toBe(3)
      expect(stats.enabledTools).toBe(3)
      expect(stats.disabledTools).toBe(0)
      expect(stats.byCategory.core).toBe(2)
      expect(stats.byCategory.mcp).toBe(1)
      expect(stats.byTag.a).toBe(2)
      expect(stats.byTag.b).toBe(1)
    })

    it('counts deprecated tools', () => {
      const descriptor = createTestDescriptor('deprecated')
      descriptor.deprecated = true
      registry.register(descriptor)

      const stats = registry.getStatistics()
      expect(stats.deprecatedTools).toBe(1)
    })
  })

  describe('Listeners', () => {
    it('notifies listeners on registration', () => {
      const events: RegistryChangeEvent[] = []
      registry.addListener(e => events.push(e))

      registry.register(createTestDescriptor('tool1'))

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('register')
      expect(events[0].toolId).toBe('tool1')
    })

    it('notifies listeners on unregistration', () => {
      registry.register(createTestDescriptor('tool1'))

      const events: RegistryChangeEvent[] = []
      registry.addListener(e => events.push(e))

      registry.unregister('tool1')

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('unregister')
    })

    it('notifies listeners on enable/disable', () => {
      registry.register(createTestDescriptor('tool1'))

      const events: RegistryChangeEvent[] = []
      registry.addListener(e => events.push(e))

      registry.disable('tool1')
      registry.enable('tool1')

      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('disable')
      expect(events[1].type).toBe('enable')
    })

    it('removes listener', () => {
      const events: RegistryChangeEvent[] = []
      const listener = (e: RegistryChangeEvent) => events.push(e)

      registry.addListener(listener)
      registry.removeListener(listener)

      registry.register(createTestDescriptor('tool1'))
      expect(events).toHaveLength(0)
    })

    it('returns unsubscribe function', () => {
      const events: RegistryChangeEvent[] = []
      const unsubscribe = registry.addListener(e => events.push(e))

      registry.register(createTestDescriptor('tool1'))
      expect(events).toHaveLength(1)

      unsubscribe()

      registry.register(createTestDescriptor('tool2'))
      expect(events).toHaveLength(1)
    })
  })

  describe('Utility', () => {
    it('clears all tools', () => {
      registry.registerAll([
        createTestDescriptor('tool1'),
        createTestDescriptor('tool2'),
      ])

      registry.clear()
      expect(registry.size()).toBe(0)
    })
  })
})

describe('Global Registry', () => {
  it('returns singleton instance', () => {
    const r1 = getToolRegistry()
    const r2 = getToolRegistry()

    expect(r1).toBe(r2)
  })
})
