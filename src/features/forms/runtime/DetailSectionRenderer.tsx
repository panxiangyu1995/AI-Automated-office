import { useMemo, type ReactNode, type ComponentType } from 'react'
import {
  type DetailSectionSchema,
  type DetailBlock,
  type FieldBlock,
  type AttachmentBlock,
  type RelationBlock,
  type TimelineBlock,
  type GroupBlock,
  buildDetailSectionRuntimeContract,
  evaluateBlockVisibility,
  resolveBlockPermission,
} from './detailSectionSchema'
import type { FormFieldSchema, FieldPermission } from './formSchema'

/**
 * Props for DetailSectionRenderer
 */
export interface DetailSectionRendererProps {
  schema: DetailSectionSchema
  data: Record<string, unknown>
  permissionContext?: FieldPermission
  onFieldClick?: (fieldId: string) => void
  onRelationClick?: (relationId: string, relationType: string) => void
  onAttachmentClick?: (attachmentId: string) => void
  customRenderers?: Partial<CustomRenderers>
}

/**
 * Custom renderers for extending default behavior
 */
export interface CustomRenderers {
  field: ComponentType<FieldBlockProps>
  attachment: ComponentType<AttachmentBlockProps>
  relation: ComponentType<RelationBlockProps>
  timeline: ComponentType<TimelineBlockProps>
  group: ComponentType<GroupBlockProps>
}

/**
 * Props for field block renderer
 */
export interface FieldBlockProps {
  block: FieldBlock
  field?: FormFieldSchema
  value: unknown
  canView: boolean
  canEdit: boolean
  onClick?: () => void
}

/**
 * Props for attachment block renderer
 */
export interface AttachmentBlockProps {
  block: AttachmentBlock
  attachments: unknown[]
  canView: boolean
  canEdit: boolean
  onClick?: (id: string) => void
}

/**
 * Props for relation block renderer
 */
export interface RelationBlockProps {
  block: RelationBlock
  relations: unknown[]
  canView: boolean
  canEdit: boolean
  onClick?: (id: string, type: string) => void
}

/**
 * Props for timeline block renderer
 */
export interface TimelineBlockProps {
  block: TimelineBlock
  events: TimelineEvent[]
  canView: boolean
  canEdit: boolean
}

/**
 * Timeline event structure
 */
export interface TimelineEvent {
  id: string
  date: string
  title: string
  description?: string
}

/**
 * Props for group block renderer
 */
export interface GroupBlockProps {
  block: GroupBlock
  children: ReactNode
  canView: boolean
  canEdit: boolean
}

/**
 * Main Detail Section Renderer Component
 */
export function DetailSectionRenderer({
  schema,
  data,
  permissionContext = { canView: true, canEdit: true },
  onFieldClick,
  onRelationClick,
  onAttachmentClick,
  customRenderers,
}: DetailSectionRendererProps) {
  const runtimeSections = useMemo(
    () => buildDetailSectionRuntimeContract(schema, data, permissionContext),
    [schema, data, permissionContext]
  )

  const fieldMap = useMemo(() => {
    const map = new Map<string, FormFieldSchema>()
    schema.fields.forEach((field) => map.set(field.id, field))
    return map
  }, [schema.fields])

  return (
    <div className="detail-section-renderer space-y-6" data-schema-id={schema.id}>
      {schema.title && (
        <h2 className="text-lg font-semibold text-slate-900">{schema.title}</h2>
      )}

      {runtimeSections.map((runtimeSection) => {
        const section = schema.sections.find((s) => s.id === runtimeSection.id)
        if (!section) return null

        return (
          <section
            key={section.id}
            className="detail-section space-y-4"
            data-section-id={section.id}
          >
            {section.title && (
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">
                {section.title}
              </h3>
            )}

            <div
              className={`detail-section-content ${
                section.layout === 'grid'
                  ? `grid gap-4 md:grid-cols-${section.columns ?? 2}`
                  : section.layout === 'horizontal'
                    ? 'flex flex-row gap-4 flex-wrap'
                    : 'flex flex-col gap-4'
              }`}
            >
              {section.blocks.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  data={data}
                  fieldMap={fieldMap}
                  permissionContext={permissionContext}
                  onFieldClick={onFieldClick}
                  onRelationClick={onRelationClick}
                  onAttachmentClick={onAttachmentClick}
                  customRenderers={customRenderers}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Block Renderer - Routes to appropriate block type renderer
 */
function BlockRenderer({
  block,
  data,
  fieldMap,
  permissionContext,
  onFieldClick,
  onRelationClick,
  onAttachmentClick,
  customRenderers,
}: {
  block: DetailBlock
  data: Record<string, unknown>
  fieldMap: Map<string, FormFieldSchema>
  permissionContext: FieldPermission
  onFieldClick?: (fieldId: string) => void
  onRelationClick?: (relationId: string, relationType: string) => void
  onAttachmentClick?: (attachmentId: string) => void
  customRenderers?: Partial<CustomRenderers>
}): ReactNode {
  const permission = resolveBlockPermission(block, permissionContext)

  if (!permission.canView) return null

  if (!evaluateBlockVisibility(block.visibleWhen, data)) return null

  switch (block.type) {
    case 'field':
      return (
        <FieldBlockRenderer
          block={block}
          data={data}
          fieldMap={fieldMap}
          permission={permission}
          onFieldClick={onFieldClick}
          customRenderer={customRenderers?.field}
        />
      )

    case 'attachment':
      return (
        <AttachmentBlockRenderer
          block={block}
          data={data}
          permission={permission}
          onAttachmentClick={onAttachmentClick}
          customRenderer={customRenderers?.attachment}
        />
      )

    case 'relation':
      return (
        <RelationBlockRenderer
          block={block}
          data={data}
          permission={permission}
          onRelationClick={onRelationClick}
          customRenderer={customRenderers?.relation}
        />
      )

    case 'timeline':
      return (
        <TimelineBlockRenderer
          block={block}
          data={data}
          permission={permission}
          customRenderer={customRenderers?.timeline}
        />
      )

    case 'divider':
      return <DividerBlockRenderer block={block} />

    case 'group':
      return (
        <GroupBlockRenderer
          block={block}
          data={data}
          fieldMap={fieldMap}
          permissionContext={permissionContext}
          onFieldClick={onFieldClick}
          onRelationClick={onRelationClick}
          onAttachmentClick={onAttachmentClick}
          customRenderers={customRenderers}
        />
      )

    default:
      return (
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unsupported block type: {(block as DetailBlock).type}
        </div>
      )
  }
}

/**
 * Field Block Renderer
 */
function FieldBlockRenderer({
  block,
  data,
  fieldMap,
  permission,
  onFieldClick,
  customRenderer,
}: {
  block: FieldBlock
  data: Record<string, unknown>
  fieldMap: Map<string, FormFieldSchema>
  permission: FieldPermission
  onFieldClick?: (fieldId: string) => void
  customRenderer?: ComponentType<FieldBlockProps>
}): ReactNode {
  const field = fieldMap.get(block.fieldId)
  const value = getPathValue(data, block.fieldId)
  const label = block.label ?? field?.label ?? block.fieldId

  if (customRenderer) {
    const CustomRenderer = customRenderer
    return (
      <CustomRenderer
        block={block}
        field={field}
        value={value}
        canView={permission.canView}
        canEdit={permission.canEdit}
        onClick={() => onFieldClick?.(block.fieldId)}
      />
    )
  }

  return (
    <div
      className="field-block flex flex-col gap-1"
      data-field-id={block.fieldId}
      onClick={() => onFieldClick?.(block.fieldId)}
    >
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="text-sm text-slate-900">
        {formatFieldValue(value, field?.type)}
      </div>
    </div>
  )
}

/**
 * Attachment Block Renderer
 */
function AttachmentBlockRenderer({
  block,
  data,
  permission,
  onAttachmentClick,
  customRenderer,
}: {
  block: AttachmentBlock
  data: Record<string, unknown>
  permission: FieldPermission
  onAttachmentClick?: (id: string) => void
  customRenderer?: ComponentType<AttachmentBlockProps>
}): ReactNode {
  const attachments = getAttachments(data, block.bind)

  if (customRenderer) {
    const CustomRenderer = customRenderer
    return (
      <CustomRenderer
        block={block}
        attachments={attachments}
        canView={permission.canView}
        canEdit={permission.canEdit}
        onClick={onAttachmentClick}
      />
    )
  }

  const label = block.label ?? 'Attachments'

  return (
    <div className="attachment-block space-y-2" data-block-id={block.id}>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {attachments.length === 0 ? (
        <div className="text-sm text-slate-400 italic">No attachments</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => {
            const att = attachment as Record<string, unknown>
            const id = String(att.id ?? index)
            const name = String(att.name ?? `Attachment ${index + 1}`)
            return (
              <button
                key={id}
                className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm hover:bg-slate-100"
                onClick={() => onAttachmentClick?.(id)}
              >
                <span className="i-lucide-file h-4 w-4 text-slate-400" />
                {name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Relation Block Renderer
 */
function RelationBlockRenderer({
  block,
  data,
  permission,
  onRelationClick,
  customRenderer,
}: {
  block: RelationBlock
  data: Record<string, unknown>
  permission: FieldPermission
  onRelationClick?: (id: string, type: string) => void
  customRenderer?: ComponentType<RelationBlockProps>
}): ReactNode {
  const relations = getRelations(data, block.bind)

  if (customRenderer) {
    const CustomRenderer = customRenderer
    return (
      <CustomRenderer
        block={block}
        relations={relations}
        canView={permission.canView}
        canEdit={permission.canEdit}
        onClick={onRelationClick}
      />
    )
  }

  const label = block.label ?? 'Related Items'

  return (
    <div className="relation-block space-y-2" data-block-id={block.id}>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {relations.length === 0 ? (
        <div className="text-sm text-slate-400 italic">No related items</div>
      ) : (
        <div className="space-y-1">
          {relations.map((relation, index) => {
            const rel = relation as Record<string, unknown>
            const id = String(rel.id ?? index)
            const displayValue = block.displayFields
              ? block.displayFields.map((f) => String(rel[f] ?? '')).join(' - ')
              : String(rel.name ?? rel.title ?? `Item ${index + 1}`)
            return (
              <button
                key={id}
                className="flex w-full items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                onClick={() => onRelationClick?.(id, block.relationType)}
              >
                <span>{displayValue}</span>
                {block.linkTo && (
                  <span className="i-lucide-external-link h-4 w-4 text-slate-400" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Timeline Block Renderer
 */
function TimelineBlockRenderer({
  block,
  data,
  permission,
  customRenderer,
}: {
  block: TimelineBlock
  data: Record<string, unknown>
  permission: FieldPermission
  customRenderer?: ComponentType<TimelineBlockProps>
}): ReactNode {
  const events = getTimelineEvents(data, block.bind, block)

  if (customRenderer) {
    const CustomRenderer = customRenderer
    return (
      <CustomRenderer
        block={block}
        events={events}
        canView={permission.canView}
        canEdit={permission.canEdit}
      />
    )
  }

  const label = block.label ?? 'Timeline'

  return (
    <div className="timeline-block space-y-2" data-block-id={block.id}>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {events.length === 0 ? (
        <div className="text-sm text-slate-400 italic">No timeline events</div>
      ) : (
        <div className="relative border-l-2 border-slate-200 pl-4 space-y-4">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-slate-300" />
              <div className="text-xs text-slate-500">{event.date}</div>
              <div className="text-sm font-medium text-slate-900">{event.title}</div>
              {event.description && (
                <div className="text-sm text-slate-600">{event.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Divider Block Renderer
 */
function DividerBlockRenderer({ block }: { block: DetailBlock }): ReactNode {
  return (
    <hr
      className="divider-block border-t border-slate-200 my-4"
      data-block-id={block.id}
    />
  )
}

/**
 * Group Block Renderer
 */
function GroupBlockRenderer({
  block,
  data,
  fieldMap,
  permissionContext,
  onFieldClick,
  onRelationClick,
  onAttachmentClick,
  customRenderers,
}: {
  block: GroupBlock
  data: Record<string, unknown>
  fieldMap: Map<string, FormFieldSchema>
  permissionContext: FieldPermission
  onFieldClick?: (fieldId: string) => void
  onRelationClick?: (relationId: string, relationType: string) => void
  onAttachmentClick?: (attachmentId: string) => void
  customRenderers?: Partial<CustomRenderers>
}): ReactNode {
  const permission = resolveBlockPermission(block, permissionContext)

  if (!permission.canView) return null

  if (!evaluateBlockVisibility(block.visibleWhen, data)) return null

  const layoutClass =
    block.layout === 'grid'
      ? `grid gap-4 md:grid-cols-${block.columns ?? 2}`
      : block.layout === 'horizontal'
        ? 'flex flex-row gap-4 flex-wrap'
        : 'flex flex-col gap-4'

  return (
    <div className="group-block space-y-2" data-block-id={block.id}>
      {block.title && (
        <h4 className="text-sm font-medium text-slate-700">{block.title}</h4>
      )}
      <div className={layoutClass}>
        {block.children.map((childBlock) => (
          <BlockRenderer
            key={childBlock.id}
            block={childBlock}
            data={data}
            fieldMap={fieldMap}
            permissionContext={permissionContext}
            onFieldClick={onFieldClick}
            onRelationClick={onRelationClick}
            onAttachmentClick={onAttachmentClick}
            customRenderers={customRenderers}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Helper: Get value from data by path
 */
function getPathValue(data: unknown, path?: string): unknown {
  if (!path) return undefined

  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') {
      return undefined
    }
    return (acc as Record<string, unknown>)[segment]
  }, data)
}

/**
 * Helper: Format field value for display
 */
function formatFieldValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return '-'

  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (type === 'date' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return value
    }
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return String(value)
}

/**
 * Helper: Get attachments from data
 */
function getAttachments(data: unknown, bind?: string): unknown[] {
  const value = getPathValue(data, bind)
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  return []
}

/**
 * Helper: Get relations from data
 */
function getRelations(data: unknown, bind?: string): unknown[] {
  const value = getPathValue(data, bind)
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  return []
}

/**
 * Helper: Get timeline events from data
 */
function getTimelineEvents(
  data: unknown,
  bind: string | undefined,
  block: TimelineBlock
): TimelineEvent[] {
  const value = getPathValue(data, bind)
  if (!Array.isArray(value)) return []

  return value.map((item, index) => {
    const record = item as Record<string, unknown>
    return {
      id: String(record.id ?? index),
      date: String(record[block.dateField ?? 'date'] ?? ''),
      title: String(record[block.titleField ?? 'title'] ?? ''),
      description: block.descriptionField
        ? String(record[block.descriptionField] ?? '')
        : undefined,
    }
  })
}
