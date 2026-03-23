/**
 * Workbench Card Writeback Module Tests
 * Task 86: Story 49.3 - Workbench Card Writeback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type CardSize,
  type CardVisibility,
  type CardStatus,
  type CardContainerReference,
  type CardReference,
  type CardContentType,
  type MetricCardContent,
  type ChartCardContent,
  type ListCardContent,
  type TableCardContent,
  type TextCardContent,
  type ActionCardContent,
  type ImageCardContent,
  type CustomCardContent,
  type WorkbenchCard,
  type CardUpdateOperation,
  type CardWritebackAction,
  type CardWritebackContract,
  type CardWritebackResult,
  type CardWritebackOutcome,
  type CardWritebackTrace,
  type CardWritebackStore,
  type ListItem,

  // ID Generation
  generateCardId,
  generateCardOperationId,
  generateCardActionId,
  generateCardContractId,
  generateCardTraceId,

  // Factory Functions
  createCardContainerReference,
  createCardReference,
  createMetricCardContent,
  createChartCardContent,
  createListCardContent,
  createTableCardContent,
  createTextCardContent,
  createActionCardContent,
  createImageCardContent,
  createCustomCardContent,
  createWorkbenchCard,
  createCardUpdateOperation,
  createCardWritebackAction,
  createCardWritebackContract,

  // Permission Checking
  isContentTypeAllowed,
  checkCardPermission,
  checkVisibilityPermission,
  checkPlacementPermission,

  // Writeback Execution
  executeCardOperation,
  executeCardWriteback,

  // Store Operations
  createCardWritebackStore,
  registerCardContract,
  getCardContract,
  addCardToStore,
  getCardFromStore,
  getCardsByContainer,
  addCardAction,
  getCardAction,
  getCardActionsBySession,
  addCardOutcome,
  getCardOutcome,
  addCardTraces,
  getCardTraces,

  // Serialization
  serializeCardContainerRef,
  deserializeCardContainerRef,
  serializeCardRef,
  deserializeCardRef,
  serializeWorkbenchCard,
  deserializeWorkbenchCard,
  serializeCardAction,
  deserializeCardAction,
  serializeCardContract,
  deserializeCardContract,
  serializeCardOutcome,
  deserializeCardOutcome,
  serializeCardWritebackStore,
  deserializeCardWritebackStore,

  // Debug Formatting
  formatCardContainerRef,
  formatCardRef,
  formatCardContent,
  formatWorkbenchCard,
  formatCardWritebackResult,
  formatCardWritebackOutcome,
  formatCardTrace,
} from '@/features/session/runtime/workbenchCardWriteback'

describe('Workbench Card Writeback', () => {
  // ==========================================================================
  // ID Generation
  // ==========================================================================

  describe('ID Generation', () => {
    it('should generate unique card IDs', () => {
      const id1 = generateCardId()
      const id2 = generateCardId()
      expect(id1).toMatch(/^wbc_\d+_\d+$/)
      expect(id2).toMatch(/^wbc_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique operation IDs', () => {
      const id1 = generateCardOperationId()
      const id2 = generateCardOperationId()
      expect(id1).toMatch(/^cop_\d+_\d+$/)
      expect(id2).toMatch(/^cop_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique action IDs', () => {
      const id1 = generateCardActionId()
      const id2 = generateCardActionId()
      expect(id1).toMatch(/^cwa_\d+_\d+$/)
      expect(id2).toMatch(/^cwa_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique contract IDs', () => {
      const id1 = generateCardContractId()
      const id2 = generateCardContractId()
      expect(id1).toMatch(/^cwc_\d+_\d+$/)
      expect(id2).toMatch(/^cwc_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique trace IDs', () => {
      const id1 = generateCardTraceId()
      const id2 = generateCardTraceId()
      expect(id1).toMatch(/^cwt_\d+_\d+$/)
      expect(id2).toMatch(/^cwt_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })
  })

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    describe('createCardContainerReference', () => {
      it('should create container reference', () => {
        const ref = createCardContainerReference(
          'container-1',
          'page-1',
          'hr',
          'dashboard'
        )
        expect(ref).toEqual({
          containerId: 'container-1',
          pageId: 'page-1',
          departmentId: 'hr',
          containerType: 'dashboard',
        })
      })
    })

    describe('createCardReference', () => {
      it('should create card reference', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const cardRef = createCardReference('card-1', containerRef, 5)
        expect(cardRef).toEqual({
          cardId: 'card-1',
          containerRef,
          position: 5,
        })
      })
    })

    describe('createMetricCardContent', () => {
      it('should create metric content with defaults', () => {
        const content = createMetricCardContent('Revenue', '$10,000')
        expect(content).toEqual({
          label: 'Revenue',
          value: '$10,000',
        })
      })

      it('should create metric content with all options', () => {
        const content = createMetricCardContent('Users', 1500, {
          previousValue: 1200,
          changePercent: 25,
          trend: 'up',
          unit: 'users',
          icon: 'users',
          color: 'green',
        })
        expect(content.previousValue).toBe(1200)
        expect(content.trend).toBe('up')
        expect(content.unit).toBe('users')
      })
    })

    describe('createChartCardContent', () => {
      it('should create chart content', () => {
        const series = [{ name: 'Sales', data: [{ x: 'Jan', y: 100 }] }]
        const content = createChartCardContent('line', 'Monthly Sales', series)
        expect(content.chartType).toBe('line')
        expect(content.title).toBe('Monthly Sales')
        expect(content.series).toHaveLength(1)
      })
    })

    describe('createListCardContent', () => {
      it('should create list content', () => {
        const items: ListItem[] = [
          { id: '1', title: 'Item 1' },
          { id: '2', title: 'Item 2' },
        ]
        const content = createListCardContent(items, { showCount: true })
        expect(content.items).toHaveLength(2)
        expect(content.showCount).toBe(true)
      })
    })

    describe('createTableCardContent', () => {
      it('should create table content', () => {
        const columns = [{ key: 'name', label: 'Name' }]
        const rows = [{ name: 'John' }]
        const content = createTableCardContent(columns, rows, { sortable: true })
        expect(content.columns).toHaveLength(1)
        expect(content.rows).toHaveLength(1)
        expect(content.sortable).toBe(true)
      })
    })

    describe('createTextCardContent', () => {
      it('should create text content', () => {
        const content = createTextCardContent('# Hello', 'markdown', { align: 'center' })
        expect(content.content).toBe('# Hello')
        expect(content.format).toBe('markdown')
        expect(content.align).toBe('center')
      })
    })

    describe('createActionCardContent', () => {
      it('should create action content', () => {
        const content = createActionCardContent(
          'Submit',
          'primary',
          '/api/submit',
          { icon: 'check', requireConfirmation: true }
        )
        expect(content.label).toBe('Submit')
        expect(content.actionType).toBe('primary')
        expect(content.requireConfirmation).toBe(true)
      })
    })

    describe('createImageCardContent', () => {
      it('should create image content', () => {
        const content = createImageCardContent(
          'https://example.com/img.png',
          'Example image',
          { caption: 'A sample image', fit: 'cover' }
        )
        expect(content.url).toBe('https://example.com/img.png')
        expect(content.alt).toBe('Example image')
        expect(content.fit).toBe('cover')
      })
    })

    describe('createCustomCardContent', () => {
      it('should create custom content', () => {
        const content = createCustomCardContent('CustomWidget', { prop1: 'value1' })
        expect(content.componentType).toBe('CustomWidget')
        expect(content.props.prop1).toBe('value1')
      })
    })

    describe('createWorkbenchCard', () => {
      it('should create workbench card', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const content = createMetricCardContent('Revenue', '$1000')
        const card = createWorkbenchCard(
          containerRef,
          'Revenue Card',
          'metric',
          content,
          'user-1'
        )
        expect(card.cardId).toMatch(/^wbc_/)
        expect(card.title).toBe('Revenue Card')
        expect(card.contentType).toBe('metric')
        expect(card.status).toBe('active')
        expect(card.visibility).toBe('team')
        expect(card.createdBy).toBe('user-1')
      })

      it('should create workbench card with all options', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const content = createTextCardContent('Content', 'plain')
        const card = createWorkbenchCard(
          containerRef,
          'Custom Card',
          'text',
          content,
          'user-1',
          {
            description: 'A custom card',
            size: 'large',
            status: 'draft',
            visibility: 'department',
            position: 10,
            tags: ['important', 'demo'],
          }
        )
        expect(card.description).toBe('A custom card')
        expect(card.size).toBe('large')
        expect(card.status).toBe('draft')
        expect(card.visibility).toBe('department')
        expect(card.position).toBe(10)
        expect(card.tags).toEqual(['important', 'demo'])
      })
    })

    describe('createCardUpdateOperation', () => {
      it('should create update operation', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const cardRef = createCardReference('card-1', containerRef)
        const op = createCardUpdateOperation(cardRef, 'create', {
          cardData: { title: 'New Card' },
          requiredPermission: 'admin',
        })
        expect(op.operationId).toMatch(/^cop_/)
        expect(op.operation).toBe('create')
        expect(op.requiredPermission).toBe('admin')
      })
    })

    describe('createCardWritebackAction', () => {
      it('should create writeback action', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const cardRef = createCardReference('card-1', containerRef)
        const operations = [createCardUpdateOperation(cardRef, 'create')]
        const action = createCardWritebackAction('session-1', containerRef, operations)
        expect(action.actionId).toMatch(/^cwa_/)
        expect(action.sessionId).toBe('session-1')
        expect(action.status).toBe('pending')
      })
    })

    describe('createCardWritebackContract', () => {
      it('should create contract', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const contract = createCardWritebackContract(
          containerRef,
          ['metric', 'chart', 'list'],
          'user-1'
        )
        expect(contract.contractId).toMatch(/^cwc_/)
        expect(contract.allowedContentTypes).toEqual(['metric', 'chart', 'list'])
        expect(contract.defaultSize).toBe('medium')
        expect(contract.permissions.defaultPermission).toBe('write')
      })

      it('should create contract with custom options', () => {
        const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
        const contract = createCardWritebackContract(
          containerRef,
          ['metric', 'chart'],
          'user-1',
          {
            maxCards: 10,
            defaultSize: 'small',
            defaultPermission: 'admin',
            contentTypePermissions: {
              chart: 'admin',
            },
          }
        )
        expect(contract.maxCards).toBe(10)
        expect(contract.defaultSize).toBe('small')
        expect(contract.permissions.defaultPermission).toBe('admin')
        expect(contract.permissions.contentTypePermissions?.chart).toBe('admin')
      })
    })
  })

  // ==========================================================================
  // Permission Checking
  // ==========================================================================

  describe('Permission Checking', () => {
    let contract: CardWritebackContract
    let containerRef: CardContainerReference

    beforeEach(() => {
      containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      contract = createCardWritebackContract(
        containerRef,
        ['metric', 'chart', 'list'],
        'user-1',
        {
          defaultPermission: 'write',
          contentTypePermissions: {
            chart: 'admin',
          },
        }
      )
    })

    describe('isContentTypeAllowed', () => {
      it('should return true for allowed content types', () => {
        expect(isContentTypeAllowed(contract, 'metric')).toBe(true)
        expect(isContentTypeAllowed(contract, 'chart')).toBe(true)
        expect(isContentTypeAllowed(contract, 'list')).toBe(true)
      })

      it('should return false for disallowed content types', () => {
        expect(isContentTypeAllowed(contract, 'table')).toBe(false)
        expect(isContentTypeAllowed(contract, 'text')).toBe(false)
        expect(isContentTypeAllowed(contract, 'action')).toBe(false)
      })
    })

    describe('checkCardPermission', () => {
      it('should allow access when permission satisfies', () => {
        expect(checkCardPermission(contract, 'metric', 'write')).toBe(true)
        expect(checkCardPermission(contract, 'metric', 'admin')).toBe(true)
      })

      it('should deny access when permission insufficient', () => {
        expect(checkCardPermission(contract, 'metric', 'read')).toBe(false)
        expect(checkCardPermission(contract, 'metric', 'none')).toBe(false)
      })

      it('should check content type specific permissions', () => {
        expect(checkCardPermission(contract, 'chart', 'write')).toBe(false)
        expect(checkCardPermission(contract, 'chart', 'admin')).toBe(true)
      })
    })

    describe('checkVisibilityPermission', () => {
      it('should check private visibility', () => {
        expect(checkVisibilityPermission('private', 'admin', 'hr', 'hr')).toBe(true)
        expect(checkVisibilityPermission('private', 'write', 'hr', 'hr')).toBe(false)
      })

      it('should check team visibility', () => {
        expect(checkVisibilityPermission('team', 'write', 'hr', 'hr')).toBe(true)
        expect(checkVisibilityPermission('team', 'read', 'hr', 'hr')).toBe(false)
      })

      it('should check department visibility', () => {
        expect(checkVisibilityPermission('department', 'read', 'hr', 'hr')).toBe(true)
        expect(checkVisibilityPermission('department', 'read', 'it', 'hr')).toBe(false)
        expect(checkVisibilityPermission('department', 'admin', 'it', 'hr')).toBe(true)
      })

      it('should check company/public visibility', () => {
        expect(checkVisibilityPermission('company', 'read', 'it', 'hr')).toBe(true)
        expect(checkVisibilityPermission('public', 'read', 'it', 'hr')).toBe(true)
      })
    })

    describe('checkPlacementPermission', () => {
      it('should allow placement for admin', () => {
        const result = checkPlacementPermission(contract, 100, 'admin')
        expect(result.allowed).toBe(true)
      })

      it('should check max cards limit', () => {
        const limitedContract = createCardWritebackContract(
          containerRef,
          ['metric'],
          'user-1',
          { maxCards: 5 }
        )
        expect(checkPlacementPermission(limitedContract, 3, 'write').allowed).toBe(true)
        expect(checkPlacementPermission(limitedContract, 5, 'write').allowed).toBe(false)
      })
    })
  })

  // ==========================================================================
  // Writeback Execution
  // ==========================================================================

  describe('Writeback Execution', () => {
    let containerRef: CardContainerReference
    let contract: CardWritebackContract

    beforeEach(() => {
      containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      contract = createCardWritebackContract(
        containerRef,
        ['metric', 'chart', 'list', 'text'],
        'user-1'
      )
    })

    describe('executeCardOperation', () => {
      it('should create a new card', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const content = createMetricCardContent('Revenue', '$1000')
        const operation = createCardUpdateOperation(cardRef, 'create', {
          cardData: {
            title: 'Revenue Card',
            contentType: 'metric',
            content,
            createdBy: 'user-1',
          },
        })

        const cards = new Map<string, WorkbenchCard>()
        const result = executeCardOperation(operation, contract, cards)

        expect(result.success).toBe(true)
        expect(result.cardId).toBe('card-1')
        expect(cards.has('card-1')).toBe(true)
        expect(result.resultingCard?.title).toBe('Revenue Card')
      })

      it('should fail to create duplicate card', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const content = createMetricCardContent('Revenue', '$1000')
        const operation = createCardUpdateOperation(cardRef, 'create', {
          cardData: { title: 'Card', contentType: 'metric', content },
        })

        const cards = new Map<string, WorkbenchCard>()
        const existingCard = createWorkbenchCard(
          containerRef,
          'Existing',
          'metric',
          content,
          'user-1'
        )
        cards.set('card-1', existingCard)

        const result = executeCardOperation(operation, contract, cards)
        expect(result.success).toBe(false)
        expect(result.error).toContain('already exists')
      })

      it('should fail for disallowed content type', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const operation = createCardUpdateOperation(cardRef, 'create', {
          cardData: { title: 'Card', contentType: 'table' as CardContentType },
        })

        const cards = new Map<string, WorkbenchCard>()
        const result = executeCardOperation(operation, contract, cards)

        expect(result.success).toBe(false)
        expect(result.error).toContain('not allowed')
      })

      it('should update existing card', () => {
        const content = createMetricCardContent('Revenue', '$1000')
        const existingCard = createWorkbenchCard(
          containerRef,
          'Old Title',
          'metric',
          content,
          'user-1'
        )
        existingCard.cardId = 'card-1'

        const cardRef = createCardReference('card-1', containerRef)
        const operation = createCardUpdateOperation(cardRef, 'update', {
          cardData: { title: 'New Title' },
        })

        const cards = new Map<string, WorkbenchCard>()
        cards.set('card-1', existingCard)

        const result = executeCardOperation(operation, contract, cards)
        expect(result.success).toBe(true)
        expect(cards.get('card-1')?.title).toBe('New Title')
      })

      it('should delete existing card', () => {
        const content = createMetricCardContent('Revenue', '$1000')
        const existingCard = createWorkbenchCard(
          containerRef,
          'Card',
          'metric',
          content,
          'user-1'
        )
        existingCard.cardId = 'card-1'

        const cardRef = createCardReference('card-1', containerRef)
        const operation = createCardUpdateOperation(cardRef, 'delete')

        const cards = new Map<string, WorkbenchCard>()
        cards.set('card-1', existingCard)

        const result = executeCardOperation(operation, contract, cards)
        expect(result.success).toBe(true)
        expect(cards.has('card-1')).toBe(false)
      })

      it('should move card to new position', () => {
        const content = createMetricCardContent('Revenue', '$1000')
        const existingCard = createWorkbenchCard(
          containerRef,
          'Card',
          'metric',
          content,
          'user-1'
        )
        existingCard.cardId = 'card-1'
        existingCard.position = 0

        const cardRef = createCardReference('card-1', containerRef)
        const operation = createCardUpdateOperation(cardRef, 'move', { newPosition: 5 })

        const cards = new Map<string, WorkbenchCard>()
        cards.set('card-1', existingCard)

        const result = executeCardOperation(operation, contract, cards)
        expect(result.success).toBe(true)
        expect(cards.get('card-1')?.position).toBe(5)
      })
    })

    describe('executeCardWriteback', () => {
      it('should execute full writeback action', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const content = createMetricCardContent('Revenue', '$1000')
        const operations = [
          createCardUpdateOperation(cardRef, 'create', {
            cardData: {
              title: 'Revenue Card',
              contentType: 'metric',
              content,
              createdBy: 'user-1',
            },
          }),
        ]
        const action = createCardWritebackAction('session-1', containerRef, operations)

        const result = executeCardWriteback(action, contract, 'admin', 'hr')

        expect(result.outcome.success).toBe(true)
        expect(result.outcome.totalOperations).toBe(1)
        expect(result.outcome.successfulOperations).toBe(1)
        expect(result.traces).toHaveLength(1)
        expect(result.cards.has('card-1')).toBe(true)
      })

      it('should handle permission denied', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const content = createMetricCardContent('Revenue', '$1000')
        const operations = [
          createCardUpdateOperation(cardRef, 'create', {
            cardData: { title: 'Card', contentType: 'metric', content },
          }),
        ]
        const action = createCardWritebackAction('session-1', containerRef, operations)

        const result = executeCardWriteback(action, contract, 'read', 'hr')

        expect(result.outcome.success).toBe(false)
        expect(result.outcome.failedOperations).toBe(1)
        expect(result.traces[0].status).toBe('skipped')
      })

      it('should support dry run mode', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const operations = [
          createCardUpdateOperation(cardRef, 'create', {
            cardData: { title: 'Card', contentType: 'metric' },
          }),
        ]
        const action = createCardWritebackAction('session-1', containerRef, operations)

        const result = executeCardWriteback(action, contract, 'admin', 'hr', { dryRun: true })

        expect(result.outcome.success).toBe(true)
        expect(result.cards.has('card-1')).toBe(false)
        expect(result.outcome.results[0].warnings).toContain('Dry run - no actual changes made')
      })

      it('should handle partial success', () => {
        const cardRef1 = createCardReference('card-1', containerRef)
        const cardRef2 = createCardReference('card-2', containerRef)
        const operations = [
          createCardUpdateOperation(cardRef1, 'create', {
            cardData: { title: 'Card 1', contentType: 'metric' },
          }),
          createCardUpdateOperation(cardRef2, 'create'), // Missing cardData - will fail
        ]
        const action = createCardWritebackAction('session-1', containerRef, operations)

        const result = executeCardWriteback(action, contract, 'admin', 'hr')

        expect(result.outcome.success).toBe(false)
        expect(result.outcome.successfulOperations).toBe(1)
        expect(result.outcome.failedOperations).toBe(1)
        expect(action.status).toBe('partial')
      })

      it('should respect skipPermissionCheck', () => {
        const cardRef = createCardReference('card-1', containerRef)
        const operations = [
          createCardUpdateOperation(cardRef, 'create', {
            cardData: { title: 'Card', contentType: 'metric' },
            skipPermissionCheck: true,
          }),
        ]
        const action = createCardWritebackAction('session-1', containerRef, operations)

        const result = executeCardWriteback(action, contract, 'none', 'hr')

        expect(result.outcome.success).toBe(true)
      })
    })
  })

  // ==========================================================================
  // Store Operations
  // ==========================================================================

  describe('Store Operations', () => {
    let store: CardWritebackStore
    let containerRef: CardContainerReference
    let contract: CardWritebackContract

    beforeEach(() => {
      store = createCardWritebackStore()
      containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      contract = createCardWritebackContract(containerRef, ['metric'], 'user-1')
    })

    it('should register and retrieve contract', () => {
      registerCardContract(store, contract)
      expect(getCardContract(store, 'c1')).toBe(contract)
    })

    it('should add and retrieve card', () => {
      const content = createMetricCardContent('Revenue', '$1000')
      const card = createWorkbenchCard(containerRef, 'Card', 'metric', content, 'user-1')
      addCardToStore(store, card)
      expect(getCardFromStore(store, card.cardId)).toBe(card)
    })

    it('should get cards by container', () => {
      const content = createMetricCardContent('Revenue', '$1000')
      const card1 = createWorkbenchCard(containerRef, 'Card 1', 'metric', content, 'user-1')
      card1.position = 0
      const card2 = createWorkbenchCard(containerRef, 'Card 2', 'metric', content, 'user-1')
      card2.position = 1

      addCardToStore(store, card1)
      addCardToStore(store, card2)

      const containerCards = getCardsByContainer(store, 'c1')
      expect(containerCards).toHaveLength(2)
      expect(containerCards[0].position).toBeLessThanOrEqual(containerCards[1].position)
    })

    it('should add and retrieve action', () => {
      const action = createCardWritebackAction('session-1', containerRef, [])
      addCardAction(store, action)
      expect(getCardAction(store, action.actionId)).toBe(action)
    })

    it('should get actions by session', () => {
      const action1 = createCardWritebackAction('session-1', containerRef, [])
      const action2 = createCardWritebackAction('session-1', containerRef, [])
      const action3 = createCardWritebackAction('session-2', containerRef, [])

      addCardAction(store, action1)
      addCardAction(store, action2)
      addCardAction(store, action3)

      const sessionActions = getCardActionsBySession(store, 'session-1')
      expect(sessionActions).toHaveLength(2)
    })

    it('should add and retrieve outcome', () => {
      const outcome: CardWritebackOutcome = {
        actionId: 'action-1',
        success: true,
        results: [],
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        completedAt: '2024-01-01T00:00:00Z',
      }
      addCardOutcome(store, outcome)
      expect(getCardOutcome(store, 'action-1')).toBe(outcome)
    })

    it('should add and retrieve traces', () => {
      const trace: CardWritebackTrace = {
        traceId: 't1',
        actionId: 'a1',
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'create',
        cardId: 'c1',
        status: 'completed',
      }
      addCardTraces(store, 'a1', [trace])
      expect(getCardTraces(store, 'a1')).toHaveLength(1)

      // Should append
      addCardTraces(store, 'a1', [trace])
      expect(getCardTraces(store, 'a1')).toHaveLength(2)
    })
  })

  // ==========================================================================
  // Serialization
  // ==========================================================================

  describe('Serialization', () => {
    it('should serialize and deserialize container reference', () => {
      const ref = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      const json = serializeCardContainerRef(ref)
      const restored = deserializeCardContainerRef(json)
      expect(restored).toEqual(ref)
    })

    it('should serialize and deserialize card reference', () => {
      const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      const cardRef = createCardReference('card-1', containerRef, 5)
      const json = serializeCardRef(cardRef)
      const restored = deserializeCardRef(json)
      expect(restored).toEqual(cardRef)
    })

    it('should serialize and deserialize workbench card', () => {
      const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      const content = createMetricCardContent('Revenue', '$1000')
      const card = createWorkbenchCard(containerRef, 'Card', 'metric', content, 'user-1')
      const json = serializeWorkbenchCard(card)
      const restored = deserializeWorkbenchCard(json)
      expect(restored).toEqual(card)
    })

    it('should serialize and deserialize contract', () => {
      const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      const contract = createCardWritebackContract(containerRef, ['metric'], 'user-1')
      const json = serializeCardContract(contract)
      const restored = deserializeCardContract(json)
      expect(restored).toEqual(contract)
    })

    it('should serialize and deserialize store', () => {
      const store = createCardWritebackStore()
      const containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
      const contract = createCardWritebackContract(containerRef, ['metric'], 'user-1')
      const content = createMetricCardContent('Revenue', '$1000')
      const card = createWorkbenchCard(containerRef, 'Card', 'metric', content, 'user-1')

      registerCardContract(store, contract)
      addCardToStore(store, card)

      const json = serializeCardWritebackStore(store)
      const restored = deserializeCardWritebackStore(json)

      expect(restored.contracts.size).toBe(1)
      expect(restored.cards.size).toBe(1)
    })
  })

  // ==========================================================================
  // Debug Formatting
  // ==========================================================================

  describe('Debug Formatting', () => {
    let containerRef: CardContainerReference

    beforeEach(() => {
      containerRef = createCardContainerReference('c1', 'p1', 'hr', 'dashboard')
    })

    it('should format container reference', () => {
      const formatted = formatCardContainerRef(containerRef)
      expect(formatted).toBe('CardContainer(c1, type=dashboard, page=p1)')
    })

    it('should format card reference', () => {
      const cardRef = createCardReference('card-1', containerRef, 5)
      const formatted = formatCardRef(cardRef)
      expect(formatted).toBe('Card(card-1, position=5)')
    })

    it('should format metric content', () => {
      const content = createMetricCardContent('Revenue', '$1000', { trend: 'up' })
      const formatted = formatCardContent(content, 'metric')
      expect(formatted).toContain('Revenue=$1000')
      expect(formatted).toContain('up')
    })

    it('should format chart content', () => {
      const content = createChartCardContent('bar', 'Sales', [
        { name: 'Series 1', data: [] },
        { name: 'Series 2', data: [] },
      ])
      const formatted = formatCardContent(content, 'chart')
      expect(formatted).toContain('bar')
      expect(formatted).toContain('2 series')
    })

    it('should format list content', () => {
      const content = createListCardContent([
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
        { id: '3', title: 'Item 3' },
      ])
      const formatted = formatCardContent(content, 'list')
      expect(formatted).toContain('3 items')
    })

    it('should format table content', () => {
      const content = createTableCardContent(
        [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }],
        [{ name: 'John', age: 30 }]
      )
      const formatted = formatCardContent(content, 'table')
      expect(formatted).toContain('2 cols')
      expect(formatted).toContain('1 rows')
    })

    it('should format workbench card', () => {
      const content = createMetricCardContent('Revenue', '$1000')
      const card = createWorkbenchCard(containerRef, 'Revenue Card', 'metric', content, 'user-1')
      const formatted = formatWorkbenchCard(card)
      expect(formatted).toContain(card.cardId)
      expect(formatted).toContain('Revenue Card')
      expect(formatted).toContain('metric')
    })

    it('should format writeback result', () => {
      const result: CardWritebackResult = {
        operationId: 'op-1',
        cardId: 'card-1',
        success: true,
      }
      const formatted = formatCardWritebackResult(result)
      expect(formatted).toContain('SUCCESS')
      expect(formatted).toContain('card-1')
    })

    it('should format writeback outcome', () => {
      const outcome: CardWritebackOutcome = {
        actionId: 'action-1',
        success: true,
        results: [],
        totalOperations: 5,
        successfulOperations: 5,
        failedOperations: 0,
        completedAt: '2024-01-01T00:00:00Z',
      }
      const formatted = formatCardWritebackOutcome(outcome)
      expect(formatted).toBe('SUCCESS: 5/5 operations')
    })

    it('should format trace', () => {
      const trace: CardWritebackTrace = {
        traceId: 't1',
        actionId: 'a1',
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'create',
        cardId: 'c1',
        status: 'completed',
        durationMs: 50,
      }
      const formatted = formatCardTrace(trace)
      expect(formatted).toContain('create')
      expect(formatted).toContain('card=c1')
      expect(formatted).toContain('completed')
      expect(formatted).toContain('50ms')
    })
  })
})
