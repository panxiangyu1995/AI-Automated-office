/**
 * Tool Adapters - Unified Core Plugin and MCP Tool Adapters
 * Task 70: Story 45.3 - Unified Core Plugin and MCP Tool Adapters
 * 
 * This module provides adapters that bridge different tool sources
 * (core tools, plugin tools, MCP tools) into the unified registry
 * with consistent output formats.
 */

import type { ToolDescriptor, ToolParameter } from './toolDescriptor'
import { defineTool } from './toolDescriptor'
import type { ToolRegistry } from './toolRegistry'
import type { ToolRuntimeContext } from './toolExecutor'

// ==================== Types ====================

/**
 * Tool source type
 */
export type ToolSource = 'core' | 'plugin' | 'mcp' | 'builtin'

/**
 * Core tool definition (simplified)
 */
export interface CoreToolDefinition {
  id: string
  name: string
  description: string
  category?: string
  parameters?: ToolParameter[]
  execute: (params: Record<string, unknown>, context: ToolRuntimeContext) => Promise<unknown>
}

/**
 * Plugin tool definition
 */
export interface PluginToolDefinition {
  pluginId: string
  toolId: string
  name: string
  description: string
  parameters?: ToolParameter[]
  permissions?: string[]
  execute: (params: Record<string, unknown>, context: ToolRuntimeContext) => Promise<unknown>
}

/**
 * MCP tool definition (Model Context Protocol)
 */
export interface MCPToolDefinition {
  serverId: string
  toolName: string
  description: string
  inputSchema: MCPInputSchema
}

/**
 * MCP input schema (JSON Schema format)
 */
export interface MCPInputSchema {
  type: 'object'
  properties: Record<string, MCPPropertySchema>
  required?: string[]
}

/**
 * MCP property schema
 */
export interface MCPPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  enum?: string[]
  default?: unknown
  items?: MCPPropertySchema
  properties?: Record<string, MCPPropertySchema>
}

/**
 * Normalized tool result
 */
export interface NormalizedToolResult {
  success: boolean
  data?: unknown
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  metadata: {
    source: ToolSource
    sourceId: string
    duration: number
    timestamp: number
  }
}

/**
 * Tool adapter interface
 */
export interface ToolAdapter {
  source: ToolSource
  registerTools(registry: ToolRegistry): void
  getToolDescriptor(toolId: string): ToolDescriptor | undefined
}

// ==================== Core Tool Adapter ====================

/**
 * Adapter for core tools
 */
export class CoreToolAdapter implements ToolAdapter {
  readonly source: ToolSource = 'core'
  private tools: Map<string, CoreToolDefinition> = new Map()
  private descriptors: Map<string, ToolDescriptor> = new Map()

  /**
   * Add a core tool definition
   */
  addTool(definition: CoreToolDefinition): void {
    this.tools.set(definition.id, definition)
    this.createDescriptor(definition)
  }

  /**
   * Add multiple core tools
   */
  addTools(definitions: CoreToolDefinition[]): void {
    for (const def of definitions) {
      this.addTool(def)
    }
  }

  /**
   * Register all core tools into the registry
   */
  registerTools(registry: ToolRegistry): void {
    for (const [, descriptor] of this.descriptors) {
      registry.register(descriptor)
    }
  }

  /**
   * Get tool descriptor
   */
  getToolDescriptor(toolId: string): ToolDescriptor | undefined {
    return this.descriptors.get(toolId)
  }

  /**
   * Get tool executor function
   */
  getExecutor(toolId: string): CoreToolDefinition['execute'] | undefined {
    return this.tools.get(toolId)?.execute
  }

  /**
   * Create a descriptor from a core tool definition
   */
  private createDescriptor(def: CoreToolDefinition): void {
    const builder = defineTool(def.id, def.name)
      .withDescription(def.description)
      .withCategory('core')
      .withExecutionMode('sync')

    // Add parameters
    if (def.parameters) {
      for (const param of def.parameters) {
        builder.withParameter(param)
      }
    }

    this.descriptors.set(def.id, builder.build())
  }
}

// ==================== Plugin Tool Adapter ====================

/**
 * Adapter for plugin tools
 */
export class PluginToolAdapter implements ToolAdapter {
  readonly source: ToolSource = 'plugin'
  private tools: Map<string, PluginToolDefinition> = new Map()
  private descriptors: Map<string, ToolDescriptor> = new Map()

  /**
   * Add a plugin tool definition
   */
  addTool(definition: PluginToolDefinition): void {
    const fullId = `plugin_${definition.pluginId}_${definition.toolId}`
    this.tools.set(fullId, definition)
    this.createDescriptor(fullId, definition)
  }

  /**
   * Add multiple plugin tools
   */
  addTools(definitions: PluginToolDefinition[]): void {
    for (const def of definitions) {
      this.addTool(def)
    }
  }

  /**
   * Register all plugin tools into the registry
   */
  registerTools(registry: ToolRegistry): void {
    for (const [, descriptor] of this.descriptors) {
      registry.register(descriptor)
    }
  }

  /**
   * Get tool descriptor
   */
  getToolDescriptor(toolId: string): ToolDescriptor | undefined {
    return this.descriptors.get(toolId)
  }

  /**
   * Get tool executor function
   */
  getExecutor(toolId: string): PluginToolDefinition['execute'] | undefined {
    return this.tools.get(toolId)?.execute
  }

  /**
   * Create a descriptor from a plugin tool definition
   */
  private createDescriptor(id: string, def: PluginToolDefinition): void {
    const builder = defineTool(id, def.name)
      .withDescription(def.description)
      .withCategory('plugin')
      .withExecutionMode('sync')

    // Add parameters
    if (def.parameters) {
      for (const param of def.parameters) {
        builder.withParameter(param)
      }
    }

    // Add permissions
    if (def.permissions && def.permissions.length > 0) {
      for (const perm of def.permissions) {
        builder.withPermission({
          type: 'execute',
          resource: perm,
          description: `Requires ${perm} permission`,
        })
      }
    }

    // Add metadata
    builder.withMetadata({
      version: '1.0.0',
      tags: ['plugin', def.pluginId],
      category: def.pluginId,
      author: 'plugin',
    })

    this.descriptors.set(id, builder.build())
  }
}

// ==================== MCP Tool Adapter ====================

/**
 * Adapter for MCP (Model Context Protocol) tools
 */
export class MCPToolAdapter implements ToolAdapter {
  readonly source: ToolSource = 'mcp'
  private tools: Map<string, MCPToolDefinition> = new Map()
  private descriptors: Map<string, ToolDescriptor> = new Map()
  private executor: MCPToolExecutor | undefined

  /**
   * Set the MCP executor
   */
  setExecutor(executor: MCPToolExecutor): void {
    this.executor = executor
  }

  /**
   * Add an MCP tool definition
   */
  addTool(definition: MCPToolDefinition): void {
    const fullId = `mcp_${definition.serverId}_${definition.toolName}`
    this.tools.set(fullId, definition)
    this.createDescriptor(fullId, definition)
  }

  /**
   * Add multiple MCP tools
   */
  addTools(definitions: MCPToolDefinition[]): void {
    for (const def of definitions) {
      this.addTool(def)
    }
  }

  /**
   * Register all MCP tools into the registry
   */
  registerTools(registry: ToolRegistry): void {
    for (const [, descriptor] of this.descriptors) {
      registry.register(descriptor)
    }
  }

  /**
   * Get tool descriptor
   */
  getToolDescriptor(toolId: string): ToolDescriptor | undefined {
    return this.descriptors.get(toolId)
  }

  /**
   * Get the executor for MCP tools
   */
  getMCPExecutor(): MCPToolExecutor | undefined {
    return this.executor
  }

  /**
   * Create a descriptor from an MCP tool definition
   */
  private createDescriptor(id: string, def: MCPToolDefinition): void {
    const builder = defineTool(id, def.toolName)
      .withDescription(def.description)
      .withCategory('mcp')
      .withExecutionMode('async') // MCP tools are typically async

    // Convert MCP input schema to tool parameters
    const params = this.convertMCPSchemaToParameters(def.inputSchema)
    for (const param of params) {
      builder.withParameter(param)
    }

    // Add metadata
    builder.withMetadata({
      version: '1.0.0',
      tags: ['mcp', def.serverId],
      category: def.serverId,
      author: 'mcp',
    })

    this.descriptors.set(id, builder.build())
  }

  /**
   * Convert MCP input schema to tool parameters
   */
  private convertMCPSchemaToParameters(schema: MCPInputSchema): ToolParameter[] {
    const params: ToolParameter[] = []
    const required = schema.required || []

    for (const [name, prop] of Object.entries(schema.properties)) {
      params.push(this.convertMCPPropertyToParameter(name, prop, required.includes(name)))
    }

    return params
  }

  /**
   * Convert an MCP property schema to a tool parameter
   */
  private convertMCPPropertyToParameter(
    name: string,
    prop: MCPPropertySchema,
    required: boolean
  ): ToolParameter {
    const type = this.convertMCPType(prop.type)

    return {
      name,
      type,
      description: prop.description || `${name} parameter`,
      required,
      enum: prop.enum,
      default: prop.default,
    }
  }

  /**
   * Convert MCP type to tool parameter type
   */
  private convertMCPType(mcpType: MCPPropertySchema['type']): ToolParameter['type'] {
    switch (mcpType) {
      case 'string':
        return 'string'
      case 'number':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'object':
        return 'object'
      case 'array':
        return 'array'
      default:
        return 'string'
    }
  }
}

/**
 * MCP tool executor interface
 */
export interface MCPToolExecutor {
  execute(
    serverId: string,
    toolName: string,
    params: Record<string, unknown>,
    context: ToolRuntimeContext
  ): Promise<unknown>
}

// ==================== Unified Tool Manager ====================

/**
 * Unified tool manager that coordinates all adapters
 */
export class UnifiedToolManager {
  private coreAdapter: CoreToolAdapter
  private pluginAdapter: PluginToolAdapter
  private mcpAdapter: MCPToolAdapter
  private registry: ToolRegistry

  constructor(registry: ToolRegistry) {
    this.registry = registry
    this.coreAdapter = new CoreToolAdapter()
    this.pluginAdapter = new PluginToolAdapter()
    this.mcpAdapter = new MCPToolAdapter()
  }

  /**
   * Register all tools from all adapters
   */
  registerAllTools(): void {
    this.coreAdapter.registerTools(this.registry)
    this.pluginAdapter.registerTools(this.registry)
    this.mcpAdapter.registerTools(this.registry)
  }

  /**
   * Get the core tool adapter
   */
  getCoreAdapter(): CoreToolAdapter {
    return this.coreAdapter
  }

  /**
   * Get the plugin tool adapter
   */
  getPluginAdapter(): PluginToolAdapter {
    return this.pluginAdapter
  }

  /**
   * Get the MCP tool adapter
   */
  getMCPAdapter(): MCPToolAdapter {
    return this.mcpAdapter
  }

  /**
   * Get executor for a tool by its ID
   */
  getExecutor(toolId: string): ((params: Record<string, unknown>, context: ToolRuntimeContext) => Promise<unknown>) | undefined {
    // Try core adapter
    const coreExecutor = this.coreAdapter.getExecutor(toolId)
    if (coreExecutor) return coreExecutor

    // Try plugin adapter
    const pluginExecutor = this.pluginAdapter.getExecutor(toolId)
    if (pluginExecutor) return pluginExecutor

    // Try MCP adapter
    const mcpExecutor = this.mcpAdapter.getMCPExecutor()
    if (mcpExecutor && toolId.startsWith('mcp_')) {
      const parts = toolId.split('_')
      if (parts.length >= 3) {
        const serverId = parts[1]
        const toolName = parts.slice(2).join('_')
        return (params, context) => mcpExecutor.execute(serverId, toolName, params, context)
      }
    }

    return undefined
  }

  /**
   * Normalize a tool result
   */
  normalizeResult(
    result: unknown,
    source: ToolSource,
    sourceId: string,
    duration: number,
    error?: { code: string; message: string; details?: Record<string, unknown> }
  ): NormalizedToolResult {
    return {
      success: !error,
      data: error ? undefined : result,
      error,
      metadata: {
        source,
        sourceId,
        duration,
        timestamp: Date.now(),
      },
    }
  }
}

// ==================== Helper Functions ====================

/**
 * Create a unified tool manager
 */
export function createUnifiedToolManager(registry: ToolRegistry): UnifiedToolManager {
  return new UnifiedToolManager(registry)
}

/**
 * Get tool source from tool ID
 */
export function getToolSource(toolId: string): ToolSource {
  if (toolId.startsWith('plugin_')) return 'plugin'
  if (toolId.startsWith('mcp_')) return 'mcp'
  return 'core'
}

/**
 * Parse a plugin tool ID
 */
export function parsePluginToolId(toolId: string): { pluginId: string; toolId: string } | undefined {
  if (!toolId.startsWith('plugin_')) return undefined

  const parts = toolId.split('_')
  if (parts.length < 3) return undefined

  return {
    pluginId: parts[1],
    toolId: parts.slice(2).join('_'),
  }
}

/**
 * Parse an MCP tool ID
 */
export function parseMCPToolId(toolId: string): { serverId: string; toolName: string } | undefined {
  if (!toolId.startsWith('mcp_')) return undefined

  const parts = toolId.split('_')
  if (parts.length < 3) return undefined

  return {
    serverId: parts[1],
    toolName: parts.slice(2).join('_'),
  }
}

/**
 * Create a full plugin tool ID
 */
export function createPluginToolId(pluginId: string, toolId: string): string {
  return `plugin_${pluginId}_${toolId}`
}

/**
 * Create a full MCP tool ID
 */
export function createMCPToolId(serverId: string, toolName: string): string {
  return `mcp_${serverId}_${toolName}`
}
