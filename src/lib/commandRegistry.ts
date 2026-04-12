/**
 * Command Registry
 * 
 * Singleton command registry for Command Palette.
 * Supports command registration, unregistration, search, and execution.
 * Plugins can register commands via this registry.
 */

import type { LucideIcon } from 'lucide-react'

export type CommandCategory = 'file' | 'edit' | 'view' | 'plugin' | 'tool' | 'settings' | 'navigation'

export interface Command {
  id: string
  label: string
  description?: string
  icon?: LucideIcon
  category: CommandCategory
  shortcut?: string
  keywords?: string[]
  action: () => void | Promise<void>
  pluginId?: string
  hidden?: boolean
}

interface CommandRegistryState {
  commands: Map<string, Command>
  listeners: Set<() => void>
}

class CommandRegistryImpl {
  private state: CommandRegistryState = {
    commands: new Map(),
    listeners: new Set(),
  }

  private static instance: CommandRegistryImpl

  private constructor() {}

  static getInstance(): CommandRegistryImpl {
    if (!CommandRegistryImpl.instance) {
      CommandRegistryImpl.instance = new CommandRegistryImpl()
    }
    return CommandRegistryImpl.instance
  }

  /**
   * Register a command
   */
  register(cmd: Command): void {
    this.state.commands.set(cmd.id, cmd)
    this.notifyListeners()
  }

  /**
   * Unregister a command
   */
  unregister(id: string): void {
    this.state.commands.delete(id)
    this.notifyListeners()
  }

  /**
   * Get a command by ID
   */
  get(id: string): Command | undefined {
    return this.state.commands.get(id)
  }

  /**
   * Get all commands
   */
  getAll(): Command[] {
    return Array.from(this.state.commands.values())
  }

  /**
   * Get commands by category
   */
  getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter(cmd => cmd.category === category)
  }

  /**
   * Search commands by query (label, description, keywords)
   */
  search(query: string): Command[] {
    if (!query.trim()) {
      return this.getAll()
    }

    const lowerQuery = query.toLowerCase()
    
    return this.getAll()
      .filter(cmd => {
        if (cmd.hidden) return false
        
        // Match label
        if (cmd.label.toLowerCase().includes(lowerQuery)) return true
        
        // Match description
        if (cmd.description?.toLowerCase().includes(lowerQuery)) return true
        
        // Match keywords
        if (cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery))) return true
        
        return false
      })
      .sort((a, b) => {
        // Prioritize exact label match
        const aLabel = a.label.toLowerCase()
        const bLabel = b.label.toLowerCase()
        
        if (aLabel.startsWith(lowerQuery) && !bLabel.startsWith(lowerQuery)) return -1
        if (bLabel.startsWith(lowerQuery) && !aLabel.startsWith(lowerQuery)) return 1
        
        // Prioritize system commands over plugin commands
        if (!a.pluginId && b.pluginId) return -1
        if (a.pluginId && !b.pluginId) return 1
        
        return 0
      })
  }

  /**
   * Execute a command by ID
   */
  async execute(id: string): Promise<void> {
    const cmd = this.get(id)
    if (!cmd) {
      console.warn(`[CommandRegistry] Command not found: ${id}`)
      return
    }

    try {
      await cmd.action()
    } catch (error) {
      console.error(`[CommandRegistry] Error executing command ${id}:`, error)
    }
  }

  /**
   * Subscribe to command changes
   */
  subscribe(listener: () => void): () => void {
    this.state.listeners.add(listener)
    return () => {
      this.state.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.state.listeners.forEach(listener => listener())
  }

  /**
   * Clear all commands (for testing)
   */
  clear(): void {
    this.state.commands.clear()
    this.notifyListeners()
  }

  /**
   * Register multiple commands at once
   */
  registerMany(commands: Command[]): void {
    commands.forEach(cmd => this.register(cmd))
  }
}

export const CommandRegistry = CommandRegistryImpl.getInstance()

/**
 * Hook-friendly command registry access
 * Use this in React components
 */
export function useCommandRegistry() {
  return CommandRegistry
}
