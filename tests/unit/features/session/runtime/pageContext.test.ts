/**
 * Tests for Page and Resource Context
 * Task 77: Story 47.2 - Page and Resource Context
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type PageMode,
  type ResourceType,
  type ResourceState,
  type ResourceReference,
  type PageLocation,
  type EditorContext,
  type DynamicContext,
  type PageContext,
  type PageContextEnvelope,
  type ContextResolutionOptions,
  type ResolvedPageContext,
  
  // Factory functions
  generatePageContextId,
  createResourceReference,
  createPageLocation,
  createEditorContext,
  createDynamicContext,
  createPageContext,
  createPageContextEnvelope,
  
  // Context resolution functions
  resolvePageContext,
  resolveStaticContext,
  resolveDynamicContext,
  resolveEditorContext,
  
  // Context attachment functions
  attachResource,
  attachResources,
  detachResource,
  setPrimaryResource,
  
  // Context exposure functions
  exposeToPlanner,
  exposeToToolRuntime,
  isValidForToolExecution,
  
  // Validation functions
  validatePageContext,
  isPageContextExpired,
  isPageContextStale,
  
  // Utility functions
  getActiveResources,
  getResourcesByType,
  getResourcesByState,
  getDirtyResources,
  mergePageContexts,
  clonePageContext,
  createMinimalPageContext,
} from '@/features/session/runtime/pageContext'

// ==================== Test Fixtures ====================

const mockResource: ResourceReference = {
  id: 'res-1',
  type: 'form',
  name: 'Test Form',
  state: 'ready',
  isActive: true,
  editMode: 'view',
  permissions: ['read', 'write'],
}

const mockPageLocation: PageLocation = {
  route: '/dashboard',
  mode: 'dashboard',
  query: { tab: 'overview' },
  params: { id: '123' },
  openedAt: Date.now(),
}

const mockEditorContext: EditorContext = {
  editorType: 'code',
  contentPath: '/src/test.ts',
  contentType: 'text/typescript',
  isDirty: false,
  language: 'typescript',
  undoStackSize: 0,
  redoStackSize: 0,
}

const mockDynamicContext: DynamicContext = {
  dynamicId: 'form-1',
  schemaVersion: '1.0.0',
  validationState: { isValid: true, errors: [], warnings: [] },
  dirtyFields: [],
}

// ==================== Factory Function Tests ====================

describe('generatePageContextId', () => {
  it('should generate unique context IDs', () => {
    const id1 = generatePageContextId()
    const id2 = generatePageContextId()
    
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^page_[a-z0-9]+_[a-f0-9]+$/)
  })
})

describe('createResourceReference', () => {
  it('should create resource reference with required fields', () => {
    const resource = createResourceReference('res-1', 'form')
    
    expect(resource.id).toBe('res-1')
    expect(resource.type).toBe('form')
    expect(resource.name).toBe('form-res-1')
    expect(resource.state).toBe('ready')
  })

  it('should create resource reference with options', () => {
    const resource = createResourceReference('res-2', 'table', {
      name: 'Custom Name',
      state: 'editing',
      isActive: true,
      permissions: ['read'],
    })
    
    expect(resource.name).toBe('Custom Name')
    expect(resource.state).toBe('editing')
    expect(resource.isActive).toBe(true)
    expect(resource.permissions).toEqual(['read'])
  })
})

describe('createPageLocation', () => {
  it('should create page location with required fields', () => {
    const location = createPageLocation('/test', 'static')
    
    expect(location.route).toBe('/test')
    expect(location.mode).toBe('static')
    expect(location.query).toEqual({})
    expect(location.params).toEqual({})
    expect(location.openedAt).toBeDefined()
  })

  it('should create page location with options', () => {
    const location = createPageLocation('/dashboard', 'dashboard', {
      title: 'Dashboard',
      query: { tab: 'overview' },
      navigationSource: 'menu',
    })
    
    expect(location.title).toBe('Dashboard')
    expect(location.query).toEqual({ tab: 'overview' })
    expect(location.navigationSource).toBe('menu')
  })
})

describe('createEditorContext', () => {
  it('should create editor context', () => {
    const editor = createEditorContext('text')
    
    expect(editor.editorType).toBe('text')
    expect(editor.isDirty).toBe(false)
  })

  it('should create editor context with options', () => {
    const editor = createEditorContext('code', {
      contentPath: '/src/test.ts',
      language: 'typescript',
      isDirty: true,
    })
    
    expect(editor.contentPath).toBe('/src/test.ts')
    expect(editor.language).toBe('typescript')
    expect(editor.isDirty).toBe(true)
  })
})

describe('createDynamicContext', () => {
  it('should create dynamic context', () => {
    const dynamic = createDynamicContext('form-1', '1.0.0')
    
    expect(dynamic.dynamicId).toBe('form-1')
    expect(dynamic.schemaVersion).toBe('1.0.0')
    expect(dynamic.validationState?.isValid).toBe(true)
  })
})

describe('createPageContext', () => {
  it('should create page context with location', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    expect(context.contextId).toMatch(/^page_/)
    expect(context.location).toEqual(location)
    expect(context.resources).toEqual([])
    expect(context.source).toBe('host')
  })

  it('should create page context with all options', () => {
    const location = createPageLocation('/editor', 'editor')
    const context = createPageContext(location, 'host-2', {
      resources: [mockResource],
      primaryResource: mockResource,
      editor: mockEditorContext,
      features: ['feature-1'],
    })
    
    expect(context.resources).toHaveLength(1)
    expect(context.primaryResource).toEqual(mockResource)
    expect(context.editor).toEqual(mockEditorContext)
    expect(context.features).toContain('feature-1')
  })
})

describe('createPageContextEnvelope', () => {
  it('should create envelope with page context', () => {
    const location = createPageLocation('/test', 'static')
    const pageContext = createPageContext(location, 'host-1')
    const envelope = createPageContextEnvelope(pageContext, 'host-1')
    
    expect(envelope.page).toEqual(pageContext)
    expect(envelope.hostId).toBe('host-1')
    expect(envelope.freshness).toBe('fresh')
    expect(envelope.hasUnsavedChanges).toBe(false)
  })
})

// ==================== Context Resolution Tests ====================

describe('resolvePageContext', () => {
  it('should resolve context with default options', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    const resolved = resolvePageContext(context)
    
    expect(resolved.pageContext).toBeDefined()
    expect(resolved.resolvedAt).toBeDefined()
    expect(resolved.resolutionTime).toBeGreaterThanOrEqual(0)
    expect(resolved.isComplete).toBe(true)
  })

  it('should filter resources with resourceFilter', () => {
    const location = createPageLocation('/test', 'static')
    const resource1 = createResourceReference('res-1', 'form', { isActive: true })
    const resource2 = createResourceReference('res-2', 'table', { isActive: false })
    const context = createPageContext(location, 'host-1', {
      resources: [resource1, resource2],
    })
    
    const resolved = resolvePageContext(context, {
      includeInactive: false,
    })
    
    expect(resolved.pageContext.resources).toHaveLength(1)
    expect(resolved.pageContext.resources[0].id).toBe('res-1')
  })

  it('should detect failed resources', () => {
    const location = createPageLocation('/test', 'static')
    const errorResource = createResourceReference('res-error', 'form', { state: 'error', isActive: true })
    const context = createPageContext(location, 'host-1', {
      resources: [errorResource],
    })
    
    const resolved = resolvePageContext(context)
    
    expect(resolved.failedResources).toBeDefined()
    expect(resolved.failedResources).toContain('res-error')
  })
})

describe('resolveStaticContext', () => {
  it('should resolve for static mode without editor/dynamic', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      editor: mockEditorContext,
      dynamic: mockDynamicContext,
    })
    
    const resolved = resolveStaticContext(context)
    
    expect(resolved.pageContext.editor).toBeUndefined()
    expect(resolved.pageContext.dynamic).toBeUndefined()
  })
})

describe('resolveDynamicContext', () => {
  it('should resolve for dynamic mode with dynamic context', () => {
    const location = createPageLocation('/form', 'dynamic')
    const context = createPageContext(location, 'host-1', {
      dynamic: mockDynamicContext,
    })
    
    const resolved = resolveDynamicContext(context)
    
    expect(resolved.pageContext.dynamic).toBeDefined()
  })
})

describe('resolveEditorContext', () => {
  it('should resolve for editor mode with editor context', () => {
    const location = createPageLocation('/editor', 'editor')
    const context = createPageContext(location, 'host-1', {
      editor: { ...mockEditorContext, isDirty: true },
    })
    
    const resolved = resolveEditorContext(context)
    
    expect(resolved.pageContext.editor).toBeDefined()
    expect(resolved.pageContext.metadata?.hasUnsavedChanges).toBe(true)
  })
})

// ==================== Context Attachment Tests ====================

describe('attachResource', () => {
  it('should attach new resource', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    const updated = attachResource(context, mockResource)
    
    expect(updated.resources).toHaveLength(1)
    expect(updated.resources[0].id).toBe('res-1')
  })

  it('should update existing resource', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
    })
    
    const updatedResource = { ...mockResource, state: 'editing' as ResourceState }
    const updated = attachResource(context, updatedResource)
    
    expect(updated.resources).toHaveLength(1)
    expect(updated.resources[0].state).toBe('editing')
  })
})

describe('attachResources', () => {
  it('should attach multiple resources', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    const resources = [
      createResourceReference('res-1', 'form'),
      createResourceReference('res-2', 'table'),
    ]
    const updated = attachResources(context, resources)
    
    expect(updated.resources).toHaveLength(2)
  })
})

describe('detachResource', () => {
  it('should detach resource', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
    })
    
    const updated = detachResource(context, 'res-1')
    
    expect(updated.resources).toHaveLength(0)
  })

  it('should clear primary resource when detaching', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
      primaryResource: mockResource,
    })
    
    const updated = detachResource(context, 'res-1')
    
    expect(updated.primaryResource).toBeUndefined()
  })
})

describe('setPrimaryResource', () => {
  it('should set primary resource', () => {
    const location = createPageLocation('/test', 'static')
    const resource1 = createResourceReference('res-1', 'form')
    const resource2 = createResourceReference('res-2', 'table')
    const context = createPageContext(location, 'host-1', {
      resources: [resource1, resource2],
    })
    
    const updated = setPrimaryResource(context, 'res-2')
    
    expect(updated.primaryResource?.id).toBe('res-2')
    expect(updated.resources.find(r => r.id === 'res-2')?.isActive).toBe(true)
    expect(updated.resources.find(r => r.id === 'res-1')?.isActive).toBe(false)
  })

  it('should not change if resource not found', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
    })
    
    const updated = setPrimaryResource(context, 'non-existent')
    
    expect(updated.primaryResource).toBeUndefined()
  })
})

// ==================== Context Exposure Tests ====================

describe('exposeToPlanner', () => {
  it('should expose safe context for planner', () => {
    const location = createPageLocation('/dashboard', 'dashboard')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
      features: ['feature-1'],
    })
    
    const exposed = exposeToPlanner(context)
    
    expect(exposed.contextId).toBeDefined()
    expect(exposed.location).toBeDefined()
    expect(exposed.features).toContain('feature-1')
    expect(exposed.resources).toHaveLength(1)
    expect(exposed).not.toHaveProperty('editor')
    expect(exposed).not.toHaveProperty('dynamic')
    expect(exposed).not.toHaveProperty('metadata')
  })
})

describe('exposeToToolRuntime', () => {
  it('should expose safe context for tool runtime', () => {
    const location = createPageLocation('/editor', 'editor')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
      editor: mockEditorContext,
    })
    
    const exposed = exposeToToolRuntime(context)
    
    expect(exposed.pageMode).toBe('editor')
    expect(exposed.route).toBe('/editor')
    expect(exposed.hasEditorContext).toBe(true)
    expect(exposed.hasDynamicContext).toBe(false)
  })
})

describe('isValidForToolExecution', () => {
  it('should return valid for healthy context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      resources: [mockResource],
    })
    
    const result = isValidForToolExecution(context)
    
    expect(result.valid).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('should return invalid for expired context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      expiresAt: Date.now() - 1000,
    })
    
    const result = isValidForToolExecution(context)
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('expired')
  })

  it('should return invalid for resources in error state', () => {
    const location = createPageLocation('/test', 'static')
    const errorResource = createResourceReference('res-error', 'form', { state: 'error' })
    const context = createPageContext(location, 'host-1', {
      resources: [errorResource],
    })
    
    const result = isValidForToolExecution(context)
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('error')
  })

  it('should return invalid for locked primary resource', () => {
    const location = createPageLocation('/test', 'static')
    const lockedResource = createResourceReference('res-locked', 'form', { state: 'locked' })
    const context = createPageContext(location, 'host-1', {
      resources: [lockedResource],
      primaryResource: lockedResource,
    })
    
    const result = isValidForToolExecution(context)
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('locked')
  })
})

// ==================== Validation Tests ====================

describe('validatePageContext', () => {
  it('should return valid for complete context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    const result = validatePageContext(context)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for missing required fields', () => {
    const context = {} as PageContext
    
    const result = validatePageContext(context)
    
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('isPageContextExpired', () => {
  it('should return false for non-expired context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      expiresAt: Date.now() + 3600000,
    })
    
    expect(isPageContextExpired(context)).toBe(false)
  })

  it('should return true for expired context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      expiresAt: Date.now() - 1000,
    })
    
    expect(isPageContextExpired(context)).toBe(true)
  })

  it('should return false for context without expiration', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    expect(isPageContextExpired(context)).toBe(false)
  })
})

describe('isPageContextStale', () => {
  it('should return false for fresh context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1')
    
    expect(isPageContextStale(context)).toBe(false)
  })

  it('should return true for stale context', () => {
    const location = createPageLocation('/test', 'static')
    const context = createPageContext(location, 'host-1', {
      updatedAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    })
    
    expect(isPageContextStale(context, 5 * 60 * 1000)).toBe(true)
  })
})

// ==================== Utility Functions Tests ====================

describe('getActiveResources', () => {
  it('should return only active resources', () => {
    const location = createPageLocation('/test', 'static')
    const active = createResourceReference('res-1', 'form', { isActive: true })
    const inactive = createResourceReference('res-2', 'table', { isActive: false })
    const context = createPageContext(location, 'host-1', {
      resources: [active, inactive],
    })
    
    const result = getActiveResources(context)
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('res-1')
  })
})

describe('getResourcesByType', () => {
  it('should return resources of specific type', () => {
    const location = createPageLocation('/test', 'static')
    const form = createResourceReference('res-1', 'form')
    const table = createResourceReference('res-2', 'table')
    const context = createPageContext(location, 'host-1', {
      resources: [form, table],
    })
    
    const result = getResourcesByType(context, 'form')
    
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('form')
  })
})

describe('getResourcesByState', () => {
  it('should return resources in specific state', () => {
    const location = createPageLocation('/test', 'static')
    const ready = createResourceReference('res-1', 'form', { state: 'ready' })
    const editing = createResourceReference('res-2', 'table', { state: 'editing' })
    const context = createPageContext(location, 'host-1', {
      resources: [ready, editing],
    })
    
    const result = getResourcesByState(context, 'editing')
    
    expect(result).toHaveLength(1)
    expect(result[0].state).toBe('editing')
  })
})

describe('getDirtyResources', () => {
  it('should return resources with edit mode', () => {
    const location = createPageLocation('/test', 'static')
    const view = createResourceReference('res-1', 'form', { editMode: 'view' })
    const edit = createResourceReference('res-2', 'table', { editMode: 'edit' })
    const context = createPageContext(location, 'host-1', {
      resources: [view, edit],
    })
    
    const result = getDirtyResources(context)
    
    expect(result).toHaveLength(1)
    expect(result[0].editMode).toBe('edit')
  })
})

describe('mergePageContexts', () => {
  it('should merge contexts', () => {
    const location = createPageLocation('/test', 'static')
    const base = createPageContext(location, 'host-1')
    const newResource = createResourceReference('res-new', 'form')
    
    const merged = mergePageContexts(base, {
      resources: [newResource],
    })
    
    expect(merged.resources).toHaveLength(1)
    expect(merged.resources[0].id).toBe('res-new')
  })
})

describe('clonePageContext', () => {
  it('should clone context with new ID', () => {
    const location = createPageLocation('/test', 'static')
    const original = createPageContext(location, 'host-1')
    
    const cloned = clonePageContext(original)
    
    expect(cloned.contextId).not.toBe(original.contextId)
    expect(cloned.location).toEqual(original.location)
  })
})

describe('createMinimalPageContext', () => {
  it('should create minimal context', () => {
    const context = createMinimalPageContext('/test', 'host-1')
    
    expect(context.location.route).toBe('/test')
    expect(context.location.mode).toBe('static')
    expect(context.resources).toEqual([])
  })

  it('should create minimal context with custom mode', () => {
    const context = createMinimalPageContext('/editor', 'host-1', 'editor')
    
    expect(context.location.mode).toBe('editor')
  })
})
