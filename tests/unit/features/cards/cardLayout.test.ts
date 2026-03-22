import { describe, it, expect } from 'vitest'
import {
  createDefaultCardLayoutSchema,
  validateCardLayoutSchema,
  buildCardLayoutRuntimeContract,
  resolveCardBlockPermission,
  evaluateCardVisibility,
  type CardLayoutSchema,
  type ChartCardBlock,
  type TodoCardBlock,
  type QuickEntryBlock,
  type FieldPermission,
} from '@/features/cards/runtime/cardLayoutSchema'
import {
  cardLayoutStore,
  resolveCardLayout,
  applyCardLayoutSettings,
  type CardLayoutConfig,
} from '@/features/cards/runtime/cardLayoutStore'

describe('cardLayoutSchema', () => {
  describe('createDefaultCardLayoutSchema', () => {
    it('should create a valid default schema', () => {
      const schema = createDefaultCardLayoutSchema()

      expect(schema.id).toBe('default-workbench')
      expect(schema.title).toBe('Workbench')
      expect(schema.version.version).toBe('1.0.0')
      expect(schema.sections).toHaveLength(4)
    })

    it('should have sections in correct order', () => {
      const schema = createDefaultCardLayoutSchema()

      const orders = schema.sections.map((s) => s.order)
      expect(orders).toEqual([1, 2, 3, 4])
    })
  })

  describe('validateCardLayoutSchema', () => {
    it('should pass for valid schema', () => {
      const schema = createDefaultCardLayoutSchema()
      const errors = validateCardLayoutSchema(schema)

      expect(errors).toHaveLength(0)
    })

    it('should fail for missing id', () => {
      const schema = {
        id: '',
        version: { version: '1.0.0' },
        sections: [],
      } as CardLayoutSchema

      const errors = validateCardLayoutSchema(schema)
      expect(errors).toContain('Schema id is required')
    })

    it('should fail for missing version', () => {
      const schema = {
        id: 'test',
        version: { version: '' },
        sections: [],
      } as CardLayoutSchema

      const errors = validateCardLayoutSchema(schema)
      expect(errors).toContain('Schema version is required')
    })

    it('should fail for chart block without chartType', () => {
      const schema: CardLayoutSchema = {
        id: 'test',
        version: { version: '1.0.0' },
        sections: [
          {
            id: 'section-1',
            order: 1,
            blocks: [
              {
                id: 'chart-1',
                type: 'chart',
                chartType: undefined as unknown as 'line',
              } as ChartCardBlock,
            ],
          },
        ],
      }

      const errors = validateCardLayoutSchema(schema)
      expect(errors.some((e) => e.includes('chartType'))).toBe(true)
    })

    it('should fail for quick-entry block without entries', () => {
      const schema: CardLayoutSchema = {
        id: 'test',
        version: { version: '1.0.0' },
        sections: [
          {
            id: 'section-1',
            order: 1,
            blocks: [
              {
                id: 'quick-1',
                type: 'quick-entry',
                entries: [],
              } as QuickEntryBlock,
            ],
          },
        ],
      }

      const errors = validateCardLayoutSchema(schema)
      expect(errors.some((e) => e.includes('entries'))).toBe(true)
    })
  })

  describe('resolveCardBlockPermission', () => {
    it('should return default permission for divider', () => {
      const block = { id: 'd1', type: 'divider' as const }
      const result = resolveCardBlockPermission(block)

      expect(result.canView).toBe(true)
      expect(result.canEdit).toBe(false)
    })

    it('should respect requiredPermission view', () => {
      const block: ChartCardBlock = {
        id: 'c1',
        type: 'chart',
        chartType: 'bar',
        requiredPermission: 'view',
      }

      const result = resolveCardBlockPermission(block, { canView: true, canEdit: false })
      expect(result.canView).toBe(true)
    })

    it('should respect requiredPermission edit', () => {
      const block: TodoCardBlock = {
        id: 't1',
        type: 'todo',
        requiredPermission: 'edit',
      }

      const result = resolveCardBlockPermission(block, { canView: true, canEdit: false })
      expect(result.canView).toBe(false)
    })
  })

  describe('evaluateCardVisibility', () => {
    it('should return true for undefined expression', () => {
      expect(evaluateCardVisibility(undefined, {})).toBe(true)
    })

    it('should return true for empty expression', () => {
      expect(evaluateCardVisibility('', {})).toBe(true)
    })

    it('should evaluate truthy path', () => {
      const data = { show: true }
      expect(evaluateCardVisibility('show', data)).toBe(true)
    })

    it('should evaluate falsy path', () => {
      const data = { show: false }
      expect(evaluateCardVisibility('show', data)).toBe(false)
    })

    it('should evaluate negation', () => {
      const data = { hidden: true }
      expect(evaluateCardVisibility('!hidden', data)).toBe(false)
    })

    it('should handle nested paths', () => {
      const data = { config: { visible: true } }
      expect(evaluateCardVisibility('config.visible', data)).toBe(true)
    })
  })

  describe('buildCardLayoutRuntimeContract', () => {
    it('should build runtime contract from schema', () => {
      const schema = createDefaultCardLayoutSchema()
      const contract = buildCardLayoutRuntimeContract(schema, {})

      expect(contract).toHaveLength(4)
      expect(contract[0].id).toBe('quick-actions')
    })

    it('should filter hidden sections', () => {
      const schema: CardLayoutSchema = {
        id: 'test',
        version: { version: '1.0.0' },
        sections: [
          {
            id: 'visible',
            order: 1,
            blocks: [],
          },
          {
            id: 'hidden',
            order: 2,
            visibleWhen: 'showHidden',
            blocks: [],
          },
        ],
      }

      const contract = buildCardLayoutRuntimeContract(schema, { showHidden: false })
      expect(contract).toHaveLength(1)
      expect(contract[0].id).toBe('visible')
    })

    it('should sort sections by order', () => {
      const schema: CardLayoutSchema = {
        id: 'test',
        version: { version: '1.0.0' },
        sections: [
          { id: 'second', order: 2, blocks: [] },
          { id: 'first', order: 1, blocks: [] },
        ],
      }

      const contract = buildCardLayoutRuntimeContract(schema, {})
      expect(contract[0].id).toBe('first')
      expect(contract[1].id).toBe('second')
    })
  })
})

describe('cardLayoutStore', () => {
  beforeEach(() => {
    cardLayoutStore.clear()
  })

  describe('resolveCardLayout', () => {
    it('should return default schema for home context', () => {
      const config: CardLayoutConfig = {
        schemaId: 'nonexistent',
        context: 'home',
      }

      const schema = resolveCardLayout(config)
      expect(schema.id).toBe('default-workbench')
    })

    it('should return department schema for department context', () => {
      const config: CardLayoutConfig = {
        schemaId: 'nonexistent',
        context: 'department',
        departmentId: 'sales',
      }

      const schema = resolveCardLayout(config)
      expect(schema.id).toBe('department-sales')
    })

    it('should cache resolved schema', () => {
      const config: CardLayoutConfig = {
        schemaId: 'default-workbench',
        context: 'home',
      }

      resolveCardLayout(config)
      expect(cardLayoutStore.has('default-workbench')).toBe(true)
    })
  })

  describe('applyCardLayoutSettings', () => {
    it('should filter hidden sections', () => {
      const schema = createDefaultCardLayoutSchema()
      const settings = {
        hiddenSections: ['todos'],
      }

      const result = applyCardLayoutSettings(schema, settings)
      expect(result.sections.some((s) => s.id === 'todos')).toBe(false)
    })

    it('should apply column overrides', () => {
      const schema = createDefaultCardLayoutSchema()
      const settings = {
        sectionColumns: {
          'quick-actions': 2,
        },
      }

      const result = applyCardLayoutSettings(schema, settings)
      const quickActions = result.sections.find((s) => s.id === 'quick-actions')
      expect(quickActions?.columns).toBe(2)
    })

    it('should apply order overrides', () => {
      const schema = createDefaultCardLayoutSchema()
      const settings = {
        sectionOrder: {
          todos: 0,
        },
      }

      const result = applyCardLayoutSettings(schema, settings)
      expect(result.sections[0].id).toBe('todos')
    })
  })
})
