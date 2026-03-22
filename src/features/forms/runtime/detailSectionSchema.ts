import type { FormFieldSchema, FieldPermission } from './formSchema'

// Re-export FieldPermission for consumers
export type { FieldPermission }

/**
 * Detail Section Block Types
 */
export type DetailBlockType = 'field' | 'attachment' | 'relation' | 'timeline' | 'divider' | 'group'

/**
 * Field Block - Displays a single field value
 */
export interface FieldBlock {
  id: string
  type: 'field'
  fieldId: string
  label?: string
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Attachment Block - Displays file attachments
 */
export interface AttachmentBlock {
  id: string
  type: 'attachment'
  label?: string
  bind?: string
  maxCount?: number
  acceptTypes?: string[]
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Relation Block - Displays related entities
 */
export interface RelationBlock {
  id: string
  type: 'relation'
  label?: string
  bind?: string
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many'
  displayFields?: string[]
  linkTo?: string
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Timeline Block - Displays activity timeline
 */
export interface TimelineBlock {
  id: string
  type: 'timeline'
  label?: string
  bind?: string
  dateField?: string
  titleField?: string
  descriptionField?: string
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
 * Group Block - Container for nested blocks
 */
export interface GroupBlock {
  id: string
  type: 'group'
  title?: string
  layout?: 'vertical' | 'horizontal' | 'grid'
  columns?: number
  children: DetailBlock[]
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Union type for all detail blocks
 */
export type DetailBlock = FieldBlock | AttachmentBlock | RelationBlock | TimelineBlock | DividerBlock | GroupBlock

/**
 * Detail Section - A named section containing blocks
 */
export interface DetailSection {
  id: string
  title?: string
  order: number
  layout?: 'vertical' | 'horizontal' | 'grid'
  columns?: number
  blocks: DetailBlock[]
  visibleWhen?: string
  requiredPermission?: 'view' | 'edit'
}

/**
 * Detail Section Schema - Complete schema for detail page
 */
export interface DetailSectionSchema {
  id: string
  title?: string
  version: {
    version: string
    publishedAt?: string
  }
  sections: DetailSection[]
  fields: FormFieldSchema[]
}

/**
 * Runtime Contract for rendering blocks
 */
export interface DetailBlockRuntimeContract {
  id: string
  type: DetailBlockType
  canView: boolean
  canEdit: boolean
  visible: boolean
}

/**
 * Runtime Contract for rendering sections
 */
export interface DetailSectionRuntimeContract {
  id: string
  title?: string
  order: number
  visible: boolean
  blocks: DetailBlockRuntimeContract[]
}

/**
 * Resolve block permission
 */
export function resolveBlockPermission(
  block: DetailBlock,
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
export function evaluateBlockVisibility(
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
 * Build runtime contract for detail sections
 */
export function buildDetailSectionRuntimeContract(
  schema: DetailSectionSchema,
  data: unknown,
  permissionContext?: FieldPermission
): DetailSectionRuntimeContract[] {
  return schema.sections
    .filter((section) => evaluateBlockVisibility(section.visibleWhen, data))
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const sectionPermission = resolveBlockPermission(
        { ...section, type: 'group', children: [] } as GroupBlock,
        permissionContext
      )

      const blocks = section.blocks
        .filter((block) => evaluateBlockVisibility(block.visibleWhen, data))
        .map((block) => {
          const permission = resolveBlockPermission(block, permissionContext)
          return {
            id: block.id,
            type: block.type,
            canView: permission.canView && sectionPermission.canView,
            canEdit: permission.canEdit && sectionPermission.canEdit,
            visible: true,
          } as DetailBlockRuntimeContract
        })

      return {
        id: section.id,
        title: section.title,
        order: section.order,
        visible: true,
        blocks,
      }
    })
}

/**
 * Validate detail section schema
 */
export function validateDetailSectionSchema(schema: DetailSectionSchema): string[] {
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

      if (block.type === 'field' && !(block as FieldBlock).fieldId) {
        errors.push(`Block ${block.id} must specify fieldId for type 'field'`)
      }

      if (block.type === 'relation' && !(block as RelationBlock).relationType) {
        errors.push(`Block ${block.id} must specify relationType for type 'relation'`)
      }

      if (block.type === 'group') {
        const groupBlock = block as GroupBlock
        if (!groupBlock.children || groupBlock.children.length === 0) {
          errors.push(`Group block ${block.id} must have children`)
        }
      }
    })
  })

  return errors
}
