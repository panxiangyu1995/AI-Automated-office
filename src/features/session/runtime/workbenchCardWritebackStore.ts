/**
 * Workbench Card Writeback - Store, Serialization & Debug
 * Task 86: Story 49.3 - Workbench Card Writeback
 */

import type {
  CardContainerReference,
  CardReference,
  CardContentType,
  CardContent,
  WorkbenchCard,
  CardWritebackContract,
  CardWritebackAction,
  CardWritebackOutcome,
  CardWritebackTrace,
  CardWritebackStore,
  CardWritebackResult,
  MetricCardContent,
  ChartCardContent,
  ListCardContent,
  TableCardContent,
  TextCardContent,
  ActionCardContent,
  ImageCardContent,
  CustomCardContent,
} from './workbenchCardWritebackTypes'

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
