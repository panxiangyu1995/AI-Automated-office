import { createDefaultCardLayoutSchema, type CardLayoutSchema, type CardLayoutConfig } from './cardLayoutSchema'

/**
 * In-memory cache for loaded card layouts
 */
const layoutCache = new Map<string, CardLayoutSchema>()

/**
 * Card Layout Store - Manages workbench card layout configurations
 */
export const cardLayoutStore = {
  /**
   * Get a card layout schema by ID
   */
  get(id: string): CardLayoutSchema | undefined {
    return layoutCache.get(id)
  },

  /**
   * Set a card layout schema
   */
  set(id: string, schema: CardLayoutSchema): void {
    layoutCache.set(id, schema)
  },

  /**
   * Delete a card layout schema
   */
  delete(id: string): boolean {
    return layoutCache.delete(id)
  },

  /**
   * Check if a layout exists
   */
  has(id: string): boolean {
    return layoutCache.has(id)
  },

  /**
   * Get all layout IDs
   */
  keys(): string[] {
    return Array.from(layoutCache.keys())
  },

  /**
   * Clear all layouts
   */
  clear(): void {
    layoutCache.clear()
  },
}

/**
 * Resolve card layout schema based on configuration
 */
export function resolveCardLayout(config: CardLayoutConfig): CardLayoutSchema {
  // Try to get from cache first
  const cached = cardLayoutStore.get(config.schemaId)
  if (cached) {
    return cached
  }

  // Return default schema for home context
  if (config.context === 'home') {
    const defaultSchema = createDefaultCardLayoutSchema()
    cardLayoutStore.set(defaultSchema.id, defaultSchema)
    return defaultSchema
  }

  // For department context, create a department-specific default
  if (config.context === 'department' && config.departmentId) {
    const departmentSchema: CardLayoutSchema = {
      id: `department-${config.departmentId}`,
      title: `${config.departmentId} Dashboard`,
      version: {
        version: '1.0.0',
        publishedAt: new Date().toISOString(),
      },
      sections: [
        {
          id: 'department-quick-actions',
          title: 'Quick Actions',
          order: 1,
          layout: 'grid',
          columns: 4,
          gap: 4,
          blocks: [],
        },
        {
          id: 'department-metrics',
          title: 'Department Metrics',
          order: 2,
          layout: 'grid',
          columns: 4,
          gap: 4,
          blocks: [],
        },
      ],
    }
    cardLayoutStore.set(departmentSchema.id, departmentSchema)
    return departmentSchema
  }

  // Fallback to default
  return createDefaultCardLayoutSchema()
}

/**
 * Load card layout from configuration source
 */
export async function loadCardLayout(config: CardLayoutConfig): Promise<CardLayoutSchema> {
  // In a real implementation, this would load from API or local storage
  // For now, resolve from cache or create default
  return resolveCardLayout(config)
}

/**
 * Save card layout configuration
 */
export async function saveCardLayout(schema: CardLayoutSchema): Promise<void> {
  // In a real implementation, this would save to API or local storage
  cardLayoutStore.set(schema.id, schema)
}

/**
 * Apply custom settings to a card layout
 */
export function applyCardLayoutSettings(
  baseSchema: CardLayoutSchema,
  settings: Record<string, unknown>
): CardLayoutSchema {
  // Clone the schema to avoid mutation
  const result = JSON.parse(JSON.stringify(baseSchema)) as CardLayoutSchema

  // Apply visibility settings
  const typedSettings = settings as {
    hiddenSections?: string[]
    sectionColumns?: Record<string, number>
    sectionOrder?: Record<string, number>
  }
  
  if (typedSettings.hiddenSections && Array.isArray(typedSettings.hiddenSections)) {
    result.sections = result.sections.filter(
      (section) => !typedSettings.hiddenSections!.includes(section.id)
    )
  }

  // Apply column overrides
  if (typedSettings.sectionColumns && typeof typedSettings.sectionColumns === 'object') {
    const columnsMap = typedSettings.sectionColumns
    result.sections.forEach((section) => {
      if (columnsMap[section.id]) {
        section.columns = columnsMap[section.id]
      }
    })
  }

  // Apply order overrides
  if (typedSettings.sectionOrder && typeof typedSettings.sectionOrder === 'object') {
    const orderMap = typedSettings.sectionOrder
    result.sections.forEach((section) => {
      if (orderMap[section.id] !== undefined) {
        section.order = orderMap[section.id]
      }
    })
    // Re-sort sections by order
    result.sections.sort((a, b) => a.order - b.order)
  }

  return result
}
