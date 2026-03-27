/**
 * Tool Registry - Unified Registry for Runtime Tools
 * Task 68: Story 45.1 - Tool Descriptor and Registry
 * 
 * This module provides a unified registry for all runtime tools,
 * supporting registration, lookup, and validation.
 */

import type {
  ToolDescriptor,
  ToolCategory,
  ToolCapabilities,
} from './toolDescriptor'
import { validateToolDescriptor, validateParameters, isToolAvailable } from './toolDescriptor'

// ==================== Registry Types ====================

/**
 * Tool lookup filter
 */
export interface ToolLookupFilter {
  category?: ToolCategory
  enabled?: boolean
  tags?: string[]
  capabilities?: Partial<ToolCapabilities>
  requiresPermission?: boolean
  requiresConfirmation?: boolean
  isReadOnly?: boolean
}

/**
 * Tool lookup result
 */
export interface ToolLookupResult {
  tools: ToolDescriptor[]
  total: number
  filtered: number
}

/**
 * Registry statistics
 */
export interface RegistryStatistics {
  totalTools: number
  enabledTools: number
  disabledTools: number
  deprecatedTools: number
  byCategory: Record<ToolCategory, number>
  byTag: Record<string, number>
}

/**
 * Registry change event
 */
export interface RegistryChangeEvent {
  type: 'register' | 'unregister' | 'update' | 'enable' | 'disable'
  toolId: string
  timestamp: number
}

/**
 * Registry listener
 */
export type RegistryChangeListener = (event: RegistryChangeEvent) => void

/**
 * Tool registry configuration
 */
export interface ToolRegistryConfig {
  validateOnRegister: boolean
  allowOverwrite: boolean
  maxTools: number
  onChange?: RegistryChangeListener
}

// ==================== Tool Registry ====================

/**
 * Tool Registry
 * 
 * Manages registration and lookup of all runtime tools.
 */
export class ToolRegistry {
  private tools: Map<string, ToolDescriptor> = new Map()
  private categoryIndex: Map<ToolCategory, Set<string>> = new Map()
  private tagIndex: Map<string, Set<string>> = new Map()
  private capabilityIndex: Map<keyof ToolCapabilities, Set<string>> = new Map()
  private listeners: Set<RegistryChangeListener> = new Set()
  private config: ToolRegistryConfig

  constructor(config: Partial<ToolRegistryConfig> = {}) {
    this.config = {
      validateOnRegister: config.validateOnRegister ?? true,
      allowOverwrite: config.allowOverwrite ?? false,
      maxTools: config.maxTools ?? 1000,
      onChange: config.onChange,
    }
  }

  // ==================== Registration ====================

  /**
   * Register a tool descriptor
   */
  register(descriptor: ToolDescriptor): boolean {
    // Store id for error messages
    const toolId = descriptor.id

    // Validate if configured
    if (this.config.validateOnRegister && !validateToolDescriptor(descriptor)) {
      throw new Error(`Invalid tool descriptor: ${toolId}`)
    }

    // Check for existing
    const isUpdate = this.tools.has(descriptor.id)
    if (isUpdate && !this.config.allowOverwrite) {
      return false
    }

    // Check max tools
    if (this.tools.size >= this.config.maxTools && !isUpdate) {
      throw new Error(`Maximum tools limit reached: ${this.config.maxTools}`)
    }

    // Register
    this.tools.set(descriptor.id, descriptor)

    // Update indices
    this.updateIndices(descriptor)

    // Notify listeners
    this.notifyChange({
      type: isUpdate ? 'update' : 'register',
      toolId: descriptor.id,
      timestamp: Date.now(),
    })

    return true
  }

  /**
   * Register multiple tools
   */
  registerAll(descriptors: ToolDescriptor[]): { success: number; failed: string[] } {
    const failed: string[] = []
    let success = 0

    for (const descriptor of descriptors) {
      try {
        if (this.register(descriptor)) {
          success++
        } else {
          failed.push(descriptor.id)
        }
      } catch {
        failed.push(descriptor.id)
      }
    }

    return { success, failed }
  }

  /**
   * Unregister a tool
   */
  unregister(toolId: string): boolean {
    const descriptor = this.tools.get(toolId)
    if (!descriptor) {
      return false
    }

    // Remove from main map
    this.tools.delete(toolId)

    // Remove from indices
    this.removeFromIndices(descriptor)

    // Notify listeners
    this.notifyChange({
      type: 'unregister',
      toolId,
      timestamp: Date.now(),
    })

    return true
  }

  // ==================== Lookup ====================

  /**
   * Get tool by ID
   */
  get(toolId: string): ToolDescriptor | undefined {
    return this.tools.get(toolId)
  }

  /**
   * Check if tool exists
   */
  has(toolId: string): boolean {
    return this.tools.has(toolId)
  }

  /**
   * Get all tools
   */
  getAll(): ToolDescriptor[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get available tools (enabled and not deprecated)
   */
  getAvailable(): ToolDescriptor[] {
    return this.getAll().filter(isToolAvailable)
  }

  /**
   * Lookup tools by filter
   */
  lookup(filter: ToolLookupFilter): ToolLookupResult {
    let tools = this.getAll()

    // Filter by category
    if (filter.category) {
      tools = tools.filter(t => t.category === filter.category)
    }

    // Filter by enabled status
    if (filter.enabled !== undefined) {
      tools = tools.filter(t => t.enabled === filter.enabled)
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      tools = tools.filter(t =>
        filter.tags!.some(tag => t.metadata.tags.includes(tag))
      )
    }

    // Filter by capabilities
    if (filter.capabilities) {
      tools = tools.filter(t => {
        for (const [key, value] of Object.entries(filter.capabilities!)) {
          if (t.capabilities[key as keyof ToolCapabilities] !== value) {
            return false
          }
        }
        return true
      })
    }

    // Filter by permission requirement
    if (filter.requiresPermission !== undefined) {
      tools = tools.filter(t => t.capabilities.requiresPermission === filter.requiresPermission)
    }

    // Filter by confirmation requirement
    if (filter.requiresConfirmation !== undefined) {
      tools = tools.filter(t => t.capabilities.requiresConfirmation === filter.requiresConfirmation)
    }

    // Filter by read-only
    if (filter.isReadOnly !== undefined) {
      tools = tools.filter(t => t.capabilities.isReadOnly === filter.isReadOnly)
    }

    return {
      tools,
      total: this.tools.size,
      filtered: tools.length,
    }
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): ToolDescriptor[] {
    const ids = this.categoryIndex.get(category)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.tools.get(id))
      .filter((t): t is ToolDescriptor => t !== undefined)
  }

  /**
   * Get tools by tag
   */
  getByTag(tag: string): ToolDescriptor[] {
    const ids = this.tagIndex.get(tag)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.tools.get(id))
      .filter((t): t is ToolDescriptor => t !== undefined)
  }

  /**
   * Get tools by capability
   */
  getByCapability(capability: keyof ToolCapabilities, value: boolean = true): ToolDescriptor[] {
    const ids = this.capabilityIndex.get(capability)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.tools.get(id))
      .filter((t): t is ToolDescriptor => t !== undefined && t.capabilities[capability] === value)
  }

  // ==================== Validation ====================

  /**
   * Validate parameters for a tool
   */
  validate(toolId: string, params: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const descriptor = this.tools.get(toolId)
    if (!descriptor) {
      return { valid: false, errors: [`Tool not found: ${toolId}`] }
    }

    return validateParameters(descriptor, params)
  }

  // ==================== State Management ====================

  /**
   * Enable a tool
   */
  enable(toolId: string): boolean {
    const descriptor = this.tools.get(toolId)
    if (!descriptor) return false

    descriptor.enabled = true

    this.notifyChange({
      type: 'enable',
      toolId,
      timestamp: Date.now(),
    })

    return true
  }

  /**
   * Disable a tool
   */
  disable(toolId: string): boolean {
    const descriptor = this.tools.get(toolId)
    if (!descriptor) return false

    descriptor.enabled = false

    this.notifyChange({
      type: 'disable',
      toolId,
      timestamp: Date.now(),
    })

    return true
  }

  // ==================== Statistics ====================

  /**
   * Get registry statistics
   */
  getStatistics(): RegistryStatistics {
    const stats: RegistryStatistics = {
      totalTools: this.tools.size,
      enabledTools: 0,
      disabledTools: 0,
      deprecatedTools: 0,
      byCategory: {
        core: 0,
        plugin: 0,
        mcp: 0,
        builtin: 0,
        external: 0,
      },
      byTag: {},
    }

    for (const descriptor of this.tools.values()) {
      // Count by status
      if (descriptor.enabled) {
        stats.enabledTools++
      } else {
        stats.disabledTools++
      }

      if (descriptor.deprecated) {
        stats.deprecatedTools++
      }

      // Count by category
      stats.byCategory[descriptor.category]++

      // Count by tag
      for (const tag of descriptor.metadata.tags) {
        stats.byTag[tag] = (stats.byTag[tag] ?? 0) + 1
      }
    }

    return stats
  }

  // ==================== Listeners ====================

  /**
   * Add change listener
   */
  addListener(listener: RegistryChangeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Remove change listener
   */
  removeListener(listener: RegistryChangeListener): void {
    this.listeners.delete(listener)
  }

  /**
   * Notify listeners of change
   */
  private notifyChange(event: RegistryChangeEvent): void {
    // Call config listener
    this.config.onChange?.(event)

    // Call registered listeners
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // Ignore listener errors
      }
    }
  }

  // ==================== Index Management ====================

  /**
   * Update indices for a tool
   */
  private updateIndices(descriptor: ToolDescriptor): void {
    // Category index
    if (!this.categoryIndex.has(descriptor.category)) {
      this.categoryIndex.set(descriptor.category, new Set())
    }
    this.categoryIndex.get(descriptor.category)!.add(descriptor.id)

    // Tag index
    for (const tag of descriptor.metadata.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(descriptor.id)
    }

    // Capability index
    for (const [key, value] of Object.entries(descriptor.capabilities)) {
      if (typeof value === 'boolean' && value) {
        const capabilityKey = key as keyof ToolCapabilities
        if (!this.capabilityIndex.has(capabilityKey)) {
          this.capabilityIndex.set(capabilityKey, new Set())
        }
        this.capabilityIndex.get(capabilityKey)!.add(descriptor.id)
      }
    }
  }

  /**
   * Remove tool from indices
   */
  private removeFromIndices(descriptor: ToolDescriptor): void {
    // Category index
    this.categoryIndex.get(descriptor.category)?.delete(descriptor.id)

    // Tag index
    for (const tag of descriptor.metadata.tags) {
      this.tagIndex.get(tag)?.delete(descriptor.id)
    }

    // Capability index
    for (const [key, value] of Object.entries(descriptor.capabilities)) {
      if (typeof value === 'boolean') {
        this.capabilityIndex.get(key as keyof ToolCapabilities)?.delete(descriptor.id)
      }
    }
  }

  // ==================== Utility ====================

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear()
    this.categoryIndex.clear()
    this.tagIndex.clear()
    this.capabilityIndex.clear()
  }

  /**
   * Get size
   */
  size(): number {
    return this.tools.size
  }
}

// ==================== Global Registry ====================

let globalRegistry: ToolRegistry | null = null

/**
 * Get the global tool registry
 */
export function getToolRegistry(): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry()
  }
  return globalRegistry
}

/**
 * Create a new tool registry
 */
export function createToolRegistry(config?: Partial<ToolRegistryConfig>): ToolRegistry {
  return new ToolRegistry(config)
}

// ==================== Core Tool Registration ====================

/**
 * Register core tools
 */
export async function registerCoreTools(
  registry: ToolRegistry = getToolRegistry()
): Promise<void> {
  try {
    const { listBackendTools } = await import('./backendToolClient')
    const tools = await listBackendTools()
    registry.registerAll(tools)
  } catch (error) {
    console.warn('Failed to load backend tools, leaving registry empty', error)
  }
}
