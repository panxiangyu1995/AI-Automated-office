/**
 * Workbench Card Writeback Module
 * Task 86: Story 49.3 - Workbench Card Writeback
 * 
 * Generate and update workbench cards through the dynamic host runtime.
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'

// ============================================================================
// Types
// ============================================================================

/**
 * Card size preset
 */
export type CardSize = 'small' | 'medium' | 'large' | 'xlarge' | 'custom'

/**
 * Card visibility level
 */
export type CardVisibility = 'private' | 'team' | 'department' | 'company' | 'public'

/**
 * Card status
 */
export type CardStatus = 'active' | 'archived' | 'draft' | 'hidden'

/**
 * Reference to a workbench card container
 */
export interface CardContainerReference {
  /** Container ID */
  containerId: string
  /** Page/View ID where container exists */
  pageId: string
  /** Department that owns the container */
  departmentId: string
  /** Container type */
  containerType: 'dashboard' | 'workbench' | 'sidebar' | 'panel'
}

/**
 * Reference to a workbench card
 */
export interface CardReference {
  /** Card ID */
  cardId: string
  /** Container reference */
  containerRef: CardContainerReference
  /** Card position index in container */
  position?: number
}

/**
 * Card content block types
 */
export type CardContentType = 
  | 'metric'
  | 'chart'
  | 'list'
  | 'table'
  | 'text'
  | 'action'
  | 'image'
  | 'custom'

/**
 * Metric card content
 */
export interface MetricCardContent {
  /** Metric label */
  label: string
  /** Metric value */
  value: string | number
  /** Previous value for comparison */
  previousValue?: string | number
  /** Change percentage */
  changePercent?: number
  /** Trend direction */
  trend?: 'up' | 'down' | 'stable'
  /** Unit suffix */
  unit?: string
  /** Icon name */
  icon?: string
  /** Color theme */
  color?: string
}

/**
 * Chart card content
 */
export interface ChartCardContent {
  /** Chart type */
  chartType: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter'
  /** Chart title */
  title: string
  /** Chart data series */
  series: Array<{
    name: string
    data: Array<{ x: string | number; y: number }>
    color?: string
  }>
  /** X-axis label */
  xAxisLabel?: string
  /** Y-axis label */
  yAxisLabel?: string
  /** Show legend */
  showLegend?: boolean
  /** Chart options */
  options?: Record<string, unknown>
}

/**
 * List card content item
 */
export interface ListItem {
  /** Item ID */
  id: string
  /** Item title */
  title: string
  /** Item subtitle */
  subtitle?: string
  /** Item status */
  status?: string
  /** Item icon */
  icon?: string
  /** Item action URL */
  actionUrl?: string
  /** Item metadata */
  metadata?: Record<string, unknown>
}

/**
 * List card content
 */
export interface ListCardContent {
  /** List items */
  items: ListItem[]
  /** Show item count */
  showCount?: boolean
  /** List style */
  listStyle?: 'simple' | 'card' | 'compact'
  /** Empty state message */
  emptyMessage?: string
}

/**
 * Table card content
 */
export interface TableCardContent {
  /** Table columns */
  columns: Array<{
    key: string
    label: string
    width?: number | string
    align?: 'left' | 'center' | 'right'
  }>
  /** Table rows */
  rows: Array<Record<string, unknown>>
  /** Enable sorting */
  sortable?: boolean
  /** Enable pagination */
  paginated?: boolean
  /** Page size */
  pageSize?: number
}

/**
 * Text card content
 */
export interface TextCardContent {
  /** Text content */
  content: string
  /** Content format */
  format: 'plain' | 'markdown' | 'html'
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
}

/**
 * Action card content
 */
export interface ActionCardContent {
  /** Action label */
  label: string
  /** Action type */
  actionType: 'primary' | 'secondary' | 'danger' | 'link'
  /** Action target */
  target: string
  /** Icon */
  icon?: string
  /** Confirmation required */
  requireConfirmation?: boolean
  /** Confirmation message */
  confirmationMessage?: string
}

/**
 * Image card content
 */
export interface ImageCardContent {
  /** Image URL */
  url: string
  /** Alt text */
  alt: string
  /** Image caption */
  caption?: string
  /** Fit mode */
  fit?: 'cover' | 'contain' | 'fill'
}

/**
 * Custom card content
 */
export interface CustomCardContent {
  /** Custom component type */
  componentType: string
  /** Component props */
  props: Record<string, unknown>
}

/**
 * Card content union type
 */
export type CardContent =
  | MetricCardContent
  | ChartCardContent
  | ListCardContent
  | TableCardContent
  | TextCardContent
  | ActionCardContent
  | ImageCardContent
  | CustomCardContent

/**
 * Workbench card definition
 */
export interface WorkbenchCard {
  /** Card ID */
  cardId: string
  /** Card title */
  title: string
  /** Card description */
  description?: string
  /** Card size */
  size: CardSize
  /** Custom width (for custom size) */
  customWidth?: number
  /** Custom height (for custom size) */
  customHeight?: number
  /** Card content type */
  contentType: CardContentType
  /** Card content */
  content: CardContent
  /** Card status */
  status: CardStatus
  /** Card visibility */
  visibility: CardVisibility
  /** Card container reference */
  containerRef: CardContainerReference
  /** Position in container */
  position: number
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
  /** Created by user ID */
  createdBy: string
  /** Updated by user ID */
  updatedBy: string
  /** Card tags */
  tags?: string[]
  /** Card metadata */
  metadata?: Record<string, unknown>
}

/**
 * Card update operation
 */
export interface CardUpdateOperation {
  /** Operation ID */
  operationId: string
  /** Card reference */
  cardRef: CardReference
  /** Operation type */
  operation: 'create' | 'update' | 'delete' | 'move' | 'reorder'
  /** Updated card data (for create/update) */
  cardData?: Partial<WorkbenchCard>
  /** New position (for move/reorder) */
  newPosition?: number
  /** Required permission */
  requiredPermission: PermissionLevel
  /** Skip permission check */
  skipPermissionCheck?: boolean
}

/**
 * Card writeback action
 */
export interface CardWritebackAction {
  /** Action ID */
  actionId: string
  /** Session ID */
  sessionId: string
  /** Container reference */
  containerRef: CardContainerReference
  /** Card operations */
  operations: CardUpdateOperation[]
  /** Action status */
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed' | 'partial'
  /** Created timestamp */
  createdAt: string
  /** Completed timestamp */
  completedAt?: string
  /** Error message */
  error?: string
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Card writeback contract
 */
export interface CardWritebackContract {
  /** Contract ID */
  contractId: string
  /** Container reference */
  containerRef: CardContainerReference
  /** Allowed content types */
  allowedContentTypes: CardContentType[]
  /** Maximum cards allowed */
  maxCards?: number
  /** Default card size */
  defaultSize: CardSize
  /** Permission requirements */
  permissions: {
    defaultPermission: PermissionLevel
    contentTypePermissions?: Partial<Record<CardContentType, PermissionLevel>>
  }
  /** Created timestamp */
  createdAt: string
  /** Created by user ID */
  createdBy: string
}

/**
 * Card writeback result
 */
export interface CardWritebackResult {
  /** Operation ID */
  operationId: string
  /** Card ID */
  cardId: string
  /** Success status */
  success: boolean
  /** Error message */
  error?: string
  /** Warnings */
  warnings?: string[]
  /** Resulting card state */
  resultingCard?: WorkbenchCard
}

/**
 * Card writeback outcome
 */
export interface CardWritebackOutcome {
  /** Action ID */
  actionId: string
  /** Overall success */
  success: boolean
  /** Individual results */
  results: CardWritebackResult[]
  /** Total operations */
  totalOperations: number
  /** Successful operations */
  successfulOperations: number
  /** Failed operations */
  failedOperations: number
  /** Completed timestamp */
  completedAt: string
}

/**
 * Card writeback trace entry
 */
export interface CardWritebackTrace {
  /** Trace ID */
  traceId: string
  /** Action ID */
  actionId: string
  /** Timestamp */
  timestamp: string
  /** Operation type */
  operation: string
  /** Card ID */
  cardId: string
  /** Status */
  status: 'started' | 'completed' | 'failed' | 'skipped'
  /** Details */
  details?: string
  /** Duration in ms */
  durationMs?: number
}

/**
 * Card writeback store
 */
export interface CardWritebackStore {
  /** Cards by ID */
  cards: Map<string, WorkbenchCard>
  /** Contracts by container ID */
  contracts: Map<string, CardWritebackContract>
  /** Actions by ID */
  actions: Map<string, CardWritebackAction>
  /** Outcomes by action ID */
  outcomes: Map<string, CardWritebackOutcome>
  /** Traces by action ID */
  traces: Map<string, CardWritebackTrace[]>
}

// ============================================================================
// ID Generation
// ============================================================================

let cardCounter = 0
let operationCounter = 0
let cardActionCounter = 0
let cardContractCounter = 0
let cardTraceCounter = 0

export function generateCardId(): string {
  return `wbc_${Date.now()}_${++cardCounter}`
}

export function generateCardOperationId(): string {
  return `cop_${Date.now()}_${++operationCounter}`
}

export function generateCardActionId(): string {
  return `cwa_${Date.now()}_${++cardActionCounter}`
}

export function generateCardContractId(): string {
  return `cwc_${Date.now()}_${++cardContractCounter}`
}

export function generateCardTraceId(): string {
  return `cwt_${Date.now()}_${++cardTraceCounter}`
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createCardContainerReference(
  containerId: string,
  pageId: string,
  departmentId: string,
  containerType: CardContainerReference['containerType']
): CardContainerReference {
  return {
    containerId,
    pageId,
    departmentId,
    containerType,
  }
}

export function createCardReference(
  cardId: string,
  containerRef: CardContainerReference,
  position?: number
): CardReference {
  return {
    cardId,
    containerRef,
    position,
  }
}

export function createMetricCardContent(
  label: string,
  value: string | number,
  options?: {
    previousValue?: string | number
    changePercent?: number
    trend?: 'up' | 'down' | 'stable'
    unit?: string
    icon?: string
    color?: string
  }
): MetricCardContent {
  return {
    label,
    value,
    previousValue: options?.previousValue,
    changePercent: options?.changePercent,
    trend: options?.trend,
    unit: options?.unit,
    icon: options?.icon,
    color: options?.color,
  }
}

export function createChartCardContent(
  chartType: ChartCardContent['chartType'],
  title: string,
  series: ChartCardContent['series'],
  options?: {
    xAxisLabel?: string
    yAxisLabel?: string
    showLegend?: boolean
    options?: Record<string, unknown>
  }
): ChartCardContent {
  return {
    chartType,
    title,
    series,
    xAxisLabel: options?.xAxisLabel,
    yAxisLabel: options?.yAxisLabel,
    showLegend: options?.showLegend,
    options: options?.options,
  }
}

export function createListCardContent(
  items: ListItem[],
  options?: {
    showCount?: boolean
    listStyle?: 'simple' | 'card' | 'compact'
    emptyMessage?: string
  }
): ListCardContent {
  return {
    items,
    showCount: options?.showCount,
    listStyle: options?.listStyle,
    emptyMessage: options?.emptyMessage,
  }
}

export function createTableCardContent(
  columns: TableCardContent['columns'],
  rows: TableCardContent['rows'],
  options?: {
    sortable?: boolean
    paginated?: boolean
    pageSize?: number
  }
): TableCardContent {
  return {
    columns,
    rows,
    sortable: options?.sortable,
    paginated: options?.paginated,
    pageSize: options?.pageSize,
  }
}

export function createTextCardContent(
  content: string,
  format: TextCardContent['format'],
  options?: { align?: 'left' | 'center' | 'right' }
): TextCardContent {
  return {
    content,
    format,
    align: options?.align,
  }
}

export function createActionCardContent(
  label: string,
  actionType: ActionCardContent['actionType'],
  target: string,
  options?: {
    icon?: string
    requireConfirmation?: boolean
    confirmationMessage?: string
  }
): ActionCardContent {
  return {
    label,
    actionType,
    target,
    icon: options?.icon,
    requireConfirmation: options?.requireConfirmation,
    confirmationMessage: options?.confirmationMessage,
  }
}

export function createImageCardContent(
  url: string,
  alt: string,
  options?: {
    caption?: string
    fit?: 'cover' | 'contain' | 'fill'
  }
): ImageCardContent {
  return {
    url,
    alt,
    caption: options?.caption,
    fit: options?.fit,
  }
}

export function createCustomCardContent(
  componentType: string,
  props: Record<string, unknown>
): CustomCardContent {
  return {
    componentType,
    props,
  }
}

export function createWorkbenchCard(
  containerRef: CardContainerReference,
  title: string,
  contentType: CardContentType,
  content: CardContent,
  createdBy: string,
  options?: {
    description?: string
    size?: CardSize
    customWidth?: number
    customHeight?: number
    status?: CardStatus
    visibility?: CardVisibility
    position?: number
    tags?: string[]
    metadata?: Record<string, unknown>
  }
): WorkbenchCard {
  const now = new Date().toISOString()
  return {
    cardId: generateCardId(),
    title,
    description: options?.description,
    size: options?.size ?? 'medium',
    customWidth: options?.customWidth,
    customHeight: options?.customHeight,
    contentType,
    content,
    status: options?.status ?? 'active',
    visibility: options?.visibility ?? 'team',
    containerRef,
    position: options?.position ?? 0,
    createdAt: now,
    updatedAt: now,
    createdBy,
    updatedBy: createdBy,
    tags: options?.tags,
    metadata: options?.metadata,
  }
}

export function createCardUpdateOperation(
  cardRef: CardReference,
  operation: CardUpdateOperation['operation'],
  options?: {
    cardData?: Partial<WorkbenchCard>
    newPosition?: number
    requiredPermission?: PermissionLevel
    skipPermissionCheck?: boolean
  }
): CardUpdateOperation {
  return {
    operationId: generateCardOperationId(),
    cardRef,
    operation,
    cardData: options?.cardData,
    newPosition: options?.newPosition,
    requiredPermission: options?.requiredPermission ?? 'write',
    skipPermissionCheck: options?.skipPermissionCheck,
  }
}

export function createCardWritebackAction(
  sessionId: string,
  containerRef: CardContainerReference,
  operations: CardUpdateOperation[]
): CardWritebackAction {
  return {
    actionId: generateCardActionId(),
    sessionId,
    containerRef,
    operations,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

export function createCardWritebackContract(
  containerRef: CardContainerReference,
  allowedContentTypes: CardContentType[],
  createdBy: string,
  options?: {
    maxCards?: number
    defaultSize?: CardSize
    defaultPermission?: PermissionLevel
    contentTypePermissions?: Partial<Record<CardContentType, PermissionLevel>>
  }
): CardWritebackContract {
  return {
    contractId: generateCardContractId(),
    containerRef,
    allowedContentTypes,
    maxCards: options?.maxCards,
    defaultSize: options?.defaultSize ?? 'medium',
    permissions: {
      defaultPermission: options?.defaultPermission ?? 'write',
      contentTypePermissions: options?.contentTypePermissions,
    },
    createdAt: new Date().toISOString(),
    createdBy,
  }
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check if content type is allowed
 */
export function isContentTypeAllowed(
  contract: CardWritebackContract,
  contentType: CardContentType
): boolean {
  return contract.allowedContentTypes.includes(contentType)
}

/**
 * Check card permission
 */
export function checkCardPermission(
  contract: CardWritebackContract,
  contentType: CardContentType,
  userPermission: PermissionLevel
): boolean {
  const requiredPermission =
    contract.permissions.contentTypePermissions?.[contentType] ??
    contract.permissions.defaultPermission
  return permissionSatisfies(userPermission, requiredPermission)
}

/**
 * Check visibility permission
 */
export function checkVisibilityPermission(
  visibility: CardVisibility,
  userPermission: PermissionLevel,
  userDepartmentId: string,
  cardDepartmentId: string
): boolean {
  // Visibility hierarchy: private > team > department > company > public
  switch (visibility) {
    case 'private':
      return permissionSatisfies(userPermission, 'admin')
    case 'team':
      return permissionSatisfies(userPermission, 'write')
    case 'department':
      return (
        userDepartmentId === cardDepartmentId ||
        permissionSatisfies(userPermission, 'admin')
      )
    case 'company':
    case 'public':
      return permissionSatisfies(userPermission, 'read')
    default:
      return false
  }
}

/**
 * Check placement permission
 */
export function checkPlacementPermission(
  contract: CardWritebackContract,
  position: number,
  userPermission: PermissionLevel
): { allowed: boolean; reason?: string } {
  // Admin can place anywhere
  if (permissionSatisfies(userPermission, 'admin')) {
    return { allowed: true }
  }

  // Check if max cards exceeded
  if (contract.maxCards !== undefined && position >= contract.maxCards) {
    return { allowed: false, reason: 'Maximum cards exceeded' }
  }

  return { allowed: true }
}

// ============================================================================
// Writeback Execution
// ============================================================================

/**
 * Execute a single card operation
 */
export function executeCardOperation(
  operation: CardUpdateOperation,
  contract: CardWritebackContract,
  cards: Map<string, WorkbenchCard>
): CardWritebackResult {
  const result: CardWritebackResult = {
    operationId: operation.operationId,
    cardId: operation.cardRef.cardId,
    success: false,
  }

  switch (operation.operation) {
    case 'create': {
      if (cards.has(operation.cardRef.cardId)) {
        result.error = `Card '${operation.cardRef.cardId}' already exists`
        return result
      }
      if (!operation.cardData) {
        result.error = 'No card data provided for create operation'
        return result
      }
      // Check content type
      if (
        operation.cardData.contentType &&
        !isContentTypeAllowed(contract, operation.cardData.contentType)
      ) {
        result.error = `Content type '${operation.cardData.contentType}' not allowed`
        return result
      }
      const newCard: WorkbenchCard = {
        cardId: operation.cardRef.cardId,
        title: operation.cardData.title ?? 'Untitled Card',
        description: operation.cardData.description,
        size: operation.cardData.size ?? contract.defaultSize,
        customWidth: operation.cardData.customWidth,
        customHeight: operation.cardData.customHeight,
        contentType: operation.cardData.contentType ?? 'text',
        content: operation.cardData.content ?? { content: '', format: 'plain' },
        status: operation.cardData.status ?? 'active',
        visibility: operation.cardData.visibility ?? 'team',
        containerRef: operation.cardRef.containerRef,
        position: operation.cardData.position ?? cards.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: operation.cardData.createdBy ?? 'system',
        updatedBy: operation.cardData.updatedBy ?? 'system',
        tags: operation.cardData.tags,
        metadata: operation.cardData.metadata,
      }
      cards.set(operation.cardRef.cardId, newCard)
      result.success = true
      result.resultingCard = newCard
      break
    }

    case 'update': {
      const existing = cards.get(operation.cardRef.cardId)
      if (!existing) {
        result.error = `Card '${operation.cardRef.cardId}' not found`
        return result
      }
      if (operation.cardData?.contentType) {
        if (!isContentTypeAllowed(contract, operation.cardData.contentType)) {
          result.error = `Content type '${operation.cardData.contentType}' not allowed`
          return result
        }
      }
      const updated: WorkbenchCard = {
        ...existing,
        ...operation.cardData,
        cardId: existing.cardId, // Preserve ID
        updatedAt: new Date().toISOString(),
      }
      cards.set(operation.cardRef.cardId, updated)
      result.success = true
      result.resultingCard = updated
      break
    }

    case 'delete': {
      if (!cards.has(operation.cardRef.cardId)) {
        result.error = `Card '${operation.cardRef.cardId}' not found`
        return result
      }
      cards.delete(operation.cardRef.cardId)
      result.success = true
      break
    }

    case 'move': {
      const existing = cards.get(operation.cardRef.cardId)
      if (!existing) {
        result.error = `Card '${operation.cardRef.cardId}' not found`
        return result
      }
      if (operation.newPosition === undefined) {
        result.error = 'New position required for move operation'
        return result
      }
      existing.position = operation.newPosition
      existing.updatedAt = new Date().toISOString()
      result.success = true
      result.resultingCard = existing
      break
    }

    case 'reorder': {
      // Reorder affects multiple cards
      const existing = cards.get(operation.cardRef.cardId)
      if (!existing) {
        result.error = `Card '${operation.cardRef.cardId}' not found`
        return result
      }
      if (operation.newPosition === undefined) {
        result.error = 'New position required for reorder operation'
        return result
      }
      existing.position = operation.newPosition
      existing.updatedAt = new Date().toISOString()
      result.success = true
      result.resultingCard = existing
      break
    }
  }

  return result
}

/**
 * Execute full card writeback action
 */
export function executeCardWriteback(
  action: CardWritebackAction,
  contract: CardWritebackContract,
  userPermission: PermissionLevel,
  _department: string, // Reserved for department-level permission checks
  options?: {
    existingCards?: Map<string, WorkbenchCard>
    dryRun?: boolean
  }
): {
  outcome: CardWritebackOutcome
  traces: CardWritebackTrace[]
  cards: Map<string, WorkbenchCard>
} {
  const cards = options?.existingCards ?? new Map<string, WorkbenchCard>()
  const traces: CardWritebackTrace[] = []
  const results: CardWritebackResult[] = []

  action.status = 'validating'

  for (const operation of action.operations) {
    const startTime = Date.now()

    const trace: CardWritebackTrace = {
      traceId: generateCardTraceId(),
      actionId: action.actionId,
      timestamp: new Date().toISOString(),
      operation: operation.operation,
      cardId: operation.cardRef.cardId,
      status: 'started',
    }
    traces.push(trace)

    // Permission check
    if (!operation.skipPermissionCheck) {
      const contentType =
        operation.cardData?.contentType ??
        cards.get(operation.cardRef.cardId)?.contentType ??
        'text'

      if (!checkCardPermission(contract, contentType, userPermission)) {
        trace.status = 'skipped'
        trace.details = 'Permission denied'
        trace.durationMs = Date.now() - startTime
        results.push({
          operationId: operation.operationId,
          cardId: operation.cardRef.cardId,
          success: false,
          error: 'Permission denied',
        })
        continue
      }

      // Check placement
      const position = operation.cardData?.position ?? operation.newPosition ?? 0
      const placementCheck = checkPlacementPermission(
        contract,
        position,
        userPermission
      )
      if (!placementCheck.allowed) {
        trace.status = 'skipped'
        trace.details = placementCheck.reason
        trace.durationMs = Date.now() - startTime
        results.push({
          operationId: operation.operationId,
          cardId: operation.cardRef.cardId,
          success: false,
          error: placementCheck.reason,
        })
        continue
      }
    }

    // Dry run
    if (options?.dryRun) {
      trace.status = 'completed'
      trace.details = 'Dry run - no actual changes'
      trace.durationMs = Date.now() - startTime
      results.push({
        operationId: operation.operationId,
        cardId: operation.cardRef.cardId,
        success: true,
        warnings: ['Dry run - no actual changes made'],
      })
      continue
    }

    // Execute operation
    const opResult = executeCardOperation(operation, contract, cards)
    results.push(opResult)

    trace.status = opResult.success ? 'completed' : 'failed'
    trace.details = opResult.error
    trace.durationMs = Date.now() - startTime
  }

  // Determine overall status
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  let status: CardWritebackAction['status']
  if (successCount === results.length) {
    status = 'completed'
  } else if (successCount === 0) {
    status = 'failed'
  } else {
    status = 'partial'
  }

  action.status = status
  action.completedAt = new Date().toISOString()

  const outcome: CardWritebackOutcome = {
    actionId: action.actionId,
    success: status === 'completed',
    results,
    totalOperations: results.length,
    successfulOperations: successCount,
    failedOperations: failCount,
    completedAt: new Date().toISOString(),
  }

  return { outcome, traces, cards }
}

// ============================================================================
// Store Operations
// ============================================================================

export function createCardWritebackStore(): CardWritebackStore {
  return {
    cards: new Map(),
    contracts: new Map(),
    actions: new Map(),
    outcomes: new Map(),
    traces: new Map(),
  }
}

export function registerCardContract(
  store: CardWritebackStore,
  contract: CardWritebackContract
): void {
  store.contracts.set(contract.containerRef.containerId, contract)
}

export function getCardContract(
  store: CardWritebackStore,
  containerId: string
): CardWritebackContract | undefined {
  return store.contracts.get(containerId)
}

export function addCardToStore(
  store: CardWritebackStore,
  card: WorkbenchCard
): void {
  store.cards.set(card.cardId, card)
}

export function getCardFromStore(
  store: CardWritebackStore,
  cardId: string
): WorkbenchCard | undefined {
  return store.cards.get(cardId)
}

export function getCardsByContainer(
  store: CardWritebackStore,
  containerId: string
): WorkbenchCard[] {
  return Array.from(store.cards.values())
    .filter((c) => c.containerRef.containerId === containerId)
    .sort((a, b) => a.position - b.position)
}

export function addCardAction(
  store: CardWritebackStore,
  action: CardWritebackAction
): void {
  store.actions.set(action.actionId, action)
}

export function getCardAction(
  store: CardWritebackStore,
  actionId: string
): CardWritebackAction | undefined {
  return store.actions.get(actionId)
}

export function getCardActionsBySession(
  store: CardWritebackStore,
  sessionId: string
): CardWritebackAction[] {
  return Array.from(store.actions.values()).filter(
    (a) => a.sessionId === sessionId
  )
}

export function addCardOutcome(
  store: CardWritebackStore,
  outcome: CardWritebackOutcome
): void {
  store.outcomes.set(outcome.actionId, outcome)
}

export function getCardOutcome(
  store: CardWritebackStore,
  actionId: string
): CardWritebackOutcome | undefined {
  return store.outcomes.get(actionId)
}

export function addCardTraces(
  store: CardWritebackStore,
  actionId: string,
  traces: CardWritebackTrace[]
): void {
  const existing = store.traces.get(actionId) ?? []
  existing.push(...traces)
  store.traces.set(actionId, existing)
}

export function getCardTraces(
  store: CardWritebackStore,
  actionId: string
): CardWritebackTrace[] {
  return store.traces.get(actionId) ?? []
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeCardContainerRef(ref: CardContainerReference): string {
  return JSON.stringify(ref)
}

export function deserializeCardContainerRef(json: string): CardContainerReference {
  return JSON.parse(json)
}

export function serializeCardRef(ref: CardReference): string {
  return JSON.stringify(ref)
}

export function deserializeCardRef(json: string): CardReference {
  return JSON.parse(json)
}

export function serializeWorkbenchCard(card: WorkbenchCard): string {
  return JSON.stringify(card)
}

export function deserializeWorkbenchCard(json: string): WorkbenchCard {
  return JSON.parse(json)
}

export function serializeCardAction(action: CardWritebackAction): string {
  return JSON.stringify(action)
}

export function deserializeCardAction(json: string): CardWritebackAction {
  return JSON.parse(json)
}

export function serializeCardContract(contract: CardWritebackContract): string {
  return JSON.stringify(contract)
}

export function deserializeCardContract(json: string): CardWritebackContract {
  return JSON.parse(json)
}

export function serializeCardOutcome(outcome: CardWritebackOutcome): string {
  return JSON.stringify(outcome)
}

export function deserializeCardOutcome(json: string): CardWritebackOutcome {
  return JSON.parse(json)
}

export function serializeCardWritebackStore(store: CardWritebackStore): string {
  return JSON.stringify({
    cards: Array.from(store.cards.entries()),
    contracts: Array.from(store.contracts.entries()),
    actions: Array.from(store.actions.entries()),
    outcomes: Array.from(store.outcomes.entries()),
    traces: Array.from(store.traces.entries()),
  })
}

export function deserializeCardWritebackStore(json: string): CardWritebackStore {
  const data = JSON.parse(json)
  return {
    cards: new Map(data.cards),
    contracts: new Map(data.contracts),
    actions: new Map(data.actions),
    outcomes: new Map(data.outcomes),
    traces: new Map(data.traces),
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

export function formatCardContainerRef(ref: CardContainerReference): string {
  return `CardContainer(${ref.containerId}, type=${ref.containerType}, page=${ref.pageId})`
}

export function formatCardRef(ref: CardReference): string {
  return `Card(${ref.cardId}, position=${ref.position})`
}

export function formatCardContent(
  content: CardContent,
  contentType: CardContentType
): string {
  switch (contentType) {
    case 'metric': {
      const mc = content as MetricCardContent
      return `Metric(${mc.label}=${mc.value}${mc.trend ? `, ${mc.trend}` : ''})`
    }
    case 'chart': {
      const cc = content as ChartCardContent
      return `Chart(${cc.chartType}, ${cc.series.length} series)`
    }
    case 'list': {
      const lc = content as ListCardContent
      return `List(${lc.items.length} items)`
    }
    case 'table': {
      const tc = content as TableCardContent
      return `Table(${tc.columns.length} cols, ${tc.rows.length} rows)`
    }
    case 'text': {
      const tc = content as TextCardContent
      return `Text(${tc.format}, ${tc.content.length} chars)`
    }
    case 'action': {
      const ac = content as ActionCardContent
      return `Action(${ac.label}, ${ac.actionType})`
    }
    case 'image': {
      const ic = content as ImageCardContent
      return `Image(${ic.alt})`
    }
    case 'custom': {
      const cc = content as CustomCardContent
      return `Custom(${cc.componentType})`
    }
    default:
      return `Unknown(${contentType})`
  }
}

export function formatWorkbenchCard(card: WorkbenchCard): string {
  return `Card(${card.cardId}, "${card.title}", ${card.contentType}, ${card.size})`
}

export function formatCardWritebackResult(result: CardWritebackResult): string {
  const status = result.success ? 'SUCCESS' : 'FAILED'
  const parts = [`${status} card=${result.cardId}`]
  if (result.error) parts.push(`error=${result.error}`)
  if (result.warnings?.length) parts.push(`warnings=${result.warnings.length}`)
  return parts.join(', ')
}

export function formatCardWritebackOutcome(outcome: CardWritebackOutcome): string {
  const status = outcome.success
    ? 'SUCCESS'
    : outcome.failedOperations > 0
      ? 'PARTIAL'
      : 'FAILED'
  return `${status}: ${outcome.successfulOperations}/${outcome.totalOperations} operations`
}

export function formatCardTrace(trace: CardWritebackTrace): string {
  const parts = [
    `[${trace.timestamp}]`,
    trace.operation,
    `card=${trace.cardId}`,
    trace.status,
  ]
  if (trace.durationMs !== undefined) parts.push(`${trace.durationMs}ms`)
  if (trace.details) parts.push(`(${trace.details})`)
  return parts.join(' ')
}
