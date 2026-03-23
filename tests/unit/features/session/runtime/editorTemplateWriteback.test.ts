/**
 * Editor and Template Writeback Module Tests
 * Task 87: Story 49.4 - Editor and Template Writeback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type EditorReference,
  type TemplateReference,
  type ContentPosition,
  type ContentRange,
  type EditorState,
  type TemplateState,
  type EditorWritebackOperation,
  type TemplateWritebackOperation,
  type EditorWritebackAction,
  type TemplateWritebackAction,
  type EditorWritebackContract,
  type TemplateWritebackContract,
  type EditorWritebackResult,
  type TemplateWritebackResult,
  type EditorWritebackOutcome,
  type TemplateWritebackOutcome,
  type EditorWritebackTrace,
  type TemplateWritebackTrace,
  type WritebackAuditEntry,
  type EditorWritebackStore,
  type TemplateWritebackStore,

  // ID Generation
  generateEditorOperationId,
  generateTemplateOperationId,
  generateEditorActionId,
  generateTemplateActionId,
  generateEditorContractId,
  generateTemplateContractId,
  generateEditorTraceId,
  generateTemplateTraceId,
  generateAuditEntryId,

  // Factory Functions
  createEditorReference,
  createTemplateReference,
  createContentPosition,
  createContentRange,
  createTextContentUpdate,
  createTemplateSlotRef,
  createTemplateContentUpdate,
  createEditorState,
  createTemplateState,
  createEditorWritebackOperation,
  createTemplateWritebackOperation,
  createEditorWritebackAction,
  createTemplateWritebackAction,
  createEditorWritebackContract,
  createTemplateWritebackContract,

  // Permission Checking
  isEditorTypeAllowed,
  isTemplateTypeAllowed,
  isSlotAllowed,
  checkEditorPermission,
  checkSlotPermission,
  checkContentSize,
  checkLanguage,

  // Execution
  executeEditorOperation,
  executeEditorWriteback,
  executeTemplateOperation,
  executeTemplateWriteback,

  // Store Operations
  createEditorWritebackStore,
  createTemplateWritebackStore,
  registerEditorContract,
  getEditorContract,
  addEditorToStore,
  getEditorFromStore,
  addEditorAction,
  getEditorAction,
  getEditorActionsBySession,
  addEditorOutcome,
  getEditorOutcome,
  addEditorTraces,
  getEditorTraces,
  addEditorAuditEntry,
  registerTemplateContract,
  getTemplateContract,
  addTemplateToStore,
  getTemplateFromStore,
  addTemplateAction,
  getTemplateAction,
  getTemplateActionsBySession,
  addTemplateOutcome,
  getTemplateOutcome,
  addTemplateTraces,
  getTemplateTraces,
  addTemplateAuditEntry,

  // Serialization
  serializeEditorRef,
  deserializeEditorRef,
  serializeTemplateRef,
  deserializeTemplateRef,
  serializeEditorState,
  deserializeEditorState,
  serializeTemplateState,
  deserializeTemplateState,
  serializeEditorAction,
  deserializeEditorAction,
  serializeTemplateAction,
  deserializeTemplateAction,
  serializeEditorContract,
  deserializeEditorContract,
  serializeTemplateContract,
  deserializeTemplateContract,
  serializeEditorOutcome,
  deserializeEditorOutcome,
  serializeTemplateOutcome,
  deserializeTemplateOutcome,
  serializeEditorWritebackStore,
  deserializeEditorWritebackStore,
  serializeTemplateWritebackStore,
  deserializeTemplateWritebackStore,

  // Debug Formatting
  formatEditorRef,
  formatTemplateRef,
  formatContentRange,
  formatEditorState,
  formatTemplateState,
  formatEditorWritebackResult,
  formatTemplateWritebackResult,
  formatEditorWritebackOutcome,
  formatTemplateWritebackOutcome,
  formatEditorTrace,
  formatTemplateTrace,
} from '@/features/session/runtime/editorTemplateWriteback'

describe('Editor and Template Writeback', () => {
  describe('ID Generation', () => {
    it('should generate unique editor operation IDs', () => {
      const id1 = generateEditorOperationId()
      const id2 = generateEditorOperationId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^editor-op-\d+-\d+$/)
    })

    it('should generate unique template operation IDs', () => {
      const id1 = generateTemplateOperationId()
      const id2 = generateTemplateOperationId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^template-op-\d+-\d+$/)
    })

    it('should generate unique editor action IDs', () => {
      const id1 = generateEditorActionId()
      const id2 = generateEditorActionId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^editor-action-\d+-\d+$/)
    })

    it('should generate unique template action IDs', () => {
      const id1 = generateTemplateActionId()
      const id2 = generateTemplateActionId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^template-action-\d+-\d+$/)
    })

    it('should generate unique contract IDs', () => {
      const editorId = generateEditorContractId()
      const templateId = generateTemplateContractId()
      expect(editorId).toMatch(/^editor-contract-\d+-\d+$/)
      expect(templateId).toMatch(/^template-contract-\d+-\d+$/)
    })

    it('should generate unique trace IDs', () => {
      const editorTrace = generateEditorTraceId()
      const templateTrace = generateTemplateTraceId()
      expect(editorTrace).toMatch(/^editor-trace-\d+-\d+$/)
      expect(templateTrace).toMatch(/^template-trace-\d+-\d+$/)
    })

    it('should generate unique audit entry IDs', () => {
      const id1 = generateAuditEntryId()
      const id2 = generateAuditEntryId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^audit-\d+-\d+$/)
    })
  })

  describe('Factory Functions', () => {
    describe('Editor Reference', () => {
      it('should create editor reference with required fields', () => {
        const ref = createEditorReference('editor-1', 'text')
        expect(ref.editorId).toBe('editor-1')
        expect(ref.editorType).toBe('text')
        expect(ref.filePath).toBeUndefined()
        expect(ref.documentId).toBeUndefined()
      })

      it('should create editor reference with optional fields', () => {
        const ref = createEditorReference('editor-1', 'code', {
          filePath: '/src/index.ts',
          documentId: 'doc-123',
        })
        expect(ref.filePath).toBe('/src/index.ts')
        expect(ref.documentId).toBe('doc-123')
      })
    })

    describe('Template Reference', () => {
      it('should create template reference with required fields', () => {
        const ref = createTemplateReference('template-1', 'document', 'My Template')
        expect(ref.templateId).toBe('template-1')
        expect(ref.templateType).toBe('document')
        expect(ref.name).toBe('My Template')
        expect(ref.version).toBeUndefined()
      })

      it('should create template reference with version', () => {
        const ref = createTemplateReference('template-1', 'email', 'Email Template', {
          version: '1.0.0',
        })
        expect(ref.version).toBe('1.0.0')
      })
    })

    describe('Content Position and Range', () => {
      it('should create content position', () => {
        const pos = createContentPosition(5, 10)
        expect(pos.line).toBe(5)
        expect(pos.column).toBe(10)
      })

      it('should create content range', () => {
        const range = createContentRange(1, 1, 5, 10)
        expect(range.start.line).toBe(1)
        expect(range.start.column).toBe(1)
        expect(range.end.line).toBe(5)
        expect(range.end.column).toBe(10)
      })
    })

    describe('Text Content Update', () => {
      it('should create text content update with content only', () => {
        const update = createTextContentUpdate('Hello World')
        expect(update.content).toBe('Hello World')
        expect(update.range).toBeUndefined()
        expect(update.position).toBeUndefined()
      })

      it('should create text content update with range', () => {
        const range = createContentRange(1, 1, 1, 5)
        const update = createTextContentUpdate('New', { range })
        expect(update.range).toEqual(range)
      })
    })

    describe('Template Slot Reference', () => {
      it('should create template slot ref', () => {
        const slot = createTemplateSlotRef('title')
        expect(slot.slotName).toBe('title')
        expect(slot.slotPath).toBeUndefined()
      })

      it('should create template slot ref with path', () => {
        const slot = createTemplateSlotRef('content', ['section', 'paragraph'])
        expect(slot.slotPath).toEqual(['section', 'paragraph'])
      })
    })

    describe('Template Content Update', () => {
      it('should create template content update with string content', () => {
        const slot = createTemplateSlotRef('title')
        const update = createTemplateContentUpdate(slot, 'Hello', 'plain')
        expect(update.slot).toEqual(slot)
        expect(update.content).toBe('Hello')
        expect(update.format).toBe('plain')
      })

      it('should create template content update with object content', () => {
        const slot = createTemplateSlotRef('data')
        const content = { value: 123, label: 'Test' }
        const update = createTemplateContentUpdate(slot, content, 'json')
        expect(update.content).toEqual(content)
        expect(update.format).toBe('json')
      })
    })

    describe('Editor State', () => {
      it('should create editor state with default values', () => {
        const state = createEditorState('Hello World')
        expect(state.content).toBe('Hello World')
        expect(state.contentHash).toBeDefined()
        expect(state.isDirty).toBe(false)
        expect(state.version).toBe(1)
      })

      it('should create editor state with options', () => {
        const state = createEditorState('Hello', {
          isDirty: true,
          lastSavedContent: 'Saved',
          lastSavedAt: '2026-01-01T00:00:00Z',
          version: 5,
          language: 'typescript',
          encoding: 'utf-8',
        })
        expect(state.isDirty).toBe(true)
        expect(state.lastSavedContent).toBe('Saved')
        expect(state.version).toBe(5)
        expect(state.language).toBe('typescript')
      })
    })

    describe('Template State', () => {
      it('should create template state with default values', () => {
        const state = createTemplateState('template-1')
        expect(state.templateId).toBe('template-1')
        expect(state.slotValues).toEqual({})
        expect(state.dirtySlots).toBeInstanceOf(Set)
        expect(state.dirtySlots.size).toBe(0)
        expect(state.version).toBe(1)
      })

      it('should create template state with slot values', () => {
        const slotValues = { title: 'Hello', body: 'World' }
        const state = createTemplateState('template-1', slotValues)
        expect(state.slotValues).toEqual(slotValues)
      })
    })

    describe('Editor Writeback Operation', () => {
      const editorRef = createEditorReference('editor-1', 'text')

      it('should create replace operation', () => {
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'New content',
        })
        expect(op.operation).toBe('replace')
        expect(op.newContent).toBe('New content')
        expect(op.operationId).toBeDefined()
      })

      it('should create insert operation', () => {
        const pos = createContentPosition(1, 1)
        const op = createEditorWritebackOperation(editorRef, 'insert', {
          update: createTextContentUpdate('Inserted'),
          position: pos,
        })
        expect(op.operation).toBe('insert')
        expect(op.update?.content).toBe('Inserted')
        expect(op.position).toEqual(pos)
      })

      it('should create delete operation', () => {
        const range = createContentRange(1, 1, 5, 1)
        const op = createEditorWritebackOperation(editorRef, 'delete', {
          range,
        })
        expect(op.operation).toBe('delete')
        expect(op.range).toEqual(range)
      })
    })

    describe('Template Writeback Operation', () => {
      const templateRef = createTemplateReference('template-1', 'document', 'Test')
      const slot = createTemplateSlotRef('title')

      it('should create fill operation', () => {
        const op = createTemplateWritebackOperation(templateRef, 'fill', slot, {
          update: createTemplateContentUpdate(slot, 'Title'),
        })
        expect(op.operation).toBe('fill')
        expect(op.slot).toEqual(slot)
      })

      it('should create clear operation', () => {
        const op = createTemplateWritebackOperation(templateRef, 'clear', slot)
        expect(op.operation).toBe('clear')
      })
    })

    describe('Editor Writeback Action', () => {
      it('should create editor writeback action', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'Test',
        })
        const action = createEditorWritebackAction('session-1', editorRef, [op])
        expect(action.sessionId).toBe('session-1')
        expect(action.editorRef).toEqual(editorRef)
        expect(action.operations).toHaveLength(1)
        expect(action.status).toBe('pending')
        expect(action.timestamp).toBeDefined()
      })
    })

    describe('Template Writeback Action', () => {
      it('should create template writeback action', () => {
        const templateRef = createTemplateReference('template-1', 'document', 'Test')
        const slot = createTemplateSlotRef('title')
        const op = createTemplateWritebackOperation(templateRef, 'fill', slot, {
          update: createTemplateContentUpdate(slot, 'Title'),
        })
        const action = createTemplateWritebackAction('session-1', templateRef, [op])
        expect(action.sessionId).toBe('session-1')
        expect(action.templateRef).toEqual(templateRef)
        expect(action.operations).toHaveLength(1)
        expect(action.status).toBe('pending')
      })
    })

    describe('Editor Writeback Contract', () => {
      it('should create editor writeback contract with defaults', () => {
        const contract = createEditorWritebackContract()
        expect(contract.contractId).toBeDefined()
        expect(contract.allowedEditorTypes).toContain('text')
        expect(contract.allowedEditorTypes).toContain('code')
        expect(contract.requiredPermission).toBe('write')
        expect(contract.allowDirtyOverwrite).toBe(true)
        expect(contract.requireConfirmationOnDirty).toBe(true)
        expect(contract.preserveVersionBoundaries).toBe(true)
        expect(contract.auditLevel).toBe('basic')
      })

      it('should create editor writeback contract with options', () => {
        const contract = createEditorWritebackContract({
          allowedEditorTypes: ['text', 'code'],
          requiredPermission: 'admin',
          allowDirtyOverwrite: false,
          maxContentSize: 10000,
          allowedLanguages: ['typescript', 'javascript'],
          autoSaveAfterWriteback: true,
          auditLevel: 'full',
        })
        expect(contract.allowedEditorTypes).toEqual(['text', 'code'])
        expect(contract.requiredPermission).toBe('admin')
        expect(contract.allowDirtyOverwrite).toBe(false)
        expect(contract.maxContentSize).toBe(10000)
        expect(contract.allowedLanguages).toEqual(['typescript', 'javascript'])
        expect(contract.autoSaveAfterWriteback).toBe(true)
        expect(contract.auditLevel).toBe('full')
      })
    })

    describe('Template Writeback Contract', () => {
      it('should create template writeback contract with defaults', () => {
        const contract = createTemplateWritebackContract()
        expect(contract.contractId).toBeDefined()
        expect(contract.allowedTemplateTypes).toContain('document')
        expect(contract.requiredPermission).toBe('write')
        expect(contract.requireSlotValidation).toBe(true)
        expect(contract.auditLevel).toBe('basic')
      })

      it('should create template writeback contract with slot permissions', () => {
        const contract = createTemplateWritebackContract({
          allowedSlots: ['title', 'body'],
          slotPermissions: { title: 'write', body: 'read' },
        })
        expect(contract.allowedSlots).toEqual(['title', 'body'])
        expect(contract.slotPermissions).toEqual({ title: 'write', body: 'read' })
      })
    })
  })

  describe('Permission Checking', () => {
    describe('Editor Type Checking', () => {
      it('should allow allowed editor types', () => {
        const contract = createEditorWritebackContract({
          allowedEditorTypes: ['text', 'code'],
        })
        expect(isEditorTypeAllowed(contract, 'text')).toBe(true)
        expect(isEditorTypeAllowed(contract, 'code')).toBe(true)
      })

      it('should deny disallowed editor types', () => {
        const contract = createEditorWritebackContract({
          allowedEditorTypes: ['text'],
        })
        expect(isEditorTypeAllowed(contract, 'code')).toBe(false)
      })
    })

    describe('Template Type Checking', () => {
      it('should allow allowed template types', () => {
        const contract = createTemplateWritebackContract({
          allowedTemplateTypes: ['document', 'email'],
        })
        expect(isTemplateTypeAllowed(contract, 'document')).toBe(true)
        expect(isTemplateTypeAllowed(contract, 'email')).toBe(true)
      })

      it('should deny disallowed template types', () => {
        const contract = createTemplateWritebackContract({
          allowedTemplateTypes: ['document'],
        })
        expect(isTemplateTypeAllowed(contract, 'email')).toBe(false)
      })
    })

    describe('Slot Checking', () => {
      it('should allow all slots when no restriction', () => {
        const contract = createTemplateWritebackContract()
        expect(isSlotAllowed(contract, 'any-slot')).toBe(true)
      })

      it('should allow only specified slots', () => {
        const contract = createTemplateWritebackContract({
          allowedSlots: ['title', 'body'],
        })
        expect(isSlotAllowed(contract, 'title')).toBe(true)
        expect(isSlotAllowed(contract, 'footer')).toBe(false)
      })
    })

    describe('Editor Permission', () => {
      it('should allow with sufficient permission', () => {
        const contract = createEditorWritebackContract({
          requiredPermission: 'write',
        })
        const result = checkEditorPermission(contract, 'write')
        expect(result.allowed).toBe(true)
      })

      it('should deny with insufficient permission', () => {
        const contract = createEditorWritebackContract({
          requiredPermission: 'admin',
        })
        const result = checkEditorPermission(contract, 'write')
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe('Insufficient permission')
      })

      it('should deny dirty overwrite when not allowed', () => {
        const contract = createEditorWritebackContract({
          allowDirtyOverwrite: false,
        })
        const state = createEditorState('content', { isDirty: true })
        const result = checkEditorPermission(contract, 'write', state)
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe('Editor has unsaved changes')
      })

      it('should allow dirty overwrite when allowed', () => {
        const contract = createEditorWritebackContract({
          allowDirtyOverwrite: true,
        })
        const state = createEditorState('content', { isDirty: true })
        const result = checkEditorPermission(contract, 'write', state)
        expect(result.allowed).toBe(true)
      })
    })

    describe('Slot Permission', () => {
      it('should check slot-level permission', () => {
        const contract = createTemplateWritebackContract({
          slotPermissions: { title: 'admin', body: 'write' },
        })
        const titleResult = checkSlotPermission(contract, 'title', 'write')
        expect(titleResult.allowed).toBe(false)
        const bodyResult = checkSlotPermission(contract, 'body', 'write')
        expect(bodyResult.allowed).toBe(true)
      })

      it('should deny disallowed slots', () => {
        const contract = createTemplateWritebackContract({
          allowedSlots: ['title'],
        })
        const result = checkSlotPermission(contract, 'body', 'write')
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('not allowed')
      })
    })

    describe('Content Size', () => {
      it('should allow content within limit', () => {
        const contract = createEditorWritebackContract({
          maxContentSize: 100,
        })
        const result = checkContentSize(contract, 'a'.repeat(50))
        expect(result.valid).toBe(true)
      })

      it('should deny content exceeding limit', () => {
        const contract = createEditorWritebackContract({
          maxContentSize: 10,
        })
        const result = checkContentSize(contract, 'a'.repeat(20))
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('exceeds maximum')
      })

      it('should allow any size when no limit', () => {
        const contract = createEditorWritebackContract()
        const result = checkContentSize(contract, 'a'.repeat(10000))
        expect(result.valid).toBe(true)
      })
    })

    describe('Language Checking', () => {
      it('should allow allowed languages', () => {
        const contract = createEditorWritebackContract({
          allowedLanguages: ['typescript', 'javascript'],
        })
        expect(checkLanguage(contract, 'typescript').valid).toBe(true)
        expect(checkLanguage(contract, 'javascript').valid).toBe(true)
      })

      it('should deny disallowed languages', () => {
        const contract = createEditorWritebackContract({
          allowedLanguages: ['typescript'],
        })
        const result = checkLanguage(contract, 'python')
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('not allowed')
      })

      it('should allow any language when no restriction', () => {
        const contract = createEditorWritebackContract()
        expect(checkLanguage(contract, 'any-language').valid).toBe(true)
      })
    })
  })

  describe('Editor Operation Execution', () => {
    let contract: EditorWritebackContract

    beforeEach(() => {
      contract = createEditorWritebackContract()
    })

    describe('Replace Operation', () => {
      it('should replace entire content', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Old content')
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'New content',
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.content).toBe('New content')
        expect(newState.version).toBe(2) // Version incremented
        expect(result.newVersion).toBe(2)
      })

      it('should fail without new content', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Content')
        const op = createEditorWritebackOperation(editorRef, 'replace')

        const { result } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('New content required')
      })
    })

    describe('Insert Operation', () => {
      it('should insert at position', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Hello World')
        const op = createEditorWritebackOperation(editorRef, 'insert', {
          update: createTextContentUpdate('Beautiful '),
          position: createContentPosition(1, 7), // After 'Hello ' (column 7 = after space)
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.content).toBe('Hello Beautiful World')
      })

      it('should insert at beginning', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('World')
        const op = createEditorWritebackOperation(editorRef, 'insert', {
          update: createTextContentUpdate('Hello '),
          position: createContentPosition(1, 1),
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.content).toBe('Hello World')
      })

      it('should fail without content', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Content')
        const op = createEditorWritebackOperation(editorRef, 'insert')

        const { result } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Content required')
      })
    })

    describe('Append Operation', () => {
      it('should append to end', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Hello')
        const op = createEditorWritebackOperation(editorRef, 'append', {
          update: createTextContentUpdate(' World'),
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.content).toBe('Hello World')
      })
    })

    describe('Prepend Operation', () => {
      it('should prepend to beginning', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('World')
        const op = createEditorWritebackOperation(editorRef, 'prepend', {
          update: createTextContentUpdate('Hello '),
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.content).toBe('Hello World')
      })
    })

    describe('Delete Operation', () => {
      it('should delete lines in range', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Line1\nLine2\nLine3\nLine4')
        const op = createEditorWritebackOperation(editorRef, 'delete', {
          range: createContentRange(2, 1, 3, 5),
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.content).toBe('Line1\nLine4')
      })

      it('should fail without range', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Content')
        const op = createEditorWritebackOperation(editorRef, 'delete')

        const { result } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Range required')
      })
    })

    describe('Format Operation', () => {
      it('should return warning for format operation', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Content')
        const op = createEditorWritebackOperation(editorRef, 'format')

        const { result } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(result.warnings).toBeDefined()
        expect(result.warnings).toContain('Format operation not implemented in basic editor')
      })
    })

    describe('Type Checking', () => {
      it('should deny disallowed editor type', () => {
        const limitedContract = createEditorWritebackContract({
          allowedEditorTypes: ['text'],
        })
        const editorRef = createEditorReference('editor-1', 'code')
        const state = createEditorState('Content')
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'New',
        })

        const { result } = executeEditorOperation(op, limitedContract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Editor type')
        expect(result.error).toContain('not allowed')
      })
    })

    describe('Content Size Checking', () => {
      it('should deny content exceeding size limit', () => {
        const limitedContract = createEditorWritebackContract({
          maxContentSize: 10,
        })
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('')
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'a'.repeat(20),
        })

        const { result } = executeEditorOperation(op, limitedContract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('exceeds maximum')
      })
    })

    describe('Dirty State', () => {
      it('should mark as dirty after change', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Old', { lastSavedContent: 'Old' })
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'New',
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.isDirty).toBe(true)
        expect(result.isDirty).toBe(true)
      })

      it('should not be dirty if same as saved', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Saved', { lastSavedContent: 'Saved' })
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'Saved',
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.isDirty).toBe(false)
      })
    })

    describe('Version Boundaries', () => {
      it('should preserve version boundaries', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Content', { version: 5 })
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'New',
        })

        const { result, newState } = executeEditorOperation(op, contract, state)

        expect(newState.version).toBe(6)
      })

      it('should not increment version when disabled', () => {
        const noVersionContract = createEditorWritebackContract({
          preserveVersionBoundaries: false,
        })
        const editorRef = createEditorReference('editor-1', 'text')
        const state = createEditorState('Content', { version: 5 })
        const op = createEditorWritebackOperation(editorRef, 'replace', {
          newContent: 'New',
        })

        const { newState } = executeEditorOperation(op, noVersionContract, state)

        expect(newState.version).toBe(5)
      })
    })
  })

  describe('Editor Writeback Execution', () => {
    let contract: EditorWritebackContract

    beforeEach(() => {
      contract = createEditorWritebackContract()
    })

    it('should execute multiple operations', () => {
      const editorRef = createEditorReference('editor-1', 'text')
      const ops = [
        createEditorWritebackOperation(editorRef, 'replace', { newContent: 'Line1\nLine2\nLine3' }),
        createEditorWritebackOperation(editorRef, 'append', { update: createTextContentUpdate('\nLine4') }),
      ]
      const action = createEditorWritebackAction('session-1', editorRef, ops)

      const { outcome, editorState } = executeEditorWriteback(action, contract, 'write', 'hr')

      expect(outcome.success).toBe(true)
      expect(outcome.totalOperations).toBe(2)
      expect(outcome.successfulOperations).toBe(2)
      expect(editorState.content).toBe('Line1\nLine2\nLine3\nLine4')
    })

    it('should handle permission denial', () => {
      const strictContract = createEditorWritebackContract({
        requiredPermission: 'admin',
      })
      const editorRef = createEditorReference('editor-1', 'text')
      const op = createEditorWritebackOperation(editorRef, 'replace', { newContent: 'New' })
      const action = createEditorWritebackAction('session-1', editorRef, [op])

      const { outcome } = executeEditorWriteback(action, strictContract, 'write', 'hr')

      expect(outcome.success).toBe(false)
      expect(outcome.failedOperations).toBe(1)
    })

    it('should support dry run mode', () => {
      const editorRef = createEditorReference('editor-1', 'text')
      const initialState = createEditorState('Original')
      const op = createEditorWritebackOperation(editorRef, 'replace', { newContent: 'New' })
      const action = createEditorWritebackAction('session-1', editorRef, [op])

      const { outcome, editorState } = executeEditorWriteback(action, contract, 'write', 'hr', {
        existingEditor: initialState,
        dryRun: true,
      })

      expect(outcome.success).toBe(true)
      expect(editorState.content).toBe('Original') // Unchanged
      expect(outcome.results[0].warnings).toContain('Dry run - no actual changes made')
    })

    it('should skip permission check when requested', () => {
      const strictContract = createEditorWritebackContract({
        requiredPermission: 'admin',
      })
      const editorRef = createEditorReference('editor-1', 'text')
      const op = createEditorWritebackOperation(editorRef, 'replace', {
        newContent: 'New',
        skipPermissionCheck: true,
      })
      const action = createEditorWritebackAction('session-1', editorRef, [op])

      const { outcome } = executeEditorWriteback(action, strictContract, 'read', 'hr')

      expect(outcome.success).toBe(true)
    })

    it('should generate traces for each operation', () => {
      const editorRef = createEditorReference('editor-1', 'text')
      const ops = [
        createEditorWritebackOperation(editorRef, 'replace', { newContent: 'Line1' }),
        createEditorWritebackOperation(editorRef, 'append', { update: createTextContentUpdate('\nLine2') }),
      ]
      const action = createEditorWritebackAction('session-1', editorRef, ops)

      const { traces } = executeEditorWriteback(action, contract, 'write', 'hr')

      expect(traces).toHaveLength(2)
      expect(traces[0].operation).toBe('replace')
      expect(traces[1].operation).toBe('append')
      expect(traces[0].status).toBe('completed')
      expect(traces[1].status).toBe('completed')
    })

    it('should update action status', () => {
      const editorRef = createEditorReference('editor-1', 'text')
      const op = createEditorWritebackOperation(editorRef, 'replace', { newContent: 'New' })
      const action = createEditorWritebackAction('session-1', editorRef, [op])

      executeEditorWriteback(action, contract, 'write', 'hr')

      expect(action.status).toBe('completed')
    })
  })

  describe('Template Operation Execution', () => {
    let contract: TemplateWritebackContract
    let templateRef: TemplateReference
    let slot: ReturnType<typeof createTemplateSlotRef>

    beforeEach(() => {
      contract = createTemplateWritebackContract()
      templateRef = createTemplateReference('template-1', 'document', 'Test')
      slot = createTemplateSlotRef('title')
    })

    describe('Fill Operation', () => {
      it('should fill a slot', () => {
        const state = createTemplateState('template-1')
        const op = createTemplateWritebackOperation(templateRef, 'fill', slot, {
          update: createTemplateContentUpdate(slot, 'Hello'),
        })

        const { result, newState } = executeTemplateOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.slotValues['title']).toBe('Hello')
        expect(newState.dirtySlots.has('title')).toBe(true)
      })

      it('should fail without content', () => {
        const state = createTemplateState('template-1')
        const op = createTemplateWritebackOperation(templateRef, 'fill', slot)

        const { result } = executeTemplateOperation(op, contract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Content required')
      })
    })

    describe('Replace Operation', () => {
      it('should replace slot content', () => {
        const state = createTemplateState('template-1', { title: 'Old' })
        const op = createTemplateWritebackOperation(templateRef, 'replace', slot, {
          update: createTemplateContentUpdate(slot, 'New'),
        })

        const { result, newState } = executeTemplateOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.slotValues['title']).toBe('New')
        expect(newState.dirtySlots.has('title')).toBe(true)
      })
    })

    describe('Clear Operation', () => {
      it('should clear a slot', () => {
        const state = createTemplateState('template-1', { title: 'To Clear' })
        const op = createTemplateWritebackOperation(templateRef, 'clear', slot)

        const { result, newState } = executeTemplateOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.slotValues['title']).toBeUndefined()
        expect(newState.dirtySlots.has('title')).toBe(true)
      })
    })

    describe('Reset Operation', () => {
      it('should reset to last saved value', () => {
        const state = createTemplateState('template-1', { title: 'Current' }, {
          lastSavedValues: { title: 'Saved' },
        })
        const op = createTemplateWritebackOperation(templateRef, 'reset', slot)

        const { result, newState } = executeTemplateOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.slotValues['title']).toBe('Saved')
      })

      it('should clear if no saved value', () => {
        const state = createTemplateState('template-1', { title: 'Current' })
        const op = createTemplateWritebackOperation(templateRef, 'reset', slot)

        const { result, newState } = executeTemplateOperation(op, contract, state)

        expect(result.success).toBe(true)
        expect(newState.slotValues['title']).toBeUndefined()
      })
    })

    describe('Slot Checking', () => {
      it('should deny disallowed slot', () => {
        const limitedContract = createTemplateWritebackContract({
          allowedSlots: ['body'],
        })
        const state = createTemplateState('template-1')
        const op = createTemplateWritebackOperation(templateRef, 'fill', slot, {
          update: createTemplateContentUpdate(slot, 'Hello'),
        })

        const { result } = executeTemplateOperation(op, limitedContract, state)

        expect(result.success).toBe(false)
        expect(result.error).toContain('not allowed')
      })
    })
  })

  describe('Template Writeback Execution', () => {
    let contract: TemplateWritebackContract
    let templateRef: TemplateReference

    beforeEach(() => {
      contract = createTemplateWritebackContract()
      templateRef = createTemplateReference('template-1', 'document', 'Test')
    })

    it('should execute multiple operations', () => {
      const titleSlot = createTemplateSlotRef('title')
      const bodySlot = createTemplateSlotRef('body')
      const ops = [
        createTemplateWritebackOperation(templateRef, 'fill', titleSlot, {
          update: createTemplateContentUpdate(titleSlot, 'Title'),
        }),
        createTemplateWritebackOperation(templateRef, 'fill', bodySlot, {
          update: createTemplateContentUpdate(bodySlot, 'Body'),
        }),
      ]
      const action = createTemplateWritebackAction('session-1', templateRef, ops)

      const { outcome, templateState } = executeTemplateWriteback(action, contract, 'write', 'hr')

      expect(outcome.success).toBe(true)
      expect(outcome.totalOperations).toBe(2)
      expect(templateState.slotValues['title']).toBe('Title')
      expect(templateState.slotValues['body']).toBe('Body')
    })

    it('should handle permission denial', () => {
      const strictContract = createTemplateWritebackContract({
        slotPermissions: { title: 'admin' },
      })
      const slot = createTemplateSlotRef('title')
      const op = createTemplateWritebackOperation(templateRef, 'fill', slot, {
        update: createTemplateContentUpdate(slot, 'Hello'),
      })
      const action = createTemplateWritebackAction('session-1', templateRef, [op])

      const { outcome } = executeTemplateWriteback(action, strictContract, 'write', 'hr')

      expect(outcome.success).toBe(false)
      expect(outcome.failedOperations).toBe(1)
    })

    it('should support dry run mode', () => {
      const slot = createTemplateSlotRef('title')
      const initialState = createTemplateState('template-1', { title: 'Original' })
      const op = createTemplateWritebackOperation(templateRef, 'fill', slot, {
        update: createTemplateContentUpdate(slot, 'New'),
      })
      const action = createTemplateWritebackAction('session-1', templateRef, [op])

      const { outcome, templateState } = executeTemplateWriteback(action, contract, 'write', 'hr', {
        existingTemplate: initialState,
        dryRun: true,
      })

      expect(outcome.success).toBe(true)
      expect(templateState.slotValues['title']).toBe('Original') // Unchanged
    })

    it('should generate traces for each operation', () => {
      const slot1 = createTemplateSlotRef('title')
      const slot2 = createTemplateSlotRef('body')
      const ops = [
        createTemplateWritebackOperation(templateRef, 'fill', slot1, {
          update: createTemplateContentUpdate(slot1, 'Title'),
        }),
        createTemplateWritebackOperation(templateRef, 'fill', slot2, {
          update: createTemplateContentUpdate(slot2, 'Body'),
        }),
      ]
      const action = createTemplateWritebackAction('session-1', templateRef, ops)

      const { traces } = executeTemplateWriteback(action, contract, 'write', 'hr')

      expect(traces).toHaveLength(2)
      expect(traces[0].slotName).toBe('title')
      expect(traces[1].slotName).toBe('body')
    })
  })

  describe('Store Operations', () => {
    describe('Editor Store', () => {
      let store: EditorWritebackStore

      beforeEach(() => {
        store = createEditorWritebackStore()
      })

      it('should register and retrieve contract', () => {
        const contract = createEditorWritebackContract()
        registerEditorContract(store, contract)
        expect(getEditorContract(store, contract.contractId)).toBe(contract)
      })

      it('should add and retrieve editor state', () => {
        const state = createEditorState('Content')
        addEditorToStore(store, 'editor-1', state)
        expect(getEditorFromStore(store, 'editor-1')).toBe(state)
      })

      it('should add and retrieve action', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const action = createEditorWritebackAction('session-1', editorRef, [])
        addEditorAction(store, action)
        expect(getEditorAction(store, action.actionId)).toBe(action)
      })

      it('should get actions by session', () => {
        const editorRef = createEditorReference('editor-1', 'text')
        const action1 = createEditorWritebackAction('session-1', editorRef, [])
        const action2 = createEditorWritebackAction('session-2', editorRef, [])
        const action3 = createEditorWritebackAction('session-1', editorRef, [])

        addEditorAction(store, action1)
        addEditorAction(store, action2)
        addEditorAction(store, action3)

        const session1Actions = getEditorActionsBySession(store, 'session-1')
        expect(session1Actions).toHaveLength(2)
      })

      it('should add and retrieve outcome', () => {
        const outcome: EditorWritebackOutcome = {
          success: true,
          totalOperations: 1,
          successfulOperations: 1,
          failedOperations: 0,
          results: [],
        }
        addEditorOutcome(store, 'action-1', outcome)
        expect(getEditorOutcome(store, 'action-1')).toBe(outcome)
      })

      it('should add and retrieve traces', () => {
        const trace: EditorWritebackTrace = {
          traceId: 'trace-1',
          actionId: 'action-1',
          timestamp: new Date().toISOString(),
          operation: 'replace',
          editorId: 'editor-1',
          status: 'completed',
        }
        addEditorTraces(store, 'action-1', [trace])
        expect(getEditorTraces(store, 'action-1')).toEqual([trace])
      })

      it('should add audit entry', () => {
        const entry: WritebackAuditEntry = {
          entryId: 'audit-1',
          timestamp: new Date().toISOString(),
          sessionId: 'session-1',
          targetType: 'editor',
          targetId: 'editor-1',
          operation: 'replace',
          actor: 'user',
          success: true,
        }
        addEditorAuditEntry(store, entry)
        expect(store.auditEntries).toContain(entry)
      })
    })

    describe('Template Store', () => {
      let store: TemplateWritebackStore

      beforeEach(() => {
        store = createTemplateWritebackStore()
      })

      it('should register and retrieve contract', () => {
        const contract = createTemplateWritebackContract()
        registerTemplateContract(store, contract)
        expect(getTemplateContract(store, contract.contractId)).toBe(contract)
      })

      it('should add and retrieve template state', () => {
        const state = createTemplateState('template-1')
        addTemplateToStore(store, 'template-1', state)
        expect(getTemplateFromStore(store, 'template-1')).toBe(state)
      })

      it('should add and retrieve action', () => {
        const templateRef = createTemplateReference('template-1', 'document', 'Test')
        const action = createTemplateWritebackAction('session-1', templateRef, [])
        addTemplateAction(store, action)
        expect(getTemplateAction(store, action.actionId)).toBe(action)
      })

      it('should get actions by session', () => {
        const templateRef = createTemplateReference('template-1', 'document', 'Test')
        const action1 = createTemplateWritebackAction('session-1', templateRef, [])
        const action2 = createTemplateWritebackAction('session-2', templateRef, [])

        addTemplateAction(store, action1)
        addTemplateAction(store, action2)

        const session1Actions = getTemplateActionsBySession(store, 'session-1')
        expect(session1Actions).toHaveLength(1)
      })
    })
  })

  describe('Serialization', () => {
    describe('Editor Reference', () => {
      it('should serialize and deserialize', () => {
        const ref = createEditorReference('editor-1', 'code', {
          filePath: '/src/test.ts',
        })
        const json = serializeEditorRef(ref)
        const restored = deserializeEditorRef(json)
        expect(restored).toEqual(ref)
      })
    })

    describe('Template Reference', () => {
      it('should serialize and deserialize', () => {
        const ref = createTemplateReference('template-1', 'document', 'Test', {
          version: '1.0.0',
        })
        const json = serializeTemplateRef(ref)
        const restored = deserializeTemplateRef(json)
        expect(restored).toEqual(ref)
      })
    })

    describe('Editor State', () => {
      it('should serialize and deserialize', () => {
        const state = createEditorState('Content', {
          isDirty: true,
          version: 5,
          language: 'typescript',
        })
        const json = serializeEditorState(state)
        const restored = deserializeEditorState(json)
        expect(restored).toEqual(state)
      })
    })

    describe('Template State', () => {
      it('should serialize and deserialize with Set', () => {
        const state = createTemplateState('template-1', { title: 'Test' })
        state.dirtySlots.add('title')
        const json = serializeTemplateState(state)
        const restored = deserializeTemplateState(json)
        expect(restored.slotValues).toEqual(state.slotValues)
        expect(restored.dirtySlots).toBeInstanceOf(Set)
        expect(restored.dirtySlots.has('title')).toBe(true)
      })
    })

    describe('Editor Contract', () => {
      it('should serialize and deserialize', () => {
        const contract = createEditorWritebackContract({
          allowedEditorTypes: ['text', 'code'],
          maxContentSize: 10000,
        })
        const json = serializeEditorContract(contract)
        const restored = deserializeEditorContract(json)
        expect(restored).toEqual(contract)
      })
    })

    describe('Template Contract', () => {
      it('should serialize and deserialize', () => {
        const contract = createTemplateWritebackContract({
          allowedSlots: ['title', 'body'],
          slotPermissions: { title: 'admin' },
        })
        const json = serializeTemplateContract(contract)
        const restored = deserializeTemplateContract(json)
        expect(restored).toEqual(contract)
      })
    })

    describe('Editor Store', () => {
      it('should serialize and deserialize', () => {
        const store = createEditorWritebackStore()
        const contract = createEditorWritebackContract()
        const state = createEditorState('Content')

        registerEditorContract(store, contract)
        addEditorToStore(store, 'editor-1', state)

        const json = serializeEditorWritebackStore(store)
        const restored = deserializeEditorWritebackStore(json)

        expect(restored.contracts.size).toBe(1)
        expect(restored.editors.size).toBe(1)
      })
    })

    describe('Template Store', () => {
      it('should serialize and deserialize with Set', () => {
        const store = createTemplateWritebackStore()
        const state = createTemplateState('template-1', { title: 'Test' })
        state.dirtySlots.add('title')

        addTemplateToStore(store, 'template-1', state)

        const json = serializeTemplateWritebackStore(store)
        const restored = deserializeTemplateWritebackStore(json)

        expect(restored.templates.size).toBe(1)
        const restoredState = restored.templates.get('template-1')
        expect(restoredState?.dirtySlots).toBeInstanceOf(Set)
        expect(restoredState?.dirtySlots.has('title')).toBe(true)
      })
    })
  })

  describe('Debug Formatting', () => {
    describe('Editor Reference Formatting', () => {
      it('should format editor reference', () => {
        const ref = createEditorReference('editor-1', 'code', {
          filePath: '/test.ts',
        })
        const formatted = formatEditorRef(ref)
        expect(formatted).toContain('editor-1')
        expect(formatted).toContain('code')
        expect(formatted).toContain('file:/test.ts')
      })
    })

    describe('Template Reference Formatting', () => {
      it('should format template reference', () => {
        const ref = createTemplateReference('template-1', 'document', 'My Template', {
          version: '1.0',
        })
        const formatted = formatTemplateRef(ref)
        expect(formatted).toContain('template-1')
        expect(formatted).toContain('document')
        expect(formatted).toContain('My Template')
        expect(formatted).toContain('v1.0')
      })
    })

    describe('Content Range Formatting', () => {
      it('should format content range', () => {
        const range = createContentRange(1, 5, 10, 20)
        const formatted = formatContentRange(range)
        expect(formatted).toBe('L1:5-L10:20')
      })
    })

    describe('Editor State Formatting', () => {
      it('should format clean editor state', () => {
        const state = createEditorState('Line1\nLine2\nLine3', { version: 2 })
        const formatted = formatEditorState(state)
        expect(formatted).toContain('3 lines')
        expect(formatted).toContain('v2')
        expect(formatted).not.toContain('[dirty]')
      })

      it('should format dirty editor state', () => {
        const state = createEditorState('Content', { isDirty: true })
        const formatted = formatEditorState(state)
        expect(formatted).toContain('[dirty]')
      })
    })

    describe('Template State Formatting', () => {
      it('should format template state', () => {
        const state = createTemplateState('template-1', { title: 'Test', body: 'Content' })
        state.dirtySlots.add('title')
        const formatted = formatTemplateState(state)
        expect(formatted).toContain('2 slots')
        expect(formatted).toContain('1 dirty')
      })
    })

    describe('Result Formatting', () => {
      it('should format successful editor result', () => {
        const result: EditorWritebackResult = {
          operationId: 'op-1',
          editorId: 'editor-1',
          success: true,
          newVersion: 5,
          isDirty: true,
        }
        const formatted = formatEditorWritebackResult(result)
        expect(formatted).toContain('✓')
        expect(formatted).toContain('op-1')
        expect(formatted).toContain('v5')
        expect(formatted).toContain('[dirty]')
      })

      it('should format failed template result', () => {
        const result: TemplateWritebackResult = {
          operationId: 'op-1',
          templateId: 'template-1',
          slotName: 'title',
          success: false,
          error: 'Permission denied',
        }
        const formatted = formatTemplateWritebackResult(result)
        expect(formatted).toContain('✗')
        expect(formatted).toContain('error: Permission denied')
      })
    })

    describe('Outcome Formatting', () => {
      it('should format successful editor outcome', () => {
        const outcome: EditorWritebackOutcome = {
          success: true,
          totalOperations: 3,
          successfulOperations: 3,
          failedOperations: 0,
          results: [],
        }
        const formatted = formatEditorWritebackOutcome(outcome)
        expect(formatted).toContain('✓')
        expect(formatted).toContain('3/3')
      })

      it('should format partial template outcome', () => {
        const outcome: TemplateWritebackOutcome = {
          success: false,
          totalOperations: 3,
          successfulOperations: 2,
          failedOperations: 1,
          results: [],
        }
        const formatted = formatTemplateWritebackOutcome(outcome)
        expect(formatted).toContain('✗')
        expect(formatted).toContain('2/3')
      })
    })

    describe('Trace Formatting', () => {
      it('should format editor trace', () => {
        const trace: EditorWritebackTrace = {
          traceId: 'trace-1',
          actionId: 'action-1',
          timestamp: '2026-03-23T10:00:00Z',
          operation: 'replace',
          editorId: 'editor-1',
          status: 'completed',
          durationMs: 42,
        }
        const formatted = formatEditorTrace(trace)
        expect(formatted).toContain('replace')
        expect(formatted).toContain('editor-1')
        expect(formatted).toContain('completed')
        expect(formatted).toContain('42ms')
      })

      it('should format template trace', () => {
        const trace: TemplateWritebackTrace = {
          traceId: 'trace-1',
          actionId: 'action-1',
          timestamp: '2026-03-23T10:00:00Z',
          operation: 'fill',
          templateId: 'template-1',
          slotName: 'title',
          status: 'completed',
        }
        const formatted = formatTemplateTrace(trace)
        expect(formatted).toContain('fill')
        expect(formatted).toContain('template-1.title')
        expect(formatted).toContain('completed')
      })
    })
  })
})
