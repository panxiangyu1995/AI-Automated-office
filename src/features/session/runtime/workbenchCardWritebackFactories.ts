/**
 * Workbench Card Writeback - ID Generation, Factories & Permissions
 * Task 86: Story 49.3 - Workbench Card Writeback
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'
import type {
  CardContainerReference,
  CardReference,
  CardContentType,
  CardContent,
  CardSize,
  CardVisibility,
  CardStatus,
  MetricCardContent,
  ChartCardContent,
  ListCardContent,
  ListItem,
  TableCardContent,
  TextCardContent,
  ActionCardContent,
  ImageCardContent,
  CustomCardContent,
  WorkbenchCard,
  CardUpdateOperation,
  CardWritebackContract,
  CardWritebackAction,
} from './workbenchCardWritebackTypes'

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
