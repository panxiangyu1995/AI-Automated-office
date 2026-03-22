import type { FieldPermission } from '../../forms/runtime/detailSectionSchema'

export type { FieldPermission }

/**
 * Card Layout Block Types for Workbench Content
 */
export type CardBlockType = 'chart' | 'todo' | 'quick-entry' | 'metric' | 'divider' | 'container'

/**
 * Chart Card Block - Displays data visualization
 */
export interface ChartCardBlock {
  id: string
  type: 'chart'
  title?: string
  chartType: 'line' | 'bar' | 'pie' | 'area'
  bind?: string
  dataSource?: string
  width?: 'sm' | 'md' | 'lg' | 'full'
  height?: number
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Todo Card Block - Displays task list
 */
export interface TodoCardBlock {
  id: string
  type: 'todo'
  title?: string
  bind?: string
  maxItems?: number
  showCompleted?: boolean
  allowAdd?: boolean
  width?: 'sm' | 'md' | 'lg' | 'full'
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Quick Entry Block - Displays quick action shortcuts
 */
export interface QuickEntryBlock {
  id: string
  type: 'quick-entry'
  title?: string
  entries: QuickEntryItem[]
  layout?: 'grid' | 'list'
  columns?: number
  width?: 'sm' | 'md' | 'lg' | 'full'
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Quick Entry Item - Single quick action
 */
export interface QuickEntryItem {
  id: string
  label: string
  icon?: string
  route?: string
  action?: string
  permission?: string
}

/**
 * Metric Card Block - Displays key metric value
 */
export interface MetricCardBlock {
  id: string
  type: 'metric'
  title?: string
  bind?: string
  format?: 'number' | 'currency' | 'percent'
  prefix?: string
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  width?: 'sm' | 'md' | 'lg' | 'full'
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Divider Block - Visual separator
 */
export interface DividerBlock {
  id: string
  type: 'divider'
  visibleWhen?: string
}

/**
 * Container Block - Container for nested cards
 */
export interface ContainerBlock {
  id: string
  type: 'container'
  title?: string
  layout?: 'grid' | 'flex'
  columns?: number
  gap?: number
  children: CardBlock[]
  width?: 'sm' | 'md' | 'lg' | 'full'
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Union type for all card blocks
 */
export type CardBlock = ChartCardBlock | TodoCardBlock | QuickEntryBlock | MetricCardBlock | DividerBlock | ContainerBlock

/**
 * Card Section - A named section containing card blocks
 */
export interface CardSection {
  id: string
  title?: string
  order: number
  layout?: 'grid' | 'flex'
  columns?: number
  gap?: number
  blocks: CardBlock[]
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Card Layout Schema - Complete schema for workbench cards
 */
export interface CardLayoutSchema {
  id: string
  title?: string
  version: {
    version: string
    publishedAt?: string
  }
  sections: CardSection[]
}

/**
 * Card Layout Configuration - Runtime configuration
 */
export interface CardLayoutConfig {
  schemaId: string
  context: 'home' | 'department' | 'custom'
  departmentId?: string
  userId?: string
  customSettings?: Record<string, unknown>
}

/**
 * Runtime Contract for rendering card blocks
 */
export interface CardBlockRuntimeContract {
  id: string
  type: CardBlockType
  canView: boolean
  canEdit: boolean
  visible: boolean
  width: 'sm' | 'md' | 'lg' | 'full'
}

/**
 * Runtime Contract for rendering card sections
 */
export interface CardSectionRuntimeContract {
  id: string
  title?: string
  order: number
  visible: boolean
  layout: 'grid' | 'flex'
  columns: number
  gap: number
  blocks: CardBlockRuntimeContract[]
}

/**
 * Card Layout Writeback Event
 */
export interface CardWritebackEvent {
  type: 'card_create' | 'card_update' | 'card_delete' | 'metric_refresh'
  cardId: string
  data?: Record<string, unknown>
  timestamp: number
}

/**
 * Card Layout Writeback Handler
 */
export type CardWritebackHandler = (event: CardWritebackEvent) => void

/**
 * Resolve card block permission
 */
export function resolveCardBlockPermission(
  block: CardBlock,
  permissionContext?: FieldPermission
): FieldPermission {
  if (block.type === 'divider') {
    return { canView: true, canEdit: false }
  }

  if ('requiredPermission' in block && block.requiredPermission) {
    const canView = permissionContext?.canView ?? true
    const canEdit = permissionContext?.canEdit ?? true

    if (block.requiredPermission === 'edit') {
      return { canView: canView && canEdit, canEdit }
    }
    return { canView, canEdit }
  }

  return {
    canView: permissionContext?.canView ?? true,
    canEdit: permissionContext?.canEdit ?? true,
  }
}

/**
 * Evaluate visibility expression
 */
export function evaluateCardVisibility(
  visibleWhen: string | undefined,
  data: unknown
): boolean {
  if (!visibleWhen) return true

  const trimmed = visibleWhen.trim()
  if (!trimmed) return true

  // Support simple path expressions and negation
  if (trimmed.startsWith('!')) {
    return !getPathValue(data, trimmed.slice(1))
  }

  return !!getPathValue(data, trimmed)
}

/**
 * Get value from data by path
 */
function getPathValue(data: unknown, path: string): unknown {
  if (!path) return undefined

  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') {
      return undefined
    }
    return (acc as Record<string, unknown>)[segment]
  }, data)
}

/**
 * Get default width for card block type
 */
function getDefaultWidth(type: CardBlockType): 'sm' | 'md' | 'lg' | 'full' {
  switch (type) {
    case 'metric':
      return 'sm'
    case 'todo':
    case 'quick-entry':
      return 'md'
    case 'chart':
      return 'lg'
    default:
      return 'md'
  }
}

/**
 * Build runtime contract for card layout
 */
export function buildCardLayoutRuntimeContract(
  schema: CardLayoutSchema,
  data: unknown,
  permissionContext?: FieldPermission
): CardSectionRuntimeContract[] {
  return schema.sections
    .filter((section) => evaluateCardVisibility(section.visibleWhen, data))
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const sectionPermission = resolveCardBlockPermission(
        { ...section, type: 'container', children: [] } as ContainerBlock,
        permissionContext
      )

      const blocks = section.blocks
        .filter((block) => evaluateCardVisibility(block.visibleWhen, data))
        .map((block) => {
          const permission = resolveCardBlockPermission(block, permissionContext)
          const width = 'width' in block ? block.width : getDefaultWidth(block.type)
          return {
            id: block.id,
            type: block.type,
            canView: permission.canView && sectionPermission.canView,
            canEdit: permission.canEdit && sectionPermission.canEdit,
            visible: true,
            width: width ?? getDefaultWidth(block.type),
          } as CardBlockRuntimeContract
        })

      return {
        id: section.id,
        title: section.title,
        order: section.order,
        visible: true,
        layout: section.layout ?? 'grid',
        columns: section.columns ?? 3,
        gap: section.gap ?? 4,
        blocks,
      }
    })
}

/**
 * Validate card layout schema
 */
export function validateCardLayoutSchema(schema: CardLayoutSchema): string[] {
  const errors: string[] = []

  if (!schema.id) {
    errors.push('Schema id is required')
  }

  if (!schema.version?.version) {
    errors.push('Schema version is required')
  }

  schema.sections.forEach((section, sectionIndex) => {
    if (!section.id) {
      errors.push(`Section ${sectionIndex} id is required`)
    }

    section.blocks.forEach((block, blockIndex) => {
      if (!block.id) {
        errors.push(`Section ${section.id}, block ${blockIndex} id is required`)
      }

      if (block.type === 'chart' && !(block as ChartCardBlock).chartType) {
        errors.push(`Block ${block.id} must specify chartType for type 'chart'`)
      }

      if (block.type === 'quick-entry') {
        const quickEntryBlock = block as QuickEntryBlock
        if (!quickEntryBlock.entries || quickEntryBlock.entries.length === 0) {
          errors.push(`Quick entry block ${block.id} must have entries`)
        }
      }

      if (block.type === 'container') {
        const containerBlock = block as ContainerBlock
        if (!containerBlock.children || containerBlock.children.length === 0) {
          errors.push(`Container block ${block.id} must have children`)
        }
      }
    })
  })

  return errors
}

/**
 * Create default card layout schema for workbench
 */
export function createDefaultCardLayoutSchema(): CardLayoutSchema {
  return {
    id: 'default-workbench',
    title: 'Workbench',
    version: {
      version: '1.0.0',
      publishedAt: new Date().toISOString(),
    },
    sections: [
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        order: 1,
        layout: 'grid',
        columns: 4,
        gap: 4,
        blocks: [
          {
            id: 'quick-entry-main',
            type: 'quick-entry',
            title: 'Quick Entry',
            entries: [
              {
                id: 'new-request',
                label: 'New Request',
                icon: 'quick-entry',
              },
            ],
            layout: 'grid',
            columns: 4,
            width: 'full',
          },
        ],
      },
      {
        id: 'metrics',
        title: 'Key Metrics',
        order: 2,
        layout: 'grid',
        columns: 4,
        gap: 4,
        blocks: [],
      },
      {
        id: 'charts',
        title: 'Charts',
        order: 3,
        layout: 'grid',
        columns: 2,
        gap: 4,
        blocks: [],
      },
      {
        id: 'todos',
        title: 'Tasks',
        order: 4,
        layout: 'grid',
        columns: 2,
        gap: 4,
        blocks: [],
      },
    ],
  }
}
