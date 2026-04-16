/**
 * Workbench Card Writeback - Types
 * Task 86: Story 49.3 - Workbench Card Writeback
 */

import type { PermissionLevel } from './fieldActionAuthorization'

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
