/**
 * Detail Section Writeback Module Tests
 * Task 85: Story 49.2 - Detail Section Writeback Adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  // Types
  type DetailSectionReference,
  type DetailBlockReference,
  type DetailBlockType,
  type FieldBlockContent,
  type AttachmentBlockContent,
  type RelationBlockContent,
  type TimelineBlockContent,
  type SummaryBlockContent,
  type ActionBlockContent,
  type DetailBlockUpdate,
  type DetailWritebackAction,
  type DetailWritebackContract,
  type DetailWritebackResult,
  type DetailWritebackOutcome,
  type DetailWritebackTrace,
  type DetailWritebackStore,
  type DetailValidationRule,

  // ID Generation
  generateUpdateId,
  generateDetailActionId,
  generateDetailContractId,
  generateDetailTraceId,
  generateTimelineEventId,

  // Factory Functions
  createDetailSectionReference,
  createDetailBlockReference,
  createFieldBlockContent,
  createAttachmentBlockContent,
  createRelationBlockContent,
  createTimelineEvent,
  createTimelineBlockContent,
  createSummaryBlockContent,
  createActionBlockContent,
  createDetailBlockUpdate,
  createDetailWritebackAction,
  createDetailWritebackContract,

  // Permission Checking
  checkDetailPermission,
  isBlockTypeAllowed,
  validateDetailBlockContent,

  // Writeback Execution
  executeDetailBlockUpdate,
  executeDetailWriteback,

  // Store Operations
  createDetailWritebackStore,
  registerDetailContract,
  getDetailContract,
  addDetailAction,
  getDetailAction,
  getDetailActionsBySection,
  getDetailActionsBySession,
  addDetailOutcome,
  getDetailOutcome,
  addDetailTraces,
  getDetailTraces,

  // Serialization
  serializeDetailSectionRef,
  deserializeDetailSectionRef,
  serializeDetailBlockRef,
  deserializeDetailBlockRef,
  serializeDetailAction,
  deserializeDetailAction,
  serializeDetailContract,
  deserializeDetailContract,
  serializeDetailOutcome,
  deserializeDetailOutcome,
  serializeDetailWritebackStore,
  deserializeDetailWritebackStore,

  // Debug Formatting
  formatDetailSectionRef,
  formatDetailBlockRef,
  formatDetailBlockContent,
  formatDetailWritebackResult,
  formatDetailWritebackOutcome,
  formatDetailTrace,
} from '@/features/session/runtime/detailSectionWriteback'

describe('Detail Section Writeback', () => {
  // ==========================================================================
  // ID Generation
  // ==========================================================================

  describe('ID Generation', () => {
    it('should generate unique update IDs', () => {
      const id1 = generateUpdateId()
      const id2 = generateUpdateId()
      expect(id1).toMatch(/^dbu_\d+_\d+$/)
      expect(id2).toMatch(/^dbu_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique action IDs', () => {
      const id1 = generateDetailActionId()
      const id2 = generateDetailActionId()
      expect(id1).toMatch(/^dwa_\d+_\d+$/)
      expect(id2).toMatch(/^dwa_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique contract IDs', () => {
      const id1 = generateDetailContractId()
      const id2 = generateDetailContractId()
      expect(id1).toMatch(/^dwc_\d+_\d+$/)
      expect(id2).toMatch(/^dwc_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique trace IDs', () => {
      const id1 = generateDetailTraceId()
      const id2 = generateDetailTraceId()
      expect(id1).toMatch(/^dwt_\d+_\d+$/)
      expect(id2).toMatch(/^dwt_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique timeline event IDs', () => {
      const id1 = generateTimelineEventId()
      const id2 = generateTimelineEventId()
      expect(id1).toMatch(/^tle_\d+_\d+$/)
      expect(id2).toMatch(/^tle_\d+_\d+$/)
      expect(id1).not.toBe(id2)
    })
  })

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    describe('createDetailSectionReference', () => {
      it('should create section reference', () => {
        const ref = createDetailSectionReference(
          'section-1',
          'Employee',
          'emp-123',
          'hr'
        )
        expect(ref).toEqual({
          sectionId: 'section-1',
          entityType: 'Employee',
          entityId: 'emp-123',
          departmentId: 'hr',
        })
      })
    })

    describe('createDetailBlockReference', () => {
      it('should create block reference', () => {
        const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
        const blockRef = createDetailBlockReference('block-1', 'field', sectionRef)
        expect(blockRef).toEqual({
          blockId: 'block-1',
          blockType: 'field',
          sectionRef,
        })
      })
    })

    describe('createFieldBlockContent', () => {
      it('should create field content with basic options', () => {
        const content = createFieldBlockContent('name', 'John Doe', 'string')
        expect(content).toEqual({
          fieldName: 'name',
          fieldValue: 'John Doe',
          dataType: 'string',
        })
      })

      it('should create field content with full options', () => {
        const content = createFieldBlockContent('salary', 50000, 'number', {
          readOnly: true,
          format: 'currency',
        })
        expect(content).toEqual({
          fieldName: 'salary',
          fieldValue: 50000,
          dataType: 'number',
          readOnly: true,
          format: 'currency',
        })
      })
    })

    describe('createAttachmentBlockContent', () => {
      it('should create attachment content', () => {
        const content = createAttachmentBlockContent(
          'att-1',
          'document.pdf',
          'application/pdf',
          1024,
          '2024-01-01T00:00:00Z',
          'user-1'
        )
        expect(content).toEqual({
          attachmentId: 'att-1',
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          uploadedAt: '2024-01-01T00:00:00Z',
          uploadedBy: 'user-1',
        })
      })

      it('should create attachment content with URL', () => {
        const content = createAttachmentBlockContent(
          'att-1',
          'image.png',
          'image/png',
          2048,
          '2024-01-01T00:00:00Z',
          'user-1',
          'https://example.com/image.png'
        )
        expect(content.fileUrl).toBe('https://example.com/image.png')
      })
    })

    describe('createRelationBlockContent', () => {
      it('should create relation content', () => {
        const content = createRelationBlockContent(
          'rel-1',
          'Department',
          'dept-1',
          'Engineering',
          'parent'
        )
        expect(content).toEqual({
          relationId: 'rel-1',
          relatedEntityType: 'Department',
          relatedEntityId: 'dept-1',
          relatedEntityName: 'Engineering',
          relationType: 'parent',
        })
      })

      it('should create relation content with metadata', () => {
        const content = createRelationBlockContent(
          'rel-1',
          'Project',
          'proj-1',
          'Project X',
          'reference',
          { priority: 'high' }
        )
        expect(content.metadata).toEqual({ priority: 'high' })
      })
    })

    describe('createTimelineEvent', () => {
      it('should create timeline event with defaults', () => {
        const event = createTimelineEvent('created', 'Record created')
        expect(event.eventType).toBe('created')
        expect(event.title).toBe('Record created')
        expect(event.eventId).toMatch(/^tle_/)
        expect(event.timestamp).toBeDefined()
      })

      it('should create timeline event with full options', () => {
        const event = createTimelineEvent('updated', 'Status changed', {
          eventId: 'custom-id',
          timestamp: '2024-01-01T00:00:00Z',
          description: 'Status changed from pending to approved',
          userId: 'user-1',
          userName: 'John Doe',
          data: { oldValue: 'pending', newValue: 'approved' },
        })
        expect(event.eventId).toBe('custom-id')
        expect(event.timestamp).toBe('2024-01-01T00:00:00Z')
        expect(event.description).toBe('Status changed from pending to approved')
        expect(event.userId).toBe('user-1')
        expect(event.userName).toBe('John Doe')
        expect(event.data).toEqual({ oldValue: 'pending', newValue: 'approved' })
      })
    })

    describe('createTimelineBlockContent', () => {
      it('should create timeline block content', () => {
        const events = [
          createTimelineEvent('created', 'Created'),
          createTimelineEvent('updated', 'Updated'),
        ]
        const content = createTimelineBlockContent(events, 'Entity history')
        expect(content.events).toHaveLength(2)
        expect(content.context).toBe('Entity history')
      })
    })

    describe('createSummaryBlockContent', () => {
      it('should create summary content', () => {
        const content = createSummaryBlockContent(
          'Summary',
          'This is a summary',
          'markdown'
        )
        expect(content).toEqual({
          title: 'Summary',
          content: 'This is a summary',
          format: 'markdown',
        })
      })

      it('should create summary content with metrics', () => {
        const content = createSummaryBlockContent(
          'Performance',
          'Weekly metrics',
          'plain',
          [
            { label: 'Revenue', value: '$10,000', trend: 'up' },
            { label: 'Users', value: 1500 },
          ]
        )
        expect(content.metrics).toHaveLength(2)
        expect(content.metrics![0].trend).toBe('up')
      })
    })

    describe('createActionBlockContent', () => {
      it('should create action content', () => {
        const content = createActionBlockContent(
          'action-1',
          'Submit',
          'button',
          true
        )
        expect(content).toEqual({
          actionId: 'action-1',
          label: 'Submit',
          actionType: 'button',
          enabled: true,
        })
      })

      it('should create action content with options', () => {
        const content = createActionBlockContent(
          'action-1',
          'Delete',
          'api',
          true,
          { target: '/api/delete', requireConfirmation: true }
        )
        expect(content.target).toBe('/api/delete')
        expect(content.requireConfirmation).toBe(true)
      })
    })

    describe('createDetailBlockUpdate', () => {
      it('should create block update', () => {
        const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'Value', 'string')
        
        const update = createDetailBlockUpdate(blockRef, 'create', {
          content,
          requiredPermission: 'admin',
        })
        
        expect(update.updateId).toMatch(/^dbu_/)
        expect(update.blockRef).toBe(blockRef)
        expect(update.operation).toBe('create')
        expect(update.content).toBe(content)
        expect(update.requiredPermission).toBe('admin')
      })
    })

    describe('createDetailWritebackAction', () => {
      it('should create writeback action', () => {
        const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const updates = [createDetailBlockUpdate(blockRef, 'create')]
        
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        expect(action.actionId).toMatch(/^dwa_/)
        expect(action.sessionId).toBe('session-1')
        expect(action.sectionRef).toBe(sectionRef)
        expect(action.updates).toBe(updates)
        expect(action.status).toBe('pending')
        expect(action.createdAt).toBeDefined()
      })
    })

    describe('createDetailWritebackContract', () => {
      it('should create contract with defaults', () => {
        const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
        const contract = createDetailWritebackContract(
          sectionRef,
          ['field', 'timeline'],
          'user-1'
        )
        
        expect(contract.contractId).toMatch(/^dwc_/)
        expect(contract.sectionRef).toBe(sectionRef)
        expect(contract.allowedBlockTypes).toEqual(['field', 'timeline'])
        expect(contract.permissions.defaultPermission).toBe('write')
        expect(contract.createdBy).toBe('user-1')
      })

      it('should create contract with full options', () => {
        const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
        const contract = createDetailWritebackContract(
          sectionRef,
          ['field', 'attachment'],
          'user-1',
          {
            maxBlocks: 10,
            defaultPermission: 'admin',
            blockPermissions: {
              field: 'write',
              attachment: 'admin',
            },
            validationRules: [
              {
                ruleId: 'rule-1',
                blockType: 'field',
                ruleType: 'required',
                config: {},
                errorMessage: 'Field is required',
              },
            ],
          }
        )
        
        expect(contract.maxBlocks).toBe(10)
        expect(contract.permissions.defaultPermission).toBe('admin')
        expect(contract.permissions.blockPermissions).toEqual({
          field: 'write',
          attachment: 'admin',
        })
        expect(contract.validationRules).toHaveLength(1)
      })
    })
  })

  // ==========================================================================
  // Permission Checking
  // ==========================================================================

  describe('Permission Checking', () => {
    let contract: DetailWritebackContract

    beforeEach(() => {
      const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      contract = createDetailWritebackContract(
        sectionRef,
        ['field', 'attachment', 'timeline'],
        'user-1',
        {
          defaultPermission: 'write',
          blockPermissions: {
            attachment: 'admin',
          },
        }
      )
    })

    describe('checkDetailPermission', () => {
      it('should allow access when permission satisfies', () => {
        expect(checkDetailPermission(contract, 'field', 'write')).toBe(true)
        expect(checkDetailPermission(contract, 'field', 'admin')).toBe(true)
        expect(checkDetailPermission(contract, 'field', 'delete')).toBe(true)
      })

      it('should deny access when permission insufficient', () => {
        expect(checkDetailPermission(contract, 'field', 'read')).toBe(false)
        expect(checkDetailPermission(contract, 'field', 'none')).toBe(false)
      })

      it('should check block-specific permissions', () => {
        expect(checkDetailPermission(contract, 'attachment', 'write')).toBe(false)
        expect(checkDetailPermission(contract, 'attachment', 'admin')).toBe(true)
      })
    })

    describe('isBlockTypeAllowed', () => {
      it('should return true for allowed block types', () => {
        expect(isBlockTypeAllowed(contract, 'field')).toBe(true)
        expect(isBlockTypeAllowed(contract, 'attachment')).toBe(true)
        expect(isBlockTypeAllowed(contract, 'timeline')).toBe(true)
      })

      it('should return false for disallowed block types', () => {
        expect(isBlockTypeAllowed(contract, 'summary')).toBe(false)
        expect(isBlockTypeAllowed(contract, 'action')).toBe(false)
      })
    })

    describe('validateDetailBlockContent', () => {
      it('should pass validation when no rules', () => {
        const content = createFieldBlockContent('name', 'value', 'string')
        const result = validateDetailBlockContent(content, 'field', [])
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate required rule', () => {
        const rules: DetailValidationRule[] = [
          {
            ruleId: 'r1',
            blockType: 'field',
            ruleType: 'required',
            config: {},
            errorMessage: 'Field is required',
          },
        ]

        const validContent = createFieldBlockContent('name', 'value', 'string')
        const validResult = validateDetailBlockContent(validContent, 'field', rules)
        expect(validResult.valid).toBe(true)

        const invalidContent = createFieldBlockContent('name', null, 'string')
        const invalidResult = validateDetailBlockContent(invalidContent, 'field', rules)
        expect(invalidResult.valid).toBe(false)
        expect(invalidResult.errors).toContain('Field is required')
      })

      it('should validate format rule', () => {
        const rules: DetailValidationRule[] = [
          {
            ruleId: 'r1',
            blockType: 'field',
            ruleType: 'format',
            config: { pattern: '^\\d{3}-\\d{4}$' },
            errorMessage: 'Invalid format',
          },
        ]

        const validContent = createFieldBlockContent('code', '123-4567', 'string')
        const validResult = validateDetailBlockContent(validContent, 'field', rules)
        expect(validResult.valid).toBe(true)

        const invalidContent = createFieldBlockContent('code', 'abc', 'string')
        const invalidResult = validateDetailBlockContent(invalidContent, 'field', rules)
        expect(invalidResult.valid).toBe(false)
        expect(invalidResult.errors).toContain('Invalid format')
      })

      it('should validate size rule for attachment', () => {
        const rules: DetailValidationRule[] = [
          {
            ruleId: 'r1',
            blockType: 'attachment',
            ruleType: 'size',
            config: { maxSize: 1000 },
            errorMessage: 'File too large',
          },
        ]

        const validContent = createAttachmentBlockContent(
          'a1', 'file.txt', 'text/plain', 500, '2024-01-01', 'user-1'
        )
        const validResult = validateDetailBlockContent(validContent, 'attachment', rules)
        expect(validResult.valid).toBe(true)

        const invalidContent = createAttachmentBlockContent(
          'a1', 'large.pdf', 'application/pdf', 2000, '2024-01-01', 'user-1'
        )
        const invalidResult = validateDetailBlockContent(invalidContent, 'attachment', rules)
        expect(invalidResult.valid).toBe(false)
        expect(invalidResult.errors).toContain('File too large')
      })
    })
  })

  // ==========================================================================
  // Writeback Execution
  // ==========================================================================

  describe('Writeback Execution', () => {
    let sectionRef: DetailSectionReference
    let contract: DetailWritebackContract

    beforeEach(() => {
      sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      contract = createDetailWritebackContract(
        sectionRef,
        ['field', 'attachment', 'timeline', 'summary'],
        'user-1'
      )
    })

    describe('executeDetailBlockUpdate', () => {
      it('should create new block', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const update = createDetailBlockUpdate(blockRef, 'create', { content })
        
        const existingBlocks = new Map()
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(true)
        expect(result.blockId).toBe('b1')
        expect(existingBlocks.has('b1')).toBe(true)
      })

      it('should fail to create duplicate block', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const update = createDetailBlockUpdate(blockRef, 'create', { content })
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', content)
        
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('already exists')
      })

      it('should update existing block', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const oldContent = createFieldBlockContent('name', 'old', 'string')
        const newContent = createFieldBlockContent('name', 'new', 'string')
        const update = createDetailBlockUpdate(blockRef, 'update', { content: newContent })
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', oldContent)
        
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(true)
        expect(existingBlocks.get('b1')).toBe(newContent)
      })

      it('should fail to update non-existent block', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const update = createDetailBlockUpdate(blockRef, 'update', { content })
        
        const existingBlocks = new Map()
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('does not exist')
      })

      it('should delete existing block', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const update = createDetailBlockUpdate(blockRef, 'delete')
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', content)
        
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(true)
        expect(existingBlocks.has('b1')).toBe(false)
      })

      it('should append to timeline block', () => {
        const blockRef = createDetailBlockReference('b1', 'timeline', sectionRef)
        const existingEvents = [createTimelineEvent('created', 'Created')]
        const existingContent = createTimelineBlockContent(existingEvents)
        const newEvent = createTimelineEvent('updated', 'Updated')
        
        const update = createDetailBlockUpdate(blockRef, 'append', {
          appendContent: [newEvent],
        })
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', existingContent)
        
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(true)
        const updatedContent = existingBlocks.get('b1') as TimelineBlockContent
        expect(updatedContent.events).toHaveLength(2)
      })

      it('should fail append for non-timeline block', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const update = createDetailBlockUpdate(blockRef, 'append', {
          appendContent: [createTimelineEvent('test', 'Test')],
        })
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', content)
        
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('only supported for timeline')
      })

      it('should fail for disallowed block type', () => {
        const blockRef = createDetailBlockReference('b1', 'action', sectionRef) // action not in allowed types
        const content = createActionBlockContent('a1', 'Action', 'button', true)
        const update = createDetailBlockUpdate(blockRef, 'create', { content })
        
        const existingBlocks = new Map()
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('not allowed')
      })

      it('should replace block content', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const oldContent = createFieldBlockContent('name', 'old', 'string')
        const newContent = createFieldBlockContent('name', 'new', 'string')
        const update = createDetailBlockUpdate(blockRef, 'replace', { content: newContent })
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', oldContent)
        
        const result = executeDetailBlockUpdate(update, contract, existingBlocks)
        
        expect(result.success).toBe(true)
        expect(existingBlocks.get('b1')).toBe(newContent)
      })
    })

    describe('executeDetailWriteback', () => {
      it('should execute full writeback action', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const updates = [createDetailBlockUpdate(blockRef, 'create', { content })]
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        const result = executeDetailWriteback(action, contract, 'admin')
        
        expect(result.outcome.success).toBe(true)
        expect(result.outcome.totalBlocks).toBe(1)
        expect(result.outcome.successfulBlocks).toBe(1)
        expect(result.outcome.failedBlocks).toBe(0)
        expect(result.traces).toHaveLength(1)
        expect(result.blocks.has('b1')).toBe(true)
      })

      it('should handle permission denied', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const updates = [createDetailBlockUpdate(blockRef, 'create', { content })]
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        const result = executeDetailWriteback(action, contract, 'read')
        
        expect(result.outcome.success).toBe(false)
        expect(result.outcome.failedBlocks).toBe(1)
        expect(result.traces[0].status).toBe('skipped')
        expect(result.traces[0].details).toBe('Permission denied')
      })

      it('should support dry run mode', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const updates = [createDetailBlockUpdate(blockRef, 'create', { content })]
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        const result = executeDetailWriteback(action, contract, 'admin', { dryRun: true })
        
        expect(result.outcome.success).toBe(true)
        expect(result.blocks.has('b1')).toBe(false) // No actual changes
        expect(result.outcome.blockResults[0].warnings).toContain('Dry run - no actual changes made')
      })

      it('should handle partial success', () => {
        const blockRef1 = createDetailBlockReference('b1', 'field', sectionRef)
        const blockRef2 = createDetailBlockReference('b2', 'summary', sectionRef)
        
        const content1 = createFieldBlockContent('name', 'value', 'string')
        const updates = [
          createDetailBlockUpdate(blockRef1, 'create', { content: content1 }),
          createDetailBlockUpdate(blockRef2, 'create'), // No content - will fail
        ]
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        const result = executeDetailWriteback(action, contract, 'admin')
        
        expect(result.outcome.success).toBe(false)
        expect(result.outcome.successfulBlocks).toBe(1)
        expect(result.outcome.failedBlocks).toBe(1)
        expect(action.status).toBe('partial')
      })

      it('should respect skipPermissionCheck', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const content = createFieldBlockContent('name', 'value', 'string')
        const updates = [
          createDetailBlockUpdate(blockRef, 'create', {
            content,
            skipPermissionCheck: true,
          }),
        ]
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        const result = executeDetailWriteback(action, contract, 'none')
        
        expect(result.outcome.success).toBe(true)
      })

      it('should use provided existing blocks', () => {
        const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
        const existingContent = createFieldBlockContent('name', 'old', 'string')
        const newContent = createFieldBlockContent('name', 'new', 'string')
        const updates = [createDetailBlockUpdate(blockRef, 'update', { content: newContent })]
        const action = createDetailWritebackAction('session-1', sectionRef, updates)
        
        const existingBlocks = new Map()
        existingBlocks.set('b1', existingContent)
        
        const result = executeDetailWriteback(action, contract, 'admin', { existingBlocks })
        
        expect(result.outcome.success).toBe(true)
        expect(result.blocks.get('b1')).toBe(newContent)
      })
    })
  })

  // ==========================================================================
  // Store Operations
  // ==========================================================================

  describe('Store Operations', () => {
    let store: DetailWritebackStore
    let sectionRef: DetailSectionReference
    let contract: DetailWritebackContract

    beforeEach(() => {
      store = createDetailWritebackStore()
      sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      contract = createDetailWritebackContract(sectionRef, ['field'], 'user-1')
    })

    it('should register and retrieve contract', () => {
      registerDetailContract(store, contract)
      expect(getDetailContract(store, 's1')).toBe(contract)
    })

    it('should add and retrieve action', () => {
      const action = createDetailWritebackAction('session-1', sectionRef, [])
      addDetailAction(store, action)
      expect(getDetailAction(store, action.actionId)).toBe(action)
    })

    it('should get actions by section', () => {
      const action1 = createDetailWritebackAction('s1', sectionRef, [])
      const action2 = createDetailWritebackAction('s2', sectionRef, [])
      const otherSectionRef = createDetailSectionReference('s2', 'Entity', 'e2', 'dept')
      const action3 = createDetailWritebackAction('s3', otherSectionRef, [])
      
      addDetailAction(store, action1)
      addDetailAction(store, action2)
      addDetailAction(store, action3)
      
      const sectionActions = getDetailActionsBySection(store, 's1')
      expect(sectionActions).toHaveLength(2)
    })

    it('should get actions by session', () => {
      const action1 = createDetailWritebackAction('session-1', sectionRef, [])
      const action2 = createDetailWritebackAction('session-1', sectionRef, [])
      const action3 = createDetailWritebackAction('session-2', sectionRef, [])
      
      addDetailAction(store, action1)
      addDetailAction(store, action2)
      addDetailAction(store, action3)
      
      const sessionActions = getDetailActionsBySession(store, 'session-1')
      expect(sessionActions).toHaveLength(2)
    })

    it('should add and retrieve outcome', () => {
      const outcome: DetailWritebackOutcome = {
        actionId: 'action-1',
        success: true,
        blockResults: [],
        totalBlocks: 0,
        successfulBlocks: 0,
        failedBlocks: 0,
        completedAt: '2024-01-01T00:00:00Z',
      }
      
      addDetailOutcome(store, outcome)
      expect(getDetailOutcome(store, 'action-1')).toBe(outcome)
    })

    it('should add and retrieve traces', () => {
      const trace: DetailWritebackTrace = {
        traceId: 't1',
        actionId: 'a1',
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'create',
        blockId: 'b1',
        status: 'completed',
      }
      
      addDetailTraces(store, 'a1', [trace])
      expect(getDetailTraces(store, 'a1')).toHaveLength(1)
      
      // Should append to existing traces
      const trace2: DetailWritebackTrace = {
        ...trace,
        traceId: 't2',
        blockId: 'b2',
      }
      addDetailTraces(store, 'a1', [trace2])
      expect(getDetailTraces(store, 'a1')).toHaveLength(2)
    })
  })

  // ==========================================================================
  // Serialization
  // ==========================================================================

  describe('Serialization', () => {
    it('should serialize and deserialize section reference', () => {
      const ref = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      const json = serializeDetailSectionRef(ref)
      const restored = deserializeDetailSectionRef(json)
      expect(restored).toEqual(ref)
    })

    it('should serialize and deserialize block reference', () => {
      const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
      const json = serializeDetailBlockRef(blockRef)
      const restored = deserializeDetailBlockRef(json)
      expect(restored).toEqual(blockRef)
    })

    it('should serialize and deserialize action', () => {
      const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      const action = createDetailWritebackAction('session-1', sectionRef, [])
      const json = serializeDetailAction(action)
      const restored = deserializeDetailAction(json)
      expect(restored).toEqual(action)
    })

    it('should serialize and deserialize contract', () => {
      const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      const contract = createDetailWritebackContract(sectionRef, ['field'], 'user-1')
      const json = serializeDetailContract(contract)
      const restored = deserializeDetailContract(json)
      expect(restored).toEqual(contract)
    })

    it('should serialize and deserialize outcome', () => {
      const outcome: DetailWritebackOutcome = {
        actionId: 'a1',
        success: true,
        blockResults: [
          { updateId: 'u1', blockId: 'b1', success: true },
        ],
        totalBlocks: 1,
        successfulBlocks: 1,
        failedBlocks: 0,
        completedAt: '2024-01-01T00:00:00Z',
      }
      const json = serializeDetailOutcome(outcome)
      const restored = deserializeDetailOutcome(json)
      expect(restored).toEqual(outcome)
    })

    it('should serialize and deserialize store', () => {
      const store = createDetailWritebackStore()
      const sectionRef = createDetailSectionReference('s1', 'Entity', 'e1', 'dept')
      const contract = createDetailWritebackContract(sectionRef, ['field'], 'user-1')
      const action = createDetailWritebackAction('session-1', sectionRef, [])
      
      registerDetailContract(store, contract)
      addDetailAction(store, action)
      
      const json = serializeDetailWritebackStore(store)
      const restored = deserializeDetailWritebackStore(json)
      
      expect(restored.contracts.size).toBe(1)
      expect(restored.actions.size).toBe(1)
    })
  })

  // ==========================================================================
  // Debug Formatting
  // ==========================================================================

  describe('Debug Formatting', () => {
    let sectionRef: DetailSectionReference

    beforeEach(() => {
      sectionRef = createDetailSectionReference('s1', 'Employee', 'e1', 'hr')
    })

    it('should format section reference', () => {
      const formatted = formatDetailSectionRef(sectionRef)
      expect(formatted).toBe('DetailSection(s1, entity=Employee:e1)')
    })

    it('should format block reference', () => {
      const blockRef = createDetailBlockReference('b1', 'field', sectionRef)
      const formatted = formatDetailBlockRef(blockRef)
      expect(formatted).toBe('DetailBlock(b1, type=field)')
    })

    it('should format field block content', () => {
      const content = createFieldBlockContent('name', 'John', 'string')
      const formatted = formatDetailBlockContent(content, 'field')
      expect(formatted).toBe('Field(name="John")')
    })

    it('should format attachment block content', () => {
      const content = createAttachmentBlockContent(
        'a1', 'doc.pdf', 'application/pdf', 1024, '2024-01-01', 'user-1'
      )
      const formatted = formatDetailBlockContent(content, 'attachment')
      expect(formatted).toBe('Attachment(doc.pdf, application/pdf, 1024 bytes)')
    })

    it('should format relation block content', () => {
      const content = createRelationBlockContent(
        'r1', 'Department', 'd1', 'Engineering', 'parent'
      )
      const formatted = formatDetailBlockContent(content, 'relation')
      expect(formatted).toBe('Relation(parent: Engineering)')
    })

    it('should format timeline block content', () => {
      const content = createTimelineBlockContent([
        createTimelineEvent('created', 'Created'),
        createTimelineEvent('updated', 'Updated'),
      ])
      const formatted = formatDetailBlockContent(content, 'timeline')
      expect(formatted).toBe('Timeline(2 events)')
    })

    it('should format summary block content', () => {
      const content = createSummaryBlockContent('Overview', 'Content', 'plain')
      const formatted = formatDetailBlockContent(content, 'summary')
      expect(formatted).toBe('Summary(Overview)')
    })

    it('should format action block content', () => {
      const content = createActionBlockContent('a1', 'Submit', 'button', true)
      const formatted = formatDetailBlockContent(content, 'action')
      expect(formatted).toBe('Action(Submit, button)')
    })

    it('should format writeback result', () => {
      const result: DetailWritebackResult = {
        updateId: 'u1',
        blockId: 'b1',
        success: true,
      }
      const formatted = formatDetailWritebackResult(result)
      expect(formatted).toBe('SUCCESS block=b1')
    })

    it('should format writeback result with error', () => {
      const result: DetailWritebackResult = {
        updateId: 'u1',
        blockId: 'b1',
        success: false,
        error: 'Permission denied',
      }
      const formatted = formatDetailWritebackResult(result)
      expect(formatted).toContain('FAILED')
      expect(formatted).toContain('error=Permission denied')
    })

    it('should format writeback outcome', () => {
      const outcome: DetailWritebackOutcome = {
        actionId: 'a1',
        success: true,
        blockResults: [],
        totalBlocks: 5,
        successfulBlocks: 5,
        failedBlocks: 0,
        completedAt: '2024-01-01T00:00:00Z',
      }
      const formatted = formatDetailWritebackOutcome(outcome)
      expect(formatted).toBe('SUCCESS: 5/5 blocks updated')
    })

    it('should format partial outcome', () => {
      const outcome: DetailWritebackOutcome = {
        actionId: 'a1',
        success: false,
        blockResults: [],
        totalBlocks: 5,
        successfulBlocks: 3,
        failedBlocks: 2,
        completedAt: '2024-01-01T00:00:00Z',
      }
      const formatted = formatDetailWritebackOutcome(outcome)
      expect(formatted).toBe('PARTIAL: 3/5 blocks updated')
    })

    it('should format trace', () => {
      const trace: DetailWritebackTrace = {
        traceId: 't1',
        actionId: 'a1',
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'create',
        blockId: 'b1',
        status: 'completed',
        durationMs: 50,
      }
      const formatted = formatDetailTrace(trace)
      expect(formatted).toContain('create')
      expect(formatted).toContain('block=b1')
      expect(formatted).toContain('completed')
      expect(formatted).toContain('50ms')
    })
  })
})
