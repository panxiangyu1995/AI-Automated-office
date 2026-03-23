/**
 * Detail Section Writeback Module
 * Task 85: Story 49.2 - Detail Section Writeback Adapter
 * 
 * Write normalized Agent results into approved dynamic detail sections.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'

// ============================================================================
// Types
// ============================================================================

/**
 * Detail section block type
 */
export type DetailBlockType =
  | 'field'
  | 'attachment'
  | 'relation'
  | 'timeline'
  | 'summary'
  | 'action'
  | 'divider'

/**
 * Reference to a detail section
 */
export interface DetailSectionReference {
  /** Section ID */
  sectionId: string
  /** Entity type the section belongs to */
  entityType: string
  /** Entity ID the section belongs to */
  entityId: string
  /** Department that owns the section */
  departmentId: string
}

/**
 * Detail block reference
 */
export interface DetailBlockReference {
  /** Block ID */
  blockId: string
  /** Block type */
  blockType: DetailBlockType
  /** Section this block belongs to */
  sectionRef: DetailSectionReference
}

/**
 * Field block content
 */
export interface FieldBlockContent {
  /** Field name/label */
  fieldName: string
  /** Field value */
  fieldValue: unknown
  /** Field data type */
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'reference' | 'array' | 'object'
  /** Is this field read-only? */
  readOnly?: boolean
  /** Display format hint */
  format?: string
}

/**
 * Attachment block content
 */
export interface AttachmentBlockContent {
  /** Attachment ID */
  attachmentId: string
  /** File name */
  fileName: string
  /** File URL or base64 data */
  fileUrl?: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  fileSize: number
  /** Upload timestamp */
  uploadedAt: string
  /** Uploaded by user ID */
  uploadedBy: string
}

/**
 * Relation block content
 */
export interface RelationBlockContent {
  /** Relation ID */
  relationId: string
  /** Related entity type */
  relatedEntityType: string
  /** Related entity ID */
  relatedEntityId: string
  /** Related entity display name */
  relatedEntityName: string
  /** Relation type (e.g., 'parent', 'child', 'reference') */
  relationType: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Timeline event
 */
export interface TimelineEvent {
  /** Event ID */
  eventId: string
  /** Event timestamp */
  timestamp: string
  /** Event type */
  eventType: string
  /** Event title */
  title: string
  /** Event description */
  description?: string
  /** User who triggered the event */
  userId?: string
  /** User display name */
  userName?: string
  /** Additional event data */
  data?: Record<string, unknown>
}

/**
 * Timeline block content
 */
export interface TimelineBlockContent {
  /** Timeline events */
  events: TimelineEvent[]
  /** Timeline context (e.g., entity history) */
  context?: string
}

/**
 * Summary block content
 */
export interface SummaryBlockContent {
  /** Summary title */
  title: string
  /** Summary content */
  content: string
  /** Summary format (plain, markdown, html) */
  format: 'plain' | 'markdown' | 'html'
  /** Key metrics */
  metrics?: Array<{
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
  }>
}

/**
 * Action block content
 */
export interface ActionBlockContent {
  /** Action ID */
  actionId: string
  /** Action label */
  label: string
  /** Action type (button, link, etc.) */
  actionType: 'button' | 'link' | 'api' | 'workflow'
  /** Action target URL or handler */
  target?: string
  /** Is action enabled? */
  enabled: boolean
  /** Confirmation required? */
  requireConfirmation?: boolean
}

/**
 * Block content union type
 */
export type DetailBlockContent =
  | FieldBlockContent
  | AttachmentBlockContent
  | RelationBlockContent
  | TimelineBlockContent
  | SummaryBlockContent
  | ActionBlockContent

/**
 * Block update operation
 */
export interface DetailBlockUpdate {
  /** Update ID */
  updateId: string
  /** Block reference */
  blockRef: DetailBlockReference
  /** Operation type */
  operation: 'create' | 'update' | 'delete' | 'append' | 'replace'
  /** New content (for create/update/replace) */
  content?: DetailBlockContent
  /** Content to append (for append operation) */
  appendContent?: TimelineEvent[]
  /** Permission required for this operation */
  requiredPermission: PermissionLevel
  /** Skip permission check? */
  skipPermissionCheck?: boolean
  /** Skip validation? */
  skipValidation?: boolean
}

/**
 * Detail section writeback action
 */
export interface DetailWritebackAction {
  /** Action ID */
  actionId: string
  /** Session ID that triggered this action */
  sessionId: string
  /** Section reference */
  sectionRef: DetailSectionReference
  /** Block updates in this action */
  updates: DetailBlockUpdate[]
  /** Action status */
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed' | 'partial'
  /** Created timestamp */
  createdAt: string
  /** Completed timestamp */
  completedAt?: string
  /** Error message if failed */
  error?: string
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Writeback contract for detail section
 */
export interface DetailWritebackContract {
  /** Contract ID */
  contractId: string
  /** Section reference */
  sectionRef: DetailSectionReference
  /** Allowed block types for this section */
  allowedBlockTypes: DetailBlockType[]
  /** Maximum number of blocks */
  maxBlocks?: number
  /** Permission requirements */
  permissions: {
    /** Default permission for new blocks */
    defaultPermission: PermissionLevel
    /** Block-specific permissions */
    blockPermissions?: Record<DetailBlockType, PermissionLevel>
  }
  /** Validation rules */
  validationRules?: DetailValidationRule[]
  /** Created timestamp */
  createdAt: string
  /** Created by user ID */
  createdBy: string
}

/**
 * Validation rule for detail content
 */
export interface DetailValidationRule {
  /** Rule ID */
  ruleId: string
  /** Block type this rule applies to */
  blockType: DetailBlockType
  /** Rule type */
  ruleType: 'required' | 'format' | 'size' | 'custom'
  /** Rule configuration */
  config: Record<string, unknown>
  /** Error message */
  errorMessage: string
}

/**
 * Writeback result for a single block
 */
export interface DetailWritebackResult {
  /** Update ID */
  updateId: string
  /** Block ID */
  blockId: string
  /** Success? */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Warnings */
  warnings?: string[]
  /** Actual content written */
  writtenContent?: DetailBlockContent
}

/**
 * Overall writeback result
 */
export interface DetailWritebackOutcome {
  /** Action ID */
  actionId: string
  /** Overall success */
  success: boolean
  /** Individual block results */
  blockResults: DetailWritebackResult[]
  /** Total blocks processed */
  totalBlocks: number
  /** Successful blocks */
  successfulBlocks: number
  /** Failed blocks */
  failedBlocks: number
  /** Completed timestamp */
  completedAt: string
}

/**
 * Trace entry for writeback operation
 */
export interface DetailWritebackTrace {
  /** Trace ID */
  traceId: string
  /** Action ID */
  actionId: string
  /** Timestamp */
  timestamp: string
  /** Operation type */
  operation: string
  /** Block ID */
  blockId: string
  /** Status */
  status: 'started' | 'completed' | 'failed' | 'skipped'
  /** Details */
  details?: string
  /** Duration in milliseconds */
  durationMs?: number
}

/**
 * Detail section writeback store
 */
export interface DetailWritebackStore {
  /** Contracts by section ID */
  contracts: Map<string, DetailWritebackContract>
  /** Actions by action ID */
  actions: Map<string, DetailWritebackAction>
  /** Outcomes by action ID */
  outcomes: Map<string, DetailWritebackOutcome>
  /** Traces by action ID */
  traces: Map<string, DetailWritebackTrace[]>
}

// ============================================================================
// ID Generation
// ============================================================================

let updateCounter = 0
let actionCounter = 0
let contractCounter = 0
let traceCounter = 0
let eventIdCounter = 0

export function generateUpdateId(): string {
  return `dbu_${Date.now()}_${++updateCounter}`
}

export function generateDetailActionId(): string {
  return `dwa_${Date.now()}_${++actionCounter}`
}

export function generateDetailContractId(): string {
  return `dwc_${Date.now()}_${++contractCounter}`
}

export function generateDetailTraceId(): string {
  return `dwt_${Date.now()}_${++traceCounter}`
}

export function generateTimelineEventId(): string {
  return `tle_${Date.now()}_${++eventIdCounter}`
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDetailSectionReference(
  sectionId: string,
  entityType: string,
  entityId: string,
  departmentId: string
): DetailSectionReference {
  return {
    sectionId,
    entityType,
    entityId,
    departmentId,
  }
}

export function createDetailBlockReference(
  blockId: string,
  blockType: DetailBlockType,
  sectionRef: DetailSectionReference
): DetailBlockReference {
  return {
    blockId,
    blockType,
    sectionRef,
  }
}

export function createFieldBlockContent(
  fieldName: string,
  fieldValue: unknown,
  dataType: FieldBlockContent['dataType'],
  options?: { readOnly?: boolean; format?: string }
): FieldBlockContent {
  return {
    fieldName,
    fieldValue,
    dataType,
    readOnly: options?.readOnly,
    format: options?.format,
  }
}

export function createAttachmentBlockContent(
  attachmentId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  uploadedAt: string,
  uploadedBy: string,
  fileUrl?: string
): AttachmentBlockContent {
  return {
    attachmentId,
    fileName,
    mimeType,
    fileSize,
    uploadedAt,
    uploadedBy,
    fileUrl,
  }
}

export function createRelationBlockContent(
  relationId: string,
  relatedEntityType: string,
  relatedEntityId: string,
  relatedEntityName: string,
  relationType: string,
  metadata?: Record<string, unknown>
): RelationBlockContent {
  return {
    relationId,
    relatedEntityType,
    relatedEntityId,
    relatedEntityName,
    relationType,
    metadata,
  }
}

export function createTimelineEvent(
  eventType: string,
  title: string,
  options?: {
    eventId?: string
    timestamp?: string
    description?: string
    userId?: string
    userName?: string
    data?: Record<string, unknown>
  }
): TimelineEvent {
  return {
    eventId: options?.eventId ?? generateTimelineEventId(),
    timestamp: options?.timestamp ?? new Date().toISOString(),
    eventType,
    title,
    description: options?.description,
    userId: options?.userId,
    userName: options?.userName,
    data: options?.data,
  }
}

export function createTimelineBlockContent(
  events: TimelineEvent[],
  context?: string
): TimelineBlockContent {
  return {
    events,
    context,
  }
}

export function createSummaryBlockContent(
  title: string,
  content: string,
  format: SummaryBlockContent['format'],
  metrics?: SummaryBlockContent['metrics']
): SummaryBlockContent {
  return {
    title,
    content,
    format,
    metrics,
  }
}

export function createActionBlockContent(
  actionId: string,
  label: string,
  actionType: ActionBlockContent['actionType'],
  enabled: boolean,
  options?: {
    target?: string
    requireConfirmation?: boolean
  }
): ActionBlockContent {
  return {
    actionId,
    label,
    actionType,
    enabled,
    target: options?.target,
    requireConfirmation: options?.requireConfirmation,
  }
}

export function createDetailBlockUpdate(
  blockRef: DetailBlockReference,
  operation: DetailBlockUpdate['operation'],
  options?: {
    content?: DetailBlockContent
    appendContent?: TimelineEvent[]
    requiredPermission?: PermissionLevel
    skipPermissionCheck?: boolean
    skipValidation?: boolean
  }
): DetailBlockUpdate {
  return {
    updateId: generateUpdateId(),
    blockRef,
    operation,
    content: options?.content,
    appendContent: options?.appendContent,
    requiredPermission: options?.requiredPermission ?? 'write',
    skipPermissionCheck: options?.skipPermissionCheck,
    skipValidation: options?.skipValidation,
  }
}

export function createDetailWritebackAction(
  sessionId: string,
  sectionRef: DetailSectionReference,
  updates: DetailBlockUpdate[]
): DetailWritebackAction {
  return {
    actionId: generateDetailActionId(),
    sessionId,
    sectionRef,
    updates,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

export function createDetailWritebackContract(
  sectionRef: DetailSectionReference,
  allowedBlockTypes: DetailBlockType[],
  createdBy: string,
  options?: {
    maxBlocks?: number
    defaultPermission?: PermissionLevel
    blockPermissions?: Record<DetailBlockType, PermissionLevel>
    validationRules?: DetailValidationRule[]
  }
): DetailWritebackContract {
  return {
    contractId: generateDetailContractId(),
    sectionRef,
    allowedBlockTypes,
    maxBlocks: options?.maxBlocks,
    permissions: {
      defaultPermission: options?.defaultPermission ?? 'write',
      blockPermissions: options?.blockPermissions,
    },
    validationRules: options?.validationRules,
    createdAt: new Date().toISOString(),
    createdBy,
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check if user has permission to perform operation on block type
 */
export function checkDetailPermission(
  contract: DetailWritebackContract,
  blockType: DetailBlockType,
  userPermission: PermissionLevel
): boolean {
  const requiredPermission =
    contract.permissions.blockPermissions?.[blockType] ??
    contract.permissions.defaultPermission

  return permissionSatisfies(userPermission, requiredPermission)
}

/**
 * Check if block type is allowed in section
 */
export function isBlockTypeAllowed(
  contract: DetailWritebackContract,
  blockType: DetailBlockType
): boolean {
  return contract.allowedBlockTypes.includes(blockType)
}

/**
 * Validate block content against validation rules
 */
export function validateDetailBlockContent(
  content: DetailBlockContent,
  blockType: DetailBlockType,
  rules: DetailValidationRule[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const applicableRules = rules.filter((r) => r.blockType === blockType)

  for (const rule of applicableRules) {
    switch (rule.ruleType) {
      case 'required':
        if (blockType === 'field') {
          const fieldContent = content as FieldBlockContent
          if (fieldContent.fieldValue === undefined || fieldContent.fieldValue === null) {
            errors.push(rule.errorMessage)
          }
        }
        break

      case 'format':
        if (blockType === 'field') {
          const fieldContent = content as FieldBlockContent
          if (typeof fieldContent.fieldValue === 'string' && rule.config.pattern) {
            const regex = new RegExp(rule.config.pattern as string)
            if (!regex.test(fieldContent.fieldValue)) {
              errors.push(rule.errorMessage)
            }
          }
        }
        break

      case 'size':
        if (blockType === 'attachment') {
          const attachmentContent = content as AttachmentBlockContent
          const maxSize = rule.config.maxSize as number | undefined
          if (maxSize !== undefined && attachmentContent.fileSize > maxSize) {
            errors.push(rule.errorMessage)
          }
        }
        break

      case 'custom':
        // Custom validation - just pass for now, actual logic would be provided
        break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Writeback Execution
// ============================================================================

/**
 * Execute writeback for a single block update
 */
export function executeDetailBlockUpdate(
  update: DetailBlockUpdate,
  contract: DetailWritebackContract,
  existingBlocks: Map<string, DetailBlockContent>
): DetailWritebackResult {
  const result: DetailWritebackResult = {
    updateId: update.updateId,
    blockId: update.blockRef.blockId,
    success: false,
  }

  // Check block type is allowed
  if (!isBlockTypeAllowed(contract, update.blockRef.blockType)) {
    result.error = `Block type '${update.blockRef.blockType}' is not allowed in this section`
    return result
  }

  // Validate content if provided
  if (update.content && !update.skipValidation && contract.validationRules) {
    const validation = validateDetailBlockContent(
      update.content,
      update.blockRef.blockType,
      contract.validationRules
    )
    if (!validation.valid) {
      result.error = validation.errors.join('; ')
      return result
    }
  }

  // Execute operation
  switch (update.operation) {
    case 'create': {
      if (existingBlocks.has(update.blockRef.blockId)) {
        result.error = `Block '${update.blockRef.blockId}' already exists`
        return result
      }
      if (update.content) {
        existingBlocks.set(update.blockRef.blockId, update.content)
        result.success = true
        result.writtenContent = update.content
      } else {
        result.error = 'No content provided for create operation'
        return result
      }
      break
    }

    case 'update': {
      if (!existingBlocks.has(update.blockRef.blockId)) {
        result.error = `Block '${update.blockRef.blockId}' does not exist`
        return result
      }
      if (update.content) {
        existingBlocks.set(update.blockRef.blockId, update.content)
        result.success = true
        result.writtenContent = update.content
      } else {
        result.error = 'No content provided for update operation'
        return result
      }
      break
    }

    case 'delete': {
      if (!existingBlocks.has(update.blockRef.blockId)) {
        result.error = `Block '${update.blockRef.blockId}' does not exist`
        return result
      }
      existingBlocks.delete(update.blockRef.blockId)
      result.success = true
      break
    }

    case 'append': {
      if (update.blockRef.blockType !== 'timeline') {
        result.error = 'Append operation only supported for timeline blocks'
        return result
      }
      const existing = existingBlocks.get(update.blockRef.blockId)
      if (!existing) {
        result.error = `Block '${update.blockRef.blockId}' does not exist`
        return result
      }
      const timelineContent = existing as TimelineBlockContent
      if (update.appendContent) {
        timelineContent.events.push(...update.appendContent)
        result.success = true
        result.writtenContent = timelineContent
      } else {
        result.error = 'No append content provided'
        return result
      }
      break
    }

    case 'replace': {
      if (update.content) {
        existingBlocks.set(update.blockRef.blockId, update.content)
        result.success = true
        result.writtenContent = update.content
      } else {
        result.error = 'No content provided for replace operation'
        return result
      }
      break
    }
  }

  return result
}

/**
 * Execute full detail section writeback action
 */
export function executeDetailWriteback(
  action: DetailWritebackAction,
  contract: DetailWritebackContract,
  userPermission: PermissionLevel,
  options?: {
    existingBlocks?: Map<string, DetailBlockContent>
    dryRun?: boolean
  }
): {
  outcome: DetailWritebackOutcome
  traces: DetailWritebackTrace[]
  blocks: Map<string, DetailBlockContent>
} {
  const existingBlocks = options?.existingBlocks ?? new Map<string, DetailBlockContent>()
  const traces: DetailWritebackTrace[] = []
  const blockResults: DetailWritebackResult[] = []

  // Update action status
  action.status = 'validating'

  for (const update of action.updates) {
    const startTime = Date.now()

    // Create trace entry
    const trace: DetailWritebackTrace = {
      traceId: generateDetailTraceId(),
      actionId: action.actionId,
      timestamp: new Date().toISOString(),
      operation: update.operation,
      blockId: update.blockRef.blockId,
      status: 'started',
    }
    traces.push(trace)

    // Check permission
    if (!update.skipPermissionCheck) {
      if (!checkDetailPermission(contract, update.blockRef.blockType, userPermission)) {
        trace.status = 'skipped'
        trace.details = 'Permission denied'
        trace.durationMs = Date.now() - startTime
        blockResults.push({
          updateId: update.updateId,
          blockId: update.blockRef.blockId,
          success: false,
          error: 'Permission denied',
        })
        continue
      }
    }

    // Execute (skip if dry run)
    if (options?.dryRun) {
      trace.status = 'completed'
      trace.details = 'Dry run - no actual changes'
      trace.durationMs = Date.now() - startTime
      blockResults.push({
        updateId: update.updateId,
        blockId: update.blockRef.blockId,
        success: true,
        warnings: ['Dry run - no actual changes made'],
      })
      continue
    }

    const result = executeDetailBlockUpdate(update, contract, existingBlocks)
    blockResults.push(result)

    trace.status = result.success ? 'completed' : 'failed'
    trace.details = result.error
    trace.durationMs = Date.now() - startTime
  }

  // Determine overall status
  const successCount = blockResults.filter((r) => r.success).length
  const failCount = blockResults.length - successCount

  let status: DetailWritebackAction['status']
  if (successCount === blockResults.length) {
    status = 'completed'
  } else if (successCount === 0) {
    status = 'failed'
  } else {
    status = 'partial'
  }

  action.status = status
  action.completedAt = new Date().toISOString()

  const outcome: DetailWritebackOutcome = {
    actionId: action.actionId,
    success: status === 'completed',
    blockResults,
    totalBlocks: blockResults.length,
    successfulBlocks: successCount,
    failedBlocks: failCount,
    completedAt: new Date().toISOString(),
  }

  return {
    outcome,
    traces,
    blocks: existingBlocks,
  }
}

// ============================================================================
// Store Operations
// ============================================================================

export function createDetailWritebackStore(): DetailWritebackStore {
  return {
    contracts: new Map(),
    actions: new Map(),
    outcomes: new Map(),
    traces: new Map(),
  }
}

export function registerDetailContract(
  store: DetailWritebackStore,
  contract: DetailWritebackContract
): void {
  store.contracts.set(contract.sectionRef.sectionId, contract)
}

export function getDetailContract(
  store: DetailWritebackStore,
  sectionId: string
): DetailWritebackContract | undefined {
  return store.contracts.get(sectionId)
}

export function addDetailAction(
  store: DetailWritebackStore,
  action: DetailWritebackAction
): void {
  store.actions.set(action.actionId, action)
}

export function getDetailAction(
  store: DetailWritebackStore,
  actionId: string
): DetailWritebackAction | undefined {
  return store.actions.get(actionId)
}

export function getDetailActionsBySection(
  store: DetailWritebackStore,
  sectionId: string
): DetailWritebackAction[] {
  return Array.from(store.actions.values()).filter(
    (a) => a.sectionRef.sectionId === sectionId
  )
}

export function getDetailActionsBySession(
  store: DetailWritebackStore,
  sessionId: string
): DetailWritebackAction[] {
  return Array.from(store.actions.values()).filter(
    (a) => a.sessionId === sessionId
  )
}

export function addDetailOutcome(
  store: DetailWritebackStore,
  outcome: DetailWritebackOutcome
): void {
  store.outcomes.set(outcome.actionId, outcome)
}

export function getDetailOutcome(
  store: DetailWritebackStore,
  actionId: string
): DetailWritebackOutcome | undefined {
  return store.outcomes.get(actionId)
}

export function addDetailTraces(
  store: DetailWritebackStore,
  actionId: string,
  traces: DetailWritebackTrace[]
): void {
  const existing = store.traces.get(actionId) ?? []
  existing.push(...traces)
  store.traces.set(actionId, existing)
}

export function getDetailTraces(
  store: DetailWritebackStore,
  actionId: string
): DetailWritebackTrace[] {
  return store.traces.get(actionId) ?? []
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeDetailSectionRef(ref: DetailSectionReference): string {
  return JSON.stringify(ref)
}

export function deserializeDetailSectionRef(json: string): DetailSectionReference {
  return JSON.parse(json) as DetailSectionReference
}

export function serializeDetailBlockRef(ref: DetailBlockReference): string {
  return JSON.stringify(ref)
}

export function deserializeDetailBlockRef(json: string): DetailBlockReference {
  return JSON.parse(json) as DetailBlockReference
}

export function serializeDetailAction(action: DetailWritebackAction): string {
  return JSON.stringify(action)
}

export function deserializeDetailAction(json: string): DetailWritebackAction {
  return JSON.parse(json) as DetailWritebackAction
}

export function serializeDetailContract(contract: DetailWritebackContract): string {
  return JSON.stringify(contract)
}

export function deserializeDetailContract(json: string): DetailWritebackContract {
  return JSON.parse(json) as DetailWritebackContract
}

export function serializeDetailOutcome(outcome: DetailWritebackOutcome): string {
  return JSON.stringify(outcome)
}

export function deserializeDetailOutcome(json: string): DetailWritebackOutcome {
  return JSON.parse(json) as DetailWritebackOutcome
}

export function serializeDetailWritebackStore(store: DetailWritebackStore): string {
  return JSON.stringify({
    contracts: Array.from(store.contracts.entries()),
    actions: Array.from(store.actions.entries()),
    outcomes: Array.from(store.outcomes.entries()),
    traces: Array.from(store.traces.entries()),
  })
}

export function deserializeDetailWritebackStore(json: string): DetailWritebackStore {
  const data = JSON.parse(json)
  return {
    contracts: new Map(data.contracts),
    actions: new Map(data.actions),
    outcomes: new Map(data.outcomes),
    traces: new Map(data.traces),
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

export function formatDetailSectionRef(ref: DetailSectionReference): string {
  return `DetailSection(${ref.sectionId}, entity=${ref.entityType}:${ref.entityId})`
}

export function formatDetailBlockRef(ref: DetailBlockReference): string {
  return `DetailBlock(${ref.blockId}, type=${ref.blockType})`
}

export function formatDetailBlockContent(
  content: DetailBlockContent,
  blockType: DetailBlockType
): string {
  switch (blockType) {
    case 'field': {
      const fc = content as FieldBlockContent
      return `Field(${fc.fieldName}=${JSON.stringify(fc.fieldValue)})`
    }
    case 'attachment': {
      const ac = content as AttachmentBlockContent
      return `Attachment(${ac.fileName}, ${ac.mimeType}, ${ac.fileSize} bytes)`
    }
    case 'relation': {
      const rc = content as RelationBlockContent
      return `Relation(${rc.relationType}: ${rc.relatedEntityName})`
    }
    case 'timeline': {
      const tc = content as TimelineBlockContent
      return `Timeline(${tc.events.length} events)`
    }
    case 'summary': {
      const sc = content as SummaryBlockContent
      return `Summary(${sc.title})`
    }
    case 'action': {
      const ac = content as ActionBlockContent
      return `Action(${ac.label}, ${ac.actionType})`
    }
    case 'divider':
      return 'Divider'
    default:
      return `Unknown(${blockType})`
  }
}

export function formatDetailWritebackResult(result: DetailWritebackResult): string {
  const status = result.success ? 'SUCCESS' : 'FAILED'
  const parts = [`${status} block=${result.blockId}`]
  if (result.error) parts.push(`error=${result.error}`)
  if (result.warnings?.length) parts.push(`warnings=${result.warnings.length}`)
  return parts.join(', ')
}

export function formatDetailWritebackOutcome(outcome: DetailWritebackOutcome): string {
  const status = outcome.success ? 'SUCCESS' : outcome.failedBlocks > 0 ? 'PARTIAL' : 'FAILED'
  return `${status}: ${outcome.successfulBlocks}/${outcome.totalBlocks} blocks updated`
}

export function formatDetailTrace(trace: DetailWritebackTrace): string {
  const parts = [
    `[${trace.timestamp}]`,
    trace.operation,
    `block=${trace.blockId}`,
    trace.status,
  ]
  if (trace.durationMs !== undefined) parts.push(`${trace.durationMs}ms`)
  if (trace.details) parts.push(`(${trace.details})`)
  return parts.join(' ')
}
