/**
 * Tool Descriptor Tests
 * Task 68: Story 45.1 - Tool Descriptor and Registry
 */

import { describe, it, expect } from 'vitest'
import {
  ToolDescriptorBuilder,
  defineTool,
  stringParam,
  numberParam,
  booleanParam,
  objectParam,
  arrayParam,
  validateToolDescriptor,
  validateParameters,
  isToolAvailable,
  requiresConfirmation,
  hasSideEffects,
  getToolsByCapability,
  getToolsByCategory,
  descriptorToJsonSchema,
  type ToolDescriptor,
} from '@/features/session/tools'

describe('Tool Descriptor', () => {
  describe('ToolDescriptorBuilder', () => {
    it('creates a basic tool descriptor', () => {
      const descriptor = defineTool('test_tool', 'Test Tool')
        .withDescription('A test tool')
        .build()

      expect(descriptor.id).toBe('test_tool')
      expect(descriptor.name).toBe('Test Tool')
      expect(descriptor.description).toBe('A test tool')
      expect(descriptor.category).toBe('core')
      expect(descriptor.enabled).toBe(true)
    })

    it('requires description', () => {
      expect(() => defineTool('test', 'Test').build()).toThrow('description is required')
    })

    it('sets category', () => {
      const descriptor = defineTool('mcp_tool', 'MCP Tool')
        .withDescription('An MCP tool')
        .withCategory('mcp')
        .build()

      expect(descriptor.category).toBe('mcp')
    })

    it('adds parameters', () => {
      const descriptor = defineTool('param_tool', 'Param Tool')
        .withDescription('Tool with parameters')
        .withParameter(stringParam('name', 'The name', true))
        .withParameter(numberParam('count', 'The count', false, { default: 0 }))
        .build()

      expect(descriptor.parameters).toHaveLength(2)
      expect(descriptor.parameters[0].name).toBe('name')
      expect(descriptor.parameters[0].required).toBe(true)
      expect(descriptor.parameters[1].default).toBe(0)
    })

    it('sets execution mode', () => {
      const descriptor = defineTool('async_tool', 'Async Tool')
        .withDescription('Async tool')
        .withExecutionMode('async')
        .build()

      expect(descriptor.executionMode).toBe('async')
    })

    it('sets capabilities', () => {
      const descriptor = defineTool('streaming_tool', 'Streaming Tool')
        .withDescription('Streaming tool')
        .withCapabilities({ supportsStreaming: true })
        .build()

      expect(descriptor.capabilities.supportsStreaming).toBe(true)
    })

    it('adds permissions', () => {
      const descriptor = defineTool('secure_tool', 'Secure Tool')
        .withDescription('Secure tool')
        .withPermission({
          type: 'read',
          resource: 'user_data',
          description: 'Read user data',
        })
        .build()

      expect(descriptor.permissions).toHaveLength(1)
      expect(descriptor.permissions![0].resource).toBe('user_data')
    })

    it('adds dependencies', () => {
      const descriptor = defineTool('dependent_tool', 'Dependent Tool')
        .withDescription('Tool with dependencies')
        .withDependency({
          toolId: 'base_tool',
          type: 'required',
        })
        .build()

      expect(descriptor.dependencies).toHaveLength(1)
      expect(descriptor.dependencies![0].toolId).toBe('base_tool')
    })

    it('sets context requirements', () => {
      const descriptor = defineTool('session_tool', 'Session Tool')
        .withDescription('Tool requiring session')
        .withContextRequirements({
          requiresSession: true,
          requiresUserContext: true,
        })
        .build()

      expect(descriptor.contextRequirements?.requiresSession).toBe(true)
      expect(descriptor.contextRequirements?.requiresUserContext).toBe(true)
    })

    it('sets metadata', () => {
      const descriptor = defineTool('meta_tool', 'Meta Tool')
        .withDescription('Tool with metadata')
        .withMetadata({
          author: 'Test Author',
          version: '2.0.0',
          tags: ['test', 'demo'],
        })
        .build()

      expect(descriptor.metadata.author).toBe('Test Author')
      expect(descriptor.metadata.version).toBe('2.0.0')
      expect(descriptor.metadata.tags).toContain('test')
    })

    it('sets handler reference', () => {
      const descriptor = defineTool('handler_tool', 'Handler Tool')
        .withDescription('Tool with handler')
        .withHandler('./handlers', 'handleTool')
        .build()

      expect(descriptor.handlerModule).toBe('./handlers')
      expect(descriptor.handlerFunction).toBe('handleTool')
    })

    it('marks as deprecated', () => {
      const descriptor = defineTool('old_tool', 'Old Tool')
        .withDescription('Deprecated tool')
        .deprecated('Use new_tool instead')
        .build()

      expect(descriptor.deprecated).toBe(true)
      expect(descriptor.deprecationMessage).toBe('Use new_tool instead')
    })

    it('sets enabled status', () => {
      const descriptor = defineTool('disabled_tool', 'Disabled Tool')
        .withDescription('Disabled tool')
        .setEnabled(false)
        .build()

      expect(descriptor.enabled).toBe(false)
    })
  })

  describe('Parameter Factories', () => {
    it('creates string parameter', () => {
      const param = stringParam('name', 'The name', true, { pattern: '^[a-z]+$' })

      expect(param.name).toBe('name')
      expect(param.type).toBe('string')
      expect(param.required).toBe(true)
      expect(param.pattern).toBe('^[a-z]+$')
    })

    it('creates number parameter', () => {
      const param = numberParam('age', 'The age', true, { minimum: 0, maximum: 150 })

      expect(param.type).toBe('number')
      expect(param.minimum).toBe(0)
      expect(param.maximum).toBe(150)
    })

    it('creates boolean parameter', () => {
      const param = booleanParam('active', 'Is active', false, { default: true })

      expect(param.type).toBe('boolean')
      expect(param.required).toBe(false)
      expect(param.default).toBe(true)
    })

    it('creates object parameter', () => {
      const param = objectParam('config', 'Configuration', {
        host: stringParam('host', 'Host name'),
        port: numberParam('port', 'Port number'),
      })

      expect(param.type).toBe('object')
      expect(param.properties?.host).toBeDefined()
      expect(param.properties?.port).toBeDefined()
    })

    it('creates array parameter', () => {
      const param = arrayParam('items', 'Items', stringParam('item', 'Item name'))

      expect(param.type).toBe('array')
      expect(param.items?.type).toBe('string')
    })
  })

  describe('Validation', () => {
    it('validates valid descriptor', () => {
      const descriptor = defineTool('valid', 'Valid')
        .withDescription('Valid tool')
        .build()

      expect(validateToolDescriptor(descriptor)).toBe(true)
    })

    it('rejects invalid descriptor', () => {
      expect(validateToolDescriptor(null)).toBe(false)
      expect(validateToolDescriptor({})).toBe(false)
      expect(validateToolDescriptor({ id: 123 })).toBe(false)
    })

    it('validates parameters', () => {
      const descriptor = defineTool('param_check', 'Param Check')
        .withDescription('Tool')
        .withParameter(stringParam('name', 'Name', true))
        .withParameter(numberParam('count', 'Count', true, { minimum: 1, maximum: 10 }))
        .withParameter(stringParam('status', 'Status', true, { enum: ['active', 'inactive'] }))
        .build()

      // Valid parameters
      const valid = validateParameters(descriptor, {
        name: 'test',
        count: 5,
        status: 'active',
      })
      expect(valid.valid).toBe(true)
      expect(valid.errors).toHaveLength(0)

      // Missing required
      const missing = validateParameters(descriptor, { count: 5 })
      expect(missing.valid).toBe(false)
      expect(missing.errors).toContain('Missing required parameter: name')

      // Invalid enum
      const invalidEnum = validateParameters(descriptor, {
        name: 'test',
        count: 5,
        status: 'unknown',
      })
      expect(invalidEnum.valid).toBe(false)

      // Out of range
      const outOfRange = validateParameters(descriptor, {
        name: 'test',
        count: 20,
        status: 'active',
      })
      expect(outOfRange.valid).toBe(false)
    })
  })

  describe('Utility Functions', () => {
    const createTestDescriptor = (overrides: Partial<ToolDescriptor> = {}): ToolDescriptor => ({
      id: 'test',
      name: 'Test',
      description: 'Test tool',
      category: 'core',
      parameters: [],
      executionMode: 'sync',
      capabilities: {
        supportsStreaming: false,
        supportsCancellation: true,
        requiresPermission: false,
        requiresConfirmation: false,
        isReadOnly: true,
        hasSideEffects: false,
        supportsRetry: true,
      },
      metadata: {
        version: '1.0.0',
        tags: ['test'],
        category: 'general',
      },
      enabled: true,
      ...overrides,
    })

    it('checks if tool is available', () => {
      const enabled = createTestDescriptor({ enabled: true })
      const disabled = createTestDescriptor({ enabled: false })
      const deprecated = createTestDescriptor({ deprecated: true })

      expect(isToolAvailable(enabled)).toBe(true)
      expect(isToolAvailable(disabled)).toBe(false)
      expect(isToolAvailable(deprecated)).toBe(false)
    })

    it('checks if tool requires confirmation', () => {
      const needsConfirm = createTestDescriptor({
        capabilities: { ...createTestDescriptor().capabilities, requiresConfirmation: true },
      })
      const noConfirm = createTestDescriptor()

      expect(requiresConfirmation(needsConfirm)).toBe(true)
      expect(requiresConfirmation(noConfirm)).toBe(false)
    })

    it('checks if tool has side effects', () => {
      const withEffects = createTestDescriptor({
        capabilities: { ...createTestDescriptor().capabilities, hasSideEffects: true },
      })
      const withoutEffects = createTestDescriptor()

      expect(hasSideEffects(withEffects)).toBe(true)
      expect(hasSideEffects(withoutEffects)).toBe(false)
    })

    it('gets tools by capability', () => {
      const tools = [
        createTestDescriptor({ id: '1', capabilities: { ...createTestDescriptor().capabilities, supportsStreaming: true } }),
        createTestDescriptor({ id: '2', capabilities: { ...createTestDescriptor().capabilities, supportsStreaming: false } }),
        createTestDescriptor({ id: '3', capabilities: { ...createTestDescriptor().capabilities, supportsStreaming: true } }),
      ]

      const streaming = getToolsByCapability(tools, 'supportsStreaming')
      expect(streaming).toHaveLength(2)
      expect(streaming.map(t => t.id)).toContain('1')
      expect(streaming.map(t => t.id)).toContain('3')
    })

    it('gets tools by category', () => {
      const tools = [
        createTestDescriptor({ id: '1', category: 'core' }),
        createTestDescriptor({ id: '2', category: 'mcp' }),
        createTestDescriptor({ id: '3', category: 'core' }),
      ]

      const core = getToolsByCategory(tools, 'core')
      expect(core).toHaveLength(2)
    })

    it('converts to JSON schema', () => {
      const descriptor = defineTool('json_tool', 'JSON Tool')
        .withDescription('Tool for JSON schema')
        .withParameter(stringParam('name', 'Name', true))
        .withParameter(numberParam('count', 'Count', false, { default: 0 }))
        .build()

      const schema = descriptorToJsonSchema(descriptor)

      expect(schema.type).toBe('object')
      expect(schema.properties).toHaveProperty('name')
      expect(schema.properties).toHaveProperty('count')
      expect(schema.required).toContain('name')
      expect(schema.required).not.toContain('count')
    })
  })
})
