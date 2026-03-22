import { describe, expect, it } from 'vitest'
import type { WorkbenchPageContext } from '@/components/common'
import { EditorRegistry, type EditorDescriptor } from '@/features/editor/registry/editorRegistry'

const mockContext = {
  routeId: 'route',
  resourceId: 'resource',
  openMode: 'editor',
  route: '/editor',
  params: {},
  searchParams: new URLSearchParams(),
  dataSource: {
    sourceType: 'route',
    sourceId: 'resource',
    query: {},
  },
  activeActivityItem: 'knowledge',
  permission: {
    canView: true,
    canEdit: true,
    requiredPermissions: [],
    fieldPermissions: {},
  },
} satisfies WorkbenchPageContext

function createDescriptor(id: string, priority: number, matcher: (resourceId: string) => boolean): EditorDescriptor {
  return {
    id,
    label: id,
    priority,
    matches: matcher,
    render: () => id,
  }
}

describe('EditorRegistry resolver', () => {
  it('resolves matching editor by priority and falls back when no explicit match exists', () => {
    const fallback = createDescriptor('text', 0, () => true)
    const registry = new EditorRegistry(fallback)
    registry.register(createDescriptor('markdown', 100, (resourceId) => /\.md$/i.test(resourceId)))
    registry.register(createDescriptor('json', 200, (resourceId) => /\.json$/i.test(resourceId)))

    expect(registry.resolve('contract.json').id).toBe('json')
    expect(registry.resolve('notes.md').id).toBe('markdown')
    expect(registry.resolve('readme.txt').id).toBe('text')
  })

  it('keeps deterministic conflict rule by priority then registration order', () => {
    const fallback = createDescriptor('text', 0, () => true)
    const registry = new EditorRegistry(fallback)

    registry.register(createDescriptor('first-json', 200, (resourceId) => /\.json$/i.test(resourceId)))
    registry.register(createDescriptor('second-json', 200, (resourceId) => /\.json$/i.test(resourceId)))
    expect(registry.resolve('a.json').id).toBe('first-json')

    registry.register(createDescriptor('override-json', 300, (resourceId) => /\.json$/i.test(resourceId)))
    expect(registry.resolve('a.json').id).toBe('override-json')
  })

  it('replaces descriptor by id during re-registration', () => {
    const fallback = createDescriptor('text', 0, () => true)
    const registry = new EditorRegistry(fallback)
    const plugin = createDescriptor('plugin-json', 100, (resourceId) => /\.json$/i.test(resourceId))
    registry.register(plugin)
    expect(registry.resolve('workflow.json').render(mockContext)).toBe('plugin-json')

    registry.register({
      ...plugin,
      label: 'plugin-json-updated',
      render: () => 'plugin-json-updated',
    })
    expect(registry.resolve('workflow.json').render(mockContext)).toBe('plugin-json-updated')
  })
})

