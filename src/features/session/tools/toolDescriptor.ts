/**
 * Tool Descriptor - Unified Descriptor Model for Runtime Tools
 * Task 68: Story 45.1 - Tool Descriptor and Registry
 * 
 * This module defines the unified descriptor schema for all runtime tools
 * including core, plugin, and MCP tools.
 */

// ==================== Tool Descriptor Types ====================

/**
 * Tool category
 */
export type ToolCategory =
  | 'core'       // Built-in core tool
  | 'plugin'     // Plugin-provided tool
  | 'mcp'        // Model Context Protocol tool
  | 'builtin'    // Built-in utility tool
  | 'external'   // External API tool

/**
 * Tool execution mode
 */
export type ToolExecutionMode =
  | 'sync'       // Synchronous execution
  | 'async'      // Asynchronous execution
  | 'streaming'  // Streaming execution
  | 'batch'      // Batch execution

/**
 * Tool parameter type
 */
export type ToolParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  name: string
  type: ToolParameterType | ToolParameterType[]
  description: string
  required: boolean
  default?: unknown
  enum?: string[]
  minimum?: number
  maximum?: number
  pattern?: string
  items?: ToolParameter
  properties?: Record<string, ToolParameter>
}

/**
 * Tool return type definition
 */
export interface ToolReturnType {
  type: ToolParameterType
  description?: string
  items?: ToolReturnType
  properties?: Record<string, ToolReturnType>
}

/**
 * Tool capability flags
 */
export interface ToolCapabilities {
  supportsStreaming: boolean
  supportsCancellation: boolean
  requiresPermission: boolean
  requiresConfirmation: boolean
  isReadOnly: boolean
  hasSideEffects: boolean
  supportsRetry: boolean
  estimatedDuration?: number // in milliseconds
}

/**
 * Tool permission requirement
 */
export interface ToolPermissionRequirement {
  type: 'read' | 'write' | 'execute' | 'admin' | 'sensitive' | 'delete' | 'external' | 'file' | 'network' | 'system'
  resource: string
  description: string
  optional?: boolean
}

/**
 * Tool dependency
 */
export interface ToolDependency {
  toolId: string
  type: 'required' | 'optional'
  description?: string
}

/**
 * Tool metadata
 */
export interface ToolMetadata {
  author?: string
  version: string
  license?: string
  homepage?: string
  repository?: string
  tags: string[]
  category: string
  subcategory?: string
}

/**
 * Tool execution context requirements
 */
export interface ToolContextRequirements {
  requiresSession: boolean
  requiresUserContext: boolean
  requiresWorkspace: boolean
  requiresNetworkAccess: boolean
  requiresFileSystemAccess: boolean
  requiredEnvVars?: string[]
}

/**
 * Tool descriptor - complete tool definition
 */
export interface ToolDescriptor {
  // Identity
  id: string
  name: string
  description: string
  category: ToolCategory

  // Schema
  parameters: ToolParameter[]
  returnType?: ToolReturnType

  // Behavior
  executionMode: ToolExecutionMode
  capabilities: ToolCapabilities

  // Permissions
  permissions?: ToolPermissionRequirement[]

  // Dependencies
  dependencies?: ToolDependency[]

  // Context
  contextRequirements?: ToolContextRequirements

  // Metadata
  metadata: ToolMetadata

  // Status
  enabled: boolean
  deprecated?: boolean
  deprecationMessage?: string

  // Implementation reference
  handlerModule?: string
  handlerFunction?: string
}

// ==================== Tool Descriptor Builder ====================

/**
 * Tool descriptor builder for creating tool definitions
 */
export class ToolDescriptorBuilder {
  private descriptor: Partial<ToolDescriptor> = {}

  constructor(id: string, name: string) {
    this.descriptor.id = id
    this.descriptor.name = name
    this.descriptor.parameters = []
    this.descriptor.enabled = true
    this.descriptor.category = 'core'
    this.descriptor.executionMode = 'sync'
    this.descriptor.capabilities = {
      supportsStreaming: false,
      supportsCancellation: true,
      requiresPermission: false,
      requiresConfirmation: false,
      isReadOnly: true,
      hasSideEffects: false,
      supportsRetry: true,
    }
    this.descriptor.metadata = {
      version: '1.0.0',
      tags: [],
      category: 'general',
    }
  }

  /**
   * Set description
   */
  withDescription(description: string): this {
    this.descriptor.description = description
    return this
  }

  /**
   * Set category
   */
  withCategory(category: ToolCategory): this {
    this.descriptor.category = category
    return this
  }

  /**
   * Add parameter
   */
  withParameter(param: ToolParameter): this {
    this.descriptor.parameters!.push(param)
    return this
  }

  /**
   * Set return type
   */
  withReturnType(returnType: ToolReturnType): this {
    this.descriptor.returnType = returnType
    return this
  }

  /**
   * Set execution mode
   */
  withExecutionMode(mode: ToolExecutionMode): this {
    this.descriptor.executionMode = mode
    return this
  }

  /**
   * Set capabilities
   */
  withCapabilities(capabilities: Partial<ToolCapabilities>): this {
    this.descriptor.capabilities = {
      ...this.descriptor.capabilities!,
      ...capabilities,
    }
    return this
  }

  /**
   * Add permission requirement
   */
  withPermission(permission: ToolPermissionRequirement): this {
    if (!this.descriptor.permissions) {
      this.descriptor.permissions = []
    }
    this.descriptor.permissions.push(permission)
    return this
  }

  /**
   * Add dependency
   */
  withDependency(dependency: ToolDependency): this {
    if (!this.descriptor.dependencies) {
      this.descriptor.dependencies = []
    }
    this.descriptor.dependencies.push(dependency)
    return this
  }

  /**
   * Set context requirements
   */
  withContextRequirements(requirements: Partial<ToolContextRequirements>): this {
    this.descriptor.contextRequirements = {
      requiresSession: false,
      requiresUserContext: false,
      requiresWorkspace: false,
      requiresNetworkAccess: false,
      requiresFileSystemAccess: false,
      ...requirements,
    }
    return this
  }

  /**
   * Set metadata
   */
  withMetadata(metadata: Partial<ToolMetadata>): this {
    this.descriptor.metadata = {
      ...this.descriptor.metadata!,
      ...metadata,
    }
    return this
  }

  /**
   * Set handler reference
   */
  withHandler(module: string, func: string): this {
    this.descriptor.handlerModule = module
    this.descriptor.handlerFunction = func
    return this
  }

  /**
   * Mark as deprecated
   */
  deprecated(message: string): this {
    this.descriptor.deprecated = true
    this.descriptor.deprecationMessage = message
    return this
  }

  /**
   * Set enabled status
   */
  setEnabled(enabled: boolean): this {
    this.descriptor.enabled = enabled
    return this
  }

  /**
   * Build the descriptor
   */
  build(): ToolDescriptor {
    if (!this.descriptor.description) {
      throw new Error('Tool description is required')
    }

    return this.descriptor as ToolDescriptor
  }
}

// ==================== Factory Functions ====================

/**
 * Create a tool descriptor builder
 */
export function defineTool(id: string, name: string): ToolDescriptorBuilder {
  return new ToolDescriptorBuilder(id, name)
}

/**
 * Create a simple tool parameter
 */
export function createParameter(
  name: string,
  type: ToolParameterType,
  description: string,
  required: boolean = true,
  options?: Partial<ToolParameter>
): ToolParameter {
  return {
    name,
    type,
    description,
    required,
    ...options,
  }
}

/**
 * Create a string parameter
 */
export function stringParam(
  name: string,
  description: string,
  required: boolean = true,
  options?: Partial<ToolParameter>
): ToolParameter {
  return createParameter(name, 'string', description, required, options)
}

/**
 * Create a number parameter
 */
export function numberParam(
  name: string,
  description: string,
  required: boolean = true,
  options?: Partial<ToolParameter>
): ToolParameter {
  return createParameter(name, 'number', description, required, options)
}

/**
 * Create a boolean parameter
 */
export function booleanParam(
  name: string,
  description: string,
  required: boolean = true,
  options?: Partial<ToolParameter>
): ToolParameter {
  return createParameter(name, 'boolean', description, required, options)
}

/**
 * Create an object parameter
 */
export function objectParam(
  name: string,
  description: string,
  properties: Record<string, ToolParameter>,
  required: boolean = true,
  options?: Partial<ToolParameter>
): ToolParameter {
  return createParameter(name, 'object', description, required, {
    properties,
    ...options,
  })
}

/**
 * Create an array parameter
 */
export function arrayParam(
  name: string,
  description: string,
  items: ToolParameter,
  required: boolean = true,
  options?: Partial<ToolParameter>
): ToolParameter {
  return createParameter(name, 'array', description, required, {
    items,
    ...options,
  })
}

// ==================== Validation Helpers ====================

/**
 * Validate tool descriptor
 */
export function validateToolDescriptor(descriptor: unknown): descriptor is ToolDescriptor {
  if (typeof descriptor !== 'object' || descriptor === null) {
    return false
  }

  const d = descriptor as Partial<ToolDescriptor>

  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.description === 'string' &&
    Array.isArray(d.parameters) &&
    typeof d.category === 'string' &&
    typeof d.executionMode === 'string' &&
    typeof d.capabilities === 'object' &&
    typeof d.metadata === 'object'
  )
}

/**
 * Validate parameters against descriptor
 */
export function validateParameters(
  descriptor: ToolDescriptor,
  params: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const param of descriptor.parameters) {
    const value = params[param.name]

    // Check required
    if (param.required && value === undefined) {
      errors.push(`Missing required parameter: ${param.name}`)
      continue
    }

    // Skip if optional and not provided
    if (value === undefined) {
      continue
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value
    const expectedTypes = Array.isArray(param.type) ? param.type : [param.type]

    if (!expectedTypes.includes(actualType as ToolParameterType)) {
      errors.push(
        `Parameter ${param.name} has invalid type: expected ${expectedTypes.join('|')}, got ${actualType}`
      )
    }

    // Enum validation
    if (param.enum && typeof value === 'string' && !param.enum.includes(value)) {
      errors.push(`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`)
    }

    // Number range validation
    if (typeof value === 'number') {
      if (param.minimum !== undefined && value < param.minimum) {
        errors.push(`Parameter ${param.name} must be >= ${param.minimum}`)
      }
      if (param.maximum !== undefined && value > param.maximum) {
        errors.push(`Parameter ${param.name} must be <= ${param.maximum}`)
      }
    }

    // Pattern validation
    if (param.pattern && typeof value === 'string') {
      const regex = new RegExp(param.pattern)
      if (!regex.test(value)) {
        errors.push(`Parameter ${param.name} does not match pattern: ${param.pattern}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ==================== Utility Functions ====================

/**
 * Get tool display name
 */
export function getToolDisplayName(descriptor: ToolDescriptor): string {
  return descriptor.name
}

/**
 * Check if tool is available
 */
export function isToolAvailable(descriptor: ToolDescriptor): boolean {
  return descriptor.enabled && !descriptor.deprecated
}

/**
 * Check if tool requires confirmation
 */
export function requiresConfirmation(descriptor: ToolDescriptor): boolean {
  return descriptor.capabilities.requiresConfirmation
}

/**
 * Check if tool has side effects
 */
export function hasSideEffects(descriptor: ToolDescriptor): boolean {
  return descriptor.capabilities.hasSideEffects
}

/**
 * Get tool by capability
 */
export function getToolsByCapability(
  descriptors: ToolDescriptor[],
  capability: keyof ToolCapabilities
): ToolDescriptor[] {
  return descriptors.filter(d => d.capabilities[capability] === true)
}

/**
 * Get tools by category
 */
export function getToolsByCategory(
  descriptors: ToolDescriptor[],
  category: ToolCategory
): ToolDescriptor[] {
  return descriptors.filter(d => d.category === category)
}

/**
 * Convert descriptor to JSON schema
 */
export function descriptorToJsonSchema(descriptor: ToolDescriptor): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const param of descriptor.parameters) {
    properties[param.name] = {
      type: param.type,
      description: param.description,
      ...(param.enum && { enum: param.enum }),
      ...(param.minimum !== undefined && { minimum: param.minimum }),
      ...(param.maximum !== undefined && { maximum: param.maximum }),
      ...(param.pattern && { pattern: param.pattern }),
      ...(param.default !== undefined && { default: param.default }),
    }

    if (param.required) {
      required.push(param.name)
    }
  }

  return {
    type: 'object',
    properties,
    required,
    description: descriptor.description,
  }
}
