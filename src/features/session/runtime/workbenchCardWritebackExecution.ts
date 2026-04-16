/**
 * Workbench Card Writeback - Execution
 * Task 86: Story 49.3 - Workbench Card Writeback
 */

import type {
  CardWritebackContract,
  CardWritebackAction,
  CardWritebackOutcome,
  CardWritebackTrace,
  CardUpdateOperation,
  WorkbenchCard,
  CardWritebackResult,
} from './workbenchCardWritebackTypes'
import type { PermissionLevel } from './fieldActionAuthorization'
import {
  isContentTypeAllowed,
  checkCardPermission,
  checkPlacementPermission,
  generateCardTraceId,
} from './workbenchCardWritebackFactories'

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
