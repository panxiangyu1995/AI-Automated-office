/**
 * Unit tests for Tool Permission Precheck
 * Task 72: Story 46.1 - Tool Permission Precheck
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  PermissionPrecheck,
  createPermissionPrecheck,
  checkToolPermission,
  formatPermissionResult,
  isPermissionDenied,
  extractPermissionRequirements,
  type PermissionDecisionEvent,
  type PermissionCheckResult,
} from '@/features/session/tools/toolPermissionPrecheck'
import { ToolRegistry } from '@/features/session/tools/toolRegistry'
import { defineTool, stringParam } from '@/features/session/tools/toolDescriptor'
import type { ToolRuntimeContext } from '@/features/session/tools/toolExecutor'

// ==================== Test Fixtures ====================

const createMockContext = (
  overrides: Partial<ToolRuntimeContext> = {}
): ToolRuntimeContext => ({
  sessionId: 'session_001',
  userId: 'user_001',
  tenantId: 'tenant_001',
  permissions: [],
  metadata: {},
  timestamp: Date.now(),
  ...overrides,
})

const createTestRegistry = (): ToolRegistry => {
  const registry = new ToolRegistry()

  // Register test tools with different permission requirements
  registry.register(defineTool('simple_tool', 'Simple Tool')
    .withDescription('A simple tool with no permissions')
    .withCategory('test')
    .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
    .build())

  registry.register(defineTool('protected_tool', 'Protected Tool')
    .withDescription('A tool that requires execute permission')
    .withCategory('test')
    .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
    .withPermission({ type: 'execute', resource: 'tool:protected_tool', description: 'Execute permission' })
    .build())

  registry.register(defineTool('admin_tool', 'Admin Tool')
    .withDescription('A tool that requires admin permission')
    .withCategory('test')
    .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
    .withPermission({ type: 'admin', resource: 'system:admin', description: 'Admin permission' })
    .build())

  registry.register(defineTool('sensitive_tool', 'Sensitive Tool')
    .withDescription('A tool with side effects')
    .withCategory('test')
    .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
    .withCapabilities({
      hasSideEffects: true,
      requiresConfirmation: true,
      supportsStreaming: false,
      isIdempotent: false,
    })
    .build())

  registry.register(defineTool('multi_perm_tool', 'Multi Permission Tool')
    .withDescription('A tool requiring multiple permissions')
    .withCategory('test')
    .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
    .withPermission({ type: 'execute', resource: 'tool:multi_perm_tool', description: 'Execute permission' })
    .withPermission({ type: 'read', resource: 'data:users', description: 'Read users' })
    .withPermission({ type: 'write', resource: 'data:logs', description: 'Write logs' })
    .build())

  return registry
}

// ==================== Permission Precheck Tests ====================

describe('PermissionPrecheck', () => {
  let registry: ToolRegistry
  let precheck: PermissionPrecheck

  beforeEach(() => {
    registry = createTestRegistry()
    precheck = new PermissionPrecheck(registry)
  })

  afterEach(() => {
    precheck.clearAllCache()
  })

  describe('basic permission checking', () => {
    it('should allow access to simple tool with no permissions required', () => {
      const context = createMockContext()
      const result = precheck.checkPermissions('simple_tool', context)

      expect(result.allowed).toBe(true)
      expect(result.missingPermissions).toHaveLength(0)
    })

    it('should deny access when required permission is missing', () => {
      const context = createMockContext({ permissions: [] })
      const result = precheck.checkPermissions('protected_tool', context)

      expect(result.allowed).toBe(false)
      expect(result.missingPermissions.length).toBeGreaterThan(0)
    })

    it('should allow access when required permission is present', () => {
      const context = createMockContext({
        permissions: ['execute:tool:protected_tool'],
      })
      const result = precheck.checkPermissions('protected_tool', context)

      expect(result.allowed).toBe(true)
    })
  })

  describe('permission resolution', () => {
    it('should resolve permissions from tool descriptor', () => {
      const context = createMockContext()
      const result = precheck.checkPermissions('admin_tool', context)

      expect(result.requiredPermissions.some(p => p.type === 'admin')).toBe(true)
    })

    it('should not add implicit execute permission for tools without explicit permissions', () => {
      const context = createMockContext()
      const result = precheck.checkPermissions('simple_tool', context)

      // Tools with no explicit permissions don't require any permissions
      expect(result.requiredPermissions).toHaveLength(0)
    })

    it('should add capability-based permissions', () => {
      const context = createMockContext()
      const result = precheck.checkPermissions('sensitive_tool', context)

      expect(result.requiredPermissions.some(p => p.type === 'write')).toBe(true)
      expect(result.requiredPermissions.some(p => p.type === 'sensitive')).toBe(true)
    })
  })

  describe('user permission resolution', () => {
    it('should parse permission strings correctly', () => {
      const context = createMockContext({
        permissions: ['read:data:users', 'write:data:logs'],
      })
      const userPerms = precheck.getUserPermissions(context)

      expect(userPerms.some(p => p.type === 'read' && p.resource === 'data:users')).toBe(true)
      expect(userPerms.some(p => p.type === 'write' && p.resource === 'data:logs')).toBe(true)
    })

    it('should handle wildcard permissions', () => {
      const context = createMockContext({
        permissions: ['execute:*'],
      })
      const result = precheck.checkPermissions('protected_tool', context)

      expect(result.allowed).toBe(true)
    })

    it('should grant admin wildcard access', () => {
      const context = createMockContext({
        permissions: ['admin'],
      })
      const result = precheck.checkPermissions('admin_tool', context)

      expect(result.allowed).toBe(true)
    })
  })

  describe('multi-permission tools', () => {
    it('should require all permissions for multi-permission tools', () => {
      const context = createMockContext({
        permissions: ['execute:tool:multi_perm_tool'],
      })
      const result = precheck.checkPermissions('multi_perm_tool', context)

      expect(result.allowed).toBe(false)
      expect(result.missingPermissions.length).toBeGreaterThan(0)
    })

    it('should allow when all required permissions are present', () => {
      const context = createMockContext({
        permissions: [
          'execute:tool:multi_perm_tool',
          'read:data:users',
          'write:data:logs',
        ],
      })
      const result = precheck.checkPermissions('multi_perm_tool', context)

      expect(result.allowed).toBe(true)
      expect(result.missingPermissions).toHaveLength(0)
    })
  })

  describe('caching', () => {
    it('should cache permission resolutions', () => {
      const context = createMockContext({
        permissions: ['execute:tool:protected_tool'],
      })

      // First call
      const result1 = precheck.checkPermissions('protected_tool', context)

      // Second call should use cache
      const result2 = precheck.checkPermissions('protected_tool', context)

      expect(result1.auditId).not.toBe(result2.auditId)
      expect(result1.allowed).toBe(result2.allowed)
    })

    it('should clear cache for specific user', () => {
      const context = createMockContext({
        permissions: ['execute:tool:protected_tool'],
      })

      precheck.checkPermissions('protected_tool', context)
      precheck.clearUserCache(context.userId, context.tenantId)

      const stats = precheck.getStatistics()
      expect(stats.cacheSize).toBe(0)
    })

    it('should clear all cache', () => {
      const context = createMockContext()
      precheck.checkPermissions('simple_tool', context)
      precheck.clearAllCache()

      const stats = precheck.getStatistics()
      expect(stats.cacheSize).toBe(0)
    })
  })

  describe('audit stream', () => {
    it('should emit permission decision events', () => {
      const events: PermissionDecisionEvent[] = []
      precheck.addStreamListener((event) => events.push(event))

      const context = createMockContext()
      precheck.checkPermissions('simple_tool', context)

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('permission_decision')
      expect(events[0].toolId).toBe('simple_tool')
    })

    it('should include correct result in events', () => {
      const events: PermissionDecisionEvent[] = []
      precheck.addStreamListener((event) => events.push(event))

      const context = createMockContext({ permissions: [] })
      precheck.checkPermissions('protected_tool', context)

      expect(events[0].result.allowed).toBe(false)
    })

    it('should support multiple listeners', () => {
      const events1: PermissionDecisionEvent[] = []
      const events2: PermissionDecisionEvent[] = []

      precheck.addStreamListener((e) => events1.push(e))
      precheck.addStreamListener((e) => events2.push(e))

      const context = createMockContext()
      precheck.checkPermissions('simple_tool', context)

      expect(events1).toHaveLength(1)
      expect(events2).toHaveLength(1)
    })

    it('should allow unsubscribing', () => {
      const events: PermissionDecisionEvent[] = []
      const unsubscribe = precheck.addStreamListener((e) => events.push(e))

      const context = createMockContext()
      precheck.checkPermissions('simple_tool', context)
      expect(events).toHaveLength(1)

      unsubscribe()
      precheck.checkPermissions('simple_tool', context)
      expect(events).toHaveLength(1) // No new event after unsubscribe
    })
  })

  describe('configuration options', () => {
    it('should respect enableAudit config', () => {
      const noAuditPrecheck = new PermissionPrecheck(registry, { enableAudit: false })
      const events: PermissionDecisionEvent[] = []
      noAuditPrecheck.addStreamListener((e) => events.push(e))

      const context = createMockContext()
      noAuditPrecheck.checkPermissions('simple_tool', context)

      expect(events).toHaveLength(0)
    })

    it('should respect enableCache config', () => {
      const noCachePrecheck = new PermissionPrecheck(registry, { enableCache: false })

      const context = createMockContext()
      noCachePrecheck.checkPermissions('simple_tool', context)

      const stats = noCachePrecheck.getStatistics()
      expect(stats.cacheSize).toBe(0)
    })
  })

  describe('tool not found', () => {
    it('should deny access to non-existent tools', () => {
      const context = createMockContext()
      const result = precheck.checkPermissions('non_existent_tool', context)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('not found')
    })
  })

  describe('statistics', () => {
    it('should return correct statistics', () => {
      const context = createMockContext()
      precheck.checkPermissions('simple_tool', context)

      const stats = precheck.getStatistics()
      expect(stats.cacheSize).toBeGreaterThan(0)
      expect(stats.listenerCount).toBe(0)
      expect(stats.auditCount).toBeGreaterThan(0)
    })
  })
})

// ==================== Helper Functions Tests ====================

describe('helper functions', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  describe('createPermissionPrecheck', () => {
    it('should create a precheck instance', () => {
      const precheck = createPermissionPrecheck(registry)
      expect(precheck).toBeInstanceOf(PermissionPrecheck)
    })

    it('should accept config options', () => {
      const precheck = createPermissionPrecheck(registry, { enableCache: false })
      const stats = precheck.getStatistics()
      expect(stats.cacheSize).toBe(0)
    })
  })

  describe('checkToolPermission', () => {
    it('should return boolean for permission check', () => {
      const context = createMockContext({
        permissions: ['execute:tool:protected_tool'],
      })
      const result = checkToolPermission(registry, 'protected_tool', context)
      expect(result).toBe(true)
    })

    it('should return false for denied permission', () => {
      const context = createMockContext({ permissions: [] })
      const result = checkToolPermission(registry, 'protected_tool', context)
      expect(result).toBe(false)
    })
  })

  describe('formatPermissionResult', () => {
    it('should format granted result', () => {
      const result: PermissionCheckResult = {
        allowed: true,
        requiredPermissions: [],
        missingPermissions: [],
        grantedPermissions: [],
        decisionTime: 10,
        auditId: 'audit_001',
      }
      expect(formatPermissionResult(result)).toContain('granted')
    })

    it('should format denied result with reason', () => {
      const result: PermissionCheckResult = {
        allowed: false,
        reason: 'Missing required permissions',
        requiredPermissions: [],
        missingPermissions: [{ type: 'execute', resource: 'tool:test', scope: 'tenant', granted: false }],
        grantedPermissions: [],
        decisionTime: 10,
        auditId: 'audit_001',
      }
      const formatted = formatPermissionResult(result)
      expect(formatted).toContain('denied')
      expect(formatted).toContain('Missing')
    })
  })

  describe('isPermissionDenied', () => {
    it('should return true for denied events', () => {
      const event: PermissionDecisionEvent = {
        type: 'permission_decision',
        timestamp: Date.now(),
        auditId: 'audit_001',
        toolId: 'test_tool',
        userId: 'user_001',
        tenantId: 'tenant_001',
        result: {
          allowed: false,
          requiredPermissions: [],
          missingPermissions: [],
          grantedPermissions: [],
          decisionTime: 10,
          auditId: 'audit_001',
        },
        context: {
          source: 'precheck',
          correlationId: 'corr_001',
        },
      }
      expect(isPermissionDenied(event)).toBe(true)
    })

    it('should return false for allowed events', () => {
      const event: PermissionDecisionEvent = {
        type: 'permission_decision',
        timestamp: Date.now(),
        auditId: 'audit_001',
        toolId: 'test_tool',
        userId: 'user_001',
        tenantId: 'tenant_001',
        result: {
          allowed: true,
          requiredPermissions: [],
          missingPermissions: [],
          grantedPermissions: [],
          decisionTime: 10,
          auditId: 'audit_001',
        },
        context: {
          source: 'precheck',
          correlationId: 'corr_001',
        },
      }
      expect(isPermissionDenied(event)).toBe(false)
    })
  })

  describe('extractPermissionRequirements', () => {
    it('should extract explicit permissions', () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('Test')
        .withCategory('test')
        .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
        .withPermission({ type: 'read', resource: 'data:users', description: 'Read users' })
        .build()

      const requirements = extractPermissionRequirements(descriptor)
      expect(requirements.some(r => r.type === 'read')).toBe(true)
    })

    it('should extract capability-based permissions', () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('Test')
        .withCategory('test')
        .withMetadata({ version: '1.0.0', tags: [], category: 'test' })
        .withCapabilities({
          hasSideEffects: true,
          requiresConfirmation: true,
          supportsStreaming: false,
          isIdempotent: false,
        })
        .build()

      const requirements = extractPermissionRequirements(descriptor)
      expect(requirements.some(r => r.type === 'write')).toBe(true)
      expect(requirements.some(r => r.type === 'sensitive')).toBe(true)
    })
  })
})

// ==================== Edge Cases ====================

describe('Edge Cases', () => {
  let registry: ToolRegistry
  let precheck: PermissionPrecheck

  beforeEach(() => {
    registry = createTestRegistry()
    precheck = new PermissionPrecheck(registry)
  })

  it('should handle empty permission arrays', () => {
    const context = createMockContext({ permissions: [] })
    const result = precheck.checkPermissions('simple_tool', context)
    expect(result.allowed).toBe(true)
  })

  it('should handle malformed permission strings', () => {
    const context = createMockContext({
      permissions: ['invalid_permission_format', 'another_bad_one'],
    })
    const userPerms = precheck.getUserPermissions(context)
    // Should skip malformed permissions
    expect(userPerms.filter(p => p.source === 'context')).toHaveLength(0)
  })

  it('should handle very long permission lists', () => {
    const manyPerms = Array.from({ length: 100 }, (_, i) => `read:data:${i}`)
    const context = createMockContext({ permissions: manyPerms })
    const userPerms = precheck.getUserPermissions(context)
    expect(userPerms.length).toBeGreaterThan(0)
  })

  it('should handle concurrent permission checks', async () => {
    const context = createMockContext({
      permissions: ['execute:tool:protected_tool'],
    })

    const promises = Array.from({ length: 10 }, () =>
      Promise.resolve(precheck.checkPermissions('protected_tool', context))
    )

    const results = await Promise.all(promises)
    expect(results.every(r => r.allowed)).toBe(true)
  })

  it('should include decision time in results', () => {
    const context = createMockContext()
    const result = precheck.checkPermissions('simple_tool', context)
    expect(result.decisionTime).toBeGreaterThanOrEqual(0)
  })

  it('should generate unique audit IDs', () => {
    const context = createMockContext()
    const result1 = precheck.checkPermissions('simple_tool', context)
    const result2 = precheck.checkPermissions('simple_tool', context)
    expect(result1.auditId).not.toBe(result2.auditId)
  })
})
