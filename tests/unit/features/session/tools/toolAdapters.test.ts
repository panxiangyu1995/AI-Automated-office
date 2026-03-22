/**
 * Tests for Tool Adapters
 * Task 70: Story 45.3 - Unified Core Plugin and MCP Tool Adapters
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CoreToolAdapter,
  PluginToolAdapter,
  MCPToolAdapter,
  UnifiedToolManager,
  createUnifiedToolManager,
  getToolSource,
  parsePluginToolId,
  parseMCPToolId,
  createPluginToolId,
  createMCPToolId,
  type MCPToolExecutor,
} from '@/features/session/tools/toolAdapters'
import { ToolRegistry } from '@/features/session/tools/toolRegistry'
import { stringParam, numberParam } from '@/features/session/tools'
import type { ToolRuntimeContext } from '@/features/session/tools/toolExecutor'

describe('CoreToolAdapter', () => {
  let adapter: CoreToolAdapter
  let registry: ToolRegistry

  beforeEach(() => {
    adapter = new CoreToolAdapter()
    registry = new ToolRegistry()
  })

  describe('Tool Registration', () => {
    it('adds a core tool', () => {
      adapter.addTool({
        id: 'core_tool_1',
        name: 'Core Tool 1',
        description: 'A core tool',
        execute: vi.fn(),
      })

      const descriptor = adapter.getToolDescriptor('core_tool_1')
      expect(descriptor).toBeDefined()
      expect(descriptor?.name).toBe('Core Tool 1')
    })

    it('adds multiple core tools', () => {
      adapter.addTools([
        { id: 'tool1', name: 'Tool 1', description: 'Tool 1', execute: vi.fn() },
        { id: 'tool2', name: 'Tool 2', description: 'Tool 2', execute: vi.fn() },
      ])

      expect(adapter.getToolDescriptor('tool1')).toBeDefined()
      expect(adapter.getToolDescriptor('tool2')).toBeDefined()
    })

    it('registers tools into the registry', () => {
      adapter.addTool({
        id: 'core_tool_1',
        name: 'Core Tool 1',
        description: 'A core tool',
        execute: vi.fn(),
      })

      adapter.registerTools(registry)

      expect(registry.has('core_tool_1')).toBe(true)
    })
  })

  describe('Tool Descriptor', () => {
    it('creates descriptor with parameters', () => {
      adapter.addTool({
        id: 'tool_with_params',
        name: 'Tool with Params',
        description: 'A tool with parameters',
        parameters: [
          stringParam('name', 'The name', true),
          numberParam('count', 'The count', false),
        ],
        execute: vi.fn(),
      })

      const descriptor = adapter.getToolDescriptor('tool_with_params')
      expect(descriptor?.parameters).toHaveLength(2)
      expect(descriptor?.parameters[0].name).toBe('name')
    })

    it('sets category to core', () => {
      adapter.addTool({
        id: 'core_tool',
        name: 'Core Tool',
        description: 'A core tool',
        execute: vi.fn(),
      })

      const descriptor = adapter.getToolDescriptor('core_tool')
      expect(descriptor?.category).toBe('core')
    })
  })

  describe('Executor', () => {
    it('returns executor function', async () => {
      const executor = vi.fn().mockResolvedValue({ result: 'ok' })
      adapter.addTool({
        id: 'test_tool',
        name: 'Test Tool',
        description: 'Test',
        execute: executor,
      })

      const fn = adapter.getExecutor('test_tool')
      expect(fn).toBeDefined()

      const context = { sessionId: 's1', userId: 'u1', tenantId: 't1', permissions: [], metadata: {}, timestamp: 0 }
      await fn?.({ param: 'value' }, context)

      expect(executor).toHaveBeenCalledWith({ param: 'value' }, context)
    })
  })
})

describe('PluginToolAdapter', () => {
  let adapter: PluginToolAdapter
  let registry: ToolRegistry

  beforeEach(() => {
    adapter = new PluginToolAdapter()
    registry = new ToolRegistry()
  })

  describe('Tool Registration', () => {
    it('adds a plugin tool with prefixed ID', () => {
      adapter.addTool({
        pluginId: 'hr',
        toolId: 'create_employee',
        name: 'Create Employee',
        description: 'Create a new employee',
        execute: vi.fn(),
      })

      const descriptor = adapter.getToolDescriptor('plugin_hr_create_employee')
      expect(descriptor).toBeDefined()
      expect(descriptor?.name).toBe('Create Employee')
    })

    it('registers tools into the registry', () => {
      adapter.addTool({
        pluginId: 'hr',
        toolId: 'create_employee',
        name: 'Create Employee',
        description: 'Create a new employee',
        execute: vi.fn(),
      })

      adapter.registerTools(registry)

      expect(registry.has('plugin_hr_create_employee')).toBe(true)
    })
  })

  describe('Permissions', () => {
    it('adds permissions to the descriptor', () => {
      adapter.addTool({
        pluginId: 'hr',
        toolId: 'delete_employee',
        name: 'Delete Employee',
        description: 'Delete an employee',
        permissions: ['admin', 'hr_manager'],
        execute: vi.fn(),
      })

      const descriptor = adapter.getToolDescriptor('plugin_hr_delete_employee')
      expect(descriptor?.permissions).toHaveLength(2)
    })
  })

  describe('Metadata', () => {
    it('includes plugin ID in tags', () => {
      adapter.addTool({
        pluginId: 'finance',
        toolId: 'create_invoice',
        name: 'Create Invoice',
        description: 'Create an invoice',
        execute: vi.fn(),
      })

      const descriptor = adapter.getToolDescriptor('plugin_finance_create_invoice')
      expect(descriptor?.metadata.tags).toContain('plugin')
      expect(descriptor?.metadata.tags).toContain('finance')
    })
  })
})

describe('MCPToolAdapter', () => {
  let adapter: MCPToolAdapter
  let registry: ToolRegistry

  beforeEach(() => {
    adapter = new MCPToolAdapter()
    registry = new ToolRegistry()
  })

  describe('Tool Registration', () => {
    it('adds an MCP tool with prefixed ID', () => {
      adapter.addTool({
        serverId: 'filesystem',
        toolName: 'read_file',
        description: 'Read a file from the filesystem',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
          },
          required: ['path'],
        },
      })

      const descriptor = adapter.getToolDescriptor('mcp_filesystem_read_file')
      expect(descriptor).toBeDefined()
      expect(descriptor?.name).toBe('read_file')
    })

    it('converts MCP schema to tool parameters', () => {
      adapter.addTool({
        serverId: 'db',
        toolName: 'query',
        description: 'Execute a database query',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SQL query' },
            limit: { type: 'number', description: 'Result limit' },
          },
          required: ['sql'],
        },
      })

      const descriptor = adapter.getToolDescriptor('mcp_db_query')
      expect(descriptor?.parameters).toHaveLength(2)
      
      const sqlParam = descriptor?.parameters.find(p => p.name === 'sql')
      expect(sqlParam?.required).toBe(true)
      
      const limitParam = descriptor?.parameters.find(p => p.name === 'limit')
      expect(limitParam?.required).toBe(false)
    })

    it('sets execution mode to async', () => {
      adapter.addTool({
        serverId: 'api',
        toolName: 'fetch',
        description: 'Fetch from API',
        inputSchema: { type: 'object', properties: {} },
      })

      const descriptor = adapter.getToolDescriptor('mcp_api_fetch')
      expect(descriptor?.executionMode).toBe('async')
    })
  })

  describe('Executor', () => {
    it('returns undefined when no executor set', () => {
      adapter.addTool({
        serverId: 'test',
        toolName: 'tool',
        description: 'Test tool',
        inputSchema: { type: 'object', properties: {} },
      })

      expect(adapter.getMCPExecutor()).toBeUndefined()
    })

    it('returns executor when set', () => {
      const executor: MCPToolExecutor = {
        execute: vi.fn(),
      }

      adapter.setExecutor(executor)
      expect(adapter.getMCPExecutor()).toBe(executor)
    })
  })
})

describe('UnifiedToolManager', () => {
  let manager: UnifiedToolManager
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
    manager = createUnifiedToolManager(registry)
  })

  describe('Adapters', () => {
    it('provides access to core adapter', () => {
      expect(manager.getCoreAdapter()).toBeInstanceOf(CoreToolAdapter)
    })

    it('provides access to plugin adapter', () => {
      expect(manager.getPluginAdapter()).toBeInstanceOf(PluginToolAdapter)
    })

    it('provides access to MCP adapter', () => {
      expect(manager.getMCPAdapter()).toBeInstanceOf(MCPToolAdapter)
    })
  })

  describe('Tool Registration', () => {
    it('registers all tools from all adapters', () => {
      // Add core tool
      manager.getCoreAdapter().addTool({
        id: 'core_tool',
        name: 'Core Tool',
        description: 'Core',
        execute: vi.fn(),
      })

      // Add plugin tool
      manager.getPluginAdapter().addTool({
        pluginId: 'hr',
        toolId: 'create',
        name: 'HR Create',
        description: 'HR',
        execute: vi.fn(),
      })

      // Add MCP tool
      manager.getMCPAdapter().addTool({
        serverId: 'fs',
        toolName: 'read',
        description: 'Read file',
        inputSchema: { type: 'object', properties: {} },
      })

      manager.registerAllTools()

      expect(registry.has('core_tool')).toBe(true)
      expect(registry.has('plugin_hr_create')).toBe(true)
      expect(registry.has('mcp_fs_read')).toBe(true)
    })
  })

  describe('Executor Resolution', () => {
    it('returns executor for core tools', async () => {
      const executor = vi.fn().mockResolvedValue('result')
      manager.getCoreAdapter().addTool({
        id: 'core_tool',
        name: 'Core Tool',
        description: 'Core',
        execute: executor,
      })

      const fn = manager.getExecutor('core_tool')
      expect(fn).toBeDefined()

      const context = { sessionId: 's1', userId: 'u1', tenantId: 't1', permissions: [], metadata: {}, timestamp: 0 }
      await fn?.({}, context)

      expect(executor).toHaveBeenCalled()
    })

    it('returns executor for plugin tools', async () => {
      const executor = vi.fn().mockResolvedValue('result')
      manager.getPluginAdapter().addTool({
        pluginId: 'hr',
        toolId: 'create',
        name: 'HR Create',
        description: 'HR',
        execute: executor,
      })

      const fn = manager.getExecutor('plugin_hr_create')
      expect(fn).toBeDefined()
    })

    it('returns executor for MCP tools', async () => {
      const mcpExecutor: MCPToolExecutor = {
        execute: vi.fn().mockResolvedValue('result'),
      }
      manager.getMCPAdapter().setExecutor(mcpExecutor)
      manager.getMCPAdapter().addTool({
        serverId: 'fs',
        toolName: 'read',
        description: 'Read',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
      })

      const fn = manager.getExecutor('mcp_fs_read')
      expect(fn).toBeDefined()
    })

    it('returns undefined for unknown tools', () => {
      expect(manager.getExecutor('unknown_tool')).toBeUndefined()
    })
  })

  describe('Result Normalization', () => {
    it('normalizes successful result', () => {
      const result = manager.normalizeResult(
        { data: 'test' },
        'core',
        'core_tool',
        100
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ data: 'test' })
      expect(result.metadata.source).toBe('core')
      expect(result.metadata.duration).toBe(100)
    })

    it('normalizes error result', () => {
      const result = manager.normalizeResult(
        undefined,
        'plugin',
        'plugin_hr_create',
        50,
        { code: 'ERROR', message: 'Something went wrong' }
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ERROR')
      expect(result.error?.message).toBe('Something went wrong')
      expect(result.metadata.source).toBe('plugin')
    })
  })
})

describe('Helper Functions', () => {
  describe('getToolSource', () => {
    it('returns core for non-prefixed IDs', () => {
      expect(getToolSource('core_tool')).toBe('core')
    })

    it('returns plugin for plugin_ prefixed IDs', () => {
      expect(getToolSource('plugin_hr_create')).toBe('plugin')
    })

    it('returns mcp for mcp_ prefixed IDs', () => {
      expect(getToolSource('mcp_fs_read')).toBe('mcp')
    })
  })

  describe('parsePluginToolId', () => {
    it('parses valid plugin tool ID', () => {
      const result = parsePluginToolId('plugin_hr_create_employee')
      expect(result).toEqual({
        pluginId: 'hr',
        toolId: 'create_employee',
      })
    })

    it('returns undefined for non-plugin IDs', () => {
      expect(parsePluginToolId('core_tool')).toBeUndefined()
      expect(parsePluginToolId('mcp_fs_read')).toBeUndefined()
    })

    it('handles tool IDs with underscores', () => {
      const result = parsePluginToolId('plugin_hr_create_new_employee')
      expect(result).toEqual({
        pluginId: 'hr',
        toolId: 'create_new_employee',
      })
    })
  })

  describe('parseMCPToolId', () => {
    it('parses valid MCP tool ID', () => {
      const result = parseMCPToolId('mcp_filesystem_read_file')
      expect(result).toEqual({
        serverId: 'filesystem',
        toolName: 'read_file',
      })
    })

    it('returns undefined for non-MCP IDs', () => {
      expect(parseMCPToolId('core_tool')).toBeUndefined()
      expect(parseMCPToolId('plugin_hr_create')).toBeUndefined()
    })
  })

  describe('createPluginToolId', () => {
    it('creates a plugin tool ID', () => {
      expect(createPluginToolId('hr', 'create_employee')).toBe('plugin_hr_create_employee')
    })
  })

  describe('createMCPToolId', () => {
    it('creates an MCP tool ID', () => {
      expect(createMCPToolId('filesystem', 'read_file')).toBe('mcp_filesystem_read_file')
    })
  })
})
