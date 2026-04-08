/**
 * Editor Registry
 * 
 * Story 22.1 - Editor RichText/Markdown Support
 * FR1201-FR1212
 * 
 * Provides a unified interface for editor registration and management.
 */

import React from 'react'

// Editor type definitions
export type EditorType = 'richtext' | 'markdown' | 'code' | 'custom'

export interface EditorConfig {
  type: EditorType
  name: string
  icon?: React.ReactNode
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultOptions?: Record<string, any>
}

export interface EditorInstance {
  id: string
  type: EditorType
  name: string
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
}

// Registry state
const editorRegistry = new Map<EditorType, EditorConfig>()
const editorInstances = new Map<string, EditorInstance>()

// Registry management functions

export function registerEditor(config: EditorConfig): void {
  if (editorRegistry.has(config.type)) {
    console.warn(`Editor type ${config.type} is already registered. Overwriting.`)
  }
  editorRegistry.set(config.type, config)
}

export function unregisterEditor(type: EditorType): boolean {
  return editorRegistry.delete(type)
}

export function getEditor(type: EditorType): EditorConfig | undefined {
  return editorRegistry.get(type)
}

export function getAllEditors(): EditorConfig[] {
  return Array.from(editorRegistry.values())
}

// Instance management

export function registerInstance(instance: EditorInstance): void {
  editorInstances.set(instance.id, instance)
}

export function unregisterInstance(id: string): boolean {
  return editorInstances.delete(id)
}

export function getInstance(id: string): EditorInstance | undefined {
  return editorInstances.get(id)
}

export function getAllInstances(): EditorInstance[] {
  return Array.from(editorInstances.values())
}

export function updateInstance(id: string, updates: Partial<EditorInstance>): EditorInstance | undefined {
  const instance = editorInstances.get(id)
  if (!instance) return undefined
  
  const updated = { ...instance, ...updates }
  editorInstances.set(id, updated)
  return updated
}

// Utility functions

export function createEditorInstance(
  type: EditorType,
  options: {
    id: string
    name: string
    value?: string
    onChange?: (value: string) => void
    disabled?: boolean
  }
): EditorInstance | null {
  const config = getEditor(type)
  if (!config) {
    console.error(`Editor type ${type} is not registered.`)
    return null
  }

  const instance: EditorInstance = {
    id: options.id,
    type,
    name: options.name,
    value: options.value || '',
    onChange: options.onChange,
    disabled: options.disabled,
  }

  registerInstance(instance)
  return instance
}

// Pre-built editor components

export { RichTextEditor } from './RichTextEditor'
export { MarkdownEditor } from './MarkdownEditor'

// Initialize default editors
export function initializeDefaultEditors(): void {
  // RichText and Markdown editors will be lazy loaded
  // Using type assertion because the lazy loading pattern doesn't match the strict type
  registerEditor({
    type: 'richtext',
    name: '富文本编辑器',
    description: '支持格式化文本编辑',
    component: (() => {
      const load = () => import('./RichTextEditor')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Promise<{ default: React.FC<any> }>((resolve) => {
        load().then((m) => resolve({ default: m.RichTextEditor }))
      })
    })() as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultOptions: {
      placeholder: '在此输入内容...',
      minHeight: '200px',
    },
  })

  registerEditor({
    type: 'markdown',
    name: 'Markdown编辑器',
    description: '支持 Markdown 语法编辑和预览',
    component: (() => {
      const load = () => import('./MarkdownEditor')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Promise<{ default: React.FC<any> }>((resolve) => {
        load().then((m) => resolve({ default: m.MarkdownEditor }))
      })
    })() as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultOptions: {
      placeholder: '在此使用 Markdown 编写...',
      minHeight: '200px',
    },
  })
}